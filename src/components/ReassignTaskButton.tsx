"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reassignTaskAction } from "@/app/(app)/tasks/actions";

export function ReassignTaskButton({
  taskId,
  candidates,
}: {
  taskId: string;
  candidates: { id: string; nickname: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-semibold" style={{ color: "var(--orange)" }}>
        Reassign Task
      </button>
    );
  }

  return (
    <select
      autoFocus
      disabled={pending}
      defaultValue=""
      onChange={(e) => {
        const newOwnerId = e.target.value;
        if (!newOwnerId) return;
        startTransition(async () => {
          await reassignTaskAction(taskId, newOwnerId);
          setOpen(false);
          router.refresh();
        });
      }}
      className="text-xs rounded-lg border px-2 py-1"
      style={{ borderColor: "var(--line)" }}
    >
      <option value="" disabled>Reassign to…</option>
      {candidates.map((c) => (
        <option key={c.id} value={c.id}>{c.nickname}</option>
      ))}
    </select>
  );
}
