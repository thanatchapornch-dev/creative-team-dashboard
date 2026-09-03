"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { parseDateOnly } from "@/lib/date-only";

async function nextTaskCode(): Promise<string> {
  const count = await prisma.task.count();
  return `TSK-${String(count + 1).padStart(4, "0")}`;
}

export type TaskFormInput = {
  name: string;
  project: string;
  ownerId: string;
  backupId?: string;
  priority: string;
  brief?: string;
  startDate: string;
  dueDate: string;
  estimatedHours: number;
  notes?: string;
  attachmentUrl?: string;
  isPrivate?: boolean;
};

export async function createTaskAction(input: TaskFormInput) {
  const requester = await requireMember();
  const taskCode = await nextTaskCode();

  const task = await prisma.task.create({
    data: {
      taskCode,
      name: input.name,
      project: input.project,
      requesterId: requester.id,
      ownerId: input.ownerId,
      backupId: input.backupId || null,
      priority: input.priority as never,
      brief: input.brief ?? "",
      startDate: parseDateOnly(input.startDate),
      dueDate: parseDateOnly(input.dueDate),
      estimatedHours: input.estimatedHours,
      notes: input.notes ?? "",
      attachmentUrl: input.attachmentUrl ?? "",
      isPrivate: input.isPrivate ?? false,
    },
  });

  await notify({
    recipientId: task.ownerId,
    type: "TASK_ASSIGNED",
    title: `New Task: ${task.name}`,
    body: `${requester.nickname} assigned "${task.name}" (${task.project}) to you. Due ${task.dueDate.toDateString()}.`,
    relatedType: "Task",
    relatedId: task.id,
    sendEmail: true,
  });

  revalidatePath("/tasks");
  revalidatePath("/team-queue");
  revalidatePath("/dashboard");
  return task;
}

export async function updateTaskStatusAction(taskId: string, status: string) {
  await requireMember();
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: status as never,
      completedAt: status === "DONE" ? new Date() : null,
    },
  });
  revalidatePath("/tasks");
  revalidatePath("/team-queue");
  revalidatePath("/dashboard");
  return task;
}

export async function reassignTaskAction(taskId: string, newOwnerId: string) {
  const actor = await requireMember();
  const task = await prisma.task.update({ where: { id: taskId }, data: { ownerId: newOwnerId } });

  await notify({
    recipientId: newOwnerId,
    type: "TASK_ASSIGNED",
    title: `Task reassigned to you: ${task.name}`,
    body: `${actor.nickname} reassigned "${task.name}" (${task.project}) to you. Due ${task.dueDate.toDateString()}.`,
    relatedType: "Task",
    relatedId: task.id,
    sendEmail: true,
  });

  revalidatePath("/tasks");
  revalidatePath("/team-queue");
  revalidatePath("/dashboard");
  return task;
}

export async function updateTaskAction(taskId: string, input: Partial<TaskFormInput>) {
  await requireMember();
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.project !== undefined) data.project = input.project;
  if (input.ownerId !== undefined) data.ownerId = input.ownerId;
  if (input.backupId !== undefined) data.backupId = input.backupId || null;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.brief !== undefined) data.brief = input.brief;
  if (input.startDate !== undefined) data.startDate = parseDateOnly(input.startDate);
  if (input.dueDate !== undefined) data.dueDate = parseDateOnly(input.dueDate);
  if (input.estimatedHours !== undefined) data.estimatedHours = input.estimatedHours;
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.attachmentUrl !== undefined) data.attachmentUrl = input.attachmentUrl;
  if (input.isPrivate !== undefined) data.isPrivate = input.isPrivate;

  const task = await prisma.task.update({ where: { id: taskId }, data });
  revalidatePath("/tasks");
  revalidatePath("/team-queue");
  revalidatePath("/dashboard");
  return task;
}
