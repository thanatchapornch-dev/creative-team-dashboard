import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkOpenChatReminder } from "@/lib/automation";

/**
 * Polled by the Apps Script relay (time-driven trigger) since this org's
 * Workspace policy blocks external callers from reaching Apps Script Web
 * Apps directly — the relay has to be the one initiating the connection.
 * Returns queued emails and marks them SENT immediately (at-most-once
 * delivery; acceptable for a 5-person internal tool).
 */
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.EMAIL_QUEUE_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await checkOpenChatReminder();

  const queued = await prisma.notificationLog.findMany({
    where: { channel: "EMAIL", status: "QUEUED" },
    include: { recipient: true },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  if (queued.length === 0) {
    return NextResponse.json({ emails: [] });
  }

  await prisma.notificationLog.updateMany({
    where: { id: { in: queued.map((q) => q.id) } },
    data: { status: "SENT" },
  });

  return NextResponse.json({
    emails: queued
      .filter((q) => q.recipient.workEmail)
      .map((q) => ({
        to: q.recipient.workEmail,
        subject: q.title,
        body: q.body,
      })),
  });
}
