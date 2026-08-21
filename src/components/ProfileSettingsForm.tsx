"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "./Avatar";
import { updateProfileAction } from "@/app/(app)/settings/actions";

const STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "🟢 Available" },
  { value: "BUSY", label: "🟡 Busy" },
  { value: "WORKING", label: "🔵 Working" },
  { value: "URGENT", label: "🔴 Urgent / Unavailable" },
];

export function ProfileSettingsForm({
  member,
}: {
  member: { nickname: string; position: string; workEmail: string; profilePictureUrl: string; statusToday: string };
}) {
  const [pending, startTransition] = useTransition();
  const [pictureUrl, setPictureUrl] = useState(member.profilePictureUrl);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (data.url) setPictureUrl(data.url);
  }

  return (
    <form
      className="card p-5 flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          await updateProfileAction({
            nickname: String(fd.get("nickname")),
            position: String(fd.get("position")),
            workEmail: String(fd.get("workEmail")),
            statusToday: String(fd.get("statusToday")),
            profilePictureUrl: pictureUrl,
          });
          setSaved(true);
          router.refresh();
        });
      }}
    >
      <h2 className="font-bold">My Profile</h2>

      <div className="flex items-center gap-4">
        <Avatar name={member.nickname} src={pictureUrl} size={64} />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="text-sm font-semibold rounded-full px-3 py-1.5"
          style={{ background: "var(--offwhite)" }}
        >
          {uploading ? "Uploading…" : "Change Picture"}
        </button>
        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      <label className="text-xs text-[var(--muted)] flex flex-col gap-1">
        Display Name / Nickname
        <input name="nickname" defaultValue={member.nickname} required className="input" />
      </label>
      <label className="text-xs text-[var(--muted)] flex flex-col gap-1">
        Position
        <input name="position" defaultValue={member.position} required className="input" />
      </label>
      <label className="text-xs text-[var(--muted)] flex flex-col gap-1">
        Work Email
        <input name="workEmail" type="email" defaultValue={member.workEmail} className="input" placeholder="you@company.com" />
      </label>
      <label className="text-xs text-[var(--muted)] flex flex-col gap-1">
        Status Today
        <select name="statusToday" defaultValue={member.statusToday} className="input">
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>

      {saved && <p className="text-sm" style={{ color: "#3c6b0f" }}>✅ Saved</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full px-4 py-2 text-sm font-semibold self-start"
        style={{ background: "var(--orange)", color: "white", opacity: pending ? 0.6 : 1 }}
      >
        Save Profile
      </button>

      <style jsx>{`
        .input {
          border: 1px solid var(--line);
          border-radius: 0.6rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          width: 100%;
        }
      `}</style>
    </form>
  );
}
