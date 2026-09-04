import { prisma } from "./prisma";

export type LoanConflict = {
  itemName: string;
  borrower: string;
  borrowDate: string;
  returnDate: string;
};

export function loanBorrowerLabel(loan: { borrower?: { nickname: string } | null; externalName: string; externalDept: string }): string {
  if (loan.borrower) return loan.borrower.nickname;
  return loan.externalDept ? `${loan.externalName} (${loan.externalDept})` : loan.externalName;
}

/** Any equipment already CONFIRMED-booked over an overlapping date range — used to hard-block a new request rather than just warn. */
export async function findEquipmentConflicts(
  itemIds: string[],
  borrowDate: Date,
  returnDate: Date
): Promise<LoanConflict[]> {
  const conflicts = await prisma.equipmentLoanItem.findMany({
    where: {
      equipmentItemId: { in: itemIds },
      loan: {
        status: "CONFIRMED",
        borrowDate: { lte: returnDate },
        returnDate: { gte: borrowDate },
      },
    },
    include: { loan: { include: { borrower: true } }, equipmentItem: true },
  });

  return conflicts.map((c) => ({
    itemName: c.equipmentItem.name,
    borrower: loanBorrowerLabel(c.loan),
    borrowDate: c.loan.borrowDate.toISOString().slice(0, 10),
    returnDate: c.loan.returnDate.toISOString().slice(0, 10),
  }));
}
