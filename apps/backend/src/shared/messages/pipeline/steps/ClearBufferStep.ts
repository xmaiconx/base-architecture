import { Inject, Injectable } from '@nestjs/common';
import {
  ILoggerService,
  IMessagePipelineStep,
  IMessageBufferService,
} from '@fnd/backend';
import { MessageContext, PipelineResult } from '@fnd/domain';

/**
 * Clear Buffer Step (Generic)
 *
 * Clears the message buffer after processing is complete.
 *
 * Behavior:
 * - Deletes buffer from Redis
 * - Removes scheduled job ID
 * - Always continues (cleanup step)
 *
 * Use Case:
 * - Final step in POST_BUFFER pipeline
 * - Ensures buffer is cleaned up after messages are processed
 * - Prevents memory leaks in Redis
 *
 * Example Flow:
 * 1. Pipeline B processes buffered messages
 * 2. AI response generated and sent
 * 3. ClearBufferStep cleans up Redis buffer
 * 4. System ready for next message batch
 */
@Injectable()
export class ClearBufferStep implements IMessagePipelineStep {
  readonly name = 'clear-buffer';

  constructor(
    @Inject('ILoggerService')
    private readonly logger: ILoggerService,
    @Inject('IMessageBufferService')
    private readonly bufferService: IMessageBufferService,
  ) {}

  async execute(context: MessageContext): Promise<PipelineResult> {
    this.logger.debug('Clearing buffer', {
      operation: 'pipeline.step.clear_buffer',
      module: 'ClearBufferStep',
      threadId: context.threadId,
    });

    // Validate threadId is present
    if (!context.threadId) {
      this.logger.warn('No threadId in context, skipping buffer clear', {
        operation: 'pipeline.step.clear_buffer.no_thread_id',
        module: 'ClearBufferStep',
      });

      return {
        shouldContinue: true,
        context,
      };
    }

    try {
      // Clear buffer from Redis
      await this.bufferService.clearBuffer(context.threadId);

      this.logger.info('Buffer cleared successfully', {
        operation: 'pipeline.step.clear_buffer.success',
        module: 'ClearBufferStep',
        threadId: context.threadId,
      });

      return {
        shouldContinue: true,
        context,
        stepMetadata: {
          cleared: true,
          clearedAt: new Date(),
        },
      };
    } catch (error) {
      this.logger.error(
        'Failed to clear buffer',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'pipeline.step.clear_buffer.error',
          module: 'ClearBufferStep',
          threadId: context.threadId,
        },
      );

      // Continue even if clear fails (non-critical error)
      return {
        shouldContinue: true,
        context,
        stepMetadata: {
          clearError: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }
}
