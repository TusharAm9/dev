"use server";

import { createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/**
 * Syncs the authenticated Supabase user into our Prisma `User` table.
 * Safe to call multiple times — uses upsert so it won't create duplicates.
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

  await prisma.user.upsert({
    where: { supabaseId: user.id },
    create: {
      supabaseId: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name ?? user.email!.split("@")[0],
      role: "ADMIN", // first user is admin; can be changed later
    },
    update: {
      email: user.email!,
    },
  });
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Returns the current user's Prisma record, or null.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return prisma.user.findUnique({
    where: { supabaseId: user.id },
  });
}

export async function getUsers() {
  const caller = await getCurrentUser();
  if (!caller) throw new Error("UNAUTHORIZED");

  return prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

