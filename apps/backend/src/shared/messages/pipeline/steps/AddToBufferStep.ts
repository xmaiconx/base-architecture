import { Inject, Injectable } from '@nestjs/common';
import {
  ILoggerService,
  IMessagePipelineStep,
  IMessageBufferService,
} from '@fnd/backend';
import { MessageContext, PipelineResult } from '@fnd/domain';

/**
 * Add To Buffer Step (Generic)
 *
 * Adds incoming message to buffer and schedules delayed processing.
 *
 * Behavior:
 * - Checks if buffering is enabled (project settings)
 * - If disabled: continues pipeline
 * - If timeout = 0: continues pipeline (immediate processing)
 * - Otherwise: adds to buffer, schedules delayed job, STOPS pipeline
 *
 * Configuration (from project.settings):
 * - buffer.enabled: boolean (default: true)
 * - buffer.timeoutMs: number (default: 30000, 0 = immediate)
 * - buffer.maxMessages: number (safety limit)
 *
 * Context Requirements:
 * - context.project.settings.buffer
 * - context.threadId
 * - context.message
 *
 * Use Case:
 * - Accumulate rapid message sequences to process as single AI context
 * - Reduce AI API calls by batching messages
 *
 * Example Flow:
 * 1. User sends message → added to buffer → delayed job scheduled (30s)
 * 2. User sends another message (5s later) → added to buffer → job delay reset (30s)
 * 3. No more messages for 30s → job fires → Pipeline B processes all messages
 */
@Injectable()
export class AddToBufferStep implements IMessagePipelineStep {
  readonly name = 'add-to-buffer';

  constructor(
    @Inject('ILoggerService')
    private readonly logger: ILoggerService,
    @Inject('IMessageBufferService')
    private readonly bufferService: IMessageBufferService,
  ) {}

  async execute(context: MessageContext): Promise<PipelineResult> {
    this.logger.debug('Checking buffer configuration', {
      operation: 'pipeline.step.add_to_buffer',
      module: 'AddToBufferStep',
      threadId: context.threadId,
      messageId: context.message.id,
    });

    // Check if buffering is enabled
    const bufferConfig = context.metadata.project?.settings?.buffer;

    if (!bufferConfig?.enabled) {
      this.logger.debug('Buffer disabled, continuing pipeline', {
        operation: 'pipeline.step.add_to_buffer.disabled',
        module: 'AddToBufferStep',
        threadId: context.threadId,
      });

      return {
        shouldContinue: true,
        context,
      };
    }

    const DEFAULT_TIMEOUT_MS = 2000;
    const timeoutMs = bufferConfig.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    // Validate threadId is present
    if (!context.threadId) {
      this.logger.warn('No threadId in context, skipping buffer', {
        operation: 'pipeline.step.add_to_buffer.no_thread_id',
        module: 'AddToBufferStep',
        messageId: context.message.id,
      });

      return {
        shouldContinue: true,
        context,
      };
    }

    // Special case: timeout = 0 means immediate processing (no buffer)
    if (timeoutMs === 0) {
      this.logger.debug('Buffer timeout is 0, continuing pipeline immediately', {
        operation: 'pipeline.step.add_to_buffer.immediate',
        module: 'AddToBufferStep',
        threadId: context.threadId,
      });

      return {
        shouldContinue: true,
        context,
      };
    }

    try {
      // Add message to buffer
      await this.bufferService.addMessageToBuffer(
        context.threadId,
        context.message,
      );

      // Schedule or reset delayed job
      const jobId = await this.bufferService.scheduleProcessing(
        context.threadId,
        timeoutMs,
        {
          accountId: context.accountId,
          projectId: context.projectId ?? 'default',
          projectType: context.metadata.project?.projectType ?? 'default',
        },
      );

      this.logger.info('Message added to buffer, pipeline stopped', {
        operation: 'pipeline.step.add_to_buffer.buffered',
        module: 'AddToBufferStep',
        threadId: context.threadId,
        messageId: context.message.id,
        timeoutMs,
        jobId,
      });

      // STOP pipeline here - processing continues when delayed job fires
      return {
        shouldContinue: false,
        context,
        reason: 'message-buffered',
        stepMetadata: {
          buffered: true,
          timeoutMs,
          jobId,
        },
      };
    } catch (error) {
      this.logger.error(
        'Failed to add message to buffer',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'pipeline.step.add_to_buffer.error',
          module: 'AddToBufferStep',
          threadId: context.threadId,
          messageId: context.message.id,
        },
      );

      // On error, continue pipeline (graceful degradation)
      return {
        shouldContinue: true,
        context,
        stepMetadata: {
          bufferError: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }
}
