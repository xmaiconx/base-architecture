import type { SendEmailPayload } from '../types/SendEmailPayload';
import type { HandlerContext } from '../types/HandlerContext';

/**
 * Pure handler for sending emails
 * Uses context injection instead of NestJS DI
 * @param payload Email data (plain or template-based)
 * @param context Handler context with injected services
 */
export async function sendEmailHandler(
  payload: SendEmailPayload,
  context: HandlerContext
): Promise<void> {
  const { emailService, logger, config } = context;

  try {
    // Validate payload
    if (!payload.to || !payload.to.includes('@')) {
      throw new Error('Invalid recipient email address');
    }

    logger.info('Processing email send request', {
      type: payload.type,
      to: payload.to,
      handler: 'sendEmailHandler',
    });

    if (payload.type === 'SEND_EMAIL') {
      // Plain email
      if (!payload.subject || !payload.body) {
        throw new Error('Subject and body are required for plain email');
      }

      await emailService.sendEmail(payload.to, payload.subject, payload.body);

      logger.info('Plain email sent successfully', {
        to: payload.to,
        subject: payload.subject,
      });
    } else if (payload.type === 'SEND_EMAIL_TEMPLATE') {
      // Template-based email
      if (!payload.templateId || !payload.variables) {
        throw new Error(
          'Template ID and variables are required for template email'
        );
      }

      await emailService.sendEmailTemplate(
        payload.to,
        payload.templateId,
        payload.variables
      );

      logger.info('Template email sent successfully', {
        to: payload.to,
        templateId: payload.templateId,
      });
    } else {
      throw new Error(`Unknown email type: ${(payload as any).type}`);
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('Failed to send email', error, {
      type: payload.type,
      to: payload.to,
    });
    throw error;
  }
}
