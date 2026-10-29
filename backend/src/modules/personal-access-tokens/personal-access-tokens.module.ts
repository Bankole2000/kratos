import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { PatController } from './pat.controller';
import { PatService } from './pat.service';
import { PatGuard } from './guards/pat.guard';

@Module({
  imports: [IdentityModule],
  controllers: [PatController],
  providers: [PatService, PatGuard],
})
export class PersonalAccessTokensModule {}
