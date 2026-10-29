import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CookieOptions, Response } from 'express';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../datasources/prisma/prisma.service';
import { User } from '../../../generated/prisma/client';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { MessagingService } from '../messaging/messaging.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

const REFRESH_TOKEN_TTL_DAYS = 7;
const ACCESS_TOKEN_TTL = '15m';
const EMAIL_VERIFICATION_TTL_HOURS = 24;
const PASSWORD_RESET_TTL_HOURS = 1;

// The Project row representing Core Platform's own identity flows — every
// messaging call from this file uses it, establishing the same calling
// convention every future project-scoped caller will use. Seeded by the
// add_projects migration/seed.ts; looked up per call (indexed, negligible
// cost on this low-frequency path) rather than cached, since a stale
// in-memory id would be wrong if the seed row were ever edited.
const CORE_PLATFORM_PROJECT_SLUG = 'core-platform';

function serializeUser(user: User) {
  return { id: user.id, email: user.email, name: user.name };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name, { timestamp: true });
  private readonly cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditLog: AuditLogService,
    private readonly messaging: MessagingService,
  ) {}

  async signup(dto: SignupDto, res: Response) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email, name: dto.name, password: hashed },
    });

    const verificationToken = await this.createOneTimeToken(user.id, 'EMAIL_VERIFICATION', EMAIL_VERIFICATION_TTL_HOURS);
    void this.sendEmailVerificationForCorePlatform(user, verificationToken.code);

    const { accessToken, refreshToken } = await this.generateTokens(user.id, user.email, user.name);
    res.cookie('refreshToken', refreshToken, this.cookieOptions);
    void this.auditLog.record(user.id, 'signup');

    return { accessToken, user: serializeUser(user) };
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');
    if (!user.active) throw new UnauthorizedException('Account is deactivated');

    const { accessToken, refreshToken } = await this.generateTokens(user.id, user.email, user.name);
    res.cookie('refreshToken', refreshToken, this.cookieOptions);
    void this.auditLog.record(user.id, 'login');

    return { accessToken, user: serializeUser(user) };
  }

  async refresh(token: string, res: Response) {
    const stored = await this.prisma.refreshToken.findFirst({
      where: { token, expiresAt: { gte: new Date() }, revoked: false },
      include: { user: true },
    });
    if (!stored) throw new UnauthorizedException('Invalid refresh token');

    const { accessToken, refreshToken } = await this.generateTokens(stored.userId, stored.user.email, stored.user.name);
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
    res.cookie('refreshToken', refreshToken, this.cookieOptions);

    return { accessToken, user: serializeUser(stored.user) };
  }

  async logout(userId: string, res: Response) {
    await this.prisma.refreshToken.updateMany({ where: { userId, revoked: false }, data: { revoked: true } });
    res.clearCookie('refreshToken', this.cookieOptions);
    void this.auditLog.record(userId, 'logout');
    return { message: 'Logged out successfully' };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return serializeUser(user);
  }

  // Always returns the same message regardless of whether the email exists —
  // enumeration-safe, matching the pattern this logic was ported from.
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'If that email exists you will receive a reset link' };

    await this.prisma.oneTimeToken.deleteMany({
      where: { userId: user.id, type: 'PASSWORD_RESET', usedAt: null },
    });
    const resetToken = await this.createOneTimeToken(user.id, 'PASSWORD_RESET', PASSWORD_RESET_TTL_HOURS);
    void this.sendPasswordResetForCorePlatform(user, resetToken.code);
    void this.auditLog.record(user.id, 'password_reset_requested');

    return { message: 'If that email exists you will receive a reset link' };
  }

  async resetPassword(code: string, newPassword: string) {
    const record = await this.prisma.oneTimeToken.findFirst({
      where: { code, type: 'PASSWORD_RESET', usedAt: null, expiresAt: { gte: new Date() } },
    });
    if (!record) throw new BadRequestException('Invalid or expired reset token');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { password: hashed } }),
      this.prisma.oneTimeToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      this.prisma.refreshToken.updateMany({ where: { userId: record.userId }, data: { revoked: true } }),
    ]);
    void this.auditLog.record(record.userId, 'password_reset');

    return { message: 'Password reset successfully' };
  }

  async verifyEmail(code: string) {
    const record = await this.prisma.oneTimeToken.findFirst({
      where: { code, type: 'EMAIL_VERIFICATION', usedAt: null, expiresAt: { gte: new Date() } },
    });
    if (!record) throw new BadRequestException('Invalid or expired verification token');

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
      this.prisma.oneTimeToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);
    void this.auditLog.record(record.userId, 'email_verified');

    return { message: 'Email verified successfully' };
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'If that email exists a new link will be sent' };
    if (user.emailVerifiedAt) throw new BadRequestException('Email is already verified');

    await this.prisma.oneTimeToken.deleteMany({
      where: { userId: user.id, type: 'EMAIL_VERIFICATION', usedAt: null },
    });
    const verificationToken = await this.createOneTimeToken(user.id, 'EMAIL_VERIFICATION', EMAIL_VERIFICATION_TTL_HOURS);
    void this.sendEmailVerificationForCorePlatform(user, verificationToken.code);

    return { message: 'If that email exists a new link will be sent' };
  }

  private async sendEmailVerificationForCorePlatform(user: User, code: string): Promise<void> {
    const projectId = await this.resolveCorePlatformProjectId();
    if (!projectId) return;
    await this.messaging.sendEmailVerification(user, code, projectId);
  }

  private async sendPasswordResetForCorePlatform(user: User, code: string): Promise<void> {
    const projectId = await this.resolveCorePlatformProjectId();
    if (!projectId) return;
    await this.messaging.sendPasswordReset(user, code, projectId);
  }

  private async resolveCorePlatformProjectId(): Promise<string | null> {
    const project = await this.prisma.project.findUnique({ where: { slug: CORE_PLATFORM_PROJECT_SLUG } });
    if (!project) {
      this.logger.error(`Seeded project "${CORE_PLATFORM_PROJECT_SLUG}" not found — cannot send messaging notification`);
      return null;
    }
    return project.id;
  }

  // email/name ride along in the access token payload (not just `sub`) so
  // consuming projects (e.g. Portfolio Manager) can upsert a local shadow
  // user row from the token alone, with no extra network call back here.
  private async generateTokens(userId: string, email: string, name: string) {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, email, name },
      { expiresIn: ACCESS_TOKEN_TTL },
    );
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
    const refreshTokenRow = await this.prisma.refreshToken.create({ data: { userId, expiresAt } });
    return { accessToken, refreshToken: refreshTokenRow.token };
  }

  // Plaintext, human-typeable 6-char uppercase hex code — not a long random
  // secret — matching the pattern proven in Portfolio Manager's original
  // auth module for this same purpose.
  private async createOneTimeToken(userId: string, type: 'PASSWORD_RESET' | 'EMAIL_VERIFICATION', expiryHours: number) {
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    const code = randomBytes(3).toString('hex').toUpperCase();
    return this.prisma.oneTimeToken.create({ data: { userId, type, expiresAt, code } });
  }
}
