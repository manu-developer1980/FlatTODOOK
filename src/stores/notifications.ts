import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Notification } from '@/types'
import { supabase } from '@/lib/supabase'

interface NotificationsState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  
  // Actions
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  loadNotifications: (userId: string) => Promise<void>
  subscribeToNotifications: (userId: string) => () => void
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,

      setNotifications: (notifications) => {
        const unreadCount = notifications.filter(n => !n.is_read).length
        set({ notifications, unreadCount })
      },

      addNotification: (notification) => {
        const currentNotifications = get().notifications
        const updatedNotifications = [notification, ...currentNotifications]
        const unreadCount = get().unreadCount + (notification.is_read ? 0 : 1)
        set({ 
          notifications: updatedNotifications,
          unreadCount
        })
      },

      markAsRead: async (notificationId) => {
        try {
          const { error } = await (((supabase
            .from('notifications') as any)
            .update({ is_read: true, read_at: new Date().toISOString() } as any) as any)
            .eq('id', notificationId) as any)

          if (error) throw error

          const notifications = get().notifications.map(n => 
            n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
          )
          const unreadCount = notifications.filter(n => !n.is_read).length
          set({ notifications, unreadCount })
        } catch (error) {
          console.error('Error marking notification as read:', error)
          throw error
        }
      },

      markAllAsRead: async () => {
        try {
          const unreadIds = get().notifications
            .filter(n => !n.is_read)
            .map(n => n.id)

          if (unreadIds.length === 0) return

          const { error } = await (((supabase
            .from('notifications') as any)
            .update({ is_read: true, read_at: new Date().toISOString() } as any) as any)
            .in('id', unreadIds) as any)

          if (error) throw error

          const notifications = get().notifications.map(n => 
            ({ ...n, is_read: true, read_at: new Date().toISOString() })
          )
          set({ notifications, unreadCount: 0 })
        } catch (error) {
          console.error('Error marking all notifications as read:', error)
          throw error
        }
      },

      deleteNotification: async (notificationId) => {
        try {
          const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId)

          if (error) throw error

          const notifications = get().notifications.filter(n => n.id !== notificationId)
          const unreadCount = notifications.filter(n => !n.is_read).length
          set({ notifications, unreadCount })
        } catch (error) {
          console.error('Error deleting notification:', error)
          throw error
        }
      },

      loadNotifications: async (userId) => {
        set({ isLoading: true, error: null })
        try {
          // First get the patient ID for this user
          const { data: patient, error: patientError } = await supabase
            .from('patients')
            .select('id')
            .eq('user_id', userId)
            .single()

          if (patientError || !patient) {
            console.error('Could not find patient profile for user:', userId)
            set({ 
              notifications: [],
              unreadCount: 0,
              isLoading: false
            })
            return
          }

          const patientId = patient.id

          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false })
            .limit(50)

          if (error) throw error

          set({ 
            notifications: data || [],
            unreadCount: (data as any || []).filter((n: any) => !n.is_read).length,
            isLoading: false
          })
        } catch (error) {
          console.error('Error loading notifications:', error)
          set({ 
            error: 'Error al cargar las notificaciones',
            isLoading: false
          })
        }
      },

      subscribeToNotifications: (userId) => {
        let patientId: string | null = null
        
        // Get patient ID first
        const setupSubscription = async () => {
          const { data: patient, error: patientError } = await supabase
            .from('patients')
            .select('id')
            .eq('user_id', userId)
            .single()

          if (patientError || !patient) {
            console.error('Could not find patient profile for subscription:', userId)
            return () => {} // Return empty cleanup function
          }

          patientId = patient.id

          const subscription = supabase
            .channel(`notifications:${patientId}`)
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `patient_id=eq.${patientId}`
              },
              (payload) => {
                get().addNotification(payload.new as Notification)
              }
            )
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'notifications',
                filter: `patient_id=eq.${patientId}`
              },
              (payload) => {
                const notifications = get().notifications.map(n => 
                  n.id === payload.new.id ? payload.new as Notification : n
                )
                const unreadCount = notifications.filter(n => !n.is_read).length
                set({ notifications, unreadCount })
              }
            )
            .subscribe()

          return () => {
            subscription.unsubscribe()
          }
        }

        const cleanupPromise = setupSubscription()
        return () => {
          cleanupPromise.then(cleanup => cleanup())
        }
      }
    }),
    {
      name: 'notifications-storage',
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 10), // Only persist recent notifications
        unreadCount: state.unreadCount
      })
    }
  )
)
