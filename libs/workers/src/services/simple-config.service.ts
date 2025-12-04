import type { IConfigurationService, IFeatureFlags } from '@fnd/backend';

/**
 * Simple configuration service for serverless workers
 * Reads directly from process.env without NestJS ConfigModule
 */
export class SimpleConfigService implements IConfigurationService {
  private getEnv(key: string, defaultValue?: string): string {
    const value = process.env[key];
    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  getDatabaseUrl(): string {
    return this.getEnv('DATABASE_URL');
  }


  getApiPort(): number {
    return parseInt(this.getEnv('API_PORT', '3001'), 10);
  }

  getSuperAdminEmail(): string | undefined {
    return this.getEnv('SUPER_ADMIN_EMAIL', undefined);
  }

  isSuperAdminEmail(email: string): boolean {
    const adminEmail = this.getSuperAdminEmail();
    return adminEmail ? email === adminEmail : false;
  }

  getFeatureFlags(): IFeatureFlags {
    return {
      workspaceEnabled: this.getEnv('FEATURES_WORKSPACE_ENABLED', 'false') === 'true',
      workspaceSwitchingEnabled: this.getEnv('FEATURES_WORKSPACE_SWITCHING_ENABLED', 'false') === 'true',
    };
  }

  getResendApiKey(): string {
    return this.getEnv('RESEND_API_KEY');
  }

  getResendFromEmail(): string {
    return this.getEnv('RESEND_FROM_EMAIL');
  }

  getFrontendUrl(): string {
    return this.getEnv('FRONTEND_URL', 'http://localhost:3000');
  }

  getSupabaseUrl(): string {
    return this.getEnv('SUPABASE_URL');
  }

  getSupabasePublishableKey(): string {
    return this.getEnv('SUPABASE_PUBLISHABLE_KEY');
  }

  getSupabaseSecretKey(): string {
    return this.getEnv('SUPABASE_SECRET_KEY');
  }

  getSupabaseWebhookSecret(): string {
    return this.getEnv('SUPABASE_WEBHOOK_SECRET', '');
  }

  getStripeSecretKey(): string {
    return this.getEnv('STRIPE_SECRET_KEY', '');
  }

  getStripeWebhookSecret(): string {
    return this.getEnv('STRIPE_WEBHOOK_SECRET', '');
  }

  getStripeSuccessUrl(): string {
    return this.getEnv('STRIPE_SUCCESS_URL', `${this.getFrontendUrl()}/subscription/success`);
  }

  getStripeCancelUrl(): string {
    return this.getEnv('STRIPE_CANCEL_URL', `${this.getFrontendUrl()}/subscription/cancel`);
  }

  getQStashToken(): string {
    return this.getEnv('QSTASH_TOKEN', '');
  }

  getQStashCurrentSigningKey(): string {
    return this.getEnv('QSTASH_CURRENT_SIGNING_KEY', '');
  }

  getQStashNextSigningKey(): string {
    return this.getEnv('QSTASH_NEXT_SIGNING_KEY', '');
  }

  getVercelUrl(): string {
    return this.getEnv('VERCEL_URL', '');
  }

  getWorkerBaseUrl(): string {
    return this.getEnv('WORKER_BASE_URL', '');
  }
}
