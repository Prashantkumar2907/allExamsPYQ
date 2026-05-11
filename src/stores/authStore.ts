import { create } from 'zustand';
import { getErrorMessage, normalizeText } from '../lib/api';
import type { Profile } from '../types/database';
import type { Session, User } from '@supabase/supabase-js';

let authListenerRegistered = false;
type SupabaseClientLike = typeof import('../lib/supabase').supabase;
let supabaseClientPromise: Promise<SupabaseClientLike> | null = null;
let profileFetchVersion = 0;

async function getSupabaseClient() {
  supabaseClientPromise ??= import('../lib/supabase').then((module) => module.supabase);
  return supabaseClientPromise;
}

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
        const supabase = await getSupabaseClient();

        if (!authListenerRegistered) {
          authListenerRegistered = true;
          supabase.auth.onAuthStateChange(async (_event, session) => {
            profileFetchVersion++;
            set({ user: session?.user ?? null, session, profile: null, profileError: null });
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
            profileFetchVersion++;
            set({ user: session.user, session, profile: null, profileError: null });
            await get().fetchProfile(session.user.id);
          }
        } finally {
          set({ loading: false, initialized: true });
        }
      },

      fetchProfile: async (userId: string) => {
        const supabase = await getSupabaseClient();
        const fetchVersion = ++profileFetchVersion;
        set({ profileError: null });
        const { data, error } = await supabase
          .from('profiles')
          .select('*, exam:exams(*)')
          .eq('id', userId)
          .single();
        if (fetchVersion !== profileFetchVersion || get().user?.id !== userId) return;
        if (error) {
          set({ profile: null, profileError: getErrorMessage(error, 'Unable to load your profile.') });
          return;
        }
        if (data) set({ profile: data as Profile, profileError: null });
      },

      signIn: async (email, password) => {
        set({ submitting: true });
        try {
          const supabase = await getSupabaseClient();
          const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
          if (!error && data.session?.user) {
            profileFetchVersion++;
            set({ user: data.session.user, session: data.session, profile: null, profileError: null });
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
          const supabase = await getSupabaseClient();
          const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { data: { full_name: normalizeText(fullName), exam_id: examId } },
          });
          if (!error && data.session?.user) {
            profileFetchVersion++;
            set({ user: data.session.user, session: data.session, profile: null, profileError: null });
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
        const supabase = await getSupabaseClient();
        await supabase.auth.signOut();
        profileFetchVersion++;
        set({ user: null, profile: null, session: null, profileError: null });
      },

      updateProfile: async (data) => {
        const supabase = await getSupabaseClient();
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
