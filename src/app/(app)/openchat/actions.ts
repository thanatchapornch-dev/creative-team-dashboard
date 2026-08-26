"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOpenChatAccess } from "@/lib/auth";
import { bangkokWeekStart } from "@/lib/date-only";
import { parseOpenChatUpload, type OpenChatUploadPreview } from "@/lib/openchat-import";

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

export async function previewOpenChatUploadAction(formData: FormData): Promise<OpenChatUploadPreview> {
  await requireOpenChatAccess();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("NO_FILE");
  const buffer = await file.arrayBuffer();
  return parseOpenChatUpload(buffer);
}

export async function commitOpenChatUploadAction(preview: OpenChatUploadPreview) {
  const member = await requireOpenChatAccess();

  const storeIds = preview.matchedRows.map((r) => r.storeId);
  const validIds = new Set(
    (await prisma.store.findMany({ where: { id: { in: storeIds } }, select: { id: true } })).map((s) => s.id)
  );

  let upserts = 0;
  for (const row of preview.matchedRows) {
    if (!validIds.has(row.storeId)) continue;
    for (const update of row.updates) {
      const weekOf = new Date(update.weekOf);
      await prisma.openChatCount.upsert({
        where: { storeId_weekOf: { storeId: row.storeId, weekOf } },
        update: { memberCount: update.memberCount, recordedById: member.id, recordedAt: new Date() },
        create: { storeId: row.storeId, weekOf, memberCount: update.memberCount, recordedById: member.id },
      });
      upserts++;
    }
  }

  revalidatePath("/openchat");
  return { upserts };
}
