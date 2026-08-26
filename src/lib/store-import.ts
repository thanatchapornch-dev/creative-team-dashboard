import { prisma } from "./prisma";
import { parseXlsxRows } from "./xlsx-parse";

const FIELD_LABELS: Record<string, string> = {
  name: "ชื่อสาขา",
  nameEn: "Store Name",
  subdistrict: "ตำบล",
  district: "อำเภอ",
  province: "จังหวัด",
  address: "ที่อยู่",
  googleMapsUrl: "Google Maps",
  warehouse: "คลังสินค้า",
  buddhistRatio: "สัดส่วนชาวพุทธ",
  muslimRatio: "สัดส่วนชาวมุสลิม",
  burmeseRatio: "สัดส่วนชาวพม่า",
  cambodianRatio: "สัดส่วนชาวกัมพูชา",
  zoning: "Zoning",
  grandOpening: "Grand opening",
  status: "Status",
};

type StoreFields = {
  name: string;
  nameEn: string;
  subdistrict: string;
  district: string;
  province: string;
  address: string;
  googleMapsUrl: string;
  warehouse: string;
  buddhistRatio: number;
  muslimRatio: number;
  burmeseRatio: number;
  cambodianRatio: number;
  zoning: string;
  grandOpening: string;
  status: string;
};

export type StoreUploadDiff = { field: string; label: string; oldValue: string; newValue: string };

export type StoreUploadRow = {
  branchCode: string;
  storeCode: string;
  kind: "new" | "update" | "unchanged";
  storeId: string | null;
  fields: StoreFields;
  changes: StoreUploadDiff[];
};

export type StoreUploadPreview = {
  rows: StoreUploadRow[];
  newCount: number;
  updateCount: number;
  unchangedCount: number;
  skippedNoCode: number;
  skippedPlaceholder: number;
};

/** "-" is the team's placeholder for "no code assigned yet" (e.g. Prospect-stage stores) — never a real identifier. */
function isPlaceholderCode(v: string): boolean {
  return v === "" || v === "-";
}

function str(v: string | number | null | undefined): string {
  return v === null || v === undefined ? "" : String(v).trim();
}

function num(v: string | number | null | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Expects the same "ข้อมูลสาขาทั้งหมด" master-file layout used for the
 * original 476-store import. Matches existing stores by (branchCode,
 * storeCode); unmatched rows become new stores. Never deletes a store that's
 * simply absent from the uploaded file — a partial or filtered export
 * shouldn't be able to wipe out the rest of the store list.
 */
export async function parseStoreUpload(buffer: ArrayBuffer): Promise<StoreUploadPreview> {
  const { rows: rawRows } = await parseXlsxRows(buffer);

  const existing = await prisma.store.findMany();
  const byCode = new Map(
    existing
      .filter((s) => !isPlaceholderCode(s.branchCode) && !isPlaceholderCode(s.storeCode))
      .map((s) => [`${s.branchCode}|${s.storeCode}`, s])
  );

  const rows: StoreUploadRow[] = [];
  let skippedNoCode = 0;
  let skippedPlaceholder = 0;

  for (const r of rawRows) {
    const branchCode = str(r["รหัสสาขา"] ?? r["T Code"]);
    const storeCode = str(r["CJX Store Code"]);
    if (!branchCode || !storeCode) {
      skippedNoCode++;
      continue;
    }
    if (isPlaceholderCode(branchCode) || isPlaceholderCode(storeCode)) {
      // "-" placeholder codes aren't unique identifiers — matching or bulk-creating
      // on them risks merging unrelated stores or duplicating rows on re-upload.
      // These need a person to assign a real code before they can go through here.
      skippedPlaceholder++;
      continue;
    }

    const fields: StoreFields = {
      name: str(r["ชื่อสาขา"]),
      nameEn: str(r["Store Name"]),
      subdistrict: str(r["ตำบล"]),
      district: str(r["อำเภอ"]),
      province: str(r["จังหวัด"]),
      address: str(r["ที่อยู่เต็ม"]),
      googleMapsUrl: str(r["Google Maps"]),
      warehouse: str(r["คลังสินค้า"]),
      buddhistRatio: num(r["สัดส่วนชาวพุทธ"]),
      muslimRatio: num(r["สัดส่วนชาวมุสลิม"]),
      burmeseRatio: num(r["สัดส่วนชาวพม่า"]),
      cambodianRatio: num(r["สัดส่วนชาวกัมพูชา"]),
      zoning: str(r["Zoning"]),
      grandOpening: str(r["Grand opening"]),
      status: str(r["Status"]),
    };

    const existingStore = byCode.get(`${branchCode}|${storeCode}`);

    if (!existingStore) {
      rows.push({ branchCode, storeCode, kind: "new", storeId: null, fields, changes: [] });
      continue;
    }

    const changes: StoreUploadDiff[] = [];
    for (const key of Object.keys(fields) as (keyof StoreFields)[]) {
      const oldValue = existingStore[key];
      const newValue = fields[key];
      const oldStr = typeof oldValue === "number" ? String(oldValue) : String(oldValue ?? "");
      const newStr = typeof newValue === "number" ? String(newValue) : String(newValue ?? "");
      if (oldStr !== newStr) {
        changes.push({ field: key, label: FIELD_LABELS[key] ?? key, oldValue: oldStr, newValue: newStr });
      }
    }

    rows.push({
      branchCode,
      storeCode,
      kind: changes.length > 0 ? "update" : "unchanged",
      storeId: existingStore.id,
      fields,
      changes,
    });
  }

  return {
    rows,
    newCount: rows.filter((r) => r.kind === "new").length,
    updateCount: rows.filter((r) => r.kind === "update").length,
    unchangedCount: rows.filter((r) => r.kind === "unchanged").length,
    skippedNoCode,
    skippedPlaceholder,
  };
}
