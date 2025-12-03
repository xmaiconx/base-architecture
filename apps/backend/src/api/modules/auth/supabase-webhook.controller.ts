import { Controller, Post, Body, Headers, BadRequestException, Inject } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ISupabaseService, ILoggerService } from '@fnd/backend';
import { CompleteSignUpCommand } from './commands/CompleteSignUpCommand';

/**
 * Supabase Webhook Controller
 *
 * Receives webhooks from Supabase Auth when users are created/updated.
 * Endpoint is configured in Supabase dashboard: API_BASE_URL/webhooks/supabase/auth
 *
 * Flow:
 * 1. Frontend calls supabase.auth.signUp()
 * 2. Supabase creates auth.users
 * 3. Supabase sends webhook → this controller
 * 4. Controller validates signature
 * 5. Controller dispatches CompleteSignUpCommand
 * 6. Account/Workspace/User created
 * 7. Return 200 OK (webhook acknowledgment)
 *
 * Security: Webhook signature validated using SUPABASE_WEBHOOK_SECRET
 */
@Controller('webhooks/supabase')
export class SupabaseWebhookController {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject('ISupabaseService') private readonly supabaseService: ISupabaseService,
    @Inject('ILoggerService') private readonly logger: ILoggerService,
  ) {}

  /**
   * Handle Supabase Auth webhooks
   *
   * POST /webhooks/supabase/auth
   *
   * Payload structure (from Supabase):
   * {
   *   type: 'INSERT' | 'UPDATE' | 'DELETE',
   *   table: 'users',
   *   record: {
   *     id: 'uuid', // auth.users.id
   *     email: 'user@example.com',
   *     email_confirmed_at: '2025-12-03T10:00:00Z',
   *     user_metadata: {
   *       full_name: 'John Doe'
   *     }
   *   },
   *   old_record: null
   * }
   */
  @Post('auth')
  async handleAuthWebhook(
    @Body() payload: any,
    @Headers('x-supabase-signature') signature: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.info('Received Supabase auth webhook', {
      operation: 'webhooks.supabase.auth.received',
      module: 'SupabaseWebhookController',
      type: payload?.type,
      table: payload?.table,
    });

    // 1. Validate webhook signature
    if (!signature) {
      this.logger.warn('Missing webhook signature', {
        operation: 'webhooks.supabase.auth.missing_signature',
        module: 'SupabaseWebhookController',
      });
      throw new BadRequestException('Missing webhook signature');
    }

    const payloadString = JSON.stringify(payload);
    const isValidSignature = this.supabaseService.verifyWebhookSignature(
      payloadString,
      signature,
    );

    if (!isValidSignature) {
      const err = new Error('Invalid webhook signature');
      this.logger.error('Invalid webhook signature', err, {
        operation: 'webhooks.supabase.auth.invalid_signature',
        module: 'SupabaseWebhookController',
      });
      throw new BadRequestException('Invalid webhook signature');
    }

    // 2. Validate payload structure
    if (!payload || !payload.type || !payload.record) {
      const err = new Error('Invalid webhook payload structure');
      this.logger.error('Invalid webhook payload structure', err, {
        operation: 'webhooks.supabase.auth.invalid_payload',
        module: 'SupabaseWebhookController',
        payload,
      });
      throw new BadRequestException('Invalid webhook payload');
    }

    const { type, record } = payload;

    // 3. Handle INSERT event (new user created)
    if (type === 'INSERT' && record.id && record.email) {
      const authUserId = record.id;
      const email = record.email;
      const fullName = record.user_metadata?.full_name || email.split('@')[0]; // Fallback to email username

      this.logger.info('Processing user.created webhook', {
        operation: 'webhooks.supabase.auth.user_created',
        module: 'SupabaseWebhookController',
        authUserId,
        email,
      });

      try {
        // Dispatch CompleteSignUpCommand (creates Account/Workspace/User)
        await this.commandBus.execute(new CompleteSignUpCommand(authUserId, email, fullName));

        this.logger.info('CompleteSignUp command executed successfully', {
          operation: 'webhooks.supabase.auth.signup_completed',
          module: 'SupabaseWebhookController',
          authUserId,
          email,
        });

        return { success: true, message: 'User created successfully' };
      } catch (error) {
        this.logger.error('Error executing CompleteSignUpCommand', error instanceof Error ? error : new Error(String(error)), {
          operation: 'webhooks.supabase.auth.signup_failed',
          module: 'SupabaseWebhookController',
          authUserId,
          email,
        });

        // Return 500 to trigger Supabase webhook retry
        throw error;
      }
    }

    // 4. Handle UPDATE event (user updated - e.g., email confirmed)
    if (type === 'UPDATE' && record.id) {
      const authUserId = record.id;
      const emailConfirmedAt = record.email_confirmed_at;

      // Check if email was just confirmed (old_record.email_confirmed_at was null)
      if (emailConfirmedAt && !payload.old_record?.email_confirmed_at) {
        this.logger.info('User email confirmed', {
          operation: 'webhooks.supabase.auth.email_confirmed',
          module: 'SupabaseWebhookController',
          authUserId,
          confirmedAt: emailConfirmedAt,
        });

        // TODO: Publish EmailConfirmedEvent for audit logs
        // For now, just log. Event handler can be added in Phase 3.
      }

      return { success: true, message: 'User update processed' };
    }

    // 5. Handle other events (DELETE, etc.)
    this.logger.info('Webhook event ignored (not handled)', {
      operation: 'webhooks.supabase.auth.ignored',
      module: 'SupabaseWebhookController',
      type,
    });

    return { success: true, message: 'Event acknowledged but not processed' };
  }
}
