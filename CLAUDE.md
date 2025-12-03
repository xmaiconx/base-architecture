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
- **Job Queue**: BullMQ 4.0 + Redis (ioredis 5.3)
- **Message Bus**: RabbitMQ + amqplib 0.10.9 (event broker)
- **Auth**: Passport 0.6 + JWT + bcrypt 5.1
- **Email**: Resend 2.0 (async via queue)
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
│   ├── backend/         # @fnd/api - NestJS API + Workers (DTOs in module folders)
│   └── frontend/        # @fnd/frontend - React App (DTOs mirrored in types/)
└── libs/
    ├── domain/          # @fnd/domain - Domain entities, enums, types
    ├── backend/         # @fnd/backend - Service interfaces
    ├── app-database/    # @fnd/database - Data access (PostgreSQL, uses domain entities)
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
├── entities/          # Account, User, Workspace, WorkspaceUser, Project, AuditLog, WebhookEvent
├── enums/             # EntityStatus, UserRole, MessageType, ProjectStatus (um por arquivo)
├── types/             # MessageContext, MessageMetadata, PipelineResult, ProjectPipelineConfig
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

## 🎯 Backend Architecture

### Dual-Mode Bootstrap
**Arquivo**: `apps/backend/src/index.ts`

**Modes** (via `NODE_MODE` env):
- `api-only`: HTTP API apenas (porta 3001)
- `workers-only`: BullMQ workers apenas
- `undefined`: API + Workers juntos

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
- `IJobQueue` → `RedisJobQueueService`
- `IEmailService` → `ResendEmailService`
- `IEmailQueueService` → `EmailQueueService`
- `IEventBroker` → `BullMQEventBrokerService`
- `IMessageBufferService` → `RedisMessageBufferService`
- `IScheduleService` → `RedisScheduleService`
- `IConfigurationService` → `ConfigurationService`
- `IEncryptionService` → `EncryptionService`
- `DATABASE` → Kysely instance (PostgreSQL)
- Todos os Repositories (User, Account, Workspace, WorkspaceUser, AuditLog, WebhookEvent, Thread, Message, Project)

### Workers Module
**Arquivo**: `apps/backend/src/workers/worker.module.ts`

**Processors**:
- `EmailWorker` (processa fila de emails via Resend)
- `DomainEventsProcessor` (processa domain/integration events)
- `AuditEventListener` (global event handler) + `AuditProcessor`
- **Webhook Processors** (processa webhooks por protocolo):
  - `BaseWebhookProcessor` (classe abstrata)
  - `WhaticketWebhookProcessor`
  - `WahaWebhookProcessor`
  - `NotificamehubWebhookProcessor`
- `MessagePipelineProcessor` (executa pipeline de mensagens)
- `MessageBufferProcessor` (processa buffer de mensagens)

### Backend API Modules
**Pasta**: `apps/backend/src/api/modules/`

**Módulos Ativos**:
1. **auth/** - Autenticação e autorização
   - Structure: commands/, events/, queries/, services/, strategies/, dtos/
   - Implements: signup, signin, JWT strategy, password recovery

2. **audit/** - Logs de auditoria
   - Structure: dtos/
   - Read-only access to audit logs

3. **webhooks/** - Processamento de webhooks
   - Structure: dtos/
   - Receives and processes webhook events from external channels

4. **workspace/** - Gerenciamento de workspaces
   - Structure: events/, dtos/
   - Multi-workspace support per account
   - User-workspace relationships

## 🔄 Padrões Arquiteturais

### 1. CQRS (Command Query Responsibility Segregation)
- **Commands**: Operações de escrita (via CommandHandlers)
- **Queries**: Leitura direta nos Repositories
- **Separação clara** entre write e read models

### 2. Event-Driven Architecture
**Componentes**:
- `IEventBroker` (interface) → `BullMQEventBrokerService` (implementação)
- `EventSerializerService` (serialização de eventos para fila)
- `DomainEventsProcessor` (worker que processa eventos)
- `EventHandlerRegistry` (registro de handlers globais)

**Fluxo**:
- **Domain Events**: Internos ao módulo, transacionais
- **Integration Events**: Entre módulos, assíncronos via BullMQ
- **Handlers idempotentes**: Podem ser executados múltiplas vezes
- **Global Handlers**: AuditEventListener escuta todos os eventos para auditoria

### 3. Repository Pattern
- **Interface**: `I[Entity]Repository` (@fnd/database)
- **Implementation**: `[Entity]Repository` (Kysely)
- **Retorna**: Domain entities (@fnd/domain)

### 4. Pipeline Pattern
**Arquivo**: `apps/backend/src/shared/messages/pipeline/`

**Componentes**:
- `IMessagePipelineStep` (interface)
- `MessagePipeline` (executor)
- `MessagePipelineFactory` (cria pipelines por projeto)
- `PipelineStepRegistry` (registro de steps)

```typescript
execute(context: MessageContext): Promise<PipelineResult>
// PipelineResult = { shouldContinue, context, reason? }
```

**Base Steps** (execução sequencial):
- `AddToBufferStep` - Adiciona mensagem ao buffer
- `BufferMessagesStep` - Gerencia buffer de mensagens
- `CheckCommandStep` - Verifica comandos especiais
- `ClearBufferStep` - Limpa buffer
- `ConvertMediaToTextStep` - Converte áudio/imagem em texto
- `GenerateAIResponseStep` - Gera resposta com IA
- `LoadBufferedMessagesStep` - Carrega mensagens bufferizadas
- `SaveMessageStep` - Persiste mensagem
- `SendResponseStep` - Envia resposta ao canal
- `VerifyAuthorizedSenderStep` - Valida remetente autorizado

**Project-Specific Steps** (extensão):
- `pipeline/projects/mp-my-iablue/` - Steps customizados por projeto

### 5. Factory Pattern
- **WebhookParserFactory**: Cria parsers por protocol (Whaticket, Waha, Notificamehub)
- **MessageParserFactory**: Cria parsers de mensagem por tipo
- **MessagePipelineFactory**: Cria pipelines customizados por projeto

### 6. Encryption Service
**Arquivo**: `apps/backend/src/shared/services/encryption.service.ts`

**Interface**: `IEncryptionService` (libs/backend/src/security/)
- **Algorithm**: AES-256-GCM
- **Purpose**: Criptografa credenciais sensíveis (tokens, API keys)
- **Methods**: `encrypt(plaintext: string): string`, `decrypt(ciphertext: string): string`

### 7. Dependency Injection
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
  ↓ own
Projects, WebhookEvents (filtrados por account_id)
  ↓ generate
Threads, Messages (filtrados por account_id)
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
webhook_events        # Incoming webhook events (auditing + async processing)
threads               # Conversation threads
messages              # Individual messages
projects              # Bot/agent project configurations
```

### Migrations (Knex)
**Pasta**: `libs/app-database/migrations/`
- `20240926001_create_core_tables.js` - Core tables (accounts, workspaces, workspace_users)
- `20240926002_create_user_tables.js` - Users table
- `20240926006_create_audit_logs_table.js` - Audit logs
- `20241027001_create_webhook_events_table.js` - Webhook events
- `20241030001_create_threads_table.js` - Threads
- `20241030002_create_messages_table.js` - Messages
- `20241030003_create_projects_table.js` - Projects
- `20241030004_alter_webhook_events_add_normalized_message.js` - Schema modification
- `20250102001_add_workspace_onboarding_fields.js` - Workspace enhancements

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
  threads: ThreadTable;
  messages: MessageTable;
  projects: ProjectTable;
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

# Redis (single instance for jobs + cache)
REDIS_JOBS_URL=redis://localhost:6379

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

# Bootstrap Mode
NODE_MODE=  # api-only | workers-only | undefined (both)

# Feature Flags
FEATURES_WORKSPACE_ENABLED=true
FEATURES_WORKSPACE_SWITCHING_ENABLED=true
```

### Docker Services (docker-compose.yml)
```yaml
postgres:15-alpine    # Port 5432 (Main PostgreSQL database)
redis_jobs:7-alpine   # Port 6379 (persistent AOF, jobs + cache)
cloudbeaver:latest    # Port 8080 (Universal DB manager - PostgreSQL + MySQL)
redis_insight:latest  # Port 8001 (Redis GUI)
```

**Removidos**: `redis_cache` (unified Redis), `rabbitmq` (amqplib presente mas sem container), `pgadmin` (substituído por CloudBeaver)

## 📜 Scripts Disponíveis

### Root Package Scripts
```bash
npm run build          # Turbo build (all packages)
npm run clean          # Remove dist folders + cache
npm run dev            # API + Frontend parallel
npm run dev:api        # Backend API only
npm run dev:workers    # Backend workers only
npm run test           # Run all tests
npm run lint           # Lint all packages
npm run typecheck      # Type check all packages
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
- ✅ SEMPRE criptografar credenciais sensíveis (usar `IEncryptionService`)
- ✅ Credentials (tokens, API keys) devem ser encrypted at rest
- ✅ Usar AES-256-GCM para encryption (via `ENCRYPTION_KEY` env var)
- ✅ NUNCA logar credenciais ou dados sensíveis (mascarar em logs)
- ✅ Validar ownership via `account_id` em todos os endpoints
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

### Pipeline Execution History
```typescript
context.executionHistory.push({
  stepName: 'GenerateAIResponseStep',
  startedAt: new Date(),
  completedAt: new Date(),
  durationMs: 150,
  continued: true,
  stopReason?: 'Optional stop reason',
  error?: 'Error message if failed'
});
```

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
- `apps/backend/src/index.ts` - Bootstrap (dual-mode)
- `apps/backend/src/api/main.ts` - API server
- `apps/backend/src/workers/main.ts` - Workers
- `apps/backend/src/shared/shared.module.ts` - Shared services

### Libs (Layers)
- `libs/domain/src/index.ts` - Domain barrel export (entities, enums, types)
- `libs/backend/src/` - Interfaces layer
  - `cqrs/` - CQRS interfaces (ICommand, IEvent, ICommandHandler)
  - `services/` - Service interfaces (ILoggerService, IEmailService, IEncryptionService, etc.)
  - `messaging/` - Messaging interfaces (IEventBroker, IJobQueue)
  - `pipelines/` - Pipeline interfaces (IMessagePipeline, IMessagePipelineStep)
  - `webhooks/` - Webhook interfaces (IWebhookParser, IMessageParser)
  - `scheduling/` - Scheduling interfaces (IScheduleService)
  - `features/` - Feature flags interfaces (IFeatureFlagService)
  - `payment/` - Payment interfaces (IPaymentService)
- `libs/app-database/src/index.ts` - Repositories barrel export (PostgreSQL, uses domain entities)

### Database
- `libs/app-database/migrations/` - Knex migrations (PostgreSQL)
- `libs/app-database/knexfile.ts` - Migration config
- `libs/app-database/src/types/Database.ts` - Kysely schema (PostgreSQL)

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
- Account, User, Workspace, WorkspaceUser, AuditLog, WebhookEvent, Project

**Enums**: `libs/domain/src/enums/`
- EntityStatus, UserRole, OnboardingStatus, ProjectStatus
- WebhookStatus, WebhookType
- ChatChannel, ChatProvider, ChatImplementation, PaymentProvider
- MessageType, MessageStatus, MessageDirection, InteractiveType

**Types**: `libs/domain/src/types/`
- MessageProtocol, MessageContents, MessageMetadata, MessageContext
- MediaObject, PipelineResult, WebhookMetadata, WebhookGatewayConfig
- ProjectPipelineConfig

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
