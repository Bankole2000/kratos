import { Module } from '@nestjs/common';
import { IndustriesController } from './industries.controller';
import { IndustriesService } from './industries.service';
import { TagAssignmentsModule } from '../../common/tag-assignments/tag-assignments.module';
import { createTagAssignmentsController } from '../../common/tag-assignments/tag-assignments.controller-factory';

const IndustryTagsController = createTagAssignmentsController('industries', {
  parentDelegate: 'industry',
  joinDelegate: 'industryTag',
  entityKey: 'industryId',
  entityLabel: 'Industry',
});

@Module({
  imports: [TagAssignmentsModule],
  controllers: [IndustriesController, IndustryTagsController],
  providers: [IndustriesService],
})
export class IndustriesModule {}
