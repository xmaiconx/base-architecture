# Technical Plan: Railway Hybrid Architecture

**Feature:** F0007-railway-hybrid-architecture
**Branch:** refactor/F0007-railway-hybrid-architecture
**Date:** 2025-12-05

---

## 1. Solution Overview

Esta feature reverte a arquitetura serverless (Vercel + QStash) implementada na F0006 para uma arquitetura híbrida tradicional com Railway + Redis + BullMQ. A mudança é necessária porque o modelo serverless não suporta adequadamente o padrão CQRS com processamento assíncrono de eventos que o template utiliza.

A nova arquitetura permite que o backend rode em três modos: **API** (apenas endpoints HTTP), **Workers** (apenas processadores de filas BullMQ), ou **Hybrid** (ambos no mesmo processo). Isso oferece flexibilidade para escalar API e Workers independentemente quando necessário, enquanto simplifica o desenvolvimento local com modo híbrido.

O deploy será feito no Railway (backend Docker) e Cloudflare Pages (frontend SPA estático). Redis será usado tanto para filas BullMQ quanto para cache futuro. As interfaces cloud-agnostic existentes (IQueueService, IEventPublisher) serão mantidas, apenas trocando a implementação de QStash para BullMQ.

A lógica de negócio dos handlers existentes em `libs/workers` será migrada para workers BullMQ dentro do backend, eliminando a necessidade de serviços "simple" que existiam para contornar a falta de DI no contexto serverless.

---

## 2. Components to Develop

### 2.1 Backend - Adapters BullMQ

**Pasta:** `apps/backend/src/shared/adapters/`

| Arquivo | Responsabilidade |
|---------|------------------|
| `bullmq-queue.adapter.ts` | Implementa `IQueueService` usando BullMQ Queue |
| `bullmq-event-publisher.adapter.ts` | Implementa `IEventPublisher` usando BullMQ Queue |
| `redis-connection.provider.ts` | Factory para conexão Redis compartilhada (IORedis) |

**Arquivos a Remover:**
- `qstash-queue.adapter.ts`
- `qstash-event-publisher.adapter.ts`

### 2.2 Backend - Workers BullMQ

**Pasta:** `apps/backend/src/workers/`

| Arquivo | Responsabilidade |
|---------|------------------|
| `workers.module.ts` | Módulo NestJS para configuração dos workers |
| `email.worker.ts` | Processa fila de emails (plain e template) |
| `audit.worker.ts` | Processa fila de audit logs |
| `stripe-webhook.worker.ts` | Processa fila de webhooks Stripe |

### 2.3 Backend - Entrypoints

**Pasta:** `apps/backend/src/`

| Arquivo | Responsabilidade |
|---------|------------------|
| `main.api.ts` | Entrypoint modo API only (HTTP server) |
| `main.workers.ts` | Entrypoint modo Workers only (BullMQ consumers) |
| `main.hybrid.ts` | Entrypoint modo Hybrid (API + Workers) |
| `main.ts` | Dispatcher que lê `NODE_MODE` e chama entrypoint correto |

**Arquivos Existentes a Atualizar:**
- `local.ts` - Ajustar para usar novo main.ts
- `index.ts` - Manter para compatibilidade (Vercel export, pode ser removido depois)

### 2.4 Infraestrutura Docker

**Pasta:** `/infra/`

| Arquivo | Responsabilidade |
|---------|------------------|
| `docker-compose.yml` | Ambiente local (PostgreSQL, Redis, Redis Insight, PgAdmin) |
| `docker-compose.dev.yml` | Override para desenvolvimento (volumes, hot-reload) |

**Pasta:** `/apps/backend/`

| Arquivo | Responsabilidade |
|---------|------------------|
| `Dockerfile` | Reescrever para estrutura atual de libs (domain, backend, app-database) |
| `docker-entrypoint.sh` | Script de entrada que executa migrations e inicia app |

### 2.5 Código a Remover

| Pasta/Arquivo | Razão |
|---------------|-------|
| `apps/workers/` | Vercel Functions wrappers (serverless) |
| `libs/workers/` | Handlers serverless e serviços "simple" |
| `apps/backend/src/shared/adapters/qstash-*.ts` | Adapters QStash |

### 2.6 Configuração

**Arquivos a Atualizar:**
- `apps/backend/.env.example` - Adicionar REDIS_URL, NODE_MODE; remover QSTASH_*
- `apps/frontend/.env.example` - Ajustar se necessário
- `CLAUDE.md` - Atualizar documentação de arquitetura
- `README.md` - Instruções de deploy Railway + Cloudflare
- `package.json` (root) - Remover workspace de `apps/workers` e `libs/workers`
- `turbo.json` - Remover builds de workers serverless

---

## 3. Integration Contracts

### 3.1 Queue Contracts (BullMQ)

#### Queue: `email`
**Propósito:** Processamento assíncrono de envio de emails

**Job Data:**
- `type`: `'SEND_EMAIL' | 'SEND_EMAIL_TEMPLATE'`
- `to`: Email do destinatário
- `subject`: Assunto (quando type = SEND_EMAIL)
- `body`: Corpo HTML (quando type = SEND_EMAIL)
- `templateId`: ID do template (quando type = SEND_EMAIL_TEMPLATE)
- `variables`: Variáveis do template (quando type = SEND_EMAIL_TEMPLATE)

**Job Options:**
- `attempts`: 3
- `backoff`: exponential, 1000ms inicial
- `removeOnComplete`: 100 (manter últimos 100 jobs completos)
- `removeOnFail`: 1000 (manter últimos 1000 jobs falhos)

**Processamento:**
1. Validar payload (email válido, campos obrigatórios)
2. Chamar ResendEmailService
3. Log de sucesso ou falha

---

#### Queue: `audit`
**Propósito:** Persistência assíncrona de audit logs

**Job Data:**
- `eventName`: Nome do evento (ex: `AccountCreatedEvent`)
- `eventType`: `'domain' | 'integration'`
- `occurredAt`: Timestamp ISO do evento
- `payload`: Dados do evento
  - `accountId`: ID da conta (opcional)
  - `workspaceId`: ID do workspace (opcional)
  - `userId`: ID do usuário (opcional)
  - Campos específicos do evento

**Job Options:**
- `attempts`: 5
- `backoff`: exponential, 500ms inicial
- `removeOnComplete`: 1000
- `removeOnFail`: 5000

**Processamento:**
1. Validar payload (eventName, eventType obrigatórios)
2. Criar registro via AuditLogRepository
3. Log de sucesso ou falha

---

#### Queue: `stripe-webhook`
**Propósito:** Processamento assíncrono de webhooks Stripe

**Job Data:**
- `id`: ID do evento Stripe
- `type`: Tipo do evento (ex: `customer.subscription.created`)
- `data`: Objeto do evento
  - `object`: Dados do recurso Stripe
- `created`: Timestamp Unix
- `livemode`: boolean

**Job Options:**
- `attempts`: 5
- `backoff`: exponential, 2000ms inicial
- `removeOnComplete`: 500
- `removeOnFail`: 2000

**Processamento:**
1. Validar payload (id, type, data obrigatórios)
2. Salvar em WebhookEventRepository com status PENDING
3. Processar baseado no type do evento
4. Atualizar status para PROCESSED ou FAILED

---

### 3.2 Adapter Contracts

#### IQueueService Implementation (BullMQQueueAdapter)

**Método: `enqueue(taskName, payload, options?)`**
- Mapeia `taskName` para nome da fila BullMQ
- Adiciona job com payload
- Retorna job ID como string

**Método: `enqueueWithDelay(taskName, payload, delaySeconds)`**
- Adiciona job com opção `delay` em milissegundos
- Retorna job ID como string

---

#### IEventPublisher Implementation (BullMQEventPublisher)

**Método: `publish(event)`**
- Extrai eventName do evento
- Determina fila destino baseado no tipo de evento
- Eventos de audit → fila `audit`
- Eventos de email → fila `email`
- Publica na fila apropriada

**Método: `publishBatch(events)`**
- Itera sobre eventos
- Chama `publish` para cada um
- Usa bulk add do BullMQ para eficiência

---

### 3.3 Configuration Contract

**Variáveis de Ambiente Adicionadas:**
```
REDIS_URL=redis://localhost:6379
NODE_MODE=hybrid  # api | workers | hybrid
```

**Variáveis de Ambiente Removidas:**
```
QSTASH_TOKEN
QSTASH_CURRENT_SIGNING_KEY
QSTASH_NEXT_SIGNING_KEY
VERCEL_URL
```

**IConfigurationService - Novos Métodos:**
- `getRedisUrl(): string` - URL de conexão Redis
- `getNodeMode(): 'api' | 'workers' | 'hybrid'` - Modo de execução

**IConfigurationService - Métodos Removidos:**
- `getQStashToken()`
- `getQStashCurrentSigningKey()`
- `getQStashNextSigningKey()`
- `getWorkerBaseUrl()`

---

## 4. Complete Data Flows

### 4.1 Flow: Envio de Email Assíncrono

```
1. Controller/Handler precisa enviar email
2. EmailQueueService.enqueueEmail(emailData) é chamado
3. EmailQueueService usa IQueueService.enqueue('email', payload)
4. BullMQQueueAdapter adiciona job na fila 'email' do Redis
5. [Async] EmailWorker consome job da fila
6. EmailWorker valida payload
7. EmailWorker chama ResendEmailService.sendEmail()
8. Resend API envia email
9. EmailWorker marca job como completed
10. Log de sucesso registrado
```

### 4.2 Flow: Audit Log Assíncrono

```
1. EventBrokerService.publish(DomainEvent)
2. EventBrokerService usa IEventPublisher.publish(event)
3. BullMQEventPublisher identifica evento de audit
4. BullMQEventPublisher adiciona job na fila 'audit'
5. [Async] AuditWorker consome job da fila
6. AuditWorker valida payload
7. AuditWorker chama AuditLogRepository.create()
8. Registro persistido no PostgreSQL
9. AuditWorker marca job como completed
10. Log de sucesso registrado
```

### 4.3 Flow: Stripe Webhook Processing

```
1. Stripe envia POST para /api/v1/billing/webhooks/stripe
2. BillingController recebe request
3. Controller valida assinatura Stripe
4. Controller usa IQueueService.enqueue('stripe-webhook', payload)
5. Retorna 200 OK imediatamente (acknowledge)
6. [Async] StripeWebhookWorker consome job
7. Worker salva em WebhookEventRepository (PENDING)
8. Worker processa baseado no event.type
9. Worker atualiza status (PROCESSED/FAILED)
10. Log de resultado registrado
```

### 4.4 Flow: Startup em Modo Hybrid

```
1. Container inicia com NODE_MODE=hybrid
2. main.ts lê NODE_MODE
3. main.ts chama main.hybrid.ts
4. NestJS bootstrap inicia
5. AppModule carrega todos os módulos
6. SharedModule inicializa:
   - Conexão Redis (IORedis)
   - BullMQQueueAdapter
   - BullMQEventPublisher
   - Todos os repositories
7. WorkersModule inicializa:
   - EmailWorker conecta na fila 'email'
   - AuditWorker conecta na fila 'audit'
   - StripeWebhookWorker conecta na fila 'stripe-webhook'
8. HTTP Server inicia na porta configurada
9. Health check endpoint disponível
10. Sistema pronto para requests e jobs
```

---

## 5. Component Dependencies

### 5.1 Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                        main.ts                               │
│  (dispatcher baseado em NODE_MODE)                          │
└────────────────┬──────────────┬──────────────┬──────────────┘
                 │              │              │
         ┌───────▼───────┐ ┌───▼───┐ ┌───────▼───────┐
         │ main.api.ts   │ │hybrid │ │ main.workers  │
         │ (HTTP only)   │ │ (both)│ │ (queues only) │
         └───────┬───────┘ └───┬───┘ └───────┬───────┘
                 │             │             │
         ┌───────▼─────────────▼─────────────▼───────┐
         │              AppModule                     │
         └───────┬─────────────┬─────────────┬───────┘
                 │             │             │
    ┌────────────▼──┐  ┌───────▼───┐  ┌──────▼───────┐
    │ API Modules   │  │SharedModule│  │WorkersModule │
    │ (auth, audit, │  │            │  │              │
    │  workspace,   │  │            │  │              │
    │  billing)     │  │            │  │              │
    └───────┬───────┘  └──────┬─────┘  └──────┬───────┘
            │                 │               │
            │    ┌────────────┴────────────┐  │
            │    │                         │  │
            ▼    ▼                         ▼  ▼
    ┌───────────────────┐         ┌───────────────────┐
    │ IQueueService     │         │ Workers           │
    │ IEventPublisher   │         │ (Email, Audit,    │
    │ Repositories      │         │  StripeWebhook)   │
    └─────────┬─────────┘         └─────────┬─────────┘
              │                             │
              └──────────────┬──────────────┘
                             │
                   ┌─────────▼─────────┐
                   │    Redis/BullMQ   │
                   │    PostgreSQL     │
                   └───────────────────┘
```

### 5.2 Module Dependencies

| Módulo | Depende de |
|--------|------------|
| `AppModule` | SharedModule, WorkersModule, API Modules |
| `SharedModule` | ConfigModule, @fnd/database |
| `WorkersModule` | SharedModule (repositories, services) |
| `AuthModule` | SharedModule |
| `BillingModule` | SharedModule |
| `WorkspaceModule` | SharedModule |
| `AuditModule` | SharedModule |

### 5.3 Adapter Dependencies

| Adapter | Depende de |
|---------|------------|
| `BullMQQueueAdapter` | IConfigurationService, ILoggerService, Redis Connection |
| `BullMQEventPublisher` | IConfigurationService, ILoggerService, Redis Connection |

### 5.4 Worker Dependencies

| Worker | Depende de |
|--------|------------|
| `EmailWorker` | IEmailService, ILoggerService |
| `AuditWorker` | IAuditLogRepository, ILoggerService |
| `StripeWebhookWorker` | IWebhookEventRepository, IAccountRepository, ILoggerService |

---

## 6. Development Order

### Phase 1: Foundation (Cleanup & Dependencies)

**Step 1.1: Remover dependência QStash**
- Remover `@upstash/qstash` do package.json do backend
- Adicionar `bullmq` e `ioredis` ao package.json do backend
- Executar `npm install`
- **Razão:** Preparar dependências antes de alterar código

**Step 1.2: Remover apps/workers**
- Deletar pasta `apps/workers/` completamente
- Remover do `package.json` root (workspaces)
- Remover do `turbo.json` (build pipeline)
- **Razão:** Código serverless não será mais utilizado

**Step 1.3: Remover libs/workers**
- Deletar pasta `libs/workers/` completamente
- Remover do `package.json` root (workspaces)
- Remover do `turbo.json` (build pipeline)
- **Razão:** Handlers serão reimplementados dentro do backend

**Step 1.4: Remover adapters QStash**
- Deletar `apps/backend/src/shared/adapters/qstash-queue.adapter.ts`
- Deletar `apps/backend/src/shared/adapters/qstash-event-publisher.adapter.ts`
- Atualizar `apps/backend/src/shared/adapters/index.ts`
- **Razão:** Serão substituídos por adapters BullMQ

### Phase 2: Core Implementation (Adapters & Workers)

**Step 2.1: Criar Redis Connection Provider**
- Criar `apps/backend/src/shared/providers/redis.provider.ts`
- Factory que cria conexão IORedis compartilhada
- Injetar via token `REDIS_CONNECTION`
- **Razão:** Conexão Redis compartilhada entre adapters e workers

**Step 2.2: Implementar BullMQQueueAdapter**
- Criar `apps/backend/src/shared/adapters/bullmq-queue.adapter.ts`
- Implementar IQueueService com BullMQ Queue
- Injetar Redis connection e services
- **Razão:** Substitui QStash para enfileiramento de jobs

**Step 2.3: Implementar BullMQEventPublisher**
- Criar `apps/backend/src/shared/adapters/bullmq-event-publisher.adapter.ts`
- Implementar IEventPublisher com BullMQ Queue
- Rotear eventos para filas apropriadas
- **Razão:** Substitui QStash para publicação de eventos

**Step 2.4: Atualizar IConfigurationService**
- Remover métodos QStash de `libs/backend/src/services/IConfigurationService.ts`
- Adicionar `getRedisUrl()` e `getNodeMode()`
- Atualizar `apps/backend/src/shared/services/configuration.service.ts`
- **Razão:** Configuração para novos serviços

**Step 2.5: Criar WorkersModule**
- Criar `apps/backend/src/workers/workers.module.ts`
- Módulo NestJS que agrupa todos os workers
- Importa SharedModule para dependências
- **Razão:** Organização dos workers em módulo dedicado

**Step 2.6: Implementar EmailWorker**
- Criar `apps/backend/src/workers/email.worker.ts`
- Processar jobs da fila 'email'
- Usar ResendEmailService existente
- **Razão:** Processamento assíncrono de emails

**Step 2.7: Implementar AuditWorker**
- Criar `apps/backend/src/workers/audit.worker.ts`
- Processar jobs da fila 'audit'
- Usar AuditLogRepository existente
- **Razão:** Persistência assíncrona de audit logs

**Step 2.8: Implementar StripeWebhookWorker**
- Criar `apps/backend/src/workers/stripe-webhook.worker.ts`
- Processar jobs da fila 'stripe-webhook'
- Usar WebhookEventRepository existente
- **Razão:** Processamento assíncrono de webhooks Stripe

### Phase 3: Integration (Entrypoints & Module Updates)

**Step 3.1: Atualizar SharedModule**
- Remover imports QStash
- Adicionar provider Redis connection
- Trocar QStashQueueAdapter → BullMQQueueAdapter
- Trocar QStashEventPublisher → BullMQEventPublisher
- **Razão:** Integrar novos adapters no DI container

**Step 3.2: Criar main.api.ts**
- Entrypoint para modo API only
- Bootstrap NestJS sem WorkersModule
- **Razão:** Permitir escalar API independentemente

**Step 3.3: Criar main.workers.ts**
- Entrypoint para modo Workers only
- Bootstrap apenas WorkersModule e dependências
- Sem HTTP server
- **Razão:** Permitir escalar Workers independentemente

**Step 3.4: Criar main.hybrid.ts**
- Entrypoint para modo Hybrid
- Bootstrap completo (API + Workers)
- **Razão:** Modo padrão para desenvolvimento e deploy simples

**Step 3.5: Criar main.ts dispatcher**
- Ler NODE_MODE do environment
- Chamar entrypoint apropriado
- Validar valores permitidos
- **Razão:** Ponto de entrada único que roteia para modo correto

**Step 3.6: Atualizar local.ts**
- Ajustar para usar novo main.ts
- Definir NODE_MODE=hybrid como default para dev
- **Razão:** Manter desenvolvimento local funcional

### Phase 4: Infrastructure (Docker & Config)

**Step 4.1: Criar docker-compose.yml**
- Criar pasta `infra/`
- PostgreSQL 15 na porta 5432
- Redis 7 na porta 6379
- Redis Insight na porta 8001
- PgAdmin na porta 5050
- Network `fnd` para comunicação
- **Razão:** Ambiente local completo

**Step 4.2: Reescrever Dockerfile**
- Atualizar para libs atuais (domain, backend, app-database)
- Remover referências a app-shared, app-infra
- Suportar NODE_MODE via ENV
- Multi-stage build otimizado
- **Razão:** Dockerfile atual referencia libs inexistentes

**Step 4.3: Atualizar docker-entrypoint.sh**
- Verificar variáveis obrigatórias
- Executar migrations se necessário
- Iniciar aplicação baseado em NODE_MODE
- **Razão:** Script de entrada para container

**Step 4.4: Atualizar .env.example**
- Adicionar REDIS_URL, NODE_MODE
- Remover QSTASH_TOKEN, QSTASH_CURRENT_SIGNING_KEY, QSTASH_NEXT_SIGNING_KEY, VERCEL_URL
- **Razão:** Documentar variáveis necessárias

### Phase 5: Documentation & Cleanup

**Step 5.1: Atualizar CLAUDE.md**
- Remover seções QStash/Vercel serverless
- Adicionar seções BullMQ/Railway
- Atualizar diagramas de arquitetura
- Atualizar variáveis de ambiente
- **Razão:** Manter documentação sincronizada

**Step 5.2: Atualizar README.md**
- Instruções de setup local com docker-compose
- Instruções de deploy Railway
- Instruções de deploy Cloudflare Pages
- Variáveis de ambiente necessárias
- **Razão:** Guia para alunos do FND

**Step 5.3: Cleanup final**
- Remover imports não utilizados
- Verificar build passa
- Verificar TypeScript sem erros
- **Razão:** Garantir código limpo e funcional

---

## 7. Testing Strategy

### 7.1 Backend API Tests

**Unit Tests:**
- Adapters BullMQ: Mock de Queue, verificar chamadas corretas
- Workers: Mock de services, verificar processamento correto
- Configuration: Verificar leitura de env vars

**Integration Tests:**
- Adapters + Redis real (testcontainers)
- Workers + PostgreSQL real (testcontainers)
- Flow completo de enqueue → process

### 7.2 Workers Tests

**Unit Tests por Worker:**
- EmailWorker: Mock IEmailService, testar validações
- AuditWorker: Mock IAuditLogRepository, testar criação de registro
- StripeWebhookWorker: Mock repositories, testar processamento por tipo

**Edge Cases:**
- Payload inválido → job falha com erro descritivo
- Serviço externo falha → retry automático
- Job duplicado → handlers idempotentes

### 7.3 Docker Tests

**Manual Testing:**
- `docker-compose up` sobe todos os serviços
- Backend conecta em Redis e PostgreSQL
- Migrations executam corretamente
- Health check passa

**Modes Testing:**
- `NODE_MODE=api` → apenas HTTP server
- `NODE_MODE=workers` → apenas BullMQ consumers
- `NODE_MODE=hybrid` → ambos funcionam

---

## 8. Attention Points

### 8.1 Performance

| Concern | Strategy |
|---------|----------|
| Conexão Redis | Pool de conexões via IORedis, reuso de conexão |
| Cold start | Modo hybrid evita cold start de workers separados |
| Job throughput | BullMQ suporta milhares de jobs/segundo, adequado para volume esperado |
| Memory | Limitar jobs em memória (removeOnComplete, removeOnFail) |

### 8.2 Security

| Concern | Strategy |
|---------|----------|
| Redis connection | REDIS_URL com TLS em produção |
| Webhook validation | Manter validação de assinatura Stripe |
| Multi-tenancy | Manter account_id em todos os jobs para isolamento |
| Credentials | Não logar payloads completos (podem conter dados sensíveis) |

### 8.3 Observability

| Concern | Strategy |
|---------|----------|
| Logging | Winston estruturado em todos os workers |
| Job metrics | BullMQ events para métricas (completed, failed, stalled) |
| Health check | Endpoint /health verifica conexão Redis |
| Error tracking | Logs de erro com context completo |

### 8.4 Reliability

| Concern | Strategy |
|---------|----------|
| Job persistence | Redis persiste jobs, sobrevive a restart |
| Retries | Configuração de retries com backoff exponencial |
| Dead letter | Jobs falhos mantidos para análise (removeOnFail alto) |
| Idempotência | Handlers devem ser idempotentes (safe para retry) |

---

## 9. Integration Checklist

### Pre-Development
- [ ] Backup de código atual (branch limpa)
- [ ] Documentação de rollback se necessário

### Phase 1: Foundation
- [ ] QStash removido do package.json
- [ ] BullMQ e IORedis adicionados
- [ ] apps/workers deletado
- [ ] libs/workers deletado
- [ ] Adapters QStash deletados
- [ ] Build passa após cleanup

### Phase 2: Core Implementation
- [ ] Redis provider criado e testado
- [ ] BullMQQueueAdapter implementa IQueueService
- [ ] BullMQEventPublisher implementa IEventPublisher
- [ ] IConfigurationService atualizado
- [ ] WorkersModule criado
- [ ] EmailWorker processa jobs corretamente
- [ ] AuditWorker persiste logs corretamente
- [ ] StripeWebhookWorker processa eventos corretamente

### Phase 3: Integration
- [ ] SharedModule usa novos adapters
- [ ] main.api.ts funciona isoladamente
- [ ] main.workers.ts funciona isoladamente
- [ ] main.hybrid.ts funciona com ambos
- [ ] main.ts roteia corretamente baseado em NODE_MODE
- [ ] local.ts funciona para desenvolvimento

### Phase 4: Infrastructure
- [ ] docker-compose.yml cria ambiente completo
- [ ] PostgreSQL acessível na porta 5432
- [ ] Redis acessível na porta 6379
- [ ] Redis Insight acessível na porta 8001
- [ ] PgAdmin acessível na porta 5050
- [ ] Dockerfile buildeia corretamente
- [ ] Container inicia em modo hybrid
- [ ] Container inicia em modo api
- [ ] Container inicia em modo workers
- [ ] .env.example documentado

### Phase 5: Documentation
- [ ] CLAUDE.md atualizado
- [ ] README.md com instruções completas
- [ ] Zero warnings/errors no build
- [ ] TypeScript sem erros

### Post-Development
- [ ] Testar flow completo de email
- [ ] Testar flow completo de audit
- [ ] Testar flow completo de webhook Stripe
- [ ] Deploy de teste no Railway

---

## 10. File Structure Summary

### Arquivos Criados

```
apps/backend/src/
├── main.ts                          # Dispatcher NODE_MODE
├── main.api.ts                      # Entrypoint API only
├── main.workers.ts                  # Entrypoint Workers only
├── main.hybrid.ts                   # Entrypoint Hybrid
├── shared/
│   ├── adapters/
│   │   ├── bullmq-queue.adapter.ts
│   │   ├── bullmq-event-publisher.adapter.ts
│   │   └── index.ts                 # (atualizar)
│   └── providers/
│       └── redis.provider.ts
└── workers/
    ├── workers.module.ts
    ├── email.worker.ts
    ├── audit.worker.ts
    └── stripe-webhook.worker.ts

infra/
├── docker-compose.yml
└── docker-compose.dev.yml           # (opcional)
```

### Arquivos Deletados

```
apps/workers/                        # (toda a pasta)
libs/workers/                        # (toda a pasta)
apps/backend/src/shared/adapters/qstash-queue.adapter.ts
apps/backend/src/shared/adapters/qstash-event-publisher.adapter.ts
```

### Arquivos Atualizados

```
apps/backend/
├── Dockerfile                       # Reescrito
├── docker-entrypoint.sh             # Atualizado
├── package.json                     # Dependências
├── .env.example                     # Variáveis
└── src/
    └── shared/
        ├── shared.module.ts         # Novos providers
        ├── services/
        │   └── configuration.service.ts  # Novos métodos
        └── adapters/
            └── index.ts             # Exports atualizados

libs/backend/src/
└── services/
    └── IConfigurationService.ts     # Interface atualizada

package.json (root)                  # Workspaces
turbo.json                           # Build pipeline
CLAUDE.md                            # Documentação
README.md                            # Instruções
```

---

## 11. Estimated Complexity

| Phase | Complexity | Key Tasks |
|-------|------------|-----------|
| Phase 1: Foundation | Low | Deletar código, atualizar deps |
| Phase 2: Core | Medium | Implementar adapters e workers |
| Phase 3: Integration | Medium | Integrar módulos, entrypoints |
| Phase 4: Infrastructure | Medium | Docker, Dockerfile |
| Phase 5: Documentation | Low | Atualizar docs |

**Total:** ~25-30 arquivos modificados/criados

---

## 12. Rollback Plan

Em caso de problemas críticos:

1. **Checkout da branch main** - Código anterior intacto
2. **Restaurar workspaces** - Readicionar apps/workers e libs/workers ao package.json
3. **Restaurar adapters** - Voltar QStash adapters
4. **npm install** - Reinstalar dependências

O rollback é seguro pois:
- Nenhuma migration de banco necessária
- Frontend não é afetado
- Supabase Auth e Stripe intactos
