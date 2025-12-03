import { TypedMessage, CreateMessagePayload } from '@fnd/domain';

/**
 * Message Repository Interface
 *
 * Manages messages following the internal message protocol.
 * Stores normalized messages from all providers.
 */

/**
 * DTO para criar uma mensagem (omitindo campos gerados)
 */
export interface CreateMessageData {
  accountId: string;
  projectId: string;
  threadId: string;
  webhookEventId?: string | null;

  // Message protocol fields
  type: string;
  direction: string;
  role?: string | null;
  status?: string | null;

  // Sender information
  senderId: string;
  senderName?: string | null;
  senderPhone?: string | null;

  // Receiver information
  receiverId?: string | null;
  receiverName?: string | null;

  // Message content (varies by type)
  content: unknown;

  // Rich metadata
  metadata?: Record<string, unknown> | null;

  // External references
  externalId?: string | null;
  channel: string;
  provider: string;
  implementation?: string | null;

  // Timestamp
  messageTimestamp: Date;
}

/**
 * DTO para atualizar uma mensagem
 */
export interface UpdateMessageData {
  status?: string;
  metadata?: Record<string, unknown> | null;
}

/**
 * Filtros para buscar mensagens
 */
export interface MessageFilters {
  accountId?: string;
  projectId?: string;
  threadId?: string;
  senderId?: string;
  type?: string;
  direction?: string;
  status?: string;
  channel?: string;
  provider?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Message entity (domain object - simplified from TypedMessage)
 */
export interface Message {
  id: string;
  accountId: string;
  projectId: string;
  threadId: string;
  webhookEventId: string | null;
  type: string;
  direction: string;
  role: string | null;
  status: string | null;
  senderId: string;
  senderName: string | null;
  senderPhone: string | null;
  receiverId: string | null;
  receiverName: string | null;
  content: unknown;
  metadata: Record<string, unknown> | null;
  externalId: string | null;
  channel: string;
  provider: string;
  implementation: string | null;
  messageTimestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Repository interface para Message
 */
export interface IMessageRepository {
  /**
   * Cria uma nova mensagem
   */
  create(data: CreateMessageData): Promise<Message>;

  /**
   * Cria uma mensagem a partir de TypedMessage (protocolo normalizado)
   */
  createFromTypedMessage(
    message: TypedMessage,
    accountId: string,
    projectId: string,
    threadId: string,
    webhookEventId?: string,
  ): Promise<Message>;

  /**
   * Busca uma mensagem por ID
   */
  findById(id: string, accountId: string): Promise<Message | null>;

  /**
   * Busca mensagens de uma thread (ordenadas por timestamp)
   */
  findByThreadId(
    threadId: string,
    accountId: string,
    limit?: number,
    offset?: number,
  ): Promise<Message[]>;

  /**
   * Busca últimas N mensagens de uma thread (para contexto de conversa)
   */
  findRecentByThreadId(threadId: string, accountId: string, limit: number): Promise<Message[]>;

  /**
   * Busca mensagens por account_id com filtros opcionais
   */
  findByAccountId(accountId: string, filters?: Omit<MessageFilters, 'accountId'>): Promise<Message[]>;

  /**
   * Busca mensagens por external_id (para idempotência)
   */
  findByExternalId(externalId: string, accountId: string): Promise<Message | null>;

  /**
   * Atualiza uma mensagem
   */
  update(id: string, accountId: string, data: UpdateMessageData): Promise<Message>;

  /**
   * Atualiza apenas o status de uma mensagem
   */
  updateStatus(id: string, accountId: string, status: string): Promise<Message>;

  /**
   * Busca mensagens por múltiplos filtros
   */
  findByFilters(filters: MessageFilters): Promise<Message[]>;

  /**
   * Conta mensagens de uma thread
   */
  countByThreadId(threadId: string, accountId: string): Promise<number>;

  /**
   * Deleta uma mensagem (hard delete)
   */
  delete(id: string, accountId: string): Promise<void>;
}
