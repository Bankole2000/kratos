import { Injectable, Logger } from '@nestjs/common';
import Handlebars from 'handlebars';
import { NotificationChannel } from '../../../generated/prisma/client';
import { PrismaService } from '../../datasources/prisma/prisma.service';
import { ChannelTemplates, EmailContent, InAppContent, PushContent, RenderedContent, SmsContent } from './messaging.types';
import { DEFAULT_TEMPLATES } from './templates.default';

const CHANNEL_TO_TEMPLATE_KEY: Record<NotificationChannel, keyof ChannelTemplates> = {
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  IN_APP: 'in_app',
};

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name, { timestamp: true });

  constructor(private readonly prisma: PrismaService) {}

  async render(projectId: string, key: string, channel: NotificationChannel, data: Record<string, unknown>): Promise<RenderedContent | null> {
    const source = await this.resolveSource(projectId, key, channel);
    if (!source) {
      this.logger.warn(`No template found for ${key}/${channel} (project ${projectId})`);
      return null;
    }
    return this.renderSource(channel, source, data);
  }

  // Resolution order: project-specific override (if isActive) first, then
  // the global override (projectId null, if isActive), then the file-based
  // default — lets an operator override built-in copy per-project or
  // platform-wide without a deploy, while still shipping working defaults
  // out of the box.
  private async resolveSource(projectId: string, key: string, channel: NotificationChannel): Promise<Record<string, string> | null> {
    const projectTemplate = await this.prisma.notificationTemplate.findUnique({
      where: { projectId_key_channel: { projectId, key, channel } },
    });
    if (projectTemplate?.isActive) {
      return projectTemplate.content as Record<string, string>;
    }

    // findUnique can't take a literal null in a compound-unique key (Prisma
    // limitation), even though the underlying Postgres index allows it —
    // findFirst on the equivalent filter is the documented workaround.
    const globalTemplate = await this.prisma.notificationTemplate.findFirst({
      where: { projectId: null, key, channel },
    });
    if (globalTemplate?.isActive) {
      return globalTemplate.content as Record<string, string>;
    }

    const defaults = DEFAULT_TEMPLATES[key];
    const channelKey = CHANNEL_TO_TEMPLATE_KEY[channel];
    if (defaults?.[channelKey]) {
      return defaults[channelKey] as unknown as Record<string, string>;
    }

    return null;
  }

  private renderSource(channel: NotificationChannel, source: Record<string, string>, data: Record<string, unknown>): RenderedContent {
    const r = (tpl: string) => Handlebars.compile(tpl)(data);

    switch (channel) {
      case 'EMAIL':
        return {
          subject: r(source.subject ?? ''),
          html: r(source.html ?? ''),
          text: source.text ? r(source.text) : undefined,
        } satisfies EmailContent;

      case 'SMS':
        return { text: r(source.text ?? '') } satisfies SmsContent;

      case 'PUSH':
        return {
          title: r(source.title ?? ''),
          body: r(source.body ?? ''),
          actionUrl: source.actionUrl ? r(source.actionUrl) : undefined,
          imageUrl: source.imageUrl ? r(source.imageUrl) : undefined,
        } satisfies PushContent;

      case 'IN_APP':
        return {
          title: r(source.title ?? ''),
          body: r(source.body ?? ''),
          actionUrl: source.actionUrl ? r(source.actionUrl) : undefined,
          icon: source.icon,
        } satisfies InAppContent;
    }
  }
}
