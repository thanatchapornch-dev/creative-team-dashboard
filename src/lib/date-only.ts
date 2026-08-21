/**
 * Every date-only value in this app (task due dates, leave dates, holidays)
 * must be anchored to LOCAL midnight, matching how dashboard/capacity/calendar
 * code constructs comparison dates (`new Date(y, m, d)`). Using the bare
 * `new Date("YYYY-MM-DD")` constructor instead parses as UTC midnight, which
 * silently shifts to the previous/next local calendar day outside UTC — e.g.
 * in Bangkok (UTC+7) it becomes 07:00 local, breaking "is this date within
 * this leave range" checks for the first day of a range. Always go through
 * these helpers when converting a `<input type="date">` value.
 */
export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
