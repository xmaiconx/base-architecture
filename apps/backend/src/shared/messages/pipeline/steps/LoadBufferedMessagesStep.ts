import { Inject, Injectable } from '@nestjs/common';
import {
  ILoggerService,
  IMessagePipelineStep,
  IMessageBufferService,
} from '@fnd/backend';
import { MessageContext, PipelineResult } from '@fnd/domain';

/**
 * Load Buffered Messages Step (Generic)
 *
 * Loads all buffered messages from Redis for the current thread.
 *
 * Behavior:
 * - Retrieves buffered messages from Redis
 * - Adds to context.metadata.conversationHistory
 * - If no messages found, creates empty array (graceful)
 * - Always continues pipeline
 *
 * Context Enrichment:
 * - context.metadata.conversationHistory: TypedMessage[]
 * - context.metadata.bufferLoadedAt: Date
 *
 * Use Case:
 * - Used in POST_BUFFER pipeline mode
 * - Provides full conversation history to AI processing steps
 * - Executed after delayed job fires
 *
 * Example Flow:
 * 1. Delayed job fires (30s timeout expired)
 * 2. Worker creates context for Pipeline B
 * 3. LoadBufferedMessagesStep loads all accumulated messages
 * 4. Pipeline continues with full context
 */
@Injectable()
export class LoadBufferedMessagesStep implements IMessagePipelineStep {
  readonly name = 'load-buffered-messages';

  constructor(
    @Inject('ILoggerService')
    private readonly logger: ILoggerService,
    @Inject('IMessageBufferService')
    private readonly bufferService: IMessageBufferService,
  ) {}

  async execute(context: MessageContext): Promise<PipelineResult> {
    this.logger.debug('Loading buffered messages', {
      operation: 'pipeline.step.load_buffered_messages',
      module: 'LoadBufferedMessagesStep',
      threadId: context.threadId,
    });

    // Validate threadId is present
    if (!context.threadId) {
      this.logger.warn('No threadId in context, skipping buffer load', {
        operation: 'pipeline.step.load_buffered_messages.no_thread_id',
        module: 'LoadBufferedMessagesStep',
      });

      context.metadata.conversationHistory = [];
      return {
        shouldContinue: true,
        context,
      };
    }

    try {
      // Load buffered messages from Redis
      const bufferedMessages = await this.bufferService.getBufferedMessages(
        context.threadId,
      );

      // Add to context
      context.metadata.conversationHistory = bufferedMessages;
      context.metadata.bufferLoadedAt = new Date();

      this.logger.info('Buffered messages loaded successfully', {
        operation: 'pipeline.step.load_buffered_messages.success',
        module: 'LoadBufferedMessagesStep',
        threadId: context.threadId,
        messageCount: bufferedMessages.length,
      });

      return {
        shouldContinue: true,
        context,
        stepMetadata: {
          messageCount: bufferedMessages.length,
          loadedAt: context.metadata.bufferLoadedAt,
        },
      };
    } catch (error) {
      this.logger.error(
        'Failed to load buffered messages',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'pipeline.step.load_buffered_messages.error',
          module: 'LoadBufferedMessagesStep',
          threadId: context.threadId,
        },
      );

      // On error, continue with empty history (graceful degradation)
      context.metadata.conversationHistory = [];

      return {
        shouldContinue: true,
        context,
        stepMetadata: {
          loadError: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }
}
