"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentUser } from "./auth";

const CreateProjectSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export async function createProject(raw: unknown) {
  const caller = await getCurrentUser();
  if (!caller) throw new Error("UNAUTHORIZED");
  if (caller.role !== "ADMIN") throw new Error("FORBIDDEN: Only Admins can create projects.");

  const data = CreateProjectSchema.parse(raw);

  const { data: project, error } = await supabaseAdmin
    .from('Project')
    .insert({
      title: data.title,
      description: data.description,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Connect the creator as a member
  const { error: memberError } = await supabaseAdmin
    .from('_ProjectMembers')
    .insert({ A: project.id, B: caller.id });

  if (memberError) throw new Error(memberError.message);

  try {
    revalidatePath("/");
  } catch (e) {
    // revalidatePath is unsupported during render
  }
  return project;
}

export async function getProjects() {
  const caller = await getCurrentUser();
  if (!caller) throw new Error("UNAUTHORIZED");

  // Get project IDs that the user is a member of
  const { data: memberships, error: memError } = await supabaseAdmin
    .from('_ProjectMembers')
    .select('A')
    .eq('B', caller.id);

  if (memError) throw new Error(memError.message);
  const projectIds = memberships.map(m => m.A);

  if (projectIds.length === 0) return [];

  const { data: projects, error } = await supabaseAdmin
    .from('Project')
    .select('*, tasks:Task(count)')
    .in('id', projectIds)
    .order('createdAt', { ascending: false });

  if (error) throw new Error(error.message);
  
  // Transform to match previous structure if needed
  return projects.map(p => ({
    ...p,
    _count: { tasks: p.tasks[0]?.count || 0 }
  }));
}

export async function deleteProject(projectId: string) {
  const caller = await getCurrentUser();
  if (!caller) throw new Error("UNAUTHORIZED");
  if (caller.role !== "ADMIN") throw new Error("FORBIDDEN: Only Admins can delete projects.");

  const { error } = await supabaseAdmin
    .from('Project')
    .delete()
    .eq('id', projectId);

  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function getProjectMembers(projectId: string) {
  const caller = await getCurrentUser();
  if (!caller) throw new Error("UNAUTHORIZED");

  // Verify access first
  const { data: access, error: accessError } = await supabaseAdmin
    .from('_ProjectMembers')
    .select('A')
    .eq('A', projectId)
    .eq('B', caller.id)
    .single();

  if (accessError || !access) throw new Error("Project not found or access denied");

  // Get member IDs
  const { data: memberships, error: memError } = await supabaseAdmin
    .from('_ProjectMembers')
    .select('B')
    .eq('A', projectId);

  if (memError) throw new Error(memError.message);
  const userIds = memberships.map(m => m.B);

  const { data: members, error } = await supabaseAdmin
    .from('User')
    .select('id, name, email, role')
    .in('id', userIds);

  if (error) throw new Error(error.message);
  return members;
}

export async function addProjectMember(projectId: string, email: string) {
  const caller = await getCurrentUser();
  if (!caller) throw new Error("UNAUTHORIZED");
  if (caller.role !== "ADMIN") throw new Error("FORBIDDEN: Only Admins can manage members.");

  const { data: userToAdd, error: userError } = await supabaseAdmin
    .from('User')
    .select('id')
    .eq('email', email)
    .single();

  if (userError || !userToAdd) throw new Error("User not found. They must sign up for SwiftTask first.");

  const { error } = await supabaseAdmin
    .from('_ProjectMembers')
    .insert({ A: projectId, B: userToAdd.id });

  if (error) throw new Error("User is already a member or another error occurred.");

  revalidatePath(`/project/${projectId}/team`);
  revalidatePath("/");
}

export async function removeProjectMember(projectId: string, userId: string) {
  const caller = await getCurrentUser();
  if (!caller) throw new Error("UNAUTHORIZED");
  if (caller.role !== "ADMIN") throw new Error("FORBIDDEN: Only Admins can manage members.");

  const { error } = await supabaseAdmin
    .from('_ProjectMembers')
    .delete()
    .eq('A', projectId)
    .eq('B', userId);

  if (error) throw new Error(error.message);

  revalidatePath(`/project/${projectId}/team`);
  revalidatePath("/");
}
