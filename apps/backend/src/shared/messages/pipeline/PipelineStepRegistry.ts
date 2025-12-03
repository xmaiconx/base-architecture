import { Injectable } from '@nestjs/common';
import { IMessagePipelineStep, IPipelineStepRegistry } from '@fnd/backend';

/**
 * Pipeline Step Registry
 *
 * Centralized registry for all available pipeline steps.
 * Allows dynamic composition of pipelines by step name.
 *
 * Pattern: Registry Pattern (Service Locator)
 *
 * Usage:
 * ```typescript
 * registry.register('save-message', saveMessageStep);
 * registry.register('verify-project', verifyProjectStep);
 *
 * const step = registry.get('save-message');
 * ```
 */
@Injectable()
export class PipelineStepRegistry implements IPipelineStepRegistry {
  private readonly steps = new Map<string, IMessagePipelineStep>();

  /**
   * Register a step with unique name
   *
   * @throws Error if step with same name already registered
   */
  register(name: string, step: IMessagePipelineStep): void {
    if (this.steps.has(name)) {
      throw new Error(
        `Pipeline step "${name}" is already registered. ` +
          `Each step must have a unique name.`
      );
    }

    this.steps.set(name, step);
  }

  /**
   * Get a registered step by name
   *
   * @throws Error if step not found
   */
  get(name: string): IMessagePipelineStep {
    const step = this.steps.get(name);

    if (!step) {
      const availableSteps = Array.from(this.steps.keys()).join(', ');
      throw new Error(
        `Pipeline step "${name}" not found. ` +
          `Available steps: ${availableSteps || 'none'}`
      );
    }

    return step;
  }

  /**
   * Check if step is registered
   */
  has(name: string): boolean {
    return this.steps.has(name);
  }

  /**
   * Get all registered step names
   */
  getRegisteredSteps(): string[] {
    return Array.from(this.steps.keys());
  }

  /**
   * Clear all registered steps (for testing)
   */
  clear(): void {
    this.steps.clear();
  }
}
