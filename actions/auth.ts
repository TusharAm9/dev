"use server";

import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";

/**
 * Syncs the authenticated Supabase user into our `User` table.
 */
export async function syncUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Not authenticated");
  }

  const { error: upsertError } = await supabaseAdmin
    .from('User')
    .upsert({
      supabaseId: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name ?? user.email!.split("@")[0],
      role: "ADMIN",
    }, {
      onConflict: 'supabaseId'
    });

  if (upsertError) {
    throw new Error(`Sync failed: ${upsertError.message}`);
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Returns the current user's record, or null.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabaseAdmin
    .from('User')
    .select('*')
    .eq('supabaseId', user.id)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getUsers() {
  const caller = await getCurrentUser();
  if (!caller) throw new Error("UNAUTHORIZED");

  const { data, error } = await supabaseAdmin
    .from('User')
    .select('id, name, email')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

