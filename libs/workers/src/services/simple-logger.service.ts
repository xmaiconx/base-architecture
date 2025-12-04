import type { ILoggerService, LogContext } from '@fnd/backend';

/**
 * Simple console-based logger for serverless workers
 * No Winston dependency - pure console logging with JSON formatting
 */
export class SimpleLoggerService implements ILoggerService {
  private formatLog(level: string, message: string, error?: Error, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const logEntry: any = {
      timestamp,
      level,
      message,
    };

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    if (context) {
      logEntry.context = context;
    }

    return JSON.stringify(logEntry);
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatLog('info', message, undefined, context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    console.error(this.formatLog('error', message, error, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatLog('warn', message, undefined, context));
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(this.formatLog('debug', message, undefined, context));
    }
  }
}
