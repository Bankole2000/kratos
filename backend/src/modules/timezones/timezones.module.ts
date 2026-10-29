import { Module } from '@nestjs/common';
import { TimezonesController } from './timezones.controller';
import { TimezonesService } from './timezones.service';
import { ResourceVersioningModule } from '../../common/sync/resource-versioning.module';

@Module({
  imports: [ResourceVersioningModule],
  controllers: [TimezonesController],
  providers: [TimezonesService],
})
export class TimezonesModule {}
