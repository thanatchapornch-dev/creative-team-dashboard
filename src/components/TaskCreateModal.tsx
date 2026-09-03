"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTaskAction } from "@/app/(app)/tasks/actions";

type MemberOption = { id: string; nickname: string };

const PRIORITIES = ["URGENT", "HIGH", "MEDIUM", "LOW"];

export function TaskCreateModal({ members, defaultOwnerId }: { members: MemberOption[]; defaultOwnerId?: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full px-4 py-2 text-sm font-semibold"
        style={{ background: "var(--orange)", color: "white" }}
      >
        + New Task
      </button>

      {open && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4" style={{ background: "rgba(15,27,51,0.45)" }}>
          <form
            ref={formRef}
            className="card w-full max-w-lg p-6 flex flex-col gap-3 max-h-[85vh] overflow-y-auto"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startTransition(async () => {
                await createTaskAction({
                  name: String(fd.get("name")),
                  project: String(fd.get("project")),
                  ownerId: String(fd.get("ownerId")),
                  backupId: String(fd.get("backupId") || ""),
                  priority: String(fd.get("priority")),
                  brief: String(fd.get("brief") || ""),
                  startDate: String(fd.get("startDate")),
                  dueDate: String(fd.get("dueDate")),
                  estimatedHours: Number(fd.get("estimatedHours") || 1),
                  notes: String(fd.get("notes") || ""),
                  attachmentUrl: String(fd.get("attachmentUrl") || ""),
                  isPrivate: fd.get("isPrivate") === "on",
                });
                setOpen(false);
                formRef.current?.reset();
                router.refresh();
              });
            }}
          >
            <h2 className="font-bold text-lg">New Task</h2>
            <input name="name" placeholder="Task Name" required className="input" />
            <input name="project" placeholder="Project / Campaign" required className="input" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select name="ownerId" defaultValue={defaultOwnerId} required className="input">
                <option value="" disabled>Owner</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.nickname}</option>
                ))}
              </select>
              <select name="backupId" className="input" defaultValue="">
                <option value="">Backup (optional)</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.nickname}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select name="priority" defaultValue="MEDIUM" className="input">
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <input name="estimatedHours" type="number" min="0.5" step="0.5" defaultValue={2} className="input" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-xs text-[var(--muted)] flex flex-col gap-1">
                Start Date
                <input name="startDate" type="date" defaultValue={today} required className="input" />
              </label>
              <label className="text-xs text-[var(--muted)] flex flex-col gap-1">
                Due Date
                <input name="dueDate" type="date" defaultValue={today} required className="input" />
              </label>
            </div>
            <textarea name="brief" placeholder="Brief" className="input" rows={2} />
            <textarea name="notes" placeholder="Notes" className="input" rows={2} />
            <input name="attachmentUrl" placeholder="Attachment / Link (URL)" className="input" />
            <label className="flex items-center gap-2 text-sm">
              <input name="isPrivate" type="checkbox" />
              🔒 ส่วนตัว — เฉพาะเจ้าของงานเห็น (ไม่แสดงใน Team Queue ของคนอื่น)
            </label>

            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-full px-4 py-2 text-sm font-medium">
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-full px-4 py-2 text-sm font-semibold"
                style={{ background: "var(--orange)", color: "white", opacity: pending ? 0.6 : 1 }}
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}

      <style jsx>{`
        .input {
          border: 1px solid var(--line);
          border-radius: 0.6rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          width: 100%;
        }
      `}</style>
    </>
  );
}
