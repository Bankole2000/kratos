import { Module } from '@nestjs/common';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';
import { TagAssignmentsModule } from '../../common/tag-assignments/tag-assignments.module';
import { createTagAssignmentsController } from '../../common/tag-assignments/tag-assignments.controller-factory';
import { ResourceVersioningModule } from '../../common/sync/resource-versioning.module';

const VendorTagsController = createTagAssignmentsController('vendors', {
  parentDelegate: 'vendor',
  joinDelegate: 'vendorTag',
  entityKey: 'vendorId',
  entityLabel: 'Vendor',
});

@Module({
  imports: [TagAssignmentsModule, ResourceVersioningModule],
  controllers: [VendorsController, VendorTagsController],
  providers: [VendorsService],
})
export class VendorsModule {}
