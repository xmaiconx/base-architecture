import { Resend } from 'resend';
import type { IEmailService } from '@fnd/backend';
import type { IConfigurationService } from '@fnd/backend';
import type { ILoggerService } from '@fnd/backend';

/**
 * Simple email service for serverless workers
 * Direct Resend integration without queue dependencies
 */
export class SimpleEmailService implements IEmailService {
  private resend: Resend;

  constructor(
    private readonly config: IConfigurationService,
    private readonly logger: ILoggerService
  ) {
    const apiKey = this.config.getResendApiKey();
    this.resend = new Resend(apiKey);
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    try {
      const from = this.config.getResendFromEmail();

      await this.resend.emails.send({
        from,
        to,
        subject,
        html: body,
      });

      this.logger.info('Email sent successfully', {
        to,
        subject,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error('Failed to send email', error, { to });
      throw error;
    }
  }

  async sendEmailTemplate(to: string, templateId: string, variables: Record<string, any>): Promise<void> {
    try {
      // Resend doesn't have built-in template support
      // For now, we'll throw an error - implement template engine later
      throw new Error(
        'Template email not yet supported in SimpleEmailService. Use sendEmail with pre-rendered HTML.'
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error('Failed to send template email', error, {
        to,
        templateId,
      });
      throw error;
    }
  }
}
