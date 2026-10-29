import { IsObject, IsOptional, IsString, Length } from 'class-validator';

export class CreateLanguageDto {
  @IsString()
  @Length(2, 2)
  code: string;

  @IsString()
  name: string;

  @IsString()
  nativeName: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
