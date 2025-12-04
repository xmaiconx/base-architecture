import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { Database } from '@fnd/database';
import type { HandlerContext } from '../types/HandlerContext';

// Repository implementations
import {
  AuditLogRepository,
  WebhookEventRepository,
  UserRepository,
  AccountRepository,
  WorkspaceRepository,
} from '@fnd/database';

// Service implementations (need to create lightweight versions)
import { SimpleLoggerService } from '../services/simple-logger.service';
import { SimpleConfigService } from '../services/simple-config.service';
import { SimpleEmailService } from '../services/simple-email.service';

/**
 * Factory to create HandlerContext with direct service instantiation
 * NO NestJS dependency injection - pure dependency construction
 * @returns HandlerContext with all required services
 */
export async function createHandlerContext(): Promise<HandlerContext> {
  // Create logger first (needed by other services)
  const logger = new SimpleLoggerService();

  // Create configuration service
  const config = new SimpleConfigService();

  // Create Kysely database instance
  const db = new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: config.getDatabaseUrl(),
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }),
    }),
  });

  // Create repositories
  const auditLogRepository = new AuditLogRepository(db);
  const webhookEventRepository = new WebhookEventRepository(db);
  const userRepository = new UserRepository(db);
  const accountRepository = new AccountRepository(db);
  const workspaceRepository = new WorkspaceRepository(db);

  // Create email service
  const emailService = new SimpleEmailService(config, logger);

  return {
    emailService,
    auditLogRepository,
    webhookEventRepository,
    userRepository,
    accountRepository,
    workspaceRepository,
    config,
    logger,
  };
}
