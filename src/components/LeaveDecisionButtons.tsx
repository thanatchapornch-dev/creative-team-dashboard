"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { decideLeaveAction } from "@/app/(app)/leave/actions";

export function LeaveDecisionButtons({ leaveId }: { leaveId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function decide(decision: "APPROVED" | "REJECTED") {
    setError(null);
    startTransition(async () => {
      try {
        await decideLeaveAction(leaveId, decision);
        router.refresh();
      } catch (err) {
        if (err instanceof Error && err.message === "UNAUTHENTICATED") {
          setError("เซสชันหมดอายุ กรุณาล็อกอินใหม่");
          setTimeout(() => router.push("/login"), 1500);
          return;
        }
        setError(decision === "APPROVED" ? "อนุมัติไม่สำเร็จ ลองใหม่อีกครั้ง" : "ปฏิเสธไม่สำเร็จ ลองใหม่อีกครั้ง");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => decide("APPROVED")}
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{ background: "var(--lime)", opacity: pending ? 0.6 : 1 }}
        >
          Approve
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => decide("REJECTED")}
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{ background: "#fde4e1", color: "#c0392b", opacity: pending ? 0.6 : 1 }}
        >
          Reject
        </button>
      </div>
      {error && <p className="text-xs" style={{ color: "#a12b2b" }}>⚠️ {error}</p>}
    </div>
  );
}
