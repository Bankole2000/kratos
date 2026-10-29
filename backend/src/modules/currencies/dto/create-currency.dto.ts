import { IsEnum, IsInt, IsObject, IsOptional, IsString, Length, Min } from 'class-validator';
import { CurrencyKind } from '../../../../generated/prisma/enums';

export class CreateCurrencyDto {
  @IsString()
  @Length(1, 16)
  code: string;

  @IsString()
  name: string;

  @IsString()
  symbol: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  decimalDigits?: number;

  @IsOptional()
  @IsEnum(CurrencyKind)
  kind?: CurrencyKind;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
