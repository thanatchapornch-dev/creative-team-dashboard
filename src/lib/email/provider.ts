import { Resend } from "resend";

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
 * No provider is configured yet (no RESEND_API_KEY set).
 * Every call is a no-op that reports why nothing went out, so callers can
 * log it accurately instead of pretending to send.
 */
class NoopEmailProvider implements EmailProvider {
  async send(_message: EmailMessage): Promise<EmailSendResult> {
    return { sent: false, reason: "No email provider configured. Set RESEND_API_KEY." };
  }
}

class ResendProvider implements EmailProvider {
  private client: Resend;
  private from: string;

  constructor(apiKey: string, from: string) {
    this.client = new Resend(apiKey);
    this.from = from;
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const { error } = await this.client.emails.send({
      from: this.from,
      to: message.to,
      subject: message.subject,
      text: message.body,
    });
    if (error) return { sent: false, reason: error.message };
    return { sent: true };
  }
}

let cached: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (cached) return cached;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "Creative & Production Dashboard <onboarding@resend.dev>";
  cached = apiKey ? new ResendProvider(apiKey, from) : new NoopEmailProvider();
  return cached;
}
