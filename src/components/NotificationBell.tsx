"use client";

import { useState } from "react";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/app/(app)/actions";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};

const TYPE_EMOJI: Record<string, string> = {
  TASK_OVERDUE: "🔴",
  TASK_DUE_SOON: "🟡",
  TASK_ASSIGNED: "🔵",
  LEAVE_SUBMITTED: "🔵",
  LEAVE_URGENT: "🚨",
  LEAVE_APPROVED: "🟢",
  LEAVE_REJECTED: "🔴",
  APPROVAL_REQUIRED: "🔴",
  APPROVAL_OVERDUE: "🔴",
  LEAVE_IMPACT: "⚠️",
};

export function NotificationBell({ notifications }: { notifications: NotificationItem[] }) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full w-10 h-10 flex items-center justify-center card"
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 rounded-full text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center px-1"
            style={{ background: "var(--orange)", color: "white" }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 card p-2 z-20 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <form action={markAllNotificationsReadAction}>
                <button type="submit" className="text-xs" style={{ color: "var(--orange)" }}>
                  Mark all read
                </button>
              </form>
            )}
          </div>
          {notifications.length === 0 && (
            <p className="text-sm text-[var(--muted)] px-2 py-4 text-center">ยังไม่มีการแจ้งเตือน</p>
          )}
          <ul className="flex flex-col gap-1">
            {notifications.map((n) => (
              <li key={n.id}>
                <form action={markNotificationReadAction.bind(null, n.id)}>
                  <button
                    type="submit"
                    className="w-full text-left rounded-lg px-2 py-2 text-sm hover:bg-black/[.03]"
                    style={{ opacity: n.readAt ? 0.55 : 1 }}
                  >
                    <span className="font-medium">
                      {TYPE_EMOJI[n.type] ?? "🔔"} {n.title}
                    </span>
                    <div className="text-xs text-[var(--muted)]">{n.body}</div>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
