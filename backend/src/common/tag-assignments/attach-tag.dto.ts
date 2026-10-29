import { IsOptional, IsString, IsUUID } from 'class-validator';

export class AttachTagDto {
  @IsOptional()
  @IsUUID()
  tagId?: string;

  @IsOptional()
  @IsString()
  name?: string;
}
