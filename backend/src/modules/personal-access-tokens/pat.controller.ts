import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../../common/auth/public.decorator';
import { AuthGuard } from '../identity/auth.guard';
import { PatGuard } from './guards/pat.guard';
import { PatService } from './pat.service';
import { CreatePatDto } from './dto/create-pat.dto';

// A user must already be logged in (AuthGuard) to manage their own PATs —
// distinct from the PatGuard, which authenticates *using* a PAT. Every route
// here is @Public() to skip the global project-scoped ApiKeyGuard — end-user
// identity (AuthGuard/PatGuard) is the actual authorization, layered on top.
@Controller('personal-access-tokens')
@Public()
export class PatController {
  constructor(private readonly patService: PatService) {}

  private userId(req: Request): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (req as any).user.sub as string;
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@Req() req: Request, @Body() dto: CreatePatDto) {
    return this.patService.create(this.userId(req), dto);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll(@Req() req: Request) {
    return this.patService.findAll(this.userId(req));
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  revoke(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string) {
    return this.patService.revoke(this.userId(req), id);
  }

  // Verifies a PAT itself is valid — the natural smoke-test route for a
  // consumer using PatGuard to authenticate script/CLI calls.
  @Get('whoami')
  @UseGuards(PatGuard)
  whoami(@Req() req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (req as any).user;
  }
}
