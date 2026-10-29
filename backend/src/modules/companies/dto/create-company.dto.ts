import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
