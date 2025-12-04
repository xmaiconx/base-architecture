import type { ProcessAuditPayload } from '../types/ProcessAuditPayload';
import type { HandlerContext } from '../types/HandlerContext';
import type { AuditLog } from '@fnd/domain';

/**
 * Pure handler for processing audit events
 * Persists audit logs to database
 * @param payload Audit event data
 * @param context Handler context with injected services
 */
export async function processAuditHandler(
  payload: ProcessAuditPayload,
  context: HandlerContext
): Promise<void> {
  const { auditLogRepository, logger } = context;

  try {
    // Validate payload
    if (!payload.eventName || !payload.eventType) {
      throw new Error('Event name and type are required');
    }

    if (!['domain', 'integration'].includes(payload.eventType)) {
      throw new Error(
        `Invalid event type: ${payload.eventType}. Must be 'domain' or 'integration'`
      );
    }

    logger.info('Processing audit event', {
      eventName: payload.eventName,
      eventType: payload.eventType,
      accountId: payload.payload.accountId,
      handler: 'processAuditHandler',
    });

    // Parse occurred timestamp
    const occurredAt = payload.occurredAt
      ? new Date(payload.occurredAt)
      : new Date();

    if (isNaN(occurredAt.getTime())) {
      throw new Error(`Invalid occurredAt timestamp: ${payload.occurredAt}`);
    }

    // Create audit log entry
    const auditLog: Omit<AuditLog, 'id' | 'createdAt'> = {
      accountId: payload.payload.accountId || null,
      workspaceId: payload.payload.workspaceId || null,
      userId: payload.payload.userId || null,
      eventName: payload.eventName,
      eventType: payload.eventType,
      payload: payload.payload,
      occurredAt: occurredAt,
    };

    // Persist to database
    const created = await auditLogRepository.create(auditLog);

    logger.info('Audit event persisted successfully', {
      auditLogId: created.id,
      eventName: payload.eventName,
      accountId: payload.payload.accountId,
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('Failed to process audit event', error, {
      eventName: payload.eventName,
      eventType: payload.eventType,
    });
    throw error;
  }
}
