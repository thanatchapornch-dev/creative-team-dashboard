"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember, requireRole } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { parseDateOnly } from "@/lib/date-only";

export type CreateLoanInput = {
  projectName: string;
  itemIds: string[];
  borrowDate: string;
  returnDate: string;
  otherNote?: string;
};

export type LoanConflict = {
  itemName: string;
  borrower: string;
  borrowDate: string;
  returnDate: string;
};

export async function createLoanAction(
  input: CreateLoanInput
): Promise<{ ok: true } | { ok: false; conflicts: LoanConflict[] }> {
  const member = await requireMember();
  if (input.itemIds.length === 0) throw new Error("NO_ITEMS");

  const borrowDate = parseDateOnly(input.borrowDate);
  const returnDate = parseDateOnly(input.returnDate);
  if (returnDate < borrowDate) throw new Error("INVALID_DATES");

  const conflicts = await prisma.equipmentLoanItem.findMany({
    where: {
      equipmentItemId: { in: input.itemIds },
      loan: {
        status: "CONFIRMED",
        borrowDate: { lte: returnDate },
        returnDate: { gte: borrowDate },
      },
    },
    include: { loan: { include: { borrower: true } }, equipmentItem: true },
  });

  if (conflicts.length > 0) {
    return {
      ok: false,
      conflicts: conflicts.map((c) => ({
        itemName: c.equipmentItem.name,
        borrower: c.loan.borrower.nickname,
        borrowDate: c.loan.borrowDate.toISOString().slice(0, 10),
        returnDate: c.loan.returnDate.toISOString().slice(0, 10),
      })),
    };
  }

  const loan = await prisma.equipmentLoan.create({
    data: {
      borrowerId: member.id,
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

  await notify({
    recipientId: member.id,
    type: "EQUIPMENT_LOAN_CONFIRMED",
    title: "📷 รับคำขอยืมอุปกรณ์แล้ว",
    body: `รับคำขอยืมอุปกรณ์ของคุณแล้ว: ${itemNames}\nวันที่: ${dateRange}\nโปรเจกต์: ${loan.projectName}\n\nจะติดต่อกลับภายใน 1 วันถ้ามีปัญหา`,
    sendEmail: true,
  });

  const dn = await prisma.member.findFirst({ where: { role: "LEADER" } });
  if (dn && dn.id !== member.id) {
    await notify({
      recipientId: dn.id,
      type: "EQUIPMENT_LOAN_NEW",
      title: `📷 มีการจองอุปกรณ์ใหม่: ${member.nickname}`,
      body: `${member.nickname} จองอุปกรณ์: ${itemNames}\nวันที่: ${dateRange}\nโปรเจกต์: ${loan.projectName}\n\nรบกวนเช็คภายใน 1 วัน`,
      sendEmail: true,
    });
  }

  revalidatePath("/equipment");
  return { ok: true };
}

export async function cancelLoanAction(loanId: string) {
  await requireMember();
  await prisma.equipmentLoan.update({ where: { id: loanId }, data: { status: "CANCELLED" } });
  revalidatePath("/equipment");
}

export async function addEquipmentItemAction(input: { name: string; category: string }) {
  await requireRole(["LEADER", "ADMIN"]);
  const maxSort = await prisma.equipmentItem.aggregate({ _max: { sortOrder: true } });
  await prisma.equipmentItem.create({
    data: { name: input.name, category: input.category, sortOrder: (maxSort._max.sortOrder ?? 0) + 1 },
  });
  revalidatePath("/equipment");
  revalidatePath("/settings");
}

export async function setEquipmentItemActiveAction(itemId: string, active: boolean) {
  await requireRole(["LEADER", "ADMIN"]);
  await prisma.equipmentItem.update({ where: { id: itemId }, data: { active } });
  revalidatePath("/equipment");
  revalidatePath("/settings");
}
