import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { ILoggerService, IJobQueue, IScheduleService, IEventBroker, IConfigurationService, IMessageBufferService, ISupabaseService } from '@fnd/backend';
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
import { RedisJobQueueService } from './services/redis-job-queue.service';
import { RedisScheduleService } from './services/redis-schedule.service';
import { EmailQueueService } from './services/email-queue.service';
import { EventBrokerService } from './services/event-broker.service';
import { ConfigurationService } from './services/configuration.service';
import { StartupLoggerService } from './services/startup-logger.service';
import { RedisMessageBufferService } from './services/redis-message-buffer.service';
import { SupabaseService } from './services/supabase.service';

const EMAIL_SERVICE_TOKEN = 'IEmailService';
const LOGGER_SERVICE_TOKEN = 'ILoggerService';
const JOB_QUEUE_TOKEN = 'IJobQueue';
const SCHEDULE_SERVICE_TOKEN = 'IScheduleService';
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
const MESSAGE_BUFFER_SERVICE_TOKEN = 'IMessageBufferService';
const SUPABASE_SERVICE_TOKEN = 'ISupabaseService';

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
      provide: JOB_QUEUE_TOKEN,
      useClass: RedisJobQueueService,
    },
    {
      provide: SCHEDULE_SERVICE_TOKEN,
      useClass: RedisScheduleService,
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
      provide: MESSAGE_BUFFER_SERVICE_TOKEN,
      useClass: RedisMessageBufferService,
    },
    {
      provide: SUPABASE_SERVICE_TOKEN,
      useClass: SupabaseService,
    },
    StartupLoggerService,
  ],
  exports: [
    EMAIL_SERVICE_TOKEN,
    LOGGER_SERVICE_TOKEN,
    JOB_QUEUE_TOKEN,
    SCHEDULE_SERVICE_TOKEN,
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
    MESSAGE_BUFFER_SERVICE_TOKEN,
    SUPABASE_SERVICE_TOKEN,
    StartupLoggerService,
  ],
})
export class SharedModule {}