import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../datasources/prisma/prisma.service';
import { AttachTagDto } from './attach-tag.dto';

// The six taggable entities (Vendor, Company, Location, Category, Industry, Bank) each have an
// identically-shaped join table (entityId + tagId composite key). Rather than duplicate
// attach/detach/list logic six times, each entity's controller configures this service with
// its own Prisma delegate name and join-table key field, and gets the same behavior for free.
type JoinDelegateName = 'vendorTag' | 'companyTag' | 'locationTag' | 'categoryTag' | 'industryTag' | 'bankTag';
type ParentDelegateName = 'vendor' | 'company' | 'location' | 'category' | 'industry' | 'bank';

export interface TaggableEntityConfig {
  parentDelegate: ParentDelegateName;
  joinDelegate: JoinDelegateName;
  entityKey: string; // e.g. "vendorId"
  entityLabel: string; // e.g. "Vendor"
}

@Injectable()
export class TagAssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertParentExists(config: TaggableEntityConfig, entityId: string) {
    const delegate = this.prisma[config.parentDelegate] as unknown as {
      findUnique: (args: unknown) => Promise<unknown>;
    };
    const parent = await delegate.findUnique({ where: { id: entityId } });
    if (!parent) throw new NotFoundException(`${config.entityLabel} ${entityId} not found`);
  }

  private async resolveTagId(dto: AttachTagDto): Promise<string> {
    if (dto.tagId) {
      const tag = await this.prisma.tag.findUnique({ where: { id: dto.tagId } });
      if (!tag) throw new BadRequestException(`Tag ${dto.tagId} does not exist`);
      return tag.id;
    }
    if (dto.name) {
      const tag = await this.prisma.tag.upsert({
        where: { name: dto.name },
        create: { name: dto.name },
        update: {},
      });
      return tag.id;
    }
    throw new BadRequestException('Either tagId or name must be provided');
  }

  async attach(config: TaggableEntityConfig, entityId: string, dto: AttachTagDto) {
    await this.assertParentExists(config, entityId);
    const tagId = await this.resolveTagId(dto);

    const joinDelegate = this.prisma[config.joinDelegate] as unknown as {
      upsert: (args: unknown) => Promise<unknown>;
    };
    await joinDelegate.upsert({
      where: { [`${config.entityKey}_tagId`]: { [config.entityKey]: entityId, tagId } },
      create: { [config.entityKey]: entityId, tagId },
      update: {},
    });

    return this.prisma.tag.findUnique({ where: { id: tagId } });
  }

  async detach(config: TaggableEntityConfig, entityId: string, tagId: string) {
    await this.assertParentExists(config, entityId);
    const joinDelegate = this.prisma[config.joinDelegate] as unknown as {
      delete: (args: unknown) => Promise<unknown>;
    };
    try {
      await joinDelegate.delete({
        where: { [`${config.entityKey}_tagId`]: { [config.entityKey]: entityId, tagId } },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new NotFoundException(`Tag ${tagId} is not attached to this ${config.entityLabel.toLowerCase()}`);
      }
      throw err;
    }
  }

  async list(config: TaggableEntityConfig, entityId: string) {
    await this.assertParentExists(config, entityId);
    const joinDelegate = this.prisma[config.joinDelegate] as unknown as {
      findMany: (args: unknown) => Promise<{ tag: unknown }[]>;
    };
    const assignments = await joinDelegate.findMany({
      where: { [config.entityKey]: entityId },
      include: { tag: true },
    });
    return assignments.map((a) => a.tag);
  }
}
