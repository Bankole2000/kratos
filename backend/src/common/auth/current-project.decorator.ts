import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { Request } from 'express';
import { ApiKey } from '../../../generated/prisma/client';

// Reads the projectId of the API key ApiKeyGuard already resolved for this
// request. Only valid on routes protected by ApiKeyGuard (i.e. not @Public())
// — throws rather than returning undefined if the guard didn't run, since a
// silently-undefined projectId would be a much harder bug to trace.
export const CurrentProjectId = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<Request & { apiKey?: ApiKey }>();
  if (!request.apiKey) {
    throw new InternalServerErrorException('CurrentProjectId used on a route not protected by ApiKeyGuard');
  }
  return request.apiKey.projectId;
});
