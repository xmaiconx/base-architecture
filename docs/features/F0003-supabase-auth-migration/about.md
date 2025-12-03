# Task: Migração de Passport.js para Supabase Auth

**Branch:** refactor/F0003-supabase-auth-migration
**Date:** 2025-12-03

## Objective

Substituir a implementação customizada de autenticação (Passport.js + bcrypt + JWT manual) pelo Supabase Auth SDK, mantendo todas as funcionalidades existentes de signup, signin, confirmação de email e gestão de sessões.

Esta migração visa reduzir a complexidade de manutenção da infraestrutura de autenticação, aproveitando os recursos nativos do Supabase Auth (templates de email, OAuth providers, session management, security patterns estabelecidos) enquanto preserva a arquitetura multi-tenant atual baseada em Accounts e Workspaces.

A migração incluirá suporte a autenticação via email/senha (mantendo fluxo atual) e adicionará autenticação OAuth com Google, expandindo as opções de login para os usuários finais.

## Business Context

**Why this functionality is needed:**
O sistema atualmente mantém uma implementação customizada de autenticação que requer gerenciamento manual de hashing de senhas (bcrypt), geração e validação de tokens JWT, controle de verificação de email via tokens customizados, e toda a infraestrutura associada. Ao migrar para Supabase Auth, o projeto pode focar em funcionalidades de negócio core enquanto delega responsabilidades de segurança, escalabilidade e manutenção de auth para uma solução gerenciada e amplamente testada.

**What problem it solves:**
- Reduz superfície de ataque de segurança (Supabase Auth segue best practices da indústria)
- Elimina manutenção de código de auth customizado (password hashing, token generation, email verification)
- Facilita expansão futura de OAuth providers (Google já incluído, fácil adicionar GitHub, Microsoft, etc.)
- Simplifica implementação de features avançadas (MFA, password recovery, rate limiting)
- Melhora experiência do usuário com templates de email profissionais e customizáveis

**Who are the stakeholders:**
- **Desenvolvedores do template FND:** Reduzem código de manutenção e ganham features prontas
- **Alunos do FND:** Recebem template com auth production-ready sem necessidade de reimplementar
- **Usuários finais (futuro):** Ganham opção de login social (Google) e melhor UX de email verification
- **Administradores:** Beneficiam-se de dashboard Supabase para gestão de usuários e logs de auth

## Scope

### What IS included
- Substituição de Passport.js + JWT Strategy por Supabase Auth SDK no backend
- Remoção de campos de senha e verificação de email da tabela `users` (delegados para `auth.users`)
- Implementação de `SupabaseAuthGuard` customizado para NestJS substituindo `JwtAuthGuard`
- Migração de fluxo de signup para `supabase.auth.signUp()` (email/password + OAuth Google)
- Migração de fluxo de signin para `supabase.auth.signInWithPassword()` e `signInWithOAuth()`
- Migração de confirmação de email para sistema nativo do Supabase (callback URL)
- Adaptação dos Commands existentes (`SignUpCommand`, `ConfirmEmailCommand`) para usar Supabase SDK
- Manutenção de Events (`AccountCreatedEvent`, `EmailConfirmedEvent`) para preservar CQRS pattern
- Adição de campo `auth_user_id` na tabela `users` (FK para `auth.users.id`)
- Atualização do frontend (React) para usar `@supabase/supabase-js` client-side
- Customização de templates de email no dashboard do Supabase (português brasileiro)
- Manutenção de isolamento multi-tenant por `accountId` (Supabase gerencia auth, app gerencia tenancy)
- Preservação do sistema de super-admin baseado em `SUPER_ADMIN_EMAIL`

### What is NOT included (out of scope)
- Implementação de MFA (Multi-Factor Authentication) - pode ser adicionado em feature futura
- OAuth providers além de Google (GitHub, Microsoft, etc.) - escopo limitado a Google por enquanto
- Migração de usuários existentes (template não possui usuários em produção, fresh start)
- Row Level Security (RLS) policies no Supabase (isolamento continua na camada de aplicação por `accountId`)
- Substituição do sistema de envio de emails via Resend (Supabase gerencia emails de auth, Resend continua para emails transacionais do app)
- Implementação de magic link authentication (apenas email/password + OAuth Google)
- Password recovery via SMS (apenas email)

## Business Rules

### Validations
1. **Email único por tenant**: Email deve ser único dentro do contexto de um Account (validado pelo Supabase Auth globalmente, app valida dentro do tenant)
2. **Email verificado obrigatório para login**: Usuários só podem fazer signin após confirmar email via link recebido
3. **Formato de email válido**: Validado pelo Supabase Auth (RFC 5322 compliant)
4. **Senha forte**: Mínimo 8 caracteres (configurável no Supabase dashboard)
5. **Account/Workspace criados atomicamente com User**: Signup deve criar Account → Workspace default → User em transação (parte do app, não do Supabase)
6. **Auth user ID vinculado a User**: Campo `auth_user_id` obrigatório, FK para `auth.users.id`
7. **Super-admin elevation**: Usuários com email configurado em `SUPER_ADMIN_EMAIL` são automaticamente elevados a super-admin role

### Flows

#### 1. Main Flow (Happy Path) - Signup Email/Senha

- Step 1: Usuário preenche formulário de signup (fullName, email, password) no frontend
- Step 2: Frontend chama `supabase.auth.signUp({ email, password, options: { data: { full_name } } })`
- Step 3: Supabase cria usuário em `auth.users` e envia email de confirmação
- Step 4: Backend recebe webhook/callback do Supabase (ou frontend detecta) → dispara `SignUpCommand`
- Step 5: `SignUpCommandHandler` cria Account → Workspace → User (com `auth_user_id`)
- Step 6: Publica `AccountCreatedEvent` (mantém eventos existentes)
- Step 7: Usuário recebe email de confirmação do Supabase
- Step 8: Usuário clica no link → Supabase marca `email_confirmed_at`
- Step 9: Backend detecta confirmação → dispara `ConfirmEmailCommand` → publica `EmailConfirmedEvent`
- Step 10: Frontend exibe página de sucesso e redireciona para login

#### 2. Main Flow (Happy Path) - Signup OAuth Google

- Step 1: Usuário clica em "Continuar com Google" no frontend
- Step 2: Frontend chama `supabase.auth.signInWithOAuth({ provider: 'google' })`
- Step 3: Usuário é redirecionado para fluxo OAuth do Google
- Step 4: Após aprovação, Google redireciona de volta com token
- Step 5: Supabase cria/atualiza usuário em `auth.users` (email já verificado)
- Step 6: Backend detecta novo usuário → dispara `SignUpCommand`
- Step 7: `SignUpCommandHandler` cria Account → Workspace → User (com `auth_user_id`)
- Step 8: Frontend recebe sessão ativa e redireciona para dashboard

#### 3. Main Flow (Happy Path) - Signin

- Step 1: Usuário preenche email e senha no formulário de login
- Step 2: Frontend chama `supabase.auth.signInWithPassword({ email, password })`
- Step 3: Supabase valida credenciais e retorna session (access_token + refresh_token)
- Step 4: Frontend armazena session no Zustand store e localStorage (gerenciado pelo SDK)
- Step 5: Frontend busca dados do usuário no backend (`GET /api/auth/me` com Authorization header)
- Step 6: Backend valida token via `SupabaseAuthGuard` → extrai `auth_user_id` do JWT
- Step 7: Backend busca User no banco via `auth_user_id` → retorna dados (fullName, role, accountId)
- Step 8: Frontend redireciona para dashboard

#### 4. Alternative Flows

**Scenario A: Signin com OAuth Google**
- Usuário clica em "Continuar com Google" na tela de login
- Frontend chama `supabase.auth.signInWithOAuth({ provider: 'google' })`
- Fluxo idêntico ao signup OAuth, mas usuário já existe (apenas cria sessão)

**Scenario B: Resend confirmation email**
- Usuário tenta fazer login com email não verificado
- Backend/Supabase retorna erro específico de email não confirmado
- Frontend exibe mensagem com opção de reenviar email
- Frontend chama `supabase.auth.resend({ type: 'signup', email })`
- Supabase reenvia email de confirmação

**Scenario C: Password recovery**
- Usuário clica em "Esqueci minha senha" no login
- Frontend chama `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'FRONTEND_URL/reset-password' })`
- Supabase envia email com link de reset
- Usuário clica no link → redirecionado para frontend com token na URL
- Frontend extrai token e exibe formulário de nova senha
- Frontend chama `supabase.auth.updateUser({ password: newPassword })`

#### 5. Error Flows

**Error Type 1: Email já cadastrado**
- Trigger: Usuário tenta signup com email existente em `auth.users`
- Handling: Supabase retorna erro `User already registered`
- User feedback: "Este email já está cadastrado. Faça login ou recupere sua senha."

**Error Type 2: Email não verificado**
- Trigger: Usuário tenta signin com email não confirmado
- Handling: Supabase permite login mas backend valida `email_confirmed_at` no guard
- User feedback: "Email não verificado. Verifique sua caixa de entrada ou reenvie o email de confirmação."

**Error Type 3: Credenciais inválidas**
- Trigger: Usuário fornece email ou senha incorretos
- Handling: Supabase retorna erro genérico (security best practice)
- User feedback: "Email ou senha inválidos."

**Error Type 4: Token expirado**
- Trigger: Usuário clica em link de confirmação após expiração (24h default)
- Handling: Supabase rejeita token, backend detecta erro
- User feedback: "Link de confirmação expirado. Solicite um novo email de confirmação."

**Error Type 5: Falha ao criar Account/Workspace**
- Trigger: SignUpCommand falha ao criar Account ou Workspace no banco após Supabase criar auth user
- Handling: Logar erro crítico, marcar auth user como "incompleto" via metadata
- User feedback: "Erro ao criar sua conta. Nossa equipe foi notificada."
- Recovery: Implementar job que detecta auth users sem User correspondente e retenta criação

## Integrations

### External APIs

- **Supabase Auth API**:
  - Purpose: Gerenciar autenticação, verificação de email, OAuth, sessões
  - Endpoints:
    - `POST /auth/v1/signup` - Criar novo usuário
    - `POST /auth/v1/token?grant_type=password` - Login email/senha
    - `POST /auth/v1/verify` - Confirmar email
    - `POST /auth/v1/recover` - Solicitar reset de senha
    - `GET /auth/v1/user` - Obter dados do usuário autenticado
  - Authentication: `SUPABASE_ANON_KEY` (frontend), `SUPABASE_SERVICE_ROLE_KEY` (backend)

- **Google OAuth**:
  - Purpose: Autenticação via conta Google
  - Configuration: Configurado no Supabase dashboard (Client ID + Secret)
  - Flow: Gerenciado pelo Supabase Auth (redirect-based OAuth 2.0)

### Internal Services

- **UserRepository**:
  - Purpose: Persistir dados de perfil do usuário (fullName, role, accountId, auth_user_id)
  - Dependencies: `auth.users.id` do Supabase (foreign key)

- **AccountRepository**:
  - Purpose: Criar Account para cada novo usuário
  - Dependencies: Nenhuma (root entity)

- **WorkspaceRepository**:
  - Purpose: Criar Workspace default para cada Account
  - Dependencies: Account criado previamente

- **EmailQueueService** (Resend):
  - Purpose: Enviar emails transacionais do app (não de auth)
  - Dependencies: Continua funcionando paralelamente ao sistema de email do Supabase

- **RoleElevationService**:
  - Purpose: Elevar usuário a super-admin se email matches `SUPER_ADMIN_EMAIL`
  - Dependencies: Dados do User (email)

## Edge Cases Identified

1. **Auth user criado mas Account/Workspace falha**:
   - Description: Supabase cria usuário em `auth.users`, mas `SignUpCommandHandler` falha ao criar Account/Workspace/User no banco da aplicação
   - Handling:
     - Armazenar flag em `auth.users.user_metadata.account_created = false`
     - Implementar job de reconciliação que detecta auth users sem User correspondente
     - Retentar criação automaticamente
     - Se falhar persistentemente, notificar administradores via log/Sentry

2. **Usuário confirma email mas evento não é capturado pelo backend**:
   - Description: Supabase marca email como confirmado, mas `EmailConfirmedEvent` não é publicado (webhook falha, etc.)
   - Handling:
     - Implementar verificação lazy: ao fazer signin, verificar se `email_confirmed_at` existe mas `emailVerified` flag local não foi marcado
     - Disparar `ConfirmEmailCommand` automaticamente caso detecte divergência
     - Logar discrepância para investigação

3. **OAuth Google retorna email já usado por usuário email/senha**:
   - Description: Usuário criou conta com email/senha, depois tenta login OAuth com mesmo email
   - Handling:
     - Supabase automaticamente vincula ambos (linking accounts)
     - Backend detecta `auth_user_id` existente e não cria duplicata
     - Apenas atualiza `updated_at` do User se necessário

4. **Token JWT expirado mas refresh token válido**:
   - Description: Access token expira (7d default), mas refresh token ainda válido (30d)
   - Handling:
     - Supabase SDK automaticamente refreshes token quando detecta expiração
     - Backend valida ambos access e refresh tokens no guard
     - Usuário não percebe interrupção (refresh transparente)

5. **Super-admin elevation race condition**:
   - Description: `RoleElevationService` verifica email antes do User ser totalmente criado
   - Handling:
     - Executar `checkAndElevateUser` após User estar persistido no banco
     - Usar transação para garantir atomicidade
     - Validar `SUPER_ADMIN_EMAIL` não-vazio antes de comparar

## Acceptance Criteria

1. [ ] Signup via email/senha cria usuário no Supabase Auth e no banco da aplicação (Account + Workspace + User)
2. [ ] Email de confirmação é enviado automaticamente após signup (template em PT-BR)
3. [ ] Usuário consegue confirmar email clicando no link recebido
4. [ ] Signin via email/senha validado funciona e retorna access token válido
5. [ ] Signin com email não confirmado é bloqueado com mensagem apropriada
6. [ ] Signin com credenciais inválidas retorna erro genérico de segurança
7. [ ] Botão "Continuar com Google" redireciona para OAuth do Google
8. [ ] OAuth Google cria usuário completo (Account + Workspace + User) com email já verificado
9. [ ] Usuário pode fazer signin via OAuth Google após signup
10. [ ] Endpoint `/api/auth/me` retorna dados do usuário autenticado quando token válido é fornecido
11. [ ] Guards protegem rotas autenticadas validando token do Supabase
12. [ ] Multi-tenancy preservado: queries filtradas por `accountId` sem vazamento entre tenants
13. [ ] Super-admin elevation funciona: usuário com email `SUPER_ADMIN_EMAIL` recebe role `super-admin`
14. [ ] Password recovery funciona: usuário recebe email e consegue redefinir senha
15. [ ] Resend confirmation email funciona quando solicitado
16. [ ] Frontend React gerencia sessão usando `@supabase/supabase-js` SDK
17. [ ] Logout limpa sessão localmente e no Supabase
18. [ ] Tokens expirados são automaticamente refreshed sem intervenção do usuário
19. [ ] Pacotes legados removidos: `passport`, `passport-jwt`, `@nestjs/passport`, `bcrypt`
20. [ ] Environment variables atualizadas: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` configuradas

## Next Steps

**Para o Planning Agent:**

1. **Database Schema Migration:**
   - Criar migration para adicionar coluna `auth_user_id UUID` na tabela `users` (FK para `auth.users.id`)
   - Remover colunas obsoletas: `password_hash`, `email_verification_token`, `email_verification_token_expiry`, `email_verified`
   - Atualizar constraints e indexes

2. **Backend Architecture:**
   - Implementar `SupabaseAuthGuard` customizado para NestJS que valida JWT do Supabase
   - Criar `SupabaseService` wrapper para encapsular operações do SDK (`@supabase/supabase-js`)
   - Adaptar `SignUpCommandHandler` para chamar Supabase Auth e criar entidades locais
   - Adaptar `ConfirmEmailCommandHandler` para responder a webhooks/callbacks do Supabase
   - Remover `JwtStrategy`, `JwtAuthGuard`, e dependências de Passport
   - Atualizar `AuthService.signIn()` para usar Supabase SDK
   - Atualizar `AuthService.getMe()` para buscar User via `auth_user_id`
   - Implementar webhook endpoint para receber eventos do Supabase (user.created, user.updated)

3. **Frontend Integration:**
   - Adicionar `@supabase/supabase-js` ao frontend
   - Criar `supabaseClient` singleton com configuração (`SUPABASE_URL`, `SUPABASE_ANON_KEY`)
   - Atualizar hooks `useSignIn`, `useSignUp` para usar Supabase SDK em vez de API REST
   - Implementar `onAuthStateChange` listener para sincronizar sessão no Zustand store
   - Adicionar botão "Continuar com Google" em formulários de login/signup
   - Atualizar página de confirmação de email para receber callback do Supabase
   - Implementar fluxo de password recovery (página de solicitação + página de reset)

4. **Configuration:**
   - Configurar OAuth Google no Supabase dashboard (Client ID + Secret)
   - Customizar templates de email no Supabase dashboard (traduzir para PT-BR)
   - Configurar redirect URLs permitidas (FRONTEND_URL)
   - Atualizar `.env.example` com variáveis do Supabase
   - Remover `JWT_SECRET` das environment variables

5. **Testing Strategy:**
   - Testar signup email/senha end-to-end
   - Testar signup OAuth Google end-to-end
   - Testar confirmação de email (link válido e expirado)
   - Testar signin com diferentes cenários (válido, inválido, email não confirmado)
   - Testar password recovery flow
   - Testar guards em rotas protegidas
   - Testar isolamento multi-tenant
   - Testar super-admin elevation
   - Testar edge cases identificados (reconciliação de usuários, refresh token, etc.)

6. **Documentation:**
   - Atualizar CLAUDE.md com nova arquitetura de auth
   - Documentar configuração do Supabase dashboard (OAuth, templates)
   - Atualizar diagrama de fluxo de autenticação
   - Criar guia de troubleshooting para problemas comuns
