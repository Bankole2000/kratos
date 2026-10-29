import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../datasources/prisma/prisma.service';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { ResourceVersioningService } from '../../common/sync/resource-versioning.service';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { ListCurrenciesDto } from './dto/list-currencies.dto';

const RESOURCE_TYPE_KEY = 'currency';

@Injectable()
export class CurrenciesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versioning: ResourceVersioningService,
  ) {}

  async create(dto: CreateCurrencyDto) {
    try {
      return await this.versioning.writeWithVersion(RESOURCE_TYPE_KEY, (tx, version) =>
        tx.currency.create({ data: { ...dto, version } as Prisma.CurrencyCreateInput }),
      );
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('A currency with this code already exists');
      }
      throw err;
    }
  }

  async findAll(query: ListCurrenciesDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.CurrencyWhereInput = {
      ...(query.search && { name: { contains: query.search, mode: 'insensitive' } }),
      ...(query.kind && { kind: query.kind }),
    };

    const [items, total] = await Promise.all([
      this.prisma.currency.findMany({ where, take: query.limit, skip: query.offset, orderBy: { code: 'asc' } }),
      this.prisma.currency.count({ where }),
    ]);

    return { items, limit: query.limit, offset: query.offset, total };
  }

  async findOne(id: string) {
    const currency = await this.prisma.currency.findUnique({ where: { id } });
    if (!currency) throw new NotFoundException(`Currency ${id} not found`);
    return currency;
  }

  async update(id: string, dto: UpdateCurrencyDto) {
    await this.findOne(id);
    try {
      return await this.versioning.writeWithVersion(RESOURCE_TYPE_KEY, (tx, version) =>
        tx.currency.update({ where: { id }, data: { ...dto, version } as Prisma.CurrencyUpdateInput }),
      );
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('A currency with this code already exists');
      }
      throw err;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.versioning.writeWithVersion(RESOURCE_TYPE_KEY, (tx) => tx.currency.delete({ where: { id } }));
  }
}
