"use client";

import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { loginAction } from "./actions";

type MemberOption = {
  id: string;
  name: string;
  nickname: string;
  position: string;
  profilePictureUrl: string;
};

export function LoginForm({
  members,
  initialSelected,
  hasError,
}: {
  members: MemberOption[];
  initialSelected?: string;
  hasError?: boolean;
}) {
  const [selected, setSelected] = useState<string | undefined>(initialSelected);
  const selectedMember = members.find((m) => m.id === selected);

  return (
    <div className="w-full max-w-2xl">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
        {members.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setSelected(m.id)}
            className={`card flex flex-col items-center gap-2 p-4 transition ${
              selected === m.id ? "ring-2" : ""
            }`}
            style={selected === m.id ? { borderColor: "var(--orange)", boxShadow: "0 0 0 2px var(--orange)" } : undefined}
          >
            <Avatar name={m.nickname} src={m.profilePictureUrl} size={56} />
            <span className="font-semibold text-sm">{m.nickname}</span>
          </button>
        ))}
      </div>

      {selectedMember && (
        <form action={loginAction} className="card p-6 flex flex-col gap-4 items-center">
          <input type="hidden" name="memberId" value={selectedMember.id} />
          <p className="text-sm">
            เข้าสู่ระบบเป็น <span className="font-semibold">{selectedMember.nickname}</span>
          </p>
          <input
            type="password"
            name="pin"
            inputMode="numeric"
            placeholder="PIN"
            autoFocus
            className="border rounded-lg px-4 py-2 text-center text-lg tracking-widest w-40"
            style={{ borderColor: "var(--line)" }}
          />
          {hasError && <p className="text-sm" style={{ color: "#c0392b" }}>PIN ไม่ถูกต้อง ลองใหม่อีกครั้ง</p>}
          <button
            type="submit"
            className="rounded-full px-6 py-2 font-semibold"
            style={{ background: "var(--orange)", color: "white" }}
          >
            เข้าสู่ระบบ
          </button>
        </form>
      )}
    </div>
  );
}
