import { Inject, Injectable } from '@nestjs/common';
import { ILoggerService, IMessagePipelineStep } from '@fnd/backend';
import { MessageContext, PipelineResult } from '@fnd/domain';

/**
 * Buffer Messages Step
 *
 * Accumulates messages in a conversation buffer before processing.
 * Useful for handling rapid message sequences as a single context.
 *
 * Behavior:
 * - Loads recent messages from same conversation
 * - Adds to context.metadata.conversationHistory
 * - Waits for configurable time window for more messages (future)
 * - Always continues
 *
 * Configuration (from project settings):
 * - buffer.enabled: boolean
 * - buffer.maxWaitTimeMs: number (default: 2000)
 * - buffer.maxMessages: number (default: 10)
 *
 * TODO: Implement actual buffering logic with Redis/memory cache
 */
@Injectable()
export class BufferMessagesStep implements IMessagePipelineStep {
  readonly name = 'buffer-messages';

  constructor(
    @Inject('ILoggerService') private readonly logger: ILoggerService
    // TODO: Inject cache service for buffering
    // @Inject('ICacheService') private readonly cacheService: ICacheService
  ) {}

  async execute(context: MessageContext): Promise<PipelineResult> {
    this.logger.debug('Buffering conversation messages', {
      operation: 'pipeline.step.buffer_messages',
      module: 'BufferMessagesStep',
      conversationId: context.threadId,
      messageId: context.message.id,
    });

    // Check if buffering is enabled
    const bufferEnabled =
      context.metadata.project?.settings?.buffer?.enabled ?? true;

    if (!bufferEnabled) {
      this.logger.debug('Message buffering disabled', {
        operation: 'pipeline.step.buffer_messages.disabled',
      });

      return {
        shouldContinue: true,
        context,
      };
    }

    const maxMessages =
      context.metadata.project?.settings?.buffer?.maxMessages ?? 10;

    try {
      // TODO: Load recent messages from conversation
      // const conversationHistory = await this.messageRepository.findByConversation(
      //   context.conversationId,
      //   context.accountId,
      //   { limit: maxMessages, orderBy: 'timestamp', order: 'desc' }
      // );
      //
      // // Add current message to history
      // conversationHistory.unshift(context.message);
      //
      // context.metadata.conversationHistory = conversationHistory;

      // Temporary: simulate conversation history
      this.logger.info('Message buffering placeholder executed', {
        operation: 'pipeline.step.buffer_messages.placeholder',
        conversationId: context.threadId,
      });

      // Mock conversation history (just current message for now)
      context.metadata.conversationHistory = [context.message];

      return {
        shouldContinue: true,
        context,
        stepMetadata: {
          historyLength: context.metadata.conversationHistory.length,
        },
      };
    } catch (error) {
      this.logger.error(
        'Failed to buffer messages',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'pipeline.step.buffer_messages.error',
          module: 'BufferMessagesStep',
          conversationId: context.threadId,
        }
      );

      // Continue even if buffering fails (use current message only)
      context.metadata.conversationHistory = [context.message];

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
