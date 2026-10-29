import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class ListProjectsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
}
