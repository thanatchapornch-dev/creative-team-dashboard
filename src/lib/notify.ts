import { prisma } from "./prisma";

const DASHBOARD_URL = "https://creative-team-dashboard-azure.vercel.app";

export type NotifyInput = {
  recipientId: string;
  type: string;
  title: string;
  body: string;
  relatedType?: string;
  relatedId?: string;
  sendEmail?: boolean;
};

/**
 * Every automation event goes through here: always logged in-app, and — when
 * sendEmail is requested — queued for the Apps Script relay to pick up.
 *
 * Email is queued rather than sent directly because this org's Workspace
 * policy blocks inbound calls to Apps Script Web Apps from outside Google,
 * so a push model (this app calling out to send mail) can't work here. The
 * relay instead polls GET /api/email-queue from inside Apps Script itself,
 * which Workspace does allow, and calls MailApp.sendEmail there.
 */
export async function notify(input: NotifyInput) {
  const inApp = await prisma.notificationLog.create({
    data: {
      recipientId: input.recipientId,
      type: input.type,
      title: input.title,
      body: input.body,
      relatedType: input.relatedType ?? "",
      relatedId: input.relatedId ?? "",
      channel: "IN_APP",
      status: "SENT",
    },
  });

  if (!input.sendEmail) return { inApp };

  const recipient = await prisma.member.findUnique({ where: { id: input.recipientId } });

  const emailLog = await prisma.notificationLog.create({
    data: {
      recipientId: input.recipientId,
      type: input.type,
      title: input.title,
      body: `${input.body}\n\nเข้าดูรายละเอียดที่แดชบอร์ด: ${DASHBOARD_URL}`,
      relatedType: input.relatedType ?? "",
      relatedId: input.relatedId ?? "",
      channel: "EMAIL",
      status: recipient?.workEmail ? "QUEUED" : "SKIPPED_NO_PROVIDER",
    },
  });

  return { inApp, email: emailLog };
}

export type NotifyExternalInput = {
  email: string;
  type: string;
  title: string;
  body: string;
};

/**
 * For recipients who aren't a Member (e.g. someone outside the team
 * submitting the public equipment-borrow form) — queued the same way as
 * notify()'s email, but with no in-app log (there's no account to attach it
 * to) and no dashboard link in the body, since an external person has
 * nowhere to log in to.
 */
export async function notifyExternalEmail(input: NotifyExternalInput) {
  if (!input.email) return null;
  return prisma.notificationLog.create({
    data: {
      recipientId: null,
      externalEmail: input.email,
      type: input.type,
      title: input.title,
      body: input.body,
      channel: "EMAIL",
      status: "QUEUED",
    },
  });
}
