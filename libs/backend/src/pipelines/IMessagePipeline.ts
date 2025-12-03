import { MessageContext, PipelineResult } from '@fnd/domain';
import { IMessagePipelineStep } from './IMessagePipelineStep';

/**
 * Message Pipeline Interface
 *
 * Orchestrates the execution of multiple pipeline steps in sequence.
 *
 * Responsibilities:
 * - Execute steps in order
 * - Stop on first step that returns shouldContinue: false
 * - Propagate context through all steps
 * - Collect execution metrics and history
 */
export interface IMessagePipeline {
  /**
   * Execute the pipeline with given context
   *
   * @param context - Initial message context
   * @returns Final pipeline result (from last executed step)
   */
  execute(context: MessageContext): Promise<PipelineResult>;

  /**
   * Get the list of steps in this pipeline
   */
  getSteps(): ReadonlyArray<IMessagePipelineStep>;

  /**
   * Get pipeline name/identifier
   */
  getName(): string;
}

/**
 * Pipeline Registry Interface
 *
 * Registry for managing available pipeline steps.
 * Allows dynamic composition of pipelines.
 */
export interface IPipelineStepRegistry {
  /**
   * Register a step with a unique name
   */
  register(name: string, step: IMessagePipelineStep): void;

  /**
   * Get a step by name
   * @throws Error if step not found
   */
  get(name: string): IMessagePipelineStep;

  /**
   * Check if a step is registered
   */
  has(name: string): boolean;

  /**
   * Get all registered step names
   */
  getRegisteredSteps(): string[];
}
