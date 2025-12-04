/**
 * Send Email Payload - supports plain email or template-based email
 */
export type SendEmailPayload =
  | {
      type: 'SEND_EMAIL';
      to: string;
      subject: string;
      body: string;
      from?: string;
      replyTo?: string;
    }
  | {
      type: 'SEND_EMAIL_TEMPLATE';
      to: string;
      templateId: string;
      variables: Record<string, string>;
      from?: string;
      replyTo?: string;
    };
