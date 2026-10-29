import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateCategoryGroupDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
