"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { destroySession, requireMember } from "@/lib/auth";

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function markNotificationReadAction(notificationId: string) {
  const member = await requireMember();
  await prisma.notificationLog.updateMany({
    where: { id: notificationId, recipientId: member.id },
    data: { readAt: new Date() },
  });
  revalidatePath("/", "layout");
}

export async function markAllNotificationsReadAction() {
  const member = await requireMember();
  await prisma.notificationLog.updateMany({
    where: { recipientId: member.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/", "layout");
}
