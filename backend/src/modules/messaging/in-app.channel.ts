import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../datasources/prisma/prisma.service';
import { INotificationChannel } from './channel.interface';
import { ChannelSendResult, InAppContent, NotificationChannelName, NotificationRecipient, RenderedContent } from './messaging.types';

// Persists the notification only — no live delivery. CRS has no WebSocket
// infrastructure today, and the concrete use case (email verification,
// password reset) has no active session to push into anyway. A future
// "notification inbox" UI could read these rows; live push is deferred
// until a real trigger needs it.
@Injectable()
export class InAppChannel implements INotificationChannel {
  readonly channel: NotificationChannelName = 'in_app';

  constructor(private readonly prisma: PrismaService) {}

  async send(content: RenderedContent, recipient: NotificationRecipient, notificationType?: string): Promise<ChannelSendResult> {
    // IN_APP's only addressing scheme is a CRS user id — there's no session
    // to write into for a recipient with no CRS User row. Callers are meant
    // to only request this channel for recipients that have one (see
    // MessagingService.send's channel-selection guidance); this is the
    // backstop if one doesn't.
    if (!recipient.userId) {
      throw new Error('IN_APP channel requires a recipient with a CRS userId');
    }

    const { title, body, actionUrl, icon } = content as InAppContent;

    const record = await this.prisma.notification.create({
      data: {
        userId: recipient.userId,
        provider: 'IN_APP',
        channel: 'IN_APP',
        to: recipient.userId,
        title,
        body,
        actionUrl,
        notificationType,
        status: 'SENT',
        metadata: icon ? { icon } : {},
      },
    });

    return { channel: 'in_app', success: true, providerMessageId: record.id };
  }
}
