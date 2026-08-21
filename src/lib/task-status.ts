export type DerivedBadge = "OVERDUE" | "DUE_TODAY" | "DUE_SOON" | "ON_TRACK" | "DONE";

function toDateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Computed on read from dueDate + status — never stored, so it can't go stale. */
export function deriveTaskBadge(dueDate: Date, status: string, now: Date = new Date()): DerivedBadge {
  if (status === "DONE") return "DONE";
  const today = toDateOnly(now);
  const due = toDateOnly(dueDate);
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "OVERDUE";
  if (diffDays === 0) return "DUE_TODAY";
  if (diffDays <= 2) return "DUE_SOON";
  return "ON_TRACK";
}

export const BADGE_LABEL: Record<DerivedBadge, string> = {
  OVERDUE: "OVERDUE",
  DUE_TODAY: "DUE TODAY",
  DUE_SOON: "DUE SOON",
  ON_TRACK: "ON TRACK",
  DONE: "DONE",
};

export const BADGE_EMOJI: Record<DerivedBadge, string> = {
  OVERDUE: "🔴",
  DUE_TODAY: "🟠",
  DUE_SOON: "🟡",
  ON_TRACK: "🟢",
  DONE: "🟢",
};

export const PRIORITY_EMOJI: Record<string, string> = {
  URGENT: "🔴",
  HIGH: "🟠",
  MEDIUM: "🟡",
  LOW: "🟢",
};
