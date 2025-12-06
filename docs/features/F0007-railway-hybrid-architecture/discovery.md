# Discovery: Railway Hybrid Architecture

**Branch:** refactor/F0007-railway-hybrid-architecture
**Date:** 2025-12-05

## Análise Inicial

### Histórico de Commits

**Commits recentes analisados:**
```
a07bd49 refactor(F0006): migrate to Vercel serverless architecture with optimized workers
4624c8b refactor(F0005-fnd-easyflow-rebrand): rebrand template para FND EasyFlow
74370fa Merge pull request #1 from xmaiconx/refactor/F0004-supabase-env-config
3480e8b refactor(F0004): update documentation for getUserById to clarify key usage
8fc50e2 docs: add technical plan for F0004-supabase-env-config
6a41615 refactor(F0004): update Supabase env variables to match current dashboard nomenclature
66a4e41 docs: add PR/MR link to F0004-supabase-env-config
4c6d737 feat: initialize F0004-supabase-env-config - discovery phase
0b82fd9 .
6c647d3 refactor(F0003): complete Supabase Auth migration
380f840 modified: apps/backend/.env.example, libs/app-database/.env.example
6568aba Remove legacy migration files and consolidate initial schema and seed data for plans
6af8ecf .
3f9b897 refactor(F0001): implement billing system and workspace enhancements
8bb02ef feat: add Stripe integration documentation and database migration for billing tables
```

**Observações chave:**
- F0006 foi a última feature, implementando arquitetura serverless Vercel + QStash
- Template passou por várias refatorações (F0001-F0006)
- Supabase Auth já está implementado (F0003)
- Billing/Stripe já está implementado (F0001)

### Arquivos Modificados pela F0006

**Estrutura criada na F0006 (a ser removida):**
```
apps/workers/
├── process-audit.ts      # Vercel Function wrapper
├── send-email.ts         # Vercel Function wrapper
├── stripe-webhook.ts     # Vercel Function wrapper
├── package.json
├── tsconfig.json
└── README.md

libs/workers/
├── src/
│   ├── factories/create-handler-context.ts
│   ├── handlers/
│   │   ├── process-audit.handler.ts
│   │   ├── send-email.handler.ts
│   │   └── stripe-webhook.handler.ts
│   ├── services/
│   │   ├── simple-config.service.ts
│   │   ├── simple-email.service.ts
│   │   └── simple-logger.service.ts
│   ├── types/
│   │   ├── HandlerContext.ts
│   │   ├── ProcessAuditPayload.ts
│   │   ├── SendEmailPayload.ts
│   │   └── StripeWebhookPayload.ts
│   ├── utils/qstash-verify.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md

apps/backend/src/shared/adapters/
├── qstash-queue.adapter.ts
├── qstash-event-publisher.adapter.ts
└── index.ts
```

**Análise:**
- Arquitetura serverless criou separação entre wrappers (`apps/workers`) e handlers puros (`libs/workers`)
- QStash foi usado para verificação de assinatura e enfileiramento
- Serviços "simple" foram criados para evitar DI do NestJS em contexto serverless

### Funcionalidades Relacionadas

**Código existente que será reutilizado:**
- `apps/backend/src/shared/services/resend-email.service.ts` - Envio de emails
- `apps/backend/src/shared/services/event-broker.service.ts` - Publicação de eventos
- `apps/backend/src/shared/shared.module.ts` - DI container
- `libs/backend/src/messaging/IQueueService.ts` - Interface de filas
- `libs/backend/src/messaging/IEventPublisher.ts` - Interface de eventos

**Padrões identificados:**
- Interfaces cloud-agnostic para troca de providers
- Handlers processam payloads específicos (email, audit, webhook)
- DI via tokens no SharedModule

## Questionário Estratégico

### Categoria 1: Escopo & Objetivo

**Q:** Qual é o principal objetivo desta funcionalidade?
**A:** Reverter arquitetura serverless (F0006) para híbrida com Railway + Cloudflare + Redis/BullMQ, devido à natureza mais completa do template que requer processamento assíncrono robusto.

**Q:** Quem são os usuários/sistemas que interagirão?
**A:** Alunos do FND que usarão o template para criar seus SaaS.

**Q:** Qual problema específico estamos resolvendo?
**A:** A arquitetura serverless da Vercel/QStash não suporta bem o modelo CQRS do template, além de limitações de free tier e complexidade desnecessária.

### Categoria 2: Regras de Negócio

**Q:** Existem validações ou restrições específicas?
**A:** NODE_MODE e REDIS_URL são obrigatórios. Interfaces IQueueService/IEventPublisher devem ser mantidas.

**Q:** Como devem ser tratados os casos de erro?
**A:** Retornar mensagem amigável ao usuário, BullMQ faz retry automático com backoff.

**Q:** Existem dependências de outras funcionalidades?
**A:** Supabase Auth, Stripe/Billing, Resend - todos mantidos intactos.

**Q:** Existem limites, quotas ou throttling a considerar?
**A:** Sem limites específicos, Redis/BullMQ não tem restrições de free tier como QStash.

### Categoria 3: Dados & Integração

**Q:** Quais dados precisam ser persistidos?
**A:** Nenhum novo dado. Jobs são temporários no Redis.

**Q:** Existem integrações externas (APIs, serviços)?
**A:** Railway (deploy), Cloudflare Pages (frontend), mantém Supabase/Stripe/Resend.

**Q:** Processos assíncronos são necessários?
**A:** Sim, via BullMQ - email sending, audit logging, stripe webhooks.

### Categoria 4: Edge Cases & Falhas

**Q:** O que acontece em cenários de falha?
**A:** BullMQ tem retry automático, jobs ficam pendentes se Redis cair, handlers são idempotentes.

**Q:** Como lidar com dados legados ou migrações?
**A:** Não aplicável - feature nova não requer migration de dados.

**Q:** Existem preocupações de performance ou escalabilidade?
**A:** Volume baixo esperado, BullMQ escala horizontalmente se necessário.

**Q:** Existem considerações específicas de segurança?
**A:** Padrão da aplicação (auth JWT + account isolation).

### Categoria 5: UI/UX

**Q:** Como deve ser a experiência do usuário?
**A:** Apenas API - sem frontend para esta feature.

**Q:** Existem estados específicos de loading/erro?
**A:** Padrão do sistema.

**Q:** Existem requisitos de responsividade?
**A:** N/A.

## Decisões e Esclarecimentos

### Decisão 1: Manter Interfaces Cloud-Agnostic
**Contexto:** Usuário poderia querer simplificar removendo abstrações
**Decisão:** Manter IQueueService e IEventPublisher, trocar apenas implementação QStash → BullMQ
**Impacto:** Adapters precisam implementar interfaces existentes
**Razão:** Permite flexibilidade futura para trocar providers sem reescrever código de negócio

### Decisão 2: Dockerfile Único com NODE_MODE
**Contexto:** Poderia ter Dockerfiles separados para api/workers
**Decisão:** Dockerfile único, NODE_MODE controla modo de execução
**Impacto:** Simplifica manutenção, mesmo container pode rodar em modos diferentes
**Razão:** Mais simples para alunos entenderem e manterem

### Decisão 3: Redis no Railway
**Contexto:** Poderia usar Upstash Redis externo
**Decisão:** Redis managed no Railway junto com backend
**Impacto:** Tudo em um provider, billing simplificado
**Razão:** Railway oferece Redis managed no free tier

### Decisão 4: Reescrever Dockerfile do Zero
**Contexto:** Dockerfile atual referencia libs antigas (app-shared, app-infra) que não existem mais
**Decisão:** Reescrever completamente para estrutura atual (domain, backend, app-database)
**Impacto:** Dockerfile novo e funcional
**Razão:** Dockerfile atual está desatualizado e não funcionaria

### Decisão 5: Implementar Handlers nos Workers
**Contexto:** Usuário enfatizou "não esqueça de implementar os handlers dos workers"
**Decisão:** Workers terão lógica de negócio completa nos handlers
**Impacto:** Workers funcionais, não apenas wrappers
**Razão:** Handlers são o core do processamento assíncrono

## Premissas & Assunções

1. **Railway suporta Redis managed no free tier**
   - Impacto se errado: Precisaria usar Upstash Redis ou outro provider

2. **Cloudflare Pages aceita SPA React/Vite sem configuração especial**
   - Impacto se errado: Precisaria ajustar build ou usar outro hosting

3. **BullMQ funciona bem com volumes baixos de jobs**
   - Impacto se errado: Nenhum, BullMQ é enterprise-ready

4. **Estrutura atual de libs (domain, backend, app-database) é estável**
   - Impacto se errado: Dockerfile precisaria ajustes adicionais

## Edge Cases Identificados

1. **Redis desconecta durante processamento**
   - Descrição: Conexão Redis cai no meio de um job
   - Probabilidade: Baixa
   - Estratégia: BullMQ tem reconexão automática, job será reprocessado

2. **Container reinicia com jobs pendentes**
   - Descrição: Deploy/restart com jobs na fila
   - Probabilidade: Média
   - Estratégia: Jobs persistem no Redis, processamento continua após restart

3. **Job duplicado (at-least-once delivery)**
   - Descrição: Mesmo job processado mais de uma vez
   - Probabilidade: Baixa
   - Estratégia: Handlers devem ser idempotentes

4. **Redis cheio**
   - Descrição: Redis atinge limite de memória
   - Probabilidade: Muito baixa (volume baixo)
   - Estratégia: Monitorar métricas, limpar jobs antigos

## Itens Fora do Escopo

1. **Supabase Auth** - Mantém implementação F0003 intacta
2. **Stripe/Billing** - Mantém implementação F0001 intacta
3. **Frontend React** - Apenas ajustar env vars se necessário
4. **Schema do banco** - Nenhuma migration
5. **Cloudflare Workers/Functions** - Frontend é SPA estático puro
6. **CI/CD** - Não incluído, Railway e Cloudflare têm deploy automático via git

## Referências

### Arquivos do Codebase Consultados
- `apps/workers/` - Estrutura serverless a ser removida
- `libs/workers/` - Handlers serverless a serem adaptados
- `apps/backend/src/shared/shared.module.ts` - DI container atual
- `apps/backend/src/shared/adapters/` - Adapters QStash a substituir
- `apps/backend/Dockerfile` - Dockerfile desatualizado a reescrever
- `libs/backend/src/messaging/` - Interfaces IQueueService, IEventPublisher
- `docs/features/F0006-vercel-serverless-architecture/about.md` - Feature anterior

### Documentação Consultada
- CLAUDE.md - Arquitetura atual e convenções
- F0006 about.md - Detalhes da arquitetura serverless

### Funcionalidades Relacionadas
- F0006-vercel-serverless-architecture - Feature sendo revertida
- F0001-template-cleanup-billing-workspaces - Billing/Stripe
- F0003-supabase-auth-migration - Supabase Auth

## Resumo para Planning

**Sumário Executivo:**
Esta feature reverte a arquitetura serverless (F0006) para uma arquitetura híbrida tradicional. O template precisa de processamento assíncrono robusto que o modelo serverless Vercel/QStash não suporta adequadamente.

O trabalho envolve: (1) deletar código serverless (apps/workers, libs/workers, adapters QStash), (2) criar novos adapters BullMQ que implementam as interfaces existentes, (3) implementar workers com handlers completos para email, audit e stripe webhooks, (4) criar infraestrutura Docker local (docker-compose) e atualizar Dockerfile para Railway, (5) atualizar documentação.

O usuário enfatizou a importância de implementar os handlers dos workers com a lógica de negócio completa, não apenas wrappers.

**Requisitos Críticos:**
- Workers BullMQ com handlers funcionais (email, audit, stripe)
- Adapters BullMQ implementando IQueueService e IEventPublisher
- docker-compose.yml com PostgreSQL, Redis, Redis Insight, PgAdmin
- Dockerfile atualizado para estrutura atual de libs
- NODE_MODE controlando modo de execução (api/workers/hybrid)

**Restrições Técnicas:**
- Manter interfaces cloud-agnostic (IQueueService, IEventPublisher)
- Não alterar Supabase Auth, Stripe/Billing, schema do banco
- Build deve passar 100%

**Foco da Próxima Fase (Planning):**
1. Definir ordem de execução (limpeza → criação → integração)
2. Especificar estrutura dos workers e handlers
3. Detalhar docker-compose.yml com todas as configurações
4. Planejar atualização do Dockerfile
5. Mapear todas as mudanças no SharedModule
