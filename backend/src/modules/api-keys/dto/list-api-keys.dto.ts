import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class ListApiKeysDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  projectId?: string;
}
