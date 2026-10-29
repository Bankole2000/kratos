import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../datasources/prisma/prisma.service';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ListCompaniesDto } from './dto/list-companies.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCompanyDto) {
    try {
      return await this.prisma.company.create({ data: dto as Prisma.CompanyCreateInput });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('A company with this name already exists');
      }
      throw err;
    }
  }

  async findAll(query: ListCompaniesDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.CompanyWhereInput = {
      ...(query.search && { name: { contains: query.search, mode: 'insensitive' } }),
    };

    const [items, total] = await Promise.all([
      this.prisma.company.findMany({ where, take: query.limit, skip: query.offset, orderBy: { name: 'asc' } }),
      this.prisma.company.count({ where }),
    ]);

    return { items, limit: query.limit, offset: query.offset, total };
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException(`Company ${id} not found`);
    return company;
  }

  async update(id: string, dto: UpdateCompanyDto) {
    await this.findOne(id);
    try {
      return await this.prisma.company.update({ where: { id }, data: dto as Prisma.CompanyUpdateInput });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('A company with this name already exists');
      }
      throw err;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.company.delete({ where: { id } });
  }
}
