import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'meditrack-auth-token',
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-application-name': 'meditrack'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Auth helpers
export const auth = {
  signUp: async (email: string, password: string, metadata: any) => {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
  },

  signIn: async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({
      email,
      password
    });
  },

  signInWithOAuth: async (provider: 'google' | 'apple') => {
    return supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  },

  signOut: async () => {
    return supabase.auth.signOut();
  },

  resetPassword: async (email: string) => {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });
  },

  updatePassword: async (newPassword: string) => {
    return supabase.auth.updateUser({
      password: newPassword
    });
  },

  getSession: async () => {
    return supabase.auth.getSession();
  },

  getUser: async () => {
    return supabase.auth.getUser();
  }
};

// Database helpers
export const db = {
  // Users
  getUser: async (id: string) => {
    return supabase.from('users').select('*').eq('id', id).single();
  },

  updateUser: async (id: string, data: any) => {
    return supabase.from('users').update(data).eq('id', id).select().single();
  },

  // Medications
  getMedications: async (userId: string, activeOnly = true) => {
    let query = supabase.from('medications').select('*').eq('user_id', userId);
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    return query.order('name');
  },

  getMedication: async (id: string) => {
    return supabase.from('medications').select('*').eq('id', id).single();
  },

  createMedication: async (data: any) => {
    return supabase.from('medications').insert(data).select().single();
  },

  updateMedication: async (id: string, data: any) => {
    return supabase.from('medications').update(data).eq('id', id).select().single();
  },

  deleteMedication: async (id: string) => {
    return supabase.from('medications').update({ is_active: false }).eq('id', id);
  },

  // Medication Logs
  getMedicationLogs: async (userId: string) => {
    return supabase
      .from('medication_logs')
      .select('*')
      .eq('user_id', userId)
      .order('taken_at', { ascending: false });
  },

  createMedicationLog: async (data: any) => {
    return supabase.from('medication_logs').insert(data).select().single();
  },

  // Medication Schedules
  getTodaySchedule: async (userId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return supabase
      .from('medication_schedules')
      .select(`
        *,
        medications (*)
      `)
      .eq('user_id', userId)
      .gte('scheduled_time', `${today}T00:00:00`)
      .lt('scheduled_time', `${today}T23:59:59`)
      .order('scheduled_time');
  },

  updateScheduleStatus: async (id: string, status: string, notes?: string) => {
    return supabase
      .from('medication_schedules')
      .update({ 
        status, 
        taken_at: status === 'taken' ? new Date().toISOString() : null,
        notes 
      })
      .eq('id', id)
      .select()
      .single();
  },

  // Caregivers
  getCaregivers: async (patientId: string) => {
    return supabase
      .from('caregivers')
      .select(`
        *,
        caregiver:users!caregiver_id(*)
      `)
      .eq('patient_id', patientId)
      .eq('is_active', true);
  },

  inviteCaregiver: async (patientId: string, email: string, relationship: string) => {
    return supabase.from('caregiver_invites').insert({
      patient_id: patientId,
      email,
      relationship,
      invited_at: new Date().toISOString()
    });
  },

  // Statistics
  getAdherenceStats: async (userId: string, period: 'week' | 'month' | 'year' = 'month') => {
    const startDate = new Date();
    if (period === 'week') startDate.setDate(startDate.getDate() - 7);
    if (period === 'month') startDate.setDate(startDate.getDate() - 30);
    if (period === 'year') startDate.setFullYear(startDate.getFullYear() - 1);

    return supabase
      .from('adherence_records')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date');
  },

  // Badges
  getUserBadges: async (userId: string) => {
    return supabase
      .from('user_badges')
      .select(`
        *,
        badge:badges(*)
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });
  },

  // Notifications
  getNotifications: async (userId: string, limit = 50) => {
    return supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
  },

  markNotificationAsRead: async (id: string) => {
    return supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
  }
};

// Realtime subscriptions
export const subscribeToMedicationUpdates = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('medication_updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'medication_schedules',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();
};

export const subscribeToNotifications = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();
};

// Storage helpers
export const storage = {
  uploadAvatar: async (file: File, userId: string) => {
    const fileName = `${userId}/avatar-${Date.now()}.${file.name.split('.').pop()}`;
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return publicUrl;
  },

  uploadMedicationImage: async (file: File, userId: string, medicationId: string) => {
    const fileName = `${userId}/medications/${medicationId}-${Date.now()}.${file.name.split('.').pop()}`;
    const { data, error } = await supabase.storage
      .from('medications')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('medications')
      .getPublicUrl(fileName);

    return publicUrl;
  }
};

export default supabase;

// Individual exports for convenience
export const {
  getMedications,
  getMedication,
  createMedication,
  updateMedication,
  deleteMedication,
  getMedicationLogs,
  createMedicationLog,
  getCaregivers,
  inviteCaregiver,
  getAdherenceStats,
  getUserBadges,
  getNotifications,
  markNotificationAsRead
} = db;