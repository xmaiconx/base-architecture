import { Injectable, Inject } from '@nestjs/common';
import { IWebhookParser, ILoggerService } from '@fnd/backend';
import { ParserConfig } from '../types/ParserConfig';
import {
  WhaticketWhatsappBaileysParser,
  WhaticketWhatsappWhatsMeowParser,
  WhaticketWhatsappOfficialParser,
  WhaticketInstagramOfficialParser,
  WahaWhatsappBaileysParser,
  WahaWhatsappGowsParser,
  NotificamehubWhatsappBaileysParser,
  NotificamehubMercadolivreOfficialParser,
} from '../parsers/protocols';

/**
 * Factory service para resolver parsers de webhook baseado em provider+channel+implementation
 *
 * Estratégia de resolução hierárquica:
 * 1. Específico: ${provider}-${channel}-${implementation}
 * 2. Fallback: ${provider}
 * 3. Não encontrado: retorna null + warning log
 */
@Injectable()
export class WebhookParserFactoryService {
  private readonly parsers = new Map<string, IWebhookParser<any, any>>();

  constructor(
    @Inject('ILoggerService') private readonly logger: ILoggerService,
    // Parsers - Whaticket
    private readonly whaticketWhatsappBaileysParser: WhaticketWhatsappBaileysParser,
    private readonly whaticketWhatsappWhatsMeowParser: WhaticketWhatsappWhatsMeowParser,
    private readonly whaticketWhatsappOfficialParser: WhaticketWhatsappOfficialParser,
    private readonly whaticketInstagramOfficialParser: WhaticketInstagramOfficialParser,

    // Parsers - Waha
    private readonly wahaWhatsappBaileysParser: WahaWhatsappBaileysParser,
    private readonly wahaWhatsappGowsParser: WahaWhatsappGowsParser,

    // Parsers - NotificameHub
    private readonly notificamehubWhatsappBaileysParser: NotificamehubWhatsappBaileysParser,
    private readonly notificamehubMercadolivreOfficialParser: NotificamehubMercadolivreOfficialParser,
  ) {
    this.registerParsers();
  }

  /**
   * Registra todos os parsers no Map interno
   * Chave: ${provider}-${channel}-${implementation} ou ${provider}
   */
  private registerParsers(): void {
    // Whaticket
    this.parsers.set('whaticket-whatsapp-baileys', this.whaticketWhatsappBaileysParser);
    this.parsers.set('whaticket-whatsapp-whatsmeow', this.whaticketWhatsappWhatsMeowParser);
    this.parsers.set('whaticket-whatsapp-official', this.whaticketWhatsappOfficialParser);
    this.parsers.set('whaticket-instagram-official', this.whaticketInstagramOfficialParser);
    this.parsers.set('WHATICKET', this.whaticketWhatsappBaileysParser); // Fallback

    // Waha
    this.parsers.set('waha-whatsapp-baileys', this.wahaWhatsappBaileysParser);
    this.parsers.set('waha-whatsapp-gows', this.wahaWhatsappGowsParser);
    this.parsers.set('WAHA', this.wahaWhatsappBaileysParser); // Fallback

    // NotificameHub
    this.parsers.set('notificamehub-whatsapp-baileys', this.notificamehubWhatsappBaileysParser);
    this.parsers.set('notificamehub-mercadolivre-official', this.notificamehubMercadolivreOfficialParser);
    this.parsers.set('NOTIFICAMEHUB', this.notificamehubWhatsappBaileysParser); // Fallback

    this.logger.info('Webhook parsers registered', {
      operation: 'webhooks.factory.init',
      module: 'WebhookParserFactoryService',
      totalParsers: this.parsers.size,
    });
  }

  /**
   * Obtém o parser apropriado baseado na configuração
   *
   * Hierarquia de resolução:
   * 1. Tenta: ${provider}-${channel}-${implementation}
   * 2. Fallback: ${provider}
   * 3. Não encontrado: retorna null + warning log
   *
   * @param config - Configuração do parser (provider, channel, implementation)
   * @returns Parser correspondente ou null se não encontrado
   */
  getParser(config: ParserConfig): IWebhookParser<any, any> | null {
    const keys = this.buildParserKeys(config);

    for (const key of keys) {
      if (this.parsers.has(key)) {
        this.logger.debug('Parser found', {
          operation: 'webhooks.factory.parser_found',
          module: 'WebhookParserFactoryService',
          key,
          config,
        });
        return this.parsers.get(key)!;
      }
    }

    // Nenhum parser encontrado - loga warning mas não quebra o fluxo
    this.logger.warn('No parser found for webhook config, proceeding without parsing', {
      operation: 'webhooks.factory.parser_not_found',
      module: 'WebhookParserFactoryService',
      config,
      attemptedKeys: keys,
    });

    return null;
  }

  /**
   * Verifica se existe parser para a configuração
   * @param config - Configuração do parser
   * @returns true se existe parser registrado
   */
  hasParser(config: ParserConfig): boolean {
    const keys = this.buildParserKeys(config);
    return keys.some(key => this.parsers.has(key));
  }

  /**
   * Constrói lista de chaves para tentar encontrar parser
   * Ordem de prioridade:
   * 1. Específico: ${provider}-${channel}-${implementation}
   * 2. Fallback: ${provider} (uppercase)
   *
   * @param config - Configuração do parser
   * @returns Array de chaves ordenadas por prioridade
   */
  private buildParserKeys(config: ParserConfig): string[] {
    const keys: string[] = [];

    // 1. Chave específica: provider-channel-implementation
    if (config.channel && config.implementation) {
      keys.push(
        `${config.provider.toLowerCase()}-${config.channel.toLowerCase()}-${config.implementation.toLowerCase()}`
      );
    }

    // 2. Fallback: provider apenas (uppercase)
    keys.push(config.provider.toUpperCase());

    return keys;
  }

  /**
   * Retorna lista de todas as chaves de parsers registrados
   * Útil para debugging e health checks
   */
  getRegisteredParserKeys(): string[] {
    return Array.from(this.parsers.keys());
  }
}
