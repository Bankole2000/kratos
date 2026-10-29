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
import { TimezonesService } from './timezones.service';
import { CreateTimezoneDto } from './dto/create-timezone.dto';
import { UpdateTimezoneDto } from './dto/update-timezone.dto';
import { ListTimezonesDto } from './dto/list-timezones.dto';

@Controller('timezones')
export class TimezonesController {
  constructor(private readonly timezonesService: TimezonesService) {}

  @Post()
  create(@Body() dto: CreateTimezoneDto) {
    return this.timezonesService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListTimezonesDto) {
    return this.timezonesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.timezonesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTimezoneDto) {
    return this.timezonesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.timezonesService.remove(id);
  }
}
