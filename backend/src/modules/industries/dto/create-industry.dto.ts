import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateIndustryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
