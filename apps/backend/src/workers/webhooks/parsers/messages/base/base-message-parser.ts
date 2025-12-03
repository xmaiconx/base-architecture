import { randomUUID } from 'crypto';
import {
  IMessageParser,
  ParsedWebhookData,
  WebhookEventContext,
  ParseResult,
} from '@fnd/backend';
import {
  MessageContext,
  TypedMessage,
  ChatChannel,
  ChatProvider,
  ChatImplementation,
} from '@fnd/domain';

/**
 * Base Message Parser
 *
 * Abstract base class for all message parsers.
 * Provides common helper methods for parsing messages from different providers.
 *
 * Subclasses must implement:
 * - canHandle(provider, channel, implementation): boolean
 * - parse(parsedData, webhookEvent): Promise<ParseResult<MessageContext[]>>
 */
export abstract class BaseMessageParser implements IMessageParser {
  /**
   * Strategy Pattern: Check if this parser can handle the combination
   */
  abstract canHandle(
    provider: string,
    channel: string,
    implementation: string,
  ): boolean;

  /**
   * Parse webhook data into MessageContext array
   */
  abstract parse(
    parsedData: ParsedWebhookData,
    webhookEvent: WebhookEventContext,
  ): Promise<ParseResult<MessageContext[]>>;

  /**
   * Create a MessageContext from a TypedMessage
   *
   * @param typedMessage - The normalized message
   * @param accountId - Account ID (multi-tenancy)
   * @param projectId - Project ID (optional)
   * @param threadId - Thread/conversation ID (optional)
   * @param webhookEventId - Original webhook event ID (for tracing)
   * @returns MessageContext ready for pipeline
   */
  protected createMessageContext(
    typedMessage: TypedMessage,
    accountId: string,
    projectId?: string,
    threadId?: string,
    webhookEventId?: string,
  ): MessageContext {
    return {
      message: typedMessage,
      accountId,
      projectId,
      threadId,
      webhookEventId,
      startedAt: new Date(),
      metadata: {},
      executionHistory: [],
    };
  }

  /**
   * Map channel string to ChatChannel enum
   */
  protected mapChannel(channel?: string | null): ChatChannel {
    if (!channel) {
      return ChatChannel.WHATSAPP;
    }

    const upperChannel = channel.toUpperCase().replace(/-/g, '_');

    if (Object.values(ChatChannel).includes(upperChannel as ChatChannel)) {
      return upperChannel as ChatChannel;
    }

    // Fallback to WhatsApp
    return ChatChannel.WHATSAPP;
  }

  /**
   * Map provider string to ChatProvider enum
   */
  protected mapProvider(provider: string): ChatProvider {
    const upperProvider = provider.toUpperCase().replace(/-/g, '_');

    if (Object.values(ChatProvider).includes(upperProvider as ChatProvider)) {
      return upperProvider as ChatProvider;
    }

    // Default fallback
    return ChatProvider.WHATICKET;
  }

  /**
   * Map implementation string to ChatImplementation enum
   */
  protected mapImplementation(
    implementation?: string | null,
  ): ChatImplementation | undefined {
    if (!implementation) {
      return undefined;
    }

    const upperImpl = implementation.toUpperCase().replace(/-/g, '_');

    if (
      Object.values(ChatImplementation).includes(upperImpl as ChatImplementation)
    ) {
      return upperImpl as ChatImplementation;
    }

    return undefined;
  }

  /**
   * Extract MIME type from filename extension
   *
   * @param filename - Filename with extension
   * @returns MIME type or undefined
   */
  protected extractMimeTypeFromFilename(filename: string): string | undefined {
    if (!filename) {
      return undefined;
    }

    const extension = filename.split('.').pop()?.toLowerCase();

    const mimeTypeMap: Record<string, string> = {
      // Images
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      bmp: 'image/bmp',
      ico: 'image/x-icon',

      // Videos
      mp4: 'video/mp4',
      avi: 'video/avi',
      mov: 'video/quicktime',
      wmv: 'video/x-ms-wmv',
      flv: 'video/x-flv',
      webm: 'video/webm',
      mkv: 'video/x-matroska',

      // Audio
      oga: 'audio/ogg',
      ogg: 'audio/ogg',
      opus: 'audio/opus',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      m4a: 'audio/mp4',
      aac: 'audio/aac',
      flac: 'audio/flac',

      // Documents
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain',
      csv: 'text/csv',
      xml: 'application/xml',
      json: 'application/json',
      zip: 'application/zip',
      rar: 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
    };

    return extension ? mimeTypeMap[extension] : undefined;
  }

  /**
   * Extract filename from body/path string
   * Handles paths like "/uploads/1234_document.pdf"
   *
   * @param body - Body string containing filename or path
   * @returns Extracted filename
   */
  protected extractFilenameFromBody(body: string): string {
    if (!body) {
      return 'document';
    }

    // Get last part after slash
    const lastSlashIndex = body.lastIndexOf('/');
    const filename = lastSlashIndex >= 0 ? body.substring(lastSlashIndex + 1) : body;

    // Remove timestamp prefix if present (e.g., "1234_document.pdf" -> "document.pdf")
    const underscoreIndex = filename.indexOf('_');
    const cleanFilename =
      underscoreIndex >= 0 ? filename.substring(underscoreIndex + 1) : filename;

    return cleanFilename || 'document';
  }

  /**
   * Generate a unique message ID (UUID v4)
   */
  protected generateMessageId(): string {
    return randomUUID();
  }

  /**
   * Safe string normalization (lowercase, trim)
   */
  protected normalizeString(value?: string | null): string {
    if (!value) {
      return '';
    }
    return value.toLowerCase().trim();
  }

  /**
   * Check if a value exists in an object (type-safe)
   */
  protected hasField(obj: any, field: string): boolean {
    return obj && typeof obj === 'object' && field in obj;
  }

  /**
   * Get field value with default fallback (type-safe)
   */
  protected getField<T>(obj: any, field: string, defaultValue?: T): T | undefined {
    if (this.hasField(obj, field)) {
      return obj[field] as T;
    }
    return defaultValue;
  }
}
