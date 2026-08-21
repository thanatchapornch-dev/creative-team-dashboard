"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCompanySettingsAction } from "@/app/(app)/settings/actions";
import type { ResolvedSettings } from "@/lib/settings";

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export function CompanySettingsForm({ settings }: { settings: ResolvedSettings }) {
  const [pending, startTransition] = useTransition();
  const [workingDays, setWorkingDays] = useState<string[]>(settings.workingDays);
  const [holidays, setHolidays] = useState<string[]>(settings.holidays);
  const [newHoliday, setNewHoliday] = useState("");
  const [theme, setTheme] = useState(settings.themeColors);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  function toggleDay(day: string) {
    setWorkingDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  return (
    <form
      className="card p-5 flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          await updateCompanySettingsAction({
            companyName: String(fd.get("companyName")),
            workingDays,
            holidays,
            annualLeaveNoticeDays: Number(fd.get("annualLeaveNoticeDays")),
            approvalSlaDays: Number(fd.get("approvalSlaDays")),
            taskReminderDaysBefore: Number(fd.get("taskReminderDaysBefore")),
            themeColors: theme,
          });
          setSaved(true);
          router.refresh();
        });
      }}
    >
      <h2 className="font-bold">Company Settings</h2>

      <label className="text-xs text-[var(--muted)] flex flex-col gap-1">
        Company Name
        <input name="companyName" defaultValue={settings.companyName} className="input" />
      </label>

      <div>
        <p className="text-xs text-[var(--muted)] mb-1">Working Days</p>
        <div className="flex gap-1 flex-wrap">
          {WEEKDAYS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(d)}
              className="text-xs px-3 py-1 rounded-full font-semibold"
              style={{
                background: workingDays.includes(d) ? "var(--orange)" : "var(--offwhite)",
                color: workingDays.includes(d) ? "white" : "inherit",
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-[var(--muted)] mb-1">Company Holidays</p>
        <div className="flex gap-2 mb-2">
          <input type="date" value={newHoliday} onChange={(e) => setNewHoliday(e.target.value)} className="input" />
          <button
            type="button"
            onClick={() => {
              if (newHoliday && !holidays.includes(newHoliday)) {
                setHolidays([...holidays, newHoliday].sort());
                setNewHoliday("");
              }
            }}
            className="rounded-full px-3 text-xs font-semibold"
            style={{ background: "var(--offwhite)" }}
          >
            + Add
          </button>
        </div>
        <div className="flex gap-1 flex-wrap">
          {holidays.map((h) => (
            <span key={h} className="pill pill-muted">
              {h}
              <button type="button" onClick={() => setHolidays(holidays.filter((x) => x !== h))}>✕</button>
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <label className="text-xs text-[var(--muted)] flex flex-col gap-1">
          Annual Leave Notice (days)
          <input name="annualLeaveNoticeDays" type="number" min={0} defaultValue={settings.annualLeaveNoticeDays} className="input" />
        </label>
        <label className="text-xs text-[var(--muted)] flex flex-col gap-1">
          Approval SLA (days)
          <input name="approvalSlaDays" type="number" min={1} defaultValue={settings.approvalSlaDays} className="input" />
        </label>
        <label className="text-xs text-[var(--muted)] flex flex-col gap-1">
          Task Reminder (days before)
          <input name="taskReminderDaysBefore" type="number" min={0} defaultValue={settings.taskReminderDaysBefore} className="input" />
        </label>
      </div>

      <div>
        <p className="text-xs text-[var(--muted)] mb-2">Theme Colors</p>
        <div className="grid grid-cols-4 gap-3">
          {(["navy", "offwhite", "orange", "lime"] as const).map((key) => (
            <label key={key} className="flex flex-col items-center gap-1 text-xs">
              {key}
              <input
                type="color"
                value={theme[key]}
                onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
                className="w-10 h-10 rounded"
              />
            </label>
          ))}
        </div>
      </div>

      {saved && <p className="text-sm" style={{ color: "#3c6b0f" }}>✅ Saved</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full px-4 py-2 text-sm font-semibold self-start"
        style={{ background: "var(--orange)", color: "white", opacity: pending ? 0.6 : 1 }}
      >
        Save Settings
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
