import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../../datasources/prisma/prisma.service';
import { hashApiKey } from '../utils/api-key';
import { IS_PUBLIC_KEY } from './public.decorator';

const API_KEY_HEADER = 'x-api-key';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const rawKey = request.headers[API_KEY_HEADER];
    if (!rawKey || Array.isArray(rawKey)) {
      throw new UnauthorizedException('Missing X-API-Key header');
    }

    const apiKey = await this.prisma.apiKey.findUnique({ where: { hashedKey: hashApiKey(rawKey) } });
    if (!apiKey) throw new UnauthorizedException('Invalid API key');
    if (apiKey.revokedAt) throw new UnauthorizedException('API key has been revoked');

    // Exposed to route handlers via @CurrentProjectId() — lets a project-
    // scoped endpoint (e.g. the generic messaging send) know which project
    // is calling without a second DB lookup.
    (request as Request & { apiKey: typeof apiKey }).apiKey = apiKey;

    // Fire-and-forget: last-used tracking shouldn't add latency to every
    // authenticated request or fail the request if the update itself fails.
    void this.prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

    return true;
  }
}
