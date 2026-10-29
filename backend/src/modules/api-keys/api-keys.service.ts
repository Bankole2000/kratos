import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiKey, Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../datasources/prisma/prisma.service';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { generateApiKey } from '../../common/utils/api-key';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { ListApiKeysDto } from './dto/list-api-keys.dto';

// hashedKey never leaves this service — every response strips it, since it's
// the one piece of data that must never be recoverable from the API surface.
function serialize(apiKey: ApiKey) {
  const { hashedKey, ...rest } = apiKey;
  return rest;
}

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateApiKeyDto) {
    const { raw, hashedKey, keyPrefix } = generateApiKey();
    const apiKey = await this.prisma.apiKey.create({
      data: {
        projectId: dto.projectId,
        hashedKey,
        keyPrefix,
        rateLimitPerMin: dto.rateLimitPerMin ?? 60,
      },
    });
    // The only point in this key's lifetime where the plaintext is available —
    // callers must capture it now, it cannot be retrieved again afterward.
    return { ...serialize(apiKey), key: raw };
  }

  async findAll(query: ListApiKeysDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.ApiKeyWhereInput = {
      ...(query.projectId && { projectId: query.projectId }),
    };

    const [items, total] = await Promise.all([
      this.prisma.apiKey.findMany({ where, take: query.limit, skip: query.offset, orderBy: { createdAt: 'desc' } }),
      this.prisma.apiKey.count({ where }),
    ]);

    return { items: items.map(serialize), limit: query.limit, offset: query.offset, total };
  }

  async findOne(id: string) {
    const apiKey = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!apiKey) throw new NotFoundException(`API key ${id} not found`);
    return serialize(apiKey);
  }

  async revoke(id: string) {
    await this.findOne(id);
    const apiKey = await this.prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
    return serialize(apiKey);
  }
}
