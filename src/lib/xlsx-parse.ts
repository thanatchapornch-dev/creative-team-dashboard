import ExcelJS from "exceljs";
import type { Worksheet } from "exceljs";

function extractSheetRows(sheet: Worksheet): { headers: string[]; rows: Record<string, string | number | null>[] } {
  const headersByCol: string[] = [];
  sheet.getRow(1).eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headersByCol[colNumber] = String(cell.value ?? "").trim();
  });

  const rows: Record<string, string | number | null>[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj: Record<string, string | number | null> = {};
    let hasValue = false;
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const header = headersByCol[colNumber];
      if (!header) return;
      const raw = cell.value;
      let value: string | number | null;
      if (raw === null || raw === undefined) {
        value = null;
      } else if (raw instanceof Date) {
        value = raw.toISOString();
      } else if (typeof raw === "object" && "text" in (raw as unknown as Record<string, unknown>)) {
        value = String((raw as unknown as { text: unknown }).text ?? "");
      } else if (typeof raw === "object" && "result" in (raw as unknown as Record<string, unknown>)) {
        value = ((raw as unknown as { result: unknown }).result ?? null) as string | number | null;
      } else {
        value = raw as string | number;
      }
      obj[header] = value;
      if (value !== null && value !== "") hasValue = true;
    });
    if (hasValue) rows.push(obj);
  });

  return { headers: headersByCol.filter(Boolean), rows };
}

/**
 * Reads an uploaded workbook into header-keyed row objects. Picks whichever
 * sheet parses out the most data rows rather than assuming the first sheet
 * holds the table — real-world exports from this team often lead with a
 * small "สรุป" (summary) tab before the actual data sheet. Rows with every
 * cell empty are dropped (blank trailing rows are common in hand-maintained
 * tracking sheets).
 */
export async function parseXlsxRows(
  buffer: ArrayBuffer
): Promise<{ headers: string[]; rows: Record<string, string | number | null>[] }> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  if (workbook.worksheets.length === 0) return { headers: [], rows: [] };

  let best = extractSheetRows(workbook.worksheets[0]);
  for (const sheet of workbook.worksheets.slice(1)) {
    const parsed = extractSheetRows(sheet);
    if (parsed.rows.length > best.rows.length) best = parsed;
  }
  return best;
}
