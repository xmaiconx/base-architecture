import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ILoggerService, IJobQueue } from '@fnd/backend';
import { IWebhookEventRepository } from '@fnd/database';
import { BaseWebhookProcessor } from './base-webhook.processor';
import { WebhookParserFactoryService } from './parsers/webhook-parser-factory.service';
import { MessageParserFactoryService } from './parsers/messages/message-parser-factory.service';
import { MessagePipelineProcessor } from '../messages/message-pipeline.processor';

/**
 * Notificamehub Webhook Processor
 *
 * Processa webhooks de todas as variantes Notificamehub:
 * - notificamehub-whatsapp-baileys
 * - notificamehub-whatsapp-whatsmeow
 * - notificamehub-whatsapp-official
 * - notificamehub-instagram-official
 */
@Injectable()
export class NotificamehubWebhookProcessor extends BaseWebhookProcessor implements OnModuleInit {
  get providerName(): string {
    return 'Notificamehub';
  }

  constructor(
    @Inject('IWebhookEventRepository')
    webhookEventRepository: IWebhookEventRepository,
    @Inject('ILoggerService')
    logger: ILoggerService,
    parserFactory: WebhookParserFactoryService,
    messageParserFactory: MessageParserFactoryService,
    messagePipelineProcessor: MessagePipelineProcessor,
    @Inject('IJobQueue')
    private readonly jobQueue: IJobQueue,
  ) {
    super(webhookEventRepository, logger, parserFactory, messageParserFactory, messagePipelineProcessor);
  }

  async onModuleInit() {
    // Registrar processadores para todas as filas Notificamehub
    const queues = [
      'webhook-notificamehub-whatsapp-baileys',
      'webhook-notificamehub-whatsapp-whatsmeow',
      'webhook-notificamehub-whatsapp-official',
      'webhook-notificamehub-instagram-official',
      'webhook-notificamehub-default',
    ];

    for (const queueName of queues) {
      await this.jobQueue.process(queueName, async (job) => {
        await this.processWebhookJob(job);
      });

      this.logger.info(`Notificamehub webhook processor registered`, {
        operation: 'webhook.processor.registered',
        module: 'NotificamehubWebhookProcessor',
        queue: queueName,
      });
    }
  }
}
