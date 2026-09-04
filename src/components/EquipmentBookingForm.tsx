"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLoanAction, type LoanConflict } from "@/app/(app)/equipment/actions";

type EquipmentOption = { id: string; name: string; category: string };

export function EquipmentBookingForm({ items }: { items: EquipmentOption[] }) {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [projectName, setProjectName] = useState("");
  const [borrowDate, setBorrowDate] = useState(new Date().toISOString().slice(0, 10));
  const [returnDate, setReturnDate] = useState(new Date().toISOString().slice(0, 10));
  const [otherNote, setOtherNote] = useState("");
  const [conflicts, setConflicts] = useState<LoanConflict[] | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
        const result = await createLoanAction({
          projectName,
          itemIds: [...selected],
          borrowDate,
          returnDate,
          otherNote,
        });
        if (result.ok) {
          setSuccess(true);
          setSelected(new Set());
          setProjectName("");
          setOtherNote("");
          router.refresh();
        } else {
          setConflicts(result.conflicts);
        }
      } catch {
        setError("จองไม่สำเร็จ เชื่อมต่อไม่ได้หรือมีปัญหาชั่วคราว — ลองกดจองอีกครั้ง");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 flex flex-col gap-3">
      <div>
        <h2 className="font-bold">จองอุปกรณ์</h2>
        <p className="text-xs text-[var(--muted)]">เลือกอุปกรณ์ที่ต้องใช้ ระบบยืนยันทันทีถ้าไม่ชนกับคิวคนอื่น</p>
      </div>

      <input
        placeholder="ชื่อโปรเจกต์"
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

      <input
        placeholder="อื่นๆ (ถ้ามี)"
        value={otherNote}
        onChange={(e) => setOtherNote(e.target.value)}
        className="input"
      />

      {error && (
        <p className="text-sm rounded-lg px-3 py-2" style={{ background: "#fdeaea", color: "#a12b2b" }}>
          ⚠️ {error}
        </p>
      )}

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

      {success && (
        <p className="text-sm rounded-lg px-3 py-2" style={{ background: "#eefbe0", color: "#3c6b0f" }}>
          ✅ จองสำเร็จ ระบบส่งอีเมลยืนยันให้แล้ว
        </p>
      )}

      <button
        type="submit"
        disabled={pending || selected.size === 0}
        className="rounded-full px-4 py-2 text-sm font-semibold self-start"
        style={{ background: "var(--orange)", color: "white", opacity: pending || selected.size === 0 ? 0.6 : 1 }}
      >
        {pending ? "กำลังจอง..." : "จองอุปกรณ์"}
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
