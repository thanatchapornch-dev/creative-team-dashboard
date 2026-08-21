import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getMembersOnLeaveToday, getTeamSummary, getTodaySummary, effectiveStatusToday } from "@/lib/dashboard";
import { Avatar } from "@/components/Avatar";
import { StatusTodayPill, PriorityPill, TaskBadgePill } from "@/components/Pills";
import { deriveTaskBadge } from "@/lib/task-status";

function SummaryCard({ label, value, tone }: { label: string; value: string | number; tone?: "orange" | "lime" | "navy" }) {
  const color = tone === "orange" ? "var(--orange)" : tone === "lime" ? "var(--lime)" : "var(--navy)";
  return (
    <div className="card p-4 flex flex-col gap-1">
      <span className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

export default async function DashboardPage() {
  const now = new Date();
  const [membersRaw, today, team, onLeave] = await Promise.all([
    prisma.member.findMany({ orderBy: { createdAt: "asc" } }),
    getTodaySummary(now),
    getTeamSummary(now),
    getMembersOnLeaveToday(now),
  ]);
  // Team leader/admin shows first on the home page, regardless of when they were added.
  const members = [...membersRaw].sort((a, b) => {
    const aLead = a.role !== "MEMBER" ? 0 : 1;
    const bLead = b.role !== "MEMBER" ? 0 : 1;
    return aLead - bLead;
  });
  const onLeaveIds = new Set(onLeave.map((l) => l.employeeId));

  const dueSoonTasks = await prisma.task.findMany({
    where: { status: { notIn: ["DONE"] } },
    include: { owner: true },
    orderBy: { dueDate: "asc" },
    take: 8,
  });

  const dateLabel = now.toLocaleDateString("th-TH", { day: "numeric", month: "short" }).toUpperCase();

  return (
    <div className="flex flex-col gap-8 pt-2">
      <section>
        <h1 className="text-xl font-bold mb-4">TODAY · {dateLabel}</h1>
        <div className="grid grid-cols-5 gap-4">
          {members.map((m) => (
            <div key={m.id} className="card p-4 flex flex-col items-center gap-2 text-center">
              <Avatar name={m.nickname} src={m.profilePictureUrl} size={56} />
              <span className="font-semibold">{m.nickname}</span>
              <span className="text-xs text-[var(--muted)]">{m.position}</span>
              <StatusTodayPill status={effectiveStatusToday(m, onLeaveIds.has(m.id))} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">Today</h2>
        <div className="grid grid-cols-5 gap-4">
          <SummaryCard label="Due Today" value={today.dueToday} tone="orange" />
          <SummaryCard label="Overdue" value={today.overdue} tone="orange" />
          <SummaryCard label="Due Soon" value={today.dueSoon} />
          <SummaryCard label="On Leave" value={today.onLeave.length} />
          <SummaryCard label="Pending Approval" value={today.pendingApproval} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">Team</h2>
        <div className="grid grid-cols-4 gap-4">
          <SummaryCard label="Total Open Tasks" value={team.totalOpen} tone="lime" />
          <SummaryCard label="Completed This Week" value={team.completedThisWeek} tone="lime" />
          <SummaryCard label="Team Leave This Month" value={`${team.leaveThisMonth} days`} />
          <SummaryCard label="Pending Leave Approval" value={team.pendingApproval} />
        </div>
      </section>

      {onLeave.length > 0 && (
        <section className="card p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">🏖️ On Leave Today</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {onLeave.map((l) => (
              <li key={l.id}>
                <span className="font-medium">{l.employee.nickname}</span> — {l.leaveType}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Upcoming Work</h2>
          <Link href="/team-queue" className="text-sm font-medium" style={{ color: "var(--orange)" }}>
            View Team Queue →
          </Link>
        </div>
        <div className="card divide-y" style={{ borderColor: "var(--line)" }}>
          {dueSoonTasks.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-[var(--muted)]">{t.owner.nickname} · {t.project}</p>
              </div>
              <div className="flex items-center gap-2">
                <PriorityPill priority={t.priority} />
                <TaskBadgePill badge={deriveTaskBadge(t.dueDate, t.status, now)} />
              </div>
            </div>
          ))}
          {dueSoonTasks.length === 0 && <p className="px-4 py-6 text-sm text-[var(--muted)] text-center">ไม่มีงานที่เปิดอยู่</p>}
        </div>
      </section>
    </div>
  );
}
