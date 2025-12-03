import { Inject, Injectable } from '@nestjs/common';
import { ILoggerService, IMessagePipelineStep } from '@fnd/backend';
import { MessageContext, PipelineResult } from '@fnd/domain';

/**
 * Send Response Step
 *
 * Sends the AI-generated response back to the user via the original channel.
 *
 * Behavior:
 * - Extracts AI response from context
 * - Determines target channel (from original message metadata)
 * - Sends message via appropriate channel adapter
 * - Logs sent message for tracking
 * - Always continues (pipeline ends after this step typically)
 *
 * Channel Adapters:
 * - WhatsApp (via WAHA, Whaticket, etc.)
 * - Instagram (via Meta API)
 * - Mercado Livre (via NotificameHub)
 *
 * TODO: Implement channel adapter service
 */
@Injectable()
export class SendResponseStep implements IMessagePipelineStep {
  readonly name = 'send-response';

  constructor(
    @Inject('ILoggerService') private readonly logger: ILoggerService
    // TODO: Inject channel adapter service
    // @Inject('IChannelAdapterService') private readonly channelAdapter: IChannelAdapterService
  ) {}

  async execute(context: MessageContext): Promise<PipelineResult> {
    this.logger.debug('Sending response to user', {
      operation: 'pipeline.step.send_response',
      module: 'SendResponseStep',
      messageId: context.message.id,
      channel: context.message.metadata.channel,
      provider: context.message.metadata.provider,
    });

    try {
      // Get AI response from context
      const aiResponse = context.metadata.aiResponse;

      if (!aiResponse || !aiResponse.text) {
        this.logger.warn('No AI response to send', {
          operation: 'pipeline.step.send_response.no_response',
          module: 'SendResponseStep',
          messageId: context.message.id,
        });

        return {
          shouldContinue: false,
          context,
          reason: 'No AI response available to send',
        };
      }

      // Extract channel info
      const channel = context.message.metadata.channel;
      const provider = context.message.metadata.provider;
      const implementation = context.message.metadata.implementation;
      const recipient = context.message.metadata.from; // Send back to sender

      // TODO: Send via channel adapter
      // const sentMessage = await this.channelAdapter.sendTextMessage({
      //   channel,
      //   provider,
      //   implementation,
      //   to: recipient,
      //   text: aiResponse.text,
      //   accountId: context.accountId,
      //   projectId: context.projectId,
      // });
      //
      // // Store sent message ID
      // context.metadata.sentMessageId = sentMessage.id;

      // Temporary placeholder
      this.logger.info('Message send placeholder', {
        operation: 'pipeline.step.send_response.placeholder',
        module: 'SendResponseStep',
        messageId: context.message.id,
        channel,
        provider,
        implementation,
        recipientId: recipient.id,
        responseLength: aiResponse.text.length,
      });

      // Mock sent message ID
      context.metadata.sentMessageId = `sent-${context.message.id}`;

      this.logger.info('Response sent successfully', {
        operation: 'pipeline.step.send_response.success',
        module: 'SendResponseStep',
        originalMessageId: context.message.id,
        sentMessageId: context.metadata.sentMessageId,
        channel,
      });

      return {
        shouldContinue: true,
        context,
        stepMetadata: {
          sentMessageId: context.metadata.sentMessageId,
          channel,
          provider,
        },
      };
    } catch (error) {
      this.logger.error(
        'Failed to send response',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'pipeline.step.send_response.error',
          module: 'SendResponseStep',
          messageId: context.message.id,
        }
      );

      return {
        shouldContinue: false,
        context,
        reason: 'Failed to send response',
        stepMetadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }
}
