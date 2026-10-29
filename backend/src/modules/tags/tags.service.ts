import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../datasources/prisma/prisma.service';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { ListTagsDto } from './dto/list-tags.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTagDto) {
    try {
      return await this.prisma.tag.create({ data: dto as Prisma.TagCreateInput });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('A tag with this name already exists');
      }
      throw err;
    }
  }

  async findAll(query: ListTagsDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.TagWhereInput = {
      ...(query.search && { name: { contains: query.search, mode: 'insensitive' } }),
    };

    const [items, total] = await Promise.all([
      this.prisma.tag.findMany({ where, take: query.limit, skip: query.offset, orderBy: { name: 'asc' } }),
      this.prisma.tag.count({ where }),
    ]);

    return { items, limit: query.limit, offset: query.offset, total };
  }

  async findOne(id: string) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) throw new NotFoundException(`Tag ${id} not found`);
    return tag;
  }

  async update(id: string, dto: UpdateTagDto) {
    await this.findOne(id);
    try {
      return await this.prisma.tag.update({ where: { id }, data: dto as Prisma.TagUpdateInput });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('A tag with this name already exists');
      }
      throw err;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.tag.delete({ where: { id } });
  }
}
