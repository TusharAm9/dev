"use server";

import { prisma } from "@/lib/prisma";

export async function logActivity(data: {
  type: string;
  content: string;
  userId: string;
  projectId: string;
}) {
  const p = prisma as any;
  if (!p.activity) {
    console.error("CRITICAL: Activity model missing from Prisma client. Restart dev server.");
    return;
  }

  return p.activity.create({
    data: {
      type: data.type,
      content: data.content,
      userId: data.userId,
      projectId: data.projectId,
    },
  });
}

export async function getProjectActivities(projectId: string) {
  const p = prisma as any;
  if (!p.activity) {
    throw new Error("Activity history unavailable: Please restart the dev server to sync database models.");
  }

  return p.activity.findMany({
    where: { projectId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
