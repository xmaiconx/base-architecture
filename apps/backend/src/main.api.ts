import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './api/app.module';
import { IConfigurationService } from '@fnd/backend';
import { StartupLoggerService } from './shared/services/startup-logger.service';

/**
 * API Only Mode Entrypoint
 *
 * Bootstraps NestJS with API modules only (no workers).
 * Use this mode to scale the HTTP API independently.
 *
 * Environment: NODE_MODE=api
 */
export async function bootstrapApi() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

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

  // Set API prefix
  app.setGlobalPrefix('api/v1');

  // Get configuration
  const configService = app.get<IConfigurationService>('IConfigurationService');
  const port = configService.getApiPort();

  // Start HTTP server
  await app.listen(port);
  console.log(`[API Mode] HTTP server running on http://localhost:${port}/api/v1`);

  // Log startup information
  const startupLogger = app.get(StartupLoggerService);
  startupLogger.logStartupInfo();

  return app;
}
