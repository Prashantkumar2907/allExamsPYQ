import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig, isDemoMode } from './env';
import { demoSupabase } from './demoSupabase';

const { url, anonKey } = getSupabaseConfig();
const realSupabase = createClient(url, anonKey);

export const supabase = (isDemoMode ? demoSupabase : realSupabase) as typeof realSupabase;
