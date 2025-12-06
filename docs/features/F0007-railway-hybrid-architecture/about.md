# F0007 - Railway Hybrid Architecture

**Branch:** refactor/F0007-railway-hybrid-architecture
**Date:** 2025-12-05

## Objetivo

Reverter a arquitetura serverless implementada na F0006 (Vercel + QStash) para uma arquitetura híbrida tradicional, permitindo deploy do backend no Railway com Docker e do frontend no Cloudflare Pages.

A mudança é necessária porque a arquitetura serverless da Vercel não se mostrou adequada para a natureza mais completa deste template, especialmente devido ao modelo de processamento assíncrono com eventos (CQRS) que utiliza BullMQ. O modelo serverless com QStash impõe limitações que prejudicam o fluxo natural do template educacional.

O objetivo final é ter um template que alunos possam fazer deploy facilmente no Railway (backend) e Cloudflare Pages (frontend), mantendo Redis para cache e BullMQ para processamento de filas/eventos.

## Contexto de Negócio

**Por que essa funcionalidade é necessária:**
A F0006 migrou o template para Vercel serverless com QStash, mas após testes ficou evidente que essa arquitetura não suporta bem o modelo de eventos CQRS do template. O cold start, as limitações do QStash (500 msgs/dia no free tier), e a complexidade adicional para um template educacional tornam a solução inadequada.

**Qual problema resolve:**
- Restaura a capacidade de processamento assíncrono robusto com BullMQ
- Simplifica o modelo mental para alunos (um backend híbrido vs serverless distribuído)
- Permite uso de Redis para cache além de filas
- Oferece deploy mais previsível e debugável no Railway

**Quem são os stakeholders:**
- Alunos do FND que usarão o template
- Instrutores que precisam explicar a arquitetura
- Desenvolvedores que farão manutenção do template

## Escopo

### O que ESTÁ incluído

#### Remoção de Código Serverless
- Deletar pasta `apps/workers/` (Vercel Functions wrappers)
- Deletar pasta `libs/workers/` (handlers serverless)
- Deletar adaptadores QStash (`apps/backend/src/shared/adapters/qstash-*.ts`)
- Remover dependência `@upstash/qstash`

#### Novos Adapters BullMQ
- `bullmq-queue.adapter.ts` - Implementa IQueueService
- `bullmq-event-publisher.adapter.ts` - Implementa IEventPublisher

#### Workers BullMQ (Handlers)
- `email.worker.ts` - Processamento de emails via fila
- `audit.worker.ts` - Processamento de audit logs
- `stripe-webhook.processor.ts` - Processa webhooks Stripe da fila

#### Entrypoints do Backend
- `apps/backend/src/api/main.ts` - Modo API (já existe)
- `apps/backend/src/workers/main.ts` - Modo Workers (criar)
- `apps/backend/src/hybrid/main.ts` - Modo Híbrido (criar)
- `NODE_MODE` controla o modo de execução

#### Infraestrutura Docker
- Criar `/infra/docker-compose.yml` com:
  - PostgreSQL 15 (porta 5432)
  - Redis 7 (porta 6379)
  - Redis Insight (porta 8001)
  - PgAdmin (porta 5050)
  - Network `fnd` para comunicação

#### Atualização do Dockerfile
- Reescrever `apps/backend/Dockerfile` para estrutura atual de libs
- Suportar NODE_MODE (api/workers/hybrid)

#### Configuração
- Adicionar: `REDIS_URL`, `NODE_MODE`
- Remover: `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`, `VERCEL_URL`

#### Documentação
- Atualizar CLAUDE.md com nova arquitetura
- Atualizar README.md com instruções Railway + Cloudflare

### O que NÃO está incluído (fora do escopo)

- **Supabase Auth**: Mantém implementação atual intacta
- **Stripe/Billing**: Mantém implementação atual intacta
- **Resend Email**: Mantém serviço atual, apenas muda o trigger (fila BullMQ)
- **Frontend React**: Apenas ajustar env vars se necessário
- **Schema do banco**: Nenhuma migration nova necessária
- **Cloudflare Workers/Functions**: Frontend é SPA estático puro

## Regras de Negócio

### Validações

1. **NODE_MODE obrigatório**: O backend DEVE receber `NODE_MODE` para saber qual modo iniciar
2. **REDIS_URL obrigatório**: Redis é necessário para BullMQ funcionar
3. **Interfaces mantidas**: IQueueService e IEventPublisher DEVEM ser mantidas para permitir troca de providers

### Fluxos

#### 1. Fluxo Principal - Modo Híbrido

- Step 1: Backend inicia com `NODE_MODE=hybrid`
- Step 2: API HTTP sobe na porta configurada
- Step 3: Workers BullMQ conectam ao Redis e ficam escutando filas
- Step 4: Requests HTTP são processados pela API
- Step 5: Eventos async são publicados nas filas Redis
- Step 6: Workers consomem e processam eventos

#### 2. Fluxos Alternativos

**Cenário A: Modo API Only**
- Backend inicia apenas API HTTP
- Workers rodam em outro processo/container
- Útil para escalar API e Workers independentemente

**Cenário B: Modo Workers Only**
- Backend inicia apenas Workers BullMQ
- API roda em outro processo/container
- Útil para dedicar recursos aos workers

#### 3. Fluxos de Erro

**Erro 1: Redis indisponível**
- Trigger: REDIS_URL inválido ou Redis offline
- Handling: Log de erro, retry com backoff exponencial
- User feedback: API continua funcionando, jobs ficam pendentes

**Erro 2: Job falha no processamento**
- Trigger: Erro durante processamento de job
- Handling: BullMQ faz retry automático (configurável)
- User feedback: Job vai para fila de failed após max retries

## Integrações

### Serviços Externos

- **Railway**: Hospedagem do backend (Docker)
- **Cloudflare Pages**: Hospedagem do frontend (static)
- **Supabase**: PostgreSQL + Auth (já configurado)
- **Stripe**: Pagamentos (já configurado)
- **Resend**: Email transacional (já configurado)

### Serviços Internos

- **IQueueService**: Abstração para filas (BullMQ adapter)
- **IEventPublisher**: Abstração para eventos (BullMQ adapter)
- **IEmailQueueService**: Enfileira emails para processamento async
- **IEventBroker**: Publica eventos de domínio

## Edge Cases Identificados

1. **Redis desconecta durante processamento**:
   - Descrição: Conexão Redis cai enquanto job está sendo processado
   - Handling: BullMQ tem reconexão automática, job será reprocessado

2. **Container reinicia com jobs pendentes**:
   - Descrição: Backend reinicia com jobs na fila
   - Handling: BullMQ persiste jobs no Redis, processamento continua após restart

3. **Múltiplas instâncias de Workers**:
   - Descrição: Escalar workers horizontalmente
   - Handling: BullMQ distribui jobs automaticamente entre workers

4. **Job duplicado**:
   - Descrição: Mesmo job processado mais de uma vez
   - Handling: Handlers devem ser idempotentes

## Critérios de Aceitação

### Funcionalidade
- [ ] Backend inicia corretamente em modo `api`
- [ ] Backend inicia corretamente em modo `workers`
- [ ] Backend inicia corretamente em modo `hybrid`
- [ ] Emails são enviados via worker BullMQ
- [ ] Audit logs são processados via worker BullMQ
- [ ] Webhooks Stripe são processados corretamente
- [ ] docker-compose sobe todos os serviços locais

### Código
- [ ] Zero dependências de QStash/Upstash no código final
- [ ] Interfaces IQueueService e IEventPublisher mantidas
- [ ] Adapters BullMQ implementam interfaces corretamente
- [ ] Workers implementam handlers com lógica de negócio
- [ ] Build passa 100% (backend e frontend)

### Infraestrutura
- [ ] Dockerfile funciona com libs atuais (domain, backend, app-database)
- [ ] docker-compose.yml cria ambiente local completo
- [ ] Variáveis de ambiente documentadas

### Documentação
- [ ] CLAUDE.md atualizado com nova arquitetura
- [ ] README.md com instruções de deploy Railway + Cloudflare
- [ ] Instruções de setup local com docker-compose

## Próximos Passos (para Planning)

1. **Fase de Limpeza**: Deletar código serverless (apps/workers, libs/workers, adapters QStash)
2. **Fase de Criação**: Implementar adapters BullMQ e workers com handlers
3. **Fase de Integração**: Atualizar SharedModule para usar novos adapters
4. **Fase de Infra**: Criar docker-compose.yml e atualizar Dockerfile
5. **Fase de Configuração**: Atualizar variáveis de ambiente
6. **Fase de Documentação**: Atualizar CLAUDE.md e README.md

---

## Dependências NPM

### Adicionar
```bash
npm install bullmq ioredis
```

### Remover
```bash
npm uninstall @upstash/qstash
```

---

## Variáveis de Ambiente

### Adicionar
```bash
REDIS_URL=redis://localhost:6379
NODE_MODE=hybrid  # api | workers | hybrid
```

### Remover
```bash
QSTASH_TOKEN
QSTASH_CURRENT_SIGNING_KEY
QSTASH_NEXT_SIGNING_KEY
VERCEL_URL
```

---

## Arquitetura Final

```
git push origin main
         │
         ├──→ Railway (backend Docker)
         │    └── apps/backend
         │        ├── NODE_MODE=api     → API HTTP only
         │        ├── NODE_MODE=workers → BullMQ workers only
         │        └── NODE_MODE=hybrid  → API + Workers
         │
         └──→ Cloudflare Pages (frontend)
              └── apps/frontend → Static SPA

Local Development:
         │
         └──→ docker-compose up
              ├── postgres:15    (5432)
              ├── redis:7        (6379)
              ├── redis-insight  (8001)
              └── pgadmin        (5050)
```

### Fluxo de Eventos (BullMQ)

```
Ação no NestJS API
       ↓
IEventPublisher.publish(event)
       ↓
BullMQ enqueue → Redis Queue
       ↓
Worker consome job
       ↓
Handler processa (email, audit, etc.)
```
