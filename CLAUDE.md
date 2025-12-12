# FND EasyFlow - Development Guide

## About

Template base para alunos do **Fábrica de Negócios Digitais (FND)** iniciarem a construção de seus SaaS utilizando IA.

## 📋 Stack Tecnológica

### Monorepo
- **Build System**: Turbo (parallel builds, caching, incremental compilation)
- **Package Manager**: npm workspaces (apps/*, libs/*)
- **TypeScript**: 5.0+ strict mode, project references, decorators

### Backend
- **Framework**: NestJS 10 (dependency injection, modules, CQRS)
- **Database**: PostgreSQL 15 + Kysely 0.27 (type-safe queries) + Knex 3.0 (migrations)
- **Queue Service**: BullMQ 5.0 + Redis 7 (async jobs and caching)
- **Auth**: Supabase Auth (JWT-based authentication)
- **Email**: Resend 2.0 (async via BullMQ queue)
- **Logging**: Winston 3.10 (structured logging)
- **Security**: AES-256-GCM encryption for credentials
- **Hot Reload**: Nodemon 3.1 + @swc-node/register 1.11 + @swc/core 1.13

### Frontend
- **Framework**: React 18.2 + Vite 4.4 + TypeScript
- **UI**: Shadcn/ui + Tailwind v3 + Lucide icons
- **State**: Zustand 4.4 (client) + TanStack Query 4.35 (server)
- **Forms**: React Hook Form 7.45 + Zod 3.22
- **Routing**: React Router DOM 6.15
- **HTTP**: Axios 1.5

## 🏗️ Clean Architecture

**Regra de Ouro**: Camadas internas NUNCA dependem de camadas externas.

### Estrutura do Monorepo
```
fnd-easyflow-template/
├── apps/
│   ├── backend/         # @fnd/api - NestJS API (API + Workers híbrido)
│   └── frontend/        # @fnd/frontend - React App (DTOs mirrored in types/)
├── libs/
│   ├── domain/          # @fnd/domain - Domain entities, enums, types
│   ├── backend/         # @fnd/backend - Service interfaces
│   └── app-database/    # @fnd/database - Data access (PostgreSQL, uses domain entities)
├── infra/
│   └── docker-compose.yml  # Ambiente local (PostgreSQL, Redis, PgAdmin, Redis Insight)
└── supabase/
    └── config.toml      # Configuração local do Supabase CLI
```

## 🔧 Convenções de Nomenclatura

### Código
- **Packages**: `@fnd/[nome]`
- **Interfaces**: `I[Nome]Service`, `I[Nome]Repository`
- **DTOs**: `[Ação][Entidade]Dto` (ex: `CreateUserDto`)
- **Commands**: `[Ação][Subject]Command` (ex: `SignUpCommand`)
- **Events**: `[Subject][Action]Event` (ex: `AccountCreatedEvent`)
- **Services**: `[Nome]Service` (ex: `AuthService`)
- **Handlers**: `[Command/Event]Handler`
- **Tables** (Kysely): `[Nome]Table` (ex: `UserTable`)

### Arquivos
- **TypeScript**: camelCase (variáveis), PascalCase (classes)
- **Database**: snake_case (colunas, tabelas)
- **Conversão**: snake_case (DB) → camelCase (entities)

## 📂 File Structure & Separation of Concerns

### Regra Obrigatória
**MANDATORY**: Cada definição em seu próprio arquivo específico.

### Domain Layer (`libs/domain/src/`)
```
├── entities/          # Account, AuditLog, Plan, PlanPrice, Subscription, User, WebhookEvent, Workspace, WorkspaceUser
├── enums/             # EntityStatus, OnboardingStatus, PaymentProvider, PlanCode, SubscriptionStatus, UserRole, WebhookStatus, WebhookType
├── types/             # Billing types, feature flags, etc.
└── index.ts           # Barrel exports
```

### Regras - Repository Interfaces
```typescript
// ❌ ERRADO - IUserRepository using DTOs
export interface IUserRepository {
  create(dto: CreateUserDto): Promise<User>;  // DTOs violate Clean Architecture
}

// ✅ CORRETO - IUserRepository using domain entities
import { User } from '@fnd/domain';

export interface IUserRepository {
  create(data: Omit<User, 'id' | 'createdAt'>): Promise<User>;  // Domain entities only
  findByEmail(email: string): Promise<User | null>;
}
```

**Por quê?** Database layer NEVER depends on DTOs (outer layer). Use domain entities exclusively. DTOs live in API modules (`apps/backend/src/api/modules/[module]/dtos/`).

## 🚀 Railway Hybrid Architecture

### Stack de Deploy
- **Railway**: Backend Docker (API + Workers)
- **BullMQ + Redis**: Async job queue e cache
- **Supabase PostgreSQL**: Database
- **Resend**: Email transacional
- **Cloudflare Pages**: Frontend estático

### Modos de Execução
O backend suporta três modos via `NODE_MODE`:

```
NODE_MODE=api       → Apenas HTTP API (escalar API independentemente)
NODE_MODE=workers   → Apenas Workers BullMQ (escalar workers independentemente)
NODE_MODE=hybrid    → API + Workers (modo padrão, deploy simplificado)
```

### Arquitetura Híbrida
```
apps/backend/src/
├── main.ts                 # Dispatcher (lê NODE_MODE e roteia)
├── main.api.ts             # Entrypoint API only
├── main.workers.ts         # Entrypoint Workers only
├── main.hybrid.ts          # Entrypoint Hybrid (padrão)
├── api/modules/            # Módulos NestJS (Controllers, Services, CQRS)
└── workers/                # Workers BullMQ (email, audit, stripe-webhook)
```

### Benefícios
- **Flexibilidade**: Escalar API e Workers independentemente quando necessário
- **Simplicidade**: Modo hybrid para desenvolvimento e deploys simples
- **Persistência**: Jobs sobrevivem a restarts (Redis)
- **Observabilidade**: Redis Insight para monitorar filas
- **Deploy Simplificado**: `git push` → Railway build + deploy automático

## 🎯 Backend Architecture

### Hybrid Bootstrap
**Arquivo**: `apps/backend/src/main.ts`

Backend dispatcher que lê `NODE_MODE` e inicializa o modo apropriado (api/workers/hybrid).
Para desenvolvimento local, use `apps/backend/src/local.ts` que inicia em modo hybrid por padrão.

### Feature-First Module Structure
```
api/modules/[feature]/
├── dtos/                        # DTOs específicos do módulo
│   ├── CreateXxxDto.ts          # Input DTO (classe com decorators)
│   ├── XxxResponseDto.ts        # Response DTO (interface)
│   └── index.ts                 # Barrel export
├── commands/
│   ├── CreateXxxCommand.ts
│   ├── handlers/
│   │   ├── CreateXxxCommandHandler.ts
│   │   └── index.ts             # Exporta handlers apenas
│   └── index.ts                 # Exporta commands apenas
├── events/
│   ├── XxxCreatedEvent.ts
│   ├── handlers/
│   │   └── XxxCreatedEventHandler.ts
│   └── index.ts                 # Exporta events apenas
├── [feature].controller.ts      # REST endpoints
├── [feature].service.ts         # Orquestra commands
└── [feature].module.ts          # NestJS DI
```

### CQRS Flow
```
1. Controller recebe HTTP request → valida DTO
2. Service cria Command → injeta CommandHandler
3. CommandHandler:
   - Valida regras de negócio
   - Persiste via Repository
   - Publica Domain Events
4. EventHandler reage (ex: envia email)
5. Controller retorna response DTO
```

### Path Aliases (Backend)
**Backend NÃO usa path aliases** - utiliza TypeScript project references com nomes de pacotes:

```json
// tsconfig.json - project references
"references": [
  { "path": "../../libs/domain" },
  { "path": "../../libs/backend" },
  { "path": "../../libs/app-database" },
]
```

### Padrão de Imports
```typescript
// DTOs LOCAIS do módulo (relative path)
import { CreateUserDto, UserResponseDto } from './dtos';

// Entities e Enums (package reference)
import { User, UserRole } from '@fnd/domain';

// Repositories (package reference)
import { IUserRepository } from '@fnd/database';

// Infraestrutura (package reference)
import { ILoggerService } from '@fnd/backend';

// Serviços compartilhados (relative path dentro do backend)
import { EmailQueueService } from '../../shared/services/email-queue.service';

// Commands/Events LOCAIS (relative path)
import { SignUpCommand } from './commands';
import { AccountCreatedEvent } from './events';
```

### Shared Module
**Arquivo**: `apps/backend/src/shared/shared.module.ts`

**Providers** (via DI tokens):
- `ILoggerService` → `WinstonLoggerService`
- `IEmailService` → `ResendEmailService`
- `IConfigurationService` → `ConfigurationService`
- `ISupabaseService` → `SupabaseService`
- `IQueueService` → `BullMQQueueAdapter`
- `IEventPublisher` → `BullMQEventPublisher`
- `DATABASE` → Kysely instance (PostgreSQL)
- `REDIS_CONNECTION` → IORedis instance
- Todos os Repositories (User, Account, Workspace, WorkspaceUser, AuditLog, Subscription, Plan, PlanPrice, WebhookEvent)

### Workers Architecture (BullMQ)

**Pasta**: `apps/backend/src/workers/`

**BullMQ Workers** (com NestJS DI):
- `email.worker.ts` - Processa fila `email` (envia emails via Resend)
- `audit.worker.ts` - Processa fila `audit` (persiste audit logs)
- `stripe-webhook.worker.ts` - Processa fila `stripe-webhook` (webhooks Stripe)

**Workers Module**:
- `workers.module.ts` - Módulo NestJS que agrupa todos os workers

**Adapters BullMQ**:
- `bullmq-queue.adapter.ts` - Implementa `IQueueService` com BullMQ
- `bullmq-event-publisher.adapter.ts` - Implementa `IEventPublisher` com BullMQ

**Redis Provider**:
- `redis.provider.ts` - Factory para conexão Redis compartilhada (IORedis)

### Backend API Modules
**Pasta**: `apps/backend/src/api/modules/`

**Módulos Ativos**:
1. **auth/** - Autenticação e autorização
   - Structure: commands/, events/, queries/, services/, strategies/, dtos/
   - Implements: signup, signin, JWT strategy, password recovery

2. **audit/** - Logs de auditoria
   - Structure: dtos/
   - Read-only access to audit logs

3. **workspace/** - Gerenciamento de workspaces
   - Structure: events/, dtos/
   - Multi-workspace support per account
   - User-workspace relationships

4. **billing/** - Gerenciamento de assinaturas e pagamentos
   - Structure: commands/, dtos/, services/
   - Stripe integration for subscriptions and payments

## 🔄 Padrões Arquiteturais

### 1. CQRS (Command Query Responsibility Segregation)
- **Commands**: Operações de escrita (via CommandHandlers)
- **Queries**: Leitura direta nos Repositories
- **Separação clara** entre write e read models

### 2. Event-Driven Architecture
**Componentes**:
- Events são publicados via BullMQ (Redis)
- Workers BullMQ processam eventos de forma assíncrona

**Fluxo**:
- **Domain Events**: Internos ao módulo, síncronos
- **Integration Events**: Entre módulos, assíncronos via BullMQ
- **Handlers idempotentes**: Podem ser executados múltiplas vezes (retry-safe)
- **Audit Processing**: Eventos são persistidos via worker dedicado
- **Job Persistence**: Jobs sobrevivem a restarts (armazenados no Redis)

### 3. Repository Pattern
- **Interface**: `I[Entity]Repository` (@fnd/database)
- **Implementation**: `[Entity]Repository` (Kysely)
- **Retorna**: Domain entities (@fnd/domain)

### 4. Dependency Injection
- **NestJS DI Container**: Gerencia todas as dependências
- **Interface-based**: Sempre injetar interfaces, não implementações
- **Tokens**: Strings para providers (`'IUserRepository'`)

## 🔒 Multi-Tenancy

### Estratégia de Isolamento
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

**Modelo Multi-Workspace**: Cada Account pode ter múltiplos Workspaces. Users pertencem a Accounts e podem ser associados a Workspaces via WorkspaceUser.

### Regras
- **SEMPRE** filtrar queries por `account_id`
- JWT contém `accountId` claim
- Guards verificam ownership antes de qualquer operação
- Nenhum vazamento entre tenants
- Super Admin: Email `SUPER_ADMIN_EMAIL` tem acesso cross-tenant (admin operations)

## 🗄️ Database

### Schema (PostgreSQL + UUID)
```
accounts              # Tenant root
workspaces            # Multi-workspace per account
workspace_users       # User-workspace bridge table
users                 # Auth + roles (linked to account_id)
audit_logs            # Audit trail
webhook_events        # Webhook tracking (Stripe, Supabase)
plans                 # Subscription plans (Stripe Products)
plan_prices           # Versioned prices for plans
subscriptions         # Active subscriptions
```

### Migrations (Knex)
**Pasta**: `libs/app-database/migrations/`
- `20250101001_create_initial_schema.js` - Schema inicial consolidado (todas as tabelas)
- `20250101002_seed_default_plans.js` - Seed de planos padrão
- `20250103001_add_auth_user_id.js` - Adiciona coluna auth_user_id
- `20250103002_remove_legacy_auth_columns.js` - Remove colunas legadas de auth

### Kysely Types
**Arquivo**: `libs/app-database/src/types/Database.ts`
```typescript
export interface Database {
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

## ⚙️ Configuration & Environment

### Environment Variables (.env)
```bash
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:port/db

# Supabase Auth (REQUIRED)
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...  # Frontend-safe, also used in backend
SUPABASE_SECRET_KEY=sb_secret_...  # Backend only - NEVER expose in frontend!
SUPABASE_WEBHOOK_SECRET=your-webhook-secret-here  # For webhook signature validation

# Redis (BullMQ job queue)
REDIS_URL=redis://localhost:6379  # Local development
# REDIS_URL=redis://user:pass@host:port  # Railway production

# Node Mode (execution mode)
NODE_MODE=hybrid  # api | workers | hybrid

# API
API_PORT=3001
API_BASE_URL=http://localhost:3001  # Base URL for webhook generation

# Encryption (AES-256-GCM for credentials)
ENCRYPTION_KEY=your-32-byte-hex-key-here

# Super Admin
SUPER_ADMIN_EMAIL=admin@example.com  # Email for super admin access

# Email
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@domain.com

# Frontend
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=info  # error | warn | info | debug

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Feature Flags
FEATURES_WORKSPACE_ENABLED=true
FEATURES_WORKSPACE_SWITCHING_ENABLED=true
```

### Docker Services (docker-compose.yml)
Ambiente local completo em `infra/docker-compose.yml`:
```yaml
postgres:15-alpine    # Port 5432 (Main PostgreSQL database)
redis:7-alpine        # Port 6379 (BullMQ job queue)
redis-insight:latest  # Port 8001 (Redis monitoring)
pgadmin4:latest       # Port 5050 (PostgreSQL admin)
```

**Benefícios**: Ambiente local completo sem dependências externas

## 📜 Scripts Disponíveis

### Root Package Scripts
```bash
npm run build          # Turbo build (all packages)
npm run clean          # Remove dist folders + cache
npm run dev            # API + Frontend parallel
npm run dev:api        # Backend API only (local development)
npm run test           # Run all tests
npm run lint           # Lint all packages
npm run typecheck      # Type check all packages

# Deploy
git push origin main   # Railway auto-deploy (backend)
# Cloudflare Pages auto-deploy (frontend)
```

### Database Scripts
```bash
npm run migrate:latest   # Run pending migrations
npm run migrate:rollback # Rollback last migration
npm run migrate:make     # Create new migration
```

### Individual Packages
```bash
cd apps/frontend && npm run dev    # Frontend only (Vite)
cd apps/backend && npm run dev:api # Backend API only
```

## 🎨 Frontend Architecture

### Structure
```
apps/frontend/src/
├── components/
│   ├── ui/           # Shadcn/ui primitives (accordion, dialog, tabs, etc.)
│   ├── forms/        # Form components + validation
│   ├── layout/       # Header, Sidebar, AuthLayout
│   ├── auth/         # Auth-specific components
│   └── workspace/    # Workspace management components
├── pages/            # Route pages
│   ├── login.tsx, signup.tsx, signup-success.tsx
│   ├── confirm-email.tsx, email-not-verified.tsx
│   ├── dashboard.tsx
│   └── settings/     # Settings pages
├── hooks/            # useAuth, useSignIn, custom hooks
├── stores/           # Zustand stores (auth-store)
├── lib/              # API client, validations, constants
├── types/            # Frontend types (espelhados do backend)
│   ├── api/          # DTOs espelhados (auth, audit, webhooks, workspace)
│   └── domain/       # Domain entities as interfaces
└── contexts/         # React Contexts
```

### Path Aliases (Frontend)
```json
{
  "@/*": ["./src/*"]
}
```

**Type Strategy**: ALL DTOs consumidos pelo frontend são espelhados em `apps/frontend/src/types/` como interfaces puras (sem decorators). Frontend é 100% desacoplado do backend.

## ✅ Best Practices

### Arquitetura
- ✅ Respeitar hierarquia de dependências (Clean Architecture)
- ✅ Commands são feature-specific (vivem no módulo)
- ✅ Events são contratos (podem ser compartilhados cross-module)
- ✅ Handlers são implementation details (NÃO exportar em index.ts)
- ✅ Um Command/Event por arquivo

### CQRS
- ✅ Operações de escrita: SEMPRE via Commands
- ✅ Queries: direto nos Repositories (sem QueryHandlers)
- ✅ Event Handlers devem ser idempotentes
- ✅ Não retornar entities diretamente - sempre via DTOs

### Multi-Tenancy
- ✅ SEMPRE filtrar por `account_id` em queries
- ✅ Validar `account_id` em todos os endpoints
- ✅ NUNCA confiar no `account_id` vindo do client

### Código
- ✅ Dependency Injection obrigatória (via NestJS)
- ✅ Interfaces antes de implementações
- ✅ Prefer composition over inheritance
- ✅ **KISS**: Keep It Simple, Stupid
- ✅ **YAGNI**: You Aren't Gonna Need It
- ✅ Logs estruturados (Winston) com contexto
- ✅ Usar package references (`@fnd/*`) para libs
- ✅ Relative imports para módulo local e shared services

### Exports
- ✅ Commands: Exportar commands apenas (não handlers)
- ✅ Events: Exportar events apenas (não handlers)
- ✅ Handlers: Implementation detail, não exportar

### Frontend/Backend Type Sharing
- ✅ Backend DTOs: Vivem em `apps/backend/src/api/modules/[module]/dtos/` (co-localizados com features)
- ✅ Frontend Types: TODOS os DTOs consumidos espelhados em `apps/frontend/src/types/` (zero dependências backend)
- ✅ Classes → Interfaces: Backend usa classes com decorators, frontend espelha como interfaces puras
- ✅ Enums: Espelhar exatamente com mesmos valores em frontend (não importar de domain)

### Segurança
- ✅ NUNCA logar credenciais ou dados sensíveis (mascarar em logs)
- ✅ Validar ownership via `account_id` em todos os endpoints
- ✅ Usar guards de autenticação em todos os endpoints protegidos
- ✅ Super Admin access: validar via `SUPER_ADMIN_EMAIL` quando necessário

## 🔍 Observability

### Structured Logging (Winston)
```typescript
logger.info('User created', {
  operation: 'auth.signup.success',
  module: 'AuthModule',
  userId: user.id,
  accountId: user.accountId
});
```

**Levels**: error, warn, info, debug

## 🏛️ Configuration Best Practices

### IConfigurationService Pattern
**NUNCA usar `process.env` diretamente.** Sempre injetar `IConfigurationService`.

```typescript
// ❌ ERRADO - process.env direto
const apiKey = process.env.STRIPE_SECRET_KEY;

// ❌ ERRADO - ConfigService do NestJS
constructor(private configService: ConfigService) {}

// ✅ CORRETO - IConfigurationService
constructor(
  @Inject('IConfigurationService')
  private readonly config: IConfigurationService
) {}
const apiKey = this.config.getStripeSecretKey();
```

**Interface**: `libs/backend/src/services/IConfigurationService.ts`
**Implementation**: `apps/backend/src/shared/services/configuration.service.ts`

## 🔑 Key Files

### Monorepo Config
- `package.json` (root) - workspaces definition
- `turbo.json` - build pipeline
- `tsconfig.base.json` - shared TypeScript config

### Backend Core
- `apps/backend/src/main.ts` - Dispatcher (NODE_MODE routing)
- `apps/backend/src/main.api.ts` - API entrypoint
- `apps/backend/src/main.workers.ts` - Workers entrypoint
- `apps/backend/src/main.hybrid.ts` - Hybrid entrypoint (padrão)
- `apps/backend/src/local.ts` - Local development server
- `apps/backend/src/shared/shared.module.ts` - Shared services

### Workers & Adapters
- `apps/backend/src/workers/` - BullMQ workers (email, audit, stripe-webhook)
- `apps/backend/src/shared/adapters/` - BullMQ adapters (queue, event publisher)
- `apps/backend/src/shared/providers/redis.provider.ts` - Redis connection factory

### Libs (Layers)
- `libs/domain/src/index.ts` - Domain barrel export (entities, enums, types)
- `libs/backend/src/` - Interfaces layer
  - `billing/` - Billing interfaces (IPlanService)
  - `cqrs/` - CQRS interfaces (ICommand, IEvent, ICommandHandler)
  - `features/` - Feature flags interfaces (IFeatureFlagService)
  - `messaging/` - Messaging interfaces (IEventPublisher, IQueueService)
  - `payment/` - Payment interfaces (IPaymentService)
  - `scheduling/` - Scheduling interfaces (IScheduleService)
  - `services/` - Service interfaces (ILoggerService, IEmailService, IEncryptionService, etc.)
  - `webhooks/` - Webhook interfaces (IWebhookParser, ParseResult)
- `libs/app-database/src/index.ts` - Repositories barrel export (PostgreSQL, uses domain entities)

### Database
- `libs/app-database/migrations/` - Knex migrations (PostgreSQL)
- `libs/app-database/knexfile.js` - Migration config
- `libs/app-database/src/types/Database.ts` - Kysely schema (PostgreSQL)

## 📦 Features Desenvolvidas

Funcionalidades desenvolvidas no projeto estao documentadas em `/docs/features/`. Cada feature possui pasta propria com estrutura padronizada contendo tres documentos: `about.md` (requisitos e escopo), `discovery.md` (processo de descoberta e decisoes) e `implementation.md` (detalhes tecnicos da implementacao). Consultar esta pasta para entender contexto de features existentes antes de implementar novas funcionalidades.

## 🎯 Design Principles

- **KISS**: Keep It Simple, Stupid
- **YAGNI**: You Aren't Gonna Need It
- **Single Responsibility**: One class, one reason to change
- **Dependency Inversion**: Depend on abstractions, not concretions
- **Open/Closed**: Open for extension, closed for modification
- **Zero over-engineering**: Pragmatismo acima de tudo

## 📝 Convenções Adicionais

### Domain Layer Organization
**Entities**: `libs/domain/src/entities/`
- Account, AuditLog, Plan, PlanPrice, Subscription, User, WebhookEvent, Workspace, WorkspaceUser

**Enums**: `libs/domain/src/enums/`
- EntityStatus, OnboardingStatus, PaymentProvider, PlanCode, SubscriptionStatus, UserRole, WebhookStatus, WebhookType

**Types**: `libs/domain/src/types/`
- Billing types, feature flags, audit types

### Event Naming Convention
- **Domain Events**: `[Subject][PastTenseAction]Event` (ex: `AccountCreatedEvent`, `UserSignedUpEvent`)
- **Integration Events**: Mesmo padrão, mas publicados via `IEventBroker` para consumo cross-module
- **Event Handlers**: `[EventName]Handler` (ex: `AccountCreatedEventHandler`)
- **Event Data**: Incluir sempre `accountId`, `timestamp`, `aggregateId`

### Repository Method Naming
- `findById(id)` - Busca por ID (retorna null se não encontrado)
- `findAll(filters?)` - Lista todos (com filtros opcionais)
- `findByAccountId(accountId)` - Filtrado por tenant
- `create(dto)` - Cria nova entidade
- `update(id, dto)` - Atualiza entidade existente
- `delete(id)` - Soft ou hard delete (conforme entidade)
- `exists(id)` - Verifica existência booleana

### Service Method Naming
- `execute()` - Para command handlers
- `handle()` - Para event handlers
- Métodos de serviço: verbos descritivos (`sendEmail`, `generateToken`, `validateCredentials`)

### Error Handling
- Usar exceptions do NestJS (`BadRequestException`, `NotFoundException`, `UnauthorizedException`, `ForbiddenException`)
- NUNCA retornar null para operações que devem encontrar entidade (throw `NotFoundException`)
- Validação de DTOs via `class-validator` decorators
- Global exception filter captura e formata erros consistentemente
