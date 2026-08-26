"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember, requireRole, hashPin } from "@/lib/auth";
import { updateSettings, type ThemeColors } from "@/lib/settings";
import { parseStoreUpload, type StoreUploadPreview } from "@/lib/store-import";

export async function updateProfileAction(input: {
  nickname: string;
  position: string;
  workEmail: string;
  profilePictureUrl?: string;
  statusToday: string;
}) {
  const member = await requireMember();
  await prisma.member.update({
    where: { id: member.id },
    data: {
      nickname: input.nickname,
      position: input.position,
      workEmail: input.workEmail,
      statusToday: input.statusToday as never,
      ...(input.profilePictureUrl !== undefined ? { profilePictureUrl: input.profilePictureUrl } : {}),
    },
  });
  revalidatePath("/", "layout");
}

export async function updateCompanySettingsAction(input: {
  companyName: string;
  workingDays: string[];
  holidays: string[];
  annualLeaveNoticeDays: number;
  approvalSlaDays: number;
  taskReminderDaysBefore: number;
  themeColors: ThemeColors;
}) {
  await requireRole(["LEADER", "ADMIN"]);
  await updateSettings(input);
  revalidatePath("/", "layout");
}

export async function updateMemberAdminAction(
  memberId: string,
  input: { role: string; workEmail: string; dailyCapacityHours: number }
) {
  await requireRole(["LEADER", "ADMIN"]);
  await prisma.member.update({
    where: { id: memberId },
    data: {
      role: input.role as never,
      workEmail: input.workEmail,
      dailyCapacityHours: input.dailyCapacityHours,
    },
  });
  revalidatePath("/", "layout");
}

export async function resetPinAction(memberId: string, newPin: string) {
  await requireRole(["LEADER", "ADMIN"]);
  const pinHash = await hashPin(newPin);
  await prisma.member.update({ where: { id: memberId }, data: { pinHash } });
}

export async function changeMyPinAction(currentPin: string, newPin: string) {
  const member = await requireMember();
  const { verifyPin } = await import("@/lib/auth");
  const ok = await verifyPin(currentPin, member.pinHash);
  if (!ok) throw new Error("PIN ปัจจุบันไม่ถูกต้อง");
  const pinHash = await hashPin(newPin);
  await prisma.member.update({ where: { id: member.id }, data: { pinHash } });
}

export async function previewStoreUploadAction(formData: FormData): Promise<StoreUploadPreview> {
  await requireRole(["LEADER", "ADMIN"]);
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("NO_FILE");
  const buffer = await file.arrayBuffer();
  return parseStoreUpload(buffer);
}

export async function commitStoreUploadAction(preview: StoreUploadPreview) {
  await requireRole(["LEADER", "ADMIN"]);

  let created = 0;
  let updated = 0;

  for (const row of preview.rows) {
    if (row.kind === "unchanged") continue;
    if (row.kind === "new") {
      await prisma.store.create({
        data: { branchCode: row.branchCode, storeCode: row.storeCode, ...row.fields },
      });
      created++;
    } else if (row.storeId) {
      await prisma.store.update({ where: { id: row.storeId }, data: row.fields });
      updated++;
    }
  }

  revalidatePath("/", "layout");
  return { created, updated };
}
