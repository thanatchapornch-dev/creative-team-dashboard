"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { notify, notifyExternalEmail } from "@/lib/notify";
import { parseDateOnly } from "@/lib/date-only";
import { findEquipmentConflicts, type LoanConflict } from "@/lib/equipment";

export type PublicLoanInput = {
  name: string;
  contact: string;
  email: string;
  department: string;
  projectName: string;
  itemIds: string[];
  borrowDate: string;
  returnDate: string;
  otherNote?: string;
};

export async function createPublicLoanRequestAction(
  input: PublicLoanInput
): Promise<{ ok: true } | { ok: false; conflicts: LoanConflict[] }> {
  if (input.itemIds.length === 0) throw new Error("NO_ITEMS");
  if (!input.name.trim()) throw new Error("NO_NAME");

  const borrowDate = parseDateOnly(input.borrowDate);
  const returnDate = parseDateOnly(input.returnDate);
  if (returnDate < borrowDate) throw new Error("INVALID_DATES");

  const conflicts = await findEquipmentConflicts(input.itemIds, borrowDate, returnDate);
  if (conflicts.length > 0) {
    return { ok: false, conflicts };
  }

  const loan = await prisma.equipmentLoan.create({
    data: {
      borrowerId: null,
      externalName: input.name.trim(),
      externalContact: input.contact.trim(),
      externalEmail: input.email.trim(),
      externalDept: input.department.trim(),
      projectName: input.projectName,
      otherNote: input.otherNote ?? "",
      borrowDate,
      returnDate,
      status: "CONFIRMED",
      items: { create: input.itemIds.map((id) => ({ equipmentItemId: id })) },
    },
    include: { items: { include: { equipmentItem: true } } },
  });

  const itemNames = loan.items.map((i) => i.equipmentItem.name).join(", ");
  const dateRange = `${loan.borrowDate.toDateString()} – ${loan.returnDate.toDateString()}`;

  await notifyExternalEmail({
    email: input.email.trim(),
    type: "EQUIPMENT_LOAN_EXTERNAL_CONFIRMED",
    title: `ยืนยันคำขอยืมอุปกรณ์ — ${loan.projectName}`,
    body: `สวัสดีคุณ ${input.name}\n\nทีม Creative & Production (CJx) ได้รับคำขอยืมอุปกรณ์ของคุณแล้ว:\n\nรายการอุปกรณ์: ${itemNames}\nโปรเจกต์: ${loan.projectName}\nวันที่ยืม: ${loan.borrowDate.toDateString()}\nวันที่คืน: ${loan.returnDate.toDateString()}\n\nทีมงานจะติดต่อกลับภายใน 1 วันเพื่อนัดรับ-คืนอุปกรณ์ หากมีข้อสงสัยติดต่อกลับได้ที่อีเมลนี้\n\nขอบคุณค่ะ\nทีม Creative & Production, CJx`,
  });

  const dn = await prisma.member.findFirst({ where: { role: "LEADER" } });
  if (dn) {
    await notify({
      recipientId: dn.id,
      type: "EQUIPMENT_LOAN_EXTERNAL",
      title: `📷 คำขอยืมอุปกรณ์จากภายนอก: ${input.name}`,
      body: `${input.name} (${input.department || "ไม่ระบุแผนก"}) ขอยืม: ${itemNames}\nโปรเจกต์: ${loan.projectName}\nวันที่: ${dateRange}\nติดต่อ: ${input.contact} · ${input.email}\n\nรบกวนเช็คภายใน 1 วัน`,
      sendEmail: true,
    });
  }

  revalidatePath("/equipment");
  return { ok: true };
}
