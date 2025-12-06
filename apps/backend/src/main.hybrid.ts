import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './api/app.module';
import { IConfigurationService, ILoggerService } from '@fnd/backend';
import { StartupLoggerService } from './shared/services/startup-logger.service';

/**
 * Hybrid Mode Entrypoint
 *
 * Bootstraps NestJS with both API and Workers modules.
 * This is the default mode for development and simple deployments.
 *
 * Environment: NODE_MODE=hybrid (default)
 */
export async function bootstrapHybrid() {
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

  const logger = app.get<ILoggerService>('ILoggerService');

  // Start HTTP server
  await app.listen(port);
  console.log(`[Hybrid Mode] HTTP server running on http://localhost:${port}/api/v1`);

  logger.info('[Hybrid Mode] BullMQ workers active', {
    module: 'HybridBootstrap',
    queues: ['email', 'audit', 'stripe-webhook'],
  });

  console.log('[Hybrid Mode] BullMQ workers active: email, audit, stripe-webhook');

  // Log startup information
  const startupLogger = app.get(StartupLoggerService);
  startupLogger.logStartupInfo();

  return app;
}
