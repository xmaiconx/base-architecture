import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { TypedMessage } from '@fnd/domain';
import { Database } from '../types';
import {
  IMessageRepository,
  Message,
  CreateMessageData,
  UpdateMessageData,
  MessageFilters,
} from '../interfaces/IMessageRepository';

@Injectable()
export class MessageRepository implements IMessageRepository {
  constructor(private db: Kysely<Database>) {}

  async create(data: CreateMessageData): Promise<Message> {
    const now = new Date();
    const result = await this.db
      .insertInto('messages')
      .values({
        account_id: data.accountId,
        project_id: data.projectId,
        thread_id: data.threadId,
        webhook_event_id: data.webhookEventId ?? null,
        type: data.type,
        direction: data.direction,
        role: data.role ?? null,
        status: data.status ?? null,
        sender_id: data.senderId,
        sender_name: data.senderName ?? null,
        sender_phone: data.senderPhone ?? null,
        receiver_id: data.receiverId ?? null,
        receiver_name: data.receiverName ?? null,
        content: JSON.stringify(data.content),
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        external_id: data.externalId ?? null,
        channel: data.channel,
        provider: data.provider,
        implementation: data.implementation ?? null,
        message_timestamp: data.messageTimestamp,
        created_at: now,
        updated_at: now,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapToMessage(result);
  }

  async createFromTypedMessage(
    message: TypedMessage,
    accountId: string,
    projectId: string,
    threadId: string,
    webhookEventId?: string,
  ): Promise<Message> {
    const data: CreateMessageData = {
      accountId,
      projectId,
      threadId,
      webhookEventId: webhookEventId ?? null,
      type: message.type,
      direction: message.direction,
      status: message.status ?? null,
      senderId: message.metadata.from.id,
      senderName: message.metadata.from.name ?? null,
      senderPhone: message.metadata.from.phone ?? null,
      receiverId: message.metadata.to?.id ?? null,
      receiverName: message.metadata.to?.name ?? null,
      content: message.content,
      metadata: {
        accountId: message.metadata.accountId,
        channel: message.metadata.channel,
        provider: message.metadata.provider,
        implementation: message.metadata.implementation,
        externalId: message.metadata.externalId,
        ticketId: message.metadata.ticketId,
        contactId: message.metadata.contactId,
        error: message.metadata.error,
      },
      externalId: message.metadata.externalId ?? null,
      channel: message.metadata.channel,
      provider: message.metadata.provider,
      implementation: message.metadata.implementation ?? null,
      messageTimestamp: message.timestamp,
    };

    return this.create(data);
  }

  async findById(id: string, accountId: string): Promise<Message | null> {
    const result = await this.db
      .selectFrom('messages')
      .selectAll()
      .where('id', '=', id)
      .where('account_id', '=', accountId)
      .executeTakeFirst();

    return result ? this.mapToMessage(result) : null;
  }

  async findByThreadId(
    threadId: string,
    accountId: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<Message[]> {
    const results = await this.db
      .selectFrom('messages')
      .selectAll()
      .where('thread_id', '=', threadId)
      .where('account_id', '=', accountId)
      .orderBy('message_timestamp', 'asc')
      .limit(limit)
      .offset(offset)
      .execute();

    return results.map((row) => this.mapToMessage(row));
  }

  async findRecentByThreadId(
    threadId: string,
    accountId: string,
    limit: number,
  ): Promise<Message[]> {
    const results = await this.db
      .selectFrom('messages')
      .selectAll()
      .where('thread_id', '=', threadId)
      .where('account_id', '=', accountId)
      .orderBy('message_timestamp', 'desc')
      .limit(limit)
      .execute();

    // Return in chronological order (oldest first)
    return results.reverse().map((row) => this.mapToMessage(row));
  }

  async findByAccountId(
    accountId: string,
    filters?: Omit<MessageFilters, 'accountId'>,
  ): Promise<Message[]> {
    let query = this.db
      .selectFrom('messages')
      .selectAll()
      .where('account_id', '=', accountId);

    if (filters?.projectId) {
      query = query.where('project_id', '=', filters.projectId);
    }
    if (filters?.threadId) {
      query = query.where('thread_id', '=', filters.threadId);
    }
    if (filters?.senderId) {
      query = query.where('sender_id', '=', filters.senderId);
    }
    if (filters?.type) {
      query = query.where('type', '=', filters.type);
    }
    if (filters?.direction) {
      query = query.where('direction', '=', filters.direction);
    }
    if (filters?.status) {
      query = query.where('status', '=', filters.status);
    }
    if (filters?.channel) {
      query = query.where('channel', '=', filters.channel);
    }
    if (filters?.provider) {
      query = query.where('provider', '=', filters.provider);
    }
    if (filters?.fromDate) {
      query = query.where('message_timestamp', '>=', filters.fromDate);
    }
    if (filters?.toDate) {
      query = query.where('message_timestamp', '<=', filters.toDate);
    }

    query = query.orderBy('message_timestamp', 'desc');

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    const results = await query.execute();

    return results.map((row) => this.mapToMessage(row));
  }

  async findByExternalId(externalId: string, accountId: string): Promise<Message | null> {
    const result = await this.db
      .selectFrom('messages')
      .selectAll()
      .where('external_id', '=', externalId)
      .where('account_id', '=', accountId)
      .executeTakeFirst();

    return result ? this.mapToMessage(result) : null;
  }

  async update(
    id: string,
    accountId: string,
    data: UpdateMessageData,
  ): Promise<Message> {
    const now = new Date();
    const result = await this.db
      .updateTable('messages')
      .set({
        status: data.status ?? undefined,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
        updated_at: now,
      })
      .where('id', '=', id)
      .where('account_id', '=', accountId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapToMessage(result);
  }

  async updateStatus(id: string, accountId: string, status: string): Promise<Message> {
    const result = await this.db
      .updateTable('messages')
      .set({
        status,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .where('account_id', '=', accountId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapToMessage(result);
  }

  async findByFilters(filters: MessageFilters): Promise<Message[]> {
    let query = this.db.selectFrom('messages').selectAll();

    if (filters.accountId) {
      query = query.where('account_id', '=', filters.accountId);
    }
    if (filters.projectId) {
      query = query.where('project_id', '=', filters.projectId);
    }
    if (filters.threadId) {
      query = query.where('thread_id', '=', filters.threadId);
    }
    if (filters.senderId) {
      query = query.where('sender_id', '=', filters.senderId);
    }
    if (filters.type) {
      query = query.where('type', '=', filters.type);
    }
    if (filters.direction) {
      query = query.where('direction', '=', filters.direction);
    }
    if (filters.status) {
      query = query.where('status', '=', filters.status);
    }
    if (filters.channel) {
      query = query.where('channel', '=', filters.channel);
    }
    if (filters.provider) {
      query = query.where('provider', '=', filters.provider);
    }
    if (filters.fromDate) {
      query = query.where('message_timestamp', '>=', filters.fromDate);
    }
    if (filters.toDate) {
      query = query.where('message_timestamp', '<=', filters.toDate);
    }

    query = query.orderBy('message_timestamp', 'desc');

    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.offset(filters.offset);
    }

    const results = await query.execute();

    return results.map((row) => this.mapToMessage(row));
  }

  async countByThreadId(threadId: string, accountId: string): Promise<number> {
    const result = await this.db
      .selectFrom('messages')
      .select((eb) => eb.fn.count('id').as('count'))
      .where('thread_id', '=', threadId)
      .where('account_id', '=', accountId)
      .executeTakeFirstOrThrow();

    return Number(result.count);
  }

  async delete(id: string, accountId: string): Promise<void> {
    await this.db
      .deleteFrom('messages')
      .where('id', '=', id)
      .where('account_id', '=', accountId)
      .execute();
  }

  /**
   * Maps database row to Message entity (snake_case → camelCase)
   */
  private mapToMessage(row: any): Message {
    return {
      id: row.id,
      accountId: row.account_id,
      projectId: row.project_id,
      threadId: row.thread_id,
      webhookEventId: row.webhook_event_id,
      type: row.type,
      direction: row.direction,
      role: row.role,
      status: row.status,
      senderId: row.sender_id,
      senderName: row.sender_name,
      senderPhone: row.sender_phone,
      receiverId: row.receiver_id,
      receiverName: row.receiver_name,
      content: JSON.parse(row.content),
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      externalId: row.external_id,
      channel: row.channel,
      provider: row.provider,
      implementation: row.implementation,
      messageTimestamp: row.message_timestamp,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
