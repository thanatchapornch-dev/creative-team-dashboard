"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { decideLeaveAction } from "@/app/(app)/leave/actions";

export function LeaveDecisionButtons({ leaveId }: { leaveId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function decide(decision: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      await decideLeaveAction(leaveId, decision);
      router.refresh();
    });
  }

  return (
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
  );
}
