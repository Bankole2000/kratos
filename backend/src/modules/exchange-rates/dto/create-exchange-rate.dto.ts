import { IsNumber, IsObject, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

export class CreateExchangeRateDto {
  @IsUUID()
  baseCurrencyId: string;

  @IsUUID()
  quoteCurrencyId: string;

  @IsNumber()
  @IsPositive()
  rate: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
