import { prisma } from "@/lib/prisma";
import { getCurrentMember } from "@/lib/auth";
import { CalendarFilters } from "@/components/CalendarFilters";

const TYPE_COLOR: Record<string, string> = {
  ANNUAL: "var(--navy)",
  BUSINESS: "var(--orange)",
  SICK: "#c0392b",
  OTHER: "var(--muted)",
  URGENT: "#c0392b",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; person?: string; type?: string }>;
}) {
  const params = await searchParams;
  const viewer = await getCurrentMember();
  const isAdmin = viewer?.role === "LEADER" || viewer?.role === "ADMIN";
  const now = new Date();
  const month = params.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, monthNum] = month.split("-").map(Number);

  const monthStart = new Date(year, monthNum - 1, 1);
  const monthEnd = new Date(year, monthNum, 0, 23, 59, 59, 999);
  const daysInMonth = monthEnd.getDate();

  const members = await prisma.member.findMany({ orderBy: { createdAt: "asc" } });

  const where: Record<string, unknown> = {
    status: "APPROVED",
    startDate: { lte: monthEnd },
    endDate: { gte: monthStart },
  };
  if (params.person) where.employeeId = params.person;
  if (params.type) where.leaveType = params.type;

  const leaves = await prisma.leaveRequest.findMany({ where, include: { employee: true } });
  const visibleMembers = params.person ? members.filter((m) => m.id === params.person) : members;

  function leaveOn(memberId: string, day: number) {
    const date = new Date(year, monthNum - 1, day);
    return leaves.find((l) => l.employeeId === memberId && date >= l.startDate && date <= l.endDate);
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      <h1 className="text-xl font-bold">Team Calendar</h1>
      <CalendarFilters members={members.map((m) => ({ id: m.id, nickname: m.nickname }))} month={month} />

      <div className="card p-4 overflow-x-auto">
        <table className="text-xs border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 bg-[var(--paper)] pr-3 py-1 text-left">Member</th>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                const date = new Date(year, monthNum - 1, d);
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                return (
                  <th key={d} className="px-1 py-1 font-normal text-center" style={{ color: isWeekend ? "var(--muted)" : "inherit", minWidth: 22 }}>
                    {d}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleMembers.map((m) => (
              <tr key={m.id} className="border-t" style={{ borderColor: "var(--line)" }}>
                <td className="sticky left-0 bg-[var(--paper)] pr-3 py-2 font-medium whitespace-nowrap">{m.nickname}</td>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                  const leave = leaveOn(m.id, d);
                  const canSeeReason = leave && (isAdmin || leave.employeeId === viewer?.id);
                  return (
                    <td key={d} className="text-center py-2">
                      {leave && (
                        <span
                          title={canSeeReason ? `${leave.leaveType} — ${leave.reason}` : leave.leaveType}
                          className="inline-block rounded-full"
                          style={{ width: 10, height: 10, background: TYPE_COLOR[leave.leaveType] }}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-4 text-xs flex-wrap">
        {Object.entries(TYPE_COLOR).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1">
            <span className="inline-block rounded-full" style={{ width: 8, height: 8, background: color }} />
            {type}
          </span>
        ))}
      </div>
    </div>
  );
}
