import { Inject, Injectable } from '@nestjs/common';
import { ILoggerService, IMessagePipelineStep } from '@fnd/backend';
import { MessageContext, PipelineResult } from '@fnd/domain';

/**
 * Verify Authorized Sender Step
 *
 * Project-specific step for Mercado Phone.
 * Verifies if the sender is authorized to send messages by checking
 * with an external authorization service.
 *
 * Behavior:
 * - Extracts sender phone number
 * - Calls external auth URL (configured in project settings)
 * - Checks if sender is linked to a valid company
 * - Stops pipeline if sender is not authorized
 * - Adds authorization info to context
 *
 * Configuration (from project settings):
 * - authorization.enabled: boolean
 * - authorization.externalAuthUrl: string (e.g., Mercado Phone API)
 * - authorization.requireVerification: boolean
 *
 * TODO: Implement HTTP client for external auth service
 */
@Injectable()
export class VerifyAuthorizedSenderStep implements IMessagePipelineStep {
  readonly name = 'verify-authorized-sender';

  constructor(
    @Inject('ILoggerService') private readonly logger: ILoggerService
    // TODO: Inject HTTP client service
    // @Inject('HttpService') private readonly httpService: HttpService
  ) {}

  async execute(context: MessageContext): Promise<PipelineResult> {
    this.logger.debug('Verifying sender authorization', {
      operation: 'pipeline.step.verify_authorized_sender',
      module: 'VerifyAuthorizedSenderStep',
      messageId: context.message.id,
      senderId: context.message.metadata.from.id,
    });

    // Check if authorization is enabled
    const authEnabled =
      context.metadata.project?.settings?.authorization?.enabled ?? false;

    if (!authEnabled) {
      this.logger.debug('Authorization check disabled', {
        operation: 'pipeline.step.verify_authorized_sender.disabled',
      });

      return {
        shouldContinue: true,
        context,
      };
    }

    try {
      const sender = context.message.metadata.from;
      const senderPhone = sender.phone;

      if (!senderPhone) {
        this.logger.warn('Sender phone not available for authorization', {
          operation: 'pipeline.step.verify_authorized_sender.no_phone',
          senderId: sender.id,
        });

        return {
          shouldContinue: false,
          context,
          reason: 'Sender phone number is required for authorization',
        };
      }

      // Get external auth URL
      const authUrl =
        context.metadata.project?.settings?.authorization?.externalAuthUrl;

      if (!authUrl) {
        this.logger.error(
          'External auth URL not configured',
          undefined,
          {
            operation: 'pipeline.step.verify_authorized_sender.no_auth_url',
            projectId: context.projectId,
          }
        );

        // If auth is enabled but URL is not configured, fail safely
        return {
          shouldContinue: false,
          context,
          reason: 'Authorization is enabled but external auth URL is not configured',
        };
      }

      // TODO: Call external authorization service
      // const response = await this.httpService.post(authUrl, {
      //   phone: senderPhone,
      //   projectId: context.projectId,
      // });
      //
      // const authData = response.data;
      //
      // if (!authData.authorized) {
      //   this.logger.info('Sender not authorized', {
      //     operation: 'pipeline.step.verify_authorized_sender.not_authorized',
      //     senderId: sender.id,
      //     senderPhone,
      //   });
      //
      //   return {
      //     shouldContinue: false,
      //     context,
      //     reason: 'Sender is not authorized to send messages',
      //   };
      // }
      //
      // // Add authorization info to context
      // context.metadata.senderAuthorization = {
      //   authorized: true,
      //   companyId: authData.companyId,
      //   companyName: authData.companyName,
      // };

      // Temporary placeholder
      this.logger.info('Sender authorization placeholder', {
        operation: 'pipeline.step.verify_authorized_sender.placeholder',
        senderPhone,
        authUrl,
      });

      // Mock authorization
      context.metadata.senderAuthorization = {
        authorized: true,
        companyId: 'mock-company-123',
        companyName: 'Mock Company Name',
      };

      return {
        shouldContinue: true,
        context,
        stepMetadata: {
          companyId: context.metadata.senderAuthorization.companyId,
        },
      };
    } catch (error) {
      this.logger.error(
        'Failed to verify sender authorization',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'pipeline.step.verify_authorized_sender.error',
          module: 'VerifyAuthorizedSenderStep',
          messageId: context.message.id,
        }
      );

      // Fail safely: if auth check fails, deny access
      return {
        shouldContinue: false,
        context,
        reason: 'Authorization check failed',
        stepMetadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }
}
