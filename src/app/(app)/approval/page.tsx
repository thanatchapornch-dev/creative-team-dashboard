import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentMember } from "@/lib/auth";
import { LeaveTypePill } from "@/components/Pills";
import { LeaveDecisionButtons } from "@/components/LeaveDecisionButtons";
import { ReassignTaskButton } from "@/components/ReassignTaskButton";

export default async function ApprovalPage() {
  const member = await getCurrentMember();
  if (!member) return null;
  if (member.role !== "LEADER" && member.role !== "ADMIN") redirect("/dashboard");

  const now = new Date();
  const [pending, members] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: { status: "PENDING" },
      include: { employee: true },
      orderBy: { requestedAt: "asc" },
    }),
    prisma.member.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const withImpact = await Promise.all(
    pending.map(async (l) => {
      const impacted = await prisma.task.findMany({
        where: {
          ownerId: l.employeeId,
          status: { notIn: ["DONE"] },
          startDate: { lte: l.endDate },
          dueDate: { gte: l.startDate },
        },
      });
      return { leave: l, impacted };
    })
  );

  return (
    <div className="flex flex-col gap-6 pt-2">
      <h1 className="text-xl font-bold">Approval</h1>
      {pending.length === 0 && (
        <p className="card p-6 text-sm text-[var(--muted)] text-center">ไม่มีคำขอลารออนุมัติ 🎉</p>
      )}

      <div className="flex flex-col gap-4">
        {withImpact.map(({ leave, impacted }) => {
          const overdue = now > leave.approvalDeadline;
          const candidates = members.filter((m) => m.id !== leave.employeeId);

          return (
            <div key={leave.id} className="card p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold">{leave.employee.nickname}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <LeaveTypePill type={leave.leaveType} />
                    <span className="text-xs text-[var(--muted)]">
                      {leave.startDate.toDateString()} – {leave.endDate.toDateString()} ({leave.leaveDays} days)
                    </span>
                  </div>
                  <p className="text-sm mt-2">{leave.reason}</p>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Requested {leave.requestedAt.toLocaleString()} · Advance notice: {leave.advanceNoticeDays} day(s)
                  </p>
                </div>
                <LeaveDecisionButtons leaveId={leave.id} />
              </div>

              {overdue && (
                <p className="pill pill-red self-start">🔴 Approval Overdue — deadline was {leave.approvalDeadline.toLocaleString()}</p>
              )}
              {!overdue && (
                <p className="text-xs text-[var(--muted)]">Approval deadline: {leave.approvalDeadline.toLocaleString()}</p>
              )}

              {impacted.length > 0 && (
                <div className="rounded-lg p-3" style={{ background: "#fff4e5" }}>
                  <p className="text-sm font-semibold" style={{ color: "#8a5a00" }}>
                    ⚠️ LEAVE IMPACT — {impacted.length} open task(s) overlap this leave period
                  </p>
                  <ul className="mt-2 flex flex-col gap-2">
                    {impacted.map((t) => (
                      <li key={t.id} className="flex items-center justify-between text-sm">
                        <span>{t.name} ({t.priority})</span>
                        <ReassignTaskButton taskId={t.id} candidates={candidates} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
