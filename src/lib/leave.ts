import { formatDateOnly } from "./date-only";

const DAY_CODES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function toDateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function isWorkingDay(date: Date, workingDays: string[], holidays: string[]): boolean {
  const code = DAY_CODES[date.getDay()];
  if (!workingDays.includes(code)) return false;
  if (holidays.includes(formatDateOnly(date))) return false;
  return true;
}

/** Inclusive count of working days between start and end (both dates included). */
export function countLeaveDays(
  startDate: Date,
  endDate: Date,
  workingDays: string[],
  holidays: string[]
): number {
  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate);
  if (end < start) return 0;
  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    if (isWorkingDay(cursor, workingDays, holidays)) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

/** Calendar-day advance notice, matching the spec's "today vs leave start date" framing. */
export function advanceNoticeDays(requestedAt: Date, leaveStartDate: Date): number {
  const req = toDateOnly(requestedAt);
  const start = toDateOnly(leaveStartDate);
  const diffMs = start.getTime() - req.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function approvalDeadline(requestedAt: Date, slaDays: number): Date {
  const d = new Date(requestedAt);
  d.setDate(d.getDate() + slaDays);
  return d;
}

export function isApprovalOverdue(requestedAt: Date, slaDays: number, status: string, now: Date = new Date()): boolean {
  if (status !== "PENDING") return false;
  return now > approvalDeadline(requestedAt, slaDays);
}

export function annualLeaveNoticeWarning(
  leaveType: string,
  requestedAt: Date,
  leaveStartDate: Date,
  noticeDaysRequired: number
): string | null {
  if (leaveType !== "ANNUAL") return null;
  const notice = advanceNoticeDays(requestedAt, leaveStartDate);
  if (notice < noticeDaysRequired) {
    return `กรุณายื่นลาพักร้อนล่วงหน้าอย่างน้อย ${noticeDaysRequired} วัน (ยื่นล่วงหน้า ${notice} วัน)`;
  }
  return null;
}
