import { Module } from '@nestjs/common';
import { ResourceVersioningService } from './resource-versioning.service';

@Module({
  providers: [ResourceVersioningService],
  exports: [ResourceVersioningService],
})
export class ResourceVersioningModule {}
