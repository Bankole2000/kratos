import { IsBoolean, IsNumber, IsObject, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateUnitDto {
  @IsString()
  name: string;

  @IsString()
  symbol: string;

  @IsString()
  unitCategory: string;

  @IsOptional()
  @IsBoolean()
  isBaseUnit?: boolean;

  @IsNumber()
  @IsPositive()
  conversionFactor: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
