import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../../datasources/prisma/prisma.service';
import { hashPat } from '../../../common/utils/pat';

const PAT_PREFIX = 'pat_';

// Authenticates a request using a Bearer PAT rather than a short-lived JWT —
// for CLI/script use where a 15-minute access token isn't practical. Sets
// req.user = { sub, type: 'pat', patId, scopes } so downstream code reading
// req.user.sub works identically regardless of which guard authenticated
// the request — same convention Portfolio Manager's ApiKeyGuard established.
@Injectable()
export class PatGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token?.startsWith(PAT_PREFIX)) {
      throw new UnauthorizedException('Missing or invalid personal access token');
    }

    const pat = await this.prisma.personalAccessToken.findUnique({ where: { hashedToken: hashPat(token) } });
    if (!pat) throw new UnauthorizedException('Invalid personal access token');
    if (pat.revokedAt) throw new UnauthorizedException('Personal access token has been revoked');
    if (pat.expiresAt && pat.expiresAt < new Date()) throw new UnauthorizedException('Personal access token has expired');

    void this.prisma.personalAccessToken.update({ where: { id: pat.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (request as any).user = { sub: pat.userId, type: 'pat', patId: pat.id, scopes: pat.scopes };
    return true;
  }
}
