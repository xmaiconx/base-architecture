/**
 * Process Audit Payload - represents audit event data to persist
 */
export interface ProcessAuditPayload {
  eventName: string;
  eventType: 'domain' | 'integration';
  occurredAt: string; // ISO 8601 timestamp
  payload: {
    accountId?: string;
    workspaceId?: string;
    userId?: string;
    [key: string]: any;
  };
}
