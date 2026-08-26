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

/**
 * Explicit-UTC version of parseDateOnly, for anywhere that isn't guaranteed
 * to run on the server (ad-hoc scripts, tooling run from a non-UTC machine).
 * parseDateOnly's `new Date(y, m-1, d)` only lands on the right calendar day
 * because Vercel's runtime happens to be UTC — run that same call from a
 * Bangkok-timezone laptop and it silently shifts by a day. Use this instead
 * whenever the code isn't definitely running inside the deployed app.
 */
export function parseDateOnlyUTC(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** The Date shifted so its UTC getters read as Bangkok (UTC+7) local time. */
function toBangkok(now: Date): Date {
  return new Date(now.getTime() + 7 * 60 * 60 * 1000);
}

/** 0=Sunday..6=Saturday, evaluated in Bangkok local time regardless of server timezone. */
export function bangkokDayOfWeek(now: Date = new Date()): number {
  return toBangkok(now).getUTCDay();
}

/** UTC-midnight of the Monday starting the current Bangkok-local week (matches date-only storage convention). */
export function bangkokWeekStart(now: Date = new Date()): Date {
  const bkk = toBangkok(now);
  const dow = bkk.getUTCDay();
  const diffToMonday = dow === 0 ? 6 : dow - 1;
  return new Date(Date.UTC(bkk.getUTCFullYear(), bkk.getUTCMonth(), bkk.getUTCDate() - diffToMonday));
}

/** The real UTC instant corresponding to today's Bangkok-local midnight (for "have we already done X today" checks). */
export function bangkokStartOfDay(now: Date = new Date()): Date {
  const bkk = toBangkok(now);
  const utcMidnightOfBangkokDate = Date.UTC(bkk.getUTCFullYear(), bkk.getUTCMonth(), bkk.getUTCDate());
  return new Date(utcMidnightOfBangkokDate - 7 * 60 * 60 * 1000);
}
