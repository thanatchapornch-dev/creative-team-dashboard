"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTaskStatusAction } from "@/app/(app)/tasks/actions";

const STATUSES = ["BACKLOG", "TODO", "IN_PROGRESS", "WAITING", "REVIEW", "DONE", "BLOCKED"];

export function TaskStatusSelect({ taskId, status }: { taskId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        value={status}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          setError(null);
          startTransition(async () => {
            try {
              await updateTaskStatusAction(taskId, next);
              router.refresh();
            } catch (err) {
              if (err instanceof Error && err.message === "UNAUTHENTICATED") {
                setError("เซสชันหมดอายุ กรุณาล็อกอินใหม่");
                setTimeout(() => router.push("/login"), 1500);
                return;
              }
              setError("อัปเดทสถานะไม่สำเร็จ ลองใหม่อีกครั้ง");
            }
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
      {error && <p className="text-xs" style={{ color: "#a12b2b" }}>⚠️ {error}</p>}
    </div>
  );
}
