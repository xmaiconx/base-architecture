import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ConfirmationEmailResentEvent } from '../ConfirmationEmailResentEvent';
import { IEmailQueueService } from '@fnd/backend';
import { ILoggerService, IConfigurationService } from '@fnd/backend';

@EventsHandler(ConfirmationEmailResentEvent)
export class ConfirmationEmailResentEventHandler implements IEventHandler<ConfirmationEmailResentEvent> {
  constructor(
    @Inject('IEmailQueueService') private readonly emailQueueService: IEmailQueueService,
    @Inject('ILoggerService') private readonly logger: ILoggerService,
    @Inject('IConfigurationService') private readonly configurationService: IConfigurationService,
  ) {}

  async handle(event: ConfirmationEmailResentEvent): Promise<void> {
    this.logger.info('Processing ConfirmationEmailResentEvent', {
      operation: 'auth.confirmation_resent.start',
      module: 'ConfirmationEmailResentEventHandler',
      userId: event.userId,
      email: event.userEmail,
      wasTokenRenewed: event.wasTokenRenewed,
    });

    try {
      await this.emailQueueService.sendEmailTemplateAsync({
        to: event.userEmail,
        templateId: 'email-confirmation',
        variables: {
          name: event.userFullName,
          confirmationUrl: `${this.configurationService.getFrontendUrl()}/confirm-email?token=${event.emailVerificationToken}`,
        },
      });

      this.logger.info('Confirmation email resent successfully', {
        operation: 'auth.confirmation_resent.email_queued',
        module: 'ConfirmationEmailResentEventHandler',
        userId: event.userId,
        email: event.userEmail,
        wasTokenRenewed: event.wasTokenRenewed,
      });
    } catch (error) {
      this.logger.error('Failed to resend confirmation email', error instanceof Error ? error : new Error(String(error)), {
        operation: 'auth.confirmation_resent.email_failed',
        module: 'ConfirmationEmailResentEventHandler',
        userId: event.userId,
        email: event.userEmail,
      });
      throw error;
    }
  }
}