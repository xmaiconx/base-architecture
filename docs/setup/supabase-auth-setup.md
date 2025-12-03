# Configuracao do Supabase Auth

Este guia detalha como configurar a autenticacao do Supabase para o projeto FND EasyFlow Template.

## Indice

1. [Pre-requisitos](#pre-requisitos)
2. [Configuracao no Supabase Dashboard](#configuracao-no-supabase-dashboard)
3. [Configuracao do Projeto](#configuracao-do-projeto)
4. [Configuracao via Claude Code (MCP)](#configuracao-via-claude-code-mcp)
5. [Teste da Configuracao](#teste-da-configuracao)
6. [Troubleshooting](#troubleshooting)

---

## Pre-requisitos

- [ ] Conta no [Supabase](https://supabase.com)
- [ ] Projeto Supabase criado
- [ ] Node.js 18+ instalado
- [ ] Acesso ao Google Cloud Console (para OAuth com Google)

---

## Configuracao no Supabase Dashboard

### 1. Obter Credenciais do Projeto

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Va em **Settings > API**
4. Copie as seguintes credenciais:
   - **Project URL**: `https://[project-ref].supabase.co`
   - **anon public key**: Chave publica para o frontend
   - **service_role key**: Chave privada para o backend (NUNCA exponha no frontend!)

### 2. Habilitar Provedor de Email/Senha

1. Va em **Authentication > Providers**
2. Clique em **Email**
3. Configure:
   - [x] Enable Email provider
   - [x] Confirm email (recomendado para producao)
   - [ ] Secure email change (opcional)
   - [ ] Secure password change (opcional)
4. Clique em **Save**

### 3. Habilitar Google OAuth (Opcional)

#### 3.1 Configurar no Google Cloud Console

1. Acesse o [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto ou selecione um existente
3. Va em **APIs & Services > Credentials**
4. Clique em **Create Credentials > OAuth 2.0 Client IDs**
5. Configure:
   - **Application type**: Web application
   - **Name**: `FND EasyFlow - Supabase Auth`
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (dev)
     - `https://seu-dominio.com` (prod)
   - **Authorized redirect URIs**:
     - `https://[project-ref].supabase.co/auth/v1/callback`
6. Copie o **Client ID** e **Client Secret**

#### 3.2 Configurar no Supabase

1. Va em **Authentication > Providers**
2. Clique em **Google**
3. Ative o provider
4. Cole o **Client ID** e **Client Secret** do Google
5. Clique em **Save**

### 4. Configurar Database Webhook (IMPORTANTE)

O webhook e essencial para sincronizar usuarios do Supabase Auth com a tabela `users` da aplicacao.

1. Va em **Database > Webhooks** (ou **Integrations > Webhooks**)
2. Clique em **Create a new webhook**
3. Configure:
   - **Name**: `sync-auth-users`
   - **Table**: `auth.users`
   - **Events**: Marque apenas `INSERT`
   - **Type**: HTTP Request
   - **Method**: POST
   - **URL**: `https://[sua-api-url]/webhooks/supabase/auth`
     - Dev: `http://localhost:3001/webhooks/supabase/auth`
     - Prod: `https://api.seu-dominio.com/webhooks/supabase/auth`
   - **HTTP Headers**:
     ```
     Content-Type: application/json
     ```
4. Clique em **Create webhook**

#### 4.1 Configurar Webhook Secret (Seguranca)

Para ambientes de producao, configure um secret para validar a assinatura do webhook:

1. Gere um secret seguro:
   ```bash
   openssl rand -base64 32
   ```
2. No Supabase Dashboard, adicione o header:
   ```
   x-webhook-secret: [seu-secret-gerado]
   ```
3. Configure a variavel de ambiente `SUPABASE_WEBHOOK_SECRET` no backend

### 5. Configurar Templates de Email (Opcional)

1. Va em **Authentication > Email Templates**
2. Personalize os templates:
   - **Confirm signup**: Email de confirmacao de conta
   - **Magic Link**: Email para login sem senha
   - **Change Email Address**: Email para mudanca de email
   - **Reset Password**: Email para recuperacao de senha

#### Exemplo de Template - Confirm Signup

```html
<h2>Confirme seu email</h2>
<p>Ola!</p>
<p>Clique no link abaixo para confirmar seu email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar Email</a></p>
<p>Este link expira em 24 horas.</p>
```

### 6. Configurar URL de Redirect

1. Va em **Authentication > URL Configuration**
2. Configure:
   - **Site URL**: `http://localhost:3000` (dev) ou `https://seu-dominio.com` (prod)
   - **Redirect URLs**: Adicione todas as URLs permitidas:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/auth/update-password`
     - `https://seu-dominio.com/auth/callback`
     - `https://seu-dominio.com/auth/update-password`

---

## Configuracao do Projeto

### 1. Variaveis de Ambiente - Backend

Crie/edite o arquivo `.env` na raiz do projeto:

```env
# ===========================================
# SUPABASE AUTH (OBRIGATORIO)
# ===========================================

# URL do projeto Supabase
SUPABASE_URL=https://[project-ref].supabase.co

# Chave anonima (segura para frontend)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Chave de servico (APENAS BACKEND - nunca exponha!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Secret para validacao de webhooks (gere com: openssl rand -base64 32)
SUPABASE_WEBHOOK_SECRET=seu-webhook-secret-aqui

# ===========================================
# DATABASE
# ===========================================
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# ===========================================
# API
# ===========================================
API_PORT=3001
API_BASE_URL=http://localhost:3001

# ===========================================
# FRONTEND
# ===========================================
FRONTEND_URL=http://localhost:3000
```

### 2. Variaveis de Ambiente - Frontend

Crie/edite o arquivo `apps/frontend/.env`:

```env
# API Backend
VITE_API_URL=http://localhost:3001

# Supabase Auth (chaves publicas - seguras para frontend)
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Executar Migrations

```bash
# Na raiz do projeto
npm run migrate:latest
```

Isso criara as colunas necessarias na tabela `users`:
- `auth_user_id` - Referencia ao usuario no Supabase Auth

---

## Configuracao via Claude Code (MCP)

O Claude Code pode automatizar algumas configuracoes usando as ferramentas MCP do Supabase.

### O que o Agente PODE fazer automaticamente:

1. **Executar migrations SQL**
2. **Verificar tabelas existentes**
3. **Gerar tipos TypeScript**
4. **Obter URL e chave anonima do projeto**
5. **Verificar advisories de seguranca**
6. **Deploy de Edge Functions**

### O que o Agente NAO PODE fazer (requer Dashboard manual):

1. Habilitar provedores de autenticacao (Email, Google)
2. Criar Database Webhooks
3. Configurar templates de email
4. Configurar URLs de redirect
5. Configurar OAuth credentials

### Prompt Ideal para Configuracao via Agente

Copie e cole o prompt abaixo para que o agente configure automaticamente o que for possivel:

```
Configure a autenticacao Supabase para o projeto seguindo estes passos:

1. Execute a migration para adicionar a coluna auth_user_id na tabela users (se ainda nao existir)

2. Verifique se as tabelas necessarias existem (accounts, workspaces, workspace_users, users)

3. Gere os tipos TypeScript atualizados

4. Obtenha a URL e anon key do projeto para eu configurar no .env

5. Execute um check de seguranca (advisories) para verificar se ha problemas

6. Me informe quais configuracoes preciso fazer MANUALMENTE no Supabase Dashboard:
   - Provedores de autenticacao
   - Database Webhook para auth.users
   - Templates de email
   - URLs de redirect

Por favor, execute cada passo e me de um relatorio do que foi feito e o que preciso fazer manualmente.
```

### Exemplo de Execucao do Agente

O agente executara comandos como:

```typescript
// 1. Verificar tabelas existentes
mcp__supabase__list_tables({ schemas: ["public"] })

// 2. Aplicar migration (se necessario)
mcp__supabase__apply_migration({
  name: "add_auth_user_id_to_users",
  query: `
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);
    CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
  `
})

// 3. Gerar tipos TypeScript
mcp__supabase__generate_typescript_types()

// 4. Obter credenciais
mcp__supabase__get_project_url()
mcp__supabase__get_anon_key()

// 5. Verificar seguranca
mcp__supabase__get_advisors({ type: "security" })
```

---

## Teste da Configuracao

### 1. Verificar Backend

```bash
# Iniciar backend
npm run dev:api

# Verificar se a API esta respondendo
curl http://localhost:3001/health
```

### 2. Verificar Frontend

```bash
# Iniciar frontend
cd apps/frontend && npm run dev

# Acessar http://localhost:3000
```

### 3. Testar Fluxo de Autenticacao

#### 3.1 Cadastro (Sign Up)
1. Acesse `/signup`
2. Preencha nome, email e senha
3. Clique em "Criar conta"
4. Verifique o email de confirmacao (se habilitado)
5. Confirme o email clicando no link

#### 3.2 Login (Sign In)
1. Acesse `/login`
2. Preencha email e senha
3. Clique em "Entrar"
4. Deve redirecionar para `/dashboard`

#### 3.3 Login com Google (se configurado)
1. Acesse `/login`
2. Clique em "Entrar com Google"
3. Autorize no popup do Google
4. Deve redirecionar para `/dashboard`

#### 3.4 Recuperacao de Senha
1. Acesse `/login`
2. Clique em "Esqueceu sua senha?"
3. Informe o email
4. Verifique o email com o link de recuperacao
5. Clique no link e defina nova senha

### 4. Verificar Webhook

Apos o cadastro, verifique se o usuario foi criado na tabela `users`:

```sql
-- No Supabase Dashboard > SQL Editor
SELECT
  u.id,
  u.email,
  u.auth_user_id,
  u.account_id,
  u.created_at
FROM users u
ORDER BY created_at DESC
LIMIT 5;
```

### 5. Verificar Logs

```bash
# Logs do backend
npm run dev:api

# Procurar por:
# - "Processing user.created webhook"
# - "CompleteSignUp command executed successfully"
```

---

## Troubleshooting

### Erro: "Invalid webhook signature"

**Causa**: O secret do webhook nao confere.

**Solucao**:
1. Verifique se `SUPABASE_WEBHOOK_SECRET` esta configurado no backend
2. Verifique se o mesmo secret esta configurado no header do webhook no Supabase Dashboard
3. Para desenvolvimento, pode deixar o secret vazio (nao recomendado para producao)

### Erro: "User not found" apos login

**Causa**: O webhook nao criou o usuario na tabela `users`.

**Solucao**:
1. Verifique se o webhook esta configurado corretamente
2. Verifique os logs do backend para erros
3. Execute o AuthReconciliationWorker manualmente:
   ```bash
   # O worker roda automaticamente a cada 5 minutos
   # Ou espere a proxima execucao
   ```

### Erro: "Invalid or expired token"

**Causa**: O token JWT expirou ou e invalido.

**Solucao**:
1. Faca logout e login novamente
2. Verifique se `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estao corretos
3. Verifique se o relogio do servidor esta sincronizado

### Erro: "Email not confirmed"

**Causa**: O usuario nao confirmou o email.

**Solucao**:
1. Verifique a caixa de spam
2. Reenvie o email de confirmacao na pagina `/email-not-verified`
3. No Supabase Dashboard, pode confirmar manualmente em **Authentication > Users**

### Webhook nao dispara

**Causa**: Configuracao incorreta do webhook.

**Solucao**:
1. Verifique se o webhook esta ativo no Supabase Dashboard
2. Verifique se a URL do webhook esta acessivel (para dev, use ngrok ou similar)
3. Verifique os logs em **Database > Webhooks > [webhook] > Logs**

### Google OAuth nao funciona

**Causa**: Configuracao incorreta do OAuth.

**Solucao**:
1. Verifique se o **Client ID** e **Client Secret** estao corretos
2. Verifique se as **Redirect URIs** incluem a URL do Supabase
3. Verifique se o app OAuth esta em modo "Production" (nao "Testing")
4. Verifique se o dominio esta verificado no Google Console

---

## Checklist Final

- [ ] Supabase Dashboard
  - [ ] Provedor Email habilitado
  - [ ] Google OAuth configurado (opcional)
  - [ ] Database Webhook criado para `auth.users` INSERT
  - [ ] URLs de redirect configuradas
  - [ ] Templates de email personalizados (opcional)

- [ ] Backend (.env)
  - [ ] `SUPABASE_URL` configurado
  - [ ] `SUPABASE_ANON_KEY` configurado
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado
  - [ ] `SUPABASE_WEBHOOK_SECRET` configurado
  - [ ] `DATABASE_URL` configurado

- [ ] Frontend (.env)
  - [ ] `VITE_SUPABASE_URL` configurado
  - [ ] `VITE_SUPABASE_ANON_KEY` configurado
  - [ ] `VITE_API_URL` configurado

- [ ] Migrations
  - [ ] `npm run migrate:latest` executado com sucesso

- [ ] Testes
  - [ ] Sign up funcionando
  - [ ] Sign in funcionando
  - [ ] Google OAuth funcionando (se configurado)
  - [ ] Password reset funcionando
  - [ ] Webhook criando usuarios na tabela `users`

---

## Links Uteis

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Database Webhooks](https://supabase.com/docs/guides/database/webhooks)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

---

## Informacoes do Projeto Atual

**Project URL**: `https://ogkmccnebhhtwidwxmhp.supabase.co`

**Anon Key**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9na21jY25lYmhodHdpZHd4bWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTg4MzIsImV4cCI6MjA4MDI5NDgzMn0.VirgnkvBybTZtPdzw8qzmZyr6WrSr395ef_BsXYVk94
```

> **Nota**: A `service_role_key` deve ser obtida no Supabase Dashboard em **Settings > API** e NUNCA deve ser compartilhada ou commitada no repositorio.
