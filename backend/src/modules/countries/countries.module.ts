import { Module } from '@nestjs/common';
import { CountriesController } from './countries.controller';
import { CountriesService } from './countries.service';
import { ResourceVersioningModule } from '../../common/sync/resource-versioning.module';

@Module({
  imports: [ResourceVersioningModule],
  controllers: [CountriesController],
  providers: [CountriesService],
})
export class CountriesModule {}
