import { Injectable, NotFoundException } from '@nestjs/common';
import { PersonalAccessToken } from '../../../generated/prisma/client';
import { PrismaService } from '../../datasources/prisma/prisma.service';
import { generatePat } from '../../common/utils/pat';
import { CreatePatDto } from './dto/create-pat.dto';

// hashedToken never leaves this service — same rationale as ApiKeysService's
// serialize().
function serialize(pat: PersonalAccessToken) {
  const { hashedToken, ...rest } = pat;
  return rest;
}

@Injectable()
export class PatService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreatePatDto) {
    const { raw, hashedToken, tokenPrefix } = generatePat();
    const pat = await this.prisma.personalAccessToken.create({
      data: {
        userId,
        name: dto.name,
        hashedToken,
        tokenPrefix,
        scopes: dto.scopes ?? [],
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
    // The only point in this token's lifetime the plaintext is available.
    return { ...serialize(pat), token: raw };
  }

  async findAll(userId: string) {
    const items = await this.prisma.personalAccessToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return items.map(serialize);
  }

  async revoke(userId: string, id: string) {
    const pat = await this.prisma.personalAccessToken.findUnique({ where: { id } });
    if (!pat || pat.userId !== userId) throw new NotFoundException(`Personal access token ${id} not found`);
    const updated = await this.prisma.personalAccessToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
    return serialize(updated);
  }
}
