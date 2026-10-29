import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../datasources/prisma/prisma.service';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Fire-and-forget by convention at call sites (`void this.auditLog.record(...)`)
  // — recording an audit entry should never add latency to or fail the
  // request that triggered it.
  async record(userId: string | null, action: string, metadata?: Prisma.InputJsonValue) {
    try {
      await this.prisma.auditLog.create({ data: { userId, action, metadata } });
    } catch (err) {
      this.logger.warn(`Failed to record audit log for action "${action}": ${err}`);
    }
  }
}
