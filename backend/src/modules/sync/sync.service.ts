import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../datasources/prisma/prisma.service';
import { SYNC_RESOURCE_REGISTRY, SyncResourceConfig } from './sync-resource.registry';

interface DelegateShape {
  findMany: (args: unknown) => Promise<Record<string, unknown>[]>;
}

export interface FullSyncResult {
  version: number;
  items: unknown[];
}

export interface DeltaSyncResult {
  version: number;
  changed: unknown[];
  allIds: string[];
}

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  private getConfig(resourceType: string): SyncResourceConfig {
    const config = SYNC_RESOURCE_REGISTRY[resourceType];
    if (!config) throw new NotFoundException(`Unknown or non-syncable resource type "${resourceType}"`);
    return config;
  }

  private async getCurrentVersion(resourceType: string): Promise<number> {
    const record = await this.prisma.resourceType.findUnique({ where: { key: resourceType } });
    if (!record) throw new NotFoundException(`Unknown or non-syncable resource type "${resourceType}"`);
    if (record.classification !== 'SYNC') {
      throw new NotFoundException(`Resource type "${resourceType}" is not SYNC-classified`);
    }
    return record.version;
  }

  async getFullSet(resourceType: string): Promise<FullSyncResult> {
    const config = this.getConfig(resourceType);
    const version = await this.getCurrentVersion(resourceType);

    const delegate = this.prisma[config.delegate] as unknown as DelegateShape;
    const rows = await delegate.findMany({ orderBy: { id: 'asc' } });
    const items = config.serialize ? rows.map(config.serialize) : rows;

    return { version, items };
  }

  async getDelta(resourceType: string, since: number): Promise<DeltaSyncResult> {
    const config = this.getConfig(resourceType);
    const version = await this.getCurrentVersion(resourceType);

    const delegate = this.prisma[config.delegate] as unknown as DelegateShape;
    const [changedRows, allRows] = await Promise.all([
      delegate.findMany({ where: { version: { gt: since } }, orderBy: { id: 'asc' } }),
      delegate.findMany({ select: { id: true }, orderBy: { id: 'asc' } }),
    ]);

    const changed = config.serialize ? changedRows.map(config.serialize) : changedRows;
    const allIds = allRows.map((row) => row.id as string);

    return { version, changed, allIds };
  }
}
