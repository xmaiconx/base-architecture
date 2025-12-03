import { Controller, Post, Body, HttpStatus, HttpCode, Get, UseGuards, Request } from '@nestjs/common';
import { ResendConfirmationDto } from './dtos';
import { AuthService } from './auth.service';
import { SupabaseAuthGuard } from '../../guards/supabase-auth.guard';

/**
 * AuthController (Adapted for Supabase Auth)
 *
 * REMOVED endpoints (now handled by frontend → Supabase directly):
 * - POST /auth/signup - Frontend calls supabase.auth.signUp()
 * - POST /auth/signin - Frontend calls supabase.auth.signInWithPassword()
 * - POST /auth/confirm-email - Supabase handles confirmation via callback URL
 *
 * KEPT endpoints:
 * - GET /auth/me - Returns user profile (protected by SupabaseAuthGuard)
 * - POST /auth/resend-confirmation - Proxies to Supabase Auth API
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Get current authenticated user profile
   *
   * Protected by SupabaseAuthGuard (validates Supabase JWT token)
   * Frontend must send: Authorization: Bearer <supabase_access_token>
   */
  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  async getMe(@Request() req: any) {
    const user = await this.authService.getMe(req.user.userId);
    return {
      user,
    };
  }

  /**
   * Resend email confirmation (proxies to Supabase Auth API)
   *
   * Frontend can also call supabase.auth.resend() directly
   */
  @Post('resend-confirmation')
  @HttpCode(HttpStatus.OK)
  async resendConfirmation(@Body() resendConfirmationDto: ResendConfirmationDto) {
    await this.authService.resendConfirmation(resendConfirmationDto.email);
    return {
      message: 'Email de confirmação reenviado com sucesso.',
    };
  }
}