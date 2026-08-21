import { prisma } from "./prisma";
import { getEmailProvider } from "./email/provider";

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
 * sendEmail is requested — attempts the configured email provider. With no
 * provider wired yet this records SKIPPED_NO_PROVIDER instead of silently
 * dropping the event, so the audit trail (who/when/what/status) stays honest.
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
  const provider = getEmailProvider();

  if (!recipient?.workEmail) {
    const emailLog = await prisma.notificationLog.create({
      data: {
        recipientId: input.recipientId,
        type: input.type,
        title: input.title,
        body: input.body,
        relatedType: input.relatedType ?? "",
        relatedId: input.relatedId ?? "",
        channel: "EMAIL",
        status: "SKIPPED_NO_PROVIDER",
      },
    });
    return { inApp, email: emailLog };
  }

  const result = await provider.send({
    to: recipient.workEmail,
    subject: input.title,
    body: input.body,
  });

  const emailLog = await prisma.notificationLog.create({
    data: {
      recipientId: input.recipientId,
      type: input.type,
      title: input.title,
      body: input.body,
      relatedType: input.relatedType ?? "",
      relatedId: input.relatedId ?? "",
      channel: "EMAIL",
      status: result.sent ? "SENT" : "SKIPPED_NO_PROVIDER",
    },
  });

  return { inApp, email: emailLog };
}
