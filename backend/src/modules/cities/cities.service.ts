import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../datasources/prisma/prisma.service';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { ListCitiesDto } from './dto/list-cities.dto';

@Injectable()
export class CitiesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertRelationsExist(countryId: string | undefined, provinceId: string | undefined) {
    const [country, province] = await Promise.all([
      countryId ? this.prisma.country.findUnique({ where: { id: countryId } }) : null,
      provinceId ? this.prisma.province.findUnique({ where: { id: provinceId } }) : null,
    ]);
    if (countryId && !country) throw new BadRequestException(`Country ${countryId} does not exist`);
    if (provinceId && !province) throw new BadRequestException(`Province ${provinceId} does not exist`);
    if (provinceId && country && province && province.countryId !== country.id) {
      throw new BadRequestException(`Province ${provinceId} does not belong to country ${countryId}`);
    }
  }

  async create(dto: CreateCityDto) {
    await this.assertRelationsExist(dto.countryId, dto.provinceId);
    return this.prisma.city.create({ data: dto as Prisma.CityUncheckedCreateInput });
  }

  async findAll(query: ListCitiesDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.CityWhereInput = {
      ...(query.search && { name: { contains: query.search, mode: 'insensitive' } }),
      ...(query.countryId && { countryId: query.countryId }),
      ...(query.provinceId && { provinceId: query.provinceId }),
    };

    const [items, total] = await Promise.all([
      this.prisma.city.findMany({ where, take: query.limit, skip: query.offset, orderBy: { name: 'asc' } }),
      this.prisma.city.count({ where }),
    ]);

    return { items, limit: query.limit, offset: query.offset, total };
  }

  async findOne(id: string) {
    const city = await this.prisma.city.findUnique({ where: { id } });
    if (!city) throw new NotFoundException(`City ${id} not found`);
    return city;
  }

  async update(id: string, dto: UpdateCityDto) {
    const existing = await this.findOne(id);
    await this.assertRelationsExist(dto.countryId ?? existing.countryId, dto.provinceId ?? existing.provinceId ?? undefined);
    return this.prisma.city.update({ where: { id }, data: dto as Prisma.CityUncheckedUpdateInput });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.city.delete({ where: { id } });
  }
}
