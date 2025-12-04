import { IFeatureFlags } from '../features/IFeatureFlags';

export interface IConfigurationService {
  getFrontendUrl(): string;
  getResendApiKey(): string;
  getResendFromEmail(): string;
  getApiPort(): number;
  getSuperAdminEmail(): string | undefined;
  isSuperAdminEmail(email: string): boolean;
  getFeatureFlags(): IFeatureFlags;

  // Supabase Auth configuration
  getSupabaseUrl(): string;
  getSupabasePublishableKey(): string;
  getSupabaseSecretKey(): string;
  getSupabaseWebhookSecret(): string;

  // Stripe configuration
  getStripeSecretKey(): string;
  getStripeWebhookSecret(): string;
  getStripeSuccessUrl(): string;
  getStripeCancelUrl(): string;

  // QStash configuration
  getQStashToken(): string;
  getQStashCurrentSigningKey(): string;
  getQStashNextSigningKey(): string;
  getVercelUrl(): string;
  getWorkerBaseUrl(): string;
}