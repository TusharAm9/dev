"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";

export async function logActivity(data: {
  type: string;
  content: string;
  userId: string;
  projectId: string;
}) {
  const { error } = await supabaseAdmin
    .from('Activity')
    .insert({
      type: data.type,
      content: data.content,
      userId: data.userId,
      projectId: data.projectId,
    });

  if (error) {
    console.error("Error logging activity:", error.message);
  }
}

export async function getProjectActivities(projectId: string) {
  const { data, error } = await supabaseAdmin
    .from('Activity')
    .select('*, user:User(id, name, email)')
    .eq('projectId', projectId)
    .order('createdAt', { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(`Activity history unavailable: ${error.message}`);
  }

  return data;
}
