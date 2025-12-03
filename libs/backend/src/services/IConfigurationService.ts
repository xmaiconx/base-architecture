import { IFeatureFlags } from '../features/IFeatureFlags';

export interface IConfigurationService {
  getFrontendUrl(): string;
  getJwtSecret(): string; // DEPRECATED: Using Supabase Auth
  getResendApiKey(): string;
  getResendFromEmail(): string;
  getRedisJobsUrl(): string;
  getApiPort(): number;
  getSuperAdminEmail(): string | undefined;
  isSuperAdminEmail(email: string): boolean;
  getFeatureFlags(): IFeatureFlags;

  // Supabase Auth configuration
  getSupabaseUrl(): string;
  getSupabaseAnonKey(): string;
  getSupabaseServiceRoleKey(): string;
  getSupabaseWebhookSecret(): string;

  // Stripe configuration
  getStripeSecretKey(): string;
  getStripeWebhookSecret(): string;
  getStripeSuccessUrl(): string;
  getStripeCancelUrl(): string;
}