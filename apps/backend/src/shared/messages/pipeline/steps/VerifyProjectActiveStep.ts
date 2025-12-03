import { Inject, Injectable } from '@nestjs/common';
import { ILoggerService, IMessagePipelineStep } from '@fnd/backend';
import { MessageContext, PipelineResult, ProjectStatus } from '@fnd/domain';

/**
 * Verify Project Active Step
 *
 * Checks if the project is active and can process messages.
 *
 * Behavior:
 * - Loads project from database
 * - Checks project status
 * - Stops pipeline if project is not active
 * - Adds project to context for downstream steps
 *
 * Stop Conditions:
 * - Project not found
 * - Project status is INACTIVE or ARCHIVED
 *
 * TODO: Create IProjectRepository and implement
 */
@Injectable()
export class VerifyProjectActiveStep implements IMessagePipelineStep {
  readonly name = 'verify-project-active';

  constructor(
    @Inject('ILoggerService') private readonly logger: ILoggerService
    // TODO: Inject IProjectRepository when created
    // @Inject('IProjectRepository') private readonly projectRepository: IProjectRepository
  ) {}

  async execute(context: MessageContext): Promise<PipelineResult> {
    this.logger.debug('Verifying project is active', {
      operation: 'pipeline.step.verify_project_active',
      module: 'VerifyProjectActiveStep',
      projectId: context.projectId,
      accountId: context.accountId,
    });

    // Require projectId in context
    if (!context.projectId) {
      this.logger.warn('Project ID missing from context', {
        operation: 'pipeline.step.verify_project_active.missing_project_id',
        module: 'VerifyProjectActiveStep',
        messageId: context.message.id,
      });

      return {
        shouldContinue: false,
        context,
        reason: 'Project ID is required',
      };
    }

    try {
      // TODO: Load project from database
      // const project = await this.projectRepository.findById(
      //   context.projectId,
      //   context.accountId
      // );
      //
      // if (!project) {
      //   this.logger.warn('Project not found', {
      //     operation: 'pipeline.step.verify_project_active.not_found',
      //     projectId: context.projectId,
      //     accountId: context.accountId,
      //   });
      //
      //   return {
      //     shouldContinue: false,
      //     context,
      //     reason: 'Project not found',
      //   };
      // }
      //
      // // Check if project is active
      // if (
      //   project.status === ProjectStatus.INACTIVE ||
      //   project.status === ProjectStatus.ARCHIVED
      // ) {
      //   this.logger.info('Project is not active', {
      //     operation: 'pipeline.step.verify_project_active.inactive',
      //     projectId: context.projectId,
      //     projectStatus: project.status,
      //   });
      //
      //   return {
      //     shouldContinue: false,
      //     context,
      //     reason: `Project is ${project.status}`,
      //   };
      // }
      //
      // // Add project to context
      // context.metadata.project = project;

      // Temporary: simulate project check
      this.logger.info('Project verification placeholder executed', {
        operation: 'pipeline.step.verify_project_active.placeholder',
        projectId: context.projectId,
      });

      // Mock project data
      context.metadata.project = {
        id: context.projectId,
        status: ProjectStatus.ACTIVE,
        name: 'Mock Project',
      };

      return {
        shouldContinue: true,
        context,
      };
    } catch (error) {
      this.logger.error(
        'Failed to verify project status',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'pipeline.step.verify_project_active.error',
          module: 'VerifyProjectActiveStep',
          projectId: context.projectId,
        }
      );

      return {
        shouldContinue: false,
        context,
        reason: 'Failed to verify project status',
      };
    }
  }
}
