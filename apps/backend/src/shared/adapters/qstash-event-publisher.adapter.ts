import { Injectable, Inject } from '@nestjs/common';
import { Client } from '@upstash/qstash';
import { IEventPublisher, IConfigurationService, ILoggerService } from '@fnd/backend';
import { IEvent } from '@fnd/backend';

/**
 * QStash adapter implementing IEventPublisher
 * Publishes domain/integration events to serverless workers via QStash
 */
@Injectable()
export class QStashEventPublisher implements IEventPublisher {
  private client: Client;
  private eventHandlerUrl: string;

  constructor(
    @Inject('IConfigurationService')
    private readonly config: IConfigurationService,
    @Inject('ILoggerService')
    private readonly logger: ILoggerService,
  ) {
    const token = this.config.getQStashToken();
    this.client = new Client({ token });
    this.eventHandlerUrl = `${this.config.getWorkerBaseUrl()}/events`;

    this.logger.info('QStash Event Publisher initialized', {
      operation: 'qstash.event.init',
      module: 'QStashEventPublisher',
      eventHandlerUrl: this.eventHandlerUrl,
    });
  }

  /**
   * Publish a single event to QStash
   * Event will be delivered to the events worker endpoint
   */
  async publish(event: IEvent): Promise<void> {
    try {
      this.logger.info('Publishing event to QStash', {
        operation: 'qstash.event.publish',
        module: 'QStashEventPublisher',
        eventName: event.constructor.name,
        aggregateId: (event as any).aggregateId,
      });

      await this.client.publishJSON({
        url: this.eventHandlerUrl,
        body: {
          eventName: event.constructor.name,
          payload: event,
          timestamp: new Date().toISOString(),
        },
        retries: 3,
      });

      this.logger.info('Event published successfully', {
        operation: 'qstash.event.publish.success',
        module: 'QStashEventPublisher',
        eventName: event.constructor.name,
      });
    } catch (error) {
      this.logger.error(
        'Failed to publish event',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'qstash.event.publish.error',
          module: 'QStashEventPublisher',
          eventName: event.constructor.name,
        }
      );
      throw error;
    }
  }

  /**
   * Publish multiple events in batch
   * Uses QStash batch API for efficiency
   */
  async publishBatch(events: IEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    try {
      this.logger.info('Publishing batch of events to QStash', {
        operation: 'qstash.event.publishBatch',
        module: 'QStashEventPublisher',
        eventCount: events.length,
      });

      // QStash batch API requires array of message objects
      const messages = events.map((event) => ({
        url: this.eventHandlerUrl,
        body: JSON.stringify({
          eventName: event.constructor.name,
          payload: event,
          timestamp: new Date().toISOString(),
        }),
        retries: 3,
      }));

      await this.client.batchJSON(messages);

      this.logger.info('Event batch published successfully', {
        operation: 'qstash.event.publishBatch.success',
        module: 'QStashEventPublisher',
        eventCount: events.length,
      });
    } catch (error) {
      this.logger.error(
        'Failed to publish event batch',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'qstash.event.publishBatch.error',
          module: 'QStashEventPublisher',
          eventCount: events.length,
        }
      );
      throw error;
    }
  }
}
