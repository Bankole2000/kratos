import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { NotificationChannel } from '../../../../generated/prisma/client';

export class ListNotificationTemplatesDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;
}
