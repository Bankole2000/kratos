import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class ListExchangeRatesDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  baseCurrencyId?: string;

  @IsOptional()
  @IsUUID()
  quoteCurrencyId?: string;
}
