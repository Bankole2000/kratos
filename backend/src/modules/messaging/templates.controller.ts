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
import { NotificationTemplatesService } from './notification-templates.service';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';
import { ListNotificationTemplatesDto } from './dto/list-notification-templates.dto';

// Global/default template overrides — projectId is always null here. A
// project-specific override (see projects/templates/) takes precedence
// over these at render time; these take precedence over the file-based
// DEFAULT_TEMPLATES.
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: NotificationTemplatesService) {}

  @Post()
  create(@Body() dto: CreateNotificationTemplateDto) {
    return this.templatesService.create(null, dto);
  }

  @Get()
  findAll(@Query() query: ListNotificationTemplatesDto) {
    return this.templatesService.findAll(null, query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.templatesService.findOne(null, id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateNotificationTemplateDto) {
    return this.templatesService.update(null, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.templatesService.remove(null, id);
  }
}
