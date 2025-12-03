import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Request } from 'express';
import { ISupabaseService, ILoggerService } from '@fnd/backend';
import { IUserRepository } from '@fnd/database';
import { RoleElevationService } from '../modules/auth/services/role-elevation.service';

/**
 * Supabase Auth Guard
 *
 * Replaces JwtAuthGuard (Passport-based) with custom guard that:
 * 1. Validates Supabase JWT access token via SupabaseService
 * 2. Finds User in database by auth_user_id
 * 3. Elevates super-admin if email matches SUPER_ADMIN_EMAIL
 * 4. Injects req.user with { userId, accountId, email, role }
 *
 * Usage: @UseGuards(SupabaseAuthGuard)
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    @Inject('ISupabaseService') private readonly supabaseService: ISupabaseService,
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    @Inject('ILoggerService') private readonly logger: ILoggerService,
    private readonly roleElevationService: RoleElevationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // 1. Extract access token from Authorization header
    const accessToken = this.extractTokenFromHeader(request);
    if (!accessToken) {
      this.logger.warn('Missing Authorization header', {
        operation: 'auth.guard.missing_token',
        module: 'SupabaseAuthGuard',
        ip: request.ip,
      });
      throw new UnauthorizedException('Missing Authorization header');
    }

    try {
      // 2. Validate token via Supabase and get auth user
      const authUser = await this.supabaseService.getUser(accessToken);

      // 3. Find User in database by auth_user_id
      let user = await this.userRepository.findByAuthUserId(authUser.id);

      if (!user) {
        this.logger.warn('User not found for auth_user_id', {
          operation: 'auth.guard.user_not_found',
          module: 'SupabaseAuthGuard',
          authUserId: authUser.id,
          email: authUser.email,
        });
        throw new UnauthorizedException('User not found in application database');
      }

      // 4. Check if user account is active
      if (user.status !== 'active') {
        this.logger.warn('User account is not active', {
          operation: 'auth.guard.user_inactive',
          module: 'SupabaseAuthGuard',
          userId: user.id,
          status: user.status,
        });
        throw new UnauthorizedException('User account is not active');
      }

      // 5. Elevate to super-admin if email matches SUPER_ADMIN_EMAIL
      user = await this.roleElevationService.checkAndElevateUser(user);

      // 6. Inject user into request (same format as JwtStrategy for compatibility)
      (request as any).user = {
        userId: user.id,
        accountId: user.accountId,
        email: user.email,
        role: user.role,
      };

      this.logger.debug('User authenticated successfully', {
        operation: 'auth.guard.success',
        module: 'SupabaseAuthGuard',
        userId: user.id,
        accountId: user.accountId,
        role: user.role,
      });

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error('Error validating Supabase token', error instanceof Error ? error : new Error(String(error)), {
        operation: 'auth.guard.error',
        module: 'SupabaseAuthGuard',
      });
      throw new UnauthorizedException('Failed to authenticate');
    }
  }

  /**
   * Extract Bearer token from Authorization header
   */
  private extractTokenFromHeader(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}
