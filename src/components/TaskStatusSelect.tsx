"use client";

import { useTransition } from "react";
import { updateTaskStatusAction } from "@/app/(app)/tasks/actions";

const STATUSES = ["BACKLOG", "TODO", "IN_PROGRESS", "WAITING", "REVIEW", "DONE", "BLOCKED"];

export function TaskStatusSelect({ taskId, status }: { taskId: string; status: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(async () => {
          await updateTaskStatusAction(taskId, next);
        });
      }}
      className="text-xs rounded-lg border px-2 py-1"
      style={{ borderColor: "var(--line)", opacity: pending ? 0.6 : 1 }}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.replace("_", " ")}
        </option>
      ))}
    </select>
  );
}
