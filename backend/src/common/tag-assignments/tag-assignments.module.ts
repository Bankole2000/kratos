import { Module } from '@nestjs/common';
import { TagAssignmentsService } from './tag-assignments.service';

@Module({
  providers: [TagAssignmentsService],
  exports: [TagAssignmentsService],
})
export class TagAssignmentsModule {}
