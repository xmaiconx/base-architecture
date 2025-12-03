import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { EventBus, IEvent } from '@nestjs/cqrs';
import { IJobQueue, ILoggerService } from '@fnd/backend';
import { QUEUE_COMMANDS } from '@fnd/backend';

@Injectable()
export class AuditEventListener implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBus,
    @Inject('IJobQueue') private readonly jobQueue: IJobQueue,
    @Inject('ILoggerService') private readonly logger: ILoggerService,
  ) {}

  onModuleInit() {
    this.logger.info('Initializing Audit Event Listener', {
      operation: 'audit.listener.init',
      module: 'AuditEventListener',
    });

    // Subscribe to ALL events globally
    // Wrap async call in synchronous handler to satisfy EventBus type
    this.eventBus.subscribe((event: IEvent) => {
      // Fire and forget - capture event asynchronously without blocking
      this.captureEvent(event).catch((error) => {
        this.logger.error('Unhandled error in captureEvent', error as Error, {
          operation: 'audit.listener.unhandled',
          module: 'AuditEventListener',
        });
      });
    });
  }

  private async captureEvent(event: any) {
    try {
      // NestJS CQRS events are plain objects, need to extract properties safely
      const eventData = event.data || {};
      const eventType = event.type || event.constructor?.name || 'UnknownEvent';
      const eventOccurredAt = event.occurredAt || new Date();

      // Extract context from event data
      const workspaceId = eventData.workspaceId || null;
      const accountId = eventData.accountId || null;
      const userId = eventData.userId || eventData.createdBy || eventData.addedBy || null;

      // Sanitize payload (remove sensitive data)
      const sanitizedPayload = this.sanitizePayload(eventData);

      // Enqueue in BullMQ
      await this.jobQueue.add(QUEUE_COMMANDS.AUDIT_LOG, {
        dto: {
          workspaceId,
          accountId,
          userId,
          eventName: eventType,
          eventType: 'domain', // All events via EventBus are domain events
          payload: sanitizedPayload,
          occurredAt: eventOccurredAt,
        },
      });

      this.logger.debug('Event captured for audit', {
        operation: 'audit.listener.captured',
        module: 'AuditEventListener',
        eventName: eventType,
        workspaceId,
        accountId,
      });
    } catch (error) {
      this.logger.error('Failed to capture audit event', error as Error, {
        operation: 'audit.listener.error',
        module: 'AuditEventListener',
        errorObject: error,
      });
      // Don't throw - we don't want to break the main flow
    }
  }

  private sanitizePayload(data: any): object {
    // Remove sensitive fields
    const {
      password,
      passwordHash,
      emailVerificationToken,
      accessToken,
      refreshToken,
      ...safe
    } = data;

    return safe;
  }
}
