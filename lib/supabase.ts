import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// This client is for public/client-side use
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// Compatibility export for components expecting a createClient function
export const createClient = () => supabase;

