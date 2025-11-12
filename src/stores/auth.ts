import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { auth, db } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  checkSession: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: false,
      error: null,

      signIn: async (email: string, password: string) => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await auth.signIn(email, password);
          if (error) throw error;

          if (data.user) {
            // Fetch user profile
            const { data: userData, error: userError } = await db.getUser(data.user.id);
            if (userError) throw userError;

            set({
              user: userData,
              session: data.session,
              loading: false,
              error: null
            });
          }
        } catch (error: any) {
          set({ 
            error: error.message || 'Error al iniciar sesión', 
            loading: false 
          });
          throw error;
        }
      },

      signUp: async (email: string, password: string, fullName: string) => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await auth.signUp(email, password, {
            full_name: fullName,
            role: 'patient',
            is_premium: false
          });
          if (error) throw error;

          set({ 
            user: data.user ? { 
              id: data.user.id, 
              email: data.user.email!,
              full_name: fullName,
              role: 'patient',
              is_premium: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as User : null,
            session: data.session,
            loading: false,
            error: null
          });
        } catch (error: any) {
          set({ 
            error: error.message || 'Error al registrar usuario', 
            loading: false 
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
            error: null
          });
        } catch (error: any) {
          set({ 
            error: error.message || 'Error al cerrar sesión', 
            loading: false 
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
            error: error.message || 'Error al enviar email de recuperación', 
            loading: false 
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
            error: error.message || 'Error al actualizar contraseña', 
            loading: false 
          });
          throw error;
        }
      },

      checkSession: async () => {
        set({ loading: true });
        try {
          const { data: { session }, error } = await auth.getSession();
          if (error) throw error;

          if (session?.user) {
            const { data: userData, error: userError } = await db.getUser(session.user.id);
            if (userError) throw userError;

            set({
              user: userData,
              session: session,
              loading: false,
              error: null
            });
          } else {
            set({ 
              user: null, 
              session: null, 
              loading: false 
            });
          }
        } catch (error: any) {
          set({ 
            error: error.message || 'Error al verificar sesión', 
            loading: false 
          });
        }
      },

      updateUser: async (data: Partial<User>) => {
        const { user } = get();
        if (!user) throw new Error('No hay usuario autenticado');

        set({ loading: true, error: null });
        try {
          const { data: updatedUser, error } = await db.updateUser(user.id, data);
          if (error) throw error;

          set({
            user: updatedUser,
            loading: false,
            error: null
          });
        } catch (error: any) {
          set({ 
            error: error.message || 'Error al actualizar usuario', 
            loading: false 
          });
          throw error;
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        session: state.session 
      })
    }
  )
);