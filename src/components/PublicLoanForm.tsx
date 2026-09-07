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
  Camera: "กล้อง",
  Lens: "เลนส์",
  Battery: "แบตเตอรี่",
  Accessory: "อุปกรณ์เสริม",
  Audio: "เสียง",
  Support: "ขาตั้ง",
};

const INK = "#111214";
const YELLOW = "#FFD400";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: "#6B6D74" }}>{label}</span>
      {children}
    </label>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-2xl mx-auto rounded-2xl overflow-hidden" style={{ background: "white", border: `1px solid #E5E5E7`, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div className="relative px-6 py-7 sm:px-8" style={{ background: INK }}>
        <img
          src="/brand/mumi.png"
          alt=""
          className="absolute top-3 right-4 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 object-contain"
        />
        <div className="flex items-center gap-3 mb-4">
          <span
            className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-lg font-black tracking-tight"
            style={{ background: YELLOW, color: INK }}
          >
            CJx
          </span>
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: YELLOW }}>
            Creative &amp; Production
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white pr-16 sm:pr-20">แบบฟอร์มขอยืมอุปกรณ์กล้อง</h1>
        <p className="text-sm mt-1" style={{ color: "#B9BAC0" }}>ยืนยันการจองทันที — ทีมงานจะติดต่อกลับภายใน 1 วัน</p>
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
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    if (selected.size === 0) return;
    startTransition(async () => {
      try {
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
      } catch {
        setError("ส่งคำขอไม่สำเร็จ เชื่อมต่อไม่ได้หรือมีปัญหาชั่วคราว — ลองกดส่งอีกครั้ง หรือทักไลน์/โทรหาทีมโดยตรงถ้ายังไม่ได้");
      }
    });
  }

  if (success) {
    return (
      <Shell>
        <div className="flex flex-col items-start gap-2">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-1"
            style={{ background: "#EAF7EC", color: "#2C8A3F" }}
          >
            ✓
          </div>
          <p className="text-lg font-bold" style={{ color: INK }}>รับคำขอยืมอุปกรณ์แล้ว</p>
          <p className="text-sm" style={{ color: "#6B6D74" }}>
            ทีม Creative &amp; Production จะติดต่อกลับภายใน 1 วัน — เช็คอีเมลที่กรอกไว้สำหรับใบยืนยัน
          </p>
          <button
            type="button"
            onClick={() => setSuccess(false)}
            className="rounded-full px-5 py-2 text-sm font-semibold mt-3"
            style={{ background: YELLOW, color: INK }}
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
          <p className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: "#6B6D74" }}>อุปกรณ์ที่ต้องการ *</p>
          <p className="text-xs mb-3 rounded-lg px-3 py-2" style={{ background: "#F5F5F6", color: "#6B6D74" }}>
            ความจุแบตเตอรี่ — VDO ใช้ 3 ก้อน/วัน (กรณีไม่ได้ REC ต่อเนื่อง), PHOTO ใช้ 2 ก้อน/วัน (ไม่เปิดทิ้งไว้)
          </p>
          <div className="flex flex-col gap-4 rounded-xl p-4" style={{ border: "1px solid #E5E5E7" }}>
            {[...byCategory.entries()].map(([category, group]) => (
              <div key={category}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#6B6D74" }}>
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
                          background: isSelected ? YELLOW : "#F5F5F6",
                          border: `1px solid ${isSelected ? YELLOW : "#E5E5E7"}`,
                          color: INK,
                          fontWeight: isSelected ? 600 : 400,
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

        {error && (
          <div className="text-sm rounded-lg px-4 py-3" style={{ background: "#FDEAEA", color: "#A12B2B" }}>
            {error}
          </div>
        )}

        {conflicts && conflicts.length > 0 && (
          <div className="text-sm rounded-lg px-4 py-3 flex flex-col gap-1" style={{ background: "#FDEAEA", color: "#A12B2B" }}>
            <p className="font-semibold">จองไม่ได้ — อุปกรณ์ชนกับคิวที่จองไว้แล้ว:</p>
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
          className="rounded-full px-6 py-3 text-sm font-bold self-start"
          style={{ background: YELLOW, color: INK, opacity: pending || selected.size === 0 ? 0.5 : 1 }}
        >
          {pending ? "กำลังส่งคำขอ..." : "ส่งคำขอยืมอุปกรณ์"}
        </button>
      </form>

      <style jsx>{`
        .input {
          border: 1px solid #E5E5E7;
          border-radius: 0.6rem;
          padding: 0.6rem 0.85rem;
          font-size: 0.9rem;
          width: 100%;
          color: ${INK};
        }
        .input:focus {
          outline: none;
          border-color: ${YELLOW};
          box-shadow: 0 0 0 3px rgba(255, 212, 0, 0.25);
        }
      `}</style>
    </Shell>
  );
}
