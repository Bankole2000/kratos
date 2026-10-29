import { Injectable } from '@nestjs/common';
import { INotificationChannel } from './channel.interface';
import { ResendProvider } from './resend.provider';
import { ChannelSendResult, EmailContent, NotificationChannelName, NotificationRecipient, RenderedContent } from './messaging.types';

@Injectable()
export class EmailChannel implements INotificationChannel {
  readonly channel: NotificationChannelName = 'email';

  constructor(private readonly resend: ResendProvider) {}

  async send(content: RenderedContent, recipient: NotificationRecipient): Promise<ChannelSendResult> {
    if (!recipient.email) {
      return { channel: 'email', success: false, error: 'No email address for recipient' };
    }

    const { subject, html, text, from } = content as EmailContent;

    try {
      const result = await this.resend.send({ to: recipient.email, subject, body: text ?? '', html, from });
      return { channel: 'email', success: true, providerMessageId: result.providerMessageId };
    } catch (err: any) {
      return { channel: 'email', success: false, error: err?.message ?? String(err) };
    }
  }
}
