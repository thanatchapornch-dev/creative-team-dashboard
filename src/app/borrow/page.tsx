import { prisma } from "@/lib/prisma";
import { PublicLoanForm } from "@/components/PublicLoanForm";

export default async function PublicBorrowPage() {
  const items = await prisma.equipmentItem.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: "var(--offwhite)" }}>
      <PublicLoanForm items={items.map((i) => ({ id: i.id, name: i.name, category: i.category }))} />
    </div>
  );
}
