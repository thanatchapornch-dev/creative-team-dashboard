import { prisma } from "@/lib/prisma";
import { getCurrentMember } from "@/lib/auth";
import { EquipmentBookingForm } from "@/components/EquipmentBookingForm";
import { cancelLoanAction } from "./actions";

export default async function EquipmentPage() {
  const member = await getCurrentMember();
  if (!member) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [items, loans] = await Promise.all([
    prisma.equipmentItem.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.equipmentLoan.findMany({
      where: { status: "CONFIRMED", returnDate: { gte: today } },
      include: { borrower: true, items: { include: { equipmentItem: true } } },
      orderBy: { borrowDate: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6 pt-2">
      <h1 className="text-xl font-bold">ยืมอุปกรณ์</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <EquipmentBookingForm items={items.map((i) => ({ id: i.id, name: i.name, category: i.category }))} />

        <div className="card p-5">
          <h2 className="font-bold mb-3">คิวที่จองไว้ (ปัจจุบัน–อนาคต)</h2>
          <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
            {loans.map((loan) => (
              <div key={loan.id} className="flex items-start justify-between gap-2 border-b pb-2 text-sm" style={{ borderColor: "var(--line)" }}>
                <div className="min-w-0">
                  <p className="font-medium">
                    {loan.borrower.nickname} · {loan.projectName}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {loan.borrowDate.toISOString().slice(0, 10)} – {loan.returnDate.toISOString().slice(0, 10)}
                  </p>
                  <p className="text-xs mt-1">{loan.items.map((i) => i.equipmentItem.name).join(", ")}</p>
                  {loan.otherNote && <p className="text-xs text-[var(--muted)]">อื่นๆ: {loan.otherNote}</p>}
                </div>
                {(loan.borrowerId === member.id || member.role === "LEADER" || member.role === "ADMIN") && (
                  <form action={cancelLoanAction.bind(null, loan.id)}>
                    <button type="submit" className="text-xs opacity-60 hover:opacity-100 shrink-0">
                      ยกเลิก
                    </button>
                  </form>
                )}
              </div>
            ))}
            {loans.length === 0 && <p className="text-sm text-[var(--muted)] text-center py-6">ยังไม่มีการจองที่จะถึง</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
