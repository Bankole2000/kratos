import { Module } from '@nestjs/common';
import { BanksController } from './banks.controller';
import { BanksService } from './banks.service';
import { TagAssignmentsModule } from '../../common/tag-assignments/tag-assignments.module';
import { createTagAssignmentsController } from '../../common/tag-assignments/tag-assignments.controller-factory';

const BankTagsController = createTagAssignmentsController('banks', {
  parentDelegate: 'bank',
  joinDelegate: 'bankTag',
  entityKey: 'bankId',
  entityLabel: 'Bank',
});

@Module({
  imports: [TagAssignmentsModule],
  controllers: [BanksController, BankTagsController],
  providers: [BanksService],
})
export class BanksModule {}
