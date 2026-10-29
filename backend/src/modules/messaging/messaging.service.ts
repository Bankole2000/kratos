import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel, NotificationProvider } from '../../../generated/prisma/client';
import { PrismaService } from '../../datasources/prisma/prisma.service';
import { TemplateService } from './template.service';
import { EmailChannel } from './email.channel';
import { InAppChannel } from './in-app.channel';
import { ChannelSendResult, NotificationRecipient, RenderedContent } from './messaging.types';

interface MessagingUser {
  id: string;
  email: string;
  name: string;
}

// Partial, not Record<NotificationChannel, ...>: SMS has no channel
// implementation yet (no SmsChannel exists), so it has no provider mapping
// either — this file never sends on that channel.
const PROVIDER_BY_CHANNEL: Partial<Record<NotificationChannel, NotificationProvider>> = {
  EMAIL: 'RESEND',
  PUSH: 'FCM',
  IN_APP: 'IN_APP',
};

// Public API for the rest of Core Platform (and, later, other consuming
// modules) — two named methods rather than a generic dispatch(key, ...)
// registry. Reusability lives in the channel/provider/template layer below,
// which any future caller can use directly or wrap in its own new method.
@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name, { timestamp: true });

  constructor(
    private readonly prisma: PrismaService,
    private readonly templateService: TemplateService,
    private readonly emailChannel: EmailChannel,
    private readonly inAppChannel: InAppChannel,
  ) {}

  async sendEmailVerification(user: MessagingUser, code: string, projectId: string): Promise<void> {
    const recipient: NotificationRecipient = { userId: user.id, email: user.email };
    await this.sendAll(projectId, 'email.verification', 'email_verification', recipient, { name: user.name, code }, ['EMAIL', 'IN_APP']);
  }

  async sendPasswordReset(user: MessagingUser, code: string, projectId: string): Promise<void> {
    const recipient: NotificationRecipient = { userId: user.id, email: user.email };
    await this.sendAll(projectId, 'password.reset', 'password_reset', recipient, { name: user.name, code }, ['EMAIL', 'IN_APP']);
  }

  // Generic entry point for any registered project's own templates — the
  // recipient here may have no corresponding CRS User row at all (e.g. a
  // user of another project), which is why NotificationRecipient.userId is
  // optional. `channels` is the caller's own choice: a project sending to a
  // recipient with no CRS session (the common case) should request ['EMAIL']
  // only, since IN_APP writes a Notification row meant to be read back via a
  // CRS-authenticated session that recipient will never have.
  async send(
    projectId: string,
    templateKey: string,
    notificationType: string,
    recipient: { email?: string; phone?: string },
    data: Record<string, unknown>,
    channels: NotificationChannel[],
  ): Promise<void> {
    await this.sendAll(projectId, templateKey, notificationType, recipient, data, channels);
  }

  // Renders the template per requested channel and sends on every one that
  // also has content for this template key — a channel with no template
  // content naturally no-ops rather than erroring.
  private async sendAll(
    projectId: string,
    templateKey: string,
    notificationType: string,
    recipient: NotificationRecipient,
    data: Record<string, unknown>,
    channels: NotificationChannel[],
  ): Promise<void> {
    await Promise.allSettled(
      channels.map((channel) => this.sendOnChannel(projectId, channel, this.channelStrategy(channel), templateKey, notificationType, recipient, data)),
    );
  }

  private channelStrategy(channel: NotificationChannel): { send(content: RenderedContent, recipient: NotificationRecipient, notificationType?: string): Promise<ChannelSendResult> } | undefined {
    if (channel === 'EMAIL') return this.emailChannel;
    if (channel === 'IN_APP') return this.inAppChannel;
    return undefined; // SMS/PUSH have no channel implementation yet
  }

  private async sendOnChannel(
    projectId: string,
    channel: NotificationChannel,
    strategy: { send(content: RenderedContent, recipient: NotificationRecipient, notificationType?: string): Promise<ChannelSendResult> } | undefined,
    templateKey: string,
    notificationType: string,
    recipient: NotificationRecipient,
    data: Record<string, unknown>,
  ): Promise<void> {
    if (!strategy) return; // requested channel has no implementation — silent no-op, not an error

    const content = await this.templateService.render(projectId, templateKey, channel, data);
    if (!content) return; // no template defined for this channel — silent no-op, not an error

    try {
      const result = await strategy.send(content, recipient, notificationType);
      // InAppChannel writes its own Notification row — logging it again here
      // would double-count every in-app send.
      if (channel !== 'IN_APP') {
        await this.logResult(recipient, channel, notificationType, result, content);
      }
    } catch (err: any) {
      const message = err?.message ?? String(err);
      this.logger.error(`Failed to send ${channel} notification (${notificationType}): ${message}`);
      if (channel !== 'IN_APP') {
        const channelName = channel.toLowerCase() as ChannelSendResult['channel'];
        await this.logResult(recipient, channel, notificationType, { channel: channelName, success: false, error: message }, content);
      }
    }
  }

  private async logResult(
    recipient: NotificationRecipient,
    channel: NotificationChannel,
    notificationType: string | undefined,
    result: ChannelSendResult,
    content: RenderedContent,
  ): Promise<void> {
    try {
      const provider = PROVIDER_BY_CHANNEL[channel];
      if (!provider) {
        this.logger.warn(`No provider mapping for channel ${channel} — skipping log`);
        return;
      }
      const c = content as unknown as Record<string, unknown>;
      // The actual delivery address, not the CRS user id — a recipient with
      // no CRS User row (userId undefined) still needs a meaningful `to`.
      const to = recipient.email ?? recipient.phone ?? recipient.userId ?? 'unknown';
      await this.prisma.notification.create({
        data: {
          userId: recipient.userId,
          provider,
          channel,
          to,
          title: (c.title as string | undefined) ?? (c.subject as string | undefined),
          body: (c.body as string | undefined) ?? (c.text as string | undefined),
          subject: c.subject as string | undefined,
          actionUrl: c.actionUrl as string | undefined,
          notificationType,
          status: result.success ? 'SENT' : 'FAILED',
          providerMessageId: result.providerMessageId,
          error: result.error,
        },
      });
    } catch (err: any) {
      this.logger.error(`Failed to log notification: ${err.message}`);
    }
  }
}
