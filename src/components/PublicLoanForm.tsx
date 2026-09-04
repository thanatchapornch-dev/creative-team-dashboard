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

const CATEGORY_LABEL: Record<string, string> = {
  Camera: "📷 กล้อง",
  Lens: "🔍 เลนส์",
  Battery: "🔋 แบตเตอรี่",
  Accessory: "🧰 อุปกรณ์เสริม",
  Audio: "🎙️ เสียง",
  Support: "🎚️ ขาตั้ง",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-[var(--muted)]">{label}</span>
      {children}
    </label>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-sm" style={{ background: "var(--paper, white)", border: "1px solid var(--line)" }}>
      <div className="px-6 py-6 sm:px-8 sm:py-7" style={{ background: "var(--navy)", color: "white" }}>
        <p className="text-xs font-semibold tracking-wide uppercase mb-1" style={{ color: "var(--lime)" }}>
          CJx · Creative &amp; Production
        </p>
        <h1 className="text-xl sm:text-2xl font-bold">แบบฟอร์มขอยืมอุปกรณ์กล้อง</h1>
        <p className="text-sm opacity-80 mt-1">ยืนยันการจองทันที — ทีมงานจะติดต่อกลับภายใน 1 วัน</p>
      </div>
      <div className="p-6 sm:p-8">{children}</div>
    </div>
  );
}

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
      <Shell>
        <div className="flex flex-col items-start gap-2">
          <span className="text-4xl">✅</span>
          <p className="text-lg font-bold">รับคำขอยืมอุปกรณ์แล้ว</p>
          <p className="text-sm text-[var(--muted)]">
            ทีม Creative &amp; Production จะติดต่อกลับภายใน 1 วัน — เช็คอีเมลที่กรอกไว้สำหรับใบยืนยัน
          </p>
          <button
            type="button"
            onClick={() => setSuccess(false)}
            className="rounded-full px-5 py-2 text-sm font-semibold mt-3"
            style={{ background: "var(--orange)", color: "white" }}
          >
            ส่งคำขอใหม่
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="ชื่อ-นามสกุล *">
            <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
          </Field>
          <Field label="แผนก / ทีม *">
            <select value={department} onChange={(e) => setDepartment(e.target.value)} required className="input">
              <option value="" disabled>เลือกแผนก</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </Field>
          <Field label="เบอร์ติดต่อ *">
            <input value={contact} onChange={(e) => setContact(e.target.value)} required className="input" />
          </Field>
          <Field label="อีเมล *">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input" />
          </Field>
        </div>

        <Field label="ชื่อโปรเจกต์ / งานที่ใช้ *">
          <input value={projectName} onChange={(e) => setProjectName(e.target.value)} required className="input" />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="วันที่ยืม *">
            <input type="date" value={borrowDate} onChange={(e) => setBorrowDate(e.target.value)} required className="input" />
          </Field>
          <Field label="วันที่คืน *">
            <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} required className="input" />
          </Field>
        </div>

        <div>
          <p className="text-xs font-semibold text-[var(--muted)] mb-2">อุปกรณ์ที่ต้องการ *</p>
          <p className="text-xs text-[var(--muted)] mb-3 rounded-lg px-3 py-2" style={{ background: "var(--paper, #f7f5f0)" }}>
            🔋 ความจุแบตเตอรี่ — VDO ใช้ 3 ก้อน/วัน (กรณีไม่ได้ REC ต่อเนื่อง), PHOTO ใช้ 2 ก้อน/วัน (ไม่เปิดทิ้งไว้)
          </p>
          <div className="flex flex-col gap-4 rounded-xl p-4" style={{ border: "1px solid var(--line)" }}>
            {[...byCategory.entries()].map(([category, group]) => (
              <div key={category}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">
                  {CATEGORY_LABEL[category] ?? category}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.map((item) => {
                    const isSelected = selected.has(item.id);
                    return (
                      <label
                        key={item.id}
                        className="flex items-center gap-2 text-sm rounded-lg px-3 py-2 cursor-pointer transition-colors"
                        style={{
                          background: isSelected ? "var(--lime)" : "var(--offwhite)",
                          border: `1px solid ${isSelected ? "var(--lime)" : "var(--line)"}`,
                        }}
                      >
                        <input type="checkbox" checked={isSelected} onChange={() => toggle(item.id)} />
                        {item.name}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Field label="อื่นๆ (ถ้ามี)">
          <input value={otherNote} onChange={(e) => setOtherNote(e.target.value)} className="input" />
        </Field>

        {conflicts && conflicts.length > 0 && (
          <div className="text-sm rounded-lg px-4 py-3 flex flex-col gap-1" style={{ background: "#fdeaea", color: "#a12b2b" }}>
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
          className="rounded-full px-6 py-3 text-sm font-semibold self-start"
          style={{ background: "var(--orange)", color: "white", opacity: pending || selected.size === 0 ? 0.6 : 1 }}
        >
          {pending ? "กำลังส่งคำขอ..." : "ส่งคำขอยืมอุปกรณ์"}
        </button>
      </form>

      <style jsx>{`
        .input {
          border: 1px solid var(--line);
          border-radius: 0.6rem;
          padding: 0.6rem 0.85rem;
          font-size: 0.9rem;
          width: 100%;
        }
      `}</style>
    </Shell>
  );
}
