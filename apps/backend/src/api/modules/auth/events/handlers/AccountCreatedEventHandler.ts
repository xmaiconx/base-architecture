import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { AccountCreatedEvent } from '../AccountCreatedEvent';
import { IEmailQueueService } from '@fnd/backend';
import { ILoggerService, IConfigurationService } from '@fnd/backend';

@EventsHandler(AccountCreatedEvent)
export class AccountCreatedEventHandler implements IEventHandler<AccountCreatedEvent> {
  constructor(
    @Inject('IEmailQueueService') private readonly emailQueueService: IEmailQueueService,
    @Inject('ILoggerService') private readonly logger: ILoggerService,
    @Inject('IConfigurationService') private readonly configurationService: IConfigurationService,
  ) {}

  async handle(event: AccountCreatedEvent): Promise<void> {
    this.logger.info('Processing AccountCreatedEvent', {
      operation: 'auth.account_created.start',
      module: 'AccountCreatedEventHandler',
      accountId: event.accountId,
      userId: event.userId,
      email: event.userEmail,
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

      this.logger.info('Email confirmation queued successfully', {
        operation: 'auth.account_created.email_queued',
        module: 'AccountCreatedEventHandler',
        accountId: event.accountId,
        userId: event.userId,
        email: event.userEmail,
      });
    } catch (error) {
      this.logger.error('Failed to queue email confirmation', error instanceof Error ? error : new Error(String(error)), {
        operation: 'auth.account_created.email_failed',
        module: 'AccountCreatedEventHandler',
        accountId: event.accountId,
        userId: event.userId,
        email: event.userEmail,
      });
      throw error;
    }
  }
}