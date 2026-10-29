import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateTimezoneDto {
  @IsString()
  identifier: string;

  @IsString()
  utcOffset: string;

  @IsString()
  displayName: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
