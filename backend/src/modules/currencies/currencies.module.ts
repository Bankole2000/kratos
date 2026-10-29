import { Module } from '@nestjs/common';
import { CurrenciesController } from './currencies.controller';
import { CurrenciesService } from './currencies.service';
import { ResourceVersioningModule } from '../../common/sync/resource-versioning.module';

@Module({
  imports: [ResourceVersioningModule],
  controllers: [CurrenciesController],
  providers: [CurrenciesService],
})
export class CurrenciesModule {}
