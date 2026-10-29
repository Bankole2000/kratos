/**
 * Resend email provider.
 *
 * Required env vars:
 *   RESEND_API_KEY=re_...
 *   RESEND_FROM_EMAIL=noreply@yourdomain.com
 *
 * Docs: https://resend.com/docs/api-reference/emails
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  html: string;
  from?: string;
}

export interface SendEmailResult {
  providerMessageId?: string;
}

@Injectable()
export class ResendProvider {
  private readonly logger = new Logger(ResendProvider.name, { timestamp: true });
  private client: Resend | null = null;

  constructor(private readonly config: ConfigService) {}

  // Lazy client construction: a missing RESEND_API_KEY must not crash the
  // whole app at boot (every unrelated CRS feature would go down with it) —
  // it should only fail the specific send() call, consistent with
  // MessagingService's "swallow, don't throw" contract for the app as a
  // whole.
  private getClient(): Resend {
    if (!this.client) {
      this.client = new Resend(this.config.getOrThrow<string>('RESEND_API_KEY'));
    }
    return this.client;
  }

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    const from = params.from ?? this.config.getOrThrow<string>('RESEND_FROM_EMAIL');

    const { data, error } = await this.getClient().emails.send({
      from,
      to: params.to,
      subject: params.subject || '(no subject)',
      text: params.body,
      html: params.html,
    });

    if (error) {
      this.logger.warn(`Resend send failed for ${params.to}: ${error.message}`);
      throw new Error(`Resend error: ${error.message}`);
    }

    return { providerMessageId: data?.id };
  }
}
