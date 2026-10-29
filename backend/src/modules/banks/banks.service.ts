import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../datasources/prisma/prisma.service';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import { ListBanksDto } from './dto/list-banks.dto';

@Injectable()
export class BanksService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertCompanyExists(companyId: string | undefined) {
    if (!companyId) return;
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new BadRequestException(`Company ${companyId} does not exist`);
  }

  async create(dto: CreateBankDto) {
    await this.assertCompanyExists(dto.companyId);
    return this.prisma.bank.create({ data: dto as Prisma.BankUncheckedCreateInput });
  }

  async findAll(query: ListBanksDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.BankWhereInput = {
      ...(query.search && { name: { contains: query.search, mode: 'insensitive' } }),
      ...(query.companyId && { companyId: query.companyId }),
    };

    const [items, total] = await Promise.all([
      this.prisma.bank.findMany({ where, take: query.limit, skip: query.offset, orderBy: { name: 'asc' } }),
      this.prisma.bank.count({ where }),
    ]);

    return { items, limit: query.limit, offset: query.offset, total };
  }

  async findOne(id: string) {
    const bank = await this.prisma.bank.findUnique({ where: { id } });
    if (!bank) throw new NotFoundException(`Bank ${id} not found`);
    return bank;
  }

  async update(id: string, dto: UpdateBankDto) {
    await this.findOne(id);
    await this.assertCompanyExists(dto.companyId);
    return this.prisma.bank.update({ where: { id }, data: dto as Prisma.BankUncheckedUpdateInput });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.bank.delete({ where: { id } });
  }
}
