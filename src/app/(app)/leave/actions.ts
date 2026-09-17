"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember, requireRole } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { getSettings } from "@/lib/settings";
import { advanceNoticeDays, annualLeaveNoticeWarning, approvalDeadline, countLeaveDays } from "@/lib/leave";
import { parseDateOnly } from "@/lib/date-only";

export type LeaveFormInput = {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  attachmentUrl?: string;
};

export async function submitLeaveAction(input: LeaveFormInput) {
  const employee = await requireMember();
  const settings = await getSettings();
  const now = new Date();
  const start = parseDateOnly(input.startDate);
  const end = parseDateOnly(input.endDate);

  const leaveDays = countLeaveDays(start, end, settings.workingDays, settings.holidays);
  const notice = advanceNoticeDays(now, start);
  const warning = annualLeaveNoticeWarning(input.leaveType, now, start, settings.annualLeaveNoticeDays);
  const deadline = approvalDeadline(now, settings.approvalSlaDays);

  const leave = await prisma.leaveRequest.create({
    data: {
      employeeId: employee.id,
      leaveType: input.leaveType as never,
      reason: input.reason,
      startDate: start,
      endDate: end,
      leaveDays,
      requestedAt: now,
      approvalDeadline: deadline,
      advanceNoticeDays: notice,
      attachmentUrl: input.attachmentUrl ?? "",
    },
  });

  const approvers = await prisma.member.findMany({ where: { role: { in: ["LEADER", "ADMIN"] } } });
  const isUrgent = input.leaveType === "URGENT";

  // The leave request is already committed at this point — nothing below may
  // throw and hide that success from the employee who just submitted it.
  for (const approver of approvers) {
    try {
      await notify({
        recipientId: approver.id,
        type: isUrgent ? "LEAVE_URGENT" : "LEAVE_SUBMITTED",
        title: isUrgent ? `🚨 Urgent Leave: ${employee.nickname}` : `Leave Approval Required: ${employee.nickname}`,
        body: `${employee.nickname} requested ${input.leaveType} leave, ${leaveDays} day(s), ${start.toDateString()}–${end.toDateString()}. Approve within ${settings.approvalSlaDays} days.`,
        relatedType: "LeaveRequest",
        relatedId: leave.id,
        sendEmail: true,
      });
    } catch (err) {
      console.error("notify approver failed for leave request", leave.id, approver.id, err);
    }
  }

  try {
    revalidatePath("/leave");
    revalidatePath("/approval");
    revalidatePath("/dashboard");
    revalidatePath("/calendar");
  } catch (err) {
    console.error("revalidatePath failed for leave request", leave.id, err);
  }

  return { leave, warning };
}

export type LogLeaveInput = {
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  note?: string;
};

/**
 * For leave already approved elsewhere (e.g. the company HR system) — DN/Admin
 * logs it once here so the team calendar/dashboard reflect it, without making
 * every employee re-submit the same request in both places.
 */
export async function logApprovedLeaveAction(input: LogLeaveInput) {
  const approver = await requireRole(["LEADER", "ADMIN"]);
  const settings = await getSettings();
  const now = new Date();
  const start = parseDateOnly(input.startDate);
  const end = parseDateOnly(input.endDate);

  const leaveDays = countLeaveDays(start, end, settings.workingDays, settings.holidays);
  const notice = advanceNoticeDays(now, start);

  const leave = await prisma.leaveRequest.create({
    data: {
      employeeId: input.employeeId,
      leaveType: input.leaveType as never,
      reason: input.note?.trim() || "บันทึกโดย " + approver.nickname + " (อนุมัติแล้วในระบบ HR)",
      startDate: start,
      endDate: end,
      leaveDays,
      requestedAt: now,
      status: "APPROVED",
      approverId: approver.id,
      decidedAt: now,
      approvalDeadline: now,
      advanceNoticeDays: notice,
    },
    include: { employee: true },
  });

  // The leave is already logged at this point — nothing below may throw and
  // hide that success from the DN/Admin who just logged it.
  try {
    await notify({
      recipientId: leave.employeeId,
      type: "LEAVE_APPROVED",
      title: "Leave Logged",
      body: `${approver.nickname} บันทึกวันลาของคุณ (${leave.leaveType}) ${start.toDateString()}–${end.toDateString()} ลงในแดชบอร์ดแล้ว`,
      relatedType: "LeaveRequest",
      relatedId: leave.id,
    });
  } catch (err) {
    console.error("notify employee failed for logged leave", leave.id, err);
  }

  try {
    const impacted = await prisma.task.findMany({
      where: {
        ownerId: leave.employeeId,
        status: { notIn: ["DONE"] },
        startDate: { lte: leave.endDate },
        dueDate: { gte: leave.startDate },
      },
    });
    if (impacted.length > 0) {
      await notify({
        recipientId: approver.id,
        type: "LEAVE_IMPACT",
        title: `LEAVE IMPACT: ${leave.employee.nickname}`,
        body: `${leave.employee.nickname} is on leave ${leave.startDate.toDateString()}–${leave.endDate.toDateString()}. ${impacted.length} open task(s) may need reassignment.`,
        relatedType: "LeaveRequest",
        relatedId: leave.id,
      });
    }
  } catch (err) {
    console.error("notify impact failed for logged leave", leave.id, err);
  }

  try {
    revalidatePath("/leave");
    revalidatePath("/approval");
    revalidatePath("/dashboard");
    revalidatePath("/calendar");
  } catch (err) {
    console.error("revalidatePath failed for logged leave", leave.id, err);
  }
  return leave;
}

export async function decideLeaveAction(leaveId: string, decision: "APPROVED" | "REJECTED") {
  const approver = await requireRole(["LEADER", "ADMIN"]);
  const leave = await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: { status: decision, approverId: approver.id, decidedAt: new Date() },
    include: { employee: true },
  });

  // The decision is already committed at this point — nothing below may
  // throw and hide that success from the approver who just decided it.
  try {
    await notify({
      recipientId: leave.employeeId,
      type: decision === "APPROVED" ? "LEAVE_APPROVED" : "LEAVE_REJECTED",
      title: decision === "APPROVED" ? "Leave Approved" : "Leave Rejected",
      body: `Your ${leave.leaveType} leave (${leave.startDate.toDateString()}–${leave.endDate.toDateString()}) was ${decision.toLowerCase()} by ${approver.nickname}.`,
      relatedType: "LeaveRequest",
      relatedId: leave.id,
      sendEmail: true,
    });
  } catch (err) {
    console.error("notify employee failed for leave decision", leave.id, err);
  }

  if (decision === "APPROVED") {
    try {
      const impacted = await prisma.task.findMany({
        where: {
          ownerId: leave.employeeId,
          status: { notIn: ["DONE"] },
          startDate: { lte: leave.endDate },
          dueDate: { gte: leave.startDate },
        },
      });
      if (impacted.length > 0) {
        await notify({
          recipientId: approver.id,
          type: "LEAVE_IMPACT",
          title: `LEAVE IMPACT: ${leave.employee.nickname}`,
          body: `${leave.employee.nickname} is on leave ${leave.startDate.toDateString()}–${leave.endDate.toDateString()}. ${impacted.length} open task(s) may need reassignment.`,
          relatedType: "LeaveRequest",
          relatedId: leave.id,
          sendEmail: true,
        });
      }
    } catch (err) {
      console.error("notify impact failed for leave decision", leave.id, err);
    }
  }

  try {
    revalidatePath("/leave");
    revalidatePath("/approval");
    revalidatePath("/dashboard");
    revalidatePath("/calendar");
  } catch (err) {
    console.error("revalidatePath failed for leave decision", leave.id, err);
  }
  return leave;
}
