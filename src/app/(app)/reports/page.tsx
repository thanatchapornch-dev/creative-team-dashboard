import { prisma } from "@/lib/prisma";
import { computeTeamLoad, CAPACITY_EMOJI } from "@/lib/capacity";
import { sortLeaderFirst } from "@/lib/members";
import { CapacityBar } from "@/components/Pills";

export default async function ReportsPage() {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

  const [leaves, load, taskStats] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: { startDate: { gte: yearStart, lte: yearEnd } },
      include: { employee: true },
    }),
    computeTeamLoad(now),
    prisma.task.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const approved = leaves.filter((l) => l.status === "APPROVED");
  const pending = leaves.filter((l) => l.status === "PENDING");
  const rejected = leaves.filter((l) => l.status === "REJECTED");
  const urgent = leaves.filter((l) => l.leaveType === "URGENT");
  const totalDays = approved.reduce((s, l) => s + l.leaveDays, 0);
  const avgNotice =
    leaves.length > 0 ? Math.round(leaves.reduce((s, l) => s + l.advanceNoticeDays, 0) / leaves.length) : 0;

  const members = sortLeaderFirst(await prisma.member.findMany({ orderBy: { createdAt: "asc" } }));
  const loadByMember = new Map(load.map((l) => [l.memberId, l]));

  return (
    <div className="flex flex-col gap-8 pt-2">
      <h1 className="text-xl font-bold">Reports</h1>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">
          Leave Report ({now.getFullYear()})
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <div className="card p-4"><p className="text-xs text-[var(--muted)]">Total Leave Days</p><p className="text-2xl font-bold">{totalDays}</p></div>
          <div className="card p-4"><p className="text-xs text-[var(--muted)]">Approved</p><p className="text-2xl font-bold">{approved.length}</p></div>
          <div className="card p-4"><p className="text-xs text-[var(--muted)]">Pending</p><p className="text-2xl font-bold">{pending.length}</p></div>
          <div className="card p-4"><p className="text-xs text-[var(--muted)]">Rejected</p><p className="text-2xl font-bold">{rejected.length}</p></div>
          <div className="card p-4"><p className="text-xs text-[var(--muted)]">Urgent</p><p className="text-2xl font-bold">{urgent.length}</p></div>
        </div>
        <p className="text-sm text-[var(--muted)] mt-2">Average advance notice: {avgNotice} day(s)</p>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">Team Capacity (This Week)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {members.map((m) => {
            const l = loadByMember.get(m.id);
            return (
              <div key={m.id} className="card p-4 flex flex-col gap-2">
                <p className="font-semibold text-sm">{m.nickname}</p>
                <CapacityBar pct={l?.loadPct ?? 0} />
                <p className="text-xs text-[var(--muted)]">
                  {CAPACITY_EMOJI[l?.level ?? "HEALTHY"]} {l?.loadPct ?? 0}% Load · {l?.openTaskCount ?? 0} tasks
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">Task Status Breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {taskStats.map((s) => (
            <div key={s.status} className="card p-3 text-center">
              <p className="text-xs text-[var(--muted)]">{s.status.replace("_", " ")}</p>
              <p className="text-xl font-bold">{s._count._all}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
