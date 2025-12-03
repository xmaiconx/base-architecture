import { Inject, Injectable } from '@nestjs/common';
import { ILoggerService, IMessagePipelineStep } from '@fnd/backend';
import { MessageContext, MessageType, PipelineResult } from '@fnd/domain';

/**
 * Generate AI Response Step
 *
 * Generates AI response based on conversation context.
 *
 * Behavior:
 * - Builds prompt from conversation history
 * - Includes transcriptions if available
 * - Calls AI service (OpenAI, Anthropic, etc.)
 * - Adds response to context.metadata.aiResponse
 * - Always continues
 *
 * Configuration (from project settings):
 * - ai.provider: string (e.g., "openai", "anthropic")
 * - ai.model: string (e.g., "gpt-4", "claude-3-opus")
 * - ai.temperature: number
 * - ai.systemPrompt: string
 * - ai.maxTokens: number
 *
 * TODO: Implement AI service integration
 */
@Injectable()
export class GenerateAIResponseStep implements IMessagePipelineStep {
  readonly name = 'generate-ai-response';

  constructor(
    @Inject('ILoggerService') private readonly logger: ILoggerService
    // TODO: Inject AI service
    // @Inject('IAIService') private readonly aiService: IAIService
  ) {}

  async execute(context: MessageContext): Promise<PipelineResult> {
    this.logger.debug('Generating AI response', {
      operation: 'pipeline.step.generate_ai_response',
      module: 'GenerateAIResponseStep',
      messageId: context.message.id,
      conversationId: context.threadId,
    });

    try {
      // Build prompt from conversation context
      const prompt = this.buildPrompt(context);

      // Get AI configuration
      const aiConfig = context.metadata.project?.settings?.ai ?? {};
      const provider = aiConfig.provider ?? 'openai';
      const model = aiConfig.model ?? 'gpt-4';
      const temperature = aiConfig.temperature ?? 0.7;
      const systemPrompt = aiConfig.systemPrompt ?? 'You are a helpful assistant.';
      const maxTokens = aiConfig.maxTokens ?? 1000;

      this.logger.debug('AI configuration', {
        operation: 'pipeline.step.generate_ai_response.config',
        provider,
        model,
        temperature,
      });

      // TODO: Call AI service
      // const response = await this.aiService.generateResponse({
      //   provider,
      //   model,
      //   temperature,
      //   systemPrompt,
      //   maxTokens,
      //   messages: prompt,
      // });
      //
      // context.metadata.aiResponse = {
      //   text: response.text,
      //   provider,
      //   model,
      //   tokensUsed: response.tokensUsed,
      //   finishReason: response.finishReason,
      // };

      // Temporary placeholder
      this.logger.info('AI response generation placeholder', {
        operation: 'pipeline.step.generate_ai_response.placeholder',
        messageId: context.message.id,
      });

      context.metadata.aiResponse = {
        text: `[AI Response Placeholder]\n\nReceived message: ${this.extractMessageText(context.message)}\n\nThis is a placeholder response. TODO: Implement AI service integration with ${provider}/${model}.`,
        provider,
        model,
        tokensUsed: 0,
        finishReason: 'placeholder',
      };

      return {
        shouldContinue: true,
        context,
        stepMetadata: {
          provider,
          model,
          promptLength: prompt.length,
        },
      };
    } catch (error) {
      this.logger.error(
        'Failed to generate AI response',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'pipeline.step.generate_ai_response.error',
          module: 'GenerateAIResponseStep',
          messageId: context.message.id,
        }
      );

      // Add error response
      context.metadata.aiResponse = {
        text: 'Sorry, I encountered an error processing your message. Please try again later.',
        error: error instanceof Error ? error.message : String(error),
      };

      return {
        shouldContinue: true,
        context,
        stepMetadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * Build prompt from conversation context
   */
  private buildPrompt(context: MessageContext): string {
    const messages: string[] = [];

    // Add conversation history
    const history = context.metadata.conversationHistory ?? [context.message];

    for (const msg of history) {
      const text = this.extractMessageText(msg);
      const sender = msg.metadata.from.id;
      const direction = msg.direction;

      messages.push(`[${direction}] ${sender}: ${text}`);
    }

    // Add transcriptions if available
    const transcriptions = context.metadata.transcriptions ?? [];
    for (const t of transcriptions) {
      messages.push(`[${t.type} transcription]: ${t.text}`);
    }

    return messages.join('\n');
  }

  /**
   * Extract text from any message type
   */
  private extractMessageText(message: any): string {
    switch (message.type) {
      case MessageType.TEXT:
        return message.content.text;

      case MessageType.AUDIO:
        return '[Audio message]';

      case MessageType.VIDEO:
        return message.content.caption
          ? `[Video: ${message.content.caption}]`
          : '[Video message]';

      case MessageType.IMAGE:
        return message.content.caption
          ? `[Image: ${message.content.caption}]`
          : '[Image message]';

      case MessageType.DOCUMENT:
        return `[Document: ${message.content.filename ?? 'file'}]`;

      case MessageType.LOCATION:
        return `[Location: ${message.content.latitude}, ${message.content.longitude}]`;

      case MessageType.CONTACT:
        return `[Contact: ${message.content.contacts?.[0]?.name ?? 'contact'}]`;

      default:
        return '[Unsupported message type]';
    }
  }
}
