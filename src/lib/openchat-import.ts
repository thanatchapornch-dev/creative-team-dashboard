import { prisma } from "./prisma";
import { weekStartForCalendarDate } from "./date-only";
import { parseXlsxRows } from "./xlsx-parse";

const DATE_HEADER_RE = /^(\d{2})\/(\d{2})\/(\d{4})$/;

export type OpenChatUploadUpdate = { weekOf: string; weekLabel: string; memberCount: number };

export type OpenChatUploadRow = {
  branchCode: string;
  storeCode: string;
  storeName: string;
  storeId: string;
  updates: OpenChatUploadUpdate[];
};

export type OpenChatUploadPreview = {
  dateColumns: string[];
  matchedRows: OpenChatUploadRow[];
  unmatched: { branchCode: string; storeCode: string; storeName: string }[];
  totalUpdates: number;
};

/**
 * Expects the same wide-format layout as the team's habitual tracking sheet:
 * "T Code" + "CJX Store Code" to identify the branch, then one column per
 * week formatted as DD/MM/YYYY holding that week's member count. Columns are
 * sorted chronologically so that if two dates in the file land in the same
 * ISO week (a Monday count corrected later that week, say), the later one
 * wins when upserted — matches how the initial historical import behaved.
 */
export async function parseOpenChatUpload(buffer: ArrayBuffer): Promise<OpenChatUploadPreview> {
  const { rows } = await parseXlsxRows(buffer);

  const allHeaders = new Set<string>();
  for (const r of rows) for (const h of Object.keys(r)) allHeaders.add(h);
  const dateColumns = [...allHeaders]
    .filter((h) => DATE_HEADER_RE.test(h))
    .sort((a, b) => {
      const [da, ma, ya] = a.split("/").map(Number);
      const [db, mb, yb] = b.split("/").map(Number);
      return Date.UTC(ya, ma - 1, da) - Date.UTC(yb, mb - 1, db);
    });

  const stores = await prisma.store.findMany({ select: { id: true, branchCode: true, storeCode: true } });
  const byCode = new Map(stores.map((s) => [`${s.branchCode}|${s.storeCode}`, s.id]));

  const matchedRows: OpenChatUploadRow[] = [];
  const unmatched: OpenChatUploadPreview["unmatched"] = [];

  for (const r of rows) {
    const branchCode = String(r["T Code"] ?? r["รหัสสาขา"] ?? "").trim();
    const storeCode = String(r["CJX Store Code"] ?? "").trim();
    const storeName = String(r["ชื่อสาขา"] ?? r["Store Name"] ?? "").trim();
    if (!branchCode && !storeCode) continue;

    const storeId = byCode.get(`${branchCode}|${storeCode}`);

    const updates: OpenChatUploadUpdate[] = [];
    for (const col of dateColumns) {
      const raw = r[col];
      if (raw === null || raw === undefined || raw === "") continue;
      const num = Number(raw);
      if (!Number.isFinite(num)) continue;
      const [d, m, y] = col.split("/").map(Number);
      const weekOf = weekStartForCalendarDate(y, m, d);
      updates.push({
        weekOf: weekOf.toISOString(),
        weekLabel: weekOf.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }),
        memberCount: num,
      });
    }

    if (storeId) {
      matchedRows.push({ branchCode, storeCode, storeName, storeId, updates });
    } else {
      unmatched.push({ branchCode, storeCode, storeName });
    }
  }

  const totalUpdates = matchedRows.reduce((sum, r) => sum + r.updates.length, 0);

  return { dateColumns, matchedRows, unmatched, totalUpdates };
}
