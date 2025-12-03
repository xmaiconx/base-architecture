import { Injectable } from '@nestjs/common';
import { ParsedWebhookData } from '@fnd/backend';
import { BaseWebhookParser } from '../base/base-webhook-parser';

// ==================== Type Definitions ====================

interface WhaticketContact {
  id?: number;
  name?: string;
  number?: string;
  email?: string;
  profilePicUrl?: string;
}

interface WhaticketUser {
  id?: number;
  name?: string;
  email?: string;
}

interface WhaticketWhatsappConnection {
  id?: number;
  name?: string;
  status?: string;
}

interface WhaticketQueue {
  id?: number;
  name?: string;
}

interface WhaticketTicket {
  id?: number;
  contactId?: number;
  whatsappId?: number;
  queueId?: number;
  protocolo?: string;
  isGroup?: boolean;
  contact?: WhaticketContact;
  whatsapp?: WhaticketWhatsappConnection;
  queue?: WhaticketQueue;
}

interface WhaticketMessage {
  id?: number;
  wid?: string;
  ticketId?: number;
  contactId?: number;
  companyId?: number;
  body?: string;
  mediaType?: string;
  mediaUrl?: string;
  fromMe?: boolean;
  participant?: string;
  quotedMsgId?: string;
  ack?: number;
  createdAt?: string;
  originalAt?: string;
  duration?: number;
  caption?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  name?: string;
  contactName?: string;
  vcard?: string;
  animated?: boolean;
  isVoiceNote?: boolean;
  queueId?: number;
  contact?: WhaticketContact;
  ticket?: WhaticketTicket;
  user?: WhaticketUser | null;
}

interface InboundMessageItem {
  type: string;
  text?: string;
  fileUrl?: string;
  fileName?: string;
  fileMimeType?: string;
  caption?: string;
  contact?: WhaticketContact;
  ticket?: WhaticketTicket;
  ticketId?: number;
  contactId?: number;
  companyId?: number;
  originalAt?: string;
  createdAt?: string;
  id?: number;
  wid?: string;
  participant?: string;
  fromMe?: boolean;
}

interface WhaticketOfficialWebhookPayload {
  acao: string;
  fromMe?: boolean;
  mensagem: WhaticketMessage | InboundMessageItem[] | unknown;
  sender?: string;
  name?: string;
  chamadoId?: number;
  ticketData?: WhaticketTicket;
  companyId?: number;
}

interface MessageContent {
  type: string;
  text?: string;
  url?: string;
  caption?: string;
  mimeType?: string;
  filename?: string;
  duration?: number;
  isVoiceNote?: boolean;
  latitude?: number;
  longitude?: number;
  address?: string;
  name?: string;
  vcard?: string;
  animated?: boolean;
}

interface ParsedMetadata {
  provider: string;
  channel: string;
  implementation: string;
  direction: 'inbound' | 'outbound';
  role: 'contact' | 'ai' | 'attendant';
  senderName: string;
  messageType: string;
  contactInfo?: {
    name?: string;
    phone?: string;
    email?: string;
    contactId?: number;
    profilePicUrl?: string;
    isGroup?: boolean;
    whatsappConnectionName?: string;
    companyId?: number;
  };
  ticketInfo?: {
    ticketId?: number;
    queueId?: number;
    whatsappId?: number;
    protocol?: string;
    isGroup?: boolean;
    queueName?: string;
    whatsappConnectionName?: string;
    whatsappStatus?: string;
  };
  messageContent: MessageContent;
  timestamp: string;
  rawPayload: unknown;
}

// ==================== Parser Implementation ====================

/**
 * Parser para webhooks: Whaticket + WhatsApp + Official (Cloud API)
 *
 * Suporta dois tipos de mensagens:
 * - Inbound (acao = "start"): Mensagens recebidas de contatos
 * - Outbound (acao = "from_internal", fromMe = true): Mensagens enviadas (AI ou atendente)
 */
@Injectable()
export class WhaticketWhatsappOfficialParser extends BaseWebhookParser<
  WhaticketOfficialWebhookPayload,
  ParsedMetadata
> {
  readonly providerName = 'WHATICKET';
  readonly defaultQueueName = 'webhook-whaticket-whatsapp-official';

  async parse(payload: WhaticketOfficialWebhookPayload): Promise<ParsedWebhookData<ParsedMetadata>> {
    if (!payload || !payload.mensagem) {
      throw new Error('Invalid Whaticket Official API payload: missing mensagem wrapper');
    }

    // Extrai objeto de mensagem unificado
    const mensagem = this.getMensagemObject(payload);
    if (!mensagem) {
      throw new Error('Invalid Whaticket Official API payload: unable to extract message');
    }

    // Determina direção e role
    const direction = this.determineDirection(payload);
    const role = this.determineRole(payload, mensagem);

    // Extrai sender ID
    const senderId = this.extractSenderId(payload);

    // Extrai sender name
    const senderName = this.getSenderName(payload, mensagem, role);

    // Parseia conteúdo da mensagem
    const messageContent = this.parseMessageContent(mensagem);

    // Extrai informações de contato
    const contactInfo = this.extractContactInfo(mensagem);

    // Extrai informações do ticket
    const ticketInfo = this.extractTicketInfo(mensagem);

    // Determina event name baseado na direção e role
    const eventName = this.buildEventName(direction, role);

    // Monta metadata
    const metadata: ParsedMetadata = {
      provider: this.providerName,
      channel: 'WHATSAPP',
      implementation: 'OFFICIAL',
      direction,
      role,
      senderName,
      messageType: messageContent.type,
      contactInfo,
      ticketInfo,
      messageContent,
      timestamp: (mensagem as any).originalAt || (mensagem as any).createdAt || new Date().toISOString(),
      rawPayload: payload,
    };

    return {
      eventName,
      queueName: this.defaultQueueName,
      senderId,
      metadata,
    };
  }

  /**
   * Extrai o ID do remetente do payload
   */
  protected extractSenderId(payload: WhaticketOfficialWebhookPayload): string | null {
    if (!payload || !payload.mensagem) {
      return null;
    }

    const mensagem = this.getMensagemObject(payload);
    if (!mensagem) {
      return null;
    }

    // Para mensagens outbound, pode vir do payload ou do contato
    if (payload.acao === 'from_internal') {
      return payload.sender || (mensagem as WhaticketMessage).contact?.number || null;
    }

    // Para mensagens inbound, pega do contato ou participant
    const contact = (mensagem as WhaticketMessage).contact || (mensagem as InboundMessageItem).contact;
    const participant = (mensagem as any).participant;

    return contact?.number || participant?.split('@')[0] || null;
  }

  /**
   * Obtém o objeto de mensagem de forma unificada
   * Trata tanto array (inbound) quanto objeto (outbound)
   */
  private getMensagemObject(payload: WhaticketOfficialWebhookPayload): WhaticketMessage | InboundMessageItem | null {
    if (!payload.mensagem) {
      return null;
    }

    // Inbound: mensagem é array - pega primeiro item
    if (Array.isArray(payload.mensagem)) {
      const messageItem = payload.mensagem[0] as InboundMessageItem;
      if (!messageItem) return null;

      // Merge com dados do ticket do payload
      return {
        ...messageItem,
        ticket: payload.ticketData,
        contact: payload.ticketData?.contact,
        ticketId: payload.chamadoId,
        contactId: payload.ticketData?.contactId,
        companyId: payload.companyId,
      } as any;
    }

    // Outbound: mensagem é objeto
    return payload.mensagem as WhaticketMessage;
  }

  /**
   * Determina direção da mensagem (inbound/outbound)
   */
  private determineDirection(payload: WhaticketOfficialWebhookPayload): 'inbound' | 'outbound' {
    const { acao, fromMe } = payload;

    if (acao === 'start') {
      return 'inbound';
    }

    if (acao === 'from_internal' && fromMe === true) {
      return 'outbound';
    }

    return 'inbound'; // default fallback
  }

  /**
   * Determina role do remetente (contact/ai/attendant)
   */
  private determineRole(
    payload: WhaticketOfficialWebhookPayload,
    mensagem: WhaticketMessage | InboundMessageItem
  ): 'contact' | 'ai' | 'attendant' {
    const direction = this.determineDirection(payload);

    // Mensagens inbound são sempre do contato
    if (direction === 'inbound') {
      return 'contact';
    }

    // Mensagens outbound: verifica se tem usuário
    // user === null → AI
    // user !== null → attendant
    const user = (mensagem as WhaticketMessage).user;
    if (user === null) {
      return 'ai';
    }

    return 'attendant';
  }

  /**
   * Extrai nome do remetente
   */
  private getSenderName(
    payload: WhaticketOfficialWebhookPayload,
    mensagem: WhaticketMessage | InboundMessageItem,
    role: string
  ): string {
    if (role === 'contact') {
      const contact = (mensagem as any).contact;
      return contact?.name || payload.name || 'Unknown Contact';
    }

    if (role === 'ai') {
      return 'AI Assistant';
    }

    if (role === 'attendant') {
      const user = (mensagem as WhaticketMessage).user;
      return user?.name || 'Attendant';
    }

    return 'Unknown Sender';
  }

  /**
   * Parseia conteúdo da mensagem baseado no tipo
   */
  private parseMessageContent(mensagem: WhaticketMessage | InboundMessageItem): MessageContent {
    // Se é uma mensagem inbound (formato do webhook)
    if ('type' in mensagem && typeof mensagem.type === 'string') {
      return this.parseInboundMessageContent(mensagem as InboundMessageItem);
    }

    // Se é uma mensagem outbound (formato tradicional Whaticket)
    return this.parseOutboundMessageContent(mensagem as WhaticketMessage);
  }

  /**
   * Parseia mensagem inbound (formato webhook)
   */
  private parseInboundMessageContent(messageItem: InboundMessageItem): MessageContent {
    const { type, text, fileUrl, fileName, fileMimeType, caption } = messageItem;

    switch (type) {
      case 'text':
        return {
          type: 'text',
          text: text || '[No content]',
        };

      case 'image':
        return {
          type: 'image',
          url: fileUrl || '',
          caption: caption || undefined,
          mimeType: fileMimeType || 'image/jpeg',
        };

      case 'audio':
        return {
          type: 'audio',
          url: fileUrl || '',
          mimeType: fileMimeType || 'audio/ogg',
          isVoiceNote: fileMimeType?.includes('opus') || false,
        };

      case 'video':
        return {
          type: 'video',
          url: fileUrl || '',
          caption: caption || undefined,
          mimeType: fileMimeType || 'video/mp4',
        };

      case 'document':
        return {
          type: 'document',
          url: fileUrl || '',
          filename: fileName || 'document',
          mimeType: fileMimeType || 'application/octet-stream',
          caption: caption || undefined,
        };

      default:
        return {
          type: 'text',
          text: text || `[Unsupported message type: ${type}]`,
        };
    }
  }

  /**
   * Parseia mensagem outbound (formato tradicional Whaticket)
   */
  private parseOutboundMessageContent(mensagem: WhaticketMessage): MessageContent {
    const messageType = mensagem.mediaType || 'conversation';

    switch (messageType) {
      case 'conversation':
      case 'extendedTextMessage':
        return {
          type: 'text',
          text: mensagem.body || '[No content]',
        };

      case 'image':
      case 'imageMessage':
        return {
          type: 'image',
          url: mensagem.mediaUrl || '',
          caption: mensagem.body,
          mimeType: this.extractMimeTypeFromFilename(mensagem.body) || 'image/jpeg',
        };

      case 'audio':
      case 'audioMessage':
      case 'ptt':
        return {
          type: 'audio',
          url: mensagem.mediaUrl || '',
          duration: mensagem.duration,
          mimeType: this.extractMimeTypeFromFilename(mensagem.body) || 'audio/ogg',
          isVoiceNote: messageType === 'ptt' || mensagem.isVoiceNote || false,
        };

      case 'video':
      case 'videoMessage':
        return {
          type: 'video',
          url: mensagem.mediaUrl || '',
          caption: mensagem.caption || mensagem.body,
          mimeType: this.extractMimeTypeFromFilename(mensagem.body) || 'video/mp4',
          duration: mensagem.duration,
        };

      case 'document':
      case 'documentMessage':
        return {
          type: 'document',
          url: mensagem.mediaUrl || '',
          filename: this.extractFilenameFromBody(mensagem.body) || 'document',
          mimeType: this.extractMimeTypeFromFilename(mensagem.body) || 'application/octet-stream',
          caption: mensagem.caption,
        };

      case 'location':
      case 'locationMessage':
        return {
          type: 'location',
          latitude: mensagem.latitude || 0,
          longitude: mensagem.longitude || 0,
          address: mensagem.address,
          name: mensagem.name,
        };

      case 'contact':
      case 'contactMessage':
        return {
          type: 'contact',
          name: mensagem.contactName || mensagem.name || '',
          vcard: mensagem.vcard,
        };

      case 'sticker':
      case 'stickerMessage':
        return {
          type: 'sticker',
          url: mensagem.mediaUrl || '',
          animated: mensagem.animated || false,
        };

      default:
        return {
          type: 'text',
          text: mensagem.body || '[Unsupported message type]',
        };
    }
  }

  /**
   * Extrai informações de contato
   */
  private extractContactInfo(mensagem: WhaticketMessage | InboundMessageItem) {
    const contact = (mensagem as any).contact as WhaticketContact | undefined;
    const ticket = (mensagem as any).ticket as WhaticketTicket | undefined;
    const companyId = (mensagem as any).companyId;

    if (!contact) {
      return undefined;
    }

    return {
      name: contact.name,
      phone: contact.number,
      email: contact.email,
      contactId: contact.id,
      profilePicUrl: contact.profilePicUrl,
      isGroup: ticket?.isGroup || false,
      whatsappConnectionName: ticket?.whatsapp?.name,
      companyId,
    };
  }

  /**
   * Extrai informações do ticket
   */
  private extractTicketInfo(mensagem: WhaticketMessage | InboundMessageItem) {
    const ticket = (mensagem as any).ticket as WhaticketTicket | undefined;
    const ticketId = (mensagem as any).ticketId;
    const queueId = (mensagem as any).queueId;

    if (!ticket && !ticketId) {
      return undefined;
    }

    return {
      ticketId: ticket?.id || ticketId,
      queueId: ticket?.queueId || queueId,
      whatsappId: ticket?.whatsappId,
      protocol: ticket?.protocolo,
      isGroup: ticket?.isGroup || false,
      queueName: ticket?.queue?.name,
      whatsappConnectionName: ticket?.whatsapp?.name,
      whatsappStatus: ticket?.whatsapp?.status,
    };
  }

  /**
   * Constrói nome do evento baseado em direção e role
   */
  private buildEventName(direction: 'inbound' | 'outbound', role: 'contact' | 'ai' | 'attendant'): string {
    if (direction === 'inbound') {
      return 'message.received.whaticket.whatsapp.official';
    }

    if (role === 'ai') {
      return 'message.sent.ai.whaticket.whatsapp.official';
    }

    return 'message.sent.attendant.whaticket.whatsapp.official';
  }

  /**
   * Extrai nome do arquivo do campo body
   */
  private extractFilenameFromBody(body?: string): string {
    if (!body) return 'document';

    const lastSlashIndex = body.lastIndexOf('/');
    const filename = lastSlashIndex >= 0 ? body.substring(lastSlashIndex + 1) : body;

    const underscoreIndex = filename.indexOf('_');
    return underscoreIndex >= 0 ? filename.substring(underscoreIndex + 1) : filename;
  }

  /**
   * Extrai MIME type da extensão do arquivo
   */
  private extractMimeTypeFromFilename(filename?: string): string | undefined {
    if (!filename) return undefined;

    const extension = filename.split('.').pop()?.toLowerCase();

    const mimeTypeMap: Record<string, string> = {
      // Images
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      // Videos
      mp4: 'video/mp4',
      avi: 'video/avi',
      mov: 'video/quicktime',
      // Audio
      oga: 'audio/ogg',
      ogg: 'audio/ogg',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      // Documents
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    return extension ? mimeTypeMap[extension] : undefined;
  }
}
