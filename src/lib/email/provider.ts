import nodemailer from "nodemailer";

export type EmailMessage = {
  to: string;
  subject: string;
  body: string;
};

export type EmailSendResult = {
  sent: boolean;
  reason?: string;
};

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailSendResult>;
}

/**
 * No provider is configured yet (no SMTP env vars set).
 * Every call is a no-op that reports why nothing went out, so callers can
 * log it accurately instead of pretending to send.
 */
class NoopEmailProvider implements EmailProvider {
  async send(_message: EmailMessage): Promise<EmailSendResult> {
    return { sent: false, reason: "No email provider configured. Set SMTP_* env vars." };
  }
}

/** Sends via a Google Workspace mailbox using an App Password over SMTP. */
class GoogleWorkspaceProvider implements EmailProvider {
  private transporter: ReturnType<typeof nodemailer.createTransport>;
  private from: string;

  constructor(user: string, appPassword: string) {
    this.from = user;
    this.transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass: appPassword },
    });
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    try {
      await this.transporter.sendMail({
        from: `Creative & Production Dashboard <${this.from}>`,
        to: message.to,
        subject: message.subject,
        text: message.body,
      });
      return { sent: true };
    } catch (err) {
      return { sent: false, reason: err instanceof Error ? err.message : "SMTP send failed" };
    }
  }
}

let cached: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (cached) return cached;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_APP_PASSWORD;
  cached = user && pass ? new GoogleWorkspaceProvider(user, pass) : new NoopEmailProvider();
  return cached;
}
