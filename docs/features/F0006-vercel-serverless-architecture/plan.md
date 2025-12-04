# Technical Plan: F0006 - Vercel Serverless Architecture

**Data:** 2025-12-03
**Feature ID:** F0006-vercel-serverless-architecture
**Tipo:** Refatoração

---

## 1. Visao Geral da Solucao

Esta refatoracao transforma o FND EasyFlow Template de uma arquitetura tradicional (long-running processes com Redis/BullMQ) para uma arquitetura 100% serverless compativel com Vercel. O objetivo e simplificar o deploy para que alunos do FND possam usar apenas `git push` para deployar tudo.

A solucao utiliza:
- **Vercel Functions** para API NestJS (suporte nativo, zero config)
- **Vercel Functions** para processamento assincrono via `apps/workers` (thin wrappers)
- **Handlers puros** em `libs/workers` (logica de negocio reutilizavel e leve)
- **Upstash QStash** para enfileiramento de tarefas (substitui BullMQ)
- **Supabase PostgreSQL** para banco de dados (ja implementado)
- **Resend** para email transacional (ja implementado)

A arquitetura mantem interfaces cloud-agnostic (IQueueService, IEventPublisher) que abstraem o QStash, permitindo troca de provider no futuro sem mudanca de codigo de negocio.

### Separacao de Responsabilidades

```
apps/backend/     → NestJS API (endpoints REST)
apps/workers/     → Thin wrappers (entrypoints serverless, ~30-40 linhas cada)
apps/frontend/    → React SPA
libs/workers/     → Handlers puros (logica de negocio, ~50-100 linhas cada)
libs/backend/     → Interfaces cloud-agnostic
libs/domain/      → Entities, enums, types
libs/database/    → Repositories
```

### Beneficios da Arquitetura

- **Bundle Size Reduzido:** Workers ~3-5MB vs NestJS full ~15MB
- **Cold Start Rapido:** ~800ms-1.5s vs ~2-5s com NestJS DI
- **Reusabilidade:** Handlers puros podem ser chamados pela API se necessario
- **Testabilidade:** Handlers puros = mock apenas o context
- **Escalabilidade:** Novo worker = handler puro + wrapper (~80 linhas totais)

---

## 2. Componentes a Desenvolver

### 2.1 Backend - Novas Interfaces (libs/backend/src/)

| Arquivo | Responsabilidade |
|---------|------------------|
| `messaging/IQueueService.ts` | Interface cloud-agnostic para enfileiramento de tarefas |
| `messaging/IEventPublisher.ts` | Interface simplificada para publicacao de eventos (sem subscribe) |

### 2.2 Backend - Adapters (apps/backend/src/shared/services/)

| Arquivo | Responsabilidade |
|---------|------------------|
| `qstash-queue.adapter.ts` | Implementacao de IQueueService usando Upstash QStash |
| `qstash-event-publisher.ts` | Implementacao de IEventPublisher usando QStash |

### 2.3 Workers - Handlers Puros (libs/workers/src/) ⭐ NOVO

| Arquivo | Responsabilidade |
|---------|------------------|
| `handlers/send-email.handler.ts` | Logica de envio de email (pura, sem dependencia de framework) |
| `handlers/process-audit.handler.ts` | Logica de persistencia de audit log (pura) |
| `handlers/stripe-webhook.handler.ts` | Logica de processamento de webhook Stripe (pura) |
| `types/HandlerContext.ts` | Interface para dependencias via context |
| `types/SendEmailPayload.ts` | Payload tipado para send-email |
| `types/ProcessAuditPayload.ts` | Payload tipado para process-audit |
| `types/StripeWebhookPayload.ts` | Payload tipado para stripe-webhook |
| `factories/create-handler-context.ts` | Factory para instanciar context (sem NestJS DI) |
| `utils/qstash-verify.ts` | Utilitario para verificacao de assinatura QStash |

### 2.4 Workers - Thin Wrappers (apps/workers/) ⭐ NOVO

| Arquivo | Responsabilidade |
|---------|------------------|
| `send-email.ts` | Entrypoint Vercel Function (~30 linhas: verifica assinatura + chama handler) |
| `process-audit.ts` | Entrypoint Vercel Function (~30 linhas) |
| `stripe-webhook.ts` | Entrypoint Vercel Function (~40 linhas: verifica Stripe + chama handler) |
| `package.json` | Dependencies: @fnd/workers, @upstash/qstash |

### 2.5 Backend - API Serverless (apps/backend/src/)

| Arquivo | Responsabilidade |
|---------|------------------|
| `index.ts` | Entrypoint NestJS serverless (handler para Vercel) |

### 2.6 Configuracao

| Arquivo | Responsabilidade |
|---------|------------------|
| `vercel.json` | Configuracao de deploy, rewrites e functions |
| `libs/workers/package.json` | Package da nova lib |
| `apps/workers/package.json` | Package do novo app |
| `apps/backend/src/shared/services/configuration.service.ts` | Adicionar metodos QStash |
| `libs/backend/src/services/IConfigurationService.ts` | Adicionar metodos QStash |

### 2.7 Database - Migration Atualizada

| Arquivo | Acao |
|---------|------|
| `libs/app-database/migrations/20250101001_create_initial_schema.js` | Remover tabelas: projects, threads, messages |

---

## 3. Arquivos a Remover

### 3.1 Workers (apps/backend/src/workers/)

```
workers/main.ts
workers/worker.module.ts
workers/email.worker.ts
workers/auth-reconciliation.worker.ts
workers/message-buffer.processor.ts
workers/audit/audit-event-listener.ts
workers/audit/audit.processor.ts
workers/messages/message-pipeline.processor.ts
workers/webhooks/ (pasta inteira - 25 arquivos)
```

### 3.2 Messages Pipeline (apps/backend/src/shared/messages/)

```
shared/messages/ (pasta inteira - 22 arquivos)
  - messages.module.ts
  - pipeline/MessagePipeline.ts
  - pipeline/MessagePipelineFactory.ts
  - pipeline/PipelineStepRegistry.ts
  - pipeline/steps/ (12 arquivos)
  - pipeline/projects/ (4 arquivos)
```

### 3.3 Interfaces Nao Utilizadas (libs/backend/src/)

```
messaging/IMessageBufferService.ts
pipelines/ (pasta inteira)
  - IMessagePipeline.ts
  - IMessagePipelineStep.ts
  - index.ts
webhooks/IMessageParser.ts
```

### 3.4 Domain - Entidades/Enums/Types (libs/domain/src/)

```
entities/Project.ts
enums/ProjectStatus.ts
enums/MessageType.ts
enums/MessageDirection.ts
enums/MessageStatus.ts
enums/InteractiveType.ts
enums/ChatChannel.ts
enums/ChatProvider.ts
enums/ChatImplementation.ts
types/MessageProtocol.ts
types/MessageContents.ts
types/MessageMetadata.ts
types/MessageContext.ts
types/MediaObject.ts
types/PipelineResult.ts
types/ProjectPipelineConfig.ts
types/WebhookGatewayConfig.ts
```

### 3.5 Database - Repositories (libs/app-database/src/)

```
repositories/IProjectRepository.ts
repositories/ProjectRepository.ts
types/ProjectTable.ts
```

### 3.6 Servicos Redis (apps/backend/src/shared/services/)

```
redis-job-queue.service.ts
redis-schedule.service.ts
redis-message-buffer.service.ts
```

---

## 4. Contratos de Integracao

### 4.1 Interface: IQueueService

**Arquivo:** `libs/backend/src/messaging/IQueueService.ts`

**Proposito:** Abstrai enfileiramento de tarefas, permitindo trocar QStash por outro provider.

**Metodos:**
- `enqueue(taskName: string, payload: object, options?: QueueOptions): Promise<string>` - Enfileira tarefa e retorna messageId
- `enqueueWithDelay(taskName: string, payload: object, delaySeconds: number): Promise<string>` - Enfileira com delay

**QueueOptions:**
- `retries?: number` - Numero de tentativas (default: 3)
- `callbackUrl?: string` - URL para callback (para Vercel Functions)

**Implementacao QStash:**
- Usa `@upstash/qstash` Client
- Envia POST para URL da function correspondente
- Inclui headers de autenticacao automaticamente

---

### 4.2 Interface: IEventPublisher

**Arquivo:** `libs/backend/src/messaging/IEventPublisher.ts`

**Proposito:** Publica eventos de dominio para processamento assincrono. Diferente de IEventBroker, nao tem subscribe (serverless nao suporta long-polling).

**Metodos:**
- `publish(event: IEvent): Promise<void>` - Publica evento unico
- `publishBatch(events: IEvent[]): Promise<void>` - Publica multiplos eventos

**Implementacao QStash:**
- Serializa evento para JSON
- Envia para URL da function `process-audit`
- QStash gerencia retries automaticamente

---

### 4.3 Vercel Function: send-email

**Arquivo:** `apps/workers/send-email.ts`

**Rota:** POST /api/workers/send-email

**Request:**
- Headers: `Upstash-Signature` (verificacao obrigatoria)
- Body: Payload do comando SendEmailCommand ou SendEmailTemplateCommand

**Payload SendEmailCommand:**
```
{
  type: "SEND_EMAIL",
  to: string,
  subject: string,
  body: string
}
```

**Payload SendEmailTemplateCommand:**
```
{
  type: "SEND_EMAIL_TEMPLATE",
  to: string,
  templateId: string,
  variables: Record<string, string>
}
```

**Response:**
- 200: Email enviado com sucesso
- 401: Assinatura QStash invalida
- 500: Erro no envio

**Processamento:**
1. Wrapper verifica assinatura QStash (via utils/qstash-verify)
2. Wrapper cria HandlerContext (via factory)
3. Wrapper chama sendEmailHandler(payload, context) de @fnd/workers
4. Handler valida payload e envia email via Resend
5. Wrapper retorna status

---

### 4.4 Vercel Function: process-audit

**Arquivo:** `apps/workers/process-audit.ts`

**Rota:** POST /api/workers/process-audit

**Request:**
- Headers: `Upstash-Signature`
- Body: Evento serializado (IEvent)

**Payload:**
```
{
  eventName: string,
  eventType: "domain" | "integration",
  occurredAt: string (ISO),
  payload: {
    accountId?: string,
    workspaceId?: string,
    userId?: string,
    ...dados especificos do evento
  }
}
```

**Response:**
- 200: Evento processado
- 401: Assinatura invalida
- 500: Erro no processamento

**Processamento:**
1. Wrapper verifica assinatura QStash
2. Wrapper cria HandlerContext
3. Wrapper chama processAuditHandler(payload, context) de @fnd/workers
4. Handler persiste em audit_logs via IAuditLogRepository
5. Wrapper retorna status

---

### 4.5 Vercel Function: stripe-webhook

**Arquivo:** `apps/workers/stripe-webhook.ts`

**Rota:** POST /api/workers/stripe-webhook

**Request:**
- Headers: `stripe-signature`
- Body: Raw body do webhook Stripe

**Response:**
- 200: Webhook processado
- 400: Payload invalido
- 401: Assinatura Stripe invalida

**Processamento:**
1. Wrapper verifica assinatura Stripe (webhook secret)
2. Wrapper cria HandlerContext
3. Wrapper chama stripeWebhookHandler(payload, context) de @fnd/workers
4. Handler salva em webhook_events via repository
5. Handler processa evento (subscription.created, invoice.paid, etc.)
6. Wrapper retorna status

---

### 4.6 Configuracao: vercel.json

**Arquivo:** `vercel.json` (raiz do projeto)

**Estrutura:**
```
{
  "version": 2,
  "builds": [
    {
      "src": "apps/frontend/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    },
    {
      "src": "apps/backend/src/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "apps/workers/*.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/workers/(.*)",
      "dest": "/apps/workers/$1.ts"
    },
    {
      "src": "/api/(.*)",
      "dest": "/apps/backend/src/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/apps/frontend/dist/$1"
    }
  ]
}
```

---

### 4.7 IConfigurationService - Novos Metodos

**Arquivo:** `libs/backend/src/services/IConfigurationService.ts`

**Novos Metodos:**
- `getQStashToken(): string` - Token de autenticacao QStash
- `getQStashCurrentSigningKey(): string` - Chave atual de assinatura
- `getQStashNextSigningKey(): string` - Proxima chave de assinatura (rotacao)
- `getVercelUrl(): string` - URL base do deploy Vercel
- `getWorkerBaseUrl(): string` - URL base para workers (Vercel URL + /api/workers)

---

## 5. Fluxos de Dados

### 5.1 Fluxo: Envio de Email Assincrono

```
1. API recebe request (ex: signup)
2. Service chama IQueueService.enqueue('send-email', payload)
3. QStashQueueAdapter envia POST para QStash API
4. QStash agenda entrega para /api/workers/send-email
5. Vercel Function (apps/workers/send-email.ts) recebe request
6. Wrapper verifica assinatura QStash
7. Wrapper cria HandlerContext e chama sendEmailHandler()
8. Handler (libs/workers) envia email via Resend
9. Wrapper retorna 200 (ou QStash faz retry)
```

### 5.2 Fluxo: Audit Log de Evento

```
1. CommandHandler executa operacao
2. CommandHandler chama IEventPublisher.publish(event)
3. QStashEventPublisher envia POST para QStash API
4. QStash agenda entrega para /api/workers/process-audit
5. Vercel Function (apps/workers/process-audit.ts) recebe request
6. Wrapper verifica assinatura QStash
7. Wrapper cria HandlerContext e chama processAuditHandler()
8. Handler persiste em audit_logs via IAuditLogRepository
9. Wrapper retorna 200
```

### 5.3 Fluxo: Webhook Stripe

```
1. Stripe envia POST para /api/workers/stripe-webhook
2. Vercel Function (apps/workers/stripe-webhook.ts) recebe request
3. Wrapper verifica assinatura Stripe
4. Wrapper cria HandlerContext e chama stripeWebhookHandler()
5. Handler salva evento em webhook_events
6. Handler processa evento (subscription.created, invoice.paid, etc.)
7. Wrapper retorna 200
```

### 5.4 Fluxo: Request API Normal

```
1. Request chega em /api/v1/*
2. vercel.json roteia para /apps/backend/src/index.ts
3. NestJS handler processa request
4. Controller valida DTO
5. Service executa logica de negocio
6. Repository persiste dados (se necessario)
7. IEventPublisher publica evento (se necessario)
8. Controller retorna response
```

---

## 6. Dependencias entre Componentes

### 6.1 Frontend

- **Depende de:** API endpoints (sem mudanca, mesmos contratos)

### 6.2 API (NestJS - apps/backend)

- **Depende de:**
  - `IQueueService` para enfileirar tarefas
  - `IEventPublisher` para publicar eventos
  - `IConfigurationService` para configuracoes
  - Repositories para persistencia
  - `IEmailQueueService` (atualizado para usar IQueueService)

### 6.3 Workers - Handlers Puros (libs/workers)

- **Depende de:**
  - `@fnd/backend` para interfaces (IEmailService, IAuditLogRepository, IConfigurationService)
  - `@fnd/domain` para entities e enums
  - `@fnd/database` para repositories
  - Resend SDK (para email)
  - Stripe SDK (para webhooks)

- **NAO depende de:**
  - NestJS (zero dependencias de framework)
  - `@upstash/qstash` (verificacao fica no wrapper)

### 6.4 Workers - Thin Wrappers (apps/workers)

- **Depende de:**
  - `@fnd/workers` para handlers puros
  - `@upstash/qstash` para verificacao de assinatura
  - Stripe SDK para verificacao de webhook signature

### 6.5 QStash Adapters (apps/backend/src/shared/services)

- **Depende de:**
  - `@upstash/qstash` Client SDK
  - `IConfigurationService` para tokens e URLs

---

## 7. Ordem de Desenvolvimento

### Fase 1: Interfaces Cloud-Agnostic

**Objetivo:** Criar interfaces que abstraem o provider de queue/eventos.

**Tarefas:**
1. Criar `libs/backend/src/messaging/IQueueService.ts`
2. Criar `libs/backend/src/messaging/IEventPublisher.ts`
3. Adicionar metodos QStash em `libs/backend/src/services/IConfigurationService.ts`
4. Atualizar barrel export `libs/backend/src/index.ts`
5. Build deve passar

---

### Fase 2: Adapters QStash

**Objetivo:** Implementar os adapters usando Upstash QStash.

**Tarefas:**
1. Instalar dependencia: `npm install @upstash/qstash -w @fnd/api`
2. Criar `apps/backend/src/shared/services/qstash-queue.adapter.ts`
3. Criar `apps/backend/src/shared/services/qstash-event-publisher.ts`
4. Implementar metodos QStash em `ConfigurationService`
5. Build deve passar

---

### Fase 3: Criar libs/workers (Handlers Puros)

**Objetivo:** Criar lib com handlers puros (logica de negocio reutilizavel e leve).

**Tarefas:**
1. Criar estrutura `libs/workers/`
2. Criar `libs/workers/package.json` (dependencies: @fnd/backend, @fnd/domain, @fnd/database, resend, stripe)
3. Criar `libs/workers/src/types/HandlerContext.ts`
4. Criar `libs/workers/src/types/SendEmailPayload.ts`
5. Criar `libs/workers/src/types/ProcessAuditPayload.ts`
6. Criar `libs/workers/src/types/StripeWebhookPayload.ts`
7. Criar `libs/workers/src/factories/create-handler-context.ts`
8. Criar `libs/workers/src/handlers/send-email.handler.ts`
9. Criar `libs/workers/src/handlers/process-audit.handler.ts`
10. Criar `libs/workers/src/handlers/stripe-webhook.handler.ts`
11. Criar `libs/workers/src/utils/qstash-verify.ts`
12. Criar barrel export `libs/workers/src/index.ts`
13. Adicionar workspace no `package.json` raiz
14. Build deve passar

---

### Fase 4: Criar apps/workers (Thin Wrappers)

**Objetivo:** Criar thin wrappers que sao entrypoints das Vercel Functions.

**Tarefas:**
1. Criar estrutura `apps/workers/`
2. Criar `apps/workers/package.json` (dependencies: @fnd/workers, @upstash/qstash, stripe)
3. Criar `apps/workers/send-email.ts` (~30 linhas)
4. Criar `apps/workers/process-audit.ts` (~30 linhas)
5. Criar `apps/workers/stripe-webhook.ts` (~40 linhas)
6. Adicionar workspace no `package.json` raiz
7. Build deve passar

---

### Fase 5: Criar NestJS Serverless Entry

**Objetivo:** Criar entrypoint serverless para API NestJS.

**Tarefas:**
1. Mover `apps/backend/src/api/main.ts` para `apps/backend/src/index.ts`
2. Adaptar `apps/backend/src/index.ts` para ser handler Vercel Function
3. Build deve passar

---

### Fase 6: Atualizar SharedModule

**Objetivo:** Trocar providers Redis por QStash no SharedModule.

**Tarefas:**
1. Adicionar provider `IQueueService` -> `QStashQueueAdapter`
2. Adicionar provider `IEventPublisher` -> `QStashEventPublisher`
3. Atualizar `IEmailQueueService` para usar `IQueueService` internamente
4. Manter providers antigos temporariamente (serao removidos na Fase 10)
5. Build deve passar

---

### Fase 7: Configuracao Vercel

**Objetivo:** Configurar deploy no Vercel.

**Tarefas:**
1. Criar `vercel.json` na raiz do projeto
2. Atualizar `.gitignore` se necessario
3. Documentar variaveis de ambiente necessarias em README
4. Build deve passar

---

### Fase 8: Remover Codigo de Mensagens

**Objetivo:** Deletar todo codigo de chat/mensagens nao utilizado.

**Tarefas:**
1. Deletar `apps/backend/src/shared/messages/` (pasta inteira)
2. Deletar `libs/backend/src/pipelines/` (pasta inteira)
3. Deletar `libs/backend/src/webhooks/IMessageParser.ts`
4. Deletar `libs/backend/src/messaging/IMessageBufferService.ts`
5. Atualizar barrel exports em `libs/backend/src/index.ts`
6. Build deve passar

---

### Fase 9: Remover Domain Entities Nao Utilizadas

**Objetivo:** Limpar entities, enums e types de mensagens.

**Tarefas:**
1. Deletar entities: Project.ts
2. Deletar enums: ProjectStatus, MessageType, MessageDirection, MessageStatus, InteractiveType, ChatChannel, ChatProvider, ChatImplementation
3. Deletar types: MessageProtocol, MessageContents, MessageMetadata, MessageContext, MediaObject, PipelineResult, ProjectPipelineConfig, WebhookGatewayConfig
4. Atualizar barrel exports em `libs/domain/src/index.ts`
5. Build deve passar

---

### Fase 10: Remover Database Repositories

**Objetivo:** Limpar repositories de entidades removidas.

**Tarefas:**
1. Deletar `libs/app-database/src/repositories/IProjectRepository.ts`
2. Deletar `libs/app-database/src/repositories/ProjectRepository.ts`
3. Deletar `libs/app-database/src/types/ProjectTable.ts`
4. Atualizar `libs/app-database/src/types/Database.ts` (remover tabelas)
5. Atualizar barrel exports
6. Build deve passar

---

### Fase 11: Remover Workers e Servicos Redis

**Objetivo:** Deletar workers BullMQ e servicos Redis.

**Tarefas:**
1. Deletar `apps/backend/src/workers/` (pasta inteira)
2. Deletar `apps/backend/src/shared/services/redis-job-queue.service.ts`
3. Deletar `apps/backend/src/shared/services/redis-schedule.service.ts`
4. Deletar `apps/backend/src/shared/services/redis-message-buffer.service.ts`
5. Atualizar SharedModule (remover providers antigos)
6. Remover imports de BullMQ/ioredis do SharedModule
7. Desinstalar dependencias: `npm uninstall bullmq ioredis -w @fnd/api`
8. Build deve passar

---

### Fase 12: Atualizar Migration e Simplificar Bootstrap

**Objetivo:** Finalizar refatoracao.

**Tarefas:**
1. Atualizar migration `20250101001` removendo tabelas: projects, threads, messages
2. Simplificar `apps/backend/src/index.ts` (remover dual-mode bootstrap, ja foi adaptado na Fase 5)
3. Atualizar `CLAUDE.md` com nova arquitetura (apps/workers, libs/workers)
4. Atualizar variaves de ambiente (remover REDIS_*, NODE_MODE; adicionar QSTASH_*)
5. Build final deve passar
6. Testar localmente com `vercel dev`

---

## 8. Estrategia de Testes

### 8.1 Testes Unitarios

- **IQueueService/IEventPublisher:** Mock do QStash Client
- **Vercel Functions:** Mock de request/response, mock de Resend
- **Adapters:** Mock de dependencias externas

### 8.2 Testes de Integracao

- **API endpoints:** Manter testes existentes (contratos nao mudam)
- **Vercel Functions:** Testar com payload real, verificar persistencia

### 8.3 Validacao por Fase

Apos cada fase, executar:
```bash
npm run build
npm run typecheck
```

---

## 9. Pontos de Atencao

### 9.1 Performance

- **Cold Start NestJS API:** ~2-5s (aceitavel para template educacional, usado apenas para API REST)
- **Cold Start Workers:** ~800ms-1.5s (handlers puros sem NestJS DI)
- **Bundle Size API:** ~15MB (NestJS completo)
- **Bundle Size Workers:** ~3-5MB cada (apenas handler + dependencias essenciais)
- **Timeout:** Vercel Functions tem timeout de 60s (Pro) ou 10s (Hobby). Workers devem ser rapidos.

### 9.2 Seguranca

- **Assinatura QStash:** TODA function que recebe request do QStash DEVE verificar assinatura.
- **Assinatura Stripe:** TODA function que recebe webhook Stripe DEVE verificar assinatura.
- **Variaveis Sensiveis:** Nunca logar tokens ou chaves de assinatura.

### 9.3 Observabilidade

- **Logs:** Vercel captura console.log automaticamente.
- **Erros:** Usar try/catch e logar erros com contexto.
- **Metricas:** QStash dashboard mostra entregas e retries.

### 9.4 Limites Free Tier

| Servico | Limite | Impacto |
|---------|--------|---------|
| Vercel | 100GB-hrs compute | Suficiente para template |
| QStash | 500 msgs/dia | Suficiente para desenvolvimento |
| Resend | 100 emails/dia | Suficiente para desenvolvimento |

---

## 10. Variaveis de Ambiente

### Adicionar

```bash
# Upstash QStash
QSTASH_TOKEN=qstash_xxx
QSTASH_CURRENT_SIGNING_KEY=sig_xxx
QSTASH_NEXT_SIGNING_KEY=sig_yyy

# Vercel (automatico em producao)
VERCEL_URL=xxx.vercel.app
```

### Remover

```bash
REDIS_JOBS_URL        # Nao usa mais Redis
NODE_MODE             # Nao tem mais dual-mode
```

### Manter

```bash
DATABASE_URL          # Supabase PostgreSQL
SUPABASE_URL          # Supabase API
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
STRIPE_SECRET_KEY     # Stripe
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY        # Resend
RESEND_FROM_EMAIL
```

---

## 11. Checklist de Integracao

- [ ] Interface IQueueService documentada e implementada
- [ ] Interface IEventPublisher documentada e implementada
- [ ] Adapter QStash implementado
- [ ] libs/workers criada com handlers puros
- [ ] HandlerContext e factory implementados
- [ ] sendEmailHandler implementado e testado
- [ ] processAuditHandler implementado e testado
- [ ] stripeWebhookHandler implementado e testado
- [ ] apps/workers criada com thin wrappers
- [ ] send-email wrapper valida assinatura QStash
- [ ] process-audit wrapper valida assinatura QStash
- [ ] stripe-webhook wrapper valida assinatura Stripe
- [ ] vercel.json configurado com routes corretos (/api/workers/*)
- [ ] NestJS API adaptada para entrypoint serverless
- [ ] SharedModule atualizado com novos providers
- [ ] Codigo de mensagens removido completamente
- [ ] Workers BullMQ e Redis removidos completamente
- [ ] Migration atualizada sem tabelas de mensagens
- [ ] Build passa em todas as 12 fases
- [ ] CLAUDE.md atualizado com nova arquitetura (apps/workers, libs/workers)

---

## 12. Referencias

- [Vercel NestJS Documentation](https://vercel.com/docs/frameworks/backend/nestjs)
- [Upstash QStash Documentation](https://upstash.com/docs/qstash)
- [Vercel Functions](https://vercel.com/docs/functions)
- Discovery: `docs/features/F0006-vercel-serverless-architecture/discovery.md`
- About: `docs/features/F0006-vercel-serverless-architecture/about.md`
