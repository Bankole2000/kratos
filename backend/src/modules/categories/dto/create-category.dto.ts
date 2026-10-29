import { IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsUUID()
  groupId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
