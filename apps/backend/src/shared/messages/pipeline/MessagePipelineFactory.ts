import { Inject, Injectable } from '@nestjs/common';
import { ILoggerService, IMessagePipeline } from '@fnd/backend';
import { MessagePipeline } from './MessagePipeline';
import { PipelineStepRegistry } from './PipelineStepRegistry';

/**
 * Pipeline Execution Mode
 *
 * - PRE_BUFFER: Fast path before buffering (default for webhooks)
 * - POST_BUFFER: Full processing after buffer timeout (triggered by worker)
 * - FULL: Complete pipeline without buffer splitting (single pipeline projects)
 */
export type PipelineMode = 'PRE_BUFFER' | 'POST_BUFFER' | 'FULL';

/**
 * Message Pipeline Factory
 *
 * Creates pipelines configured for specific project types.
 *
 * Pattern: Factory Pattern + Strategy Pattern
 *
 * Responsibilities:
 * - Create pipeline instances with appropriate steps
 * - Map project types to pipeline configurations
 * - Support both hardcoded and dynamic pipeline creation
 * - Support different execution modes (PRE_BUFFER, POST_BUFFER, FULL)
 *
 * Future Enhancement: Load pipeline configurations from database
 */
@Injectable()
export class MessagePipelineFactory {
  constructor(
    @Inject('ILoggerService') private readonly logger: ILoggerService,
    private readonly stepRegistry: PipelineStepRegistry
  ) {}

  /**
   * Create a pipeline for a specific project type
   *
   * @param projectType - Project type identifier (e.g., "mercado-phone", "law-office")
   * @param mode - Pipeline execution mode (PRE_BUFFER, POST_BUFFER, FULL)
   * @returns Configured pipeline instance
   */
  createPipeline(
    projectType: string,
    mode: PipelineMode = 'PRE_BUFFER',
  ): IMessagePipeline {
    this.logger.debug('Creating pipeline for project type', {
      operation: 'pipeline.factory.create',
      module: 'MessagePipelineFactory',
      projectType,
      mode,
    });

    switch (projectType) {
      case 'mp-my-iablue':
        return this.createMpMyIabluePipeline(mode);

      case 'mercado-phone':
        return this.createMercadoPhonePipeline(mode);

      case 'law-office':
        return this.createLawOfficePipeline(mode);

      case 'default':
      case 'basic':
        return this.createDefaultPipeline(mode);

      default:
        this.logger.warn('Unknown project type, using default pipeline', {
          operation: 'pipeline.factory.unknown_type',
          module: 'MessagePipelineFactory',
          projectType,
        });
        return this.createDefaultPipeline(mode);
    }
  }

  /**
   * Create pipeline by explicit step names
   *
   * Useful for custom pipelines or testing
   *
   * @param pipelineName - Name for the pipeline
   * @param stepNames - Array of step names (in execution order)
   * @returns Configured pipeline instance
   */
  createCustomPipeline(
    pipelineName: string,
    stepNames: string[]
  ): IMessagePipeline {
    const steps = stepNames.map(name => this.stepRegistry.get(name));

    return new MessagePipeline(this.logger, pipelineName, steps);
  }

  // ==================== Predefined Pipeline Configurations ====================

  /**
   * MP My IABlue Pipeline
   *
   * Customized pipeline for mp-my-iablue project with dual pipeline support.
   *
   * PRE_BUFFER Mode (Fast Path):
   * 1. Save message
   * 2. Verify project active
   * 3. Verify authorized sender (IABlue API + whitelist)
   * 4. Check command (IABlue-specific commands) → stops if command
   * 5. Add to buffer → STOPS pipeline
   *
   * POST_BUFFER Mode (Full Processing):
   * 1. Load buffered messages
   * 2. Convert media to text
   * 3. Generate AI response (IABlue agent)
   * 4. Send response
   * 5. Clear buffer
   *
   * FULL Mode (No Buffering):
   * All steps executed sequentially
   */
  private createMpMyIabluePipeline(mode: PipelineMode): IMessagePipeline {
    if (mode === 'PRE_BUFFER') {
      const stepNames = [
        'save-message',                                    // Persist message
        'verify-project-active',                           // Check project status
        'mp-my-iablue:verify-authorized-sender',          // Custom authorization
        'mp-my-iablue:check-command',                     // Custom commands (stops if command)
        'add-to-buffer',                                   // Buffer and stop
      ];

      return this.createCustomPipeline('mp-my-iablue-pre-buffer', stepNames);
    }

    if (mode === 'POST_BUFFER') {
      const stepNames = [
        'load-buffered-messages',                          // Load from Redis
        'convert-media-to-text',                          // Transcribe media
        'mp-my-iablue:generate-ai-response',              // Custom AI agent
        'send-response',                                   // Send reply
        'clear-buffer',                                    // Cleanup Redis
      ];

      return this.createCustomPipeline('mp-my-iablue-post-buffer', stepNames);
    }

    // FULL mode: complete pipeline without buffer splitting
    const stepNames = [
      'save-message',
      'verify-project-active',
      'mp-my-iablue:verify-authorized-sender',
      'mp-my-iablue:check-command',
      'convert-media-to-text',
      'mp-my-iablue:generate-ai-response',
      'send-response',
    ];

    return this.createCustomPipeline('mp-my-iablue-full', stepNames);
  }

  /**
   * Mercado Phone Pipeline
   *
   * Uses FULL mode by default (single pipeline, no buffer splitting)
   *
   * Steps:
   * 1. Save message
   * 2. Verify project active
   * 3. Verify authorized sender (Mercado Phone specific)
   * 4. Check command
   * 5. Add to buffer (configurable, may continue or stop)
   * 6. Load buffered messages (if buffered)
   * 7. Convert media to text
   * 8. Generate AI response
   * 9. Send response
   * 10. Clear buffer
   */
  private createMercadoPhonePipeline(mode: PipelineMode): IMessagePipeline {
    // Mercado Phone uses FULL mode (single pipeline)
    const stepNames = [
      'save-message',
      'verify-project-active',
      'verify-authorized-sender', // Mercado Phone specific
      'check-command',
      'add-to-buffer',            // May stop or continue based on config
      'load-buffered-messages',   // Load if buffered
      'convert-media-to-text',
      'generate-ai-response',
      'send-response',
      'clear-buffer',
    ];

    return this.createCustomPipeline('mercado-phone-v1', stepNames);
  }

  /**
   * Law Office Pipeline
   *
   * Uses FULL mode (single pipeline, buffer optional via config)
   *
   * Steps:
   * 1. Save message
   * 2. Verify project active
   * 3. Verify tester (if in testing mode)
   * 4. Check command
   * 5. Add to buffer (optional)
   * 6. Load buffered messages (if buffered)
   * 7. Convert media to text
   * 8. Generate AI response
   * 9. Send response
   * 10. Clear buffer
   */
  private createLawOfficePipeline(mode: PipelineMode): IMessagePipeline {
    // Law Office uses FULL mode (single pipeline)
    const stepNames = [
      'save-message',
      'verify-project-active',
      'verify-tester', // Law office specific (testing mode)
      'check-command',
      'add-to-buffer',            // Optional, configurable
      'load-buffered-messages',
      'convert-media-to-text',
      'generate-ai-response',
      'send-response',
      'clear-buffer',
    ];

    return this.createCustomPipeline('law-office-v1', stepNames);
  }

  /**
   * Default Basic Pipeline
   *
   * Minimal pipeline for simple message processing with optional buffering
   *
   * Steps:
   * 1. Save message
   * 2. Verify project active
   * 3. Add to buffer (optional, configurable)
   * 4. Load buffered messages (if buffered)
   * 5. Generate AI response
   * 6. Send response
   * 7. Clear buffer
   */
  private createDefaultPipeline(mode: PipelineMode): IMessagePipeline {
    const stepNames = [
      'save-message',
      'verify-project-active',
      'add-to-buffer',            // Optional, based on project config
      'load-buffered-messages',   // Load if buffered
      'generate-ai-response',
      'send-response',
      'clear-buffer',
    ];

    return this.createCustomPipeline('default-v1', stepNames);
  }
}
