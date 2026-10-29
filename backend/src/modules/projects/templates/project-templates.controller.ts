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
import { NotificationTemplatesService } from '../../messaging/notification-templates.service';
import { CreateNotificationTemplateDto } from '../../messaging/dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from '../../messaging/dto/update-notification-template.dto';
import { ListNotificationTemplatesDto } from '../../messaging/dto/list-notification-templates.dto';

@Controller('projects/:projectId/templates')
export class ProjectTemplatesController {
  constructor(private readonly templatesService: NotificationTemplatesService) {}

  @Post()
  create(@Param('projectId', ParseUUIDPipe) projectId: string, @Body() dto: CreateNotificationTemplateDto) {
    return this.templatesService.create(projectId, dto);
  }

  @Get()
  findAll(@Param('projectId', ParseUUIDPipe) projectId: string, @Query() query: ListNotificationTemplatesDto) {
    return this.templatesService.findAll(projectId, query);
  }

  @Get(':id')
  findOne(@Param('projectId', ParseUUIDPipe) projectId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.templatesService.findOne(projectId, id);
  }

  @Patch(':id')
  update(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNotificationTemplateDto,
  ) {
    return this.templatesService.update(projectId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('projectId', ParseUUIDPipe) projectId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.templatesService.remove(projectId, id);
  }
}
