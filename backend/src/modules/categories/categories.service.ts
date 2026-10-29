import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../datasources/prisma/prisma.service';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { ResourceVersioningService } from '../../common/sync/resource-versioning.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ListCategoriesDto } from './dto/list-categories.dto';

const RESOURCE_TYPE_KEY = 'category';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versioning: ResourceVersioningService,
  ) {}

  private async assertGroupExists(groupId: string | undefined) {
    if (!groupId) return;
    const group = await this.prisma.categoryGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new BadRequestException(`Category group ${groupId} does not exist`);
  }

  async create(dto: CreateCategoryDto) {
    await this.assertGroupExists(dto.groupId);
    try {
      return await this.versioning.writeWithVersion(RESOURCE_TYPE_KEY, (tx, version) =>
        tx.category.create({ data: { ...dto, version } as Prisma.CategoryCreateInput }),
      );
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('A category with this name already exists');
      }
      throw err;
    }
  }

  async findAll(query: ListCategoriesDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.CategoryWhereInput = {
      ...(query.search && { name: { contains: query.search, mode: 'insensitive' } }),
      ...(query.groupId && { groupId: query.groupId }),
    };

    const [items, total] = await Promise.all([
      this.prisma.category.findMany({ where, take: query.limit, skip: query.offset, orderBy: { name: 'asc' } }),
      this.prisma.category.count({ where }),
    ]);

    return { items, limit: query.limit, offset: query.offset, total };
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);
    await this.assertGroupExists(dto.groupId);
    try {
      return await this.versioning.writeWithVersion(RESOURCE_TYPE_KEY, (tx, version) =>
        tx.category.update({ where: { id }, data: { ...dto, version } as Prisma.CategoryUpdateInput }),
      );
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('A category with this name already exists');
      }
      throw err;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.versioning.writeWithVersion(RESOURCE_TYPE_KEY, (tx) => tx.category.delete({ where: { id } }));
  }
}
