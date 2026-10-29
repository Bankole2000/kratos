import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class DeltaQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  since: number;
}
