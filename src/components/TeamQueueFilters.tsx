"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

type Option = { id: string; label: string };

export function TeamQueueFilters({
  members,
  projects,
}: {
  members: Option[];
  projects: string[];
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

  const view = searchParams.get("view") ?? "status";

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="flex rounded-full overflow-hidden card p-1">
        {["status", "member"].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setParam("view", v)}
            className="px-3 py-1 text-xs font-semibold rounded-full"
            style={{ background: view === v ? "var(--orange)" : "transparent", color: view === v ? "white" : "inherit" }}
          >
            {v === "status" ? "By Status" : "By Member"}
          </button>
        ))}
      </div>

      <select className="filter-select" defaultValue={searchParams.get("member") ?? ""} onChange={(e) => setParam("member", e.target.value)}>
        <option value="">All Members</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>{m.label}</option>
        ))}
      </select>

      <select className="filter-select" defaultValue={searchParams.get("priority") ?? ""} onChange={(e) => setParam("priority", e.target.value)}>
        <option value="">All Priority</option>
        {["URGENT", "HIGH", "MEDIUM", "LOW"].map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      <select className="filter-select" defaultValue={searchParams.get("project") ?? ""} onChange={(e) => setParam("project", e.target.value)}>
        <option value="">All Projects</option>
        {projects.map((p) => (
          <option key={p} value={p}>{p}</option>
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
