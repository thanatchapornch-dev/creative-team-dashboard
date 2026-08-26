"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOpenChatAccess } from "@/lib/auth";
import { bangkokWeekStart } from "@/lib/date-only";

export type OpenChatEntry = { storeId: string; memberCount: number };

export async function saveOpenChatCountsAction(entries: OpenChatEntry[]) {
  const member = await requireOpenChatAccess();
  const weekOf = bangkokWeekStart();

  for (const entry of entries) {
    await prisma.openChatCount.upsert({
      where: { storeId_weekOf: { storeId: entry.storeId, weekOf } },
      update: { memberCount: entry.memberCount, recordedById: member.id, recordedAt: new Date() },
      create: {
        storeId: entry.storeId,
        weekOf,
        memberCount: entry.memberCount,
        recordedById: member.id,
      },
    });
  }

  revalidatePath("/openchat");
  return { saved: entries.length, weekOf: weekOf.toISOString() };
}
