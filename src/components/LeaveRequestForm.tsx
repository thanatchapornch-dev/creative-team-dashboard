"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitLeaveAction } from "@/app/(app)/leave/actions";

const LEAVE_TYPES = [
  { value: "ANNUAL", label: "ลาพักร้อน" },
  { value: "BUSINESS", label: "ลากิจ" },
  { value: "SICK", label: "ลาป่วย" },
  { value: "OTHER", label: "ลาอื่นๆ" },
  { value: "URGENT", label: "🚨 Urgent Leave" },
];

const COMMON_REASONS = ["ท้องเสีย", "เป็นไข้", "ปวดหัว", "ไข้หวัด", "ปวดท้อง", "ธุระส่วนตัว", "พาครอบครัวไปหาหมอ"];

export function LeaveRequestForm() {
  const [pending, startTransition] = useTransition();
  const [warning, setWarning] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [reason, setReason] = useState("");
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      className="card p-5 flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await submitLeaveAction({
            leaveType: String(fd.get("leaveType")),
            startDate: String(fd.get("startDate")),
            endDate: String(fd.get("endDate")),
            reason: String(fd.get("reason")),
          });
          setWarning(result.warning);
          setDone(true);
          setReason("");
          router.refresh();
        });
      }}
    >
      <h2 className="font-bold">Request Leave</h2>
      <select name="leaveType" required className="input" defaultValue="ANNUAL">
        {LEAVE_TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-xs text-[var(--muted)] flex flex-col gap-1">
          Start Date
          <input name="startDate" type="date" defaultValue={today} required className="input" />
        </label>
        <label className="text-xs text-[var(--muted)] flex flex-col gap-1">
          End Date
          <input name="endDate" type="date" defaultValue={today} required className="input" />
        </label>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {COMMON_REASONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setReason(r)}
            className="rounded-full px-2.5 py-1 text-xs"
            style={{ background: "var(--line)", color: "var(--muted)" }}
          >
            {r}
          </button>
        ))}
      </div>
      <textarea
        name="reason"
        placeholder="Reason"
        required
        rows={2}
        className="input"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />

      {warning && (
        <p className="text-sm rounded-lg px-3 py-2" style={{ background: "#fff4e5", color: "#8a5a00" }}>
          ⚠️ {warning}
        </p>
      )}
      {done && !warning && (
        <p className="text-sm rounded-lg px-3 py-2" style={{ background: "#eefbe0", color: "#3c6b0f" }}>
          ✅ ส่งคำขอลาเรียบร้อย รออนุมัติ
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full px-4 py-2 text-sm font-semibold self-start"
        style={{ background: "var(--orange)", color: "white", opacity: pending ? 0.6 : 1 }}
      >
        Submit Leave Request
      </button>

      <style jsx>{`
        .input {
          border: 1px solid var(--line);
          border-radius: 0.6rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          width: 100%;
        }
      `}</style>
    </form>
  );
}
