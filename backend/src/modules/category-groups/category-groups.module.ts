import { Module } from '@nestjs/common';
import { CategoryGroupsController } from './category-groups.controller';
import { CategoryGroupsService } from './category-groups.service';

@Module({
  controllers: [CategoryGroupsController],
  providers: [CategoryGroupsService],
})
export class CategoryGroupsModule {}
