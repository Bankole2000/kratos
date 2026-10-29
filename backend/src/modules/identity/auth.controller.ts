import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { Public } from '../../common/auth/public.decorator';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';

// Every route below is @Public() — CRS's global ApiKeyGuard fails closed by
// default, but a browser calling signup/login has no project x-api-key to
// present. This is the ecosystem's shared identity surface: any consuming
// project's frontend must be able to reach it with no prior credential.
@Controller('auth')
@Throttle({ default: { ttl: 60_000, limit: 10 } })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  signup(@Body() dto: SignupDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.signup(dto, res);
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(dto, res);
  }

  @Public()
  @Post('refresh')
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.refreshToken as string | undefined;
    if (!token) return this.authService.logout('', res);
    return this.authService.refresh(token, res);
  }

  // @Public() here means "skip the global project-scoped ApiKeyGuard" —
  // AuthGuard still independently enforces a valid Bearer JWT. The two
  // guards are unrelated axes (project identity vs. end-user identity), so
  // a route needing only the latter must opt out of the former explicitly.
  @Public()
  @UseGuards(AuthGuard)
  @Post('logout')
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (req as any).user.sub as string;
    return this.authService.logout(userId, res);
  }

  @Public()
  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (req as any).user.sub as string;
    return this.authService.me(userId);
  }

  @Public()
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Public()
  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Public()
  @Post('resend-verification')
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  // Flat PEM, not full JWKS — this ecosystem has exactly one consumer (Portfolio
  // Manager) so far; upgrade to a JWKS endpoint if/when multiple keys or
  // rotation-without-downtime become a real need.
  @Public()
  @Get('public-key')
  publicKey() {
    return { publicKey: process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n') };
  }
}
