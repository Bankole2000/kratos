import { Controller, Get, Param, Query } from '@nestjs/common';
import { SyncService } from './sync.service';
import { DeltaQueryDto } from './dto/delta-query.dto';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get(':resourceType')
  getFullSet(@Param('resourceType') resourceType: string) {
    return this.syncService.getFullSet(resourceType);
  }

  @Get(':resourceType/delta')
  getDelta(@Param('resourceType') resourceType: string, @Query() query: DeltaQueryDto) {
    return this.syncService.getDelta(resourceType, query.since);
  }
}
