import { MessageContext, PipelineResult } from '@fnd/domain';

/**
 * Message Pipeline Step Interface
 *
 * Represents a single processing step in the message pipeline.
 * Based on:
 * - Middleware Pattern (Express.js, NestJS)
 * - Chain of Responsibility (GoF)
 * - Pipeline Pattern (Unix pipes, Apache Camel)
 *
 * Each step:
 * 1. Receives a MessageContext
 * 2. Performs some processing
 * 3. Decides whether to continue or stop the pipeline
 * 4. Returns updated context + decision
 *
 * Steps should be:
 * - **Idempotent**: Running twice should have the same effect
 * - **Single Responsibility**: One clear purpose
 * - **Stateless**: All state in context, not in step instance
 * - **Observable**: Log key decisions and errors
 */
export interface IMessagePipelineStep {
  /**
   * Step name/identifier (for logging and debugging)
   */
  readonly name: string;

  /**
   * Execute the step logic
   *
   * @param context - Current pipeline context
   * @returns Promise<PipelineResult> - Result indicating whether to continue
   *
   * @example
   * ```typescript
   * async execute(context: MessageContext): Promise<PipelineResult> {
   *   if (!context.projectId) {
   *     return {
   *       shouldContinue: false,
   *       context,
   *       reason: 'Project ID is required'
   *     };
   *   }
   *
   *   const project = await this.projectRepo.findById(context.projectId);
   *
   *   if (!project.isActive) {
   *     return {
   *       shouldContinue: false,
   *       context,
   *       reason: 'Project is not active'
   *     };
   *   }
   *
   *   // Enrich context for downstream steps
   *   context.metadata.project = project;
   *
   *   return {
   *     shouldContinue: true,
   *     context
   *   };
   * }
   * ```
   */
  execute(context: MessageContext): Promise<PipelineResult>;
}

/**
 * Pipeline Step Configuration
 *
 * Used for dynamic pipeline construction
 */
export interface PipelineStepConfig {
  /** Unique step name (matches registry key) */
  name: string;

  /** Order in pipeline (lower = earlier) */
  order: number;

  /** Optional configuration specific to this step */
  config?: Record<string, any>;

  /** Whether this step is enabled (default: true) */
  enabled?: boolean;
}
