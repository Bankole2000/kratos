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
import { CategoryGroupsService } from './category-groups.service';
import { CreateCategoryGroupDto } from './dto/create-category-group.dto';
import { UpdateCategoryGroupDto } from './dto/update-category-group.dto';
import { ListCategoryGroupsDto } from './dto/list-category-groups.dto';

@Controller('category-groups')
export class CategoryGroupsController {
  constructor(private readonly categoryGroupsService: CategoryGroupsService) {}

  @Post()
  create(@Body() dto: CreateCategoryGroupDto) {
    return this.categoryGroupsService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListCategoryGroupsDto) {
    return this.categoryGroupsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoryGroupsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryGroupDto) {
    return this.categoryGroupsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoryGroupsService.remove(id);
  }
}
