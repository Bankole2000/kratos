import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Country, Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../datasources/prisma/prisma.service';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { flagEmoji } from '../../common/utils/flag-emoji';
import { ResourceVersioningService } from '../../common/sync/resource-versioning.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { ListCountriesDto } from './dto/list-countries.dto';

const RESOURCE_TYPE_KEY = 'country';

// flagSvg is a large blob — never embed the raw byte array in JSON responses.
// Serve it base64-encoded here, or fetch it separately as raw bytes via a
// dedicated endpoint if a consumer wants to avoid the ~33% base64 overhead.
export function serializeCountry(country: Country) {
  const { flagSvg, ...rest } = country;
  return { ...rest, flagSvgBase64: flagSvg ? Buffer.from(flagSvg).toString('base64') : null };
}

@Injectable()
export class CountriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versioning: ResourceVersioningService,
  ) {}

  async create(dto: CreateCountryDto) {
    try {
      const country = await this.versioning.writeWithVersion(RESOURCE_TYPE_KEY, (tx, version) =>
        tx.country.create({
          data: { ...dto, flagEmoji: dto.flagEmoji ?? flagEmoji(dto.alpha2), version } as Prisma.CountryCreateInput,
        }),
      );
      return serializeCountry(country);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('A country with this alpha2 or alpha3 code already exists');
      }
      throw err;
    }
  }

  async findAll(query: ListCountriesDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.CountryWhereInput = {
      ...(query.search && { name: { contains: query.search, mode: 'insensitive' } }),
      ...(query.region && { region: query.region }),
    };

    const [items, total] = await Promise.all([
      this.prisma.country.findMany({
        where,
        take: query.limit,
        skip: query.offset,
        orderBy: { name: 'asc' },
      }),
      this.prisma.country.count({ where }),
    ]);

    return { items: items.map(serializeCountry), limit: query.limit, offset: query.offset, total };
  }

  async findOne(id: string) {
    const country = await this.prisma.country.findUnique({ where: { id } });
    if (!country) throw new NotFoundException(`Country ${id} not found`);
    return serializeCountry(country);
  }

  async update(id: string, dto: UpdateCountryDto) {
    await this.findOne(id);
    try {
      const country = await this.versioning.writeWithVersion(RESOURCE_TYPE_KEY, (tx, version) =>
        tx.country.update({ where: { id }, data: { ...dto, version } as Prisma.CountryUpdateInput }),
      );
      return serializeCountry(country);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('A country with this alpha2 or alpha3 code already exists');
      }
      throw err;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.versioning.writeWithVersion(RESOURCE_TYPE_KEY, (tx) => tx.country.delete({ where: { id } }));
  }
}
