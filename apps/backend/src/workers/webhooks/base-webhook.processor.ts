import { Injectable, Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { ILoggerService } from '@fnd/backend';
import { IWebhookEventRepository } from '@fnd/database';
import { WebhookStatus, WebhookType, MessageContext } from '@fnd/domain';
import { WebhookParserFactoryService } from './parsers/webhook-parser-factory.service';
import { MessageParserFactoryService } from './parsers/messages/message-parser-factory.service';
import { MessagePipelineProcessor } from '../messages/message-pipeline.processor';

/**
 * Base Webhook Processor
 *
 * Lógica compartilhada para todos os webhook processors.
 * Subclasses implementam processamento específico por provider.
 */
@Injectable()
export abstract class BaseWebhookProcessor {
  constructor(
    @Inject('IWebhookEventRepository')
    protected readonly webhookEventRepository: IWebhookEventRepository,
    @Inject('ILoggerService')
    protected readonly logger: ILoggerService,
    protected readonly parserFactory: WebhookParserFactoryService,
    protected readonly messageParserFactory: MessageParserFactoryService,
    protected readonly messagePipelineProcessor: MessagePipelineProcessor,
  ) {}

  /**
   * Nome do provider (implementado por subclasses)
   */
  abstract get providerName(): string;

  /**
   * Processa um job de webhook
   *
   * Fluxo:
   * 1. Load webhook event do DB
   * 2. Update status → PROCESSING
   * 3. Get webhook parser e parse payload → ParsedWebhookData
   * 4. Get message parser e parse → MessageContext[]
   * 5. Process each message through pipeline
   * 6. Update status → PROCESSED
   */
  async processWebhookJob(job: Job): Promise<void> {
    const { webhookEventId } = job.data;

    this.logger.info('Processing webhook job', {
      operation: 'webhook.process.start',
      module: `${this.providerName}WebhookProcessor`,
      jobId: job.id,
      webhookEventId,
    });

    try {
      // 1. Load webhook event
      const webhookEvent = await this.webhookEventRepository.findById(webhookEventId);

      if (!webhookEvent) {
        throw new Error(`Webhook event not found: ${webhookEventId}`);
      }

      // 2. Update status to PROCESSING
      await this.webhookEventRepository.updateStatus(
        webhookEventId,
        WebhookStatus.PROCESSING,
      );

      // 3. Get parser and parse payload
      const parser = this.parserFactory.getParser({
        provider: webhookEvent.provider,
        channel: webhookEvent.channel ?? undefined,
        implementation: webhookEvent.implementation ?? undefined,
      });

      if (!parser) {
        throw new Error(
          `No parser found for ${webhookEvent.provider}-${webhookEvent.channel}-${webhookEvent.implementation}`,
        );
      }

      const parsedData = await parser.parse(webhookEvent.payload);

      this.logger.info('Webhook payload parsed', {
        operation: 'webhook.process.parsed',
        module: `${this.providerName}WebhookProcessor`,
        eventName: parsedData.eventName,
        senderId: parsedData.senderId,
      });

      // 4. Parse messages (apenas para CHAT webhooks)
      if (webhookEvent.webhookType === WebhookType.CHAT) {
        const messageParser = this.messageParserFactory.getParser({
          provider: webhookEvent.provider,
          channel: webhookEvent.channel ?? undefined,
          implementation: webhookEvent.implementation ?? undefined,
        });

        if (!messageParser) {
          throw new Error(
            `No message parser found for ${webhookEvent.provider}-${webhookEvent.channel}-${webhookEvent.implementation}`,
          );
        }

        const parseResult = await messageParser.parse(parsedData, {
          id: webhookEvent.id,
          accountId: webhookEvent.accountId,
          projectId: webhookEvent.projectId,
          provider: webhookEvent.provider,
          channel: webhookEvent.channel,
          implementation: webhookEvent.implementation,
          payload: webhookEvent.payload,
        });

        if (!parseResult.success || !parseResult.data) {
          throw parseResult.error ?? new Error('Message parsing failed');
        }

        this.logger.info('Messages parsed successfully', {
          operation: 'webhook.process.messages_parsed',
          module: `${this.providerName}WebhookProcessor`,
          messageCount: parseResult.data.length,
          metadata: parseResult.metadata,
          batchContext: parseResult.batchContext,
        });

        // 5. Process batch through pipeline (OPTIMIZED - no loop here)
        await this.messagePipelineProcessor.process(parseResult);
      } else if (webhookEvent.webhookType === WebhookType.PAYMENT) {
        // TODO: Implementar processamento de PAYMENT webhooks
        this.logger.warn('Payment webhook processing not implemented yet', {
          operation: 'webhook.process.payment_skip',
          module: `${this.providerName}WebhookProcessor`,
          webhookEventId,
        });
      }

      // 6. Update webhook event com normalized message e status PROCESSED
      await this.webhookEventRepository.update(webhookEventId, {
        status: WebhookStatus.PROCESSED,
        processedAt: new Date(),
      });

      this.logger.info('Webhook processed successfully', {
        operation: 'webhook.process.completed',
        module: `${this.providerName}WebhookProcessor`,
        webhookEventId,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(
        'Failed to process webhook',
        error instanceof Error ? error : new Error(errorMessage),
        {
          operation: 'webhook.process.error',
          module: `${this.providerName}WebhookProcessor`,
          webhookEventId,
        }
      );

      // Update webhook status to FAILED
      await this.webhookEventRepository.updateStatus(
        webhookEventId,
        WebhookStatus.FAILED,
        errorMessage,
      );

      // Re-throw para que BullMQ execute retry policy
      throw new Error(errorMessage);
    }
  }

}
