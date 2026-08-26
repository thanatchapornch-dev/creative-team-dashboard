"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  previewOpenChatUploadAction,
  commitOpenChatUploadAction,
} from "@/app/(app)/openchat/actions";
import type { OpenChatUploadPreview } from "@/lib/openchat-import";

export function OpenChatUploadForm() {
  const [preview, setPreview] = useState<OpenChatUploadPreview | null>(null);
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
        const p = await previewOpenChatUploadAction(formData);
        if (p.matchedRows.length === 0 && p.unmatched.length === 0) {
          setError("ไม่พบข้อมูลในไฟล์ — ตรวจสอบว่ามีคอลัมน์ T Code / CJX Store Code และคอลัมน์วันที่รูปแบบ DD/MM/YYYY");
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
      const r = await commitOpenChatUploadAction(preview);
      setResult(`บันทึกแล้ว ${r.upserts} รายการ`);
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

  return (
    <div className="card p-4 flex flex-col gap-3">
      <div>
        <h2 className="font-bold text-sm">📤 อัปโหลดไฟล์อัปเดตจำนวนสมาชิก</h2>
        <p className="text-xs text-[var(--muted)]">
          ไฟล์ Excel รูปแบบเดิม (คอลัมน์ T Code, CJX Store Code, และคอลัมน์วันที่ DD/MM/YYYY แต่ละสัปดาห์)
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
              พบสาขาตรงกัน <strong>{preview.matchedRows.length}</strong> สาขา
            </span>
            <span>
              คอลัมน์วันที่ที่พบ: <strong>{preview.dateColumns.length}</strong> ({preview.dateColumns.join(", ")})
            </span>
            <span>
              จะบันทึกทั้งหมด <strong>{preview.totalUpdates}</strong> ค่า
            </span>
            {preview.unmatched.length > 0 && (
              <span style={{ color: "#a12b2b" }}>
                ⚠️ ไม่พบสาขาในระบบ {preview.unmatched.length} แถว (จะไม่ถูกบันทึก)
              </span>
            )}
          </div>

          {preview.unmatched.length > 0 && (
            <div className="text-xs rounded-lg p-2" style={{ background: "#fdeaea", color: "#a12b2b" }}>
              ไม่พบ: {preview.unmatched.map((u) => `${u.storeName} (${u.branchCode}/${u.storeCode})`).join(", ")}
            </div>
          )}

          <div className="overflow-x-auto max-h-64 overflow-y-auto rounded-lg" style={{ border: "1px solid var(--line)" }}>
            <table className="w-full text-xs">
              <thead className="sticky top-0" style={{ background: "var(--paper, var(--offwhite))" }}>
                <tr className="text-left uppercase text-[var(--muted)]">
                  <th className="py-1.5 px-2">สาขา</th>
                  <th className="py-1.5 px-2">จำนวนค่าที่จะบันทึก</th>
                  <th className="py-1.5 px-2">ค่าล่าสุด</th>
                </tr>
              </thead>
              <tbody>
                {preview.matchedRows.map((r) => {
                  const last = r.updates[r.updates.length - 1];
                  return (
                    <tr key={r.storeId} className="border-t" style={{ borderColor: "var(--line)" }}>
                      <td className="py-1.5 px-2">{r.storeName}</td>
                      <td className="py-1.5 px-2">{r.updates.length}</td>
                      <td className="py-1.5 px-2 text-[var(--muted)]">
                        {last ? `${last.memberCount} (${last.weekLabel})` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={pending}
              className="rounded-full px-5 py-2 text-sm font-semibold"
              style={{ background: "var(--orange)", color: "white", opacity: pending ? 0.6 : 1 }}
            >
              {pending ? "กำลังบันทึก..." : `ยืนยันบันทึก ${preview.totalUpdates} ค่า`}
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
        </div>
      )}
    </div>
  );
}
