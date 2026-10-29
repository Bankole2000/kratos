import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Type } from '@nestjs/common';
import { TagAssignmentsService, TaggableEntityConfig } from './tag-assignments.service';
import { AttachTagDto } from './attach-tag.dto';

// Generates a controller class for one taggable entity's nested tag routes
// (GET/POST/DELETE under /<entity-plural>/:id/tags) so the identical
// attach/detach/list behavior isn't hand-written five times.
export function createTagAssignmentsController(path: string, config: TaggableEntityConfig): Type<unknown> {
  @Controller(path)
  class TagAssignmentsControllerHost {
    constructor(public readonly tagAssignmentsService: TagAssignmentsService) {}

    @Get(':id/tags')
    list(@Param('id', ParseUUIDPipe) id: string) {
      return this.tagAssignmentsService.list(config, id);
    }

    @Post(':id/tags')
    attach(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AttachTagDto) {
      return this.tagAssignmentsService.attach(config, id, dto);
    }

    @Delete(':id/tags/:tagId')
    @HttpCode(HttpStatus.NO_CONTENT)
    detach(@Param('id', ParseUUIDPipe) id: string, @Param('tagId', ParseUUIDPipe) tagId: string) {
      return this.tagAssignmentsService.detach(config, id, tagId);
    }
  }

  return TagAssignmentsControllerHost;
}
