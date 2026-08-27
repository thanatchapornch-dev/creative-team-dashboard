"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { logApprovedLeaveAction } from "@/app/(app)/leave/actions";

const LEAVE_TYPES = [
  { value: "ANNUAL", label: "ลาพักร้อน" },
  { value: "BUSINESS", label: "ลากิจ" },
  { value: "SICK", label: "ลาป่วย" },
  { value: "OTHER", label: "ลาอื่นๆ" },
  { value: "URGENT", label: "🚨 Urgent Leave" },
];

const COMMON_REASONS = ["ท้องเสีย", "เป็นไข้", "ปวดหัว", "ไข้หวัด", "ปวดท้อง", "ธุระส่วนตัว", "พาครอบครัวไปหาหมอ"];

export function LogLeaveForTeamForm({ members }: { members: { id: string; nickname: string }[] }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [note, setNote] = useState("");
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      className="card p-5 flex flex-col gap-3"
      style={{ borderColor: "var(--lime)" }}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          await logApprovedLeaveAction({
            employeeId: String(fd.get("employeeId")),
            leaveType: String(fd.get("leaveType")),
            startDate: String(fd.get("startDate")),
            endDate: String(fd.get("endDate")),
            note: String(fd.get("note") || ""),
          });
          setDone(true);
          setNote("");
          router.refresh();
        });
      }}
    >
      <div>
        <h2 className="font-bold">บันทึกการลาแทนทีม</h2>
        <p className="text-xs text-[var(--muted)]">
          สำหรับกรณีที่ยื่นลาผ่านระบบ HR ของบริษัทแล้ว — บันทึกที่นี่แค่ครั้งเดียวเพื่อให้ Calendar และ Dashboard อัปเดตให้ทีมเห็น (ระบบจะ mark เป็น Approved ทันที ไม่ต้องรออนุมัติซ้ำ)
        </p>
      </div>

      <select name="employeeId" required className="input" defaultValue="">
        <option value="" disabled>เลือกสมาชิก</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>{m.nickname}</option>
        ))}
      </select>

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
            onClick={() => setNote(r)}
            className="rounded-full px-2.5 py-1 text-xs"
            style={{ background: "var(--line)", color: "var(--muted)" }}
          >
            {r}
          </button>
        ))}
      </div>
      <input
        name="note"
        placeholder="โน้ต (ถ้ามี)"
        className="input"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      {done && (
        <p className="text-sm rounded-lg px-3 py-2" style={{ background: "#eefbe0", color: "#3c6b0f" }}>
          ✅ บันทึกแล้ว ทีมจะเห็นใน Calendar ทันที
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full px-4 py-2 text-sm font-semibold self-start"
        style={{ background: "var(--lime)", opacity: pending ? 0.6 : 1 }}
      >
        Log Leave
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
