"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function CalendarFilters({
  members,
  month,
}: {
  members: { id: string; nickname: string }[];
  month: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  function shiftMonth(delta: number) {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setParam("month", `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="flex items-center gap-2 card px-2 py-1">
        <button type="button" onClick={() => shiftMonth(-1)} className="px-2">←</button>
        <span className="text-sm font-semibold min-w-[110px] text-center">{month}</span>
        <button type="button" onClick={() => shiftMonth(1)} className="px-2">→</button>
      </div>

      <select className="filter-select" defaultValue={searchParams.get("person") ?? ""} onChange={(e) => setParam("person", e.target.value)}>
        <option value="">All Members</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>{m.nickname}</option>
        ))}
      </select>

      <select className="filter-select" defaultValue={searchParams.get("type") ?? ""} onChange={(e) => setParam("type", e.target.value)}>
        <option value="">All Leave Types</option>
        {["ANNUAL", "BUSINESS", "SICK", "OTHER", "URGENT"].map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <style jsx>{`
        .filter-select {
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 0.35rem 0.75rem;
          font-size: 0.75rem;
          background: var(--paper);
        }
      `}</style>
    </div>
  );
}
