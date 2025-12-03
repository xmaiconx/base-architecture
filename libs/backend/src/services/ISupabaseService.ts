/**
 * Supabase Service Interface
 *
 * Provides abstraction for Supabase Auth operations.
 * This service wraps @supabase/supabase-js SDK to enable:
 * - Token validation (access tokens from frontend)
 * - User management (admin operations)
 * - Webhook signature verification
 */

export interface SupabaseUser {
  id: string; // auth.users.id
  email: string;
  email_confirmed_at?: string | null;
  user_metadata?: {
    full_name?: string;
    [key: string]: any;
  };
  app_metadata?: {
    [key: string]: any;
  };
  created_at: string;
  updated_at?: string;
}

export interface ISupabaseService {
  /**
   * Validate access token and return authenticated user
   * Used by SupabaseAuthGuard to validate JWT from frontend
   *
   * @param accessToken - JWT access token from Authorization header
   * @returns Authenticated user from auth.users
   * @throws UnauthorizedException if token is invalid/expired
   */
  getUser(accessToken: string): Promise<SupabaseUser>;

  /**
   * Get user by ID (admin operation using service role key)
   * Used by reconciliation worker and webhook handlers
   *
   * @param authUserId - UUID of user in auth.users
   * @returns User data
   * @throws NotFoundException if user not found
   */
  getUserById(authUserId: string): Promise<SupabaseUser>;

  /**
   * List all auth users (admin operation, paginated)
   * Used by AuthReconciliationWorker to detect orphaned auth users
   *
   * @param page - Page number (1-indexed)
   * @param perPage - Results per page (default 100, max 1000)
   * @returns Array of auth users
   */
  listUsers(page?: number, perPage?: number): Promise<SupabaseUser[]>;

  /**
   * Verify webhook signature from Supabase
   * Used by SupabaseWebhookController to validate webhook authenticity
   *
   * @param payload - Raw webhook payload (string or Buffer)
   * @param signature - x-supabase-signature header value
   * @returns True if signature is valid, false otherwise
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string): boolean;

  /**
   * Resend confirmation email (admin operation)
   * Proxy for Supabase Auth API - triggers email resend
   *
   * @param email - User email to resend confirmation
   * @throws BadRequestException if email not found or already confirmed
   */
  resendConfirmationEmail(email: string): Promise<void>;
}
