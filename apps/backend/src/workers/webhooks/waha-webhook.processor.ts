import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ILoggerService, IJobQueue } from '@fnd/backend';
import { IWebhookEventRepository } from '@fnd/database';
import { BaseWebhookProcessor } from './base-webhook.processor';
import { WebhookParserFactoryService } from './parsers/webhook-parser-factory.service';
import { MessageParserFactoryService } from './parsers/messages/message-parser-factory.service';
import { MessagePipelineProcessor } from '../messages/message-pipeline.processor';

/**
 * Waha Webhook Processor
 *
 * Processa webhooks de todas as variantes Waha:
 * - waha-whatsapp-baileys
 * - waha-whatsapp-whatsmeow
 * - waha-whatsapp-official
 * - waha-instagram-official
 */
@Injectable()
export class WahaWebhookProcessor extends BaseWebhookProcessor implements OnModuleInit {
  get providerName(): string {
    return 'Waha';
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
    // Registrar processadores para todas as filas Waha
    const queues = [
      'webhook-waha-whatsapp-baileys',
      'webhook-waha-whatsapp-whatsmeow',
      'webhook-waha-whatsapp-official',
      'webhook-waha-instagram-official',
      'webhook-waha-default',
    ];

    for (const queueName of queues) {
      await this.jobQueue.process(queueName, async (job) => {
        await this.processWebhookJob(job);
      });

      this.logger.info(`Waha webhook processor registered`, {
        operation: 'webhook.processor.registered',
        module: 'WahaWebhookProcessor',
        queue: queueName,
      });
    }
  }
}
