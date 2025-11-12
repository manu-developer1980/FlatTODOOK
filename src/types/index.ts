// Tipos principales de MediTrack

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'patient' | 'caregiver' | 'professional';
  avatar_url?: string;
  phone?: string;
  date_of_birth?: string;
  medical_conditions?: string[];
  allergies?: string[];
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  generic_name?: string;
  brand?: string;
  strength: string;
  form: 'tablet' | 'capsule' | 'liquid' | 'injection' | 'cream' | 'other';
  dosage: string;
  frequency: 'daily' | 'twice_daily' | 'three_times_daily' | 'four_times_daily' | 'weekly' | 'monthly' | 'as_needed' | 'custom';
  custom_frequency?: string;
  times_per_day: number;
  specific_times: string[];
  start_date: string;
  end_date?: string;
  duration_days?: number;
  instructions?: string;
  image_url?: string;
  color?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicationSchedule {
  id: string;
  medication_id: string;
  user_id: string;
  scheduled_time: string;
  dose_amount: string;
  status: 'pending' | 'taken' | 'missed' | 'skipped';
  taken_at?: string;
  skipped_reason?: string;
  notes?: string;
  caregiver_notified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Caregiver {
  id: string;
  patient_id: string;
  caregiver_id: string;
  relationship: 'family' | 'friend' | 'professional' | 'other';
  custom_relationship?: string;
  permissions: {
    view_medications: boolean;
    view_schedule: boolean;
    view_statistics: boolean;
    receive_notifications: boolean;
    add_comments: boolean;
    modify_medications: boolean;
  };
  is_active: boolean;
  invited_at: string;
  accepted_at?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'medication_reminder' | 'missed_medication' | 'caregiver_alert' | 'achievement' | 'subscription';
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  scheduled_for?: string;
  sent_at?: string;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'streak' | 'adherence' | 'milestones' | 'special';
  requirement: {
    type: 'consecutive_days' | 'adherence_rate' | 'total_medications' | 'caregiver_invites';
    value: number;
    time_period?: 'daily' | 'weekly' | 'monthly';
  };
  points: number;
  is_active: boolean;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  progress?: number;
}

export interface AdherenceRecord {
  id: string;
  user_id: string;
  date: string;
  total_scheduled: number;
  total_taken: number;
  total_missed: number;
  total_skipped: number;
  adherence_rate: number;
  streak_days: number;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  plan: 'free' | 'premium';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

// Tipos para formularios y UI
export interface MedicationFormData {
  name: string;
  generic_name?: string;
  brand?: string;
  strength: string;
  form: Medication['form'];
  dosage: string;
  frequency: Medication['frequency'];
  custom_frequency?: string;
  times_per_day: number;
  specific_times: string[];
  start_date: string;
  end_date?: string;
  duration_days?: number;
  instructions?: string;
  image?: File;
}

export interface UserProfileFormData {
  full_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  medical_conditions?: string[];
  allergies?: string[];
  avatar?: File;
}

// Tipos para respuestas de API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

// Tipos para estadísticas
export interface StatisticsData {
  adherence_rate: number;
  total_medications: number;
  total_scheduled: number;
  total_taken: number;
  total_missed: number;
  current_streak: number;
  longest_streak: number;
  weekly_trend: Array<{
    date: string;
    adherence_rate: number;
  }>;
  monthly_trend: Array<{
    date: string;
    adherence_rate: number;
  }>;
}

// Tipos para notificaciones push
export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

// Enums útiles
export enum NotificationType {
  MEDICATION_REMINDER = 'medication_reminder',
  MEDICATION_TAKEN = 'medication_taken',
  MISSED_MEDICATION = 'missed_medication',
  CAREGIVER_INVITATION = 'caregiver_invitation',
  BADGE_EARNED = 'badge_earned',
  STREAK_MILESTONE = 'streak_milestone'
}
export const MEDICATION_FORMS = {
  tablet: 'Tableta',
  capsule: 'Cápsula',
  liquid: 'Líquido',
  injection: 'Inyección',
  cream: 'Crema',
  other: 'Otro'
} as const;

export const NOTIFICATION_TYPES = {
  medication_reminder: 'Recordatorio de medicación',
  missed_medication: 'Medicación perdida',
  caregiver_alert: 'Alerta de cuidador',
  achievement: 'Logro conseguido',
  subscription: 'Suscripción'
} as const;

export const BADGE_CATEGORIES = {
  streak: 'Racha',
  adherence: 'Adherencia',
  milestones: 'Hitos',
  special: 'Especial'
} as const;