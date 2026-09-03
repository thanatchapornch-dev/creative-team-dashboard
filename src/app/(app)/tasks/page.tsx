import { prisma } from "@/lib/prisma";
import { getCurrentMember } from "@/lib/auth";
import { deriveTaskBadge } from "@/lib/task-status";
import { PriorityPill, TaskBadgePill, TaskStatusPill } from "@/components/Pills";
import { TaskStatusSelect } from "@/components/TaskStatusSelect";
import { TaskCreateModal } from "@/components/TaskCreateModal";
import { TaskEditModal } from "@/components/TaskEditModal";

export default async function MyTasksPage() {
  const member = await getCurrentMember();
  if (!member) return null;

  const [tasks, members] = await Promise.all([
    prisma.task.findMany({
      where: { ownerId: member.id },
      include: { requester: true, backup: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.member.findMany({ select: { id: true, nickname: true }, orderBy: { createdAt: "asc" } }),
  ]);

  const now = new Date();
  const open = tasks.filter((t) => t.status !== "DONE");
  const done = tasks.filter((t) => t.status === "DONE");

  return (
    <div className="flex flex-col gap-6 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">My Tasks</h1>
        <TaskCreateModal members={members} defaultOwnerId={member.id} />
      </div>

      <div className="card divide-y" style={{ borderColor: "var(--line)" }}>
        {open.map((t) => (
          <div key={t.id} className="flex items-center justify-between px-4 py-3 gap-3">
            <div className="min-w-0">
              <p className="font-medium truncate">{t.taskCode} · {t.name}</p>
              <p className="text-xs text-[var(--muted)] truncate">
                {t.project} · Requested by {t.requester.nickname}
                {t.backup ? ` · Backup: ${t.backup.nickname}` : ""}
              </p>
              {t.brief && <p className="text-xs mt-1">{t.brief}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <PriorityPill priority={t.priority} />
              <TaskBadgePill badge={deriveTaskBadge(t.dueDate, t.status, now)} />
              <TaskStatusSelect taskId={t.id} status={t.status} />
              <TaskEditModal
                task={{
                  id: t.id,
                  name: t.name,
                  project: t.project,
                  ownerId: t.ownerId,
                  backupId: t.backupId,
                  priority: t.priority,
                  brief: t.brief,
                  startDate: t.startDate.toISOString().slice(0, 10),
                  dueDate: t.dueDate.toISOString().slice(0, 10),
                  estimatedHours: t.estimatedHours,
                  notes: t.notes,
                  attachmentUrl: t.attachmentUrl,
                  isPrivate: t.isPrivate,
                }}
                members={members}
              />
            </div>
          </div>
        ))}
        {open.length === 0 && <p className="px-4 py-6 text-sm text-[var(--muted)] text-center">ไม่มีงานที่เปิดอยู่ 🎉</p>}
      </div>

      {done.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">Completed</h2>
          <div className="card divide-y" style={{ borderColor: "var(--line)" }}>
            {done.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3 gap-3 opacity-70">
                <p className="truncate">{t.taskCode} · {t.name}</p>
                <TaskStatusPill status={t.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
