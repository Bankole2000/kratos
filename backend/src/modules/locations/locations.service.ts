import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../datasources/prisma/prisma.service';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { ListLocationsDto } from './dto/list-locations.dto';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertRelationsExist(dto: CreateLocationDto | UpdateLocationDto) {
    const [company, vendor, bank, country, province, city] = await Promise.all([
      dto.companyId ? this.prisma.company.findUnique({ where: { id: dto.companyId } }) : null,
      dto.vendorId ? this.prisma.vendor.findUnique({ where: { id: dto.vendorId } }) : null,
      dto.bankId ? this.prisma.bank.findUnique({ where: { id: dto.bankId } }) : null,
      dto.countryId ? this.prisma.country.findUnique({ where: { id: dto.countryId } }) : null,
      dto.provinceId ? this.prisma.province.findUnique({ where: { id: dto.provinceId } }) : null,
      dto.cityId ? this.prisma.city.findUnique({ where: { id: dto.cityId } }) : null,
    ]);
    if (dto.companyId && !company) throw new BadRequestException(`Company ${dto.companyId} does not exist`);
    if (dto.vendorId && !vendor) throw new BadRequestException(`Vendor ${dto.vendorId} does not exist`);
    if (dto.bankId && !bank) throw new BadRequestException(`Bank ${dto.bankId} does not exist`);
    if (dto.countryId && !country) throw new BadRequestException(`Country ${dto.countryId} does not exist`);
    if (dto.provinceId && !province) throw new BadRequestException(`Province ${dto.provinceId} does not exist`);
    if (dto.cityId && !city) throw new BadRequestException(`City ${dto.cityId} does not exist`);
  }

  async create(dto: CreateLocationDto) {
    await this.assertRelationsExist(dto);
    return this.prisma.location.create({ data: dto as Prisma.LocationCreateInput });
  }

  async findAll(query: ListLocationsDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.LocationWhereInput = {
      ...(query.companyId && { companyId: query.companyId }),
      ...(query.vendorId && { vendorId: query.vendorId }),
      ...(query.bankId && { bankId: query.bankId }),
      ...(query.countryId && { countryId: query.countryId }),
      ...(query.provinceId && { provinceId: query.provinceId }),
      ...(query.cityId && { cityId: query.cityId }),
    };

    const [items, total] = await Promise.all([
      this.prisma.location.findMany({ where, take: query.limit, skip: query.offset, orderBy: { createdAt: 'asc' } }),
      this.prisma.location.count({ where }),
    ]);

    return { items, limit: query.limit, offset: query.offset, total };
  }

  async findOne(id: string) {
    const location = await this.prisma.location.findUnique({ where: { id } });
    if (!location) throw new NotFoundException(`Location ${id} not found`);
    return location;
  }

  async update(id: string, dto: UpdateLocationDto) {
    await this.findOne(id);
    await this.assertRelationsExist(dto);
    return this.prisma.location.update({ where: { id }, data: dto as Prisma.LocationUpdateInput });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.location.delete({ where: { id } });
  }
}
