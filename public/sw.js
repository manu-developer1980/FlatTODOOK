// Service Worker for MediTrack Push Notifications
const CACHE_NAME = "meditrack-v1";
const urlsToCache = ["/", "/static/js/bundle.js", "/static/css/main.css"];

// Install event - cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request);
    })
  );
});

// Push notification event
self.addEventListener("push", (event) => {
  console.log("Push event received:", event);

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    console.error("Error parsing push data:", error);
  }

  // Handle different notification types with specific settings
  const notificationType = data.type || "general";
  let options = {
    body: data.body || "Tienes una nueva notificación de MediTrack",
    icon: data.icon || "/icon-192x192.png",
    badge: data.badge || "/badge-72x72.png",
    vibrate: [200, 100, 200],
    tag: data.tag || `meditrack-${notificationType}-${Date.now()}`,
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: true,
    silent: false,
    renotify: true,
    ...data.options,
  };

  // Customize based on notification type
  switch (notificationType) {
    case "medication_reminder":
      options = {
        ...options,
        vibrate: [300, 100, 300, 100, 300],
        actions: data.actions || [
          { action: "taken", title: "Tomado ✅" },
          { action: "snooze", title: "Posponer ⏰" },
        ],
      };
      break;
    case "appointment_reminder":
      options = {
        ...options,
        vibrate: [200, 100, 200],
        actions: data.actions || [{ action: "view", title: "Ver Detalles 👁️" }],
      };
      break;
    case "low_stock_alert":
      options = {
        ...options,
        vibrate: [400, 200, 400],
        actions: data.actions || [
          { action: "view", title: "Ver Medicación 💊" },
        ],
      };
      break;
    case "caregiver_alert":
      options = {
        ...options,
        vibrate: [500, 100, 500],
        actions: data.actions || [
          { action: "view", title: "Ver Dashboard 📊" },
        ],
      };
      break;
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "MediTrack", options)
  );
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event);

  event.notification.close();

  // Handle notification actions
  const action = event.action;
  const notificationData = event.notification.data;
  let urlToOpen = "/";

  // Handle action button clicks
  if (action) {
    switch (action) {
      case "taken":
        // Mark medication as taken
        console.log("Medication marked as taken");
        // Here you would typically make an API call to mark the medication as taken
        urlToOpen = "/medications";
        break;
      case "snooze":
        // Snooze the notification
        console.log("Notification snoozed");
        // Here you would typically schedule a new notification
        break;
      case "view":
        // Navigate to the relevant page based on notification type
        if (notificationData && notificationData.type) {
          switch (notificationData.type) {
            case "medication_reminder":
              urlToOpen = "/medications";
              break;
            case "appointment_reminder":
              urlToOpen = "/calendar";
              break;
            case "low_stock_alert":
              urlToOpen = "/medications";
              break;
            case "caregiver_alert":
              urlToOpen = "/dashboard";
              break;
            default:
              urlToOpen = "/dashboard";
          }
        }
        break;
      default:
        console.log("Unknown action:", action);
    }
  } else {
    // Handle main notification click based on type
    if (notificationData && notificationData.type) {
      switch (notificationData.type) {
        case "medication_reminder":
          urlToOpen = "/medications";
          break;
        case "appointment_reminder":
          urlToOpen = "/calendar";
          break;
        case "medication_taken":
          urlToOpen = "/statistics";
          break;
        case "missed_medication":
          urlToOpen = "/dashboard";
          break;
        case "low_stock_alert":
          urlToOpen = "/medications";
          break;
        case "caregiver_invitation":
          urlToOpen = "/settings";
          break;
        case "badge_earned":
        case "streak_milestone":
          urlToOpen = "/statistics";
          break;
        case "caregiver_alert":
          urlToOpen = "/dashboard";
          break;
        default:
          urlToOpen = "/dashboard";
      }
    }
  }

  event.waitUntil(clients.openWindow(urlToOpen));
});

// Background sync for offline functionality
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-medication-logs") {
    event.waitUntil(syncMedicationLogs());
  }
});

// Sync medication logs when back online
async function syncMedicationLogs() {
  try {
    // Get cached medication logs
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match("/api/medication-logs/pending");

    if (!response) {
      console.log("No pending medication logs to sync");
      return;
    }

    const pendingLogs = await response.json();

    if (pendingLogs.length === 0) {
      console.log("No pending medication logs to sync");
      return;
    }

    console.log("Syncing", pendingLogs.length, "pending medication logs");

    // Send each log to the server
    for (const log of pendingLogs) {
      try {
        await fetch("/api/medication-logs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(log),
        });
      } catch (error) {
        console.error("Error syncing medication log:", error);
      }
    }

    // Clear cached logs after successful sync
    await cache.delete("/api/medication-logs/pending");

    console.log("Medication logs synced successfully");
  } catch (error) {
    console.error("Error syncing medication logs:", error);
  }
}

// Periodic background sync for medication reminders
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "check-medication-reminders") {
    event.waitUntil(checkMedicationReminders());
  }
});

// Check for medication reminders in the background
async function checkMedicationReminders() {
  try {
    console.log("Checking medication reminders in background");

    // This would typically make an API call to check for reminders
    // For now, we'll just log that the check happened
    // In a real implementation, you would call your notification service

    console.log("Background medication reminder check completed");
  } catch (error) {
    console.error("Error checking medication reminders:", error);
  }
}
