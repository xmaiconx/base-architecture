# Plano Técnico: Migração de Passport.js para Supabase Auth

**Feature:** F0003-supabase-auth-migration
**Branch:** refactor/F0003-supabase-auth-migration
**Data:** 2025-12-03

---

## 1. Solution Overview

Esta migração substitui a autenticação customizada (Passport.js + bcrypt + JWT manual) pelo Supabase Auth SDK, mantendo a arquitetura CQRS e multi-tenant do sistema.

### Abordagem Arquitetural

**Princípio Supabase-First:**
- Frontend comunica diretamente com Supabase Auth para operações de autenticação (signup, signin, OAuth)
- Supabase gerencia: senhas (hashing), tokens (JWT), verificação de email, sessões, OAuth providers
- Backend recebe notificação via webhooks do Supabase quando usuários são criados/atualizados
- Backend gerencia: criação de Account/Workspace/User, multi-tenancy, roles, dados de perfil

**Separação de Responsabilidades:**
- **Supabase Auth (auth.users):** Identidade, credenciais, email verification, OAuth, sessions
- **Backend App (users table):** Perfil de negócio, role, accountId, workspaceId, metadata
- **Vínculo:** Campo `auth_user_id` (FK para `auth.users.id`) conecta ambos

### Decisões Arquiteturais Principais

1. **Preservação do CQRS Pattern:** Commands (`SignUpCommand`, `ConfirmEmailCommand`) e Events (`AccountCreatedEvent`, `EmailConfirmedEvent`) continuam existindo, adaptados para orquestrar Supabase SDK

2. **Webhook-Based Synchronization:** Backend recebe webhooks do Supabase (`user.created`, `user.updated`) e dispara Commands para criar Account/Workspace/User atomicamente

3. **Reconciliação Automática:** Job em background detecta auth users sem User correspondente no banco e retenta criação (edge case handling)

4. **Guard Customizado:** `SupabaseAuthGuard` substitui `JwtAuthGuard`, validando tokens JWT do Supabase usando SDK (não Passport)

5. **Multi-Tenancy Preservado:** Isolamento por `accountId` continua na camada de aplicação. JWT do Supabase conterá custom claim `accountId` após criação do User

### Principais Mudanças

**Backend:**
- ❌ Remover: PassportModule, JwtModule (NestJS), JwtStrategy, bcrypt
- ✅ Adicionar: `@supabase/supabase-js`, `SupabaseService`, `SupabaseAuthGuard`
- 🔄 Adaptar: SignUpCommandHandler (chama Supabase), AuthService (remove signin logic)
- 🔄 Adaptar: Guards em todos os módulos (Billing, Workspace, Audit)

**Database:**
- ❌ Remover colunas: `password_hash`, `email_verification_token`, `email_verification_token_expiry`, `email_verified`
- ✅ Adicionar coluna: `auth_user_id` UUID NOT NULL (FK → `auth.users.id`)

**Frontend:**
- ✅ Adicionar: `@supabase/supabase-js`, `supabaseClient` singleton
- 🔄 Adaptar: `useAuth` hook, auth-store (sincroniza com Supabase session)
- ✅ Adicionar: Botão "Continuar com Google", página de password recovery

**Infraestrutura:**
- ✅ Configurar: OAuth Google no Supabase dashboard
- ✅ Customizar: Templates de email (PT-BR)
- ✅ Configurar: Webhooks do Supabase → Backend endpoint

---

## 2. Components to Develop

### 2.1 Backend - API

#### Novos Componentes

**`SupabaseService`** (`apps/backend/src/shared/services/supabase.service.ts`)
- **Responsabilidade:** Wrapper para `@supabase/supabase-js`, encapsula operações do SDK
- **Métodos:**
  - `getUser(accessToken: string)` - Valida token e retorna auth user
  - `getUserById(authUserId: string)` - Busca auth user por ID (admin operation)
  - `verifyWebhookSignature(payload, signature)` - Valida signature de webhooks
- **Injeção:** Singleton via DI token `'ISupabaseService'`

**`SupabaseAuthGuard`** (`apps/backend/src/api/guards/supabase-auth.guard.ts`)
- **Responsabilidade:** Guard customizado que valida JWT do Supabase
- **Comportamento:**
  - Extrai token do header `Authorization: Bearer <token>`
  - Valida token usando `SupabaseService.getUser()`
  - Busca User no banco via `auth_user_id`
  - Valida `emailVerified` (se aplicável)
  - Eleva super-admin via `RoleElevationService`
  - Injeta `req.user = { userId, accountId, email, role }`
- **Substitui:** `JwtAuthGuard` (Passport-based)

**`SupabaseWebhookController`** (`apps/backend/src/api/modules/auth/supabase-webhook.controller.ts`)
- **Responsabilidade:** Recebe webhooks do Supabase Auth
- **Endpoints:**
  - `POST /webhooks/supabase/auth` - Recebe eventos de user.created, user.updated
- **Comportamento:**
  - Valida signature via `SupabaseService.verifyWebhookSignature()`
  - Despacha Commands baseado no tipo de evento
  - Retorna 200 OK (webhook acknowledgment)

**`CompleteSignUpCommand`** (`apps/backend/src/api/modules/auth/commands/CompleteSignUpCommand.ts`)
- **Responsabilidade:** Command disparado após Supabase criar auth user
- **Payload:** `authUserId: string`, `email: string`, `fullName: string`
- **Handler:** Cria Account → Workspace → User atomicamente (transação)

**`SyncAuthUserCommand`** (`apps/backend/src/api/modules/auth/commands/SyncAuthUserCommand.ts`)
- **Responsabilidade:** Command para reconciliar auth users sem User correspondente
- **Payload:** `authUserId: string`
- **Handler:** Busca auth user no Supabase, cria Account/Workspace/User

#### Componentes Modificados

**`SignUpCommandHandler`** (modificado)
- **Antes:** Hashava senha com bcrypt, criava Account/Workspace/User, gerava token de verificação
- **Depois:** Recebe `authUserId` do webhook, cria Account/Workspace/User vinculado a `auth_user_id`
- **Remove:** Hashing de senha, geração de token de verificação

**`ConfirmEmailCommandHandler`** (modificado)
- **Antes:** Validava token customizado, marcava `email_verified = true`
- **Depois:** Recebe confirmação via webhook, publica `EmailConfirmedEvent` (auditoria)
- **Simplificação:** Supabase já marcou email como confirmado, backend apenas registra evento

**`AuthService`** (modificado)
- **Remove métodos:** `signIn()` (movido para frontend), `signUp()` (movido para frontend)
- **Mantém métodos:** `getMe()` (busca User via `auth_user_id`), `resendConfirmation()` (proxy para Supabase)
- **Adiciona métodos:** `handleSupabaseWebhook()` (processa webhooks)

**`AuthController`** (modificado)
- **Remove endpoints:** `POST /auth/signin` (frontend chama Supabase direto)
- **Remove endpoints:** `POST /auth/signup` (frontend chama Supabase direto)
- **Mantém endpoints:** `GET /auth/me`, `POST /auth/resend-confirmation`
- **Adiciona endpoints:** `POST /webhooks/supabase/auth` (via SupabaseWebhookController)

**`IUserRepository`** (modificado)
- **Remove métodos:** `findByEmailVerificationToken()`
- **Adiciona métodos:** `findByAuthUserId(authUserId: string)`

#### Componentes Removidos

- ❌ `JwtStrategy` (passport-jwt)
- ❌ `JwtAuthGuard` (Passport-based)
- ❌ `ResendConfirmationCommand` (Supabase tem API nativa)
- ❌ `ResendConfirmationCommandHandler`

### 2.2 Backend - Workers/Jobs

#### Novo Worker

**`AuthReconciliationWorker`** (`apps/backend/src/workers/processors/auth-reconciliation.processor.ts`)
- **Responsabilidade:** Job cron que detecta auth users sem User correspondente
- **Agendamento:** A cada 5 minutos
- **Comportamento:**
  - Lista todos os auth users via `SupabaseService.listUsers()` (admin API)
  - Para cada auth user, verifica se existe User com `auth_user_id` correspondente
  - Se não existe, dispara `SyncAuthUserCommand`
  - Implementa backoff exponencial (1min, 5min, 15min, 1h, 24h)
  - Após 5 tentativas falhadas, marca como `failed` e notifica admin (log crítico)

**Queue Configuration:**
- Queue: `auth-reconciliation`
- Concurrency: 1 (processa sequencialmente)
- Retry: 3 tentativas com backoff exponencial

### 2.3 Frontend

#### Novos Componentes

**`supabaseClient`** (`apps/frontend/src/lib/supabase.ts`)
- **Responsabilidade:** Singleton do Supabase client
- **Configuração:**
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - `persistSession: true` (localStorage)
  - `autoRefreshToken: true`

**`useSupabaseAuth`** hook (`apps/frontend/src/hooks/use-supabase-auth.ts`)
- **Responsabilidade:** Hook para gerenciar auth state via Supabase
- **Métodos:**
  - `signUp(email, password, fullName)` - Signup via email/senha
  - `signIn(email, password)` - Signin via email/senha
  - `signInWithGoogle()` - Signin via OAuth Google
  - `signOut()` - Logout (limpa session local + Supabase)
  - `resetPassword(email)` - Solicita reset de senha
  - `updatePassword(newPassword)` - Atualiza senha após reset
- **Sincronização:** Escuta `onAuthStateChange` e atualiza Zustand store

**`GoogleSignInButton`** component (`apps/frontend/src/components/auth/GoogleSignInButton.tsx`)
- **Responsabilidade:** Botão "Continuar com Google"
- **Comportamento:** Chama `supabase.auth.signInWithOAuth({ provider: 'google' })`

**Página de Password Recovery** (`apps/frontend/src/pages/reset-password.tsx`)
- **Responsabilidade:** Formulário para solicitar reset de senha
- **Fluxo:** Input de email → Chama `supabase.auth.resetPasswordForEmail()` → Mostra mensagem de sucesso

**Página de Update Password** (`apps/frontend/src/pages/update-password.tsx`)
- **Responsabilidade:** Formulário para definir nova senha após reset
- **Fluxo:** Recebe token na URL → Input de nova senha → Chama `supabase.auth.updateUser({ password })`

#### Componentes Modificados

**`auth-store.ts`** (modificado)
- **Adiciona:** `session: Session | null` (Supabase session object)
- **Adiciona:** `setSession(session: Session)` - Armazena session do Supabase
- **Modifica:** `setAuth()` - Agora recebe session do Supabase em vez de token customizado
- **Modifica:** `clearAuth()` - Limpa session do Supabase também

**`useAuth`** hook (modificado)
- **Integra:** `useSupabaseAuth` para operações de autenticação
- **Sincroniza:** Session do Supabase com Zustand store
- **Mantém:** Chamada para `GET /auth/me` para buscar dados de perfil do backend

**Páginas de login/signup** (modificadas)
- **Adiciona:** Botão "Continuar com Google"
- **Modifica:** Formulários chamam `useSupabaseAuth` em vez de API REST do backend

### 2.4 Database

#### Nova Migration

**`20250103001_migrate_to_supabase_auth.js`**

**Schema Changes:**

1. **Adicionar coluna `auth_user_id`:**
```sql
ALTER TABLE users
ADD COLUMN auth_user_id UUID;

-- Criar foreign key (opcional, depende de acesso a auth.users)
-- ALTER TABLE users
-- ADD CONSTRAINT fk_auth_user
-- FOREIGN KEY (auth_user_id) REFERENCES auth.users(id);

-- Criar index para performance
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);

-- Adicionar constraint de unicidade
ALTER TABLE users
ADD CONSTRAINT users_auth_user_id_unique UNIQUE(auth_user_id);
```

2. **Remover colunas obsoletas:**
```sql
ALTER TABLE users
DROP COLUMN password_hash,
DROP COLUMN email_verification_token,
DROP COLUMN email_verification_token_expiry,
DROP COLUMN email_verified;
```

3. **Tornar `auth_user_id` NOT NULL (após validação):**
```sql
-- Executar apenas após todos os users terem auth_user_id preenchido
-- ALTER TABLE users
-- ALTER COLUMN auth_user_id SET NOT NULL;
```

**Rollback Strategy:**
- Migration DOWN reverte colunas (não recupera dados, apenas estrutura)
- Estratégia: Não remover colunas imediatamente, marcar como deprecated primeiro
- **Decisão do usuário:** Remover completamente (escolha 1a)

#### Modificações em Repository Interfaces

**`IUserRepository`** (interface modificada)
- **Remove:** `findByEmailVerificationToken(token: string)`
- **Adiciona:** `findByAuthUserId(authUserId: string): Promise<User | null>`

---

## 3. Integration Contracts

### 3.1 API Contracts

#### Endpoint: Webhook do Supabase
**Route:** `POST /webhooks/supabase/auth`

**Request:**
- Headers:
  - `x-supabase-signature`: Signature HMAC do webhook (validação)
  - `Content-Type: application/json`
- Body:
```json
{
  "type": "INSERT" | "UPDATE" | "DELETE",
  "table": "users",
  "record": {
    "id": "uuid-do-auth-user",
    "email": "user@example.com",
    "email_confirmed_at": "2025-12-03T10:00:00Z",
    "user_metadata": {
      "full_name": "João Silva"
    }
  },
  "old_record": null
}
```
- Validations:
  - Signature deve ser válida (HMAC com `SUPABASE_WEBHOOK_SECRET`)
  - Type deve ser `INSERT` ou `UPDATE`
  - Record deve conter `id`, `email`

**Response:**
- Status codes:
  - 200: Webhook processado com sucesso
  - 400: Signature inválida ou payload malformado
  - 500: Erro ao processar webhook (Supabase retentará)
- Response structure:
```json
{
  "success": true,
  "message": "Webhook processado com sucesso"
}
```

**Errors:**
- 400: "Invalid webhook signature" (assinatura inválida)
- 400: "Invalid webhook payload" (payload malformado)
- 500: "Internal server error" (erro ao criar Account/Workspace)

---

#### Endpoint: Get Current User
**Route:** `GET /auth/me`

**Request:**
- Headers:
  - `Authorization: Bearer <supabase-access-token>` (OBRIGATÓRIO)
- Query params: Nenhum
- Body: Nenhum
- Validations:
  - Token JWT deve ser válido (Supabase SDK valida)
  - User deve existir no banco local (via `auth_user_id`)

**Response:**
- Status codes:
  - 200: Dados do usuário retornados
  - 401: Token inválido ou expirado
  - 404: Usuário não encontrado no banco local
  - 500: Erro interno
- Response structure:
```json
{
  "user": {
    "id": "uuid-do-user",
    "authUserId": "uuid-do-auth-user",
    "accountId": "uuid-do-account",
    "fullName": "João Silva",
    "email": "user@example.com",
    "role": "owner",
    "status": "active",
    "createdAt": "2025-12-03T10:00:00Z",
    "updatedAt": "2025-12-03T10:00:00Z"
  }
}
```

**Errors:**
- 401: "Invalid or expired token"
- 404: "User not found"
- 500: "Internal server error"

---

#### Endpoint: Resend Confirmation Email
**Route:** `POST /auth/resend-confirmation`

**Request:**
- Headers:
  - `Content-Type: application/json`
- Body:
```json
{
  "email": "user@example.com"
}
```
- Validations:
  - Email deve ser formato válido
  - Email deve existir no Supabase Auth

**Response:**
- Status codes:
  - 200: Email reenviado com sucesso
  - 400: Email inválido ou não encontrado
  - 429: Rate limit excedido
  - 500: Erro interno
- Response structure:
```json
{
  "message": "Email de confirmação reenviado com sucesso."
}
```

**Errors:**
- 400: "Invalid email format"
- 400: "Email not found"
- 429: "Too many requests. Try again later."
- 500: "Internal server error"

---

### 3.2 Event Contracts

#### Event: AccountCreatedEvent
**When emitted:** Após backend criar Account/Workspace/User com sucesso (disparado por webhook do Supabase)

**Payload:**
```typescript
{
  accountId: string;        // UUID do Account criado
  userId: string;           // UUID do User criado
  authUserId: string;       // UUID do auth user (Supabase)
  workspaceId: string;      // UUID do Workspace default criado
  userFullName: string;     // Nome completo do usuário
  userEmail: string;        // Email do usuário
  timestamp: Date;          // Data/hora do evento
}
```

**Consumers:**
- `AccountCreatedEventHandler` - Envia email de boas-vindas (via Resend, NÃO Supabase)
- `AuditEventListener` - Registra evento em audit_logs

**Processing:**
- Email de boas-vindas enviado para fila `email-queue`
- Audit log criado com tipo `account.created`

---

#### Event: EmailConfirmedEvent
**When emitted:** Após backend receber webhook do Supabase indicando que email foi confirmado

**Payload:**
```typescript
{
  userId: string;           // UUID do User
  authUserId: string;       // UUID do auth user (Supabase)
  accountId: string;        // UUID do Account
  email: string;            // Email confirmado
  confirmedAt: Date;        // Data/hora da confirmação (do Supabase)
  timestamp: Date;          // Data/hora do evento
}
```

**Consumers:**
- `EmailConfirmedEventHandler` - Envia email de celebração (opcional)
- `AuditEventListener` - Registra evento em audit_logs

**Processing:**
- Audit log criado com tipo `email.confirmed`
- Possível email de "Bem-vindo! Seu email foi confirmado" (opcional)

---

### 3.3 Command Contracts

#### Command: CompleteSignUpCommand
**Triggered by:** Webhook do Supabase após usuário fazer signup

**Payload:**
```typescript
{
  authUserId: string;       // UUID do auth user criado pelo Supabase
  email: string;            // Email do usuário
  fullName: string;         // Nome completo (de user_metadata)
}
```

**Processed by:** `CompleteSignUpCommandHandler`

**Result:**
- Account criado (nome: `Clínica de {fullName}`)
- Workspace default criado (nome: `Meu Consultório`)
- User criado vinculado a `auth_user_id`
- WorkspaceUser criado (vínculo User ↔ Workspace)
- `AccountCreatedEvent` publicado

**Error Handling:**
- Se Account/Workspace/User já existem (retry), retorna sem erro (idempotência)
- Se falha ao criar, lança exception (Supabase retentará webhook)
- Se auth user não existe no Supabase, lança `NotFoundException`

---

#### Command: SyncAuthUserCommand
**Triggered by:** Job de reconciliação (`AuthReconciliationWorker`)

**Payload:**
```typescript
{
  authUserId: string;       // UUID do auth user sem User correspondente
}
```

**Processed by:** `SyncAuthUserCommandHandler`

**Result:**
- Busca auth user no Supabase via `SupabaseService.getUserById()`
- Extrai email e fullName de `user_metadata`
- Executa mesmo fluxo de `CompleteSignUpCommand` (cria Account/Workspace/User)
- `AccountCreatedEvent` publicado

**Error Handling:**
- Se auth user não existe no Supabase, marca como `deleted` e ignora
- Se falha ao criar, lança exception (job retentará com backoff)
- Após 5 tentativas falhadas, marca como `failed` e notifica admin

---

## 4. Complete Data Flows

### 4.1 Flow: Signup via Email/Senha

**Passo a passo:**

1. **Frontend:** Usuário preenche formulário (fullName, email, password)
2. **Frontend:** Chama `supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })`
3. **Supabase:** Cria usuário em `auth.users`, envia email de confirmação
4. **Supabase:** Retorna `{ user, session }` para frontend
5. **Supabase:** Dispara webhook `user.created` → Backend
6. **Backend:** `SupabaseWebhookController` recebe webhook
7. **Backend:** Valida signature via `SupabaseService.verifyWebhookSignature()`
8. **Backend:** Extrai `authUserId`, `email`, `fullName` do payload
9. **Backend:** Dispara `CompleteSignUpCommand`
10. **Backend:** `CompleteSignUpCommandHandler` executa:
    - Cria Account (nome: `Clínica de {fullName}`)
    - Cria Workspace (nome: `Meu Consultório`)
    - Cria User (com `auth_user_id` vinculado)
    - Adiciona User ao Workspace como OWNER
    - Publica `AccountCreatedEvent`
11. **Backend:** `AccountCreatedEventHandler` envia email de boas-vindas (Resend)
12. **Backend:** `AuditEventListener` registra evento em `audit_logs`
13. **Frontend:** Mostra mensagem "Conta criada! Verifique seu email."
14. **Frontend:** Redireciona para página de confirmação pendente

---

### 4.2 Flow: Confirmação de Email

**Passo a passo:**

1. **Email:** Usuário recebe email do Supabase com link de confirmação
2. **Usuário:** Clica no link (ex: `https://app.com/auth/confirm?token=xxx`)
3. **Supabase:** Valida token, marca `email_confirmed_at` em `auth.users`
4. **Supabase:** Redireciona para frontend (`FRONTEND_URL/email-confirmed`)
5. **Frontend:** Mostra mensagem "Email confirmado com sucesso!"
6. **Supabase:** Dispara webhook `user.updated` → Backend
7. **Backend:** `SupabaseWebhookController` recebe webhook
8. **Backend:** Detecta mudança em `email_confirmed_at`
9. **Backend:** Busca User via `auth_user_id`
10. **Backend:** Publica `EmailConfirmedEvent` (auditoria)
11. **Backend:** `AuditEventListener` registra evento em `audit_logs`
12. **Frontend:** Redireciona para login

---

### 4.3 Flow: Signin via Email/Senha

**Passo a passo:**

1. **Frontend:** Usuário preenche email e senha no formulário de login
2. **Frontend:** Chama `supabase.auth.signInWithPassword({ email, password })`
3. **Supabase:** Valida credenciais
4. **Supabase:** Retorna `{ user, session }` (contém access_token + refresh_token)
5. **Frontend:** Armazena session no Zustand store (`setSession()`)
6. **Frontend:** Chama `GET /auth/me` com `Authorization: Bearer <access_token>`
7. **Backend:** `SupabaseAuthGuard` valida token via `SupabaseService.getUser()`
8. **Backend:** Busca User no banco via `auth_user_id`
9. **Backend:** Valida se User existe e está ativo
10. **Backend:** Eleva super-admin se email === `SUPER_ADMIN_EMAIL` (via `RoleElevationService`)
11. **Backend:** Injeta `req.user = { userId, accountId, email, role }`
12. **Backend:** `AuthService.getMe()` retorna dados do User
13. **Frontend:** Atualiza Zustand store com dados do User (`setAuth()`)
14. **Frontend:** Redireciona para dashboard

---

### 4.4 Flow: Signin via OAuth Google

**Passo a passo:**

1. **Frontend:** Usuário clica em "Continuar com Google"
2. **Frontend:** Chama `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: 'FRONTEND_URL/auth/callback' } })`
3. **Supabase:** Redireciona para OAuth do Google
4. **Google:** Usuário aprova permissões
5. **Google:** Redireciona de volta para Supabase com código de autorização
6. **Supabase:** Troca código por access token do Google
7. **Supabase:** Busca perfil do usuário no Google (email, nome)
8. **Supabase:** Cria/atualiza usuário em `auth.users` (email já verificado)
9. **Supabase:** Redireciona para frontend com session na URL
10. **Frontend:** Extrai session da URL, armazena no Zustand
11. **Supabase:** Se novo usuário, dispara webhook `user.created` → Backend
12. **Backend:** `CompleteSignUpCommand` cria Account/Workspace/User (mesmo fluxo de signup email)
13. **Frontend:** Chama `GET /auth/me` (mesmo fluxo de signin email, passo 6 em diante)
14. **Frontend:** Redireciona para dashboard

---

### 4.5 Flow: Password Recovery

**Passo a passo:**

1. **Frontend:** Usuário clica em "Esqueci minha senha"
2. **Frontend:** Mostra formulário com input de email
3. **Frontend:** Chama `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'FRONTEND_URL/update-password' })`
4. **Supabase:** Envia email com link de reset
5. **Email:** Usuário recebe email e clica no link
6. **Supabase:** Valida token, redireciona para `FRONTEND_URL/update-password?token=xxx`
7. **Frontend:** Mostra formulário de nova senha
8. **Frontend:** Chama `supabase.auth.updateUser({ password: newPassword })`
9. **Supabase:** Atualiza senha (hash interno)
10. **Supabase:** Dispara webhook `user.updated` → Backend (opcional: registrar auditoria)
11. **Frontend:** Mostra mensagem "Senha atualizada com sucesso!"
12. **Frontend:** Redireciona para login

---

### 4.6 Flow: Reconciliação (Edge Case)

**Cenário:** Supabase criou auth user, mas backend falhou ao criar Account/Workspace/User (timeout, DB down, etc.)

**Passo a passo:**

1. **Cron Job:** `AuthReconciliationWorker` executa a cada 5 minutos
2. **Worker:** Lista todos os auth users via `SupabaseService.listUsers()` (admin API)
3. **Worker:** Para cada auth user, busca User no banco via `auth_user_id`
4. **Worker:** Se User não existe, dispara `SyncAuthUserCommand`
5. **Backend:** `SyncAuthUserCommandHandler` executa:
    - Busca auth user no Supabase via `getUserById()`
    - Extrai email e fullName
    - Cria Account/Workspace/User (mesmo fluxo de signup)
    - Publica `AccountCreatedEvent`
6. **Worker:** Se falha, implementa backoff exponencial (1min, 5min, 15min, 1h, 24h)
7. **Worker:** Após 5 tentativas falhadas, marca como `failed` e notifica admin

---

## 5. Component Dependencies

### Backend Dependencies

**`SupabaseAuthGuard` depende de:**
- `SupabaseService` (validar token)
- `IUserRepository` (buscar User via `auth_user_id`)
- `RoleElevationService` (elevar super-admin)

**`SupabaseWebhookController` depende de:**
- `SupabaseService` (validar signature)
- `CommandBus` (CQRS, disparar Commands)

**`CompleteSignUpCommandHandler` depende de:**
- `SupabaseService` (buscar auth user se necessário)
- `IAccountRepository` (criar Account)
- `IWorkspaceRepository` (criar Workspace)
- `IUserRepository` (criar User)
- `IWorkspaceUserRepository` (vincular User ↔ Workspace)
- `IEventBroker` (publicar `AccountCreatedEvent`)
- `IConfigurationService` (verificar super-admin)

**`AuthReconciliationWorker` depende de:**
- `SupabaseService` (listar auth users)
- `IUserRepository` (verificar se User existe)
- `CommandBus` (disparar `SyncAuthUserCommand`)

**Módulos que usam `SupabaseAuthGuard`:**
- Billing Module (todas as rotas protegidas)
- Workspace Module (todas as rotas protegidas)
- Audit Module (todas as rotas protegidas)
- Auth Module (`GET /auth/me`)

### Frontend Dependencies

**`useSupabaseAuth` depende de:**
- `supabaseClient` (operações de auth)
- `useAuthStore` (Zustand, sincronizar state)
- API backend (`GET /auth/me` para buscar perfil)

**Páginas de login/signup dependem de:**
- `useSupabaseAuth` (signup, signin, signInWithGoogle)
- `GoogleSignInButton` component

**Protected routes dependem de:**
- `useAuth` hook (verificar autenticação)
- Zustand store (`isAuthenticated`, `user`)

### External Dependencies

**Backend depende de:**
- Supabase Auth API (validar tokens, listar users)
- Supabase Webhooks (notificações de user.created, user.updated)

**Frontend depende de:**
- Supabase Auth API (signup, signin, OAuth, password recovery)
- Backend API (`GET /auth/me` para dados de perfil)

**Supabase depende de:**
- Google OAuth API (configurado no dashboard)
- Email provider (SMTP do Supabase, templates customizados)

---

## 6. Development Order

### Phase 1: Database Foundation (PRIMEIRO)

**Justificativa:** Schema do banco deve existir antes de qualquer código que persiste dados.

1. **Migration: Adicionar `auth_user_id`**
   - Criar migration `20250103001_add_auth_user_id.js`
   - Adicionar coluna `auth_user_id UUID`
   - Criar index e constraint de unicidade
   - **NÃO remover colunas antigas ainda** (rollback safety)

2. **Repository: Atualizar `IUserRepository`**
   - Adicionar método `findByAuthUserId(authUserId: string)`
   - Implementar no `UserRepository` (Kysely)

3. **Testes:** Validar que queries com `auth_user_id` funcionam

---

### Phase 2: Backend - Supabase Integration (SEGUNDO)

**Justificativa:** Backend precisa estar pronto para receber webhooks antes de frontend começar a criar usuários.

4. **SupabaseService: Implementar wrapper**
   - Criar `apps/backend/src/shared/services/supabase.service.ts`
   - Implementar `getUser()`, `getUserById()`, `verifyWebhookSignature()`, `listUsers()`
   - Registrar no `SharedModule` via DI token `'ISupabaseService'`

5. **SupabaseAuthGuard: Implementar guard customizado**
   - Criar `apps/backend/src/api/guards/supabase-auth.guard.ts`
   - Validar token via `SupabaseService.getUser()`
   - Buscar User via `auth_user_id`
   - Elevar super-admin via `RoleElevationService`

6. **CompleteSignUpCommand: Criar command + handler**
   - Criar `CompleteSignUpCommand.ts` (payload: authUserId, email, fullName)
   - Criar `CompleteSignUpCommandHandler.ts` (cria Account → Workspace → User)
   - Adaptar lógica existente de `SignUpCommandHandler` (remover bcrypt, token)

7. **SupabaseWebhookController: Receber webhooks**
   - Criar `supabase-webhook.controller.ts`
   - Endpoint `POST /webhooks/supabase/auth`
   - Validar signature
   - Disparar `CompleteSignUpCommand` para eventos `user.created`

8. **Testes:** Validar fluxo completo de webhook → criação de Account/Workspace/User

---

### Phase 3: Backend - Auth Endpoints (TERCEIRO)

**Justificativa:** Endpoints de auth devem funcionar antes de frontend ser adaptado.

9. **AuthService: Adaptar métodos**
   - Remover `signIn()` (frontend chama Supabase direto)
   - Remover `signUp()` (frontend chama Supabase direto)
   - Adaptar `getMe()` para buscar via `auth_user_id`
   - Implementar `resendConfirmation()` como proxy para Supabase

10. **AuthController: Remover endpoints obsoletos**
    - Remover `POST /auth/signin`
    - Remover `POST /auth/signup`
    - Manter `GET /auth/me` (agora com `SupabaseAuthGuard`)
    - Manter `POST /auth/resend-confirmation`

11. **Guards: Substituir em todos os módulos**
    - Substituir `JwtAuthGuard` por `SupabaseAuthGuard` em:
      - Billing Module
      - Workspace Module
      - Audit Module
      - Auth Module (`GET /auth/me`)

12. **Testes:** Validar que `GET /auth/me` funciona com token do Supabase

---

### Phase 4: Backend - Reconciliation Worker (QUARTO)

**Justificativa:** Job de reconciliação é safety net, pode ser implementado depois do fluxo principal.

13. **SyncAuthUserCommand: Criar command + handler**
    - Criar `SyncAuthUserCommand.ts` (payload: authUserId)
    - Criar `SyncAuthUserCommandHandler.ts` (busca auth user no Supabase, cria Account/Workspace/User)

14. **AuthReconciliationWorker: Implementar job**
    - Criar `apps/backend/src/workers/processors/auth-reconciliation.processor.ts`
    - Configurar cron job (a cada 5 minutos)
    - Implementar backoff exponencial
    - Implementar notificação de falhas persistentes

15. **Testes:** Simular edge case (auth user sem User) e validar reconciliação

---

### Phase 5: Frontend - Supabase Client (QUINTO)

**Justificativa:** Frontend precisa de client configurado antes de adaptar hooks e páginas.

16. **supabaseClient: Criar singleton**
    - Criar `apps/frontend/src/lib/supabase.ts`
    - Configurar `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
    - Configurar `persistSession: true`, `autoRefreshToken: true`

17. **useSupabaseAuth: Criar hook**
    - Criar `apps/frontend/src/hooks/use-supabase-auth.ts`
    - Implementar `signUp()`, `signIn()`, `signInWithGoogle()`, `signOut()`
    - Implementar `resetPassword()`, `updatePassword()`
    - Implementar listener `onAuthStateChange` → sincroniza Zustand

18. **auth-store: Adaptar para Supabase session**
    - Adicionar `session: Session | null`
    - Adicionar `setSession(session: Session)`
    - Modificar `setAuth()` para usar session do Supabase

19. **Testes:** Validar que signup/signin via Supabase funciona e sincroniza store

---

### Phase 6: Frontend - Auth Pages (SEXTO)

**Justificativa:** Páginas dependem de hooks funcionando.

20. **GoogleSignInButton: Criar component**
    - Criar `apps/frontend/src/components/auth/GoogleSignInButton.tsx`
    - Botão chama `signInWithGoogle()`

21. **Páginas de login/signup: Adaptar**
    - Adicionar `GoogleSignInButton` aos formulários
    - Substituir chamadas de API REST por `useSupabaseAuth`

22. **Página de Password Recovery: Criar**
    - Criar `apps/frontend/src/pages/reset-password.tsx`
    - Formulário chama `resetPassword(email)`

23. **Página de Update Password: Criar**
    - Criar `apps/frontend/src/pages/update-password.tsx`
    - Formulário chama `updatePassword(newPassword)`

24. **Testes:** Validar todos os fluxos de auth no frontend end-to-end

---

### Phase 7: Cleanup & Configuration (SÉTIMO)

**Justificativa:** Remoção de código legado e configurações finais só após tudo funcionar.

25. **Backend: Remover código legado**
    - Remover `JwtStrategy` (passport-jwt)
    - Remover `JwtAuthGuard` (Passport-based)
    - Remover `ResendConfirmationCommand` e handler
    - Remover dependências: `passport`, `passport-jwt`, `@nestjs/passport`, `bcrypt`

26. **Database: Remover colunas obsoletas**
    - Criar migration `20250103002_remove_legacy_auth_columns.js`
    - Remover `password_hash`, `email_verification_token`, etc.
    - Tornar `auth_user_id` NOT NULL

27. **Environment Variables: Atualizar**
    - Remover `JWT_SECRET` de `.env.example`
    - Adicionar `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
    - Adicionar `SUPABASE_WEBHOOK_SECRET`
    - Adicionar `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (frontend)

28. **Supabase Dashboard: Configurar**
    - Configurar OAuth Google (Client ID + Secret)
    - Customizar templates de email (PT-BR)
    - Configurar redirect URLs (`FRONTEND_URL`, `FRONTEND_URL/auth/callback`)
    - Configurar webhook para backend (`API_BASE_URL/webhooks/supabase/auth`)

29. **Documentation: Atualizar CLAUDE.md**
    - Documentar nova arquitetura de auth (Supabase-first)
    - Atualizar seção de environment variables
    - Adicionar guia de configuração do Supabase dashboard

---

### Phase 8: Testing & Validation (ÚLTIMO)

**Justificativa:** Testes completos só fazem sentido após tudo implementado.

30. **Testes End-to-End:**
    - Signup via email/senha → confirmação de email → signin
    - Signup via OAuth Google → signin
    - Password recovery flow
    - Guards em rotas protegidas
    - Multi-tenancy (isolamento por accountId)
    - Super-admin elevation
    - Reconciliação (edge case de webhook falhado)
    - Resend confirmation email
    - Logout (limpa session)

31. **Testes de Segurança:**
    - Validar que tokens inválidos são rejeitados
    - Validar que webhooks com signature inválida são rejeitados
    - Validar que isolamento multi-tenant funciona (sem vazamento)
    - Validar que super-admin só é elevado para email configurado

---

## 7. Testing Strategy

### 7.1 Backend API

**Unit Tests:**

**`SupabaseService`:**
- ✅ `getUser()` retorna auth user quando token é válido
- ✅ `getUser()` lança exception quando token é inválido
- ✅ `verifyWebhookSignature()` retorna true para signature válida
- ✅ `verifyWebhookSignature()` retorna false para signature inválida
- ✅ `listUsers()` retorna lista de auth users (mock)

**`SupabaseAuthGuard`:**
- ✅ Guard permite acesso quando token é válido e User existe
- ✅ Guard bloqueia acesso quando token é inválido
- ✅ Guard bloqueia acesso quando User não existe no banco
- ✅ Guard eleva super-admin quando email === `SUPER_ADMIN_EMAIL`
- ✅ Guard injeta `req.user` com dados corretos

**`CompleteSignUpCommandHandler`:**
- ✅ Handler cria Account, Workspace, User atomicamente
- ✅ Handler publica `AccountCreatedEvent`
- ✅ Handler é idempotente (retry não cria duplicatas)
- ✅ Handler lança exception quando auth user não existe no Supabase

**Integration Tests:**

**Webhook Flow:**
- ✅ Webhook `user.created` cria Account/Workspace/User
- ✅ Webhook com signature inválida é rejeitado (400)
- ✅ Webhook com payload malformado é rejeitado (400)
- ✅ Webhook retenta em caso de falha (500)

**Auth Endpoints:**
- ✅ `GET /auth/me` retorna dados do User quando token é válido
- ✅ `GET /auth/me` retorna 401 quando token é inválido
- ✅ `POST /auth/resend-confirmation` reenvia email

### 7.2 Backend Workers

**Unit Tests:**

**`AuthReconciliationWorker`:**
- ✅ Worker detecta auth users sem User correspondente
- ✅ Worker dispara `SyncAuthUserCommand` corretamente
- ✅ Worker implementa backoff exponencial em caso de falha
- ✅ Worker marca como `failed` após 5 tentativas

**Integration Tests:**

**Reconciliation Flow:**
- ✅ Worker reconcilia auth user órfão com sucesso
- ✅ Worker retenta em caso de falha (transient error)
- ✅ Worker notifica admin após falhas persistentes

### 7.3 Frontend

**Unit Tests:**

**`useSupabaseAuth` hook:**
- ✅ `signUp()` chama Supabase SDK corretamente
- ✅ `signIn()` chama Supabase SDK e atualiza store
- ✅ `signInWithGoogle()` redireciona para OAuth
- ✅ `signOut()` limpa session local e Supabase
- ✅ `onAuthStateChange` sincroniza session com store

**`auth-store`:**
- ✅ `setSession()` armazena session corretamente
- ✅ `setAuth()` atualiza `user` e `isAuthenticated`
- ✅ `clearAuth()` limpa todos os dados de auth

**Integration Tests:**

**Signup Flow:**
- ✅ Signup via email/senha cria usuário no Supabase
- ✅ Signup via OAuth Google funciona
- ✅ Email de confirmação é enviado

**Signin Flow:**
- ✅ Signin via email/senha funciona
- ✅ Signin via OAuth Google funciona
- ✅ `GET /auth/me` é chamado após signin
- ✅ Store é atualizado com dados do User

**Password Recovery:**
- ✅ Formulário de reset envia email
- ✅ Formulário de update password funciona

### 7.4 End-to-End Tests

**Critical Flows:**
- ✅ Signup → confirmação de email → signin → dashboard (happy path)
- ✅ Signup OAuth Google → dashboard (happy path)
- ✅ Signin com credenciais inválidas → erro
- ✅ Signin com email não confirmado → erro
- ✅ Password recovery flow completo
- ✅ Guards protegem rotas (redirect para login se não autenticado)
- ✅ Multi-tenancy: usuários de diferentes Accounts não veem dados uns dos outros
- ✅ Super-admin elevation funciona

**Edge Cases:**
- ✅ Webhook falha → reconciliação detecta e corrige
- ✅ Token expirado → refresh automático
- ✅ Link de confirmação expirado → mensagem apropriada
- ✅ Email já cadastrado → mensagem apropriada

---

## 8. Attention Points

### 8.1 Performance

**Concerns:**

1. **Webhook Latency:**
   - Supabase webhooks podem ter latência variável (1-5 segundos)
   - Usuário pode tentar fazer signin antes de Account/Workspace/User serem criados
   - **Mitigation:** Frontend mostra loading state após signup, polling `GET /auth/me` até User existir

2. **Reconciliation Job:**
   - Listar todos os auth users pode ser lento em produção (milhares de usuários)
   - **Mitigation:** Implementar paginação na API de listagem, processar em batches

3. **Guard Overhead:**
   - `SupabaseAuthGuard` faz chamada ao Supabase em cada request protegido
   - **Mitigation:** Implementar cache de validação de tokens (Redis, TTL 5min)

**Strategies:**

- **Cache de tokens validados:** Redis com TTL de 5 minutos (reduz chamadas ao Supabase)
- **Batch processing:** Reconciliation job processa 100 auth users por vez
- **Polling inteligente:** Frontend faz polling com backoff exponencial (1s, 2s, 4s, 8s, stop)

### 8.2 Security

**Concerns:**

1. **Webhook Spoofing:**
   - Atacante pode tentar enviar webhook falso para criar contas
   - **Mitigation:** Validar signature HMAC com `SUPABASE_WEBHOOK_SECRET`

2. **Token Leakage:**
   - Access tokens armazenados em localStorage podem ser roubados via XSS
   - **Mitigation:** Implementar Content Security Policy (CSP), sanitizar inputs

3. **SUPABASE_SERVICE_ROLE_KEY Exposure:**
   - Service role key tem acesso admin ao Supabase, nunca expor no frontend
   - **Mitigation:** Apenas backend usa service role key, frontend usa anon key

4. **Multi-Tenancy Leakage:**
   - Bugs no guard podem permitir acesso cross-tenant
   - **Mitigation:** Testes de segurança automatizados, validar `accountId` em TODAS as queries

**Strategies:**

- **Webhook signature validation:** OBRIGATÓRIA em `SupabaseWebhookController`
- **Content Security Policy:** Configurar CSP headers no frontend
- **Environment variables:** Validar que `SUPABASE_SERVICE_ROLE_KEY` nunca vai para build do frontend
- **Automated security tests:** Testes que tentam acessar dados de outro Account (devem falhar)

### 8.3 Observability

**Logging Points:**

1. **Webhook Received:**
   - Log: `webhook.supabase.received` (type, authUserId, email)
   - Level: INFO

2. **Account/Workspace/User Created:**
   - Log: `auth.account_created` (accountId, userId, authUserId)
   - Level: INFO

3. **Guard Validation:**
   - Log: `auth.guard.validated` (userId, accountId) - apenas DEBUG
   - Level: DEBUG (evitar logs excessivos)

4. **Reconciliation:**
   - Log: `auth.reconciliation.started` (total auth users)
   - Log: `auth.reconciliation.user_orphaned` (authUserId)
   - Log: `auth.reconciliation.failed` (authUserId, attempt, error)
   - Level: WARN (falhas), INFO (sucesso)

5. **Errors:**
   - Log: `auth.webhook.invalid_signature` (ip, timestamp)
   - Log: `auth.account_creation.failed` (authUserId, error)
   - Level: ERROR

**Metrics:**

- **Webhook success rate:** % de webhooks processados com sucesso
- **Account creation latency:** Tempo entre webhook e criação de Account/Workspace/User
- **Reconciliation success rate:** % de auth users órfãos reconciliados
- **Guard validation latency:** Tempo de validação de token no guard

**Alerts:**

- **Webhook failure rate > 5%:** Notificar administradores (possível problema no Supabase)
- **Reconciliation retries > 3:** Notificar administradores (possível problema no banco)
- **Guard validation errors > 10/min:** Possível ataque, investigar

---

## 9. Integration Checklist

**API Contracts:**
- [ ] `POST /webhooks/supabase/auth` documentado e implementado
- [ ] `GET /auth/me` adaptado para Supabase tokens
- [ ] `POST /auth/resend-confirmation` adaptado para Supabase SDK
- [ ] Endpoints obsoletos removidos (`POST /auth/signin`, `POST /auth/signup`)

**Event Schemas:**
- [ ] `AccountCreatedEvent` adaptado com `authUserId` field
- [ ] `EmailConfirmedEvent` continua funcionando (via webhook)
- [ ] `ConfirmationEmailResentEvent` removido (Supabase SDK nativo)

**Command Payloads:**
- [ ] `CompleteSignUpCommand` definido (authUserId, email, fullName)
- [ ] `SyncAuthUserCommand` definido (authUserId)
- [ ] `SignUpCommand` removido (obsoleto)

**Error Handling:**
- [ ] Webhooks com signature inválida retornam 400
- [ ] Webhooks com payload malformado retornam 400
- [ ] Falhas ao criar Account/Workspace retornam 500 (Supabase retenta)
- [ ] `GET /auth/me` retorna 401 para tokens inválidos
- [ ] `GET /auth/me` retorna 404 se User não existe

**Timeouts and Retries:**
- [ ] Webhooks do Supabase têm timeout de 10s (configurado no dashboard)
- [ ] Supabase retenta webhooks 3 vezes (backoff exponencial)
- [ ] Reconciliation job retenta 5 vezes (backoff exponencial)

**Validations Aligned:**
- [ ] Email format validado pelo Supabase (RFC 5322)
- [ ] Senha mínima 8 caracteres (configurado no Supabase dashboard)
- [ ] Frontend e backend usam mesmos error messages (mapeados de inglês para PT-BR)

**Loading/Error States:**
- [ ] Frontend mostra loading durante signup/signin
- [ ] Frontend mostra erro amigável quando credenciais inválidas
- [ ] Frontend mostra mensagem quando email não verificado
- [ ] Frontend mostra loading durante password recovery
- [ ] Frontend mostra polling state após signup (aguardando criação de Account)

---

## 10. Rollback Strategy

**Scenario 1: Migração falha durante desenvolvimento**
- **Action:** Reverter migration via `npm run migrate:rollback`
- **Impact:** Coluna `auth_user_id` é removida, colunas antigas permanecem
- **Recovery:** Corrigir bugs, reexecutar migration

**Scenario 2: Migração em produção com problemas**
- **Challenge:** Não é possível voltar para Passport.js facilmente (passwords foram delegados ao Supabase)
- **Mitigation:** Testes extensivos em staging antes de merge para main
- **Recovery Plan:**
  - Se descoberto rapidamente (< 1 dia): Reverter deploy, investigar
  - Se descoberto tarde (> 1 dia): Corrigir bugs forward (não reverter)

**Scenario 3: Supabase fica indisponível**
- **Impact:** Autenticação para de funcionar completamente
- **Mitigation:** Monitorar uptime do Supabase, ter plano de comunicação com usuários
- **Recovery:** Aguardar Supabase voltar (SLA 99.9%)

---

## Summary

Este plano técnico detalha a migração completa do sistema de autenticação de Passport.js para Supabase Auth, preservando a arquitetura CQRS, multi-tenancy e padrões existentes do template FND.

**Principais Entregas:**
- Backend pronto para receber webhooks do Supabase e criar Account/Workspace/User atomicamente
- Frontend integrado com Supabase SDK para signup, signin, OAuth Google, password recovery
- Job de reconciliação para edge cases (auth users sem User correspondente)
- Guards customizados substituindo Passport
- Database migrado (novo campo `auth_user_id`, colunas antigas removidas)

**Ordem de Implementação:**
1. Database (migration)
2. Backend (Supabase integration + webhooks)
3. Backend (auth endpoints + guards)
4. Backend (reconciliation worker)
5. Frontend (Supabase client + hooks)
6. Frontend (auth pages)
7. Cleanup (remover código legado)
8. Testing (end-to-end validation)

**Next Step:** Use `/dev` command to start implementation following this plan.
