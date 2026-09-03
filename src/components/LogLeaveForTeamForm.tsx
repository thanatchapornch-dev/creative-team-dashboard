"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { logApprovedLeaveAction } from "@/app/(app)/leave/actions";
import { parseEuniteText } from "@/lib/eunite-parse";

const LEAVE_TYPES = [
  { value: "ANNUAL", label: "ลาพักร้อน" },
  { value: "BUSINESS", label: "ลากิจ" },
  { value: "SICK", label: "ลาป่วย" },
  { value: "OTHER", label: "ลาอื่นๆ" },
  { value: "URGENT", label: "🚨 Urgent Leave" },
];

const COMMON_REASONS = ["ท้องเสีย", "เป็นไข้", "ปวดหัว", "ไข้หวัด", "ปวดท้อง", "ธุระส่วนตัว", "พาครอบครัวไปหาหมอ"];

// EUNITE shows Thai names, which aren't otherwise stored anywhere in this app.
// Add more here as they're confirmed — matching just falls back to manual
// selection for anyone not listed yet.
const EUNITE_THAI_ALIASES: Record<string, string[]> = {
  JARUJU: ["จุฑารัตน์ สุวรรณอ่อน"],
  WITCH: ["วิชญ์ มีนรักษ์เรืองเดช"],
};

type Member = { id: string; nickname: string; name: string };

export function LogLeaveForTeamForm({ members }: { members: Member[] }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  const [pasteText, setPasteText] = useState("");
  const [parsedNote, setParsedNote] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState("");
  const [leaveType, setLeaveType] = useState("ANNUAL");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [note, setNote] = useState("");

  function handleParse() {
    if (!pasteText.trim()) return;
    const membersWithAliases = members.map((m) => ({ ...m, aliases: EUNITE_THAI_ALIASES[m.nickname] }));
    const result = parseEuniteText(pasteText, membersWithAliases);
    if (result.matchedMemberId) setEmployeeId(result.matchedMemberId);
    setLeaveType(result.leaveType);
    if (result.date) {
      setStartDate(result.date);
      setEndDate(result.date);
    }
    setNote(result.reason);
    setParsedNote(
      result.matchedMemberId
        ? "แกะข้อมูลแล้ว — ตรวจสอบก่อนบันทึก (โดยเฉพาะช่วงวันที่ ถ้าเหตุผลระบุหลายวัน)"
        : "แกะข้อมูลแล้วแต่หาชื่อสมาชิกไม่เจอ — กรุณาเลือกเอง"
    );
  }

  return (
    <form
      className="card p-5 flex flex-col gap-3"
      style={{ borderColor: "var(--lime)" }}
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          await logApprovedLeaveAction({ employeeId, leaveType, startDate, endDate, note });
          setDone(true);
          setPasteText("");
          setParsedNote(null);
          setNote("");
          setEmployeeId("");
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

      <div className="flex flex-col gap-1.5 rounded-lg p-3" style={{ background: "var(--paper, #f7f5f0)", border: "1px dashed var(--line)" }}>
        <label className="text-xs font-medium text-[var(--muted)]">
          วางข้อความจาก EUNITE (คัดลอกทั้งแถวมาวางได้เลย)
        </label>
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          rows={2}
          placeholder="เช่น: ลาพักร้อน วันที่ 21/09/2569 เหตุผล ไปต่างจังหวัด 19-21 กย.   วิชญ์ มีนรักษ์เรืองเดช"
          className="input"
        />
        <button
          type="button"
          onClick={handleParse}
          className="rounded-full px-3 py-1.5 text-xs font-semibold self-start"
          style={{ background: "var(--navy, #0F1B33)", color: "white" }}
        >
          แกะข้อมูลใส่ฟอร์ม
        </button>
        {parsedNote && <p className="text-xs" style={{ color: "var(--muted)" }}>{parsedNote}</p>}
      </div>

      <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required className="input">
        <option value="" disabled>เลือกสมาชิก</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>{m.nickname}</option>
        ))}
      </select>

      <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} required className="input">
        {LEAVE_TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-xs text-[var(--muted)] flex flex-col gap-1">
          Start Date
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="input" />
        </label>
        <label className="text-xs text-[var(--muted)] flex flex-col gap-1">
          End Date
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="input" />
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
        disabled={pending || !employeeId}
        className="rounded-full px-4 py-2 text-sm font-semibold self-start"
        style={{ background: "var(--lime)", opacity: pending || !employeeId ? 0.6 : 1 }}
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
