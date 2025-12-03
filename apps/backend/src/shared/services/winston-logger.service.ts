import { Injectable } from '@nestjs/common';
import { ILoggerService, LogContext } from '@fnd/backend';
import * as winston from 'winston';

@Injectable()
export class WinstonLoggerService implements ILoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
    });
  }

  info(message: string, context?: LogContext): void {
    this.logger.info(message, this.formatContext(context));
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, this.formatContext(context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const formattedContext = this.formatContext(context);
    if (error) {
      formattedContext.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    }
    this.logger.error(message, formattedContext);
  }

  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, this.formatContext(context));
  }

  private formatContext(context?: LogContext): Record<string, any> {
    if (!context) return {};

    return {
      timestamp: new Date().toISOString(),
      ...context,
    };
  }
}