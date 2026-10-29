import { IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBankDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsString()
  swiftBic?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
