import { IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateVendorDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  industryId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
