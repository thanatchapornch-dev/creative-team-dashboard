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
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-semibold" style={{ color: "var(--orange)" }}>
        Reassign Task
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        autoFocus
        disabled={pending}
        defaultValue=""
        onChange={(e) => {
          const newOwnerId = e.target.value;
          if (!newOwnerId) return;
          setError(null);
          startTransition(async () => {
            try {
              await reassignTaskAction(taskId, newOwnerId);
              setOpen(false);
              router.refresh();
            } catch (err) {
              if (err instanceof Error && err.message === "UNAUTHENTICATED") {
                setError("เซสชันหมดอายุ กรุณาล็อกอินใหม่");
                setTimeout(() => router.push("/login"), 1500);
                return;
              }
              setError("มอบหมายงานไม่สำเร็จ ลองใหม่อีกครั้ง");
            }
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
      {error && <p className="text-xs" style={{ color: "#a12b2b" }}>⚠️ {error}</p>}
    </div>
  );
}
