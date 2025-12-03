import { Injectable, Inject } from '@nestjs/common';
import {
  IMessageBufferService,
  IConfigurationService,
  ILoggerService,
} from '@fnd/backend';
import { TypedMessage } from '@fnd/domain';
import { Queue, Job } from 'bullmq';
import Redis from 'ioredis';

/**
 * Redis Message Buffer Service
 *
 * Implements message buffering using Redis and BullMQ delayed jobs.
 *
 * Architecture:
 * - Redis Hash: stores buffered messages per thread
 * - BullMQ Delayed Jobs: triggers processing after timeout
 * - Dynamic timeout reset: changeDelay() when new messages arrive
 *
 * Redis Keys:
 * - buffer:thread:{threadId} → Hash with buffered messages
 * - buffer:job:{threadId} → Stores scheduled job ID
 *
 * Queue: 'message-buffer-queue'
 */
@Injectable()
export class RedisMessageBufferService implements IMessageBufferService {
  private readonly redis: Redis;
  private readonly queue: Queue;
  private readonly BUFFER_KEY_PREFIX = 'buffer:thread:';
  private readonly JOB_ID_KEY_PREFIX = 'buffer:job:';
  private readonly BUFFER_TTL_SECONDS = 300; // 5 minutes safety TTL
  private readonly QUEUE_NAME = 'message-buffer-queue';

  constructor(
    @Inject('IConfigurationService')
    private readonly configurationService: IConfigurationService,
    @Inject('ILoggerService')
    private readonly logger: ILoggerService,
  ) {
    const redisUrl = this.configurationService.getRedisJobsUrl();
    this.redis = new Redis(redisUrl);

    this.queue = new Queue(this.QUEUE_NAME, {
      connection: this.redis,
    });

    this.logger.info('RedisMessageBufferService initialized', {
      operation: 'buffer.init',
      module: 'RedisMessageBufferService',
      queue: this.QUEUE_NAME,
    });
  }

  /**
   * Add message to buffer
   */
  async addMessageToBuffer(
    threadId: string,
    message: TypedMessage,
  ): Promise<void> {
    const key = this.getBufferKey(threadId);

    try {
      // Get existing buffer or create empty array
      const existing = await this.redis.get(key);
      const messages: TypedMessage[] = existing ? JSON.parse(existing) : [];

      // Add new message
      messages.push(message);

      // Save back to Redis with TTL
      await this.redis.set(
        key,
        JSON.stringify(messages),
        'EX',
        this.BUFFER_TTL_SECONDS,
      );

      this.logger.debug('Message added to buffer', {
        operation: 'buffer.add',
        module: 'RedisMessageBufferService',
        threadId,
        messageId: message.id,
        bufferSize: messages.length,
      });
    } catch (error) {
      this.logger.error(
        'Failed to add message to buffer',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'buffer.add.error',
          module: 'RedisMessageBufferService',
          threadId,
          messageId: message.id,
        },
      );
      throw error;
    }
  }

  /**
   * Get buffered messages
   */
  async getBufferedMessages(threadId: string): Promise<TypedMessage[]> {
    const key = this.getBufferKey(threadId);

    try {
      const data = await this.redis.get(key);

      if (!data) {
        this.logger.debug('No buffered messages found', {
          operation: 'buffer.get',
          module: 'RedisMessageBufferService',
          threadId,
        });
        return [];
      }

      const messages: TypedMessage[] = JSON.parse(data);

      this.logger.debug('Buffered messages retrieved', {
        operation: 'buffer.get',
        module: 'RedisMessageBufferService',
        threadId,
        messageCount: messages.length,
      });

      return messages;
    } catch (error) {
      this.logger.error(
        'Failed to get buffered messages',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'buffer.get.error',
          module: 'RedisMessageBufferService',
          threadId,
        },
      );
      return [];
    }
  }

  /**
   * Clear buffer
   */
  async clearBuffer(threadId: string): Promise<void> {
    const bufferKey = this.getBufferKey(threadId);
    const jobIdKey = this.getJobIdKey(threadId);

    try {
      await this.redis.del(bufferKey);
      await this.redis.del(jobIdKey);

      this.logger.debug('Buffer cleared', {
        operation: 'buffer.clear',
        module: 'RedisMessageBufferService',
        threadId,
      });
    } catch (error) {
      this.logger.error(
        'Failed to clear buffer',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'buffer.clear.error',
          module: 'RedisMessageBufferService',
          threadId,
        },
      );
      throw error;
    }
  }

  /**
   * Schedule processing with delay
   *
   * If job already exists, resets the delay (changeDelay).
   * Otherwise, creates a new delayed job.
   */
  async scheduleProcessing(
    threadId: string,
    timeoutMs: number,
    metadata: {
      accountId: string;
      projectId: string;
      projectType: string;
    },
  ): Promise<string> {
    try {
      // Check if job already exists
      const existingJobId = await this.getScheduledJobId(threadId);

      if (existingJobId) {
        // Get existing job and reset delay
        const job = await this.queue.getJob(existingJobId);

        if (job && (await job.isDelayed())) {
          await job.changeDelay(timeoutMs);

          this.logger.debug('Delayed job timeout reset', {
            operation: 'buffer.schedule.reset',
            module: 'RedisMessageBufferService',
            threadId,
            jobId: existingJobId,
            timeoutMs,
          });

          return existingJobId;
        }
      }

      // Create new delayed job
      const job = await this.queue.add(
        'process-buffered-messages',
        {
          threadId,
          accountId: metadata.accountId,
          projectId: metadata.projectId,
          projectType: metadata.projectType,
        },
        {
          delay: timeoutMs,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      // Store job ID for future reference
      await this.redis.set(
        this.getJobIdKey(threadId),
        job.id!,
        'EX',
        this.BUFFER_TTL_SECONDS,
      );

      this.logger.info('Delayed job scheduled', {
        operation: 'buffer.schedule.new',
        module: 'RedisMessageBufferService',
        threadId,
        jobId: job.id,
        timeoutMs,
      });

      return job.id!;
    } catch (error) {
      this.logger.error(
        'Failed to schedule processing',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'buffer.schedule.error',
          module: 'RedisMessageBufferService',
          threadId,
        },
      );
      throw error;
    }
  }

  /**
   * Cancel scheduled processing
   */
  async cancelScheduledProcessing(threadId: string): Promise<void> {
    try {
      const jobId = await this.getScheduledJobId(threadId);

      if (jobId) {
        const job = await this.queue.getJob(jobId);
        if (job) {
          await job.remove();

          this.logger.debug('Scheduled job cancelled', {
            operation: 'buffer.cancel',
            module: 'RedisMessageBufferService',
            threadId,
            jobId,
          });
        }
      }

      await this.redis.del(this.getJobIdKey(threadId));
    } catch (error) {
      this.logger.error(
        'Failed to cancel scheduled processing',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'buffer.cancel.error',
          module: 'RedisMessageBufferService',
          threadId,
        },
      );
      throw error;
    }
  }

  /**
   * Get scheduled job ID for thread
   */
  async getScheduledJobId(threadId: string): Promise<string | null> {
    try {
      const jobId = await this.redis.get(this.getJobIdKey(threadId));
      return jobId;
    } catch (error) {
      this.logger.error(
        'Failed to get scheduled job ID',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'buffer.get_job_id.error',
          module: 'RedisMessageBufferService',
          threadId,
        },
      );
      return null;
    }
  }

  /**
   * Get Redis key for buffer
   */
  private getBufferKey(threadId: string): string {
    return `${this.BUFFER_KEY_PREFIX}${threadId}`;
  }

  /**
   * Get Redis key for job ID
   */
  private getJobIdKey(threadId: string): string {
    return `${this.JOB_ID_KEY_PREFIX}${threadId}`;
  }

  /**
   * Close connections (cleanup)
   */
  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
    await this.redis.disconnect();

    this.logger.info('RedisMessageBufferService closed', {
      operation: 'buffer.destroy',
      module: 'RedisMessageBufferService',
    });
  }
}
