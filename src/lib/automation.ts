import { prisma } from "./prisma";
import { notify } from "./notify";
import { deriveTaskBadge } from "./task-status";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Runs on every dashboard-shell render (cheap for a 5-person team). Idempotent:
 * at most one notification per task/type/day, so no duplicate emails/in-app
 * pings even though this fires on every page load — satisfies "don't send
 * the same reminder twice in one day" without needing a standing cron job.
 *
 * Today's notifications are fetched once up front (not per-task/per-leave)
 * since each round trip to the database costs real latency here — batching
 * keeps this sweep to a fixed number of queries regardless of task count.
 */
export async function runDeadlineSweep(now: Date = new Date()) {
  const today = startOfDay(now);
  const [openTasks, overduePending, approvers, notifiedToday] = await Promise.all([
    prisma.task.findMany({ where: { status: { notIn: ["DONE"] } } }),
    prisma.leaveRequest.findMany({ where: { status: "PENDING", approvalDeadline: { lt: now } } }),
    prisma.member.findMany({ where: { role: { in: ["LEADER", "ADMIN"] } } }),
    prisma.notificationLog.findMany({
      where: { createdAt: { gte: today } },
      select: { relatedId: true, type: true },
    }),
  ]);

  const alreadyNotified = new Set(notifiedToday.map((n) => `${n.relatedId}:${n.type}`));

  for (const task of openTasks) {
    const badge = deriveTaskBadge(task.dueDate, task.status, now);
    if (badge === "ON_TRACK" || badge === "DONE") continue;

    const type = badge === "OVERDUE" ? "TASK_OVERDUE" : badge === "DUE_TODAY" ? "TASK_DUE_TODAY" : "TASK_DUE_SOON";
    if (alreadyNotified.has(`${task.id}:${type}`)) continue;

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

  for (const leave of overduePending) {
    if (alreadyNotified.has(`${leave.id}:APPROVAL_OVERDUE`)) continue;
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
