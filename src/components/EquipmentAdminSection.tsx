"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addEquipmentItemAction, setEquipmentItemActiveAction } from "@/app/(app)/equipment/actions";

type Item = { id: string; name: string; category: string; active: boolean };

export function EquipmentAdminSection({ items }: { items: Item[] }) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const router = useRouter();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      await addEquipmentItemAction({ name: name.trim(), category: category.trim() || "อื่นๆ" });
      setName("");
      setCategory("");
      router.refresh();
    });
  }

  function toggleActive(id: string, active: boolean) {
    startTransition(async () => {
      await setEquipmentItemActiveAction(id, active);
      router.refresh();
    });
  }

  return (
    <div className="card p-4 flex flex-col gap-3">
      <h2 className="font-bold text-sm">📷 รายการอุปกรณ์ให้ยืม</h2>

      <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm py-1 border-b" style={{ borderColor: "var(--line)" }}>
            <span className={item.active ? "" : "opacity-40 line-through"}>
              {item.name} <span className="text-[var(--muted)] text-xs">({item.category})</span>
            </span>
            <button
              type="button"
              onClick={() => toggleActive(item.id, !item.active)}
              disabled={pending}
              className="text-xs opacity-70 hover:opacity-100"
            >
              {item.active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ชื่ออุปกรณ์ใหม่"
          className="input flex-1"
        />
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="หมวดหมู่ (เช่น Camera, Lens)"
          className="input sm:w-48"
        />
        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="rounded-full px-4 py-2 text-sm font-semibold"
          style={{ background: "var(--lime)", opacity: pending || !name.trim() ? 0.6 : 1 }}
        >
          เพิ่ม
        </button>
      </form>

      <style jsx>{`
        .input {
          border: 1px solid var(--line);
          border-radius: 0.6rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
