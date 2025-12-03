import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { IConfigurationService } from '@fnd/backend';
import { StartupLoggerService } from '../shared/services/startup-logger.service';

export async function api() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api/v1');

  const configService = app.get<IConfigurationService>('IConfigurationService');
  const port = configService.getApiPort();

  await app.listen(port);
  console.log(`Rugido Digital API running on http://localhost:${port}/api/v1`);

  // Log startup information including super-admin status
  const startupLogger = app.get(StartupLoggerService);
  startupLogger.logStartupInfo();
}