import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SharedModule } from '../../../shared/shared.module';
import {
  IWebhookEventRepository,
  WebhookEventRepository,
} from '@fnd/database';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { WebhookGatewayService } from './services/webhook-gateway.service';
import { WebhookReceivedEventHandler } from './events/handlers/WebhookReceivedEventHandler';

const WEBHOOK_EVENT_REPOSITORY_TOKEN = 'IWebhookEventRepository';

/**
 * Webhooks Module (API Layer - Lightweight)
 *
 * Responsabilidades:
 * - Receber webhooks via HTTP (POST /api/v1/gateway/:uuid)
 * - Decodificar UUID e validar configuração
 * - Persistir webhook raw (status: PENDING)
 * - Publicar evento para fila BullMQ
 * - Retornar 200 OK imediatamente
 *
 * NOTA: Parsing, normalização e processamento acontecem no Worker layer.
 * Parsers foram movidos para: apps/backend/src/workers/webhooks/parsers
 */
@Module({
  imports: [SharedModule, CqrsModule],
  controllers: [WebhooksController],
  providers: [
    // Services
    WebhooksService,
    WebhookGatewayService,

    // Repository
    {
      provide: WEBHOOK_EVENT_REPOSITORY_TOKEN,
      useFactory: (db) => new WebhookEventRepository(db),
      inject: ['DATABASE'],
    },

    // Event Handlers (apenas enfileira para worker)
    WebhookReceivedEventHandler,
  ],
  exports: [WebhooksService],
})
export class WebhooksModule {}
