import { Module } from '@nestjs/common';
import { LanguagesController } from './languages.controller';
import { LanguagesService } from './languages.service';
import { ResourceVersioningModule } from '../../common/sync/resource-versioning.module';

@Module({
  imports: [ResourceVersioningModule],
  controllers: [LanguagesController],
  providers: [LanguagesService],
})
export class LanguagesModule {}
