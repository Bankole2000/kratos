import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../datasources/prisma/prisma.service';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { ResourceVersioningService } from '../../common/sync/resource-versioning.service';
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { ListLanguagesDto } from './dto/list-languages.dto';

const RESOURCE_TYPE_KEY = 'language';

@Injectable()
export class LanguagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versioning: ResourceVersioningService,
  ) {}

  async create(dto: CreateLanguageDto) {
    try {
      return await this.versioning.writeWithVersion(RESOURCE_TYPE_KEY, (tx, version) =>
        tx.language.create({ data: { ...dto, version } as Prisma.LanguageCreateInput }),
      );
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('A language with this code already exists');
      }
      throw err;
    }
  }

  async findAll(query: ListLanguagesDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.LanguageWhereInput = {
      ...(query.search && { name: { contains: query.search, mode: 'insensitive' } }),
    };

    const [items, total] = await Promise.all([
      this.prisma.language.findMany({ where, take: query.limit, skip: query.offset, orderBy: { name: 'asc' } }),
      this.prisma.language.count({ where }),
    ]);

    return { items, limit: query.limit, offset: query.offset, total };
  }

  async findOne(id: string) {
    const language = await this.prisma.language.findUnique({ where: { id } });
    if (!language) throw new NotFoundException(`Language ${id} not found`);
    return language;
  }

  async update(id: string, dto: UpdateLanguageDto) {
    await this.findOne(id);
    try {
      return await this.versioning.writeWithVersion(RESOURCE_TYPE_KEY, (tx, version) =>
        tx.language.update({ where: { id }, data: { ...dto, version } as Prisma.LanguageUpdateInput }),
      );
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('A language with this code already exists');
      }
      throw err;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.versioning.writeWithVersion(RESOURCE_TYPE_KEY, (tx) => tx.language.delete({ where: { id } }));
  }
}
