import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { TagAssignmentsModule } from '../../common/tag-assignments/tag-assignments.module';
import { createTagAssignmentsController } from '../../common/tag-assignments/tag-assignments.controller-factory';

const CompanyTagsController = createTagAssignmentsController('companies', {
  parentDelegate: 'company',
  joinDelegate: 'companyTag',
  entityKey: 'companyId',
  entityLabel: 'Company',
});

@Module({
  imports: [TagAssignmentsModule],
  controllers: [CompaniesController, CompanyTagsController],
  providers: [CompaniesService],
})
export class CompaniesModule {}
