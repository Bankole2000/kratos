import { Module } from '@nestjs/common';
import { MessagingModule } from '../messaging/messaging.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectTemplatesController } from './templates/project-templates.controller';

@Module({
  imports: [MessagingModule],
  controllers: [ProjectsController, ProjectTemplatesController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
