"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
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

  const project = await prisma.project.create({
    data: {
      title: data.title,
      description: data.description,
      members: { connect: { id: caller.id } },
    },
  });

  try {
    revalidatePath("/");
  } catch (e) {
    // revalidatePath is unsupported during render (e.g. GET request)
    // We ignore it here as the current render will already have the new data
  }
  return project;
}

export async function getProjects() {
  const caller = await getCurrentUser();
  if (!caller) throw new Error("UNAUTHORIZED");

  return prisma.project.findMany({
    where: {
      members: { some: { id: caller.id } },
    },
    include: {
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteProject(projectId: string) {
  const caller = await getCurrentUser();
  if (!caller) throw new Error("UNAUTHORIZED");
  if (caller.role !== "ADMIN") throw new Error("FORBIDDEN: Only Admins can delete projects.");

  await prisma.project.delete({ where: { id: projectId } });
  revalidatePath("/");
}

export async function getProjectMembers(projectId: string) {
  const caller = await getCurrentUser();
  if (!caller) throw new Error("UNAUTHORIZED");

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      members: { some: { id: caller.id } },
    },
    include: {
      members: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  if (!project) throw new Error("Project not found");
  return project.members;
}

export async function addProjectMember(projectId: string, email: string) {
  const caller = await getCurrentUser();
  if (!caller) throw new Error("UNAUTHORIZED");
  if (caller.role !== "ADMIN") throw new Error("FORBIDDEN: Only Admins can manage members.");

  const userToAdd = await prisma.user.findUnique({ where: { email } });
  if (!userToAdd) throw new Error("User not found. They must sign up for SwiftTask first.");

  await prisma.project.update({
    where: { id: projectId },
    data: {
      members: { connect: { id: userToAdd.id } },
    },
  });

  revalidatePath(`/project/${projectId}/team`);
  revalidatePath("/");
}

export async function removeProjectMember(projectId: string, userId: string) {
  const caller = await getCurrentUser();
  if (!caller) throw new Error("UNAUTHORIZED");
  if (caller.role !== "ADMIN") throw new Error("FORBIDDEN: Only Admins can manage members.");

  await prisma.project.update({
    where: { id: projectId },
    data: {
      members: { disconnect: { id: userId } },
    },
  });

  revalidatePath(`/project/${projectId}/team`);
  revalidatePath("/");
}
