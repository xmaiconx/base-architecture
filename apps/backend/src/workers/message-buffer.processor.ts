import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import {
  ILoggerService,
  IMessageBufferService,
  IJobQueue,
} from '@fnd/backend';
import {
  IProjectRepository,
  IThreadRepository,
} from '@fnd/database';
import { MessageContext } from '@fnd/domain';
import { MessagePipelineFactory } from '../shared/messages/pipeline/MessagePipelineFactory';

/**
 * Message Buffer Processor (Worker)
 *
 * Processes delayed jobs from message-buffer-queue.
 * Triggers POST_BUFFER pipeline execution after timeout expires.
 *
 * Flow:
 * 1. Delayed job fires (timeout expired without new messages)
 * 2. Load buffered messages from Redis
 * 3. Load project and thread data
 * 4. Create MessageContext for Pipeline B
 * 5. Execute POST_BUFFER pipeline
 * 6. Buffer is cleared by ClearBufferStep in pipeline
 *
 * Queue: message-buffer-queue
 * Job Type: process-buffered-messages
 */
@Injectable()
export class MessageBufferProcessor implements OnModuleInit {
  constructor(
    @Inject('IJobQueue')
    private readonly jobQueue: IJobQueue,
    @Inject('ILoggerService')
    private readonly logger: ILoggerService,
    @Inject('IMessageBufferService')
    private readonly bufferService: IMessageBufferService,
    @Inject('IProjectRepository')
    private readonly projectRepository: IProjectRepository,
    @Inject('IThreadRepository')
    private readonly threadRepository: IThreadRepository,
    private readonly pipelineFactory: MessagePipelineFactory,
  ) {}

  async onModuleInit() {
    this.logger.info('Initializing Message Buffer Processor', {
      operation: 'buffer.processor.init',
      module: 'MessageBufferProcessor',
    });

    await this.jobQueue.process('message-buffer-queue', this.processBufferTimeout.bind(this));
  }

  /**
   * Process delayed buffer job
   */
  private async processBufferTimeout(job: any): Promise<void> {
    const { threadId, accountId, projectId, projectType } = job.data;

    this.logger.info('Processing buffered messages job', {
      operation: 'buffer.worker.process.start',
      module: 'MessageBufferProcessor',
      jobId: job.id,
      threadId,
      projectType,
    });

    try {
      // 1. Load buffered messages
      const bufferedMessages = await this.bufferService.getBufferedMessages(
        threadId,
      );

      if (bufferedMessages.length === 0) {
        this.logger.warn('No buffered messages found, skipping processing', {
          operation: 'buffer.worker.process.empty',
          module: 'MessageBufferProcessor',
          threadId,
        });
        return;
      }

      this.logger.info('Buffered messages loaded', {
        operation: 'buffer.worker.process.messages_loaded',
        module: 'MessageBufferProcessor',
        threadId,
        messageCount: bufferedMessages.length,
      });

      // 2. Load project configuration
      const project = await this.projectRepository.findById(
        projectId,
        accountId,
      );

      if (!project) {
        throw new Error(
          `Project not found: ${projectId} (account: ${accountId})`,
        );
      }

      // 3. Load thread
      const thread = await this.threadRepository.findById(threadId, accountId);

      if (!thread) {
        throw new Error(`Thread not found: ${threadId}`);
      }

      // 4. Create MessageContext for Pipeline B
      // Use first message as base for context
      const baseMessage = bufferedMessages[0];

      const context: MessageContext = {
        message: baseMessage,
        accountId,
        projectId,
        threadId,
        startedAt: new Date(),
        metadata: {
          project,
          threadId,
          isBufferedExecution: true, // Flag to indicate this is POST_BUFFER execution
          conversationHistory: bufferedMessages, // Pre-loaded
        },
        executionHistory: [],
      };

      this.logger.debug('Created context for POST_BUFFER pipeline', {
        operation: 'buffer.worker.process.context_created',
        module: 'MessageBufferProcessor',
        threadId,
        messageCount: bufferedMessages.length,
      });

      // 5. Determine pipeline mode
      const useDualPipeline = project.settings?.buffer?.useDualPipeline ?? true;
      const pipelineMode = useDualPipeline ? 'POST_BUFFER' : 'FULL';

      // 6. Create and execute pipeline
      const pipeline = this.pipelineFactory.createPipeline(
        projectType,
        pipelineMode,
      );

      this.logger.info('Executing POST_BUFFER pipeline', {
        operation: 'buffer.worker.process.pipeline_start',
        module: 'MessageBufferProcessor',
        pipelineName: pipeline.getName(),
        threadId,
        mode: pipelineMode,
      });

      const result = await pipeline.execute(context);

      this.logger.info('POST_BUFFER pipeline completed', {
        operation: 'buffer.worker.process.pipeline_completed',
        module: 'MessageBufferProcessor',
        threadId,
        continued: result.shouldContinue,
        stepsExecuted: context.executionHistory.length,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        'Failed to process buffered messages',
        error instanceof Error ? error : new Error(errorMessage),
        {
          operation: 'buffer.worker.process.error',
          module: 'MessageBufferProcessor',
          threadId,
        },
      );

      // Re-throw to trigger BullMQ retry
      throw new Error(errorMessage);
    }
  }
}
