import { Injectable, UnauthorizedException, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { ISupabaseService, SupabaseUser, IConfigurationService, ILoggerService } from '@fnd/backend';
import * as crypto from 'crypto';

/**
 * Supabase Service Implementation
 *
 * Wraps @supabase/supabase-js SDK to provide:
 * - Token validation (getUser)
 * - Admin operations (getUserById, listUsers)
 * - Webhook signature verification
 *
 * Uses secret key for admin operations (backend only).
 * Frontend uses publishable key directly via @supabase/supabase-js.
 */
@Injectable()
export class SupabaseService implements ISupabaseService {
  private readonly supabaseClient: SupabaseClient;
  private readonly webhookSecret: string;

  constructor(
    @Inject('IConfigurationService')
    private readonly configService: IConfigurationService,
    @Inject('ILoggerService')
    private readonly logger: ILoggerService,
  ) {
    const supabaseUrl = this.configService.getSupabaseUrl();
    const supabaseSecretKey = this.configService.getSupabaseSecretKey();
    this.webhookSecret = this.configService.getSupabaseWebhookSecret();

    // Initialize Supabase client with secret key (admin access)
    this.supabaseClient = createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.logger.info('SupabaseService initialized', {
      operation: 'supabase.init',
      module: 'SupabaseService',
    });
  }

  /**
   * Validate access token and return authenticated user
   * Used by SupabaseAuthGuard to validate JWT from frontend
   */
  async getUser(accessToken: string): Promise<SupabaseUser> {
    try {
      const { data, error } = await this.supabaseClient.auth.getUser(accessToken);

      if (error || !data.user) {
        this.logger.warn('Failed to validate Supabase token', {
          operation: 'supabase.getUser.failed',
          module: 'SupabaseService',
          error: error?.message,
        });
        throw new UnauthorizedException('Invalid or expired token');
      }

      return this.mapSupabaseUserToSupabaseUser(data.user);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error('Error validating Supabase token', error instanceof Error ? error : new Error(String(error)), {
        operation: 'supabase.getUser.error',
        module: 'SupabaseService',
      });
      throw new UnauthorizedException('Failed to validate token');
    }
  }

  /**
   * Get user by ID (admin operation using secret key)
   * Used by reconciliation worker and webhook handlers
   */
  async getUserById(authUserId: string): Promise<SupabaseUser> {
    try {
      const { data, error } = await this.supabaseClient.auth.admin.getUserById(authUserId);

      if (error || !data.user) {
        this.logger.warn('Supabase auth user not found', {
          operation: 'supabase.getUserById.not_found',
          module: 'SupabaseService',
          authUserId,
          error: error?.message,
        });
        throw new NotFoundException(`Auth user not found: ${authUserId}`);
      }

      return this.mapSupabaseUserToSupabaseUser(data.user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error('Error fetching Supabase user by ID', error instanceof Error ? error : new Error(String(error)), {
        operation: 'supabase.getUserById.error',
        module: 'SupabaseService',
        authUserId,
      });
      throw new Error(`Failed to fetch auth user: ${authUserId}`);
    }
  }

  /**
   * List all auth users (admin operation, paginated)
   * Used by AuthReconciliationWorker to detect orphaned auth users
   */
  async listUsers(page: number = 1, perPage: number = 100): Promise<SupabaseUser[]> {
    try {
      // Supabase admin.listUsers uses pagination
      const { data, error } = await this.supabaseClient.auth.admin.listUsers({
        page,
        perPage: Math.min(perPage, 1000), // Max 1000 per page
      });

      if (error) {
        const err = new Error(`Failed to list auth users: ${error.message}`);
        this.logger.error('Error listing Supabase users', err, {
          operation: 'supabase.listUsers.error',
          module: 'SupabaseService',
          page,
          perPage,
        });
        throw err;
      }

      return data.users.map((user) => this.mapSupabaseUserToSupabaseUser(user));
    } catch (error) {
      this.logger.error('Error listing Supabase users', error instanceof Error ? error : new Error(String(error)), {
        operation: 'supabase.listUsers.error',
        module: 'SupabaseService',
      });
      throw error;
    }
  }

  /**
   * Verify webhook signature from Supabase
   * Used by SupabaseWebhookController to validate webhook authenticity
   *
   * Supabase webhooks use HMAC-SHA256 for signature
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string): boolean {
    if (!this.webhookSecret) {
      this.logger.warn('SUPABASE_WEBHOOK_SECRET not configured, skipping signature verification', {
        operation: 'supabase.verifyWebhookSignature.no_secret',
        module: 'SupabaseService',
      });
      // In development, allow webhooks without signature if secret not configured
      return process.env.NODE_ENV !== 'production';
    }

    try {
      const payloadString = typeof payload === 'string' ? payload : payload.toString('utf8');
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payloadString)
        .digest('hex');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );

      if (!isValid) {
        this.logger.warn('Invalid webhook signature', {
          operation: 'supabase.verifyWebhookSignature.invalid',
          module: 'SupabaseService',
        });
      }

      return isValid;
    } catch (error) {
      this.logger.error('Error verifying webhook signature', error instanceof Error ? error : new Error(String(error)), {
        operation: 'supabase.verifyWebhookSignature.error',
        module: 'SupabaseService',
      });
      return false;
    }
  }

  /**
   * Resend confirmation email (admin operation)
   * Proxy for Supabase Auth API - triggers email resend
   */
  async resendConfirmationEmail(email: string): Promise<void> {
    try {
      const { error } = await this.supabaseClient.auth.resend({
        type: 'signup',
        email,
      });

      if (error) {
        this.logger.warn('Failed to resend confirmation email', {
          operation: 'supabase.resendConfirmationEmail.failed',
          module: 'SupabaseService',
          email,
          error: error.message,
        });
        throw new BadRequestException(error.message);
      }

      this.logger.info('Confirmation email resent successfully', {
        operation: 'supabase.resendConfirmationEmail.success',
        module: 'SupabaseService',
        email,
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error('Error resending confirmation email', error instanceof Error ? error : new Error(String(error)), {
        operation: 'supabase.resendConfirmationEmail.error',
        module: 'SupabaseService',
        email,
      });
      throw new BadRequestException('Failed to resend confirmation email');
    }
  }

  /**
   * Map Supabase User to SupabaseUser interface
   * Converts SDK types to internal interface
   */
  private mapSupabaseUserToSupabaseUser(user: User): SupabaseUser {
    return {
      id: user.id,
      email: user.email || '',
      email_confirmed_at: user.email_confirmed_at || null,
      user_metadata: user.user_metadata || {},
      app_metadata: user.app_metadata || {},
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }
}
