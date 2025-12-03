import { Injectable, Inject } from '@nestjs/common';
import { ILoggerService, ParseResult } from '@fnd/backend';
import {
  IThreadRepository,
  IMessageRepository,
  IProjectRepository,
  CreateThreadData,
} from '@fnd/database';
import { MessageContext, ChatChannel, ChatProvider, ChatImplementation } from '@fnd/domain';
import { MessagePipelineFactory } from '../../shared/messages/pipeline/MessagePipelineFactory';

/**
 * Message Pipeline Processor (OPTIMIZED)
 *
 * Responsabilidade:
 * - Receber ParseResult com batch de MessageContext
 * - Criar/encontrar thread UMA VEZ para todo o batch
 * - Carregar project configuration UMA VEZ
 * - Determinar pipeline type
 * - Executar pipeline para cada mensagem do batch
 * - Atualizar thread timestamps
 *
 * Chamado por: BaseWebhookProcessor após parsing
 */
@Injectable()
export class MessagePipelineProcessor {
  constructor(
    @Inject('IThreadRepository')
    private readonly threadRepository: IThreadRepository,
    @Inject('IMessageRepository')
    private readonly messageRepository: IMessageRepository,
    @Inject('IProjectRepository')
    private readonly projectRepository: IProjectRepository,
    @Inject('ILoggerService')
    private readonly logger: ILoggerService,
    private readonly pipelineFactory: MessagePipelineFactory,
  ) {}

  /**
   * Processa batch de mensagens através do pipeline (OPTIMIZED)
   *
   * ParseResult contém batchContext com sender/thread info agregada.
   * Thread é criada/buscada UMA VEZ para todo o batch.
   */
  async process(parseResult: ParseResult<MessageContext[]>): Promise<void> {
    if (!parseResult.success || !parseResult.data) {
      throw parseResult.error ?? new Error('Invalid parse result');
    }

    const { data: contexts, batchContext } = parseResult;

    if (!batchContext) {
      throw new Error('Missing batchContext in ParseResult');
    }

    const { accountId, projectId, senderId, threadIdentifier } = batchContext;

    this.logger.info('Processing message batch through pipeline', {
      operation: 'message.pipeline.batch_start',
      module: 'MessagePipelineProcessor',
      messageCount: contexts.length,
      senderId,
      provider: batchContext.provider,
      channel: batchContext.channel,
      implementation: batchContext.implementation,
    });

    try {
      // 1. Find or create thread ONCE (optimization)
      const threadData: CreateThreadData = {
        accountId,
        projectId: projectId ?? 'default',
        senderId,
        senderName: batchContext.senderName,
        senderPhone: batchContext.senderPhone,
        channel: this.mapChannel(batchContext.channel),
        provider: this.mapProvider(batchContext.provider),
        implementation: batchContext.implementation ?? undefined,
        externalId: threadIdentifier.ticketUuid,
      };

      const thread = await this.threadRepository.findOrCreate(threadData);

      this.logger.info('Thread loaded for batch', {
        operation: 'message.pipeline.thread_loaded',
        module: 'MessagePipelineProcessor',
        threadId: thread.id,
        externalId: thread.externalId,
        isNew: !thread.lastMessageAt,
        messageCount: contexts.length,
      });

      // 2. Load project configuration ONCE
      const project = await this.projectRepository.findById(
        projectId ?? 'default',
        accountId,
      );

      const projectType = project?.projectType ?? 'default';

      this.logger.info('Project loaded for batch', {
        operation: 'message.pipeline.project_loaded',
        module: 'MessagePipelineProcessor',
        projectId: projectId ?? 'default',
        projectType,
        projectStatus: project?.status,
      });

      // 3. Create pipeline ONCE
      const pipeline = this.pipelineFactory.createPipeline(projectType);

      // 4. Process each message in batch (loop interno)
      for (const messageContext of contexts) {
        // Update context with thread and project
        messageContext.projectId = projectId ?? 'default';
        messageContext.threadId = thread.id;
        messageContext.metadata.threadId = thread.id;
        messageContext.metadata.project = project ?? undefined;

        // Execute pipeline
        this.logger.debug('Executing pipeline for message', {
          operation: 'message.pipeline.executing',
          module: 'MessagePipelineProcessor',
          messageType: messageContext.message.type,
          direction: messageContext.message.direction,
          threadId: thread.id,
        });

        const result = await pipeline.execute(messageContext);

        // Update thread timestamp
        await this.threadRepository.updateLastMessageAt(
          thread.id,
          messageContext.message.timestamp,
        );

        this.logger.debug('Message processed', {
          operation: 'message.pipeline.message_completed',
          module: 'MessagePipelineProcessor',
          messageType: messageContext.message.type,
          continued: result.shouldContinue,
          stepsExecuted: messageContext.executionHistory.length,
        });
      }

      this.logger.info('Batch pipeline executed successfully', {
        operation: 'message.pipeline.batch_completed',
        module: 'MessagePipelineProcessor',
        pipelineName: pipeline.getName(),
        threadId: thread.id,
        messagesProcessed: contexts.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(
        'Pipeline batch execution failed',
        error instanceof Error ? error : new Error(errorMessage),
        {
          operation: 'message.pipeline.batch_error',
          module: 'MessagePipelineProcessor',
          messageCount: contexts.length,
          senderId,
        },
      );

      throw new Error(errorMessage);
    }
  }

  /**
   * Map channel string to ChatChannel enum
   */
  private mapChannel(channel: string): ChatChannel {
    const upperChannel = channel.toUpperCase().replace(/-/g, '_');
    if (Object.values(ChatChannel).includes(upperChannel as ChatChannel)) {
      return upperChannel as ChatChannel;
    }
    return ChatChannel.WHATSAPP;
  }

  /**
   * Map provider string to ChatProvider enum
   */
  private mapProvider(provider: string): ChatProvider {
    const upperProvider = provider.toUpperCase().replace(/-/g, '_');
    if (Object.values(ChatProvider).includes(upperProvider as ChatProvider)) {
      return upperProvider as ChatProvider;
    }
    return ChatProvider.WHATICKET;
  }
}
