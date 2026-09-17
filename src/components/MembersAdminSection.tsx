"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "./Avatar";
import { resetPinAction, updateMemberAdminAction } from "@/app/(app)/settings/actions";

type MemberRow = {
  id: string;
  nickname: string;
  role: string;
  workEmail: string;
  dailyCapacityHours: number;
  profilePictureUrl: string;
};

const ROLES = ["MEMBER", "LEADER", "ADMIN"];

function MemberRowEditor({ member }: { member: MemberRow }) {
  const [pending, startTransition] = useTransition();
  const [pinValue, setPinValue] = useState("");
  const [pinMsg, setPinMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleAuthError(err: unknown, fallbackMsg: string) {
    if (err instanceof Error && err.message === "UNAUTHENTICATED") {
      setError("เซสชันหมดอายุ กรุณาล็อกอินใหม่แล้วลองอีกครั้ง");
      setTimeout(() => router.push("/login"), 1500);
      return;
    }
    setError(fallbackMsg);
  }

  return (
    <div className="flex items-center gap-3 py-3 border-b flex-wrap" style={{ borderColor: "var(--line)" }}>
      <Avatar name={member.nickname} src={member.profilePictureUrl} size={36} />
      <span className="font-medium w-20">{member.nickname}</span>

      <select
        defaultValue={member.role}
        disabled={pending}
        onChange={(e) => {
          setError(null);
          startTransition(async () => {
            try {
              await updateMemberAdminAction(member.id, {
                role: e.target.value,
                workEmail: member.workEmail,
                dailyCapacityHours: member.dailyCapacityHours,
              });
              router.refresh();
            } catch (err) {
              handleAuthError(err, "เปลี่ยน Role ไม่สำเร็จ ลองใหม่อีกครั้ง");
            }
          });
        }}
        className="input w-28"
      >
        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>

      <input
        defaultValue={member.workEmail}
        placeholder="Work email"
        disabled={pending}
        onBlur={(e) => {
          if (e.target.value === member.workEmail) return;
          setError(null);
          startTransition(async () => {
            try {
              await updateMemberAdminAction(member.id, {
                role: member.role,
                workEmail: e.target.value,
                dailyCapacityHours: member.dailyCapacityHours,
              });
              router.refresh();
            } catch (err) {
              handleAuthError(err, "บันทึกอีเมลไม่สำเร็จ ลองใหม่อีกครั้ง");
            }
          });
        }}
        className="input flex-1 min-w-[180px]"
      />

      <input
        type="number"
        defaultValue={member.dailyCapacityHours}
        min={1}
        max={12}
        disabled={pending}
        onBlur={(e) => {
          const val = Number(e.target.value);
          if (val === member.dailyCapacityHours) return;
          setError(null);
          startTransition(async () => {
            try {
              await updateMemberAdminAction(member.id, {
                role: member.role,
                workEmail: member.workEmail,
                dailyCapacityHours: val,
              });
              router.refresh();
            } catch (err) {
              handleAuthError(err, "บันทึกชั่วโมงทำงานไม่สำเร็จ ลองใหม่อีกครั้ง");
            }
          });
        }}
        className="input w-20"
        title="Daily capacity (hours)"
      />

      <div className="flex items-center gap-1">
        <input
          type="text"
          placeholder="New PIN"
          value={pinValue}
          onChange={(e) => setPinValue(e.target.value)}
          className="input w-24"
        />
        <button
          type="button"
          disabled={pending || pinValue.length < 4}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                await resetPinAction(member.id, pinValue);
                setPinMsg("Reset ✅");
                setPinValue("");
              } catch (err) {
                handleAuthError(err, "รีเซ็ต PIN ไม่สำเร็จ ลองใหม่อีกครั้ง");
              }
            });
          }}
          className="text-xs font-semibold rounded-full px-2 py-1.5"
          style={{ background: "var(--offwhite)" }}
        >
          Reset PIN
        </button>
        {pinMsg && <span className="text-xs" style={{ color: "#3c6b0f" }}>{pinMsg}</span>}
      </div>

      {error && <p className="text-xs w-full" style={{ color: "#a12b2b" }}>⚠️ {error}</p>}

      <style jsx>{`
        .input {
          border: 1px solid var(--line);
          border-radius: 0.6rem;
          padding: 0.4rem 0.6rem;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
}

export function MembersAdminSection({ members }: { members: MemberRow[] }) {
  return (
    <div className="card p-5">
      <h2 className="font-bold mb-2">Team Members</h2>
      <p className="text-xs text-[var(--muted)] mb-2">Role, work email, daily capacity, and PIN can be changed here — no code changes needed.</p>
      <div>
        {members.map((m) => <MemberRowEditor key={m.id} member={m} />)}
      </div>
    </div>
  );
}
