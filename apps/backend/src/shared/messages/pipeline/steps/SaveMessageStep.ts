import { Inject, Injectable } from '@nestjs/common';
import { ILoggerService, IMessagePipelineStep } from '@fnd/backend';
import { MessageContext, PipelineResult } from '@fnd/domain';

/**
 * Save Message Step
 *
 * Persists the incoming message to the database.
 *
 * Behavior:
 * - Saves message to messages table
 * - Associates with conversation/thread
 * - Handles idempotency (checks for existing message by external ID)
 * - Always continues pipeline
 *
 * TODO: Create IMessageRepository and Message entity
 */
@Injectable()
export class SaveMessageStep implements IMessagePipelineStep {
  readonly name = 'save-message';

  constructor(
    @Inject('ILoggerService') private readonly logger: ILoggerService
    // TODO: Inject IMessageRepository when created
    // @Inject('IMessageRepository') private readonly messageRepository: IMessageRepository
  ) {}

  async execute(context: MessageContext): Promise<PipelineResult> {
    this.logger.debug('Saving message to database', {
      operation: 'pipeline.step.save_message',
      module: 'SaveMessageStep',
      messageId: context.message.id,
      messageType: context.message.type,
      accountId: context.accountId,
    });

    try {
      // TODO: Implement message persistence
      // Check if message already exists (idempotency)
      // const existingMessage = await this.messageRepository.findByExternalId(
      //   context.message.metadata.externalId,
      //   context.accountId
      // );
      //
      // if (existingMessage) {
      //   this.logger.info('Message already exists, skipping save', {
      //     operation: 'pipeline.step.save_message.duplicate',
      //     messageId: context.message.id,
      //     existingMessageId: existingMessage.id,
      //   });
      //
      //   // Update context with existing message ID
      //   context.metadata.savedMessageId = existingMessage.id;
      //
      //   return {
      //     shouldContinue: true,
      //     context,
      //   };
      // }
      //
      // // Save new message
      // const savedMessage = await this.messageRepository.create({
      //   ...context.message,
      //   accountId: context.accountId,
      //   projectId: context.projectId,
      //   conversationId: context.conversationId,
      // });
      //
      // // Store saved message ID in context
      // context.metadata.savedMessageId = savedMessage.id;

      // Temporary: just log that we would save
      this.logger.info('Message save placeholder executed', {
        operation: 'pipeline.step.save_message.placeholder',
        messageId: context.message.id,
      });

      context.metadata.savedMessageId = context.message.id; // Use original ID for now

      return {
        shouldContinue: true,
        context,
      };
    } catch (error) {
      this.logger.error(
        'Failed to save message',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'pipeline.step.save_message.error',
          module: 'SaveMessageStep',
          messageId: context.message.id,
        }
      );

      // Even if save fails, continue pipeline (message is in context)
      // We can retry saving asynchronously later
      return {
        shouldContinue: true,
        context,
        stepMetadata: {
          saveError: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }
}
