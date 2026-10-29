import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../datasources/prisma/prisma.service';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { CreateCategoryGroupDto } from './dto/create-category-group.dto';
import { UpdateCategoryGroupDto } from './dto/update-category-group.dto';
import { ListCategoryGroupsDto } from './dto/list-category-groups.dto';

@Injectable()
export class CategoryGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryGroupDto) {
    try {
      return await this.prisma.categoryGroup.create({ data: dto as Prisma.CategoryGroupCreateInput });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('A category group with this name already exists');
      }
      throw err;
    }
  }

  async findAll(query: ListCategoryGroupsDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.CategoryGroupWhereInput = {
      ...(query.search && { name: { contains: query.search, mode: 'insensitive' } }),
    };

    const [items, total] = await Promise.all([
      this.prisma.categoryGroup.findMany({ where, take: query.limit, skip: query.offset, orderBy: { name: 'asc' } }),
      this.prisma.categoryGroup.count({ where }),
    ]);

    return { items, limit: query.limit, offset: query.offset, total };
  }

  async findOne(id: string) {
    const group = await this.prisma.categoryGroup.findUnique({ where: { id } });
    if (!group) throw new NotFoundException(`Category group ${id} not found`);
    return group;
  }

  async update(id: string, dto: UpdateCategoryGroupDto) {
    await this.findOne(id);
    try {
      return await this.prisma.categoryGroup.update({ where: { id }, data: dto as Prisma.CategoryGroupUpdateInput });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('A category group with this name already exists');
      }
      throw err;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.categoryGroup.delete({ where: { id } });
  }
}
