import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../datasources/prisma/prisma.service';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { ResourceVersioningService } from '../../common/sync/resource-versioning.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { ListVendorsDto } from './dto/list-vendors.dto';

const RESOURCE_TYPE_KEY = 'vendor';

@Injectable()
export class VendorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versioning: ResourceVersioningService,
  ) {}

  private async assertRelationsExist(dto: CreateVendorDto | UpdateVendorDto) {
    const [company, category, industry] = await Promise.all([
      dto.companyId ? this.prisma.company.findUnique({ where: { id: dto.companyId } }) : null,
      dto.categoryId ? this.prisma.category.findUnique({ where: { id: dto.categoryId } }) : null,
      dto.industryId ? this.prisma.industry.findUnique({ where: { id: dto.industryId } }) : null,
    ]);
    if (dto.companyId && !company) throw new BadRequestException(`Company ${dto.companyId} does not exist`);
    if (dto.categoryId && !category) throw new BadRequestException(`Category ${dto.categoryId} does not exist`);
    if (dto.industryId && !industry) throw new BadRequestException(`Industry ${dto.industryId} does not exist`);
  }

  async create(dto: CreateVendorDto) {
    await this.assertRelationsExist(dto);
    return this.versioning.writeWithVersion(RESOURCE_TYPE_KEY, (tx, version) =>
      tx.vendor.create({ data: { ...dto, version } as Prisma.VendorCreateInput }),
    );
  }

  async findAll(query: ListVendorsDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.VendorWhereInput = {
      ...(query.search && { name: { contains: query.search, mode: 'insensitive' } }),
      ...(query.companyId && { companyId: query.companyId }),
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.industryId && { industryId: query.industryId }),
    };

    const [items, total] = await Promise.all([
      this.prisma.vendor.findMany({ where, take: query.limit, skip: query.offset, orderBy: { name: 'asc' } }),
      this.prisma.vendor.count({ where }),
    ]);

    return { items, limit: query.limit, offset: query.offset, total };
  }

  async findOne(id: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id } });
    if (!vendor) throw new NotFoundException(`Vendor ${id} not found`);
    return vendor;
  }

  async update(id: string, dto: UpdateVendorDto) {
    await this.findOne(id);
    await this.assertRelationsExist(dto);
    return this.versioning.writeWithVersion(RESOURCE_TYPE_KEY, (tx, version) =>
      tx.vendor.update({ where: { id }, data: { ...dto, version } as Prisma.VendorUpdateInput }),
    );
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.versioning.writeWithVersion(RESOURCE_TYPE_KEY, (tx) => tx.vendor.delete({ where: { id } }));
  }
}
