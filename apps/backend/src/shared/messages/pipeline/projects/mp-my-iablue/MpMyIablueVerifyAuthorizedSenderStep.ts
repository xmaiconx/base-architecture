import { Inject, Injectable } from '@nestjs/common';
import { ILoggerService, IMessagePipelineStep } from '@fnd/backend';
import { MessageContext, PipelineResult } from '@fnd/domain';

/**
 * MP My IABlue - Verify Authorized Sender Step
 *
 * Verifica se o sender está autorizado a enviar mensagens no sistema IABlue.
 *
 * Lógica customizada do projeto mp-my-iablue:
 * - Verifica whitelist de telefones autorizados
 * - Consulta API externa do IABlue para validar credenciais
 * - Valida plano do cliente (free, premium, enterprise)
 * - Adiciona informações de autorização ao context
 *
 * Configuração (via Project.settings):
 * - authorization.enabled: boolean
 * - authorization.externalAuthUrl: string (URL da API IABlue)
 * - authorization.apiKey: string (chave de API)
 * - authorization.whitelist: string[] (telefones autorizados)
 */
@Injectable()
export class MpMyIablueVerifyAuthorizedSenderStep implements IMessagePipelineStep {
  readonly name = 'mp-my-iablue:verify-authorized-sender';

  constructor(
    @Inject('ILoggerService') private readonly logger: ILoggerService
    // TODO: Inject IABlue-specific services
    // @Inject('IIABlueApiClient') private readonly iablueApiClient: IIABlueApiClient
  ) {}

  async execute(context: MessageContext): Promise<PipelineResult> {
    this.logger.debug('MP My IABlue: Verifying sender authorization', {
      operation: 'pipeline.step.mp_my_iablue.verify_authorized',
      module: 'MpMyIablueVerifyAuthorizedSenderStep',
      senderId: context.message.metadata.from.id,
      projectId: context.projectId,
    });

    // Check if authorization is enabled
    const authEnabled =
      context.metadata.project?.settings?.authorization?.enabled ?? true;

    if (!authEnabled) {
      this.logger.debug('Authorization check disabled for mp-my-iablue', {
        operation: 'pipeline.step.mp_my_iablue.verify_authorized.disabled',
      });

      return {
        shouldContinue: true,
        context,
      };
    }

    try {
      const sender = context.message.metadata.from;
      const senderPhone = sender.phone;
      const senderId = sender.id;

      if (!senderPhone) {
        this.logger.warn('Sender phone not available for authorization', {
          operation: 'pipeline.step.mp_my_iablue.verify_authorized.no_phone',
          senderId,
        });

        return {
          shouldContinue: false,
          context,
          reason: 'Sender phone number is required for IABlue authorization',
        };
      }

      // Check whitelist first (fast path)
      const whitelist =
        context.metadata.project?.settings?.authorization?.whitelist ?? [];

      if (whitelist.length > 0 && whitelist.includes(senderPhone)) {
        this.logger.info('Sender authorized via whitelist', {
          operation: 'pipeline.step.mp_my_iablue.verify_authorized.whitelist',
          senderPhone,
        });

        context.metadata.iablueAuthorization = {
          authorized: true,
          source: 'whitelist',
          clientId: `whitelist-${senderId}`,
          plan: 'premium',
        };

        return {
          shouldContinue: true,
          context,
        };
      }

      // Get IABlue API configuration
      const authUrl =
        context.metadata.project?.settings?.authorization?.externalAuthUrl;
      const apiKey = context.metadata.project?.settings?.authorization?.apiKey;

      if (!authUrl) {
        this.logger.error(
          'IABlue API URL not configured',
          undefined,
          {
            operation: 'pipeline.step.mp_my_iablue.verify_authorized.no_api_url',
            projectId: context.projectId,
          }
        );

        return {
          shouldContinue: false,
          context,
          reason: 'IABlue API URL not configured',
        };
      }

      // TODO: Call IABlue API to verify authorization
      // const authResponse = await this.iablueApiClient.checkAuthorization({
      //   phone: senderPhone,
      //   projectId: context.projectId,
      //   apiKey,
      // });
      //
      // if (!authResponse.authorized) {
      //   this.logger.info('Sender not authorized by IABlue API', {
      //     operation: 'pipeline.step.mp_my_iablue.verify_authorized.not_authorized',
      //     senderPhone,
      //     reason: authResponse.reason,
      //   });
      //
      //   return {
      //     shouldContinue: false,
      //     context,
      //     reason: `Not authorized: ${authResponse.reason}`,
      //   };
      // }
      //
      // context.metadata.iablueAuthorization = {
      //   authorized: true,
      //   source: 'iablue_api',
      //   clientId: authResponse.clientId,
      //   plan: authResponse.plan,
      //   companyName: authResponse.companyName,
      // };

      // Temporary: Mock authorization response
      this.logger.info('IABlue authorization placeholder (mock)', {
        operation: 'pipeline.step.mp_my_iablue.verify_authorized.placeholder',
        senderPhone,
        authUrl,
      });

      // Mock successful authorization
      context.metadata.iablueAuthorization = {
        authorized: true,
        source: 'iablue_api',
        clientId: 'iablue-client-mock-123',
        plan: 'premium',
        companyName: 'Mock IABlue Company',
      };

      this.logger.info('Sender authorized successfully', {
        operation: 'pipeline.step.mp_my_iablue.verify_authorized.success',
        senderPhone,
        clientId: context.metadata.iablueAuthorization.clientId,
        plan: context.metadata.iablueAuthorization.plan,
      });

      return {
        shouldContinue: true,
        context,
        stepMetadata: {
          clientId: context.metadata.iablueAuthorization.clientId,
          plan: context.metadata.iablueAuthorization.plan,
        },
      };
    } catch (error) {
      this.logger.error(
        'Failed to verify IABlue sender authorization',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'pipeline.step.mp_my_iablue.verify_authorized.error',
          module: 'MpMyIablueVerifyAuthorizedSenderStep',
          senderId: context.message.metadata.from.id,
        }
      );

      // Fail safely: deny access on error
      return {
        shouldContinue: false,
        context,
        reason: 'IABlue authorization check failed',
        stepMetadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }
}
