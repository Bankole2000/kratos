import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { CurrencyKind } from '../../../../generated/prisma/enums';

export class ListCurrenciesDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(CurrencyKind)
  kind?: CurrencyKind;
}
