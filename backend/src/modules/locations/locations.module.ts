import { Module } from '@nestjs/common';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { TagAssignmentsModule } from '../../common/tag-assignments/tag-assignments.module';
import { createTagAssignmentsController } from '../../common/tag-assignments/tag-assignments.controller-factory';

const LocationTagsController = createTagAssignmentsController('locations', {
  parentDelegate: 'location',
  joinDelegate: 'locationTag',
  entityKey: 'locationId',
  entityLabel: 'Location',
});

@Module({
  imports: [TagAssignmentsModule],
  controllers: [LocationsController, LocationTagsController],
  providers: [LocationsService],
})
export class LocationsModule {}
