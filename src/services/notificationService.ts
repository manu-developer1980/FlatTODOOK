import { supabase } from '@/lib/supabase'
import { NotificationType, Notification, MedicationSchedule, User } from '@/types'

export class NotificationService {
  /**
   * Create a medication reminder notification
   */
  static async createMedicationReminder(
    userId: string,
    medicationName: string,
    dosage: string,
    scheduleId: string
  ): Promise<Notification> {
    const notification: Omit<Notification, 'id' | 'created_at' | 'read_at'> = {
      user_id: userId,
      type: NotificationType.MEDICATION_REMINDER,
      title: '⏰ Recordatorio de medicación',
      message: `Es hora de tomar ${medicationName} (${dosage})`,
      is_read: false,
      metadata: {
        schedule_id: scheduleId,
        medication_name: medicationName,
        dosage
      }
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Create a medication taken confirmation notification
   */
  static async createMedicationTakenNotification(
    userId: string,
    medicationName: string,
    dosage: string
  ): Promise<Notification> {
    const notification: Omit<Notification, 'id' | 'created_at' | 'read_at'> = {
      user_id: userId,
      type: NotificationType.MEDICATION_TAKEN,
      title: '✅ Medicación tomada',
      message: `Has confirmado la toma de ${medicationName} (${dosage})`,
      is_read: false,
      metadata: {
        medication_name: medicationName,
        dosage
      }
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Create a missed medication notification for caregivers
   */
  static async createMissedMedicationNotification(
    userId: string,
    caregiverId: string,
    medicationName: string,
    dosage: string,
    scheduledTime: string
  ): Promise<Notification> {
    const notification: Omit<Notification, 'id' | 'created_at' | 'read_at'> = {
      user_id: caregiverId,
      type: NotificationType.MISSED_MEDICATION,
      title: '⚠️ Medicación no tomada',
      message: `El paciente no ha tomado ${medicationName} (${dosage}) programado para ${scheduledTime}`,
      is_read: false,
      metadata: {
        patient_id: userId,
        medication_name: medicationName,
        dosage,
        scheduled_time: scheduledTime
      }
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Create a caregiver invitation notification
   */
  static async createCaregiverInvitationNotification(
    userId: string,
    patientName: string,
    patientEmail: string
  ): Promise<Notification> {
    const notification: Omit<Notification, 'id' | 'created_at' | 'read_at'> = {
      user_id: userId,
      type: NotificationType.CAREGIVER_INVITATION,
      title: '👥 Invitación de cuidador',
      message: `${patientName} (${patientEmail}) te ha invitado a ser su cuidador`,
      is_read: false,
      metadata: {
        patient_name: patientName,
        patient_email: patientEmail
      }
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Create a badge earned notification
   */
  static async createBadgeEarnedNotification(
    userId: string,
    badgeName: string,
    badgeDescription: string,
    badgeIcon: string
  ): Promise<Notification> {
    const notification: Omit<Notification, 'id' | 'created_at' | 'read_at'> = {
      user_id: userId,
      type: NotificationType.BADGE_EARNED,
      title: '🏅 ¡Nueva insignia obtenida!',
      message: `Has ganado la insignia "${badgeName}": ${badgeDescription}`,
      is_read: false,
      metadata: {
        badge_name: badgeName,
        badge_description: badgeDescription,
        badge_icon: badgeIcon
      }
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Create a streak milestone notification
   */
  static async createStreakMilestoneNotification(
    userId: string,
    streakDays: number
  ): Promise<Notification> {
    const notification: Omit<Notification, 'id' | 'created_at' | 'read_at'> = {
      user_id: userId,
      type: NotificationType.STREAK_MILESTONE,
      title: '🔥 ¡Racha de cumplimiento!',
      message: `Llevas ${streakDays} días seguidos tomando tu medicación correctamente`,
      is_read: false,
      metadata: {
        streak_days: streakDays
      }
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Check and send medication reminders
   */
  static async checkMedicationReminders(): Promise<void> {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
    const currentDay = now.getDay()

    try {
      // Get all active medication schedules for current time
      const { data: schedules, error } = await supabase
        .from('medication_schedules')
        .select(`
          *,
          medication:medications(
            id,
            name,
            dosage,
            user_id
          )
        `)
        .eq('is_active', true)
        .eq('time', currentTime)

      if (error) throw error
      if (!schedules || schedules.length === 0) return

      // Check each schedule
      for (const schedule of schedules) {
        const medication = schedule.medication as any
        const userId = medication.user_id
        
        // Check if this medication should be taken today based on frequency
        const shouldTakeToday = this.shouldTakeMedicationToday(schedule, currentDay)
        if (!shouldTakeToday) continue

        // Check if medication was already taken today
        const alreadyTaken = await this.wasMedicationTakenToday(medication.id, userId, now)
        if (alreadyTaken) continue

        // Create reminder notification
        await this.createMedicationReminder(
          userId,
          medication.name,
          medication.dosage,
          schedule.id
        )

        // Schedule caregiver notification if medication not taken within 30 minutes
        setTimeout(async () => {
          const stillNotTaken = await this.wasMedicationTakenToday(medication.id, userId, new Date())
          if (!stillNotTaken) {
            // Get caregivers for this user
            const { data: caregivers } = await supabase
              .from('caregivers')
              .select('caregiver_id')
              .eq('patient_id', userId)
              .eq('is_active', true)

            if (caregivers && caregivers.length > 0) {
              for (const caregiver of caregivers) {
                await this.createMissedMedicationNotification(
                  userId,
                  caregiver.caregiver_id,
                  medication.name,
                  medication.dosage,
                  currentTime
                )
              }
            }
          }
        }, 30 * 60 * 1000) // 30 minutes
      }
    } catch (error) {
      console.error('Error checking medication reminders:', error)
    }
  }

  /**
   * Check if medication should be taken today based on frequency
   */
  private static shouldTakeMedicationToday(schedule: any, currentDay: number): boolean {
    const frequency = schedule.frequency_type
    
    switch (frequency) {
      case 'daily':
        return true
      
      case 'weekly':
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        const scheduledDays = schedule.days_of_week || []
        return scheduledDays.includes(dayNames[currentDay])
      
      case 'monthly':
        const currentDate = new Date().getDate()
        return schedule.day_of_month === currentDate
      
      case 'custom':
        const customDays = schedule.custom_days || []
        return customDays.includes(new Date().toISOString().split('T')[0])
      
      default:
        return false
    }
  }

  /**
   * Check if medication was already taken today
   */
  private static async wasMedicationTakenToday(
    medicationId: string,
    userId: string,
    date: Date
  ): Promise<boolean> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)

    const { data, error } = await supabase
      .from('medication_logs')
      .select('id')
      .eq('medication_id', medicationId)
      .eq('user_id', userId)
      .gte('taken_at', startOfDay.toISOString())
      .lt('taken_at', endOfDay.toISOString())
      .limit(1)

    if (error) {
      console.error('Error checking medication logs:', error)
      return false
    }

    return data && data.length > 0
  }

  /**
   * Request notification permission for web push notifications
   */
  static async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied'
    }

    return await Notification.requestPermission()
  }

  /**
   * Show a browser notification
   */
  static showBrowserNotification(title: string, options: NotificationOptions): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/meditrack-icon.svg',
        badge: '/meditrack-badge.svg',
        ...options
      })
    }
  }
}