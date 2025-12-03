import { TypedMessage } from '@fnd/domain';

/**
 * Message Buffer Service Interface
 *
 * Manages buffering of messages in Redis before AI processing.
 * Provides delayed job scheduling for batch processing.
 *
 * Use Case: Accumulate rapid message sequences to process as a single AI context.
 *
 * Example Flow:
 * 1. Message arrives → addMessageToBuffer()
 * 2. Schedule delayed job (30s) → scheduleProcessing()
 * 3. Another message arrives → addMessageToBuffer() + resetTimeout()
 * 4. Timeout expires → Worker processes buffered messages
 * 5. clearBuffer() after processing
 */
export interface IMessageBufferService {
  /**
   * Add a message to the buffer for a specific thread
   *
   * @param threadId - Thread identifier
   * @param message - Typed message to buffer
   */
  addMessageToBuffer(threadId: string, message: TypedMessage): Promise<void>;

  /**
   * Get all buffered messages for a thread
   *
   * @param threadId - Thread identifier
   * @returns Array of buffered messages (chronological order)
   */
  getBufferedMessages(threadId: string): Promise<TypedMessage[]>;

  /**
   * Clear the buffer for a thread
   *
   * @param threadId - Thread identifier
   */
  clearBuffer(threadId: string): Promise<void>;

  /**
   * Schedule processing of buffered messages after timeout
   *
   * Creates or updates a BullMQ delayed job.
   * If job already exists for thread, resets the delay.
   *
   * @param threadId - Thread identifier
   * @param timeoutMs - Delay in milliseconds before processing
   * @param metadata - Additional metadata for the job (accountId, projectId, etc)
   * @returns Job ID
   */
  scheduleProcessing(
    threadId: string,
    timeoutMs: number,
    metadata: {
      accountId: string;
      projectId: string;
      projectType: string;
    },
  ): Promise<string>;

  /**
   * Cancel scheduled processing for a thread
   *
   * @param threadId - Thread identifier
   */
  cancelScheduledProcessing(threadId: string): Promise<void>;

  /**
   * Check if there's a scheduled job for a thread
   *
   * @param threadId - Thread identifier
   * @returns Job ID if exists, null otherwise
   */
  getScheduledJobId(threadId: string): Promise<string | null>;
}
