# Especificação Técnica do Projeto

**Gerado em:** 2025-12-12
**Template:** FND EasyFlow - Base para construção de SaaS com IA

---

## Stack Tecnológica

### Build & Package

| Componente | Tecnologia | Versão |
|------------|------------|--------|
| Package Manager | npm | 9.0.0 |
| Build System | Turbo | 2.0.0 |
| Linguagem | TypeScript | 5.0+ (strict mode) |
| Monorepo | npm workspaces | apps/*, libs/* |

### Backend (@fnd/api)

| Componente | Tecnologia | Versão |
|------------|------------|--------|
| Framework | NestJS | 10.0 |
| CQRS | @nestjs/cqrs | 11.0 |
| Queue | BullMQ | 5.0 |
| Redis Client | ioredis | 5.3 |
| Email | Resend | 2.0 |
| Payments | Stripe | 17.7 |
| Logging | Winston | 3.10 |
| Validation | class-validator + class-transformer | 0.14/0.5 |
| Hot Reload | nodemon + @swc-node/register + @swc/core | 3.1/1.11/1.13 |

### Frontend (@fnd/frontend)

| Componente | Tecnologia | Versão |
|------------|------------|--------|
| Framework | React | 18.2 |
| Build Tool | Vite | 4.4 |
| Routing | React Router DOM | 6.15 |
| Server State | TanStack Query | 4.35 |
| Client State | Zustand | 4.4 |
| Forms | React Hook Form + Zod | 7.45/3.22 |
| HTTP Client | Axios | 1.5 |
| UI Components | Radix UI (Shadcn pattern) | 1.0/2.0 |
| Styling | Tailwind CSS | 3.3 |
| Icons | Lucide React | 0.279 |
| Animations | Framer Motion | 10.16 |
| Toasts | Sonner | 1.0 |

### Database (@fnd/database)

| Componente | Tecnologia | Versão |
|------------|------------|--------|
| Database | PostgreSQL | 15 |
| Query Builder | Kysely (type-safe) | 0.27 |
| Migrations | Knex | 3.0 |
| Driver | pg | 8.11 |

### Autenticação

| Componente | Tecnologia | Detalhes |
|------------|------------|----------|
| Provider | Supabase Auth | @supabase/supabase-js 2.49 |
| Estratégia | JWT | Via Supabase |
| Multi-tenant | account_id claim | Injetado no JWT |

### Infraestrutura (Docker Local)

| Serviço | Imagem | Porta |
|---------|--------|-------|
| PostgreSQL | postgres:15-alpine | 5432 |
| Redis | redis:7-alpine | 6379 |
| Redis Insight | redislabs/redisinsight | 8001 |
| PgAdmin | dpage/pgadmin4 | 5050 |

---

## Estrutura do Projeto

### Organização de Pastas

```
fnd-easyflow-template/
├── apps/
│   ├── backend/                 # @fnd/api - NestJS API + Workers
│   │   └── src/
│   │       ├── main.ts          # Dispatcher (NODE_MODE routing)
│   │       ├── main.api.ts      # Entrypoint API only
│   │       ├── main.workers.ts  # Entrypoint Workers only
│   │       ├── main.hybrid.ts   # Entrypoint Hybrid (padrão)
│   │       ├── local.ts         # Dev server local
│   │       ├── api/
│   │       │   ├── decorators/  # Custom decorators
│   │       │   ├── guards/      # Auth guards
│   │       │   └── modules/     # Feature modules
│   │       │       ├── audit/   # Audit logs
│   │       │       ├── auth/    # Authentication
│   │       │       ├── billing/ # Subscriptions & payments
│   │       │       └── workspace/ # Multi-workspace
│   │       ├── shared/
│   │       │   ├── adapters/    # BullMQ adapters
│   │       │   ├── base/        # Base classes
│   │       │   ├── messaging/   # Event publishing
│   │       │   ├── providers/   # Redis provider
│   │       │   └── services/    # Shared services
│   │       └── workers/         # BullMQ workers
│   │           ├── audit.worker.ts
│   │           ├── email.worker.ts
│   │           └── stripe-webhook.worker.ts
│   │
│   └── frontend/                # @fnd/frontend - React App
│       └── src/
│           ├── components/
│           │   ├── auth/        # Auth components
│           │   ├── billing/     # Billing components
│           │   ├── forms/       # Form components
│           │   ├── layout/      # Layout components
│           │   ├── ui/          # Shadcn/ui primitives
│           │   └── workspace/   # Workspace components
│           ├── contexts/        # React Contexts
│           ├── hooks/           # Custom hooks
│           ├── lib/             # Utilities, API client
│           ├── pages/           # Route pages
│           │   ├── auth/
│           │   └── settings/
│           ├── stores/          # Zustand stores
│           └── types/           # Mirrored types
│               ├── api/         # DTOs (interfaces)
│               └── domain/      # Domain entities
│
├── libs/
│   ├── domain/                  # @fnd/domain - Pure domain
│   │   └── src/
│   │       ├── entities/        # Domain entities
│   │       ├── enums/           # Business enums
│   │       └── types/           # Domain types
│   │
│   ├── backend/                 # @fnd/backend - Interfaces
│   │   └── src/
│   │       ├── billing/         # Billing interfaces
│   │       ├── cqrs/            # CQRS interfaces
│   │       ├── features/        # Feature flags
│   │       ├── messaging/       # Queue interfaces
│   │       ├── payment/         # Payment interfaces
│   │       ├── scheduling/      # Scheduling interfaces
│   │       ├── services/        # Service interfaces
│   │       └── webhooks/        # Webhook interfaces
│   │
│   └── app-database/            # @fnd/database - Data access
│       ├── migrations/          # Knex migrations
│       └── src/
│           ├── interfaces/      # Repository interfaces
│           ├── repositories/    # Kysely implementations
│           └── types/           # Table types
│
├── infra/
│   └── docker-compose.yml       # Local dev environment
│
└── supabase/                    # Supabase config
```

### Convenções de Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Packages | @fnd/[nome] | @fnd/api, @fnd/domain |
| Classes | PascalCase | `UserRepository`, `AuthService` |
| Interfaces | I + PascalCase | `IUserRepository`, `ILoggerService` |
| DTOs (input) | [Ação][Entidade]Dto | `CreateUserDto`, `SignUpDto` |
| DTOs (response) | [Entidade]ResponseDto | `UserResponseDto` |
| Commands | [Ação][Subject]Command | `SignUpCommand`, `CreateWorkspaceCommand` |
| Events | [Subject][PastAction]Event | `AccountCreatedEvent`, `UserSignedUpEvent` |
| Services | [Nome]Service | `AuthService`, `BillingService` |
| Handlers | [Command/Event]Handler | `SignUpCommandHandler` |
| Tables (Kysely) | [Nome]Table | `UserTable`, `AccountTable` |
| Arquivos TS | camelCase ou kebab-case | `auth.service.ts`, `UserRepository.ts` |
| Colunas DB | snake_case | `account_id`, `created_at` |
| Variáveis | camelCase | `accountId`, `createdAt` |

---

## Padrões Arquiteturais

### 1. Clean Architecture

**Regra de Ouro:** Camadas internas NUNCA dependem de camadas externas.

```
libs/domain       → Entidades e enums puros (sem dependências)
libs/backend      → Interfaces de serviços (depende de domain)
libs/app-database → Repositories (depende de domain)
apps/backend      → Implementações (depende de todas as libs)
apps/frontend     → UI (tipos espelhados, zero dependências de backend)
```

### 2. CQRS (Command Query Responsibility Segregation)

**Onde:** `apps/backend/src/api/modules/[module]/commands/`

**Convenção:**
- Commands para operações de escrita
- Handlers em subpasta `handlers/`
- Um Command por arquivo
- Queries direto nos Repositories (sem QueryHandlers)

**Exemplo de estrutura:**
```
auth/
├── commands/
│   ├── CompleteSignUpCommand.ts
│   ├── SyncAuthUserCommand.ts
│   ├── handlers/
│   │   ├── CompleteSignUpCommandHandler.ts
│   │   └── SyncAuthUserCommandHandler.ts
│   └── index.ts          # Exporta commands apenas
└── events/
    ├── AccountCreatedEvent.ts
    ├── handlers/
    │   └── AccountCreatedEventHandler.ts
    └── index.ts          # Exporta events apenas
```

### 3. Repository Pattern

**Interfaces:** `libs/app-database/src/interfaces/`
**Implementations:** `libs/app-database/src/repositories/`

**Convenção:**
- Interface define contrato: `I[Entity]Repository`
- Implementação usa Kysely: `[Entity]Repository`
- Retorna domain entities (nunca DTOs)

**Repositories disponíveis:**
- IAccountRepository / AccountRepository
- IUserRepository / UserRepository
- IWorkspaceRepository / WorkspaceRepository
- IWorkspaceUserRepository / WorkspaceUserRepository
- IAuditLogRepository / AuditLogRepository
- IPlanRepository / PlanRepository
- ISubscriptionRepository / SubscriptionRepository
- IWebhookEventRepository / WebhookEventRepository

### 4. Dependency Injection (NestJS)

**Configuração central:** `apps/backend/src/shared/shared.module.ts`

**Tokens DI registrados:**
- `IEmailService` → ResendEmailService
- `ILoggerService` → WinstonLoggerService
- `IConfigurationService` → ConfigurationService
- `ISupabaseService` → SupabaseService
- `IQueueService` → BullMQQueueAdapter
- `IEventPublisher` → BullMQEventPublisher
- `IEmailQueueService` → EmailQueueService
- `IEventBroker` → EventBrokerService
- `DATABASE` → Kysely instance
- `REDIS_CONNECTION` → IORedis instance
- Todos os repositories via tokens string

### 5. Event-Driven Architecture (BullMQ)

**Workers:** `apps/backend/src/workers/`

| Worker | Fila | Função |
|--------|------|--------|
| email.worker.ts | email | Envia emails via Resend |
| audit.worker.ts | audit | Persiste audit logs |
| stripe-webhook.worker.ts | stripe-webhook | Processa webhooks Stripe |

**Adapters:** `apps/backend/src/shared/adapters/`
- `BullMQQueueAdapter` - Implementa IQueueService
- `BullMQEventPublisher` - Implementa IEventPublisher

### 6. Hybrid Execution Mode

**Dispatcher:** `apps/backend/src/main.ts`

```
NODE_MODE=api       → Apenas HTTP API
NODE_MODE=workers   → Apenas BullMQ Workers
NODE_MODE=hybrid    → API + Workers (padrão)
```

---

## Domain Layer

### Entities

**Path:** `libs/domain/src/entities/`

| Entity | Descrição |
|--------|-----------|
| Account.ts | Tenant root, contém configurações da conta |
| User.ts | Usuário autenticado, vinculado a account |
| Workspace.ts | Espaço de trabalho dentro de uma account |
| WorkspaceUser.ts | Bridge table: user ↔ workspace |
| AuditLog.ts | Log de auditoria de ações |
| Plan.ts | Plano de assinatura (Stripe Product) |
| PlanPrice.ts | Preço versionado de um plano |
| Subscription.ts | Assinatura ativa de uma account |
| WebhookEvent.ts | Eventos de webhook recebidos |

### Enums

**Path:** `libs/domain/src/enums/`

| Enum | Descrição |
|------|-----------|
| EntityStatus.ts | Status genérico (active, inactive, deleted) |
| UserRole.ts | Roles de usuário (owner, admin, member) |
| OnboardingStatus.ts | Status do onboarding |
| PaymentProvider.ts | Provedor de pagamento (stripe) |
| PlanCode.ts | Códigos de planos (free, pro, enterprise) |
| SubscriptionStatus.ts | Status da assinatura |
| WebhookStatus.ts | Status de processamento de webhook |
| WebhookType.ts | Tipos de webhook (stripe, supabase) |

### Types

**Path:** `libs/domain/src/types/`

| Type | Descrição |
|------|-----------|
| PlanFeatures.ts | Feature flags por plano |
| WebhookMetadata.ts | Metadados de eventos webhook |

---

## Database

### Schema PostgreSQL

```
accounts              # Tenant root
├── id (uuid)
├── name
├── status
├── onboarding_status
├── created_at
└── updated_at

workspaces            # Multi-workspace per account
├── id (uuid)
├── account_id (fk)
├── name
├── is_default
├── created_at
└── updated_at

workspace_users       # User-workspace bridge
├── id (uuid)
├── workspace_id (fk)
├── user_id (fk)
├── role
├── created_at
└── updated_at

users                 # Auth + profile
├── id (uuid)
├── account_id (fk)
├── auth_user_id      # Supabase Auth ID
├── email
├── name
├── role
├── status
├── created_at
└── updated_at

audit_logs            # Audit trail
├── id (uuid)
├── account_id (fk)
├── user_id (fk)
├── action
├── entity_type
├── entity_id
├── metadata (jsonb)
├── created_at
└── updated_at

plans                 # Subscription plans
├── id (uuid)
├── code
├── name
├── description
├── features (jsonb)
├── stripe_product_id
├── is_active
├── created_at
└── updated_at

plan_prices           # Versioned prices
├── id (uuid)
├── plan_id (fk)
├── stripe_price_id
├── amount
├── currency
├── interval
├── is_active
├── created_at
└── updated_at

subscriptions         # Active subscriptions
├── id (uuid)
├── account_id (fk)
├── plan_id (fk)
├── plan_price_id (fk)
├── stripe_subscription_id
├── status
├── current_period_start
├── current_period_end
├── created_at
└── updated_at

webhook_events        # Webhook tracking
├── id (uuid)
├── type
├── external_id
├── payload (jsonb)
├── status
├── processed_at
├── error_message
├── created_at
└── updated_at
```

### Migrations (Knex)

**Path:** `libs/app-database/migrations/`

| Migration | Descrição |
|-----------|-----------|
| 20250101001_create_initial_schema.js | Schema inicial consolidado |
| 20250101002_seed_default_plans.js | Seed de planos padrão |
| 20250103001_add_auth_user_id.js | Adiciona coluna auth_user_id |
| 20250103002_remove_legacy_auth_columns.js | Remove colunas legadas de auth |

### Kysely Types

**Path:** `libs/app-database/src/types/`

```typescript
interface Database {
  accounts: AccountTable;
  workspaces: WorkspaceTable;
  workspace_users: WorkspaceUserTable;
  users: UserTable;
  audit_logs: AuditLogTable;
  webhook_events: WebhookEventTable;
  plans: PlanTable;
  plan_prices: PlanPriceTable;
  subscriptions: SubscriptionTable;
}
```

---

## Configuração & Ambiente

### Acesso a Variáveis de Ambiente

**Padrão:** Injetar `IConfigurationService` (NUNCA usar `process.env` direto)

```typescript
// ERRADO
const apiKey = process.env.STRIPE_SECRET_KEY;

// CORRETO
@Inject('IConfigurationService')
private readonly config: IConfigurationService;

const apiKey = this.config.getStripeSecretKey();
```

**Interface:** `libs/backend/src/services/IConfigurationService.ts`
**Implementation:** `apps/backend/src/shared/services/configuration.service.ts`

### Variáveis Obrigatórias

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Supabase Auth
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...

# Redis
REDIS_URL=redis://localhost:6379

# Node Mode
NODE_MODE=hybrid

# API
API_PORT=3001
API_BASE_URL=http://localhost:3001

# Email
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@domain.com

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Frontend
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=info
```

---

## Regras de Segurança

### Multi-Tenancy

**Implementado:** Sim
**Estratégia:** Filtrar queries por `account_id`

```
Account (tenant root)
  ↓ has many
Workspaces (via account_id)
  ↓ has many
WorkspaceUsers (bridge: user_id + workspace_id)
  ↓
Users (via account_id)
  ↓ has
Subscriptions (via account_id)
```

**Regras:**
- SEMPRE filtrar queries por `account_id`
- JWT contém `accountId` claim
- Guards verificam ownership antes de qualquer operação
- Super Admin: Email `SUPER_ADMIN_EMAIL` tem acesso cross-tenant

### Autenticação

**Guards:** `apps/backend/src/api/guards/`
- JwtAuthGuard - Valida JWT Supabase
- RolesGuard - Verifica roles do usuário

**Validação:**
- DTOs validados com class-validator
- Requests filtrados por account_id do JWT

---

## Frontend → Backend Type Sharing

### Estratégia

**Backend DTOs:** Classes com decorators em `apps/backend/src/api/modules/[module]/dtos/`
**Frontend Types:** Interfaces puras em `apps/frontend/src/types/api/`

**Arquivos de tipos frontend:**
- `auth.types.ts` - Auth DTOs
- `billing.ts` - Billing DTOs
- `audit.types.ts` - Audit DTOs
- `workspace.types.ts` - Workspace DTOs
- `webhooks.types.ts` - Webhook DTOs

**Regra:** Frontend é 100% desacoplado do backend. Tipos são espelhados manualmente como interfaces puras (sem class-validator decorators).

---

## Arquivos Importantes

### Backend - Core

| Arquivo | Descrição |
|---------|-----------|
| [main.ts](apps/backend/src/main.ts) | Dispatcher NODE_MODE |
| [main.hybrid.ts](apps/backend/src/main.hybrid.ts) | Entrypoint padrão (API + Workers) |
| [local.ts](apps/backend/src/local.ts) | Dev server local |
| [shared.module.ts](apps/backend/src/shared/shared.module.ts) | Configuração DI central |

### Backend - Services

| Arquivo | Descrição |
|---------|-----------|
| [configuration.service.ts](apps/backend/src/shared/services/configuration.service.ts) | Acesso a env vars |
| [winston-logger.service.ts](apps/backend/src/shared/services/winston-logger.service.ts) | Logging estruturado |
| [supabase.service.ts](apps/backend/src/shared/services/supabase.service.ts) | Cliente Supabase |
| [resend-email.service.ts](apps/backend/src/shared/services/resend-email.service.ts) | Envio de emails |
| [email-queue.service.ts](apps/backend/src/shared/services/email-queue.service.ts) | Fila de emails |

### Database

| Arquivo | Descrição |
|---------|-----------|
| [Database.ts](libs/app-database/src/types/Database.ts) | Kysely schema definition |
| [kysely.ts](libs/app-database/src/kysely.ts) | Conexão Kysely |

### Frontend - Core

| Arquivo | Descrição |
|---------|-----------|
| [App.tsx](apps/frontend/src/App.tsx) | Root component |
| [auth-store.ts](apps/frontend/src/stores/auth-store.ts) | Zustand auth state |
| [lib/api.ts](apps/frontend/src/lib/api.ts) | Axios client |

---

## Scripts Disponíveis

### Root

```bash
npm run build           # Build all packages (Turbo)
npm run clean           # Remove dist folders
npm run dev             # API + Frontend parallel
npm run dev:api         # Backend API only
npm run dev:workers     # Backend Workers only
npm run test            # Run all tests
npm run lint            # Lint all packages
npm run typecheck       # Type check all packages
npm run migrate:latest  # Run pending migrations
npm run migrate:rollback # Rollback last migration
npm run seed:run        # Run database seeds
```

### Backend

```bash
cd apps/backend
npm run build           # tsc --build
npm run dev             # nodemon (hot reload)
npm start               # node dist/local.js
```

### Frontend

```bash
cd apps/frontend
npm run build           # vite build
npm run dev             # vite dev server
npm run preview         # vite preview
npm run lint            # eslint
npm run typecheck       # tsc --noEmit
```

---

## Princípios de Design

- **KISS:** Keep It Simple, Stupid
- **YAGNI:** You Aren't Gonna Need It
- **Single Responsibility:** Uma classe, uma razão para mudar
- **Dependency Inversion:** Dependa de abstrações, não concreções
- **Open/Closed:** Aberto para extensão, fechado para modificação
- **Zero over-engineering:** Pragmatismo acima de tudo

---

*Este documento foi gerado automaticamente pelo comando `/architecture` e deve ser atualizado quando houver mudanças significativas na arquitetura.*
