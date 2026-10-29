import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../datasources/prisma/prisma.service';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { CreateProvinceDto } from './dto/create-province.dto';
import { UpdateProvinceDto } from './dto/update-province.dto';
import { ListProvincesDto } from './dto/list-provinces.dto';

@Injectable()
export class ProvincesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertCountryExists(countryId: string | undefined) {
    if (!countryId) return;
    const country = await this.prisma.country.findUnique({ where: { id: countryId } });
    if (!country) throw new BadRequestException(`Country ${countryId} does not exist`);
  }

  async create(dto: CreateProvinceDto) {
    await this.assertCountryExists(dto.countryId);
    return this.prisma.province.create({ data: dto as Prisma.ProvinceUncheckedCreateInput });
  }

  async findAll(query: ListProvincesDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.ProvinceWhereInput = {
      ...(query.search && { name: { contains: query.search, mode: 'insensitive' } }),
      ...(query.countryId && { countryId: query.countryId }),
    };

    const [items, total] = await Promise.all([
      this.prisma.province.findMany({ where, take: query.limit, skip: query.offset, orderBy: { name: 'asc' } }),
      this.prisma.province.count({ where }),
    ]);

    return { items, limit: query.limit, offset: query.offset, total };
  }

  async findOne(id: string) {
    const province = await this.prisma.province.findUnique({ where: { id } });
    if (!province) throw new NotFoundException(`Province ${id} not found`);
    return province;
  }

  async update(id: string, dto: UpdateProvinceDto) {
    await this.findOne(id);
    await this.assertCountryExists(dto.countryId);
    return this.prisma.province.update({ where: { id }, data: dto as Prisma.ProvinceUncheckedUpdateInput });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.province.delete({ where: { id } });
  }
}
