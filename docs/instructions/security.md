# Security Validation Checklist

> **Referência obrigatória** para validação de segurança durante code review (`/review`) e auditorias proativas (`/security`).

---

## Quick Reference

| # | Categoria | Severidade | Verificação Principal |
|---|-----------|------------|----------------------|
| 1 | Injection | 🔴 Critical | Queries parametrizadas, inputs validados |
| 2 | Broken Authentication | 🔴 Critical | JWT validado, sessions seguras |
| 3 | Sensitive Data Exposure | 🔴 Critical | Dados criptografados, logs limpos |
| 4 | Broken Access Control | 🔴 Critical | Filtro account_id, ownership validado |
| 5 | Security Misconfiguration | 🟠 High | Env vars seguras, CORS restrito |
| 6 | XSS | 🟠 High | Outputs sanitizados, CSP headers |
| 7 | Insecure Dependencies | 🟠 High | Dependências atualizadas, sem CVEs |
| 8 | Insufficient Logging | 🟡 Medium | Audit trail, sem dados sensíveis |
| 9 | SSRF | 🟠 High | URLs validadas, whitelist de hosts |
| 10 | Mass Assignment | 🟡 Medium | DTOs explícitos, sem spread de objetos |

---

## 1. Injection (SQL, NoSQL, Command)

**Severidade:** 🔴 Critical

### O que verificar
- [ ] Queries SQL usam prepared statements (Kysely parametrizado)
- [ ] Inputs de usuário NUNCA concatenados em queries
- [ ] Validação de inputs via `class-validator` decorators
- [ ] Comandos shell não usam input de usuário diretamente

### Exemplo de Violação
```typescript
// ❌ ERRADO - SQL Injection vulnerável
const users = await db.raw(`SELECT * FROM users WHERE email = '${email}'`);

// ❌ ERRADO - Command Injection
exec(`ls ${userInput}`);
```

### Como Corrigir
```typescript
// ✅ CORRETO - Kysely parametrizado
const users = await db
  .selectFrom('users')
  .where('email', '=', email)
  .execute();

// ✅ CORRETO - Validação prévia + whitelist
if (!allowedCommands.includes(command)) throw new BadRequestException();
```

---

## 2. Broken Authentication

**Severidade:** 🔴 Critical

### O que verificar
- [ ] JWT validado via Supabase Auth em TODAS as rotas protegidas
- [ ] Guards de autenticação aplicados (`@UseGuards(JwtAuthGuard)`)
- [ ] Tokens não expostos em logs ou responses
- [ ] Refresh tokens com rotação adequada
- [ ] Rate limiting em endpoints de auth (login, signup, password reset)

### Exemplo de Violação
```typescript
// ❌ ERRADO - Endpoint sem guard
@Get('profile')
getProfile() { ... }

// ❌ ERRADO - Token em log
logger.info('User logged in', { token: jwt });
```

### Como Corrigir
```typescript
// ✅ CORRETO - Guard aplicado
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile() { ... }

// ✅ CORRETO - Apenas userId em log
logger.info('User logged in', { userId: user.id });
```

---

## 3. Sensitive Data Exposure

**Severidade:** 🔴 Critical

### O que verificar
- [ ] Credenciais criptografadas via `IEncryptionService` (AES-256-GCM)
- [ ] Senhas NUNCA armazenadas em plain text
- [ ] API keys e secrets em environment variables, não no código
- [ ] Responses não vazam dados sensíveis (passwords, tokens, keys)
- [ ] Logs não contêm dados sensíveis

### Dados que NUNCA devem aparecer em logs
- Senhas (plain ou hashed)
- Tokens JWT completos
- API keys
- Números de cartão de crédito
- CPF/SSN completos
- Chaves de criptografia

### Exemplo de Violação
```typescript
// ❌ ERRADO - Credencial em plain text
const apiKey = 'sk_live_abc123';

// ❌ ERRADO - Dados sensíveis no response
return { user, password: user.password };

// ❌ ERRADO - Log com dados sensíveis
logger.debug('Payment data', { cardNumber, cvv });
```

### Como Corrigir
```typescript
// ✅ CORRETO - Credencial criptografada
const encryptedKey = this.encryptionService.encrypt(apiKey);

// ✅ CORRETO - Omitir dados sensíveis
const { password, ...safeUser } = user;
return { user: safeUser };

// ✅ CORRETO - Mascarar dados sensíveis
logger.debug('Payment processed', {
  cardLast4: cardNumber.slice(-4),
  userId
});
```

---

## 4. Broken Access Control (Multi-Tenancy)

**Severidade:** 🔴 Critical

### O que verificar
- [ ] TODAS as queries filtram por `account_id`
- [ ] Controllers validam ownership antes de operações
- [ ] Não há vazamento de dados entre tenants
- [ ] `account_id` extraído do JWT, NUNCA do request body
- [ ] Guards verificam permissões de role (admin, user, etc.)

### Exemplo de Violação
```typescript
// ❌ ERRADO - Query sem filtro de tenant
const workspaces = await this.workspaceRepo.findAll();

// ❌ ERRADO - account_id do body (manipulável)
async create(@Body() dto: CreateDto) {
  return this.service.create(dto.accountId, dto);
}

// ❌ ERRADO - Acesso direto por ID sem validar ownership
async getById(id: string) {
  return this.repo.findById(id); // Qualquer tenant pode acessar!
}
```

### Como Corrigir
```typescript
// ✅ CORRETO - Filtro por tenant obrigatório
const workspaces = await this.workspaceRepo.findByAccountId(accountId);

// ✅ CORRETO - account_id do JWT
async create(@CurrentUser() user: AuthUser, @Body() dto: CreateDto) {
  return this.service.create(user.accountId, dto);
}

// ✅ CORRETO - Validar ownership
async getById(accountId: string, id: string) {
  const entity = await this.repo.findById(id);
  if (entity.accountId !== accountId) throw new ForbiddenException();
  return entity;
}
```

---

## 5. Security Misconfiguration

**Severidade:** 🟠 High

### O que verificar
- [ ] CORS configurado com origins específicos (não `*` em produção)
- [ ] Headers de segurança configurados (Helmet)
- [ ] Debug/stack traces desabilitados em produção
- [ ] Portas e serviços desnecessários fechados
- [ ] Arquivos `.env` no `.gitignore`

### Environment Variables Sensíveis
```
DATABASE_URL          # Credenciais do banco
SUPABASE_SECRET_KEY   # NUNCA expor no frontend
ENCRYPTION_KEY        # Chave de criptografia
STRIPE_SECRET_KEY     # API key do Stripe
RESEND_API_KEY        # API key de email
REDIS_URL             # Se tiver senha
```

### Exemplo de Violação
```typescript
// ❌ ERRADO - CORS aberto
app.enableCors({ origin: '*' });

// ❌ ERRADO - Stack trace em produção
app.useGlobalFilters(new AllExceptionsFilter({ exposeStack: true }));

// ❌ ERRADO - Secret no código
const stripeKey = 'sk_live_xxx';
```

### Como Corrigir
```typescript
// ✅ CORRETO - CORS restrito
app.enableCors({
  origin: [config.getFrontendUrl()],
  credentials: true
});

// ✅ CORRETO - Sem stack trace em produção
app.useGlobalFilters(new AllExceptionsFilter({
  exposeStack: config.isDevelopment()
}));

// ✅ CORRETO - Secret via env
const stripeKey = this.config.getStripeSecretKey();
```

---

## 6. XSS (Cross-Site Scripting)

**Severidade:** 🟠 High

### O que verificar
- [ ] Outputs sanitizados antes de renderizar no frontend
- [ ] `dangerouslySetInnerHTML` usado apenas com sanitização
- [ ] CSP headers configurados
- [ ] Inputs de usuário escapados em templates
- [ ] URLs validadas antes de usar em `href` ou `src`

### Exemplo de Violação
```tsx
// ❌ ERRADO - HTML não sanitizado
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ❌ ERRADO - URL não validada
<a href={userProvidedUrl}>Link</a>

// ❌ ERRADO - Interpolação direta
<script>var data = '{userInput}';</script>
```

### Como Corrigir
```tsx
// ✅ CORRETO - Sanitizar HTML
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />

// ✅ CORRETO - Validar URL
const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch { return false; }
};

// ✅ CORRETO - Usar textContent ou React escaping
<span>{userInput}</span> // React escapa automaticamente
```

---

## 7. Insecure Dependencies

**Severidade:** 🟠 High

### O que verificar
- [ ] `npm audit` sem vulnerabilidades high/critical
- [ ] Dependências atualizadas regularmente
- [ ] Lockfile (`package-lock.json`) commitado
- [ ] Não usar pacotes abandonados ou sem manutenção

### Comandos de Verificação
```bash
# Verificar vulnerabilidades
npm audit

# Atualizar dependências (minor/patch)
npm update

# Verificar pacotes desatualizados
npm outdated
```

---

## 8. Insufficient Logging & Monitoring

**Severidade:** 🟡 Medium

### O que verificar
- [ ] Audit logs para ações sensíveis (login, password change, data access)
- [ ] Logs estruturados com contexto (userId, accountId, operation)
- [ ] Logs NÃO contêm dados sensíveis (ver seção 3)
- [ ] Erros logados com stack trace (apenas em ambiente seguro)
- [ ] Alertas configurados para eventos suspeitos

### Ações que DEVEM ter Audit Log
- Login/Logout
- Mudança de senha
- Criação/exclusão de usuários
- Alterações de permissões
- Acesso a dados sensíveis
- Operações financeiras
- Alterações de configuração

### Exemplo
```typescript
// ✅ CORRETO - Audit log estruturado
await this.auditService.log({
  action: 'user.password.changed',
  accountId: user.accountId,
  userId: user.id,
  metadata: {
    ip: request.ip,
    userAgent: request.headers['user-agent']
  }
});
```

---

## 9. SSRF (Server-Side Request Forgery)

**Severidade:** 🟠 High

### O que verificar
- [ ] URLs fornecidas por usuários validadas contra whitelist
- [ ] Não permitir IPs internos (127.0.0.1, 10.x.x.x, 192.168.x.x)
- [ ] Não permitir protocolos perigosos (file://, gopher://)
- [ ] Timeouts configurados em requests externos

### Exemplo de Violação
```typescript
// ❌ ERRADO - URL do usuário sem validação
const response = await fetch(userProvidedUrl);

// ❌ ERRADO - Permite IPs internos
const data = await axios.get(webhookUrl); // Pode ser http://localhost:6379
```

### Como Corrigir
```typescript
// ✅ CORRETO - Validar URL
const validateUrl = (url: string): boolean => {
  const parsed = new URL(url);
  const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0'];
  const blockedPatterns = [/^10\./, /^192\.168\./, /^172\.(1[6-9]|2|3[01])\./];

  if (blockedHosts.includes(parsed.hostname)) return false;
  if (blockedPatterns.some(p => p.test(parsed.hostname))) return false;
  if (!['http:', 'https:'].includes(parsed.protocol)) return false;

  return true;
};
```

---

## 10. Mass Assignment

**Severidade:** 🟡 Medium

### O que verificar
- [ ] DTOs com campos explícitos (não usar `Partial<Entity>`)
- [ ] Não fazer spread direto de body em entities
- [ ] Campos sensíveis (role, accountId) não vêm do request
- [ ] Usar `class-transformer` com `@Exclude()` para campos internos

### Exemplo de Violação
```typescript
// ❌ ERRADO - Spread direto permite injetar qualquer campo
async create(@Body() body: any) {
  return this.repo.create({ ...body }); // Usuário pode injetar role: 'admin'
}

// ❌ ERRADO - DTO muito permissivo
class CreateUserDto extends PartialType(User) {} // Expõe todos os campos
```

### Como Corrigir
```typescript
// ✅ CORRETO - DTO com campos explícitos
class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  // role NÃO está aqui - definido internamente
}

// ✅ CORRETO - Campos internos definidos no service
async create(dto: CreateUserDto, accountId: string) {
  return this.repo.create({
    ...dto,
    accountId,           // Do JWT, não do request
    role: UserRole.USER, // Valor padrão seguro
  });
}
```

---

## Severidades

| Nível | Ícone | Significado | Ação |
|-------|-------|-------------|------|
| Critical | 🔴 | Exploração imediata possível | BLOQUEIA merge, corrigir AGORA |
| High | 🟠 | Vulnerabilidade séria | Corrigir antes do merge |
| Medium | 🟡 | Risco moderado | Corrigir no próximo sprint |
| Low | 🟢 | Risco baixo | Backlog de melhorias |

---

## Checklist Rápido para Code Review

```markdown
## Security Checklist

### Injection
- [ ] Queries parametrizadas (sem concatenação)
- [ ] Inputs validados com class-validator

### Authentication
- [ ] Guards aplicados em rotas protegidas
- [ ] Tokens não expostos em logs/responses

### Data Exposure
- [ ] Credenciais via IEncryptionService
- [ ] Logs sem dados sensíveis

### Access Control
- [ ] Queries filtram por account_id
- [ ] Ownership validado antes de operações
- [ ] account_id do JWT (não do body)

### Configuration
- [ ] CORS restrito
- [ ] Secrets via environment variables

### XSS
- [ ] Outputs sanitizados
- [ ] URLs validadas

### Dependencies
- [ ] npm audit sem critical/high
```
