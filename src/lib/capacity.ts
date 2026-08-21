import { prisma } from "./prisma";
import { isWorkingDay } from "./leave";
import { getSettings } from "./settings";

export type CapacityLevel = "HEALTHY" | "BUSY" | "HIGH_LOAD" | "OVER_CAPACITY";

export function capacityLevel(loadPct: number): CapacityLevel {
  if (loadPct > 100) return "OVER_CAPACITY";
  if (loadPct >= 90) return "HIGH_LOAD";
  if (loadPct >= 70) return "BUSY";
  return "HEALTHY";
}

export const CAPACITY_EMOJI: Record<CapacityLevel, string> = {
  HEALTHY: "🟢",
  BUSY: "🟡",
  HIGH_LOAD: "🟠",
  OVER_CAPACITY: "🔴",
};

function startOfWeek(now: Date): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

/**
 * Load % for one member: open-task estimated hours due within the current working
 * week, divided by working-day capacity for the week, minus hours already
 * consumed by approved leave that week.
 */
export async function computeMemberLoad(memberId: string, now: Date = new Date()) {
  const settings = await getSettings();
  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const member = await prisma.member.findUniqueOrThrow({ where: { id: memberId } });

  const openTasks = await prisma.task.findMany({
    where: {
      ownerId: memberId,
      status: { notIn: ["DONE"] },
      dueDate: { gte: weekStart, lte: weekEnd },
    },
  });
  const taskHours = openTasks.reduce((sum, t) => sum + t.estimatedHours, 0);

  const approvedLeave = await prisma.leaveRequest.findMany({
    where: {
      employeeId: memberId,
      status: "APPROVED",
      startDate: { lte: weekEnd },
      endDate: { gte: weekStart },
    },
  });

  let workingDaysInWeek = 0;
  let leaveDaysInWeek = 0;
  const cursor = new Date(weekStart);
  while (cursor <= weekEnd) {
    const isWorking = isWorkingDay(cursor, settings.workingDays, settings.holidays);
    if (isWorking) {
      workingDaysInWeek += 1;
      const onLeave = approvedLeave.some((l) => cursor >= toDateOnly(l.startDate) && cursor <= toDateOnly(l.endDate));
      if (onLeave) leaveDaysInWeek += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  const availableHours = Math.max(0, (workingDaysInWeek - leaveDaysInWeek) * member.dailyCapacityHours);
  const loadPct = availableHours === 0 ? (taskHours > 0 ? 999 : 0) : Math.round((taskHours / availableHours) * 100);

  return {
    memberId,
    taskHours,
    availableHours,
    leaveDaysInWeek,
    loadPct,
    level: capacityLevel(loadPct),
    openTaskCount: openTasks.length,
  };
}

function toDateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export async function computeTeamLoad(now: Date = new Date()) {
  const members = await prisma.member.findMany({ orderBy: { createdAt: "asc" } });
  return Promise.all(members.map((m) => computeMemberLoad(m.id, now)));
}
