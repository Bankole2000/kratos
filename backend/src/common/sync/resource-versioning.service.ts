import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../datasources/prisma/prisma.service';

// Every SYNC-classified resource type's rows carry their own `version` column,
// stamped with whatever ResourceType.version became right after that write.
// This makes delta sync exact: WHERE version > since on the row table returns
// precisely the rows that changed after the client's last-seen version,
// without needing a separate change-log table or relying on updatedAt/clock
// comparisons. Every create/update on a sync-classified entity must go
// through this helper so the two counters never drift apart.
@Injectable()
export class ResourceVersioningService {
  constructor(private readonly prisma: PrismaService) {}

  async writeWithVersion<T>(
    resourceTypeKey: string,
    write: (tx: Prisma.TransactionClient, version: number) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const resourceType = await tx.resourceType.update({
        where: { key: resourceTypeKey },
        data: { version: { increment: 1 } },
      });
      return write(tx, resourceType.version);
    });
  }
}
