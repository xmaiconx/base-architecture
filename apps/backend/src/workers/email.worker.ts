import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { IJobQueue, ILoggerService } from '@fnd/backend';
import { IEmailService, SendEmailCommand, SendEmailTemplateCommand, QUEUE_COMMANDS } from '@fnd/backend';

@Injectable()
export class EmailWorker implements OnModuleInit {
  constructor(
    @Inject('IJobQueue') private readonly jobQueue: IJobQueue,
    @Inject('IEmailService') private readonly emailService: IEmailService,
    @Inject('ILoggerService') private readonly logger: ILoggerService,
  ) {}

  async onModuleInit() {
    await this.jobQueue.process(QUEUE_COMMANDS.SEND_EMAIL, this.handleSendEmail.bind(this));
    await this.jobQueue.process(QUEUE_COMMANDS.SEND_EMAIL_TEMPLATE, this.handleSendEmailTemplate.bind(this));
  }

  private async handleSendEmail(command: SendEmailCommand) {
    try {
      this.logger.info('Processing send email job', {
        operation: 'email.send',
        module: 'EmailWorker',
        recipientEmail: command.to,
      });

      await this.emailService.sendEmail(command.to, command.subject, command.body);

      this.logger.info('Email sent successfully', {
        operation: 'email.send.success',
        module: 'EmailWorker',
        recipientEmail: command.to,
      });
    } catch (error) {
      this.logger.error('Failed to send email', error as Error, {
        operation: 'email.send.error',
        module: 'EmailWorker',
        recipientEmail: command.to,
        errorObject: error,
      });
      throw error;
    }
  }

  private async handleSendEmailTemplate(command: SendEmailTemplateCommand) {
    try {
      this.logger.info('Processing send email template job', {
        operation: 'email.send.template',
        module: 'EmailWorker',
        recipientEmail: command.to,
        templateId: command.templateId,
      });

      await this.emailService.sendEmailTemplate(command.to, command.templateId, command.variables);

      this.logger.info('Email template sent successfully', {
        operation: 'email.send.template.success',
        module: 'EmailWorker',
        recipientEmail: command.to,
        templateId: command.templateId,
      });
    } catch (error) {
      this.logger.error('Failed to send email template', error as Error, {
        operation: 'email.send.template.error',
        module: 'EmailWorker',
        recipientEmail: command.to,
        templateId: command.templateId,
        errorObject: error,
      });
      throw error;
    }
  }
}