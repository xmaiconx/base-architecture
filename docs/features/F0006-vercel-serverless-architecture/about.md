# F0006 - Vercel Serverless Architecture

## Visão Geral

**Tipo:** Refatoração
**Objetivo:** Transformar o FND EasyFlow Template em uma arquitetura serverless compatível com Vercel, usando Supabase + Upstash QStash, 100% dentro dos free tiers.

**Princípio Norteador:** Simplicidade para alunos - `git push` deploya tudo.

---

## Contexto de Negócio

### Problema Atual
O template atual utiliza:
- Redis + BullMQ para filas e jobs
- RabbitMQ para event broker
- Arquitetura dual-mode (API + Workers separados)
- Código de mensagens/chat não utilizado

Isso cria complexidade desnecessária para alunos e requer infraestrutura que não é gratuita.

### Solução Proposta
Simplificar a arquitetura para ser 100% serverless e gratuita:
- **Supabase** para PostgreSQL + Auth (já implementado)
- **Vercel** para Frontend + API + Functions
- **Upstash QStash** para eventos assíncronos
- **Resend** para email transacional

### Benefícios
1. **Deploy simplificado**: Apenas `git push` faz tudo
2. **100% gratuito**: Dentro dos free tiers de todos os serviços
3. **Menos código**: Remoção de ~60+ arquivos não utilizados
4. **Cloud-agnostic**: Interfaces permitem trocar providers futuramente

---

## Stack Final (100% Gratuita)

| Serviço | Uso | Free Tier |
|---------|-----|-----------|
| **Supabase** | PostgreSQL + Auth | 500MB DB, 50K MAU |
| **Vercel** | Frontend + API + Functions | 100GB bandwidth, 100GB-hrs compute |
| **Upstash QStash** | Eventos assíncronos | 500 msgs/dia |
| **Resend** | Email transacional | 100 emails/dia |

---

## Escopo

### Incluído

#### Remoção de Código (Limpeza)
- Deletar todo código de mensagens/chat (pipeline, parsers, webhooks de chat)
- Deletar workers BullMQ (email, audit, message-buffer)
- Deletar interfaces não utilizadas (IMessageBufferService, pipelines, webhooks chat)
- Deletar entidades não utilizadas (Thread, Message, Project)
- Remover dependência de Redis/BullMQ

#### Novas Interfaces (Cloud-Agnostic)
- `IQueueService` - Interface para filas (QStash, BullMQ, SQS)
- `IEventPublisher` - Interface para eventos (simplificada, sem subscribe)

#### Adapters
- `QStashQueueAdapter` - Implementação de IQueueService com QStash
- `ServerlessEventPublisher` - Implementação de IEventPublisher com QStash

#### Vercel Functions
- `send-email.ts` - Processa fila de emails (substitui email.worker.ts)
- `process-event.ts` - Processa eventos de domínio (substitui audit.processor.ts)
- `stripe-webhook.ts` - Recebe webhooks Stripe

#### Configuração
- Atualizar `IConfigurationService` com métodos QStash
- Criar `vercel.json` para deploy e cron jobs
- Simplificar bootstrap (remover dual-mode)

### Excluído
- **Billing/Stripe**: JÁ IMPLEMENTADO - manter intacto
- **Auth/Supabase**: JÁ IMPLEMENTADO - manter intacto
- **Workspace management**: Manter funcionalidade existente
- **Audit logs**: Manter, apenas mudar processamento para serverless
- **WebhookEvent entity**: Manter para webhooks Stripe

---

## Arquitetura Final

```
git push origin main
         │
         └──→ Vercel (deploy automático)
              ├── apps/frontend      → Site estático
              ├── apps/backend/api   → NestJS Serverless
              └── apps/backend/functions → Vercel Functions (workers)
                  ├── send-email.ts
                  ├── process-event.ts
                  └── stripe-webhook.ts
```

### Fluxo de Eventos

```
Ação no NestJS API
       ↓
IEventPublisher.publish(event)
       ↓
QStash enqueue → Vercel Function URL (/api/functions/process-event)
       ↓
Vercel Function processa (email, audit, etc.)
```

---

## Regras de Negócio

### R1: Interfaces Cloud-Agnostic
- TODAS as dependências de infraestrutura devem ser abstraídas via interfaces
- Implementações específicas (QStash) vivem em adapters
- Permite troca de provider sem mudança de código de negócio

### R2: Verificação de Assinatura
- TODA Vercel Function que recebe requests do QStash DEVE verificar assinatura
- Usar `@upstash/qstash` Receiver para validação
- Retornar 401 para assinaturas inválidas

### R3: Compatibilidade
- Manter TODOS os endpoints de API existentes funcionando
- Manter TODAS as funcionalidades de billing/auth/workspace
- Apenas mudar a forma como jobs são processados

### R4: Configuração via Environment
- NUNCA usar `process.env` diretamente
- Sempre usar `IConfigurationService`
- Novas variáveis: QSTASH_TOKEN, QSTASH_CURRENT_SIGNING_KEY, QSTASH_NEXT_SIGNING_KEY

---

## Arquivos a Deletar

### Workers & Processors
```
apps/backend/src/workers/webhooks/           # Todos os parsers
apps/backend/src/workers/messages/           # Pipeline processor
apps/backend/src/workers/message-buffer.processor.ts
apps/backend/src/workers/main.ts
apps/backend/src/workers/worker.module.ts
apps/backend/src/workers/email.worker.ts
apps/backend/src/workers/auth-reconciliation.worker.ts
```

### Shared Messages
```
apps/backend/src/shared/messages/            # Pipeline inteiro (14 steps)
apps/backend/src/api/modules/webhooks/       # Gateway de webhooks (chat)
```

### Libs - Backend
```
libs/backend/src/pipelines/                  # Interfaces de pipeline
libs/backend/src/webhooks/                   # Interfaces de parser (exceto tipos Stripe)
libs/backend/src/messaging/IMessageBufferService.ts
```

### Libs - Domain
```
libs/domain/src/entities/Thread.ts
libs/domain/src/entities/Message.ts
libs/domain/src/entities/Project.ts
libs/domain/src/types/Message*.ts
libs/domain/src/types/Pipeline*.ts
libs/domain/src/types/WebhookGatewayConfig.ts
libs/domain/src/enums/Message*.ts
libs/domain/src/enums/Chat*.ts
libs/domain/src/enums/ProjectStatus.ts
```

### Libs - Database
```
libs/app-database/src/*/Thread*
libs/app-database/src/*/Message*
libs/app-database/src/*/Project*
```

---

## Arquivos a Manter

```
libs/domain/src/entities/WebhookEvent.ts     # Para webhooks Stripe
libs/domain/src/enums/WebhookType.ts         # Para webhooks Stripe
libs/domain/src/enums/WebhookStatus.ts       # Para webhooks Stripe
libs/app-database/src/*/WebhookEvent*        # Repository para Stripe
```

---

## Arquivos a Criar

### Interfaces (libs/backend/src/messaging/)
- `IQueueService.ts` - Interface cloud-agnostic para filas
- `IEventPublisher.ts` - Interface simplificada para eventos

### Adapters (apps/backend/src/shared/services/adapters/)
- `qstash-queue.adapter.ts` - Implementa IQueueService
- `serverless-event-publisher.ts` - Implementa IEventPublisher

### Vercel Functions (apps/backend/src/functions/)
- `_shared/supabase.ts` - Cliente Supabase compartilhado
- `_shared/qstash.ts` - Verificação de assinatura QStash
- `_shared/resend.ts` - Cliente Resend compartilhado
- `send-email.ts` - Handler de envio de email
- `process-event.ts` - Handler de eventos de domínio
- `stripe-webhook.ts` - Handler de webhooks Stripe

### Configuração
- `vercel.json` - Configuração de deploy e cron

---

## Variáveis de Ambiente

### Adicionar
```bash
# Upstash QStash
QSTASH_TOKEN=qstash_xxx
QSTASH_CURRENT_SIGNING_KEY=sig_xxx
QSTASH_NEXT_SIGNING_KEY=sig_yyy

# Base URL (Vercel seta automaticamente)
VERCEL_URL=xxx.vercel.app
```

### Remover
```bash
REDIS_URL          # Não usa mais Redis
NODE_MODE               # Não tem mais dual-mode
```

---

## Critérios de Aceitação

### Funcionalidade
- [ ] Deploy via `git push` funciona sem configuração adicional
- [ ] API NestJS responde corretamente em ambiente serverless
- [ ] Envio de email funciona via Vercel Function
- [ ] Eventos de domínio são processados assincronamente
- [ ] Webhooks Stripe são recebidos e processados
- [ ] Audit logs continuam sendo registrados

### Código
- [ ] Zero dependências de Redis/BullMQ no código final
- [ ] Todas as interfaces cloud-agnostic implementadas
- [ ] Build passa 100% (backend e frontend)
- [ ] Nenhum código de mensagens/chat restante

### Configuração
- [ ] vercel.json configurado corretamente
- [ ] Variáveis de ambiente documentadas
- [ ] IConfigurationService atualizado com métodos QStash

### Documentação
- [ ] CLAUDE.md atualizado com nova arquitetura
- [ ] README atualizado com instruções de deploy

---

## Dependências NPM

### Adicionar
```bash
npm install @upstash/qstash
```

### Remover (após refatoração)
```bash
npm uninstall bullmq ioredis
```

---

## Próximos Passos (para Planning)

1. Criar as interfaces IQueueService e IEventPublisher
2. Criar os adapters QStash e ServerlessEventPublisher
3. Atualizar IConfigurationService com métodos QStash
4. Deletar código de mensagens (workers, pipeline, parsers)
5. Criar Vercel Functions (send-email, process-event, stripe-webhook)
6. Simplificar bootstrap (remover dual-mode)
7. Atualizar SharedModule (trocar providers Redis → QStash)
8. Criar migration para remover tabelas não usadas
9. Limpar exports (domain, backend libs)
10. Criar vercel.json com configuração de deploy

---

## Referências

- [Upstash QStash Documentation](https://upstash.com/docs/qstash)
- [Vercel Functions](https://vercel.com/docs/functions)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- Plano detalhado: `C:\Users\maico\.claude\plans\zazzy-weaving-cloud.md`
