import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class ListIndustriesDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
}
