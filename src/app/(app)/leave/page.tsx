import { prisma } from "@/lib/prisma";
import { getCurrentMember } from "@/lib/auth";
import { LeaveRequestForm } from "@/components/LeaveRequestForm";
import { LogLeaveForTeamForm } from "@/components/LogLeaveForTeamForm";
import { LeaveStatusPill, LeaveTypePill } from "@/components/Pills";

const LEAVE_TYPES = ["ANNUAL", "BUSINESS", "SICK", "OTHER", "URGENT"] as const;

export default async function LeavePage() {
  const member = await getCurrentMember();
  if (!member) return null;

  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const yearEnd = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999);

  const [myLeaves, allApproved, members] = await Promise.all([
    prisma.leaveRequest.findMany({ where: { employeeId: member.id }, orderBy: { requestedAt: "desc" } }),
    prisma.leaveRequest.findMany({
      where: { status: "APPROVED", startDate: { gte: yearStart, lte: yearEnd } },
      include: { employee: true },
    }),
    prisma.member.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const summary = members.map((m) => {
    const totals: Record<string, number> = { ANNUAL: 0, BUSINESS: 0, SICK: 0, OTHER: 0, URGENT: 0 };
    let total = 0;
    for (const l of allApproved) {
      if (l.employeeId === m.id) {
        totals[l.leaveType] += l.leaveDays;
        total += l.leaveDays;
      }
    }
    return { member: m, totals, total };
  });

  return (
    <div className="flex flex-col gap-6 pt-2">
      <h1 className="text-xl font-bold">Leave</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <LeaveRequestForm />

        <div className="md:col-span-2 card p-5">
          <h2 className="font-bold mb-3">My Leave History</h2>
          <div className="flex flex-col gap-2">
            {myLeaves.map((l) => (
              <div key={l.id} className="flex items-center justify-between text-sm border-b pb-2" style={{ borderColor: "var(--line)" }}>
                <div>
                  <div className="flex items-center gap-2">
                    <LeaveTypePill type={l.leaveType} />
                    <span className="text-[var(--muted)] text-xs">
                      {l.startDate.toDateString()} – {l.endDate.toDateString()} ({l.leaveDays} days)
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-1">{l.reason}</p>
                </div>
                <LeaveStatusPill status={l.status} />
              </div>
            ))}
            {myLeaves.length === 0 && <p className="text-sm text-[var(--muted)] text-center py-4">ยังไม่มีประวัติการลา</p>}
          </div>
        </div>
      </div>

      {(member.role === "LEADER" || member.role === "ADMIN") && (
        <LogLeaveForTeamForm members={members.filter((m) => m.id !== member.id).map((m) => ({ id: m.id, nickname: m.nickname }))} />
      )}

      <div className="card p-5">
        <h2 className="font-bold mb-3">Team Leave Summary ({new Date().getFullYear()})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-[var(--muted)]">
                <th className="py-2">Member</th>
                {LEAVE_TYPES.map((t) => <th key={t} className="py-2">{t}</th>)}
                <th className="py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((s) => (
                <tr key={s.member.id} className="border-t" style={{ borderColor: "var(--line)" }}>
                  <td className="py-2 font-medium">{s.member.nickname}</td>
                  {LEAVE_TYPES.map((t) => <td key={t} className="py-2">{s.totals[t]}</td>)}
                  <td className="py-2 font-semibold">{s.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
