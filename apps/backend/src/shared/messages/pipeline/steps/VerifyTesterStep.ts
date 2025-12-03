import { Inject, Injectable } from '@nestjs/common';
import { ILoggerService, IMessagePipelineStep } from '@fnd/backend';
import { MessageContext, PipelineResult, ProjectStatus } from '@fnd/domain';

/**
 * Verify Tester Step
 *
 * Project-specific step for projects in testing mode.
 * Verifies if the sender is an authorized tester.
 *
 * Behavior:
 * - Checks if project is in TESTING status
 * - If in testing, verifies sender against allowed testers list
 * - Stops pipeline if sender is not a tester
 * - Adds tester info to context
 *
 * Configuration (from project settings):
 * - testing.enabled: boolean
 * - testing.allowedTesters: string[] (phone numbers or user IDs)
 * - testing.testModeMessage: string (message shown to non-testers)
 *
 * Use Case:
 * - Law office bot in testing before full deployment
 * - Limited access to specific testers only
 */
@Injectable()
export class VerifyTesterStep implements IMessagePipelineStep {
  readonly name = 'verify-tester';

  constructor(
    @Inject('ILoggerService') private readonly logger: ILoggerService
  ) {}

  async execute(context: MessageContext): Promise<PipelineResult> {
    this.logger.debug('Verifying tester access', {
      operation: 'pipeline.step.verify_tester',
      module: 'VerifyTesterStep',
      messageId: context.message.id,
      projectStatus: context.metadata.project?.status,
    });

    // Get project from context
    const project = context.metadata.project;

    if (!project) {
      this.logger.warn('Project not found in context', {
        operation: 'pipeline.step.verify_tester.no_project',
      });

      return {
        shouldContinue: false,
        context,
        reason: 'Project information missing',
      };
    }

    // Check if project is in testing mode
    const isTestingMode =
      project.status === ProjectStatus.TESTING ||
      project.settings?.testing?.enabled === true;

    if (!isTestingMode) {
      // Not in testing mode, skip verification
      this.logger.debug('Project not in testing mode, skipping tester check', {
        operation: 'pipeline.step.verify_tester.not_testing',
        projectStatus: project.status,
      });

      return {
        shouldContinue: true,
        context,
      };
    }

    // Project is in testing mode - verify tester
    const allowedTesters = project.settings?.testing?.allowedTesters ?? [];

    if (allowedTesters.length === 0) {
      this.logger.warn('Testing mode enabled but no testers configured', {
        operation: 'pipeline.step.verify_tester.no_testers',
        projectId: context.projectId,
      });

      // No testers configured - deny all access
      return {
        shouldContinue: false,
        context,
        reason: 'Testing mode is active but no testers are configured',
      };
    }

    // Check if sender is in allowed testers
    const sender = context.message.metadata.from;
    const senderId = sender.id;
    const senderPhone = sender.phone;

    const isTester =
      allowedTesters.includes(senderId) ||
      (senderPhone && allowedTesters.includes(senderPhone));

    if (!isTester) {
      this.logger.info('Sender is not an authorized tester', {
        operation: 'pipeline.step.verify_tester.not_authorized',
        senderId,
        senderPhone,
        projectId: context.projectId,
      });

      // Get test mode message or use default
      const testModeMessage =
        project.settings?.testing?.testModeMessage ??
        'This bot is currently in testing mode and not available for general use.';

      // Add test mode response to context
      context.metadata.aiResponse = {
        text: testModeMessage,
        reason: 'testing_mode',
      };

      // Send the test mode message but stop further processing
      // (SendResponseStep will send the test mode message)
      return {
        shouldContinue: false,
        context,
        reason: 'Sender is not an authorized tester',
        stepMetadata: {
          testModeMessage,
        },
      };
    }

    // Sender is an authorized tester
    this.logger.info('Authorized tester verified', {
      operation: 'pipeline.step.verify_tester.authorized',
      senderId,
      projectId: context.projectId,
    });

    context.metadata.isTester = true;

    return {
      shouldContinue: true,
      context,
      stepMetadata: {
        isTester: true,
      },
    };
  }
}
