import { Inject, Injectable } from '@nestjs/common';
import {
  ILoggerService,
  IMessagePipeline,
  IMessagePipelineStep,
} from '@fnd/backend';
import { MessageContext, PipelineResult } from '@fnd/domain';

/**
 * Message Pipeline Implementation
 *
 * Executes a sequence of pipeline steps, propagating context through each step.
 *
 * Pattern: Pipeline Pattern (Unix pipes, Express.js middleware)
 *
 * Behavior:
 * - Executes steps sequentially in array order
 * - Stops on first step that returns shouldContinue: false
 * - Enriches context with execution history
 * - Logs execution metrics for observability
 */
@Injectable()
export class MessagePipeline implements IMessagePipeline {
  constructor(
    @Inject('ILoggerService') private readonly logger: ILoggerService,
    private readonly pipelineName: string,
    private readonly steps: IMessagePipelineStep[]
  ) {}

  /**
   * Execute all pipeline steps sequentially
   */
  async execute(context: MessageContext): Promise<PipelineResult> {
    const pipelineStart = Date.now();

    this.logger.info('Starting pipeline execution', {
      operation: 'pipeline.execute.start',
      module: 'MessagePipeline',
      pipeline: this.pipelineName,
      messageId: context.message.id,
      accountId: context.accountId,
      projectId: context.projectId,
      stepCount: this.steps.length,
    });

    let currentContext = context;
    let lastResult: PipelineResult | null = null;

    // Execute steps sequentially
    for (const step of this.steps) {
      const stepStart = Date.now();

      try {
        this.logger.debug('Executing pipeline step', {
          operation: 'pipeline.step.start',
          module: 'MessagePipeline',
          pipeline: this.pipelineName,
          step: step.name,
          messageId: currentContext.message.id,
        });

        // Execute the step
        const result = await step.execute(currentContext);

        // Record execution in history
        const stepDuration = Date.now() - stepStart;
        currentContext.executionHistory.push({
          stepName: step.name,
          startedAt: new Date(stepStart),
          completedAt: new Date(),
          durationMs: stepDuration,
          continued: result.shouldContinue,
          stopReason: result.reason,
        });

        this.logger.debug('Pipeline step completed', {
          operation: 'pipeline.step.completed',
          module: 'MessagePipeline',
          pipeline: this.pipelineName,
          step: step.name,
          shouldContinue: result.shouldContinue,
          durationMs: stepDuration,
          reason: result.reason,
        });

        // Update context for next step
        currentContext = result.context;
        lastResult = result;

        // Stop if step decided to halt pipeline
        if (!result.shouldContinue) {
          this.logger.info('Pipeline stopped by step', {
            operation: 'pipeline.execute.stopped',
            module: 'MessagePipeline',
            pipeline: this.pipelineName,
            step: step.name,
            reason: result.reason,
            totalDurationMs: Date.now() - pipelineStart,
            stepsExecuted: currentContext.executionHistory.length,
          });

          return result;
        }
      } catch (error) {
        const stepDuration = Date.now() - stepStart;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        // Record error in history
        currentContext.executionHistory.push({
          stepName: step.name,
          startedAt: new Date(stepStart),
          completedAt: new Date(),
          durationMs: stepDuration,
          continued: false,
          error: errorMessage,
        });

        this.logger.error(
          'Pipeline step failed',
          error instanceof Error ? error : new Error(String(error)),
          {
            operation: 'pipeline.step.error',
            module: 'MessagePipeline',
            pipeline: this.pipelineName,
            step: step.name,
            messageId: currentContext.message.id,
            durationMs: stepDuration,
          }
        );

        // Return failure result
        return {
          shouldContinue: false,
          context: currentContext,
          reason: `Step "${step.name}" failed: ${errorMessage}`,
        };
      }
    }

    // All steps completed successfully
    const totalDuration = Date.now() - pipelineStart;

    this.logger.info('Pipeline completed successfully', {
      operation: 'pipeline.execute.completed',
      module: 'MessagePipeline',
      pipeline: this.pipelineName,
      messageId: currentContext.message.id,
      totalDurationMs: totalDuration,
      stepsExecuted: currentContext.executionHistory.length,
    });

    // Return last result (from final step)
    return (
      lastResult || {
        shouldContinue: true,
        context: currentContext,
      }
    );
  }

  /**
   * Get pipeline steps
   */
  getSteps(): ReadonlyArray<IMessagePipelineStep> {
    return this.steps;
  }

  /**
   * Get pipeline name
   */
  getName(): string {
    return this.pipelineName;
  }
}
