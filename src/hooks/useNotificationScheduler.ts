import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import { NotificationService } from '@/services/notificationService'

/**
 * Hook to schedule and manage medication notifications
 * Runs in the background to check for medication reminders
 */
export function useNotificationScheduler() {
  const { user } = useAuthStore()
  const { loadNotifications, subscribeToNotifications } = useNotificationsStore()

  useEffect(() => {
    if (!user?.id) return

    // Load existing notifications
    loadNotifications(user.id)

    // Subscribe to real-time notifications
    const unsubscribe = subscribeToNotifications(user.id)

    // Set up periodic medication reminder checks
    const checkReminders = () => {
      NotificationService.checkMedicationReminders()
    }

    // Check immediately on mount
    checkReminders()

    // Set up interval to check every minute
    const interval = setInterval(checkReminders, 60000) // Check every minute

    // Set up web push notifications if supported
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setupPushNotifications()
    }

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [user?.id, loadNotifications, subscribeToNotifications])
}

/**
 * Set up web push notifications using service worker
 */
async function setupPushNotifications() {
  try {
    // Request notification permission
    const permission = await NotificationService.requestNotificationPermission()
    
    if (permission !== 'granted') {
      console.log('Notification permission denied')
      return
    }

    // Register service worker for push notifications
    const registration = await navigator.serviceWorker.register('/sw.js')
    console.log('Service Worker registered:', registration)

    // Check for existing subscription
    const existingSubscription = await registration.pushManager.getSubscription()
    
    if (existingSubscription) {
      console.log('Existing push subscription found')
      return
    }

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: getApplicationServerKey()
    })

    console.log('Push subscription created:', subscription)
    
    // Send subscription to server
    await sendSubscriptionToServer(subscription)
    
  } catch (error) {
    console.error('Error setting up push notifications:', error)
  }
}

/**
 * Get the application server key for push notifications
 * This should come from your server configuration
 */
function getApplicationServerKey(): Uint8Array {
  // This is a placeholder - in a real app, this would come from your server
  // For now, we'll return a dummy key
  const base64Key = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qJesyDKYRuBk7SS-qGQ8'
  return urlBase64ToUint8Array(base64Key)
}

/**
 * Convert URL-safe base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Send push subscription to server
 */
async function sendSubscriptionToServer(subscription: PushSubscription) {
  try {
    const { supabase } = await import('@/lib/supabase')
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('user_push_subscriptions')
      .upsert({
        user_id: user.id,
        subscription: JSON.stringify(subscription),
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error saving push subscription:', error)
    } else {
      console.log('Push subscription saved successfully')
    }
  } catch (error) {
    console.error('Error sending subscription to server:', error)
  }
}

/**
 * Hook to handle notification interactions
 */
export function useNotificationInteraction() {
  const handleNotificationClick = (notification: any) => {
    // Handle different notification types
    switch (notification.type) {
      case 'medication_reminder':
        // Navigate to calendar or medication detail
        window.location.href = '/calendar'
        break
      case 'medication_taken':
        // Navigate to statistics
        window.location.href = '/statistics'
        break
      case 'missed_medication':
        // Navigate to patient dashboard (for caregivers)
        window.location.href = '/dashboard'
        break
      case 'caregiver_invitation':
        // Navigate to caregiver management
        window.location.href = '/settings'
        break
      case 'badge_earned':
        // Navigate to achievements/badges page
        window.location.href = '/statistics'
        break
      case 'streak_milestone':
        // Navigate to statistics
        window.location.href = '/statistics'
        break
      default:
        // Default navigation
        window.location.href = '/dashboard'
    }
  }

  return { handleNotificationClick }
}