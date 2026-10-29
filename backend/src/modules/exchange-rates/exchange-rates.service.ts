import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../datasources/prisma/prisma.service';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { CreateExchangeRateDto } from './dto/create-exchange-rate.dto';
import { UpdateExchangeRateDto } from './dto/update-exchange-rate.dto';
import { ListExchangeRatesDto } from './dto/list-exchange-rates.dto';

const PROVIDER_SOURCE = 'exchangerate-api.com';
const PROVIDER_URL = 'https://open.er-api.com/v6/latest/USD';

interface ProviderResponse {
  result: string;
  base_code: string;
  rates: Record<string, number>;
  time_last_update_utc: string;
}

@Injectable()
export class ExchangeRatesService {
  private readonly logger = new Logger(ExchangeRatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async assertCurrenciesExist(baseCurrencyId: string | undefined, quoteCurrencyId: string | undefined) {
    const [base, quote] = await Promise.all([
      baseCurrencyId ? this.prisma.currency.findUnique({ where: { id: baseCurrencyId } }) : null,
      quoteCurrencyId ? this.prisma.currency.findUnique({ where: { id: quoteCurrencyId } }) : null,
    ]);
    if (baseCurrencyId && !base) throw new BadRequestException(`Currency ${baseCurrencyId} does not exist`);
    if (quoteCurrencyId && !quote) throw new BadRequestException(`Currency ${quoteCurrencyId} does not exist`);
  }

  async create(dto: CreateExchangeRateDto) {
    await this.assertCurrenciesExist(dto.baseCurrencyId, dto.quoteCurrencyId);
    try {
      return await this.prisma.exchangeRate.create({
        data: { ...dto, source: 'manual', fetchedAt: new Date() } as Prisma.ExchangeRateUncheckedCreateInput,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('A rate for this currency pair already exists — update it instead');
      }
      throw err;
    }
  }

  async findAll(query: ListExchangeRatesDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.ExchangeRateWhereInput = {
      ...(query.baseCurrencyId && { baseCurrencyId: query.baseCurrencyId }),
      ...(query.quoteCurrencyId && { quoteCurrencyId: query.quoteCurrencyId }),
    };

    const [items, total] = await Promise.all([
      this.prisma.exchangeRate.findMany({ where, take: query.limit, skip: query.offset, orderBy: { updatedAt: 'desc' } }),
      this.prisma.exchangeRate.count({ where }),
    ]);

    return { items, limit: query.limit, offset: query.offset, total };
  }

  async findOne(id: string) {
    const rate = await this.prisma.exchangeRate.findUnique({ where: { id } });
    if (!rate) throw new NotFoundException(`Exchange rate ${id} not found`);
    return rate;
  }

  async update(id: string, dto: UpdateExchangeRateDto) {
    await this.findOne(id);
    await this.assertCurrenciesExist(dto.baseCurrencyId, dto.quoteCurrencyId);
    try {
      return await this.prisma.exchangeRate.update({
        where: { id },
        data: { ...dto, source: 'manual', fetchedAt: new Date() } as Prisma.ExchangeRateUncheckedUpdateInput,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('A rate for this currency pair already exists');
      }
      throw err;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.exchangeRate.delete({ where: { id } });
  }

  // Fetches USD-as-base rates against every FIAT currency currently seeded
  // and upserts one row per pair. Fiat-only because the free provider used
  // here only covers fiat — the schema itself doesn't restrict CRYPTO/IN_GAME
  // pairs, a future provider/job could populate those without a schema change.
  async refreshFromProvider() {
    const usd = await this.prisma.currency.findUnique({ where: { code: 'USD' } });
    if (!usd) {
      throw new BadRequestException('USD must exist as a seeded currency before refreshing rates');
    }

    let response: Response;
    try {
      response = await fetch(PROVIDER_URL);
    } catch (err) {
      this.logger.error(`Failed to reach ${PROVIDER_SOURCE}`, err instanceof Error ? err.stack : undefined);
      throw new BadRequestException(`Could not reach rate provider (${PROVIDER_SOURCE})`);
    }

    if (!response.ok) {
      throw new BadRequestException(`Rate provider returned ${response.status}`);
    }

    const body = (await response.json()) as ProviderResponse;
    if (body.result !== 'success' || body.base_code !== 'USD') {
      throw new BadRequestException('Rate provider returned an unexpected response');
    }

    const fiatCurrencies = await this.prisma.currency.findMany({ where: { kind: 'FIAT' } });
    const codeToId = new Map(fiatCurrencies.map((c) => [c.code, c.id]));
    const fetchedAt = new Date(body.time_last_update_utc);

    let updated = 0;
    let skipped = 0;

    for (const [code, rate] of Object.entries(body.rates)) {
      if (code === 'USD') continue;
      const quoteCurrencyId = codeToId.get(code);
      if (!quoteCurrencyId) {
        skipped++;
        continue;
      }
      await this.prisma.exchangeRate.upsert({
        where: { baseCurrencyId_quoteCurrencyId: { baseCurrencyId: usd.id, quoteCurrencyId } },
        create: { baseCurrencyId: usd.id, quoteCurrencyId, rate, source: PROVIDER_SOURCE, fetchedAt },
        update: { rate, source: PROVIDER_SOURCE, fetchedAt },
      });
      updated++;
    }

    return { updated, skipped, fetchedAt: fetchedAt.toISOString(), source: PROVIDER_SOURCE };
  }
}
