import { prisma } from "@/lib/prisma";
import { getCurrentMember } from "@/lib/auth";
import { bangkokWeekStart } from "@/lib/date-only";
import { OpenChatCountsForm } from "@/components/OpenChatCountsForm";
import { OpenChatUploadForm } from "@/components/OpenChatUploadForm";

function parseLatLng(url: string): { lat: string; lng: string } | null {
  const match = url.match(/q=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
  return match ? { lat: match[1], lng: match[2] } : null;
}

export default async function OpenChatPage() {
  const member = await getCurrentMember();
  if (!member) return null;

  const canEdit = member.role === "LEADER" || member.role === "ADMIN" || member.canManageOpenChat;
  const weekOf = bangkokWeekStart();
  const weekLabel = weekOf.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });

  const [stores, thisWeekCounts, lastWeekTotal, allCounts] = await Promise.all([
    prisma.store.findMany({
      where: { status: "Active store" },
      orderBy: [{ province: "asc" }, { name: "asc" }],
    }),
    prisma.openChatCount.findMany({ where: { weekOf, store: { status: "Active store" } } }),
    prisma.openChatCount.aggregate({
      where: { weekOf: new Date(weekOf.getTime() - 7 * 24 * 60 * 60 * 1000), store: { status: "Active store" } },
      _sum: { memberCount: true },
    }),
    // Latest known count per store regardless of week -- so the page still shows
    // last week's (or older) numbers instead of a wall of "—" every Mon/Tue
    // before this week's counts have been submitted. Ordered desc by weekOf so
    // the first row seen per storeId below is that store's most recent one.
    prisma.openChatCount.findMany({
      where: { store: { status: "Active store" } },
      orderBy: { weekOf: "desc" },
      select: { storeId: true, weekOf: true, memberCount: true },
    }),
  ]);

  const submittedCount = thisWeekCounts.length;

  const latestByStore = new Map<string, { memberCount: number; weekOf: Date }>();
  for (const c of allCounts) {
    if (!latestByStore.has(c.storeId)) latestByStore.set(c.storeId, { memberCount: c.memberCount, weekOf: c.weekOf });
  }

  const rows = stores.map((s) => {
    const latest = latestByStore.get(s.id);
    const isCurrentWeek = !!latest && latest.weekOf.getTime() === weekOf.getTime();
    return {
      id: s.id,
      name: s.name,
      province: s.province,
      branchCode: s.branchCode,
      storeCode: s.storeCode,
      googleMapsUrl: s.googleMapsUrl,
      grandOpening: s.grandOpening,
      // Falls back to the latest count on record when this week has no
      // submission yet -- was previously `countByStore.get(s.id) ?? null`,
      // which showed "—" for every store until someone re-entered numbers.
      currentCount: latest?.memberCount ?? null,
      currentCountWeekLabel:
        latest && !isCurrentWeek
          ? latest.weekOf.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })
          : null,
    };
  });

  const latestTotal = rows.reduce((s, r) => s + (r.currentCount ?? 0), 0);
  const staleCount = rows.filter((r) => r.currentCountWeekLabel).length;

  return (
    <div className="flex flex-col gap-6 pt-2">
      <h1 className="text-xl font-bold">OpenChat Member Tracker</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-[var(--muted)]">สาขา Active ทั้งหมด</p>
          <p className="text-2xl font-bold">{stores.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-[var(--muted)]">กรอกแล้วสัปดาห์นี้</p>
          <p className="text-2xl font-bold" style={{ color: "var(--orange)" }}>
            {submittedCount} / {stores.length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-[var(--muted)]">รวมสมาชิกล่าสุด</p>
          <p className="text-2xl font-bold">{latestTotal.toLocaleString()}</p>
          {staleCount > 0 && (
            <p className="text-xs text-[var(--muted)]">{staleCount} สาขายังใช้เลขจากสัปดาห์ก่อน</p>
          )}
        </div>
        <div className="card p-4">
          <p className="text-xs text-[var(--muted)]">รวมสมาชิกสัปดาห์ก่อน</p>
          <p className="text-2xl font-bold text-[var(--muted)]">{(lastWeekTotal._sum.memberCount ?? 0).toLocaleString()}</p>
        </div>
      </div>

      {canEdit ? (
        <>
          <OpenChatUploadForm />
          <OpenChatCountsForm stores={rows} weekLabel={weekLabel} />
        </>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-[var(--muted)]">
                <th className="py-2 px-3">สาขา</th>
                <th className="py-2 px-3">จังหวัด</th>
                <th className="py-2 px-3">เปิดร้าน</th>
                <th className="py-2 px-3">แผนที่</th>
                <th className="py-2 px-3">สมาชิกล่าสุด</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
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
                    <td className="py-2 px-3">
                      {s.currentCount ?? "—"}
                      {s.currentCountWeekLabel && (
                        <span className="text-xs text-[var(--muted)]"> ({s.currentCountWeekLabel})</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-xs text-[var(--muted)] p-3">เฉพาะ DN และ KIMJI แก้ไขข้อมูลได้</p>
        </div>
      )}
    </div>
  );
}
