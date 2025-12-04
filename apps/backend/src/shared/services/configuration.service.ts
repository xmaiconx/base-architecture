import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IConfigurationService, IFeatureFlags } from '@fnd/backend';

@Injectable()
export class ConfigurationService implements IConfigurationService {
  constructor(private readonly configService: ConfigService) {}

  getFrontendUrl(): string {
    return this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }


  getResendApiKey(): string {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is required');
    }
    return apiKey;
  }

  getResendFromEmail(): string {
    return this.configService.get<string>('RESEND_FROM_EMAIL') || 'noreply@rugidodigital.com.br';
  }

  getApiPort(): number {
    const port = this.configService.get<string>('API_PORT');
    return port ? parseInt(port, 10) : 3001;
  }

  getSuperAdminEmail(): string | undefined {
    const email = this.configService.get<string>('SUPER_ADMIN_EMAIL');
    return email && email.trim() !== '' ? email.trim() : undefined;
  }

  isSuperAdminEmail(email: string): boolean {
    const superAdminEmail = this.getSuperAdminEmail();
    if (!superAdminEmail) return false;
    return email.toLowerCase().trim() === superAdminEmail.toLowerCase().trim();
  }

  getFeatureFlags(): IFeatureFlags {
    const parseBoolean = (value: string | undefined, defaultValue: boolean = true): boolean => {
      if (value === undefined || value === '') return defaultValue;
      return value.toLowerCase() === 'true' || value === '1';
    };

    return {
      workspaceEnabled: parseBoolean(
        this.configService.get<string>('FEATURES_WORKSPACE_ENABLED'),
        true
      ),
      workspaceSwitchingEnabled: parseBoolean(
        this.configService.get<string>('FEATURES_WORKSPACE_SWITCHING_ENABLED'),
        true
      ),
    };
  }

  // Supabase Auth configuration methods
  getSupabaseUrl(): string {
    const url = this.configService.get<string>('SUPABASE_URL');
    if (!url) {
      throw new Error('SUPABASE_URL is required for Supabase Auth');
    }
    return url;
  }

  getSupabasePublishableKey(): string {
    const key = this.configService.get<string>('SUPABASE_PUBLISHABLE_KEY');
    if (!key) {
      throw new Error('SUPABASE_PUBLISHABLE_KEY is required for Supabase Auth');
    }
    return key;
  }

  getSupabaseSecretKey(): string {
    const key = this.configService.get<string>('SUPABASE_SECRET_KEY');
    if (!key) {
      throw new Error('SUPABASE_SECRET_KEY is required for Supabase Auth');
    }
    return key;
  }

  getSupabaseWebhookSecret(): string {
    return this.configService.get<string>('SUPABASE_WEBHOOK_SECRET') || '';
  }

  // Stripe configuration methods
  getStripeSecretKey(): string {
    const key = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is required for billing functionality');
    }
    return key;
  }

  getStripeWebhookSecret(): string {
    const secret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is required for webhook verification');
    }
    return secret;
  }

  getStripeSuccessUrl(): string {
    return this.configService.get<string>('STRIPE_SUCCESS_URL') || `${this.getFrontendUrl()}/settings/billing?success=true`;
  }

  getStripeCancelUrl(): string {
    return this.configService.get<string>('STRIPE_CANCEL_URL') || `${this.getFrontendUrl()}/settings/billing?canceled=true`;
  }

  // QStash configuration methods
  getQStashToken(): string {
    const token = this.configService.get<string>('QSTASH_TOKEN');
    if (!token) {
      throw new Error('QSTASH_TOKEN is required for serverless queue functionality');
    }
    return token;
  }

  getQStashCurrentSigningKey(): string {
    const key = this.configService.get<string>('QSTASH_CURRENT_SIGNING_KEY');
    if (!key) {
      throw new Error('QSTASH_CURRENT_SIGNING_KEY is required for webhook signature verification');
    }
    return key;
  }

  getQStashNextSigningKey(): string {
    const key = this.configService.get<string>('QSTASH_NEXT_SIGNING_KEY');
    if (!key) {
      throw new Error('QSTASH_NEXT_SIGNING_KEY is required for webhook signature verification');
    }
    return key;
  }

  getVercelUrl(): string {
    return this.configService.get<string>('VERCEL_URL') || 'http://localhost:3001';
  }

  getWorkerBaseUrl(): string {
    return `${this.getVercelUrl()}/api/workers`;
  }
}