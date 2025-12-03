import { Injectable, BadRequestException } from '@nestjs/common';
import { ILoggerService } from '@fnd/backend';
import { Inject } from '@nestjs/common';
import { WebhookGatewayConfig } from '@fnd/domain';

/**
 * Serviço responsável por decodificar e validar UUID do gateway webhook
 */
@Injectable()
export class WebhookGatewayService {
  constructor(
    @Inject('ILoggerService') private readonly logger: ILoggerService
  ) {}

  /**
   * Decodifica o UUID do gateway e extrai a configuração
   * @param uuid - UUID base64url encoded contendo a configuração
   * @returns WebhookGatewayConfig decodificada
   * @throws BadRequestException se o UUID for inválido
   */
  decode(uuid: string): WebhookGatewayConfig {
    try {
      // Converte base64url para base64 padrão
      const base64 = uuid.replace(/-/g, '+').replace(/_/g, '/');

      // Decodifica de base64
      const jsonString = Buffer.from(base64, 'base64').toString('utf-8');

      // Parse JSON
      const config = JSON.parse(jsonString) as WebhookGatewayConfig;

      // Valida campos obrigatórios
      this.validateConfig(config);

      this.logger.info('Webhook gateway UUID decoded successfully', {
        operation: 'webhooks.gateway.decode',
        module: 'WebhookGatewayService',
        accountId: config.accountId,
        webhookType: config.webhookType,
        provider: config.provider,
      });

      return config;
    } catch (error) {
      this.logger.error(
        'Failed to decode webhook gateway UUID',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'webhooks.gateway.decode.error',
          module: 'WebhookGatewayService',
          uuid,
        }
      );

      throw new BadRequestException(
        'Invalid webhook gateway UUID. Please check the URL format.'
      );
    }
  }

  /**
   * Codifica uma configuração em UUID base64url
   * @param config - Configuração do gateway
   * @returns UUID codificado
   */
  encode(config: WebhookGatewayConfig): string {
    const jsonString = JSON.stringify(config);
    const base64 = Buffer.from(jsonString, 'utf-8').toString('base64');

    // Converte para base64url (URL-safe)
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * Valida se a configuração contém todos os campos obrigatórios
   */
  private validateConfig(config: WebhookGatewayConfig): void {
    if (!config.accountId) {
      throw new Error('accountId is required in gateway configuration');
    }
    if (!config.projectId) {
      throw new Error('projectId is required in gateway configuration');
    }
    if (!config.webhookType) {
      throw new Error('webhookType is required in gateway configuration');
    }
    if (!config.provider) {
      throw new Error('provider is required in gateway configuration');
    }
  }
}
