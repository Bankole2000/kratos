import { IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateProvinceDto {
  @IsUUID()
  countryId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  divisionType: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
