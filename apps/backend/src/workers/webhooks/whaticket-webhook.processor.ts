import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ILoggerService, IJobQueue } from '@fnd/backend';
import { IWebhookEventRepository } from '@fnd/database';
import { BaseWebhookProcessor } from './base-webhook.processor';
import { WebhookParserFactoryService } from './parsers/webhook-parser-factory.service';
import { MessageParserFactoryService } from './parsers/messages/message-parser-factory.service';
import { MessagePipelineProcessor } from '../messages/message-pipeline.processor';

/**
 * Whaticket Webhook Processor
 *
 * Processa webhooks de todas as variantes Whaticket:
 * - whaticket-whatsapp-baileys
 * - whaticket-whatsapp-whatsmeow
 * - whaticket-whatsapp-official
 * - whaticket-instagram-official
 */
@Injectable()
export class WhaticketWebhookProcessor extends BaseWebhookProcessor implements OnModuleInit {
  get providerName(): string {
    return 'Whaticket';
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
    // Registrar processadores para todas as filas Whaticket
    const queues = [
      'webhook-whaticket-whatsapp-baileys',
      'webhook-whaticket-whatsapp-whatsmeow',
      'webhook-whaticket-whatsapp-official',
      'webhook-whaticket-instagram-official',
      'webhook-whaticket-default',
    ];

    for (const queueName of queues) {
      await this.jobQueue.process(queueName, async (job) => {
        await this.processWebhookJob(job);
      });

      this.logger.info(`Whaticket webhook processor registered`, {
        operation: 'webhook.processor.registered',
        module: 'WhaticketWebhookProcessor',
        queue: queueName,
      });
    }
  }
}
