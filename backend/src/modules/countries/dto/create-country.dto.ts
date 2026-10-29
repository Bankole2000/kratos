import { IsObject, IsOptional, IsString, Length } from 'class-validator';

export class CreateCountryDto {
  @IsString()
  name: string;

  @IsString()
  @Length(2, 2)
  alpha2: string;

  @IsString()
  @Length(3, 3)
  alpha3: string;

  @IsString()
  callingCode: string;

  @IsString()
  region: string;

  @IsOptional()
  @IsString()
  flagEmoji?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
