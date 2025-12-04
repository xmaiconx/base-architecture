import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { ILoggerService, IConfigurationService, ISupabaseService, IQueueService, IEventPublisher } from '@fnd/backend';
import { IEmailService } from '@fnd/backend';
import { IEmailQueueService } from '@fnd/backend';
import {
  IUserRepository,
  IAccountRepository,
  IWorkspaceRepository,
  IWorkspaceUserRepository,
  IAuditLogRepository,
  IPlanRepository,
  ISubscriptionRepository,
  UserRepository,
  AccountRepository,
  WorkspaceRepository,
  WorkspaceUserRepository,
  AuditLogRepository,
  PlanRepository,
  SubscriptionRepository,
  createDatabase
} from '@fnd/database';
import { ResendEmailService } from './services/resend-email.service';
import { WinstonLoggerService } from './services/winston-logger.service';
import { EmailQueueService } from './services/email-queue.service';
import { EventBrokerService } from './services/event-broker.service';
import { ConfigurationService } from './services/configuration.service';
import { StartupLoggerService } from './services/startup-logger.service';
import { SupabaseService } from './services/supabase.service';
import { QStashQueueAdapter, QStashEventPublisher } from './adapters';

const EMAIL_SERVICE_TOKEN = 'IEmailService';
const LOGGER_SERVICE_TOKEN = 'ILoggerService';
const DATABASE_TOKEN = 'DATABASE';
const USER_REPOSITORY_TOKEN = 'IUserRepository';
const ACCOUNT_REPOSITORY_TOKEN = 'IAccountRepository';
const WORKSPACE_REPOSITORY_TOKEN = 'IWorkspaceRepository';
const WORKSPACE_USER_REPOSITORY_TOKEN = 'IWorkspaceUserRepository';
const AUDIT_LOG_REPOSITORY_TOKEN = 'IAuditLogRepository';
const PLAN_REPOSITORY_TOKEN = 'IPlanRepository';
const SUBSCRIPTION_REPOSITORY_TOKEN = 'ISubscriptionRepository';
const EMAIL_QUEUE_SERVICE_TOKEN = 'IEmailQueueService';
const EVENT_BROKER_TOKEN = 'IEventBroker';
const CONFIGURATION_SERVICE_TOKEN = 'IConfigurationService';
const SUPABASE_SERVICE_TOKEN = 'ISupabaseService';
const QUEUE_SERVICE_TOKEN = 'IQueueService';
const EVENT_PUBLISHER_TOKEN = 'IEventPublisher';

@Module({
  imports: [ConfigModule, CqrsModule],
  providers: [
    {
      provide: EMAIL_SERVICE_TOKEN,
      useClass: ResendEmailService,
    },
    {
      provide: LOGGER_SERVICE_TOKEN,
      useClass: WinstonLoggerService,
    },
    {
      provide: DATABASE_TOKEN,
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        if (!databaseUrl) {
          throw new Error('DATABASE_URL environment variable is required');
        }

        return createDatabase(databaseUrl);
      },
      inject: [ConfigService],
    },
    {
      provide: USER_REPOSITORY_TOKEN,
      useFactory: (db) => new UserRepository(db),
      inject: [DATABASE_TOKEN],
    },
    {
      provide: ACCOUNT_REPOSITORY_TOKEN,
      useFactory: (db) => new AccountRepository(db),
      inject: [DATABASE_TOKEN],
    },
    {
      provide: WORKSPACE_REPOSITORY_TOKEN,
      useFactory: (db) => new WorkspaceRepository(db),
      inject: [DATABASE_TOKEN],
    },
    {
      provide: WORKSPACE_USER_REPOSITORY_TOKEN,
      useFactory: (db) => new WorkspaceUserRepository(db),
      inject: [DATABASE_TOKEN],
    },
    {
      provide: AUDIT_LOG_REPOSITORY_TOKEN,
      useFactory: (db) => new AuditLogRepository(db),
      inject: [DATABASE_TOKEN],
    },
    {
      provide: PLAN_REPOSITORY_TOKEN,
      useFactory: (db) => new PlanRepository(db),
      inject: [DATABASE_TOKEN],
    },
    {
      provide: SUBSCRIPTION_REPOSITORY_TOKEN,
      useFactory: (db) => new SubscriptionRepository(db),
      inject: [DATABASE_TOKEN],
    },
    {
      provide: EMAIL_QUEUE_SERVICE_TOKEN,
      useClass: EmailQueueService,
    },
    {
      provide: EVENT_BROKER_TOKEN,
      useClass: EventBrokerService,
    },
    {
      provide: CONFIGURATION_SERVICE_TOKEN,
      useClass: ConfigurationService,
    },
    {
      provide: SUPABASE_SERVICE_TOKEN,
      useClass: SupabaseService,
    },
    {
      provide: QUEUE_SERVICE_TOKEN,
      useClass: QStashQueueAdapter,
    },
    {
      provide: EVENT_PUBLISHER_TOKEN,
      useClass: QStashEventPublisher,
    },
    StartupLoggerService,
  ],
  exports: [
    EMAIL_SERVICE_TOKEN,
    LOGGER_SERVICE_TOKEN,
    DATABASE_TOKEN,
    USER_REPOSITORY_TOKEN,
    ACCOUNT_REPOSITORY_TOKEN,
    WORKSPACE_REPOSITORY_TOKEN,
    WORKSPACE_USER_REPOSITORY_TOKEN,
    AUDIT_LOG_REPOSITORY_TOKEN,
    PLAN_REPOSITORY_TOKEN,
    SUBSCRIPTION_REPOSITORY_TOKEN,
    EMAIL_QUEUE_SERVICE_TOKEN,
    EVENT_BROKER_TOKEN,
    CONFIGURATION_SERVICE_TOKEN,
    SUPABASE_SERVICE_TOKEN,
    QUEUE_SERVICE_TOKEN,
    EVENT_PUBLISHER_TOKEN,
    StartupLoggerService,
  ],
})
export class SharedModule {}
