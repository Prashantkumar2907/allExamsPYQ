import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { getErrorMessage, normalizeText } from '../lib/api';
import type { Profile } from '../types/database';
import type { Session, User } from '@supabase/supabase-js';

let authListenerRegistered = false;

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  profileError: string | null;
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
      profileError: null,

      initialize: async () => {
        if (!authListenerRegistered) {
          authListenerRegistered = true;
          supabase.auth.onAuthStateChange(async (_event, session) => {
            set({ user: session?.user ?? null, session });
            if (session?.user) {
              await get().fetchProfile(session.user.id);
            } else {
              set({ profile: null, profileError: null });
            }
          });
        }

        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            set({ user: session.user, session });
            await get().fetchProfile(session.user.id);
          }
        } finally {
          set({ loading: false, initialized: true });
        }
      },

      fetchProfile: async (userId: string) => {
        set({ profileError: null });
        const { data, error } = await supabase
          .from('profiles')
          .select('*, exam:exams(*)')
          .eq('id', userId)
          .single();
        if (error) {
          set({ profile: null, profileError: getErrorMessage(error, 'Unable to load your profile.') });
          return;
        }
        if (data) set({ profile: data as Profile, profileError: null });
      },

      signIn: async (email, password) => {
        set({ loading: true });
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        set({ loading: false });
        return { error: error?.message ?? null };
      },

      signUp: async (email, password, fullName, examId) => {
        set({ loading: true });
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: normalizeText(fullName), exam_id: examId } },
        });
        set({ loading: false });
        return { error: error?.message ?? null };
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, profile: null, session: null, profileError: null });
      },

      updateProfile: async (data) => {
        const userId = get().user?.id;
        if (!userId) return { error: 'Not authenticated' };
        const allowedData = {
          ...(data.full_name != null ? { full_name: normalizeText(data.full_name) } : {}),
          ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
          ...(data.bio !== undefined ? { bio: data.bio || null } : {}),
          ...(data.avatar_url !== undefined ? { avatar_url: data.avatar_url || null } : {}),
          ...(data.exam_id !== undefined ? { exam_id: data.exam_id || null } : {}),
        };
        const { error } = await supabase
          .from('profiles')
          .update(allowedData)
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
