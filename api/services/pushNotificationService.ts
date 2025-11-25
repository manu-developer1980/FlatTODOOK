import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

export class PushNotificationService {
  private vapidKeys: {
    publicKey: string;
    privateKey: string;
  };

  constructor() {
    this.vapidKeys = {
      publicKey: process.env.VAPID_PUBLIC_KEY!,
      privateKey: process.env.VAPID_PRIVATE_KEY!
    };

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      this.vapidKeys.publicKey,
      this.vapidKeys.privateKey
    );
  }

  async saveSubscription(userId: string, subscription: PushSubscription): Promise<boolean> {
    try {
      await supabase
        .from('user_push_subscriptions')
        .delete()
        .eq('user_id', userId);

      const { error } = await supabase
        .from('user_push_subscriptions')
        .insert({
          user_id: userId,
          subscription: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
            },
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving subscription:', error);
        return false;
      }

      console.log('Push subscription saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving push subscription:', error);
      return false;
    }
  }

  async removeSubscription(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_push_subscriptions')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing subscription:', error);
        return false;
      }

      console.log('Push subscription removed successfully');
      return true;
    } catch (error) {
      console.error('Error removing push subscription:', error);
      return false;
    }
  }

  async sendNotification(userId: string, payload: NotificationPayload): Promise<boolean> {
    try {
      const { data: row, error } = await supabase
        .from('user_push_subscriptions')
        .select('subscription')
        .eq('user_id', userId)
        .single();

      if (error || !row) {
        console.error('No push subscription found for user:', error);
        return false;
      }

      const pushSubscription: PushSubscription = {
        endpoint: (row as any).subscription.endpoint,
        keys: {
          p256dh: (row as any).subscription.keys.p256dh,
          auth: (row as any).subscription.keys.auth
        }
      };

      const notificationPayload = {
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icon-192x192.png',
        badge: payload.badge || '/badge-72x72.png',
        tag: payload.tag || 'meditrack-notification',
        data: payload.data || {},
        actions: payload.actions || [],
        vibrate: [200, 100, 200],
        requireInteraction: true
      };

      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify(notificationPayload)
      );

      console.log('Push notification sent successfully');
      return true;
    } catch (error: any) {
      if (error.statusCode === 410) {
        console.log('Subscription expired, removing...');
        await this.removeSubscription(userId);
      } else {
        console.error('Error sending push notification:', error);
      }
      return false;
    }
  }

  async sendMedicationReminder(
    userId: string,
    medicationName: string,
    dosage: string,
    time: string
  ): Promise<boolean> {
    return await this.sendNotification(userId, {
      title: 'Recordatorio de Medicación 💊',
      body: `Es hora de tomar ${medicationName} (${dosage})`,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: `medication-${medicationName}-${Date.now()}`,
      data: {
        type: 'medication_reminder',
        medicationName,
        dosage,
        time,
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'taken',
          title: 'Tomado ✅'
        },
        {
          action: 'snooze',
          title: 'Posponer ⏰'
        }
      ]
    });
  }

  async sendAppointmentReminder(
    userId: string,
    appointmentDetails: {
      title: string;
      date: string;
      time: string;
      doctor?: string;
    }
  ): Promise<boolean> {
    return await this.sendNotification(userId, {
      title: 'Recordatorio de Cita 📅',
      body: `${appointmentDetails.title} - ${appointmentDetails.date} a las ${appointmentDetails.time}`,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: `appointment-${appointmentDetails.title}-${Date.now()}`,
      data: {
        type: 'appointment_reminder',
        ...appointmentDetails,
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'view',
          title: 'Ver Detalles 👁️'
        }
      ]
    });
  }

  async sendLowStockAlert(userId: string, medicationName: string, currentStock: number): Promise<boolean> {
    return await this.sendNotification(userId, {
      title: 'Alerta de Stock Bajo ⚠️',
      body: `Tu medicación ${medicationName} tiene solo ${currentStock} unidades restantes`,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: `low-stock-${medicationName}-${Date.now()}`,
      data: {
        type: 'low_stock_alert',
        medicationName,
        currentStock,
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'view',
          title: 'Ver Medicación 💊'
        }
      ]
    });
  }

  async broadcastToAllUsers(payload: NotificationPayload): Promise<{ success: number; failed: number }> {
    try {
      const { data: rows, error } = await supabase
        .from('user_push_subscriptions')
        .select('user_id, subscription');

      if (error || !rows) {
        console.error('Error fetching subscriptions:', error);
        return { success: 0, failed: 0 };
      }

      let success = 0;
      let failed = 0;

      for (const row of rows as any[]) {
        try {
          const pushSubscription: PushSubscription = {
            endpoint: row.subscription.endpoint,
            keys: {
              p256dh: row.subscription.keys.p256dh,
              auth: row.subscription.keys.auth
            }
          };

          await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
          success++;
        } catch (error: any) {
          failed++;
          if (error.statusCode === 410) {
            await this.removeSubscription(row.user_id);
          }
        }
      }

      console.log(`Broadcast completed: ${success} success, ${failed} failed`);
      return { success, failed };
    } catch (error) {
      console.error('Error broadcasting notifications:', error);
      return { success: 0, failed: 0 };
    }
  }
}
