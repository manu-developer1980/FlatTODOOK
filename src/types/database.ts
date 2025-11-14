// Comprehensive database types for MediTrack
// Based on the technical architecture document and new database schema

// Enums matching database enums
export type UserRole = 'patient' | 'caregiver' | 'professional';
export type MedicationFrequency = 'daily' | 'twice_daily' | 'three_times_daily' | 'four_times_daily' | 'every_4_hours' | 'every_6_hours' | 'every_8_hours' | 'every_12_hours' | 'weekly' | 'monthly' | 'as_needed';
export type MedicationForm = 'tablet' | 'capsule' | 'liquid' | 'injection' | 'cream' | 'ointment' | 'inhaler' | 'drops' | 'patch' | 'suppository';
export type DosageUnit = 'mg' | 'g' | 'ml' | 'iu' | 'mcg' | 'drops' | 'puffs' | 'units';
export type IntakeStatus = 'pending' | 'taken' | 'missed' | 'skipped';
export type AppointmentStatus = 'scheduled' | 'completed' | 'canceled' | 'no_show';
export type NotificationType = 'medication_reminder' | 'appointment_reminder' | 'refill_reminder' | 'system_alert';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid';
export type SubscriptionPlan = 'free' | 'premium';

// Base interface for database records
export interface BaseRecord {
  id: string;
  created_at: string;
  updated_at: string;
}

// Patient record - represents the patient's profile
export interface Patient extends BaseRecord {
  user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  phone_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  medical_conditions: string[] | null;
  allergies: string[] | null;
  preferred_language: string;
  timezone: string;
  profile_completed: boolean;
}

// Medication record - represents a medication prescription
export interface Medication extends BaseRecord {
  patient_id: string;
  generic_name: string;
  brand: string | null;
  strength: string | null;
  form: MedicationForm;
  dosage: string;
  frequency: MedicationFrequency;
  specific_times: string[] | null; // Array of time strings (HH:MM)
  start_date: string;
  end_date: string | null;
  instructions: string | null;
  prescribed_by: string | null;
  pharmacy_name: string | null;
  pharmacy_phone: string | null;
  refill_quantity: number | null;
  refill_remaining: number | null;
  is_active: boolean;
}

// Dosage schedule - represents scheduled doses for medications
export interface DosageSchedule extends BaseRecord {
  medication_id: string;
  scheduled_time: string; // ISO timestamp
  dose_amount: string;
  is_taken: boolean;
  notes: string | null;
}

// Intake log - represents actual medication intake events
export interface IntakeLog extends BaseRecord {
  medication_id: string;
  scheduled_time: string | null; // ISO timestamp
  taken_at: string; // ISO timestamp
  status: IntakeStatus;
  dose_amount: string | null;
  notes: string | null;
  side_effects: string[] | null;
}

// Appointment - represents medical appointments
export interface Appointment extends BaseRecord {
  patient_id: string;
  title: string;
  description: string | null;
  appointment_date: string;
  appointment_time: string; // HH:MM format
  duration_minutes: number;
  location: string | null;
  provider_name: string | null;
  provider_phone: string | null;
  appointment_type: string | null;
  status: AppointmentStatus;
  reminder_set: boolean;
  reminder_minutes_before: number;
}

// Notification - represents system notifications
export interface Notification extends BaseRecord {
  patient_id: string;
  type: NotificationType;
  title: string;
  message: string;
  related_id: string | null;
  scheduled_for: string | null; // ISO timestamp
  sent_at: string | null; // ISO timestamp
  read_at: string | null; // ISO timestamp
  is_read: boolean;
}

// Badge - represents achievement badges
export interface Badge extends BaseRecord {
  name: string;
  description: string;
  icon: string;
  criteria: string;
  points_required: number;
}

// User badge - represents earned badges by users
export interface UserBadge extends BaseRecord {
  user_id: string;
  badge_id: string;
  earned_at: string;
  points_at_earning: number;
}

// User stats - represents user statistics and progress
export interface UserStats extends BaseRecord {
  user_id: string;
  total_medications: number;
  active_medications: number;
  total_intakes: number;
  successful_intakes: number;
  missed_intakes: number;
  adherence_rate: number;
  current_streak: number;
  longest_streak: number;
  total_points: number;
  last_activity_at: string | null; // ISO timestamp
}

// Audit log - represents system audit trail
export interface AuditLog extends BaseRecord {
  user_id: string | null;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values: any | null;
  new_values: any | null;
  ip_address: string | null;
  user_agent: string | null;
}

// Subscription - represents user subscription status
export interface Subscription extends BaseRecord {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  current_period_start: string; // ISO timestamp
  current_period_end: string; // ISO timestamp
  cancel_at_period_end: boolean;
}

// Auth user - extends Supabase user with additional properties
export interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    phone?: string;
    date_of_birth?: string;
    role?: UserRole;
  };
  app_metadata: {
    provider?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

// User profile for auth store
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_premium: boolean;
  avatar_url: string | null;
  phone: string | null;
  date_of_birth: string | null;
  emergency_contact: string | null;
  caregiver_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Form data types for UI components
export interface PatientFormData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  phone_number: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_conditions: string[];
  allergies: string[];
  preferred_language: string;
  timezone: string;
}

export interface MedicationFormData {
  generic_name: string;
  brand: string;
  strength: string;
  form: MedicationForm;
  dosage: string;
  frequency: MedicationFrequency;
  specific_times: string[];
  start_date: string;
  end_date: string;
  instructions: string;
  prescribed_by: string;
  pharmacy_name: string;
  pharmacy_phone: string;
  refill_quantity: number;
  refill_remaining: number;
}

export interface AppointmentFormData {
  title: string;
  description: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  location: string;
  provider_name: string;
  provider_phone: string;
  appointment_type: string;
  reminder_set: boolean;
  reminder_minutes_before: number;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

// Statistics and analytics types
export interface AdherenceStatistics {
  adherence_rate: number;
  total_medications: number;
  active_medications: number;
  total_scheduled: number;
  total_taken: number;
  total_missed: number;
  total_skipped: number;
  current_streak: number;
  longest_streak: number;
  weekly_trend: Array<{
    date: string;
    adherence_rate: number;
    total_scheduled: number;
    total_taken: number;
  }>;
  monthly_trend: Array<{
    date: string;
    adherence_rate: number;
    total_scheduled: number;
    total_taken: number;
  }>;
}

export interface MedicationAdherence {
  medication: Medication;
  adherence_rate: number;
  total_scheduled: number;
  total_taken: number;
  total_missed: number;
  total_skipped: number;
  last_taken: string | null;
  next_dose: string | null;
}

// Notification and reminder types
export interface NotificationSettings {
  medication_reminders: boolean;
  appointment_reminders: boolean;
  refill_reminders: boolean;
  system_alerts: boolean;
  reminder_time_before: number; // minutes
  quiet_hours_start: string | null; // HH:MM format
  quiet_hours_end: string | null; // HH:MM format
}

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

// Calendar and scheduling types
export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'medication' | 'appointment' | 'refill';
  status: 'pending' | 'completed' | 'missed' | 'skipped';
  related_id: string;
  color: string;
  description?: string;
}

// Search and filter types
export interface MedicationFilter {
  is_active?: boolean;
  form?: MedicationForm;
  frequency?: MedicationFrequency;
  search_term?: string;
  date_range?: {
    start: string;
    end: string;
  };
}

export interface IntakeLogFilter {
  medication_id?: string;
  status?: IntakeStatus;
  date_range?: {
    start: string;
    end: string;
  };
}

// Error types
export interface AppError {
  message: string;
  code?: string;
  details?: any;
  timestamp: string;
  context?: string;
}

// Utility types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type SortDirection = 'asc' | 'desc';

export interface PaginationOptions {
  page: number;
  limit: number;
  sort_by?: string;
  sort_direction?: SortDirection;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Constants for UI
export const MEDICATION_FORMS: Record<MedicationForm, string> = {
  tablet: 'Tableta',
  capsule: 'Cápsula',
  liquid: 'Líquido',
  injection: 'Inyección',
  cream: 'Crema',
  ointment: 'Pomada',
  inhaler: 'Inhalador',
  drops: 'Gotas',
  patch: 'Parche',
  suppository: 'Supositorio'
};

export const MEDICATION_FREQUENCIES: Record<MedicationFrequency, string> = {
  daily: 'Una vez al día',
  twice_daily: 'Dos veces al día',
  three_times_daily: 'Tres veces al día',
  four_times_daily: 'Cuatro veces al día',
  every_4_hours: 'Cada 4 horas',
  every_6_hours: 'Cada 6 horas',
  every_8_hours: 'Cada 8 horas',
  every_12_hours: 'Cada 12 horas',
  weekly: 'Semanalmente',
  monthly: 'Mensualmente',
  as_needed: 'Cuando sea necesario'
};

export const INTAKE_STATUS_LABELS: Record<IntakeStatus, string> = {
  pending: 'Pendiente',
  taken: 'Tomado',
  missed: 'Perdido',
  skipped: 'Omitido'
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Programada',
  completed: 'Completada',
  canceled: 'Cancelada',
  no_show: 'No asistió'
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  medication_reminder: 'Recordatorio de medicación',
  appointment_reminder: 'Recordatorio de cita',
  refill_reminder: 'Recordatorio de recarga',
  system_alert: 'Alerta del sistema'
};

// Database type for Supabase client
export interface Database {
  public: {
    Tables: {
      patients: Patient;
      medications: Medication;
      dosage_schedules: DosageSchedule;
      intake_logs: IntakeLog;
      appointments: Appointment;
      notifications: Notification;
      badges: Badge;
      user_badges: UserBadge;
      user_stats: UserStats;
      audit_logs: AuditLog;
      subscriptions: Subscription;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}