import { prisma } from "@/lib/prisma";
import { getCurrentMember } from "@/lib/auth";
import { deriveTaskBadge } from "@/lib/task-status";
import { PriorityPill, TaskBadgePill } from "@/components/Pills";
import { TaskStatusSelect } from "@/components/TaskStatusSelect";
import { TaskCreateModal } from "@/components/TaskCreateModal";
import { TaskEditModal } from "@/components/TaskEditModal";
import { TeamQueueFilters } from "@/components/TeamQueueFilters";

const STATUS_COLUMNS = ["BACKLOG", "TODO", "IN_PROGRESS", "WAITING", "REVIEW", "DONE", "BLOCKED"];
const STATUS_LABEL: Record<string, string> = {
  BACKLOG: "Backlog",
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  WAITING: "Waiting",
  REVIEW: "Review",
  DONE: "Done",
  BLOCKED: "Blocked",
};

export default async function TeamQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; member?: string; priority?: string; project?: string }>;
}) {
  const params = await searchParams;
  const member = await getCurrentMember();
  if (!member) return null;

  const where: Record<string, unknown> = {
    OR: [{ isPrivate: false }, { ownerId: member.id }],
  };
  if (params.member) where.ownerId = params.member;
  if (params.priority) where.priority = params.priority;
  if (params.project) where.project = params.project;

  const [tasks, members, allProjects] = await Promise.all([
    prisma.task.findMany({ where, include: { owner: true }, orderBy: { dueDate: "asc" } }),
    prisma.member.findMany({ select: { id: true, nickname: true }, orderBy: { createdAt: "asc" } }),
    prisma.task.findMany({
      where: { OR: [{ isPrivate: false }, { ownerId: member.id }] },
      select: { project: true },
      distinct: ["project"],
    }),
  ]);

  const now = new Date();
  const view = params.view ?? "status";
  const projects = allProjects.map((p) => p.project).filter(Boolean);

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Team Queue</h1>
        <TaskCreateModal members={members} />
      </div>

      <TeamQueueFilters members={members.map((m) => ({ id: m.id, label: m.nickname }))} projects={projects} />

      {view === "member" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {members
            .filter((m) => !params.member || m.id === params.member)
            .map((m) => {
              const memberTasks = tasks.filter((t) => t.ownerId === m.id && t.status !== "DONE");
              return (
                <div key={m.id} className="card p-3 flex flex-col gap-2">
                  <p className="font-bold text-sm">{m.nickname}</p>
                  <hr style={{ borderColor: "var(--line)" }} />
                  {memberTasks.map((t) => (
                    <div key={t.id} className="rounded-lg p-2 text-xs flex flex-col gap-1" style={{ background: "var(--offwhite)" }}>
                      <p className="font-medium">{t.name}</p>
                      <div className="flex items-center gap-1 flex-wrap">
                        <PriorityPill priority={t.priority} />
                        <TaskBadgePill badge={deriveTaskBadge(t.dueDate, t.status, now)} />
                      </div>
                    </div>
                  ))}
                  {memberTasks.length === 0 && <p className="text-xs text-[var(--muted)] text-center py-2">No open tasks</p>}
                </div>
              );
            })}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STATUS_COLUMNS.map((status) => {
            const colTasks = tasks.filter((t) => t.status === status);
            return (
              <div key={status} className="flex flex-col gap-2 w-[180px] shrink-0">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                  {STATUS_LABEL[status]} <span className="opacity-60">({colTasks.length})</span>
                </p>
                <div className="flex flex-col gap-2">
                  {colTasks.map((t) => (
                    <div key={t.id} className="card p-3 flex flex-col gap-2 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{t.isPrivate ? "🔒 " : ""}{t.name}</p>
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
                      <p className="text-[var(--muted)]">{t.owner.nickname} · {t.project}</p>
                      <div className="flex items-center gap-1 flex-wrap">
                        <PriorityPill priority={t.priority} />
                        <TaskBadgePill badge={deriveTaskBadge(t.dueDate, t.status, now)} />
                      </div>
                      <TaskStatusSelect taskId={t.id} status={t.status} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
