import { create } from 'zustand';
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
  submitting: boolean;
  initialized: boolean;
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, examId?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: string | null }>;
  initialize: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
}

function clearLegacyAuthStorage() {
  try {
    localStorage.removeItem('auth-storage');
  } catch {
    // Auth still initializes from the Supabase client if storage is unavailable.
  }
}

export const useAuthStore = create<AuthState>()(
  (set, get) => ({
      user: null,
      profile: null,
      session: null,
      loading: true,
      submitting: false,
      initialized: false,
      profileError: null,

      initialize: async () => {
        clearLegacyAuthStorage();

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
        set({ submitting: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
          if (!error && data.session?.user) {
            set({ user: data.session.user, session: data.session });
            await get().fetchProfile(data.session.user.id);
          }
          return { error: error?.message ?? null };
        } catch (err) {
          return { error: getErrorMessage(err, 'Unable to sign in.') };
        } finally {
          set({ submitting: false });
        }
      },

      signUp: async (email, password, fullName, examId) => {
        set({ submitting: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { data: { full_name: normalizeText(fullName), exam_id: examId } },
          });
          if (!error && data.session?.user) {
            set({ user: data.session.user, session: data.session });
            await get().fetchProfile(data.session.user.id);
          }
          return { error: error?.message ?? null };
        } catch (err) {
          return { error: getErrorMessage(err, 'Unable to create your account.') };
        } finally {
          set({ submitting: false });
        }
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
    })
);
