import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ExchangeRatesService } from './exchange-rates.service';
import { CreateExchangeRateDto } from './dto/create-exchange-rate.dto';
import { UpdateExchangeRateDto } from './dto/update-exchange-rate.dto';
import { ListExchangeRatesDto } from './dto/list-exchange-rates.dto';

@Controller('exchange-rates')
export class ExchangeRatesController {
  constructor(private readonly exchangeRatesService: ExchangeRatesService) {}

  @Post('refresh')
  refresh() {
    return this.exchangeRatesService.refreshFromProvider();
  }

  @Post()
  create(@Body() dto: CreateExchangeRateDto) {
    return this.exchangeRatesService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListExchangeRatesDto) {
    return this.exchangeRatesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.exchangeRatesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateExchangeRateDto) {
    return this.exchangeRatesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.exchangeRatesService.remove(id);
  }
}
