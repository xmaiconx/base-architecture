import { Injectable, BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { UserResponseDto } from './dtos';
import { IUserRepository } from '@fnd/database';
import { ILoggerService, ISupabaseService } from '@fnd/backend';

/**
 * AuthService (Adapted for Supabase Auth)
 *
 * REMOVED methods (now handled by frontend → Supabase directly):
 * - signUp() - Frontend calls supabase.auth.signUp()
 * - signIn() - Frontend calls supabase.auth.signInWithPassword()
 * - confirmEmail() - Frontend calls Supabase directly
 *
 * KEPT methods:
 * - getMe() - Returns user profile (called after SupabaseAuthGuard validates token)
 * - resendConfirmation() - Proxy to Supabase Auth API
 */
@Injectable()
export class AuthService {
  constructor(
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    @Inject('ILoggerService') private readonly logger: ILoggerService,
    @Inject('ISupabaseService') private readonly supabaseService: ISupabaseService,
  ) {}

  /**
   * Resend confirmation email (proxies to Supabase Auth API)
   * Frontend can also call supabase.auth.resend() directly
   */
  async resendConfirmation(email: string): Promise<void> {
    this.logger.info('Resending confirmation email via Supabase', {
      operation: 'auth.resend_confirmation.start',
      module: 'AuthService',
      email,
    });

    try {
      await this.supabaseService.resendConfirmationEmail(email);

      this.logger.info('Confirmation email resent successfully', {
        operation: 'auth.resend_confirmation.success',
        module: 'AuthService',
        email,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to resend confirmation email: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
      throw new BadRequestException('Failed to resend confirmation email');
    }
  }

  async getMe(userId: string): Promise<UserResponseDto> {
    this.logger.info('Fetching current user data', {
      operation: 'auth.get_me.start',
      module: 'AuthService',
      userId,
    });

    const user = await this.userRepository.findById(userId);

    if (!user) {
      this.logger.warn('User not found in getMe', {
        operation: 'auth.get_me.user_not_found',
        module: 'AuthService',
        userId,
      });
      throw new NotFoundException('Usuário não encontrado');
    }

    this.logger.info('User data fetched successfully', {
      operation: 'auth.get_me.success',
      module: 'AuthService',
      userId,
      accountId: user.accountId,
    });

    return user;
  }
}