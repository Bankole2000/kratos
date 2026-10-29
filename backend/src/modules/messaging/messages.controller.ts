import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { CurrentProjectId } from '../../common/auth/current-project.decorator';
import { MessagingService } from './messaging.service';
import { SendMessageDto } from './dto/send-message.dto';

// Generic send entry point for any registered project's own templates —
// scoped to the calling project via its API key (see ApiKeyGuard +
// @CurrentProjectId). Distinct from the identity-specific named methods
// (sendEmailVerification/sendPasswordReset) on MessagingService, which stay
// as-is; this is the door every other project sends through.
@Controller('messages')
export class MessagesController {
  constructor(private readonly messaging: MessagingService) {}

  @Post()
  async send(@CurrentProjectId() projectId: string, @Body() dto: SendMessageDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('At least one of email or phone is required');
    }

    await this.messaging.send(
      projectId,
      dto.templateKey,
      dto.notificationType,
      { email: dto.email, phone: dto.phone },
      dto.data,
      dto.channels,
    );

    return { message: 'Queued' };
  }
}
