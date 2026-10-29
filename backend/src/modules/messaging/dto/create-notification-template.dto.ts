import { IsBoolean, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { NotificationChannel } from '../../../../generated/prisma/client';

export class CreateNotificationTemplateDto {
  @IsString()
  key: string;

  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @IsObject()
  content: Record<string, string>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
