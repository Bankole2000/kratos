import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../datasources/prisma/prisma.service';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { CreateIndustryDto } from './dto/create-industry.dto';
import { UpdateIndustryDto } from './dto/update-industry.dto';
import { ListIndustriesDto } from './dto/list-industries.dto';

@Injectable()
export class IndustriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateIndustryDto) {
    try {
      return await this.prisma.industry.create({ data: dto as Prisma.IndustryCreateInput });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('An industry with this name already exists');
      }
      throw err;
    }
  }

  async findAll(query: ListIndustriesDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.IndustryWhereInput = {
      ...(query.search && { name: { contains: query.search, mode: 'insensitive' } }),
    };

    const [items, total] = await Promise.all([
      this.prisma.industry.findMany({ where, take: query.limit, skip: query.offset, orderBy: { name: 'asc' } }),
      this.prisma.industry.count({ where }),
    ]);

    return { items, limit: query.limit, offset: query.offset, total };
  }

  async findOne(id: string) {
    const industry = await this.prisma.industry.findUnique({ where: { id } });
    if (!industry) throw new NotFoundException(`Industry ${id} not found`);
    return industry;
  }

  async update(id: string, dto: UpdateIndustryDto) {
    await this.findOne(id);
    try {
      return await this.prisma.industry.update({ where: { id }, data: dto as Prisma.IndustryUpdateInput });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('An industry with this name already exists');
      }
      throw err;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.industry.delete({ where: { id } });
  }
}
