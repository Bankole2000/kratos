import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { TagAssignmentsModule } from '../../common/tag-assignments/tag-assignments.module';
import { createTagAssignmentsController } from '../../common/tag-assignments/tag-assignments.controller-factory';
import { ResourceVersioningModule } from '../../common/sync/resource-versioning.module';

const CategoryTagsController = createTagAssignmentsController('categories', {
  parentDelegate: 'category',
  joinDelegate: 'categoryTag',
  entityKey: 'categoryId',
  entityLabel: 'Category',
});

@Module({
  imports: [TagAssignmentsModule, ResourceVersioningModule],
  controllers: [CategoriesController, CategoryTagsController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
