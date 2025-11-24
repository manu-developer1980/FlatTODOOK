import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthUser } from "@supabase/supabase-js";
import { auth, db } from "../lib/supabase";
import { SubscriptionService } from "@/services/subscriptionService";
import { Subscription } from "@/services/subscriptionService";
import { UserProfile } from "@/types/database";
import { hasUserId } from "@/lib/userUtils";

interface AuthState {
  user: AuthUser | null;
  session: any | null;
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;

  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  checkSession: () => Promise<void>;
  updateUser: (data: Partial<AuthUser>) => Promise<void>;
  loadSubscription: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      subscription: null,
      loading: false,
      error: null,

      signIn: async (email: string, password: string) => {
        set({ loading: true, error: null });
        console.log("Attempting to sign in with email:", email);
        try {
          const { data, error } = await auth.signIn(email, password);
          console.log("Sign in response:", { data, error });

          if (error) {
            console.error("Sign in error:", error);
            throw error;
          }

          if (data.user) {
            console.log("Sign in successful, user:", data.user.id);
            console.log("Session:", data.session);

            // Fetch user profile
            console.log("Fetching user profile for userId:", data.user.id);
            const { data: userData, error: userError } = await db.getUser(
              data.user.id
            );
            console.log("User profile fetch result:", { userData, userError });

            if (userError) {
              console.error("User profile fetch error:", userError);
              throw userError;
            }

            // Load subscription
            const subscription = await SubscriptionService.getSubscription();

            set({
              user: userData,
              session: data.session,
              subscription,
              loading: false,
              error: null,
            });

            console.log("Sign in process completed successfully");
          }
        } catch (error: any) {
          console.error("Sign in process failed:", error);
          set({
            error: error.message || "Error al iniciar sesión",
            loading: false,
          });
          throw error;
        }
      },

      signUp: async (email: string, password: string, fullName: string) => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await auth.signUp(email, password, {
            full_name: fullName,
            role: "patient",
            is_premium: false,
          });
          if (error) throw error;

          set({
            user: data.user
              ? ({
                  id: data.user.id,
                  email: data.user.email!,
                  full_name: fullName,
                  role: "patient",
                  is_premium: false,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  avatar_url: null,
                  phone: null,
                  date_of_birth: null,
                  emergency_contact: null,
                  caregiver_id: null,
                  is_active: true,
                } as any)
              : null,
            session: data.session,
            loading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            error: error.message || "Error al registrar usuario",
            loading: false,
          });
          throw error;
        }
      },

      signOut: async () => {
        set({ loading: true });
        try {
          await auth.signOut();
          set({
            user: null,
            session: null,
            loading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            error: error.message || "Error al cerrar sesión",
            loading: false,
          });
          throw error;
        }
      },

      resetPassword: async (email: string) => {
        set({ loading: true, error: null });
        try {
          const { error } = await auth.resetPassword(email);
          if (error) throw error;
          set({ loading: false });
        } catch (error: any) {
          set({
            error: error.message || "Error al enviar email de recuperación",
            loading: false,
          });
          throw error;
        }
      },

      updatePassword: async (newPassword: string) => {
        set({ loading: true, error: null });
        try {
          const { error } = await auth.updatePassword(newPassword);
          if (error) throw error;
          set({ loading: false });
        } catch (error: any) {
          set({
            error: error.message || "Error al actualizar contraseña",
            loading: false,
          });
          throw error;
        }
      },

      checkSession: async () => {
        set({ loading: true });
        console.log("Checking current session...");
        try {
          const {
            data: { session },
            error,
          } = await auth.getSession();
          console.log("Session check result:", { session, error });

          if (error) {
            console.error("Session check error:", error);
            throw error;
          }

          if (session?.user) {
            console.log("Session found, user:", session.user.id);
            console.log("Fetching user profile for session user...");

            const { data: userData, error: userError } = await db.getUser(
              session.user.id
            );
            console.log("User profile fetch result:", { userData, userError });

            if (userError) {
              console.error("User profile fetch error:", userError);
              throw userError;
            }

            // Load subscription
            const subscription = await SubscriptionService.getSubscription();

            set({
              user: userData,
              session: session,
              subscription,
              loading: false,
              error: null,
            });

            console.log("Session check completed successfully");
          } else {
            console.log("No session found");
            set({
              user: null,
              session: null,
              subscription: null,
              loading: false,
            });
          }
        } catch (error: any) {
          console.error("Session check failed:", error);
          set({
            error: error.message || "Error al verificar sesión",
            loading: false,
          });
        }
      },

      updateUser: async (data: any) => {
        const { user } = get();
        if (!user) throw new Error("No hay usuario autenticado");

        set({ loading: true, error: null });
        try {
          const { data: updatedUser, error } = await db.updateUser(
            user.id,
            data
          );
          if (error) throw error;

          set({
            user: updatedUser,
            loading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            error: error.message || "Error al actualizar usuario",
            loading: false,
          });
          throw error;
        }
      },

      loadSubscription: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const subscription = await SubscriptionService.getSubscription();
          set({ subscription });
        } catch (error) {
          console.error("Error loading subscription:", error);
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        session: state.session,
      }),
    }
  )
);
