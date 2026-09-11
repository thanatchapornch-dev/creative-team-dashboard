import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { nextTaskCode } from "@/lib/task-code";

/**
 * Receives one row per submission of the company-wide "บรีฟจองคิวทีมงาน"
 * Google Form, pushed by a Form-bound Apps Script onFormSubmit trigger (see
 * setup notes — Google Workspace policy blocks us from pulling from Forms
 * directly, so the push has to originate from Apps Script, same relay
 * pattern as the email queue).
 *
 * Field matching is substring-based rather than exact-key, because the
 * trigger forwards Apps Script's e.namedValues verbatim (keyed by the
 * Form's own question text) — resilient to minor wording edits on the Form
 * without needing a code change here. Nothing is discarded: whatever doesn't
 * match a known field still lands in `notes` as a raw dump, and the created
 * task is always assigned to DN for triage rather than guessing an owner.
 */

type FormValues = Record<string, string | string[] | undefined>;

function normalize(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val.filter(Boolean).join(", ").trim();
  return (val ?? "").trim();
}

function findValue(data: FormValues, requiredSubstrings: string[]): string {
  for (const [key, val] of Object.entries(data)) {
    if (requiredSubstrings.every((s) => key.includes(s))) {
      const v = normalize(val);
      if (v) return v;
    }
  }
  return "";
}

function tryParseDate(raw: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.EMAIL_QUEUE_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let data: FormValues;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const dept = findValue(data, ["สำนักที่ขอ"]);
  const requesterName = findValue(data, ["ชื่อผู้ขอ"]);
  const requesterEmail = findValue(data, ["อีเมลผู้ขอ"]) || findValue(data, ["อีเมล"]);
  const briefType = findValue(data, ["ประเภทบรีฟ"]);
  const projectName = findValue(data, ["ชื่องาน"]) || findValue(data, ["โปรเจกต์"]) || "ไม่ระบุชื่องาน";
  const workType = findValue(data, ["ประเภทงาน"]);
  const location = findValue(data, ["สถานที่ถ่ายทำ"]);
  const details = findValue(data, ["รายละเอียด"]);
  const deadlineRaw = findValue(data, ["Deadline"]) || findValue(data, ["deadline"]);

  const queues = [1, 2, 3]
    .map((i) => ({
      slot: i,
      date: findValue(data, ["วันที่ต้องการใช้ทีม", `คิวที่ ${i}`]),
      start: findValue(data, ["เวลาเริ่มงาน", `คิวที่ ${i}`]),
      end: findValue(data, ["เวลาจบงาน", `คิวที่ ${i}`]),
    }))
    .filter((q) => q.date || q.start || q.end);

  const dn = await prisma.member.findFirst({ where: { role: "LEADER" } });
  if (!dn) {
    return NextResponse.json({ error: "no_leader_configured" }, { status: 500 });
  }

  const now = new Date();
  const earliestQueueDate = queues.map((q) => tryParseDate(q.date)).find((d): d is Date => d !== null);
  const deadlineDate = tryParseDate(deadlineRaw);
  const startDate = earliestQueueDate ?? now;
  const dueDate = deadlineDate ?? earliestQueueDate ?? new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const daysUntilDue = (dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
  const priority = daysUntilDue <= 3 ? "HIGH" : "MEDIUM";

  const briefLines = [
    `บรีฟจากฟอร์ม (${briefType || "บรีฟจองคิวทีมงาน"})`,
    `ผู้ขอ: ${requesterName || "ไม่ระบุ"}${requesterEmail ? ` (${requesterEmail})` : ""}`,
    dept ? `สำนักที่ขอ: ${dept}` : "",
    workType ? `ประเภทงาน: ${workType}` : "",
    location ? `สถานที่ถ่ายทำ: ${location}` : "",
    details ? `รายละเอียด: ${details}` : "",
    queues.length > 0
      ? `\nคิวที่ต้องการ:\n${queues.map((q) => `- คิวที่ ${q.slot}: ${q.date || "-"} ${q.start || ""}${q.end ? `–${q.end}` : ""}`).join("\n")}`
      : "",
    deadlineRaw ? `\nDeadline ไฟล์เสร็จ: ${deadlineRaw}` : "",
  ].filter(Boolean);

  const rawDump = Object.entries(data)
    .map(([k, v]) => `${k}: ${normalize(v)}`)
    .join("\n");

  const taskCode = await nextTaskCode();
  const task = await prisma.task.create({
    data: {
      taskCode,
      name: `📋 บรีฟจากฟอร์ม: ${projectName}`,
      project: projectName,
      requestingDept: dept,
      requesterId: dn.id,
      ownerId: dn.id,
      priority,
      brief: briefLines.join("\n"),
      startDate,
      dueDate,
      estimatedHours: 2,
      notes: `[ข้อมูลดิบจากฟอร์ม]\n${rawDump}`,
    },
  });

  try {
    await notify({
      recipientId: dn.id,
      type: "FORM_BRIEF_RECEIVED",
      title: `📋 บรีฟใหม่จากฟอร์ม: ${projectName}`,
      body: `${requesterName || "มีคน"} (${dept || "ไม่ระบุสำนัก"}) ส่งบรีฟ${briefType ? ` (${briefType})` : ""} เข้ามา — ต้องมอบหมายงานให้ทีม\n\nกำหนดส่งไฟล์: ${dueDate.toDateString()}`,
      relatedType: "Task",
      relatedId: task.id,
      sendEmail: true,
    });
  } catch (err) {
    console.error("notify DN failed for form-intake brief", task.id, err);
  }

  return NextResponse.json({ ok: true, taskCode: task.taskCode });
}
