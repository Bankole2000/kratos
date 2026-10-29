import { IsArray, IsEmail, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { NotificationChannel } from '../../../../generated/prisma/client';

export class SendMessageDto {
  @IsString()
  templateKey: string;

  @IsString()
  notificationType: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsObject()
  data: Record<string, unknown>;

  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];
}
