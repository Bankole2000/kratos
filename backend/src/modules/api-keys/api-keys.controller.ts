import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { ListApiKeysDto } from './dto/list-api-keys.dto';

@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  create(@Body() dto: CreateApiKeyDto) {
    return this.apiKeysService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListApiKeysDto) {
    return this.apiKeysService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.apiKeysService.findOne(id);
  }

  @Post(':id/revoke')
  revoke(@Param('id', ParseUUIDPipe) id: string) {
    return this.apiKeysService.revoke(id);
  }
}
