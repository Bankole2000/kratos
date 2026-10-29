import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { MessagingModule } from '../messaging/messaging.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

// PrismaModule is @Global(), so it's available here without a direct import.
// RS256, not HMAC: CRS holds the private key and signs; it never needs to
// trust a shared secret with any consuming project. See auth.controller.ts's
// public-key route — that's how a consumer like Portfolio Manager gets the
// matching public key for local, network-free verification.
@Module({
  imports: [
    ConfigModule,
    AuditLogsModule,
    MessagingModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        privateKey: config.get<string>('JWT_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
        publicKey: config.get<string>('JWT_PUBLIC_KEY')?.replace(/\\n/g, '\n'),
        signOptions: { algorithm: 'RS256', expiresIn: '15m' },
        verifyOptions: { algorithms: ['RS256'] },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, JwtModule],
})
export class IdentityModule {}
