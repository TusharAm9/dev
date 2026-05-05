import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// This client is for public/client-side use
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// Compatibility export for components expecting a createClient function
export const createClient = () => supabase;

// Use this only in API routes/Server Actions for admin tasks
export const supabaseAdmin = createSupabaseClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);
