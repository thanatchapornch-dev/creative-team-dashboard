"use client";

import { useMemo, useState, useTransition } from "react";
import { createPublicLoanRequestAction } from "@/app/borrow/actions";
import type { LoanConflict } from "@/lib/equipment";

type EquipmentOption = { id: string; name: string; category: string };

const DEPARTMENTS = [
  "Site Expansion", "Site Nego", "Construction", "NSA", "Partnership", "Oper",
  "Marketing", "COM", "SCM - TD", "SCM - CJx", "LPIC", "TD BU", "AF", "BSA",
  "S&P", "IT Support", "People", "Legal", "Creative & Production", "อื่นๆ",
];

export function PublicLoanForm({ items }: { items: EquipmentOption[] }) {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [projectName, setProjectName] = useState("");
  const [borrowDate, setBorrowDate] = useState(new Date().toISOString().slice(0, 10));
  const [returnDate, setReturnDate] = useState(new Date().toISOString().slice(0, 10));
  const [otherNote, setOtherNote] = useState("");
  const [conflicts, setConflicts] = useState<LoanConflict[] | null>(null);
  const [success, setSuccess] = useState(false);

  const byCategory = useMemo(() => {
    const groups = new Map<string, EquipmentOption[]>();
    for (const item of items) {
      if (!groups.has(item.category)) groups.set(item.category, []);
      groups.get(item.category)!.push(item);
    }
    return groups;
  }, [items]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setConflicts(null);
    setSuccess(false);
    if (selected.size === 0) return;
    startTransition(async () => {
      const result = await createPublicLoanRequestAction({
        name,
        contact,
        email,
        department,
        projectName,
        itemIds: [...selected],
        borrowDate,
        returnDate,
        otherNote,
      });
      if (result.ok) {
        setSuccess(true);
        setSelected(new Set());
        setName("");
        setContact("");
        setEmail("");
        setDepartment("");
        setProjectName("");
        setOtherNote("");
      } else {
        setConflicts(result.conflicts);
      }
    });
  }

  if (success) {
    return (
      <div className="card p-6 flex flex-col gap-2 items-start">
        <p className="text-lg font-bold">✅ รับคำขอยืมอุปกรณ์แล้ว</p>
        <p className="text-sm text-[var(--muted)]">ทีม Creative &amp; Production จะติดต่อกลับภายใน 1 วัน</p>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="rounded-full px-4 py-2 text-sm font-semibold mt-2"
          style={{ background: "var(--orange)", color: "white" }}
        >
          ส่งคำขอใหม่
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 flex flex-col gap-3 max-w-xl mx-auto">
      <div>
        <h1 className="text-lg font-bold">CJx Camera and Equipment Loan</h1>
        <p className="text-sm text-[var(--muted)]">แบบฟอร์มขอยืมอุปกรณ์กล้อง/สื่อ จากทีม Creative &amp; Production</p>
      </div>

      <input placeholder="ชื่อ-นามสกุล" value={name} onChange={(e) => setName(e.target.value)} required className="input" />
      <input placeholder="เบอร์ติดต่อ" value={contact} onChange={(e) => setContact(e.target.value)} required className="input" />
      <input type="email" placeholder="อีเมล" value={email} onChange={(e) => setEmail(e.target.value)} required className="input" />

      <select value={department} onChange={(e) => setDepartment(e.target.value)} required className="input">
        <option value="" disabled>แผนก / ทีม</option>
        {DEPARTMENTS.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      <input
        placeholder="ชื่อโปรเจกต์ / งานที่ใช้"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        required
        className="input"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-xs text-[var(--muted)] flex flex-col gap-1">
          วันที่ยืม
          <input type="date" value={borrowDate} onChange={(e) => setBorrowDate(e.target.value)} required className="input" />
        </label>
        <label className="text-xs text-[var(--muted)] flex flex-col gap-1">
          วันที่คืน
          <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} required className="input" />
        </label>
      </div>

      <div className="flex flex-col gap-3 rounded-lg p-3" style={{ border: "1px solid var(--line)" }}>
        <p className="text-xs text-[var(--muted)]">
          ความจุแบตเตอรี่: VDO ใช้ 3 ก้อน/วัน (กรณีไม่ได้ REC ต่อเนื่อง), PHOTO ใช้ 2 ก้อน/วัน (ไม่เปิดทิ้งไว้)
        </p>
        {[...byCategory.entries()].map(([category, group]) => (
          <div key={category}>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-1">{category}</p>
            <div className="flex flex-col gap-1.5">
              {group.map((item) => (
                <label key={item.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} />
                  {item.name}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <input placeholder="อื่นๆ (ถ้ามี)" value={otherNote} onChange={(e) => setOtherNote(e.target.value)} className="input" />

      {conflicts && conflicts.length > 0 && (
        <div className="text-sm rounded-lg px-3 py-2 flex flex-col gap-1" style={{ background: "#fdeaea", color: "#a12b2b" }}>
          <p className="font-semibold">⚠️ จองไม่ได้ — อุปกรณ์ชนกับคิวที่จองไว้แล้ว:</p>
          {conflicts.map((c, i) => (
            <p key={i}>
              {c.itemName} — {c.borrower} จองไว้ {c.borrowDate} ถึง {c.returnDate}
            </p>
          ))}
        </div>
      )}

      <button
        type="submit"
        disabled={pending || selected.size === 0}
        className="rounded-full px-4 py-2 text-sm font-semibold self-start"
        style={{ background: "var(--orange)", color: "white", opacity: pending || selected.size === 0 ? 0.6 : 1 }}
      >
        {pending ? "กำลังส่งคำขอ..." : "ส่งคำขอยืมอุปกรณ์"}
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
