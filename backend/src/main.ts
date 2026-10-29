import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Allow-list, not a single origin: identity routes (login/refresh) now set
  // a credentialed cookie that every consuming project's frontend origin
  // (e.g. Portfolio Manager) must be able to receive, alongside the existing
  // admin UI origin.
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? process.env.ADMIN_UI_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim());
  app.enableCors({
    origin: allowedOrigins,
    allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization'],
    credentials: true,
  });
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
