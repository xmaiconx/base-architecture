# Discovery: Migração de Passport.js para Supabase Auth

**Branch:** refactor/F0003-supabase-auth-migration
**Date:** 2025-12-03

## Initial Analysis

### Commit History

**Recent commits analyzed:**
```
380f840 	modified:   .claude/settings.local.json 	modified:   apps/backend/.env.example 	modified:   libs/app-database/.env.example
6568aba Remove legacy migration files and consolidate initial schema and seed data for plans
6af8ecf .
3f9b897 refactor(F0001): implement billing system and workspace enhancements
8bb02ef feat: add Stripe integration documentation and database migration for billing tables
3b5b49a .
259e7a6 feat: add comprehensive help and PRD discovery scripts in Brazilian Portuguese
4e440af fix: update placeholder replacement in create-feature-docs.sh to use alternative delimiter
4600446 refactor: automate branch type and feature name inference in feature discovery
b662f93 feat: add language rule for user interaction and documentation in Brazilian Portuguese
ba24774 refactor: /done auto-generates commit messages without asking
56a9100 refactor: /hotfix leaves commit/push to /done command
0a271a7 feat: add /hotfix command for rapid critical bug fixes
e45deb0 refactor: simplify /done command with automatic squash merge and /fix integration
f9dc95e feat: add /done command for feature completion and merge to main
f401c34 	modified:   docs/features/prd-template.md 	modified:   docs/instructions/prd-discovery-instructions.md
ccd983c feat: add /fix command for in-development bug investigation and fixes
aa85de2 	modified:   docs/features/prd-template.md 	new file:   docs/instructions/prd-discovery-instructions.md
9eeb57b feat: complete feature development workflow with /feature, /plan, /dev commands
1344416 feat: add /feature command for structured feature discovery
```

**Key observations:**
- Sistema tem commits recentes relacionados a billing (Stripe integration) e workspace enhancements (F0001)
- Infraestrutura de commands CLI está bem estabelecida (/feature, /plan, /dev, /done, /fix, /hotfix)
- Template está em estágio ativo de desenvolvimento com múltiplas features sendo implementadas
- Histórico mostra foco em tooling e developer experience (scripts, commands, automation)
- Não há commits anteriores relacionados a auth customization, indicando que auth atual é baseline do template

### Modified Files

**Files already modified in this branch:**
```
(no files modified yet - branch fresh)
```

**Analysis:**
- Branch criada clean a partir de `main`
- Nenhuma modificação prévia, começando discovery do zero
- Estrutura de feature docs criada automaticamente pelo script `create-feature-docs.sh`

### Related Functionalities

**Similar features in codebase:**

1. **Auth Module** (`apps/backend/src/api/modules/auth/`):
   - Implementação completa de autenticação customizada com Passport.js
   - Commands: `SignUpCommand`, `ConfirmEmailCommand`, `ResendConfirmationCommand`
   - Events: `AccountCreatedEvent`, `EmailConfirmedEvent`, `ConfirmationEmailResentEvent`
   - Services: `AuthService`, `RoleElevationService`
   - Strategies: `JwtStrategy` (passport-jwt)
   - Guards: `JwtAuthGuard`
   - DTOs: `SignUpDto`, `SignInDto`, `UserResponseDto`, etc.

2. **User Repository** (`libs/app-database/src/repositories/user.repository.ts`):
   - Gerencia persistência de usuários com campos: `passwordHash`, `emailVerificationToken`, `emailVerified`
   - Métodos: `findByEmail()`, `findById()`, `create()`, `update()`

3. **Billing Module** (`apps/backend/src/api/modules/billing/`):
   - Usa guards de autenticação (`@UseGuards(JwtAuthGuard)`) nas rotas
   - Depende de `req.user` injetado pelo JwtStrategy

4. **Workspace Module** (`apps/backend/src/api/modules/workspace/`):
   - Também protegido por `JwtAuthGuard`
   - Valida isolation por `accountId`

**Patterns identified:**
- **CQRS Pattern**: Commands para operações de escrita, repositories para queries
- **Event-Driven**: Domain events publicados após operações (AccountCreatedEvent, etc.)
- **Multi-Tenancy**: Todos os dados isolados por `accountId` no payload JWT
- **DI via NestJS**: Todas as dependências injetadas via DI tokens (`'IUserRepository'`, etc.)
- **Guard-based Auth**: Rotas protegidas via `@UseGuards(JwtAuthGuard)` decorator
- **DTO Pattern**: Separação clara entre input DTOs (com validators) e response DTOs (interfaces)

### Codebase Analysis - Auth Implementation

**Current Auth Architecture:**

**Backend Packages (package.json):**
- `@nestjs/passport`: ^10.0.0
- `passport`: ^0.6.0
- `passport-jwt`: ^4.0.1
- `@nestjs/jwt`: ^10.0.0
- `bcrypt`: ^5.1.0

**Auth Module Structure:**
```
apps/backend/src/api/modules/auth/
├── auth.module.ts          # PassportModule + JwtModule config
├── auth.controller.ts      # Endpoints: /signup, /signin, /confirm-email, /resend, /me
├── auth.service.ts         # Orquestra commands, valida credenciais (bcrypt.compare)
├── strategies/
│   └── jwt.strategy.ts     # PassportStrategy(Strategy) - valida JWT + eleva super-admin
├── guards/
│   └── jwt-auth.guard.ts   # AuthGuard('jwt')
├── commands/               # SignUpCommand, ConfirmEmailCommand, ResendConfirmationCommand
├── events/                 # AccountCreatedEvent, EmailConfirmedEvent, etc.
├── dtos/                   # Input/Output DTOs
└── services/
    └── role-elevation.service.ts  # Eleva usuário a super-admin se email == SUPER_ADMIN_EMAIL
```

**Database Schema (users table):**
- `id` UUID (PK)
- `account_id` UUID (FK → accounts.id)
- `full_name` VARCHAR
- `email` VARCHAR (unique)
- `password_hash` VARCHAR  ← **REMOVER**
- `email_verified` BOOLEAN  ← **REMOVER**
- `email_verification_token` VARCHAR  ← **REMOVER**
- `email_verification_token_expiry` TIMESTAMP  ← **REMOVER**
- `role` VARCHAR (user/admin/super-admin)
- `status` VARCHAR (active/inactive)
- `created_at`, `updated_at` TIMESTAMP

**Frontend Auth:**
- Hooks: `useAuth`, `useSignIn` (chamam API REST do backend)
- Store: Zustand `auth-store.ts` (armazena user + token)
- Components: LoginForm, SignupForm, EmailVerification

**Environment Variables (.env.example):**
- `DATABASE_URL`: PostgreSQL do Supabase (já configurado)
- `JWT_SECRET`: Secret para assinar JWTs customizados ← **REMOVER**
- `SUPER_ADMIN_EMAIL`: Email do super-admin
- `RESEND_API_KEY`: Envio de emails via Resend
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`: Comentados, não utilizados ← **DESCOMENTAR E USAR**

**MCP Integration:**
- `.claude/settings.local.json` tem Supabase MCP server habilitado
- Ferramentas disponíveis: `mcp__supabase__execute_sql`, `mcp__supabase__search_docs`, etc.

## Strategic Questionnaire

### Category 1: Scope & Objective

**Q1.1:** Qual é o objetivo principal desta migração?
**A:** Substituir autenticação customizada (Passport + bcrypt + JWT) por Supabase Auth SDK mantendo funcionalidades existentes.
**Inferência validada:** Opção (a) confirmada.

**Q1.2:** Quais usuários/sistemas interagirão com a nova auth?
**A:** Todos: usuários finais (signup/signin), backend NestJS (valida tokens), frontend React (formulários).
**Inferência validada:** Opção (d) - todos os anteriores.

**Q1.3:** Qual problema específico estamos resolvendo?
**A:** Reduzir manutenção de infraestrutura de auth customizada (bcrypt, tokens, email verification), aproveitar recursos nativos do Supabase Auth (templates de email, OAuth, session management, security patterns).

**Q1.4:** Quais OAuth providers desejamos?
**A:** Email/senha + Google OAuth.
**Decisão:** Escopo limitado a Google por enquanto, facilmente extensível para GitHub/Microsoft no futuro.

### Category 2: Business Rules

**Q2.1:** Quais validações devem ser preservadas?
**A:**
- Email único globalmente (Supabase Auth)
- Email verificado obrigatório para login
- Senha forte (mínimo 8 chars, configurável no Supabase)
- Account/Workspace criados atomicamente com User (transação)
- Super-admin elevation baseado em `SUPER_ADMIN_EMAIL`

**Q2.2:** Como tratar erros?
**A:**
- Email já cadastrado: Mensagem amigável "Email já cadastrado. Faça login ou recupere sua senha."
- Email não verificado: Bloquear login, sugerir reenvio de confirmação
- Credenciais inválidas: Erro genérico de segurança (não vazar info)
- Token expirado: Mensagem "Link expirado. Solicite novo email de confirmação."
- Falha ao criar Account/Workspace: Logar erro crítico, implementar reconciliação

**Q2.3:** Dependências de outras funcionalidades?
**A:**
- **Billing Module**: Depende de guards de auth para proteger rotas
- **Workspace Module**: Depende de `accountId` no JWT payload
- **Audit Logs**: Registra eventos de signup/signin
- **Email Queue**: Resend continua enviando emails transacionais (não de auth)

**Q2.4:** Limites ou quotas?
**A:**
- Supabase Free Tier: 50k MAU (Monthly Active Users)
- Rate limiting de auth gerenciado pelo Supabase (padrão: 30 requests/min por IP)
- Nenhuma quota customizada necessária no template

### Category 3: Data & Integration

**Q3.1:** Dados a persistir?
**A:**
**Remover da tabela `users`:**
- `password_hash` (delegado para `auth.users`)
- `email_verification_token` (delegado para `auth.users`)
- `email_verification_token_expiry` (delegado para `auth.users`)
- `email_verified` (delegado para `auth.users.email_confirmed_at`)

**Adicionar à tabela `users`:**
- `auth_user_id` UUID NOT NULL (FK → `auth.users.id`)

**Manter na tabela `users`:**
- `id`, `account_id`, `full_name`, `email`, `role`, `status`, timestamps

**Q3.2:** Integrações externas necessárias?
**A:**
- **Supabase Auth API**: Signup, signin, email verification, OAuth, session management
- **Google OAuth**: Configurado via Supabase dashboard (Client ID + Secret)
- **Resend** (mantido): Continua enviando emails transacionais do app (não relacionados a auth)

**Q3.3:** Processamento assíncrono necessário?
**A:**
- **Sim, via eventos**: Após Supabase criar auth user, backend deve criar Account/Workspace/User assincronamente
- **Estratégia**: Supabase pode disparar webhooks para backend, ou frontend pode chamar endpoint após sucesso de signup
- **Commands existentes** (`SignUpCommand`, `ConfirmEmailCommand`) serão adaptados para responder a esses eventos

### Category 4: Edge Cases & Failure Scenarios

**Q4.1:** Cenários de falha identificados?
**A:**
1. **Auth user criado mas Account/Workspace falha**: Implementar reconciliação via job (detecta auth users sem User correspondente)
2. **Email confirmado mas evento não capturado**: Implementar verificação lazy no signin (detecta divergência)
3. **OAuth Google com email já usado por email/senha**: Supabase automaticamente vincula (account linking)
4. **Token JWT expirado mas refresh válido**: SDK automaticamente refreshes token (transparente)
5. **Super-admin elevation race condition**: Executar `checkAndElevateUser` após User persistido, usar transação

**Q4.2:** Como tratar dados legados/migração?
**A:** **Não aplicável** - Template não possui usuários em produção, fresh start.
**Decisão:** Nenhuma migração necessária, remover tabelas antigas e recomeçar.

**Q4.3:** Considerações de performance?
**A:**
- **Volume baixo**: Template para alunos FND, não espera volume alto inicial
- **Cache não necessário**: Supabase Auth já otimizado
- **Preocupação futura**: Se escalar para milhares de MAU, considerar cache de perfis de usuário (Redis)

**Q4.4:** Considerações de segurança?
**A:**
- **SUPABASE_SERVICE_ROLE_KEY**: Apenas no backend, nunca expor no frontend
- **SUPABASE_ANON_KEY**: Frontend usa esta key (RLS policies protegem dados sensíveis)
- **JWT Validation**: Backend valida tokens usando SDK do Supabase (verifica assinatura + expiração)
- **Multi-tenancy**: Manter isolamento por `accountId` (Supabase gerencia auth, app gerencia tenancy)
- **Rate limiting**: Aproveitado do Supabase Auth (30 req/min por IP padrão)

### Category 5: UI/UX (Frontend)

**Q5.1:** Tipo de interface?
**A:**
- **Páginas existentes**: Login, Signup, Email Verification, Dashboard
- **Novos componentes**: Botão "Continuar com Google", página de Password Recovery
- **Modificações**: Hooks `useSignIn`, `useSignUp` adaptados para Supabase SDK

**Q5.2:** Estados de loading/erro?
**A:**
- **Padrão do sistema** (skeleton + toast) será mantido
- **Mensagens de erro**: Mapeadas de inglês (Supabase) para português (PT-BR)
- **Loading states**: Gerenciados pelo Zustand store (`isLoading`, `error`)

**Q5.3:** Responsividade?
**A:** Manter responsividade existente (Tailwind v3), botão Google deve funcionar em mobile/desktop.

## Decisions and Clarifications

### Decision 1: OAuth Providers
**Context:** Usuário solicitou "migrar de passport.js para supabase auth" sem especificar OAuth providers inicialmente. Durante questionário estratégico, perguntei quais providers eram desejados.
**Decision:** Implementar email/senha + Google OAuth apenas. GitHub, Microsoft, etc. ficam como extensão futura.
**Impact:** Scope reduzido, entrega mais rápida. OAuth Google configurado no Supabase dashboard como único provider social por enquanto.
**Rationale:** Google é o provider mais comum, cobre 90% dos casos de uso. Adicionar outros providers é trivial no futuro (apenas configuração no dashboard Supabase).

### Decision 2: Migração de Dados
**Context:** Perguntei se era necessário migrar usuários existentes (passwords, etc.). Usuário confirmou que estamos trabalhando em um template sem usuários.
**Decision:** Nenhuma migração de dados necessária. Fresh start com schema novo.
**Impact:** Remove toda a complexidade de migração de passwords (bcrypt → Supabase), reconciliação de users, etc. Podemos simplesmente remover campos antigos e adicionar `auth_user_id`.
**Rationale:** Template FND não tem usuários em produção. Alunos que clonarem o template começarão do zero.

### Decision 3: Estratégia de Signup (Supabase-first vs Backend-first)
**Context:** Dois fluxos possíveis:
- **Supabase-first**: Frontend chama Supabase Auth, depois backend cria Account/Workspace/User
- **Backend-first**: Frontend chama backend, backend chama Supabase Auth internamente

**Decision:** **Supabase-first** approach.
**Impact:**
- Frontend chama `supabase.auth.signUp()` diretamente
- Backend cria Account/Workspace/User via webhook ou chamada subsequente do frontend
- Supabase gerencia email verification (não passa pelo backend)

**Rationale:**
- Aproveita melhor os recursos do Supabase (email templates, retry logic, OAuth flows)
- Frontend tem acesso imediato à sessão (não precisa esperar backend processar)
- Supabase Auth é source of truth, backend sincroniza posteriormente
- Webhooks do Supabase garantem que backend seja notificado de novos usuários

### Decision 4: Preservar CQRS Pattern
**Context:** Auth atual usa CQRS (Commands, Events, Handlers). Questão: manter ou simplificar?
**Decision:** **Manter CQRS** pattern, adaptar handlers para usar Supabase SDK.
**Impact:**
- `SignUpCommand` continua existindo, mas handler chama Supabase SDK em vez de criar senha manualmente
- `ConfirmEmailCommand` continua, mas valida via Supabase em vez de token customizado
- Events (`AccountCreatedEvent`, etc.) continuam sendo publicados

**Rationale:**
- Consistência arquitetural (resto do app usa CQRS)
- Facilita auditoria (events publicados geram audit logs)
- Permite extensão futura (hooks em events para lógica customizada)

### Decision 5: Super-Admin Elevation
**Context:** Sistema atual tem `RoleElevationService` que eleva usuário a super-admin se email == `SUPER_ADMIN_EMAIL`. Questão: manter após migração?
**Decision:** **Manter** sistema de super-admin elevation, adaptar para buscar via `auth_user_id`.
**Impact:** `RoleElevationService` continua funcionando, mas busca User via `auth_user_id` em vez de `id`.
**Rationale:** Feature importante para administradores do template. Não faz sentido remover funcionalidade existente que funciona bem.

### Decision 6: Templates de Email
**Context:** Supabase Auth envia emails em inglês por padrão. Usuários do template são brasileiros.
**Decision:** Customizar templates de email no Supabase dashboard para português brasileiro (PT-BR).
**Impact:** Emails de confirmação, password recovery, etc. serão em PT-BR.
**Rationale:** Melhor UX para público-alvo do template (alunos FND brasileiros).

### Decision 7: Resend vs Supabase Email
**Context:** Sistema atual usa Resend para enviar emails de confirmação. Supabase Auth também envia emails.
**Decision:** **Supabase gerencia emails de auth**, Resend continua para emails transacionais do app (não relacionados a auth).
**Impact:**
- Emails de signup/confirmation/password recovery: Supabase
- Emails transacionais (notificações, billing, etc.): Resend
- Remover `ResendConfirmationCommand` (Supabase tem método nativo `resend()`)

**Rationale:** Separação de responsabilidades clara. Supabase Auth é especializado em emails de auth (compliance, deliverability, etc.).

## Assumptions & Premises

1. **Supabase projeto já existente e configurado**:
   - Assumo que `DATABASE_URL` em `.env.example` aponta para projeto Supabase válido
   - Assumo que `SUPABASE_URL` e `SUPABASE_ANON_KEY` serão fornecidos pelo desenvolvedor
   - Impact if wrong: Migração não funcionará sem projeto Supabase configurado. Solução: Documentar setup do Supabase dashboard (criar projeto, obter credentials).

2. **Frontend pode chamar Supabase Auth diretamente**:
   - Assumo que não há restrições de CORS ou firewall impedindo frontend de chamar Supabase API
   - Assumo que Supabase dashboard permitirá configurar `FRONTEND_URL` como redirect URL permitida
   - Impact if wrong: OAuth redirect falhará, emails de confirmação não redirecionarão corretamente. Solução: Configurar whitelist de URLs no dashboard Supabase.

3. **Google OAuth pode ser configurado via Supabase dashboard**:
   - Assumo que Supabase Free Tier permite configuração de OAuth providers
   - Assumo que alunos FND terão acesso a Google Cloud Console para criar OAuth Client ID
   - Impact if wrong: OAuth Google não funcionará. Solução: Documentar passo a passo de configuração Google OAuth (criar projeto GCP, obter Client ID + Secret, configurar no Supabase).

4. **Supabase Webhooks estão disponíveis**:
   - Assumo que Supabase pode disparar webhooks para backend quando usuários são criados/atualizados
   - Alternativa: Frontend chama backend manualmente após signup bem-sucedido
   - Impact if wrong: Backend não receberá notificações de novos usuários. Solução: Implementar polling ou chamada manual do frontend.

5. **Nenhum usuário existente no template**:
   - Assumo que template está em desenvolvimento e nenhum aluno FND começou a usar
   - Assumo que podemos fazer breaking changes no schema sem migração
   - Impact if wrong: Usuários perderão acesso às contas. Solução: Implementar script de migração de passwords (bcrypt → Supabase).

6. **Multi-tenancy continua na camada de aplicação**:
   - Assumo que Supabase Auth não gerenciará multi-tenancy (apenas auth)
   - Assumo que isolamento por `accountId` continuará sendo responsabilidade do backend
   - Impact if wrong: Vazamento de dados entre tenants. Solução: Garantir que todos os guards validam `accountId` do JWT.

## Edge Cases Identified

1. **Auth user criado mas Account/Workspace falha**:
   - Description: Supabase cria usuário em `auth.users`, mas `SignUpCommandHandler` falha ao criar Account/Workspace/User no banco da aplicação (erro de DB, timeout, etc.)
   - Likelihood: **Low** (transações e error handling minimizam, mas possível em edge cases como DB down)
   - Handling Strategy:
     - Armazenar flag em `auth.users.user_metadata.account_created = false`
     - Implementar job de reconciliação (cron job) que detecta auth users com `account_created = false`
     - Retentar criação automaticamente (com exponential backoff)
     - Se falhar persistentemente após N tentativas, notificar administradores via log/Sentry
     - Usuário vê mensagem "Erro ao criar sua conta. Nossa equipe foi notificada."

2. **Usuário confirma email mas evento não é capturado pelo backend**:
   - Description: Supabase marca email como confirmado (`email_confirmed_at`), mas backend não recebe webhook ou falha ao processar, então `EmailConfirmedEvent` não é publicado (audit logs não registram confirmação)
   - Likelihood: **Medium** (webhooks podem falhar por timeout, retry limit, etc.)
   - Handling Strategy:
     - Implementar verificação lazy: ao fazer signin, verificar se `auth.users.email_confirmed_at` existe mas flag local não foi marcado
     - Disparar `ConfirmEmailCommand` automaticamente caso detecte divergência
     - Logar discrepância para investigação (pode indicar problema com webhooks)
     - Garantir que usuário consegue fazer login normalmente (mesmo se audit log não foi criado)

3. **OAuth Google retorna email já usado por usuário email/senha**:
   - Description: Usuário criou conta com email/senha (ex: `user@gmail.com`), depois tenta login OAuth com mesmo email do Google
   - Likelihood: **High** (cenário comum em produção)
   - Handling Strategy:
     - Supabase automaticamente vincula ambos (account linking) se email matches
     - Backend detecta `auth_user_id` existente no banco e não cria duplicata de User
     - Apenas atualiza `updated_at` do User se necessário
     - Usuário consegue fazer login tanto via email/senha quanto OAuth Google

4. **Token JWT expirado mas refresh token válido**:
   - Description: Access token expira (7d default), mas refresh token ainda válido (30d). Usuário faz request com token expirado.
   - Likelihood: **High** (comportamento normal após 7 dias de inatividade)
   - Handling Strategy:
     - Supabase SDK (frontend) automaticamente detecta expiração e refreshes token usando refresh token
     - Backend valida ambos access e refresh tokens no guard (Supabase SDK valida automaticamente)
     - Usuário não percebe interrupção (refresh transparente)
     - Se refresh token também expirou (30d), usuário é redirecionado para login

5. **Super-admin elevation race condition**:
   - Description: `RoleElevationService.checkAndElevateUser()` verifica email antes do User ser totalmente persistido no banco (transação ainda não commitada)
   - Likelihood: **Low** (depende de timing, mas possível em alta concorrência)
   - Handling Strategy:
     - Executar `checkAndElevateUser` apenas após User estar persistido no banco (após transação commitada)
     - Usar transação para garantir atomicidade (criar User + elevar role)
     - Validar `SUPER_ADMIN_EMAIL` não-vazio antes de comparar (evitar match acidental)
     - Se falhar, logar erro mas não bloquear signup (super-admin pode ser elevado manualmente)

6. **Link de confirmação clicado múltiplas vezes**:
   - Description: Usuário clica no link de confirmação de email múltiplas vezes (recarrega página, reenvia link, etc.)
   - Likelihood: **Medium** (comportamento comum de usuários)
   - Handling Strategy:
     - Supabase Auth é idempotente (confirmar email já confirmado não gera erro)
     - Backend detecta que email já foi confirmado e não publica `EmailConfirmedEvent` duplicado
     - Frontend exibe mensagem "Email já confirmado" em vez de erro

7. **OAuth Google falha (usuário nega permissão)**:
   - Description: Usuário clica em "Continuar com Google", mas cancela no fluxo OAuth ou nega permissões
   - Likelihood: **Medium** (usuários podem mudar de ideia)
   - Handling Strategy:
     - Supabase redireciona de volta para frontend com erro na URL (`error=access_denied`)
     - Frontend detecta erro e exibe mensagem "Login cancelado. Tente novamente ou use email/senha."
     - Nenhuma conta é criada (processo abortado)

## Out of Scope Items

1. **Multi-Factor Authentication (MFA)** - Supabase Auth suporta MFA (TOTP), mas implementação fica para feature futura. Requer UI adicional (QR code, input de código) e fluxo de recovery (backup codes). Não é crítico para MVP do template.

2. **OAuth providers além de Google** - GitHub, Microsoft, Facebook, etc. são facilmente adicionáveis no futuro (apenas configuração no dashboard Supabase), mas para MVP, Google é suficiente.

3. **Row Level Security (RLS) policies** - Supabase suporta RLS para proteger dados no PostgreSQL, mas template usa isolamento na camada de aplicação (validação de `accountId` nos repositories). Implementar RLS requer reescrever queries e guards, escopo muito grande para esta feature.

4. **Magic Link Authentication** - Supabase Auth suporta login via magic link (email sem senha), mas requer UX adicional e pode confundir usuários. Escopo limitado a email/senha + OAuth.

5. **Password recovery via SMS** - Supabase Auth suporta SMS via Twilio, mas requer configuração adicional e custos. Template usa apenas email para recovery.

6. **Migração de usuários existentes** - Confirmado pelo usuário que template não tem usuários em produção. Fresh start sem migração.

7. **Custom JWT claims além de accountId** - Payload JWT conterá `userId`, `email`, `accountId`. Adicionar claims customizados (permissions, roles, etc.) requer extensão futura.

8. **Session management avançado** - Supabase Auth gerencia sessões (access token + refresh token), mas features como "logout de todos os dispositivos", "limitar sessões simultâneas", etc. não estão no escopo.

9. **Audit logs de tentativas de login falhadas** - Sistema atual registra audit logs de signup/signin bem-sucedidos. Registrar tentativas falhadas (brute force monitoring) requer implementação adicional.

10. **Customização de tempo de expiração de tokens** - Supabase Auth usa 7d (access) + 30d (refresh) por padrão. Customizar requer configuração no dashboard, não está no escopo inicial.

## References

### Codebase Files Consulted

- `apps/backend/src/api/modules/auth/auth.module.ts`: Configuração do PassportModule + JwtModule, lista de providers
- `apps/backend/src/api/modules/auth/auth.service.ts`: Lógica de signup/signin atual, uso de bcrypt e JwtService
- `apps/backend/src/api/modules/auth/strategies/jwt.strategy.ts`: PassportStrategy que valida JWT customizado
- `apps/backend/src/api/guards/jwt-auth.guard.ts`: Guard atual que usa Passport
- `apps/backend/package.json`: Dependências de auth (passport, bcrypt, jwt)
- `apps/backend/.env.example`: Environment variables atuais (JWT_SECRET, etc.)
- `.claude/settings.local.json`: Configuração do MCP Supabase (habilitado)
- `libs/app-database/src/repositories/user.repository.ts`: Schema atual da tabela users
- `CLAUDE.md`: Arquitetura do projeto (Clean Architecture, CQRS, multi-tenancy)

### Documentation Consulted

- **Supabase Auth Documentation** (via MCP): Consultas sobre signup, signin, OAuth, webhooks, email templates
- **CLAUDE.md**: Convenções do projeto, arquitetura CQRS, padrões de nomenclatura, estrutura do monorepo
- **NestJS Guards Documentation** (conhecimento prévio): Como implementar guards customizados

### Related Functionalities

- **Billing Module** (`apps/backend/src/api/modules/billing/`): Usa `JwtAuthGuard` para proteger rotas, dependerá de novo guard
- **Workspace Module** (`apps/backend/src/api/modules/workspace/`): Usa `JwtAuthGuard`, depende de `accountId` no JWT
- **Audit Module** (`apps/backend/src/api/modules/audit/`): Registra eventos de signup/signin via `AuditEventListener`
- **Frontend Auth Hooks** (`apps/frontend/src/hooks/useAuth.ts`, `useSignIn.ts`): Precisarão ser adaptados para Supabase SDK

## Summary for Planning

**Executive Summary:**

Esta feature realiza a migração completa do sistema de autenticação de uma implementação customizada (Passport.js + bcrypt + JWT manual) para o Supabase Auth SDK, mantendo todas as funcionalidades existentes (signup, signin, email confirmation) e adicionando autenticação OAuth com Google.

A migração foi motivada pela necessidade de reduzir a superfície de manutenção de código de segurança crítico, aproveitando uma solução gerenciada e battle-tested que oferece features prontas (OAuth, email templates customizáveis, session management, rate limiting, etc.) enquanto permite foco no core business do template FND.

Durante o processo de discovery, foram confirmadas três decisões críticas:
1. **OAuth Providers**: Email/senha + Google apenas (extensível no futuro)
2. **Migração de dados**: Não necessária (template sem usuários em produção)
3. **Arquitetura**: Supabase-first approach (frontend chama Supabase diretamente, backend sincroniza via webhooks)

A implementação preservará os padrões arquiteturais existentes (CQRS, Event-Driven, Multi-Tenancy por accountId, DI via NestJS) enquanto substitui os componentes de auth customizados por integrações com Supabase SDK. O schema do banco será modificado para remover campos de senha/verificação e adicionar foreign key para `auth.users.id` do Supabase.

**Critical Requirements:**

1. **Preservar Multi-Tenancy**: Isolamento por `accountId` deve continuar funcionando. JWT do Supabase conterá `accountId` como claim customizado.

2. **Manter CQRS Pattern**: Commands (`SignUpCommand`, `ConfirmEmailCommand`) e Events (`AccountCreatedEvent`, `EmailConfirmedEvent`) devem continuar existindo, adaptados para usar Supabase SDK.

3. **Atomicidade na criação de Account/Workspace/User**: Signup deve criar Account → Workspace → User em transação. Se Supabase criar auth user mas backend falhar, implementar reconciliação.

4. **Super-Admin Elevation**: Sistema existente de `RoleElevationService` (baseado em `SUPER_ADMIN_EMAIL`) deve continuar funcionando após migração.

5. **Backward Compatibility com Guards**: Módulos que usam `JwtAuthGuard` (Billing, Workspace, etc.) devem continuar funcionando com novo guard que valida tokens do Supabase.

6. **Email Templates em PT-BR**: Emails de confirmação, password recovery, etc. devem ser customizados no dashboard Supabase para português brasileiro.

7. **Edge Case Handling**: Implementar reconciliação para casos onde auth user é criado mas Account/Workspace falha. Implementar verificação lazy para divergências entre Supabase e banco local.

**Technical Constraints:**

1. **Supabase Free Tier**: Template deve funcionar dentro dos limites do Free Tier (50k MAU, 500MB DB, 2GB bandwidth). Documentar upgrade path se necessário.

2. **NestJS Guards Customization**: Não podemos usar `AuthGuard('jwt')` do Passport, precisamos implementar guard customizado que valida JWT do Supabase usando SDK.

3. **Schema Migration**: Não podemos migrar passwords (bcrypt → Supabase), pois Supabase usa hash interno. Usuários existentes (se houver) precisariam fazer password reset.

4. **Frontend SDK Integration**: `@supabase/supabase-js` deve ser configurado com `persistSession: true` para armazenar tokens em localStorage, mas isso requer estratégia de logout seguro.

5. **OAuth Redirect URLs**: Supabase requer whitelist de redirect URLs. Precisamos configurar `FRONTEND_URL` (localhost + produção) no dashboard.

6. **Webhook Security**: Webhooks do Supabase para backend devem validar signature (JWT secret) para evitar spoofing.

**Next Phase Focus:**

O Planning Agent deve focar em:

1. **Database Migration Strategy**: Planejar migration Knex para remover colunas obsoletas e adicionar `auth_user_id`. Decidir se usar migration destrutiva (drop columns) ou soft migration (keep old columns deprecated).

2. **Backend Auth Layer Architecture**: Desenhar `SupabaseAuthGuard`, `SupabaseService` wrapper, e adaptação de Commands/Events. Decidir como backend receberá notificações de novos usuários (webhooks vs polling vs frontend callback).

3. **Frontend Integration Pattern**: Definir onde inicializar `supabaseClient` (singleton? context provider?), como sincronizar sessão com Zustand, e onde implementar `onAuthStateChange` listener.

4. **Error Handling & Recovery**: Desenhar fluxo de reconciliação para auth users sem User correspondente. Definir retry strategy, logging, e alertas.

5. **Testing Strategy**: Planejar testes end-to-end para todos os fluxos (signup email/senha, signup OAuth, signin, confirmation, password recovery, guards, multi-tenancy).

6. **Configuration Management**: Listar todas as environment variables necessárias (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY), variáveis obsoletas (JWT_SECRET), e configurações no dashboard Supabase (OAuth Google, email templates, redirect URLs).

7. **Rollback Plan**: Embora migração seja "one-way" (não podemos voltar para Passport facilmente), planejar estratégia de testes em ambiente staging antes de merge para main.
