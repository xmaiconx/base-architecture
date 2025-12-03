import { Injectable, Inject } from '@nestjs/common';
import { ILoggerService, IMessageParser } from '@fnd/backend';
import { WhaticketWhatsappOfficialMessageParser } from './protocols/whaticket-whatsapp-official-message.parser';

/**
 * Message Parser Factory Service (Strategy Pattern)
 *
 * Responsible for:
 * - Registering all available message parsers
 * - Selecting the correct parser based on provider/channel/implementation
 * - Throwing error if no parser found
 *
 * Usage:
 * ```typescript
 * const parser = messageParserFactory.getParser({
 *   provider: 'whaticket',
 *   channel: 'whatsapp',
 *   implementation: 'official'
 * });
 *
 * if (parser) {
 *   const result = await parser.parse(parsedData, webhookEvent);
 * }
 * ```
 */
@Injectable()
export class MessageParserFactoryService {
  private parsers: IMessageParser[] = [];

  constructor(
    @Inject('ILoggerService')
    private readonly logger: ILoggerService,
    // Inject all available parsers
    private readonly whaticketOfficialParser: WhaticketWhatsappOfficialMessageParser,
    // TODO: Add more parsers as they are implemented
    // private readonly wahaWhatsappBaileysParser: WahaWhatsappBaileysMessageParser,
    // private readonly notificamehubWhatsappBaileysParser: NotificamehubWhatsappBaileysMessageParser,
  ) {
    // Register all parsers
    this.registerParser(whaticketOfficialParser);
    // TODO: Register more parsers
    // this.registerParser(wahaWhatsappBaileysParser);
    // this.registerParser(notificamehubWhatsappBaileysParser);

    this.logger.info('Message parser factory initialized', {
      operation: 'message.parser.factory.init',
      module: 'MessageParserFactoryService',
      parsersCount: this.parsers.length,
    });
  }

  /**
   * Register a parser in the factory
   */
  private registerParser(parser: IMessageParser): void {
    this.parsers.push(parser);

    this.logger.debug('Message parser registered', {
      operation: 'message.parser.factory.register',
      module: 'MessageParserFactoryService',
      parserName: parser.constructor.name,
    });
  }

  /**
   * Get the appropriate parser for the given configuration (Strategy Pattern)
   *
   * @param config - Provider/channel/implementation configuration
   * @returns IMessageParser instance or null if not found
   */
  getParser(config: {
    provider: string;
    channel?: string;
    implementation?: string;
  }): IMessageParser | null {
    const normalizedConfig = {
      provider: config.provider.toLowerCase().trim(),
      channel: config.channel?.toLowerCase().trim() ?? '',
      implementation: config.implementation?.toLowerCase().trim() ?? '',
    };

    const parser = this.parsers.find((p) =>
      p.canHandle(
        normalizedConfig.provider,
        normalizedConfig.channel,
        normalizedConfig.implementation,
      ),
    );

    if (!parser) {
      this.logger.warn('No message parser found for configuration', {
        operation: 'message.parser.factory.not_found',
        module: 'MessageParserFactoryService',
        config: normalizedConfig,
        availableParsers: this.parsers.map((p) => p.constructor.name),
      });
      return null;
    }

    this.logger.debug('Message parser found', {
      operation: 'message.parser.factory.found',
      module: 'MessageParserFactoryService',
      parserName: parser.constructor.name,
      config: normalizedConfig,
    });

    return parser;
  }

  /**
   * Get all registered parsers (for debugging)
   */
  getAllParsers(): IMessageParser[] {
    return [...this.parsers];
  }

  /**
   * Get count of registered parsers
   */
  getParserCount(): number {
    return this.parsers.length;
  }
}
