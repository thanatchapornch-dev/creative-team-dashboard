export type EuniteParseResult = {
  matchedMemberId: string | null;
  leaveType: string;
  date: string | null;
  reason: string;
};

export type EuniteMember = { id: string; nickname: string; name: string; aliases?: string[] };

const TYPE_KEYWORDS: [string, string][] = [
  ["ลาป่วย", "SICK"],
  ["ลากิจ", "BUSINESS"],
  ["ลาพักร้อน", "ANNUAL"],
  ["ฉุกเฉิน", "URGENT"],
];

/**
 * Parses a row copied from EUNITE's pending-approval table, e.g.
 * "ลาพักร้อน วันที่ 21/09/2569 เหตุผล ไปต่างจังหวัด 19-21 กย.	วิชญ์ มีนรักษ์เรืองเดช"
 * A table-row copy usually keeps the columns tab/newline-separated, so the
 * document text and the requester's name are split apart before parsing —
 * otherwise the name ends up appended onto the extracted reason.
 *
 * Only handles what's unambiguous: a single "วันที่ DD/MM/YYYY" (Buddhist
 * year) and the "เหตุผล ..." text. EUNITE's title line sometimes shows only
 * one date even when the reason text mentions a wider range (e.g. "19-21
 * กย." above) — that's left for the person reviewing the pre-filled form to
 * catch, not guessed at here.
 */
export function parseEuniteText(text: string, members: EuniteMember[]): EuniteParseResult {
  const segments = text
    .split(/\t|\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const mainText = segments[0] ?? text;

  let leaveType = "OTHER";
  for (const [kw, type] of TYPE_KEYWORDS) {
    if (mainText.includes(kw)) {
      leaveType = type;
      break;
    }
  }

  const dateMatch = mainText.match(/วันที่\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  let date: string | null = null;
  if (dateMatch) {
    const [, d, m, yBE] = dateMatch;
    const yCE = Number(yBE) - 543;
    date = `${yCE}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const reasonMatch = mainText.match(/เหตุผล\s*([\s\S]+)/);
  const reason = reasonMatch ? reasonMatch[1].trim() : mainText.trim();

  const haystack = text.toLowerCase();
  let matchedMemberId: string | null = null;
  for (const m of members) {
    const candidates = [m.name, ...(m.aliases ?? [])];
    if (candidates.some((c) => c.length > 2 && haystack.includes(c.toLowerCase()))) {
      matchedMemberId = m.id;
      break;
    }
  }
  if (!matchedMemberId) {
    for (const m of members) {
      if (haystack.includes(m.nickname.toLowerCase())) {
        matchedMemberId = m.id;
        break;
      }
    }
  }

  return { matchedMemberId, leaveType, date, reason };
}
