import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class ListTagsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
}
