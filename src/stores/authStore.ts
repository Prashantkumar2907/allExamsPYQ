import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, examId?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: string | null }>;
  initialize: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      session: null,
      loading: true,
      initialized: false,

      initialize: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            set({ user: session.user, session });
            await get().fetchProfile(session.user.id);
          }
        } finally {
          set({ loading: false, initialized: true });
        }

        supabase.auth.onAuthStateChange(async (_event, session) => {
          set({ user: session?.user ?? null, session });
          if (session?.user) {
            await get().fetchProfile(session.user.id);
          } else {
            set({ profile: null });
          }
        });
      },

      fetchProfile: async (userId: string) => {
        const { data } = await supabase
          .from('profiles')
          .select('*, exam:exams(*)')
          .eq('id', userId)
          .single();
        if (data) set({ profile: data as Profile });
      },

      signIn: async (email, password) => {
        set({ loading: true });
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        set({ loading: false });
        return { error: error?.message ?? null };
      },

      signUp: async (email, password, fullName, examId) => {
        set({ loading: true });
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, exam_id: examId } },
        });
        set({ loading: false });
        return { error: error?.message ?? null };
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, profile: null, session: null });
      },

      updateProfile: async (data) => {
        const userId = get().user?.id;
        if (!userId) return { error: 'Not authenticated' };
        const { error } = await supabase
          .from('profiles')
          .update(data)
          .eq('id', userId);
        if (!error) await get().fetchProfile(userId);
        return { error: error?.message ?? null };
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, session: state.session }),
    }
  )
);
