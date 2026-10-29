import { ChannelSendResult, NotificationChannelName, NotificationRecipient, RenderedContent } from './messaging.types';

export interface INotificationChannel {
  readonly channel: NotificationChannelName;
  send(content: RenderedContent, recipient: NotificationRecipient, notificationType?: string): Promise<ChannelSendResult>;
}
