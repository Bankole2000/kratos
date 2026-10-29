import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../datasources/prisma/prisma.service';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { ListUnitsDto } from './dto/list-units.dto';

@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUnitDto) {
    return this.prisma.unit.create({ data: dto as Prisma.UnitCreateInput });
  }

  async findAll(query: ListUnitsDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.UnitWhereInput = {
      ...(query.search && { name: { contains: query.search, mode: 'insensitive' } }),
      ...(query.unitCategory && { unitCategory: query.unitCategory }),
    };

    const [items, total] = await Promise.all([
      this.prisma.unit.findMany({ where, take: query.limit, skip: query.offset, orderBy: [{ unitCategory: 'asc' }, { name: 'asc' }] }),
      this.prisma.unit.count({ where }),
    ]);

    return { items, limit: query.limit, offset: query.offset, total };
  }

  async findOne(id: string) {
    const unit = await this.prisma.unit.findUnique({ where: { id } });
    if (!unit) throw new NotFoundException(`Unit ${id} not found`);
    return unit;
  }

  async update(id: string, dto: UpdateUnitDto) {
    await this.findOne(id);
    return this.prisma.unit.update({ where: { id }, data: dto as Prisma.UnitUpdateInput });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.unit.delete({ where: { id } });
  }
}
