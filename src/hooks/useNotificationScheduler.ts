import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";
import { useNotificationsStore } from "@/stores/notifications";
import { apiRequest } from "@/lib/api";
import { hasUserId } from "@/lib/userUtils";

/**
 * Hook to schedule and manage medication notifications
 * Runs in the background to check for medication reminders
 */
export function useNotificationScheduler() {
  const { user } = useAuthStore();
  const { loadNotifications, subscribeToNotifications } =
    useNotificationsStore();

  useEffect(() => {
    if (!hasUserId(user)) return;

    let unsubscribe: () => void = () => {};

    (async () => {
      await apiRequest("/patients/ensure", { method: "POST" });
      await loadNotifications(user.id);
      unsubscribe = subscribeToNotifications(user.id);
    })();

    // Set up periodic medication reminder checks
    const checkReminders = async () => {
      try {
        // Check for due medications and send notifications
        const now = new Date();
        const currentTime = now.toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        });

        // This would typically check against scheduled medications
        // For now, we'll just log the check
        console.log(`Checking medication reminders at ${currentTime}`);
      } catch (error) {
        console.error("Error checking reminders:", error);
      }
    };

    // Check immediately on mount
    checkReminders();

    // Set up interval to check every minute
    const interval = setInterval(checkReminders, 60000); // Check every minute

    // Set up web push notifications if supported
    if ("Notification" in window && "serviceWorker" in navigator) {
      setupPushNotifications(user.id);
    }

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [user?.id, loadNotifications, subscribeToNotifications]);
}

/**
 * Set up web push notifications using service worker
 */
async function setupPushNotifications(userId: string) {
  try {
    // Request notification permission
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Notification permission denied");
      return;
    }

    // Check if we're in development (HTTP) - push notifications require HTTPS
    if (
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost"
    ) {
      console.log("Push notifications require HTTPS - skipping in development");
      return;
    }

    // Register service worker for push notifications
    const registration = await navigator.serviceWorker.register("/sw.js");
    console.log("Service Worker registered:", registration);

    // Check if pushManager is available (it might not be in some browsers/environments)
    if (!registration.pushManager) {
      console.log("Push notifications not supported in this browser");
      return;
    }

    // Check for existing subscription
    const existingSubscription =
      await registration.pushManager.getSubscription();

    if (existingSubscription) {
      console.log("Existing push subscription found");
      // Update subscription on server
      await sendSubscriptionToServer(userId, existingSubscription);
      return;
    }

    // Get VAPID public key from environment
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error("VAPID public key not configured");
      return;
    }

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    console.log("Push subscription created:", subscription);

    // Send subscription to server
    await sendSubscriptionToServer(userId, subscription);
  } catch (error) {
    console.warn(
      "Push notifications setup failed (this is normal in development):",
      error
    );
  }
}

/**
 * Convert URL-safe base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Send push subscription to server
 */
async function sendSubscriptionToServer(
  userId: string,
  subscription: PushSubscription
) {
  try {
    const response = await apiRequest("/notifications/push/subscribe", {
      method: "POST",
      body: JSON.stringify({
        userId,
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.toJSON().keys?.p256dh || "",
            auth: subscription.toJSON().keys?.auth || "",
          },
        },
      }),
    });

    if (response.success) {
      console.log("Push subscription saved successfully");
    } else {
      console.error("Failed to save push subscription");
    }
  } catch (error) {
    console.error("Error sending subscription to server:", error);
  }
}

/**
 * Hook to handle notification interactions
 */
export function useNotificationInteraction() {
  const handleNotificationClick = (notification: any) => {
    // Handle different notification types
    switch (notification.type) {
      case "medication_reminder":
        // Navigate to calendar or medication detail
        window.location.href = "/calendar";
        break;
      case "medication_taken":
        // Navigate to statistics
        window.location.href = "/statistics";
        break;
      case "missed_medication":
        // Navigate to patient dashboard (for caregivers)
        window.location.href = "/dashboard";
        break;
      case "caregiver_invitation":
        // Navigate to caregiver management
        window.location.href = "/settings";
        break;
      case "badge_earned":
        // Navigate to achievements/badges page
        window.location.href = "/statistics";
        break;
      case "streak_milestone":
        // Navigate to statistics
        window.location.href = "/statistics";
        break;
      default:
        // Default navigation
        window.location.href = "/dashboard";
    }
  };

  return { handleNotificationClick };
}
