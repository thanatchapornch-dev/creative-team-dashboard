"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveOpenChatCountsAction } from "@/app/(app)/openchat/actions";

type StoreRow = {
  id: string;
  name: string;
  province: string;
  branchCode: string;
  storeCode: string;
  googleMapsUrl: string;
  grandOpening: string;
  currentCount: number | null;
};

function parseLatLng(url: string): { lat: string; lng: string } | null {
  const match = url.match(/q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  return match ? { lat: match[1], lng: match[2] } : null;
}

export function OpenChatCountsForm({ stores, weekLabel }: { stores: StoreRow[]; weekLabel: string }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();
  const [savedMsg, setSavedMsg] = useState("");
  const router = useRouter();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return stores;
    return stores.filter((s) => s.name.toLowerCase().includes(q) || s.province.toLowerCase().includes(q));
  }, [stores, search]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const entries = Object.entries(values)
      .filter(([, v]) => v !== "" && !Number.isNaN(Number(v)))
      .map(([storeId, v]) => ({ storeId, memberCount: Number(v) }));
    if (entries.length === 0) return;
    startTransition(async () => {
      const result = await saveOpenChatCountsAction(entries);
      setSavedMsg(`บันทึกแล้ว ${result.saved} สาขา`);
      setValues({});
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold">กรอกจำนวนสมาชิก OpenChat — สัปดาห์ของ {weekLabel}</h2>
          <p className="text-xs text-[var(--muted)]">กรอกเฉพาะสาขาที่มีข้อมูลใหม่ ช่องที่ไม่แก้จะไม่ถูกบันทึกทับ</p>
        </div>
        <input
          placeholder="ค้นหาสาขา/จังหวัด..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input max-w-xs"
        />
      </div>

      {savedMsg && (
        <p className="text-sm rounded-lg px-3 py-2 w-fit" style={{ background: "#eefbe0", color: "#3c6b0f" }}>
          ✅ {savedMsg}
        </p>
      )}

      <div className="card overflow-x-auto max-h-[60vh] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0" style={{ background: "var(--paper, var(--offwhite))" }}>
            <tr className="text-left text-xs uppercase text-[var(--muted)]">
              <th className="py-2 px-3">สาขา</th>
              <th className="py-2 px-3">จังหวัด</th>
              <th className="py-2 px-3">เปิดร้าน</th>
              <th className="py-2 px-3">แผนที่</th>
              <th className="py-2 px-3">สัปดาห์นี้ (เดิม)</th>
              <th className="py-2 px-3">กรอกใหม่</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const coords = parseLatLng(s.googleMapsUrl);
              return (
                <tr key={s.id} className="border-t" style={{ borderColor: "var(--line)" }}>
                  <td className="py-2 px-3">
                    {s.name}
                    <div className="text-xs text-[var(--muted)]">
                      {s.branchCode} · {s.storeCode}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-[var(--muted)]">{s.province}</td>
                  <td className="py-2 px-3 text-[var(--muted)]">{s.grandOpening || "—"}</td>
                  <td className="py-2 px-3">
                    {s.googleMapsUrl ? (
                      <a href={s.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--orange)" }}>
                        📍 {coords ? `${coords.lat}, ${coords.lng}` : "เปิดแผนที่"}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2 px-3 text-[var(--muted)]">{s.currentCount ?? "—"}</td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min="0"
                      className="input w-28"
                      value={values[s.id] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [s.id]: e.target.value }))}
                      placeholder={s.currentCount != null ? String(s.currentCount) : "-"}
                    />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-[var(--muted)]">
                  ไม่พบสาขาที่ค้นหา
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full px-5 py-2 text-sm font-semibold self-start"
        style={{ background: "var(--orange)", color: "white", opacity: pending ? 0.6 : 1 }}
      >
        {pending ? "กำลังบันทึก..." : "บันทึกจำนวนที่กรอก"}
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
