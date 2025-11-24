import { apiRequest } from "@/lib/api";

export interface NotificationPreferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  medicationReminders: boolean;
  appointmentReminders: boolean;
  lowStockAlerts: boolean;
  caregiverAlerts: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
}

export class NotificationService {
  /**
   * Send a medication reminder notification (both email and push)
   */
  static async sendMedicationReminder(
    medicationName: string,
    dosage: string,
    time: string
  ): Promise<{ emailSuccess: boolean; pushSuccess: boolean }> {
    try {
      // Send email reminder
      const emailResponse = await apiRequest(
        "/notifications/email/medication-reminder",
        {
          method: "POST",
          body: JSON.stringify({
            medicationName,
            dosage,
            time,
          }),
        }
      );

      // Send push notification
      const pushResponse = await apiRequest(
        "/notifications/push/medication-reminder",
        {
          method: "POST",
          body: JSON.stringify({
            medicationName,
            dosage,
            time,
          }),
        }
      );

      return {
        emailSuccess: emailResponse.success || false,
        pushSuccess: pushResponse.success || false,
      };
    } catch (error) {
      console.error("Error sending medication reminder:", error);
      return { emailSuccess: false, pushSuccess: false };
    }
  }

  /**
   * Send an appointment reminder notification
   */
  static async sendAppointmentReminder(
    title: string,
    date: string,
    time: string,
    doctor?: string,
    location?: string
  ): Promise<{ emailSuccess: boolean; pushSuccess: boolean }> {
    try {
      const appointmentDetails = { title, date, time, doctor, location };

      // Send email reminder
      const emailResponse = await apiRequest(
        "/notifications/email/appointment-reminder",
        {
          method: "POST",
          body: JSON.stringify({ appointmentDetails }),
        }
      );

      // Send push notification
      const pushResponse = await apiRequest(
        "/notifications/push/appointment-reminder",
        {
          method: "POST",
          body: JSON.stringify({ appointmentDetails }),
        }
      );

      return {
        emailSuccess: emailResponse.success || false,
        pushSuccess: pushResponse.success || false,
      };
    } catch (error) {
      console.error("Error sending appointment reminder:", error);
      return { emailSuccess: false, pushSuccess: false };
    }
  }

  /**
   * Send a low stock alert
   */
  static async sendLowStockAlert(
    medicationName: string,
    currentStock: number
  ): Promise<{ emailSuccess: boolean; pushSuccess: boolean }> {
    try {
      // Send push notification (email might be too much for stock alerts)
      const pushResponse = await apiRequest(
        "/notifications/push/low-stock-alert",
        {
          method: "POST",
          body: JSON.stringify({
            medicationName,
            currentStock,
          }),
        }
      );

      return {
        emailSuccess: false, // Don't send email for stock alerts by default
        pushSuccess: pushResponse.success || false,
      };
    } catch (error) {
      console.error("Error sending low stock alert:", error);
      return { emailSuccess: false, pushSuccess: false };
    }
  }

  /**
   * Subscribe to push notifications
   */
  static async subscribeToPushNotifications(
    subscription: PushSubscription
  ): Promise<boolean> {
    try {
      const response = await apiRequest("/notifications/push/subscribe", {
        method: "POST",
        body: JSON.stringify({
          subscription: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.toJSON().keys?.p256dh || "",
              auth: subscription.toJSON().keys?.auth || "",
            },
          },
        }),
      });

      return response.success || false;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      return false;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  static async unsubscribeFromPushNotifications(): Promise<boolean> {
    try {
      const response = await apiRequest("/notifications/push/unsubscribe", {
        method: "POST",
      });

      return response.success || false;
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      return false;
    }
  }

  /**
   * Request notification permission from the browser
   */
  static async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return "denied";
    }

    try {
      const permission = await Notification.requestPermission();
      console.log("Notification permission:", permission);
      return permission;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return "denied";
    }
  }

  /**
   * Check if push notifications are supported
   */
  static isPushNotificationSupported(): boolean {
    return (
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    );
  }

  /**
   * Check if we're in quiet hours
   */
  static isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime =
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");

    const { start, end } = preferences.quietHours;

    // Handle cases where quiet hours span midnight
    if (start <= end) {
      return currentTime >= start && currentTime <= end;
    } else {
      return currentTime >= start || currentTime <= end;
    }
  }

  /**
   * Show a browser notification
   */
  static async showBrowserNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<void> {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return;
    }

    if (Notification.permission !== "granted") {
      console.log("Notification permission not granted");
      return;
    }

    try {
      new Notification(title, {
        icon: "/icon-192x192.png",
        badge: "/badge-72x72.png",
        ...options,
      });
    } catch (error) {
      console.error("Error showing browser notification:", error);
    }
  }

  /**
   * Test notification system
   */
  static async testNotificationSystem(
    type: "medication" | "appointment"
  ): Promise<{
    emailSuccess: boolean;
    pushSuccess: boolean;
    browserSupported: boolean;
    permission: NotificationPermission;
  }> {
    try {
      const permission = await this.requestNotificationPermission();
      const browserSupported = this.isPushNotificationSupported();

      let emailSuccess = false;
      let pushSuccess = false;

      if (type === "medication") {
        const result = await this.sendMedicationReminder(
          "Paracetamol",
          "500mg",
          "08:00 AM"
        );
        emailSuccess = result.emailSuccess;
        pushSuccess = result.pushSuccess;
      } else {
        const result = await this.sendAppointmentReminder(
          "Consulta Médica",
          "2024-01-15",
          "10:00 AM",
          "Dr. García"
        );
        emailSuccess = result.emailSuccess;
        pushSuccess = result.pushSuccess;
      }

      return {
        emailSuccess,
        pushSuccess,
        browserSupported,
        permission,
      };
    } catch (error) {
      console.error("Error testing notification system:", error);
      return {
        emailSuccess: false,
        pushSuccess: false,
        browserSupported: false,
        permission: "denied",
      };
    }
  }
}
