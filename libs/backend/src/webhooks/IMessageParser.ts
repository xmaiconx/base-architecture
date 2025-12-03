import { MessageContext } from '@fnd/domain';
import { ParseResult } from './ParseResult';
import { ParsedWebhookData } from './IWebhookParser';

/**
 * Webhook Event Context
 *
 * Information about the original webhook event
 * Passed to message parsers for context
 */
export interface WebhookEventContext {
  /**
   * Webhook event ID (for tracing)
   */
  id: string;

  /**
   * Account ID (multi-tenancy)
   */
  accountId: string;

  /**
   * Project ID (optional)
   */
  projectId: string | null;

  /**
   * Provider name (whaticket, waha, notificamehub, etc.)
   */
  provider: string;

  /**
   * Channel type (whatsapp, instagram, mercadolivre, etc.)
   */
  channel: string | null;

  /**
   * Implementation type (baileys, official, whatsmeow, gows, etc.)
   */
  implementation: string | null;

  /**
   * Original webhook payload (raw)
   */
  payload: unknown;
}

/**
 * Message Parser Interface (Strategy Pattern)
 *
 * Converts ParsedWebhookData → MessageContext[]
 * Each parser handles a specific provider/channel/implementation combination
 */
export interface IMessageParser {
  /**
   * Strategy Pattern: Check if this parser can handle the given combination
   *
   * @param provider - Provider name (e.g., 'whaticket')
   * @param channel - Channel type (e.g., 'whatsapp')
   * @param implementation - Implementation type (e.g., 'official')
   * @returns true if this parser can handle the combination
   */
  canHandle(provider: string, channel: string, implementation: string): boolean;

  /**
   * Parse webhook data into MessageContext array
   *
   * @param parsedData - Parsed webhook data from phase 1 parser
   * @param webhookEvent - Original webhook event context
   * @returns ParseResult containing array of MessageContext objects
   */
  parse(
    parsedData: ParsedWebhookData,
    webhookEvent: WebhookEventContext,
  ): Promise<ParseResult<MessageContext[]>>;
}
