import { BADGE_EMOJI, BADGE_LABEL, DerivedBadge, PRIORITY_EMOJI } from "@/lib/task-status";

const STATUS_TODAY_META: Record<string, { emoji: string; label: string; cls: string }> = {
  AVAILABLE: { emoji: "🟢", label: "Available", cls: "pill-lime" },
  BUSY: { emoji: "🟡", label: "Busy", cls: "pill-orange" },
  WORKING: { emoji: "🔵", label: "Working", cls: "pill-navy" },
  LEAVE: { emoji: "🟠", label: "Leave Today", cls: "pill-orange" },
  URGENT: { emoji: "🔴", label: "Urgent", cls: "pill-red" },
};

export function StatusTodayPill({ status }: { status: string }) {
  const meta = STATUS_TODAY_META[status] ?? STATUS_TODAY_META.AVAILABLE;
  return (
    <span className={`pill ${meta.cls}`}>
      {meta.emoji} {meta.label}
    </span>
  );
}

const BADGE_CLASS: Record<DerivedBadge, string> = {
  OVERDUE: "pill-red",
  DUE_TODAY: "pill-orange",
  DUE_SOON: "pill-orange",
  ON_TRACK: "pill-lime",
  DONE: "pill-lime",
};

export function TaskBadgePill({ badge }: { badge: DerivedBadge }) {
  return (
    <span className={`pill ${BADGE_CLASS[badge]}`}>
      {BADGE_EMOJI[badge]} {BADGE_LABEL[badge]}
    </span>
  );
}

const PRIORITY_CLASS: Record<string, string> = {
  URGENT: "pill-red",
  HIGH: "pill-orange",
  MEDIUM: "pill-orange",
  LOW: "pill-lime",
};

export function PriorityPill({ priority }: { priority: string }) {
  return (
    <span className={`pill ${PRIORITY_CLASS[priority] ?? "pill-muted"}`}>
      {PRIORITY_EMOJI[priority] ?? ""} {priority}
    </span>
  );
}

const TASK_STATUS_LABEL: Record<string, string> = {
  BACKLOG: "Backlog",
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  WAITING: "Waiting",
  REVIEW: "Review",
  DONE: "Done",
  BLOCKED: "Blocked",
};

export function TaskStatusPill({ status }: { status: string }) {
  const cls = status === "DONE" ? "pill-lime" : status === "BLOCKED" ? "pill-red" : "pill-muted";
  return <span className={`pill ${cls}`}>{TASK_STATUS_LABEL[status] ?? status}</span>;
}

const LEAVE_TYPE_LABEL: Record<string, string> = {
  ANNUAL: "ลาพักร้อน",
  BUSINESS: "ลากิจ",
  SICK: "ลาป่วย",
  OTHER: "ลาอื่นๆ",
  URGENT: "Urgent Leave",
};

export function LeaveTypePill({ type }: { type: string }) {
  const cls = type === "URGENT" ? "pill-red" : "pill-navy";
  return <span className={`pill ${cls}`}>{type === "URGENT" ? "🚨 " : ""}{LEAVE_TYPE_LABEL[type] ?? type}</span>;
}

const LEAVE_STATUS_META: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Pending", cls: "pill-orange" },
  APPROVED: { label: "Approved", cls: "pill-lime" },
  REJECTED: { label: "Rejected", cls: "pill-red" },
};

export function LeaveStatusPill({ status }: { status: string }) {
  const meta = LEAVE_STATUS_META[status] ?? LEAVE_STATUS_META.PENDING;
  return <span className={`pill ${meta.cls}`}>{meta.label}</span>;
}

export function CapacityBar({ pct }: { pct: number }) {
  const color = pct > 100 ? "#c0392b" : pct >= 90 ? "var(--orange)" : pct >= 70 ? "#e0b400" : "var(--lime)";
  const width = Math.min(100, pct);
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${width}%`, background: color }} />
    </div>
  );
}
