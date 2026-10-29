import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MessagingService } from './messaging.service';
import { TemplateService } from './template.service';
import { EmailChannel } from './email.channel';
import { ResendProvider } from './resend.provider';
import { InAppChannel } from './in-app.channel';
import { NotificationTemplatesService } from './notification-templates.service';
import { TemplatesController } from './templates.controller';
import { MessagesController } from './messages.controller';

// PrismaModule is @Global(), so it's available here without a direct import,
// same as IdentityModule. MessagingService (sending) and
// NotificationTemplatesService (CRUD) are both exported — the latter so
// ProjectsModule's project-scoped templates controller can reuse it without
// duplicating Prisma queries. Channels/providers/rendering template service
// stay internal, same encapsulation level IdentityModule already uses.
@Module({
  imports: [ConfigModule],
  controllers: [TemplatesController, MessagesController],
  providers: [MessagingService, TemplateService, EmailChannel, ResendProvider, InAppChannel, NotificationTemplatesService],
  exports: [MessagingService, NotificationTemplatesService],
})
export class MessagingModule {}
