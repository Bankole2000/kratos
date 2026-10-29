import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  projectId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  rateLimitPerMin?: number;
}
