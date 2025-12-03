import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { SharedModule } from '../shared/shared.module';
import { MessagesModule } from '../shared/messages/messages.module';
import { AuthModule } from '../api/modules/auth/auth.module'; // NEW: For SyncAuthUserCommand
import {
  ThreadRepository,
  MessageRepository,
  ProjectRepository,
  WebhookEventRepository,
} from '@fnd/database';

// Existing workers
import { EmailWorker } from './email.worker';
import { AuthReconciliationWorker } from './auth-reconciliation.worker'; // NEW: Auth reconciliation
import { AuditEventListener } from './audit/audit-event-listener';
import { AuditProcessor } from './audit/audit.processor';

// Webhook processors
import { WhaticketWebhookProcessor } from './webhooks/whaticket-webhook.processor';
import { WahaWebhookProcessor } from './webhooks/waha-webhook.processor';
import { NotificamehubWebhookProcessor } from './webhooks/notificamehub-webhook.processor';

// Webhook services
import { WebhookParserFactoryService } from './webhooks/parsers/webhook-parser-factory.service';
import { MessageParserFactoryService } from './webhooks/parsers/messages/message-parser-factory.service';

// Webhook parsers (phase 1)
import {
  WhaticketWhatsappBaileysParser,
  WhaticketWhatsappWhatsMeowParser,
  WhaticketWhatsappOfficialParser,
  WhaticketInstagramOfficialParser,
  WahaWhatsappBaileysParser,
  WahaWhatsappGowsParser,
  NotificamehubWhatsappBaileysParser,
  NotificamehubMercadolivreOfficialParser,
} from './webhooks/parsers';

// Message parsers (phase 2)
import { WhaticketWhatsappOfficialMessageParser } from './webhooks/parsers/messages/protocols/whaticket-whatsapp-official-message.parser';

// Message processor
import { MessagePipelineProcessor } from './messages/message-pipeline.processor';
import { MessageBufferProcessor } from './message-buffer.processor';

const THREAD_REPOSITORY_TOKEN = 'IThreadRepository';
const MESSAGE_REPOSITORY_TOKEN = 'IMessageRepository';
const PROJECT_REPOSITORY_TOKEN = 'IProjectRepository';
const WEBHOOK_EVENT_REPOSITORY_TOKEN = 'IWebhookEventRepository';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CqrsModule,
    SharedModule,
    MessagesModule, // Pipeline infrastructure
    AuthModule, // NEW: For SyncAuthUserCommand
  ],
  providers: [
    // Existing workers
    EmailWorker,
    AuthReconciliationWorker, // NEW: Auth reconciliation
    AuditEventListener,
    AuditProcessor,

    // Webhook processors
    WhaticketWebhookProcessor,
    WahaWebhookProcessor,
    NotificamehubWebhookProcessor,

    // Message processor
    MessagePipelineProcessor,

    // Message buffer processor
    MessageBufferProcessor,

    // Webhook services
    WebhookParserFactoryService,
    MessageParserFactoryService,

    // Webhook parsers - Whaticket
    WhaticketWhatsappBaileysParser,
    WhaticketWhatsappWhatsMeowParser,
    WhaticketWhatsappOfficialParser,
    WhaticketInstagramOfficialParser,

    // Webhook parsers - WAHA
    WahaWhatsappBaileysParser,
    WahaWhatsappGowsParser,

    // Webhook parsers - NotificameHub
    NotificamehubWhatsappBaileysParser,
    NotificamehubMercadolivreOfficialParser,

    // Message parsers (phase 2)
    WhaticketWhatsappOfficialMessageParser,

    // Repositories
    {
      provide: THREAD_REPOSITORY_TOKEN,
      useFactory: (db) => new ThreadRepository(db),
      inject: ['DATABASE'],
    },
    {
      provide: MESSAGE_REPOSITORY_TOKEN,
      useFactory: (db) => new MessageRepository(db),
      inject: ['DATABASE'],
    },
    {
      provide: PROJECT_REPOSITORY_TOKEN,
      useFactory: (db) => new ProjectRepository(db),
      inject: ['DATABASE'],
    },
    {
      provide: WEBHOOK_EVENT_REPOSITORY_TOKEN,
      useFactory: (db) => new WebhookEventRepository(db),
      inject: ['DATABASE'],
    },
  ],
})
export class WorkerModule {}