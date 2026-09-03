import { prisma } from "./prisma";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function endOfDay(d: Date) {
  const x = startOfDay(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const diff = x.getDay() === 0 ? -6 : 1 - x.getDay();
  x.setDate(x.getDate() + diff);
  return x;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export async function getMembersOnLeaveToday(now: Date = new Date()) {
  const today = startOfDay(now);
  return prisma.leaveRequest.findMany({
    where: { status: "APPROVED", startDate: { lte: today }, endDate: { gte: today } },
    include: { employee: true },
  });
}

export async function getTodaySummary(now: Date = new Date()) {
  const today = startOfDay(now);
  const todayEnd = endOfDay(now);
  const soonEnd = endOfDay(new Date(now.getTime() + 2 * 86400000));

  const [dueToday, overdue, dueSoon, onLeave, pendingApproval] = await Promise.all([
    prisma.task.count({ where: { status: { notIn: ["DONE"] }, dueDate: { gte: today, lte: todayEnd }, isPrivate: false } }),
    prisma.task.count({ where: { status: { notIn: ["DONE"] }, dueDate: { lt: today }, isPrivate: false } }),
    prisma.task.count({ where: { status: { notIn: ["DONE"] }, dueDate: { gt: todayEnd, lte: soonEnd }, isPrivate: false } }),
    getMembersOnLeaveToday(now),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
  ]);

  return { dueToday, overdue, dueSoon, onLeave, pendingApproval };
}

export async function getTeamSummary(now: Date = new Date()) {
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [totalOpen, completedThisWeek, leaveThisMonth, pendingApproval] = await Promise.all([
    prisma.task.count({ where: { status: { notIn: ["DONE"] }, isPrivate: false } }),
    prisma.task.count({ where: { status: "DONE", completedAt: { gte: weekStart }, isPrivate: false } }),
    prisma.leaveRequest.aggregate({
      _sum: { leaveDays: true },
      where: { status: "APPROVED", startDate: { lte: monthEnd }, endDate: { gte: monthStart } },
    }),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
  ]);

  return {
    totalOpen,
    completedThisWeek,
    leaveThisMonth: leaveThisMonth._sum.leaveDays ?? 0,
    pendingApproval,
  };
}

export function effectiveStatusToday(member: { statusToday: string }, isOnLeaveToday: boolean): string {
  if (isOnLeaveToday) return "LEAVE";
  return member.statusToday;
}
