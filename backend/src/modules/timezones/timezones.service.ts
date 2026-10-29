import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../datasources/prisma/prisma.service';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { ResourceVersioningService } from '../../common/sync/resource-versioning.service';
import { CreateTimezoneDto } from './dto/create-timezone.dto';
import { UpdateTimezoneDto } from './dto/update-timezone.dto';
import { ListTimezonesDto } from './dto/list-timezones.dto';

const RESOURCE_TYPE_KEY = 'timezone';

@Injectable()
export class TimezonesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versioning: ResourceVersioningService,
  ) {}

  async create(dto: CreateTimezoneDto) {
    try {
      return await this.versioning.writeWithVersion(RESOURCE_TYPE_KEY, (tx, version) =>
        tx.timezone.create({ data: { ...dto, version } as Prisma.TimezoneCreateInput }),
      );
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('A timezone with this identifier already exists');
      }
      throw err;
    }
  }

  async findAll(query: ListTimezonesDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.TimezoneWhereInput = {
      ...(query.search && { identifier: { contains: query.search, mode: 'insensitive' } }),
    };

    const [items, total] = await Promise.all([
      this.prisma.timezone.findMany({ where, take: query.limit, skip: query.offset, orderBy: { identifier: 'asc' } }),
      this.prisma.timezone.count({ where }),
    ]);

    return { items, limit: query.limit, offset: query.offset, total };
  }

  async findOne(id: string) {
    const timezone = await this.prisma.timezone.findUnique({ where: { id } });
    if (!timezone) throw new NotFoundException(`Timezone ${id} not found`);
    return timezone;
  }

  async update(id: string, dto: UpdateTimezoneDto) {
    await this.findOne(id);
    try {
      return await this.versioning.writeWithVersion(RESOURCE_TYPE_KEY, (tx, version) =>
        tx.timezone.update({ where: { id }, data: { ...dto, version } as Prisma.TimezoneUpdateInput }),
      );
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('A timezone with this identifier already exists');
      }
      throw err;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.versioning.writeWithVersion(RESOURCE_TYPE_KEY, (tx) => tx.timezone.delete({ where: { id } }));
  }
}
