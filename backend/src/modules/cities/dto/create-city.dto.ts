import { IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCityDto {
  @IsUUID()
  countryId: string;

  @IsOptional()
  @IsUUID()
  provinceId?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
