# @fnd/workers-app

Thin Vercel Function wrappers for serverless workers.

## Overview

This package contains lightweight entrypoint wrappers (~30-40 lines each) that:
1. Verify request signatures (QStash or Stripe)
2. Parse payloads
3. Create handler context
4. Delegate to pure handlers from `@fnd/workers`

## Architecture

```
Vercel Function (apps/workers/*.ts)
  ↓ verifies signature
  ↓ parses payload
  ↓ creates context
Pure Handler (libs/workers/src/handlers/*.ts)
  ↓ executes business logic
  ↓ uses injected services
```

## Functions

### send-email.ts
- **Signature**: QStash (Upstash)
- **Purpose**: Send transactional emails via Resend
- **Env Vars**: `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`

### process-audit.ts
- **Signature**: QStash (Upstash)
- **Purpose**: Persist audit events to database
- **Env Vars**: `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`

### stripe-webhook.ts
- **Signature**: Stripe webhook signature
- **Purpose**: Process Stripe payment events
- **Env Vars**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

## Deployment

These functions are deployed to Vercel as serverless functions:

```bash
# Vercel automatically detects and deploys:
/api/workers/send-email → apps/workers/send-email.ts
/api/workers/process-audit → apps/workers/process-audit.ts
/api/workers/stripe-webhook → apps/workers/stripe-webhook.ts
```

## Environment Variables

Required in Vercel project settings:

```bash
# QStash (for send-email, process-audit)
QSTASH_CURRENT_SIGNING_KEY=sig_xxx
QSTASH_NEXT_SIGNING_KEY=sig_xxx

# Stripe (for stripe-webhook)
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Database
DATABASE_URL=postgresql://...

# Email (Resend)
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@domain.com
```

## Development

```bash
# Build
npm run build -w @fnd/workers-app

# Type check
npm run typecheck -w @fnd/workers-app
```

## Security

- **QStash**: Verifies signature using Upstash SDK before processing
- **Stripe**: Verifies webhook signature using Stripe SDK before processing
- **No Auth Bypass**: All functions reject requests with invalid signatures (401)
