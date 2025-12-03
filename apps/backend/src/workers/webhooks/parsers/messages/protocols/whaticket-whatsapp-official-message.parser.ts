import { Injectable } from '@nestjs/common';
import {
  ParsedWebhookData,
  WebhookEventContext,
  ParseResult,
} from '@fnd/backend';
import {
  MessageContext,
  TypedMessage,
  MessageType,
  MessageDirection,
  MessageParticipant,
  TextContent,
  AudioContent,
  VideoContent,
  ImageContent,
  DocumentContent,
  StickerContent,
  ContactContent,
  LocationContent,
  Contact,
} from '@fnd/domain';
import { BaseMessageParser } from '../base/base-message-parser';

/**
 * Whaticket Payload Type Definitions
 */
interface WhaticketContact {
  id?: number | string;
  name?: string;
  number?: string;
  email?: string;
  profilePicUrl?: string;
}

interface WhaticketUser {
  id?: number | string;
  name?: string;
  email?: string;
}

interface WhaticketWhatsapp {
  id?: number | string;
  name?: string;
  status?: string;
}

interface WhaticketQueue {
  id?: number | string;
  name?: string;
}

interface WhaticketTicket {
  id?: number | string;
  uuid?: string;
  isGroup?: boolean;
  contactId?: number | string;
  whatsappId?: number | string;
  queueId?: number | string;
  protocolo?: string;
  contact?: WhaticketContact;
  whatsapp?: WhaticketWhatsapp;
  queue?: WhaticketQueue;
}

interface WhaticketMessage {
  id?: number | string;
  wid?: string;
  body?: string;
  mediaType?: string;
  mediaUrl?: string;
  fromMe?: boolean;
  ack?: number;
  participant?: string;
  ticketId?: number | string;
  contactId?: number | string;
  companyId?: number | string;
  queueId?: number | string;
  createdAt?: string;
  originalAt?: string;
  duration?: number;
  isVoiceNote?: boolean;
  animated?: boolean;
  caption?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  name?: string;
  contactName?: string;
  vcard?: string;
  contact?: WhaticketContact;
  ticket?: WhaticketTicket;
  user?: WhaticketUser | null;
}

interface WhaticketInboundMessage {
  type: string;
  text?: string;
  fileUrl?: string;
  fileName?: string;
  fileMimeType?: string;
  caption?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  name?: string;
  vcard?: string;
  contacts?: any[];
}

interface WhaticketPayload {
  acao?: string;
  fromMe?: boolean;
  sender?: string;
  name?: string;
  chamadoId?: number | string;
  companyId?: number | string;
  mensagem?: WhaticketMessage | WhaticketInboundMessage[] | any;
  ticketData?: WhaticketTicket;
}

/**
 * Whaticket WhatsApp Official Message Parser
 *
 * Parses messages from Whaticket (WhatsApp Official API implementation)
 *
 * Supported message types:
 * - Text, Audio, Video, Image, Document
 * - Sticker, Contact, Location
 *
 * Handles both inbound and outbound messages:
 * - Inbound: acao = "start", mensagem is array
 * - Outbound: acao = "from_internal", mensagem is object
 */
@Injectable()
export class WhaticketWhatsappOfficialMessageParser extends BaseMessageParser {
  /**
   * Strategy Pattern: Check if this parser handles Whaticket WhatsApp Official
   */
  canHandle(provider: string, channel: string, implementation: string): boolean {
    return (
      this.normalizeString(provider) === 'whaticket' &&
      this.normalizeString(channel) === 'whatsapp' &&
      this.normalizeString(implementation) === 'official'
    );
  }

  /**
   * Parse Whaticket WhatsApp Official webhook into MessageContext array
   */
  async parse(
    parsedData: ParsedWebhookData,
    webhookEvent: WebhookEventContext,
  ): Promise<ParseResult<MessageContext[]>> {
    try {
      const payload = webhookEvent.payload as WhaticketPayload;

      // 1. Extract sender info ONCE (optimization - root level)
      const senderId = payload.sender ?? 'unknown';
      const senderName = payload.name;

      // Extract sender phone from nested contact
      let senderPhone: string | undefined;
      if (payload.ticketData?.contact?.number) {
        senderPhone = payload.ticketData.contact.number;
      } else if (Array.isArray(payload.mensagem) && payload.mensagem.length > 0) {
        // For inbound, contact is merged into message
        senderPhone = payload.mensagem[0].contact?.number;
      } else if (payload.mensagem && !Array.isArray(payload.mensagem)) {
        // For outbound, contact is in mensagem object
        senderPhone = (payload.mensagem as any).contact?.number;
      }

      // 2. Extract thread identifier ONCE (optimization)
      const threadIdentifier = {
        ticketId: payload.chamadoId?.toString(),
        ticketUuid: payload.ticketData?.uuid ?? (payload.mensagem as any)?.ticket?.uuid,
        contactId: (
          payload.ticketData?.contactId ??
          (payload.mensagem as any)?.contactId
        )?.toString(),
      };

      // 3. Extract messages (can be array or single object)
      const messages = this.extractMessages(payload);

      if (messages.length === 0) {
        return {
          success: false,
          error: new Error('No messages found in payload'),
        };
      }

      // 4. Parse each message into MessageContext
      const contexts: MessageContext[] = [];

      for (const messageData of messages) {
        const typedMessage = this.parseMessage(messageData, payload, webhookEvent);

        const context = this.createMessageContext(
          typedMessage,
          webhookEvent.accountId,
          webhookEvent.projectId ?? undefined,
          undefined, // threadId will be created in pipeline
          webhookEvent.id,
        );

        contexts.push(context);
      }

      // 5. Return with batchContext (optimization)
      return {
        success: true,
        data: contexts,
        metadata: {
          messageCount: contexts.length,
          parsedAt: new Date(),
          provider: 'whaticket',
          channel: 'whatsapp',
          implementation: 'official',
        },
        batchContext: {
          provider: 'whaticket',
          channel: 'whatsapp',
          implementation: 'official',
          senderId,
          senderName,
          senderPhone,
          accountId: webhookEvent.accountId,
          projectId: webhookEvent.projectId ?? undefined,
          threadIdentifier,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Extract messages from payload
   * Handles both inbound (array) and outbound (object) formats
   */
  private extractMessages(payload: WhaticketPayload): any[] {
    if (!payload.mensagem) {
      return [];
    }

    // Inbound messages: mensagem is array
    if (Array.isArray(payload.mensagem)) {
      return payload.mensagem.map((msg) => ({
        ...msg,
        // Merge ticket data from payload level
        ticket: payload.ticketData,
        contact: payload.ticketData?.contact,
        ticketId: payload.chamadoId,
        contactId: payload.ticketData?.contactId,
        companyId: payload.companyId,
      }));
    }

    // Outbound messages: mensagem is object
    return [payload.mensagem];
  }

  /**
   * Parse a single message into TypedMessage
   */
  private parseMessage(
    messageData: any,
    payload: WhaticketPayload,
    webhookEvent: WebhookEventContext,
  ): TypedMessage {
    const direction = this.determineDirection(payload);
    const role = this.determineRole(payload, messageData);

    // Extract sender info
    const senderId = this.extractSenderId(messageData, payload);
    const senderName = this.getSenderName(messageData, payload, role);

    // Parse content based on message type
    const messageType = this.detectMessageType(messageData);
    const content = this.parseMessageContent(messageData, messageType);

    // Build message metadata
    const from: MessageParticipant = {
      id: senderId,
      name: senderName,
      phone: messageData.contact?.number ?? undefined,
      email: messageData.contact?.email ?? undefined,
    };

    const to: MessageParticipant = {
      id: 'system', // TODO: determine proper receiver ID
    };

    // Create TypedMessage
    const typedMessage: TypedMessage = {
      id: this.generateMessageId(),
      type: messageType,
      direction,
      timestamp: messageData.originalAt
        ? new Date(messageData.originalAt)
        : messageData.createdAt
          ? new Date(messageData.createdAt)
          : new Date(),
      content,
      metadata: {
        accountId: webhookEvent.accountId,
        from,
        to,
        channel: this.mapChannel(webhookEvent.channel),
        provider: this.mapProvider(webhookEvent.provider),
        implementation: this.mapImplementation(webhookEvent.implementation),
        externalId: messageData.id?.toString() ?? messageData.wid ?? undefined,
        wamid: messageData.wid ?? undefined,
        ticketId: messageData.ticketId?.toString() ?? messageData.ticket?.id?.toString(),
        contactId: messageData.contactId?.toString() ?? messageData.contact?.id?.toString(),
        custom: {
          acao: payload.acao,
          role,
          companyId: messageData.companyId,
          queueId: messageData.queueId,
          isGroup: messageData.ticket?.isGroup ?? false,
          participant: messageData.participant,
          fromMe: messageData.fromMe,
          ack: messageData.ack,
          userInfo: messageData.user,
        },
      },
    };

    return typedMessage;
  }

  /**
   * Extract sender ID from message data
   */
  private extractSenderId(messageData: any, payload: WhaticketPayload): string {
    // Outbound: sender from payload or contact
    if (payload.acao === 'from_internal') {
      return payload.sender ?? messageData.contact?.number ?? 'unknown';
    }

    // Inbound: from contact or participant
    return (
      messageData.contact?.number ??
      messageData.participant?.split('@')[0] ??
      'unknown'
    );
  }

  /**
   * Determine message direction (inbound/outbound)
   */
  private determineDirection(payload: WhaticketPayload): MessageDirection {
    if (payload.acao === 'start') {
      return MessageDirection.INCOMING;
    }

    if (payload.acao === 'from_internal' && payload.fromMe === true) {
      return MessageDirection.OUTGOING;
    }

    return MessageDirection.INCOMING;
  }

  /**
   * Determine sender role (contact/ai/attendant)
   */
  private determineRole(
    payload: WhaticketPayload,
    messageData: any,
  ): 'contact' | 'ai' | 'attendant' {
    const direction = this.determineDirection(payload);

    if (direction === MessageDirection.INCOMING) {
      return 'contact';
    }

    // Outbound: check if user is null (AI) or not (attendant)
    if (messageData.user === null) {
      return 'ai';
    }

    return 'attendant';
  }

  /**
   * Get sender name based on role
   */
  private getSenderName(
    messageData: any,
    payload: WhaticketPayload,
    role: string,
  ): string {
    if (role === 'contact') {
      return (
        messageData.contact?.name ?? payload.name ?? messageData.name ?? 'Unknown Contact'
      );
    }

    if (role === 'ai') {
      return 'AI Assistant';
    }

    if (role === 'attendant') {
      return messageData.user?.name ?? 'Attendant';
    }

    return 'Unknown Sender';
  }

  /**
   * Detect message type from message data
   */
  private detectMessageType(messageData: any): MessageType {
    // Check 'type' field (inbound format)
    if (messageData.type) {
      const type = messageData.type.toLowerCase();
      switch (type) {
        case 'text':
          return MessageType.TEXT;
        case 'image':
          return MessageType.IMAGE;
        case 'audio':
          return MessageType.AUDIO;
        case 'video':
          return MessageType.VIDEO;
        case 'document':
          return MessageType.DOCUMENT;
        case 'sticker':
          return MessageType.STICKER;
        case 'contact':
          return MessageType.CONTACT;
        case 'location':
          return MessageType.LOCATION;
      }
    }

    // Check 'mediaType' field (outbound format)
    if (messageData.mediaType) {
      const mediaType = messageData.mediaType.toLowerCase();
      switch (mediaType) {
        case 'conversation':
        case 'extendedtextmessage':
          return MessageType.TEXT;
        case 'image':
        case 'imagemessage':
          return MessageType.IMAGE;
        case 'audio':
        case 'audiomessage':
        case 'ptt':
          return MessageType.AUDIO;
        case 'video':
        case 'videomessage':
          return MessageType.VIDEO;
        case 'document':
        case 'documentmessage':
          return MessageType.DOCUMENT;
        case 'sticker':
        case 'stickermessage':
          return MessageType.STICKER;
        case 'contact':
        case 'contactmessage':
          return MessageType.CONTACT;
        case 'location':
        case 'locationmessage':
          return MessageType.LOCATION;
      }
    }

    // Default to TEXT
    return MessageType.TEXT;
  }

  /**
   * Parse message content based on type
   */
  private parseMessageContent(messageData: any, messageType: MessageType): any {
    switch (messageType) {
      case MessageType.TEXT:
        return this.parseTextContent(messageData);
      case MessageType.AUDIO:
        return this.parseAudioContent(messageData);
      case MessageType.VIDEO:
        return this.parseVideoContent(messageData);
      case MessageType.IMAGE:
        return this.parseImageContent(messageData);
      case MessageType.DOCUMENT:
        return this.parseDocumentContent(messageData);
      case MessageType.STICKER:
        return this.parseStickerContent(messageData);
      case MessageType.CONTACT:
        return this.parseContactContent(messageData);
      case MessageType.LOCATION:
        return this.parseLocationContent(messageData);
      default:
        return this.parseTextContent(messageData);
    }
  }

  /**
   * Parse TEXT content
   */
  private parseTextContent(messageData: any): TextContent {
    return {
      text: messageData.text ?? messageData.body ?? '[No content]',
      previewUrls: true,
    };
  }

  /**
   * Parse AUDIO content
   */
  private parseAudioContent(messageData: any): AudioContent {
    const url = messageData.fileUrl ?? messageData.mediaUrl;
    const mimeType =
      messageData.fileMimeType ??
      this.extractMimeTypeFromFilename(messageData.body ?? messageData.fileName ?? '') ??
      'audio/ogg';

    if (url) {
      return {
        source: 'url',
        url,
        mimeType,
        duration: messageData.duration ?? undefined,
        transcript: undefined,
      };
    }

    // Fallback to empty base64 if no URL available
    return {
      source: 'base64',
      base64: '',
      mimeType,
      duration: messageData.duration ?? undefined,
      transcript: undefined,
    };
  }

  /**
   * Parse VIDEO content
   */
  private parseVideoContent(messageData: any): VideoContent {
    const url = messageData.fileUrl ?? messageData.mediaUrl;
    const mimeType =
      messageData.fileMimeType ??
      this.extractMimeTypeFromFilename(messageData.body ?? messageData.fileName ?? '') ??
      'video/mp4';

    if (url) {
      return {
        source: 'url',
        url,
        mimeType,
        caption: messageData.caption ?? messageData.body ?? undefined,
        thumbnail: undefined,
        duration: messageData.duration ?? undefined,
      };
    }

    // Fallback to empty base64 if no URL available
    return {
      source: 'base64',
      base64: '',
      mimeType,
      caption: messageData.caption ?? messageData.body ?? undefined,
      thumbnail: undefined,
      duration: messageData.duration ?? undefined,
    };
  }

  /**
   * Parse IMAGE content
   */
  private parseImageContent(messageData: any): ImageContent {
    const url = messageData.fileUrl ?? messageData.mediaUrl;
    const mimeType =
      messageData.fileMimeType ??
      this.extractMimeTypeFromFilename(messageData.body ?? messageData.fileName ?? '') ??
      'image/jpeg';

    if (url) {
      return {
        source: 'url',
        url,
        mimeType,
        caption: messageData.caption ?? messageData.body ?? undefined,
        width: undefined,
        height: undefined,
      };
    }

    // Fallback to empty base64 if no URL available
    return {
      source: 'base64',
      base64: '',
      mimeType,
      caption: messageData.caption ?? messageData.body ?? undefined,
      width: undefined,
      height: undefined,
    };
  }

  /**
   * Parse DOCUMENT content
   */
  private parseDocumentContent(messageData: any): DocumentContent {
    const url = messageData.fileUrl ?? messageData.mediaUrl;
    const filename =
      messageData.fileName ?? this.extractFilenameFromBody(messageData.body ?? 'document');
    const mimeType =
      messageData.fileMimeType ??
      this.extractMimeTypeFromFilename(filename) ??
      'application/octet-stream';

    if (url) {
      return {
        source: 'url',
        url,
        mimeType,
        fileName: filename,
        fileSize: undefined,
        caption: messageData.caption ?? undefined,
      };
    }

    // Fallback to empty base64 if no URL available
    return {
      source: 'base64',
      base64: '',
      mimeType,
      fileName: filename,
      fileSize: undefined,
      caption: messageData.caption ?? undefined,
    };
  }

  /**
   * Parse STICKER content
   */
  private parseStickerContent(messageData: any): StickerContent {
    const url = messageData.fileUrl ?? messageData.mediaUrl;

    if (url) {
      return {
        source: 'url',
        url,
        mimeType: messageData.fileMimeType ?? 'image/webp',
        animated: messageData.animated ?? false,
      };
    }

    // Fallback to empty base64 if no URL available
    return {
      source: 'base64',
      base64: '',
      mimeType: messageData.fileMimeType ?? 'image/webp',
      animated: messageData.animated ?? false,
    };
  }

  /**
   * Parse CONTACT content
   */
  private parseContactContent(messageData: any): ContactContent {
    const contacts: Contact[] = [];

    // Handle vCard format
    if (messageData.vcard) {
      const contact: Contact = {
        name: {
          formatted: messageData.contactName ?? messageData.name ?? 'Unknown',
        },
        phones: [],
        emails: [],
      };

      // Parse vCard (basic parsing - TODO: implement proper vCard parser if needed)
      if (messageData.contact?.number) {
        contact.phones?.push({
          phone: messageData.contact.number,
          type: 'CELL',
        });
      }

      contacts.push(contact);
    }

    // Handle contacts array
    if (messageData.contacts && Array.isArray(messageData.contacts)) {
      for (const c of messageData.contacts) {
        contacts.push({
          name: {
            formatted: c.name ?? 'Unknown',
          },
          phones: c.phones ?? [],
          emails: c.emails ?? [],
        });
      }
    }

    return { contacts };
  }

  /**
   * Parse LOCATION content
   */
  private parseLocationContent(messageData: any): LocationContent {
    return {
      latitude: messageData.latitude ?? 0,
      longitude: messageData.longitude ?? 0,
      name: messageData.name ?? undefined,
      address: messageData.address ?? undefined,
      url: undefined,
    };
  }
}
