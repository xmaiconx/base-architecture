# Discovery: F0006 - Vercel Serverless Architecture

**Data:** 2025-12-03
**Facilitador:** Claude Code
**Stakeholder:** Usuário (instrutor FND)

---

## 1. Análise Inicial

### 1.1 Contexto do Projeto

O FND EasyFlow Template é um template base para alunos do Fábrica de Negócios Digitais (FND) iniciarem a construção de seus SaaS. O template atual possui:

- **Backend**: NestJS com CQRS, BullMQ para jobs, arquitetura dual-mode
- **Frontend**: React + Vite + Shadcn/ui
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth (já migrado)
- **Billing**: Stripe (já implementado)

### 1.2 Problema Identificado

O usuário identificou que:
1. O código de mensagens/chat nunca foi utilizado e adiciona complexidade
2. A dependência de Redis/BullMQ requer infraestrutura paga
3. O dual-mode (API + Workers) complica o deploy
4. Alunos precisam de uma solução mais simples: `git push` deploya tudo

### 1.3 Interfaces Existentes Analisadas

Durante a análise, foram identificadas interfaces existentes em `libs/backend/src/`:

**messaging/IJobQueue.ts:**
```typescript
export interface IJobQueue {
  add(jobName: string, data: any, options?: JobOptions): Promise<void>;
  process(jobName: string, handler: (data: any) => Promise<void>): Promise<void>;
}
```

**messaging/IEventBroker.ts:**
```typescript
export interface IEventBroker {
  publish<T extends IEvent>(eventOrEvents: T | T[]): Promise<void>;
  subscribe<T extends IEvent>(eventType: string, handler: (event: T) => Promise<void>): Promise<void>;
  unsubscribe(eventType: string): Promise<void>;
}
```

**messaging/IMessageBufferService.ts:** A ser removido (específico para chat)

---

## 2. Questionário Estratégico

### 2.1 Escopo & Objetivo

**Q: Qual o objetivo principal desta refatoração?**
> R: Simplificar a arquitetura para ser 100% serverless e gratuita, permitindo deploy via `git push` sem configuração adicional de infraestrutura.

**Q: Quais funcionalidades devem ser mantidas intactas?**
> R: Billing (Stripe), Auth (Supabase), Workspace management, Audit logs. Apenas mudar a forma como jobs são processados.

**Q: O que pode ser removido?**
> R: Todo código de mensagens/chat (pipeline, parsers, webhooks de chat), workers BullMQ, dependências Redis.

### 2.2 Infraestrutura & Providers

**Q: Qual provider de queue deve ser usado?**
> R: Upstash QStash - HTTP-based queue, 500 msgs/dia grátis, serverless-friendly.

**Q: Por que não usar Redis/BullMQ?**
> R: Requer infraestrutura sempre ligada (não serverless), custo adicional, complexidade para alunos.

**Q: Como tarefas agendadas serão tratadas?**
> R: Vercel Cron Jobs nativos (configurados no vercel.json).

### 2.3 Arquitetura

**Q: Como será a estrutura de deploy?**
> R: Tudo no Vercel:
> - Frontend: Site estático
> - Backend API: NestJS como Vercel Function
> - Workers: Vercel Functions independentes

**Q: Como eventos assíncronos funcionarão?**
> R:
> 1. API publica evento via IEventPublisher
> 2. QStash enfileira e chama URL da Vercel Function
> 3. Function processa (email, audit, etc.)

**Q: Deve ser cloud-agnostic?**
> R: Sim! Interfaces permitem trocar QStash por outro provider no futuro.

### 2.4 Segurança

**Q: Como garantir que Functions só recebem requests legítimos?**
> R: Verificação de assinatura QStash em toda Function. Usar `@upstash/qstash` Receiver.

**Q: Variáveis sensíveis?**
> R: QSTASH_TOKEN, QSTASH_CURRENT_SIGNING_KEY, QSTASH_NEXT_SIGNING_KEY via environment variables.

### 2.5 Database

**Q: Alguma mudança no schema?**
> R: Remover tabelas não utilizadas: threads, messages, projects. Manter webhook_events para Stripe.

**Q: Migration necessária?**
> R: Sim, criar migration para drop das tabelas.

---

## 3. Decisões e Justificativas

### D1: Usar Vercel para tudo (não split com Railway/Render)

**Decisão:** Todo deploy via Vercel
**Alternativas consideradas:**
- Railway/Render para backend
- Split entre Vercel (frontend) e outro provider (backend)

**Justificativa:**
- Deploy mais simples: `git push` faz tudo
- Configuração única (vercel.json)
- Free tier generoso (100GB-hrs)
- Alunos não precisam gerenciar múltiplos providers

### D2: QStash para eventos (não cron)

**Decisão:** Upstash QStash para processamento assíncrono
**Alternativas consideradas:**
- Upstash Redis
- Vercel Edge Config
- Apenas Vercel Cron

**Justificativa:**
- QStash é HTTP-based (perfeito para serverless)
- Retry automático com backoff
- Verificação de assinatura built-in
- 500 msgs/dia grátis é suficiente para template

### D3: Manter NestJS (não migrar para Hono/Express)

**Decisão:** Manter NestJS como framework
**Alternativas consideradas:**
- Hono (mais leve)
- Express puro
- tRPC

**Justificativa:**
- Código já está em NestJS
- CQRS e DI bem estabelecidos
- NestJS funciona bem como Vercel Function
- Menos mudança = menos risco

### D4: Interfaces cloud-agnostic

**Decisão:** Criar IQueueService e IEventPublisher abstratas
**Alternativas consideradas:**
- Usar QStash diretamente
- Manter IJobQueue existente

**Justificativa:**
- Permite trocar provider no futuro
- Segue princípio de inversão de dependência
- Facilita testes (mock das interfaces)
- Padrão já usado no projeto (IConfigurationService)

### D5: Remover código de mensagens completamente

**Decisão:** Deletar ~60+ arquivos de mensagens/chat
**Alternativas consideradas:**
- Manter como feature flag desabilitada
- Mover para branch separada

**Justificativa:**
- Código nunca foi utilizado
- Adiciona complexidade sem valor
- Dificulta entendimento para alunos
- Pode ser reimplementado do zero se necessário futuramente

---

## 4. Premissas e Riscos

### Premissas

| # | Premissa | Impacto se Falsa |
|---|----------|------------------|
| P1 | Free tiers são suficientes para uso do template | Precisaria documentar upgrade path |
| P2 | NestJS funciona bem como Vercel Function | Precisaria migrar para outro framework |
| P3 | 500 msgs/dia QStash é suficiente | Precisaria upgrade ou provider alternativo |
| P4 | Alunos conseguem configurar variáveis no Vercel | Precisaria documentação mais detalhada |

### Riscos

| # | Risco | Probabilidade | Mitigação |
|---|-------|---------------|-----------|
| R1 | Cold start lento do NestJS | Média | Monitorar, considerar warm-up se necessário |
| R2 | Limites de free tier atingidos | Baixa | Documentar limites e upgrade path |
| R3 | Breaking changes nos providers | Baixa | Interfaces abstratas isolam mudanças |

---

## 5. Edge Cases Identificados

### E1: Cold Start
- **Cenário:** Primeira request após inatividade demora mais
- **Tratamento:** Aceitável para template educacional. Documentar expectativa.

### E2: Falha de entrega QStash
- **Cenário:** Function indisponível quando QStash tenta entregar
- **Tratamento:** QStash faz retry automático com backoff exponencial

### E3: Assinatura inválida
- **Cenário:** Request para Function sem assinatura válida
- **Tratamento:** Retornar 401, logar tentativa

### E4: Limite de free tier
- **Cenário:** Aluno excede 500 msgs/dia QStash
- **Tratamento:** Documentar limite, sugerir upgrade ou batching

---

## 6. Fora do Escopo

| Item | Razão |
|------|-------|
| Reimplementar chat/mensagens | Nunca foi usado, complexidade desnecessária |
| Migrar para outro framework | NestJS funciona bem, mudança seria muito grande |
| Multi-provider QStash | YAGNI - um adapter é suficiente |
| Testes E2E para Functions | Template educacional, testes unitários são suficientes |
| CI/CD customizado | Vercel faz deploy automático |

---

## 7. Arquivos Consultados

### Codebase
- `CLAUDE.md` - Arquitetura e padrões do projeto
- `libs/backend/src/messaging/IJobQueue.ts` - Interface existente
- `libs/backend/src/messaging/IEventBroker.ts` - Interface existente
- `libs/backend/src/services/IConfigurationService.ts` - Padrão de config
- `apps/backend/src/shared/services/redis-job-queue.service.ts` - Implementação atual

### Documentação Externa
- Upstash QStash Docs
- Vercel Functions Docs
- Vercel Cron Jobs Docs

### Features Relacionadas
- F0003-supabase-auth-migration (padrão de migração)
- F0004-supabase-env-config (padrão de configuração)

---

## 8. Resumo para Planning

### Objetivo
Refatorar o template para arquitetura 100% serverless no Vercel com Upstash QStash para eventos assíncronos.

### Escopo Principal
1. **Remover:** Código de mensagens, workers BullMQ, Redis
2. **Criar:** Interfaces cloud-agnostic (IQueueService, IEventPublisher)
3. **Criar:** Adapters QStash e Vercel Functions
4. **Atualizar:** Configuração, SharedModule, bootstrap

### Complexidade
- **Remoção de código:** Alta (muitos arquivos, cuidado para não quebrar dependências)
- **Novas interfaces:** Baixa (padrão já estabelecido)
- **Vercel Functions:** Média (nova estrutura, mas código simples)
- **Configuração:** Baixa (vercel.json + env vars)

### Dependências Críticas
- Nenhuma externa além das já usadas (Supabase, Stripe)
- Adicionar: `@upstash/qstash`
- Remover: `bullmq`, `ioredis`

### Ordem Sugerida
1. Interfaces → 2. Adapters → 3. Config → 4. Functions → 5. Remoção → 6. Limpeza → 7. Deploy config

---

## 9. Plano Detalhado

O plano completo de implementação está documentado em:
`C:\Users\maico\.claude\plans\zazzy-weaving-cloud.md`

Este plano inclui:
- Ordem de execução das 10 fases
- Código exemplo para cada componente
- Estrutura final de arquivos
- Variáveis de ambiente necessárias
