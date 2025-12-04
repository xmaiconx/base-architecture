# @fnd/workers

Pure handler functions for serverless workers (Vercel Edge Functions / QStash).

## Architecture

**NO NestJS Dependencies** - Handlers are pure functions with context injection.

### Handler Pattern

```typescript
import { sendEmailHandler, createHandlerContext } from '@fnd/workers';

// Create context (once per cold start)
const context = await createHandlerContext();

// Execute handler
await sendEmailHandler(payload, context);
```

### Available Handlers

1. **sendEmailHandler** - Send emails via Resend
2. **processAuditHandler** - Persist audit logs to database
3. **stripeWebhookHandler** - Process Stripe webhook events

### Context Injection

Handlers receive `HandlerContext` with pre-configured services:

- `emailService` - IEmailService
- `auditLogRepository` - IAuditLogRepository
- `webhookEventRepository` - IWebhookEventRepository
- `userRepository` - IUserRepository
- `accountRepository` - IAccountRepository
- `workspaceRepository` - IWorkspaceRepository
- `config` - IConfigurationService
- `logger` - ILoggerService

### Why Pure Handlers?

- **Lightweight**: No NestJS DI container overhead
- **Fast Cold Starts**: Direct service instantiation
- **Vercel-Ready**: Compatible with Edge Runtime
- **Testable**: Easy to mock context

## Usage Example

```typescript
// Vercel Edge Function
import { sendEmailHandler, createHandlerContext } from '@fnd/workers';

const context = await createHandlerContext();

export default async function handler(req: Request) {
  const payload = await req.json();
  await sendEmailHandler(payload, context);
  return new Response('OK', { status: 200 });
}
```

## Dependencies

- `@fnd/backend` - Service interfaces
- `@fnd/domain` - Domain entities
- `@fnd/database` - Repository implementations
- `resend` - Email delivery
- `stripe` - Payment webhooks
- `@upstash/qstash` - Signature verification
