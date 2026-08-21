import { prisma } from "./prisma";
import { notify } from "./notify";
import { deriveTaskBadge } from "./task-status";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

async function alreadyNotifiedToday(relatedId: string, type: string, now: Date): Promise<boolean> {
  const today = startOfDay(now);
  const existing = await prisma.notificationLog.findFirst({
    where: { relatedId, type, createdAt: { gte: today } },
  });
  return existing !== null;
}

/**
 * Runs on every dashboard-shell render (cheap for a 5-person team). Idempotent:
 * at most one notification per task/type/day, so no duplicate emails/in-app
 * pings even though this fires on every page load — satisfies "don't send
 * the same reminder twice in one day" without needing a standing cron job.
 */
export async function runDeadlineSweep(now: Date = new Date()) {
  const openTasks = await prisma.task.findMany({ where: { status: { notIn: ["DONE"] } } });

  for (const task of openTasks) {
    const badge = deriveTaskBadge(task.dueDate, task.status, now);
    if (badge === "ON_TRACK" || badge === "DONE") continue;

    const type = badge === "OVERDUE" ? "TASK_OVERDUE" : badge === "DUE_TODAY" ? "TASK_DUE_TODAY" : "TASK_DUE_SOON";
    if (await alreadyNotifiedToday(task.id, type, now)) continue;

    const title =
      badge === "OVERDUE"
        ? `🔴 Overdue: ${task.name}`
        : badge === "DUE_TODAY"
          ? `🟠 Due Today: ${task.name}`
          : `🟡 Due Soon: ${task.name}`;

    await notify({
      recipientId: task.ownerId,
      type,
      title,
      body: `${task.project} · Due ${task.dueDate.toDateString()}.`,
      relatedType: "Task",
      relatedId: task.id,
      sendEmail: true,
    });
  }

  const overduePending = await prisma.leaveRequest.findMany({
    where: { status: "PENDING", approvalDeadline: { lt: now } },
  });
  const approvers = await prisma.member.findMany({ where: { role: { in: ["LEADER", "ADMIN"] } } });

  for (const leave of overduePending) {
    if (await alreadyNotifiedToday(leave.id, "APPROVAL_OVERDUE", now)) continue;
    for (const approver of approvers) {
      await notify({
        recipientId: approver.id,
        type: "APPROVAL_OVERDUE",
        title: "🔴 Approval Overdue",
        body: `A leave request has been pending past its approval deadline.`,
        relatedType: "LeaveRequest",
        relatedId: leave.id,
        sendEmail: true,
      });
    }
  }
}
