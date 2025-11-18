import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/database";
import {
  UserProfile,
  Medication,
  IntakeLog,
  DosageSchedule,
  Notification,
} from "../types/database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: "meditrack-auth-token",
    flowType: "pkce",
  },
  global: {
    headers: {
      "x-application-name": "meditrack",
    },
  },
  db: {
    schema: "public",
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Auth helpers
export const auth = {
  signUp: async (email: string, password: string, metadata: any) => {
    console.log(
      "Starting signup process for email:",
      email,
      "with metadata:",
      metadata
    );

    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    console.log("Signup result:", result);

    // Don't create patient profile here - wait for email confirmation
    // The patient profile will be created when user first logs in
    if (result.data.user && !result.error) {
      console.log(
        "Signup successful, patient profile will be created on first login for user:",
        result.data.user.id
      );
    }

    return result;
  },

  signIn: async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  signInWithOAuth: async (provider: "google" | "apple") => {
    return supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  },

  signOut: async () => {
    return supabase.auth.signOut();
  },

  resetPassword: async (email: string) => {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
  },

  updatePassword: async (newPassword: string) => {
    return supabase.auth.updateUser({
      password: newPassword,
    });
  },

  getSession: async () => {
    return supabase.auth.getSession();
  },

  getUser: async () => {
    return supabase.auth.getUser();
  },
};

// Database helpers
export const db = {
  // Users - Get patient profile linked to auth user
  getUser: async (userId: string) => {
    console.log("Getting user profile for userId:", userId);

    // Check if user is authenticated
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    console.log("Current session:", session);
    console.log("Session error:", sessionError);

    if (sessionError || !session) {
      console.error("No valid session found");
      return { data: null, error: { message: "No authenticated session" } };
    }

    console.log("Making request to patients table with user_id:", userId);
    const result = await supabase
      .from("patients")
      .select("*")
      .eq("user_id", userId)
      .single();
    console.log("Patients query result:", result);

    // If patient profile doesn't exist, create it
    if (result.error && result.error.code === "PGRST116") {
      console.log(
        "Patient profile not found, creating new profile for user:",
        userId
      );

      // Get user metadata from auth
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("Could not get user metadata:", userError);
        return {
          data: null,
          error: { message: "Could not get user information" },
        };
      }

      console.log("Creating patient profile directly");

      // Create patient profile directly
      const patientData = {
        user_id: userId,
        first_name:
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "Usuario",
        last_name: "",
        date_of_birth: "1990-01-01", // Default date since field is required
        gender: null,
        phone_number: null,
        emergency_contact_name: null,
        emergency_contact_phone: null,
        medical_conditions: null,
        allergies: null,
        preferred_language: "es",
        timezone: "Europe/Madrid",
        profile_completed: false,
      };

      console.log("Creating patient profile with data:", patientData);
      const { data: newPatient, error: insertError } = await supabase
        .from("patients")
        .insert(patientData as any)
        .select()
        .single();

      if (insertError) {
        console.error("Error creating patient profile:", insertError);
        return { data: null, error: insertError };
      }

      console.log("Patient profile created successfully:", newPatient);

      // Create initial user stats
      try {
        const statsData = {
          user_id: userId,
          total_medications: 0,
          active_medications: 0,
          total_intakes: 0,
          successful_intakes: 0,
          missed_intakes: 0,
          adherence_rate: 0.0,
          current_streak: 0,
          longest_streak: 0,
          total_points: 0,
          last_activity_at: new Date().toISOString(),
        };

        await supabase.from("user_stats").insert(statsData as any);
        console.log("User stats created successfully");
      } catch (statsError) {
        console.error("Error creating user stats:", statsError);
        // Continue even if stats creation fails
      }

      // Award welcome badge
      try {
        const { data: welcomeBadge } = await supabase
          .from("badges")
          .select("id")
          .eq("name", "welcome")
          .single();

        if (welcomeBadge && (welcomeBadge as any).id) {
          await supabase.from("user_badges").insert({
            user_id: userId,
            badge_id: (welcomeBadge as any).id,
            earned_at: new Date().toISOString(),
            points_at_earning: 0,
          } as any);
          console.log("Welcome badge awarded successfully");
        }
      } catch (badgeError) {
        console.error("Error awarding welcome badge:", badgeError);
        // Continue even if badge creation fails
      }

      return { data: newPatient, error: null };
    }

    return result;
  },

  updateUser: async (userId: string, data: any) => {
    return (supabase.from("patients") as any)
      .update(data)
      .eq("user_id", userId)
      .select()
      .single();
  },

  // Medications - Get medications through patient relationship
  getMedications: async (userId: string, activeOnly = true) => {
    // First get the patient ID for this user
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (patientError || !patient) {
      return { data: [], error: patientError };
    }

    const patientId = (patient as any).id;
    let query = supabase
      .from("medications")
      .select("*")
      .eq("patient_id", patientId);
    if (activeOnly) {
      query = query.eq("is_active", true);
    }
    return query.order("generic_name");
  },

  getMedication: async (id: string) => {
    return supabase.from("medications").select("*").eq("id", id).single();
  },

  createMedication: async (userId: string, data: any) => {
    // First get the patient ID for this user
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (patientError || !patient) {
      throw new Error("Patient profile not found");
    }

    const patientId = (patient as any).id;
    const inserted = await supabase
      .from("medications")
      .insert({
        ...data,
        patient_id: patientId,
      })
      .select()
      .single();

    const med = (inserted as any).data;
    if (
      med &&
      Array.isArray(med.specific_times) &&
      med.specific_times.length > 0
    ) {
      const start = med.start_date ? new Date(med.start_date) : new Date();
      const end = med.end_date
        ? new Date(med.end_date)
        : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

      const items: any[] = [];
      const dayMs = 24 * 60 * 60 * 1000;
      for (let t = start.getTime(); t <= end.getTime(); t += dayMs) {
        const day = new Date(t);
        med.specific_times.forEach((time: string) => {
          const parts = (time || "").split(":");
          const h = parseInt(parts[0] || "0", 10);
          const m2 = parseInt(parts[1] || "0", 10);
          const s2 = parseInt(parts[2] || "0", 10);
          const when = new Date(day);
          when.setHours(h, m2, s2, 0);
          items.push({
            medication_id: med.id,
            scheduled_time: when.toISOString(),
            dose_amount: med.dosage,
            is_taken: false,
          });
        });
      }

      if (items.length > 0) {
        await (supabase.from("dosage_schedules") as any).upsert(
          items as any,
          { onConflict: "medication_id,scheduled_time" } as any
        );
      }
    }

    return inserted;
  },

  updateMedication: async (id: string, data: any) => {
    return (supabase.from("medications") as any)
      .update(data)
      .eq("id", id)
      .select()
      .single();
  },

  deleteMedication: async (id: string) => {
    return (supabase.from("medications") as any)
      .update({ is_active: false })
      .eq("id", id);
  },

  // Intake Logs - Get through medication -> patient relationship
  getIntakeLogs: async (userId: string) => {
    // Get patient ID first
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", userId)
      .single();

    console.log("getIntakeLogs - patient lookup:", {
      userId,
      patient,
      patientError,
    });

    if (patientError || !patient) {
      return { data: [], error: patientError };
    }

    const patientId = (patient as any).id;
    console.log("getIntakeLogs - patientId:", patientId);

    const result = await supabase
      .from("intake_logs")
      .select(
        `
        *,
        medications!inner(*)
      `
      )
      .eq("medications.patient_id", patientId)
      .order("taken_at", { ascending: false });

    console.log("getIntakeLogs - query result:", result);
    return result;
  },

  getIntakeLogForMedicationAtTime: async (
    medicationId: string,
    scheduledIso: string
  ) => {
    const result = await supabase
      .from("intake_logs")
      .select("id")
      .eq("medication_id", medicationId)
      .eq("scheduled_time", scheduledIso)
      .eq("status", "taken")
      .limit(1);
    return result;
  },

  createIntakeLog: async (medicationId: string, data: any) => {
    return supabase
      .from("intake_logs")
      .insert({
        medication_id: medicationId,
        ...data,
      })
      .select()
      .single();
  },

  // Dosage Schedules - Get through medication -> patient relationship
  getTodaySchedule: async (userId: string) => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    // Get patient ID first
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (patientError || !patient) {
      return { data: [], error: patientError };
    }

    const patientId = (patient as any).id;
    return supabase
      .from("dosage_schedules")
      .select(
        `
        *,
        medications!inner(*)
      `
      )
      .eq("medications.patient_id", patientId)
      .gte("scheduled_time", start.toISOString())
      .lt("scheduled_time", end.toISOString())
      .order("scheduled_time");
  },

  // Get schedules for a date range (for calendar view)
  getSchedulesForDateRange: async (
    userId: string,
    startDate: Date,
    endDate: Date
  ) => {
    // Get patient ID first
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (patientError || !patient) {
      return { data: [], error: patientError };
    }

    const patientId = (patient as any).id;
    return supabase
      .from("dosage_schedules")
      .select(
        `
        *,
        medications!inner(*)
      `
      )
      .eq("medications.patient_id", patientId)
      .gte("scheduled_time", startDate.toISOString())
      .lte("scheduled_time", endDate.toISOString())
      .order("scheduled_time");
  },

  // Ensure schedules exist for a date range (idempotent via upsert)
  ensureSchedulesForDateRange: async (
    userId: string,
    startDate: Date,
    endDate: Date
  ) => {
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", userId)
      .single();
    if (patientError || !patient) return { data: null, error: patientError };
    const patientId = (patient as any).id;

    const { data: medications } = await supabase
      .from("medications")
      .select("*")
      .eq("patient_id", patientId)
      .eq("is_active", true);

    const items: any[] = [];
    const dayMs = 24 * 60 * 60 * 1000;

    const defaultTimesForFrequency = (
      freq: string,
      timesPerDay?: number
    ): string[] => {
      switch (freq) {
        case "daily":
          return ["08:00:00"];
        case "twice_daily":
          return ["08:00:00", "20:00:00"];
        case "three_times_daily":
          return ["08:00:00", "14:00:00", "20:00:00"];
        case "four_times_daily":
          return ["06:00:00", "12:00:00", "18:00:00", "22:00:00"];
        case "every_4_hours": {
          const times: string[] = [];
          for (let h = 8; h < 24; h += 4)
            times.push(`${h.toString().padStart(2, "0")}:00:00`);
          return times;
        }
        case "every_6_hours": {
          const times: string[] = [];
          for (let h = 8; h < 24; h += 6)
            times.push(`${h.toString().padStart(2, "0")}:00:00`);
          return times;
        }
        case "every_8_hours": {
          const times: string[] = [];
          for (let h = 8; h < 24; h += 8)
            times.push(`${h.toString().padStart(2, "0")}:00:00`);
          return times;
        }
        case "every_12_hours": {
          return ["08:00:00", "20:00:00"];
        }
        case "custom": {
          const n = Math.max(1, Math.min(8, timesPerDay || 1));
          const baseHour = 8; // start at 08:00
          const interval = Math.floor(24 / n);
          const times: string[] = [];
          for (let i = 0; i < n; i++) {
            const h = (baseHour + i * interval) % 24;
            const hh = h.toString().padStart(2, "0");
            times.push(`${hh}:00:00`);
          }
          return times;
        }
        default:
          return ["08:00:00"];
      }
    };

    for (let t = startDate.getTime(); t <= endDate.getTime(); t += dayMs) {
      const day = new Date(t);
      ((medications as any[]) || []).forEach((med) => {
        const medStart = med.start_date ? new Date(med.start_date) : startDate;
        const defaultEndDate = med.start_date
          ? new Date(
              new Date(med.start_date).getTime() + 30 * 24 * 60 * 60 * 1000
            )
          : endDate;
        const medEnd = med.end_date ? new Date(med.end_date) : defaultEndDate;
        if (day < medStart || day > medEnd) return;

        let times: string[] = [];
        if (
          Array.isArray(med.specific_times) &&
          med.specific_times.length > 0
        ) {
          times = med.specific_times as string[];
        } else {
          // Handle weekly/monthly/as_needed
          if (med.frequency === "weekly") {
            if (day.getDay() !== new Date(medStart).getDay()) return;
            times = defaultTimesForFrequency("daily");
          } else if (med.frequency === "monthly") {
            if (day.getDate() !== new Date(medStart).getDate()) return;
            times = defaultTimesForFrequency("daily");
          } else if (med.frequency === "as_needed") {
            return; // do not auto-schedule PRN
          } else {
            times = defaultTimesForFrequency(med.frequency, med.times_per_day);
          }
        }

        times.forEach((time: string) => {
          const parts = (time || "").split(":");
          const h = parseInt(parts[0] || "0", 10);
          const m2 = parseInt(parts[1] || "0", 10);
          const s2 = parseInt(parts[2] || "0", 10);
          const when = new Date(day);
          when.setHours(h, m2, s2, 0);
          items.push({
            medication_id: med.id,
            scheduled_time: when.toISOString(),
            dose_amount: med.dosage,
            is_taken: false,
          });
        });
      });
    }

    if (items.length > 0) {
      await (supabase.from("dosage_schedules") as any).upsert(
        items as any,
        { onConflict: "medication_id,scheduled_time" } as any
      );
    }
    return { data: true, error: null };
  },

  updateScheduleStatus: async (id: string, status: string, notes?: string) => {
    return (
      (supabase.from("dosage_schedules") as any).update({
        is_taken: status === "taken",
        notes,
      } as any) as any
    )
      .eq("id", id)
      .select()
      .single();
  },

  // Caregivers
  getCaregivers: async (patientId: string) => {
    return supabase
      .from("caregivers")
      .select(
        `
        *,
        caregiver:users!caregiver_id(*)
      `
      )
      .eq("patient_id", patientId)
      .eq("is_active", true);
  },

  inviteCaregiver: async (
    patientId: string,
    email: string,
    relationship: string
  ) => {
    return supabase.from("caregiver_invites").insert({
      patient_id: patientId,
      email,
      relationship,
      invited_at: new Date().toISOString(),
    } as any);
  },

  // Statistics - Get user stats directly
  getAdherenceStats: async (userId: string) => {
    return supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .single();
  },

  // Badges
  getUserBadges: async (userId: string) => {
    return supabase
      .from("user_badges")
      .select(
        `
        *,
        badge:badges(*)
      `
      )
      .eq("user_id", userId)
      .order("earned_at", { ascending: false });
  },

  // Notifications - Get through patient relationship
  getNotifications: async (userId: string, limit = 50) => {
    // Get patient ID first
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (patientError || !patient) {
      return { data: [], error: patientError };
    }

    const patientId = (patient as any).id;
    return supabase
      .from("notifications")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(limit);
  },

  markNotificationAsRead: async (id: string) => {
    return (
      (supabase.from("notifications") as any).update({
        is_read: true,
      } as any) as any
    ).eq("id", id);
  },
};

// Realtime subscriptions
export const subscribeToMedicationUpdates = (
  userId: string,
  callback: (payload: any) => void
) => {
  // This would need to be implemented with a more complex query
  // since dosage_schedules doesn't have direct user_id
  console.warn(
    "subscribeToMedicationUpdates needs implementation for patient relationship"
  );
  return null;
};

export const subscribeToNotifications = (
  userId: string,
  callback: (payload: any) => void
) => {
  // This would need to be implemented with a more complex query
  // since notifications uses patient_id, not user_id
  console.warn(
    "subscribeToNotifications needs implementation for patient relationship"
  );
  return null;
};

// Storage helpers
export const storage = {
  uploadAvatar: async (file: File, userId: string) => {
    const fileName = `${userId}/avatar-${Date.now()}.${file.name
      .split(".")
      .pop()}`;
    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(fileName);

    return publicUrl;
  },

  uploadMedicationImage: async (
    file: File,
    userId: string,
    medicationId: string
  ) => {
    const fileName = `${userId}/medications/${medicationId}-${Date.now()}.${file.name
      .split(".")
      .pop()}`;
    const { data, error } = await supabase.storage
      .from("medications")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("medications").getPublicUrl(fileName);

    return publicUrl;
  },
};

export default supabase;

// Individual exports for convenience
export const {
  getUser,
  updateUser,
  getMedications,
  getMedication,
  createMedication,
  updateMedication,
  deleteMedication,
  getIntakeLogs,
  createIntakeLog,
  getTodaySchedule,
  getSchedulesForDateRange,
  ensureSchedulesForDateRange,
  updateScheduleStatus,
  getAdherenceStats,
  getUserBadges,
  getNotifications,
  markNotificationAsRead,
} = db;
