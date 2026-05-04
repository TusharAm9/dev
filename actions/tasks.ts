"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./auth";
import { logActivity } from "./activity";

// ─── Schemas ───────────────────────────────────────────────────────────────

const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  description: z.string().max(500).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  dueDate: z.string().optional(),
  projectId: z.string().cuid(),
  assigneeId: z.string().cuid(),
});

const UpdateTaskStatusSchema = z.object({
  taskId: z.string().cuid(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
});

const UpdateTaskSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  assigneeId: z.string().cuid().optional(),
  dueDate: z.string().optional(),
});

// ─── Actions ───────────────────────────────────────────────────────────────

export async function createTask(raw: unknown) {
  const caller = await getCurrentUser();
  if (!caller) throw new Error("UNAUTHORIZED");
  if (caller.role !== "ADMIN") throw new Error("FORBIDDEN: Only Admins can create tasks.");

  const data = CreateTaskSchema.parse(raw);

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      projectId: data.projectId,
      assigneeId: data.assigneeId,
    } as any,
  });

  await logActivity({
    type: "TASK_CREATED",
    content: `Created task: ${task.title}`,
    userId: caller.id,
    projectId: task.projectId,
  });

  revalidatePath("/");
  return task;
}

export async function updateTaskStatus(raw: unknown) {
  const caller = await getCurrentUser();
  if (!caller) throw new Error("UNAUTHORIZED");

  const { taskId, status } = UpdateTaskStatusSchema.parse(raw);

  // Members can only update tasks assigned to them
  if (caller.role === "MEMBER") {
    const task = await prisma.task.findFirst({
      where: { id: taskId, assigneeId: caller.id },
    });
    if (!task) throw new Error("FORBIDDEN: You can only update your own tasks.");
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { status },
  });

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
    const task = await prisma.task.findUnique({
      where: { id: data.id },
      select: { assigneeId: true },
    });
    if (!task || task.assigneeId !== caller.id) {
      throw new Error("FORBIDDEN: You can only update your own tasks.");
    }
  }

  const { id, ...updates } = data;
  
  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...updates,
      dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
    } as any,
  });

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

  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath("/");
}

export async function getTasks(projectId: string) {
  const caller = await getCurrentUser();
  if (!caller) throw new Error("UNAUTHORIZED");

  return prisma.task.findMany({
    where: { projectId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
