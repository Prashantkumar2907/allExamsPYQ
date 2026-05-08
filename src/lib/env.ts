const env = import.meta.env;

export const appEnv = {
  supabaseUrl: env.VITE_SUPABASE_URL as string | undefined,
  supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY as string | undefined,
  demoMode: env.VITE_DEMO_MODE as string | undefined,
};

export const isSupabaseConfigured = Boolean(appEnv.supabaseUrl && appEnv.supabaseAnonKey);
export const isDemoMode =
  appEnv.demoMode === 'true' || !isSupabaseConfigured;

export function getSupabaseConfig() {
  if (!isSupabaseConfigured) {
    console.warn(
      'Missing Supabase environment variables. Using seeded demo mode. Copy .env.example to .env.local and set VITE_SUPABASE_URL plus VITE_SUPABASE_ANON_KEY for Supabase.'
    );
  }

  return {
    url: appEnv.supabaseUrl || 'http://127.0.0.1:54321',
    anonKey: appEnv.supabaseAnonKey || 'missing-anon-key',
  };
}
