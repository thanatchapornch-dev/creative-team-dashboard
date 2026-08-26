"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { previewStoreUploadAction, commitStoreUploadAction } from "@/app/(app)/settings/actions";
import type { StoreUploadPreview } from "@/lib/store-import";

export function StoreUploadForm() {
  const [preview, setPreview] = useState<StoreUploadPreview | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setResult("");
    setPreview(null);
    const formData = new FormData();
    formData.append("file", file);
    startTransition(async () => {
      try {
        const p = await previewStoreUploadAction(formData);
        if (p.rows.length === 0) {
          setError("ไม่พบข้อมูลสาขาในไฟล์ — ตรวจสอบว่ามีคอลัมน์รหัสสาขาและ CJX Store Code");
          return;
        }
        setPreview(p);
      } catch {
        setError("อ่านไฟล์ไม่สำเร็จ — ตรวจสอบว่าเป็นไฟล์ .xlsx ที่ถูกต้อง");
      }
    });
  }

  function handleConfirm() {
    if (!preview) return;
    startTransition(async () => {
      const r = await commitStoreUploadAction(preview);
      setResult(`เพิ่มสาขาใหม่ ${r.created} สาขา, อัปเดต ${r.updated} สาขา`);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    });
  }

  function handleCancel() {
    setPreview(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const changedRows = preview?.rows.filter((r) => r.kind !== "unchanged") ?? [];

  return (
    <div className="card p-4 flex flex-col gap-3">
      <div>
        <h2 className="font-bold text-sm">📤 อัปโหลดไฟล์ข้อมูลสาขา</h2>
        <p className="text-xs text-[var(--muted)]">
          ไฟล์ Excel รูปแบบ &ldquo;ข้อมูลสาขาทั้งหมด&rdquo; — เพิ่มสาขาใหม่และอัปเดตข้อมูลสาขาเดิม จะไม่ลบสาขาที่ไม่มีในไฟล์
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        onChange={handleFileChange}
        disabled={pending}
        className="text-sm"
      />

      {pending && !preview && <p className="text-sm text-[var(--muted)]">กำลังอ่านไฟล์...</p>}
      {error && (
        <p className="text-sm rounded-lg px-3 py-2 w-fit" style={{ background: "#fdeaea", color: "#a12b2b" }}>
          ⚠️ {error}
        </p>
      )}
      {result && (
        <p className="text-sm rounded-lg px-3 py-2 w-fit" style={{ background: "#eefbe0", color: "#3c6b0f" }}>
          ✅ {result}
        </p>
      )}

      {preview && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-4 text-sm">
            <span>
              สาขาใหม่ <strong style={{ color: "var(--orange)" }}>{preview.newCount}</strong>
            </span>
            <span>
              จะอัปเดต <strong>{preview.updateCount}</strong> สาขา
            </span>
            <span className="text-[var(--muted)]">ไม่เปลี่ยนแปลง {preview.unchangedCount} สาขา</span>
            {preview.skippedNoCode > 0 && (
              <span style={{ color: "#a12b2b" }}>
                ⚠️ ข้าม {preview.skippedNoCode} แถว (ไม่มีรหัสสาขา)
              </span>
            )}
            {preview.skippedPlaceholder > 0 && (
              <span className="text-[var(--muted)]">
                ข้าม {preview.skippedPlaceholder} แถว (ยังไม่มีรหัสสาขาจริง — สถานะ Prospect/ยังไม่ลงเสาเข็ม ต้องเพิ่มรหัสก่อนถึงจะอัปโหลดได้)
              </span>
            )}
          </div>

          {changedRows.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">ไม่มีสาขาที่ต้องเพิ่มหรืออัปเดต — ข้อมูลตรงกับระบบอยู่แล้ว</p>
          ) : (
            <div className="overflow-x-auto max-h-64 overflow-y-auto rounded-lg" style={{ border: "1px solid var(--line)" }}>
              <table className="w-full text-xs">
                <thead className="sticky top-0" style={{ background: "var(--paper, var(--offwhite))" }}>
                  <tr className="text-left uppercase text-[var(--muted)]">
                    <th className="py-1.5 px-2">สาขา</th>
                    <th className="py-1.5 px-2">สถานะ</th>
                    <th className="py-1.5 px-2">การเปลี่ยนแปลง</th>
                  </tr>
                </thead>
                <tbody>
                  {changedRows.map((r) => (
                    <tr key={`${r.branchCode}|${r.storeCode}`} className="border-t" style={{ borderColor: "var(--line)" }}>
                      <td className="py-1.5 px-2">
                        {r.fields.name}
                        <div className="text-[var(--muted)]">
                          {r.branchCode} · {r.storeCode}
                        </div>
                      </td>
                      <td className="py-1.5 px-2">
                        {r.kind === "new" ? (
                          <span style={{ color: "var(--orange)" }}>สาขาใหม่</span>
                        ) : (
                          <span>อัปเดต</span>
                        )}
                      </td>
                      <td className="py-1.5 px-2 text-[var(--muted)]">
                        {r.kind === "new"
                          ? "—"
                          : r.changes.map((c) => `${c.label}: ${c.oldValue || "(ว่าง)"} → ${c.newValue || "(ว่าง)"}`).join(" · ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {changedRows.length > 0 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={pending}
                className="rounded-full px-5 py-2 text-sm font-semibold"
                style={{ background: "var(--orange)", color: "white", opacity: pending ? 0.6 : 1 }}
              >
                {pending ? "กำลังบันทึก..." : `ยืนยันบันทึก ${changedRows.length} สาขา`}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={pending}
                className="rounded-full px-5 py-2 text-sm font-semibold"
                style={{ background: "var(--line)", color: "var(--navy, black)" }}
              >
                ยกเลิก
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
