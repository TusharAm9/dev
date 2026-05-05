"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCurrentUser } from "./auth";
import { logActivity } from "./activity";

// ─── Schemas ───────────────────────────────────────────────────────────────

const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  description: z.string().max(500).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  dueDate: z.string().optional(),
  projectId: z.string(),
  assigneeId: z.string(),
});

const UpdateTaskStatusSchema = z.object({
  taskId: z.string(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
});

const UpdateTaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});

// ─── Actions ───────────────────────────────────────────────────────────────

export async function createTask(raw: unknown) {
  const caller = await getCurrentUser();
  if (!caller) throw new Error("UNAUTHORIZED");
  if (caller.role !== "ADMIN") throw new Error("FORBIDDEN: Only Admins can create tasks.");

  const data = CreateTaskSchema.parse(raw);

  const { data: task, error } = await supabaseAdmin
    .from('Task')
    .insert({
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      projectId: data.projectId,
      assigneeId: data.assigneeId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!task) throw new Error("Failed to create task: No data returned.");

  await logActivity({
    type: "TASK_CREATED",
    content: `Created task: ${task.title}`,
    userId: caller.id,
    projectId: task.projectId,
  });

  revalidatePath(`/project/${task.projectId}`);
  revalidatePath("/");
  return task;
}

export async function updateTaskStatus(raw: unknown) {
  const caller = await getCurrentUser();
  if (!caller) throw new Error("UNAUTHORIZED");

  const { taskId, status } = UpdateTaskStatusSchema.parse(raw);

  // Members can only update tasks assigned to them
  if (caller.role === "MEMBER") {
    const { data: task, error } = await supabaseAdmin
      .from('Task')
      .select('id')
      .eq('id', taskId)
      .eq('assigneeId', caller.id)
      .single();
    
    if (error || !task) throw new Error("FORBIDDEN: You can only update your own tasks.");
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('Task')
    .update({ status, updatedAt: new Date().toISOString() })
    .eq('id', taskId)
    .select()
    .single();

  if (updateError) throw new Error(updateError.message);

  await logActivity({
    type: "STATUS_UPDATED",
    content: `Moved task to ${status}`,
    userId: caller.id,
    projectId: updated.projectId,
  });

  revalidatePath("/");
  return updated;
}

export async function updateTask(raw: unknown) {
  const caller = await getCurrentUser();
  if (!caller) throw new Error("UNAUTHORIZED");

  const data = UpdateTaskSchema.parse(raw);

  // RBAC: Non-admins can only update tasks assigned to them
  if (caller.role !== "ADMIN") {
    const { data: task, error } = await supabaseAdmin
      .from('Task')
      .select('assigneeId')
      .eq('id', data.id)
      .single();
    
    if (error || !task || task.assigneeId !== caller.id) {
      throw new Error("FORBIDDEN: You can only update your own tasks.");
    }
  }

  const { id, ...updates } = data;
  
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('Task')
    .update({
      ...updates,
      dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) throw new Error(updateError.message);

  await logActivity({
    type: "TASK_UPDATED",
    content: `Updated details for: ${updated.title}`,
    userId: caller.id,
    projectId: updated.projectId,
  });

  revalidatePath("/");
  return updated;
}

export async function deleteTask(taskId: string) {
  const caller = await getCurrentUser();
  if (!caller) throw new Error("UNAUTHORIZED");
  if (caller.role !== "ADMIN") throw new Error("FORBIDDEN: Only Admins can delete tasks.");

  const { error } = await supabaseAdmin
    .from('Task')
    .delete()
    .eq('id', taskId);

  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function getTasks(projectId: string) {
  const caller = await getCurrentUser();
  if (!caller) throw new Error("UNAUTHORIZED");

  const { data, error } = await supabaseAdmin
    .from('Task')
    .select('*, assignee:User(id, name, email)')
    .eq('projectId', projectId)
    .order('createdAt', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}
