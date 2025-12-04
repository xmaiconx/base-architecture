import { Injectable, Inject } from '@nestjs/common';
import { Client } from '@upstash/qstash';
import { IQueueService, QueueOptions, IConfigurationService, ILoggerService } from '@fnd/backend';

/**
 * QStash adapter implementing IQueueService
 * Serverless-first queue using Upstash QStash for Vercel deployment
 */
@Injectable()
export class QStashQueueAdapter implements IQueueService {
  private client: Client;
  private workerBaseUrl: string;

  constructor(
    @Inject('IConfigurationService')
    private readonly config: IConfigurationService,
    @Inject('ILoggerService')
    private readonly logger: ILoggerService,
  ) {
    const token = this.config.getQStashToken();
    this.client = new Client({ token });
    this.workerBaseUrl = this.config.getWorkerBaseUrl();

    this.logger.info('QStash Queue Adapter initialized', {
      operation: 'qstash.init',
      module: 'QStashQueueAdapter',
      workerBaseUrl: this.workerBaseUrl,
    });
  }

  /**
   * Enqueue a task for immediate processing
   * Maps to QStash HTTP endpoint invocation
   */
  async enqueue(
    taskName: string,
    payload: object,
    options?: QueueOptions,
  ): Promise<string> {
    try {
      const url = `${this.workerBaseUrl}/${taskName}`;

      this.logger.info('Enqueuing task to QStash', {
        operation: 'qstash.enqueue',
        module: 'QStashQueueAdapter',
        taskName,
        url,
      });

      const response = await this.client.publishJSON({
        url,
        body: payload,
        retries: options?.retries ?? 3,
        callback: options?.callbackUrl,
      });

      this.logger.info('Task enqueued successfully', {
        operation: 'qstash.enqueue.success',
        module: 'QStashQueueAdapter',
        taskName,
        messageId: response.messageId,
      });

      return response.messageId;
    } catch (error) {
      this.logger.error(
        'Failed to enqueue task',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'qstash.enqueue.error',
          module: 'QStashQueueAdapter',
          taskName,
        }
      );
      throw error;
    }
  }

  /**
   * Enqueue a task with delayed execution
   * Uses QStash's delay parameter (in seconds)
   */
  async enqueueWithDelay(
    taskName: string,
    payload: object,
    delaySeconds: number,
  ): Promise<string> {
    try {
      const url = `${this.workerBaseUrl}/${taskName}`;

      this.logger.info('Enqueuing delayed task to QStash', {
        operation: 'qstash.enqueue.delayed',
        module: 'QStashQueueAdapter',
        taskName,
        delaySeconds,
        url,
      });

      const response = await this.client.publishJSON({
        url,
        body: payload,
        delay: delaySeconds,
        retries: 3,
      });

      this.logger.info('Delayed task enqueued successfully', {
        operation: 'qstash.enqueue.delayed.success',
        module: 'QStashQueueAdapter',
        taskName,
        messageId: response.messageId,
        delaySeconds,
      });

      return response.messageId;
    } catch (error) {
      this.logger.error(
        'Failed to enqueue delayed task',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'qstash.enqueue.delayed.error',
          module: 'QStashQueueAdapter',
          taskName,
          delaySeconds,
        }
      );
      throw error;
    }
  }
}
