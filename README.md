# FND EasyFlow Template

> **Template base para alunos da Fábrica de Negócios Digitais (FND)** construírem seus SaaS utilizando IA.

## 🎯 Sobre o FND EasyFlow

O **FND EasyFlow** é um template pronto para produção que permite aos alunos da FND iniciarem o desenvolvimento de seus SaaS com uma base sólida e bem arquitetada.

**A grande promessa do FND**: Pare de tentar construir tijolo por tijolo. Entre na Fábrica, use nossas máquinas (EasyFlow + SalesFlow) e tenha não só o produto pronto, mas a máquina de vendas construída.

Este template inclui:
- ✅ Arquitetura limpa (Clean Architecture + CQRS)
- ✅ Multi-tenancy completo (workspaces)
- ✅ Autenticação via Supabase
- ✅ Sistema de billing com Stripe
- ✅ Processamento assíncrono com BullMQ + Redis
- ✅ Webhooks para integrações externas
- ✅ Workers híbridos (API + Background jobs)
- ✅ Logs de auditoria

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+ e npm 9+
- Docker & Docker Compose (para ambiente local)
- PostgreSQL 15+ (ou Supabase)
- Redis 7+ (incluído no docker-compose)
- Conta Supabase (para autenticação)
- Conta Stripe (para billing)
- Conta Resend (para emails)

### Instalação

1. **Clone o repositório:**
```bash
git clone https://github.com/seu-usuario/fnd-easyflow-template.git
cd fnd-easyflow-template
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Inicie o ambiente Docker:**
```bash
cd infra
docker-compose up -d
cd ..
```

Isso inicia:
- PostgreSQL (porta 5432)
- Redis (porta 6379)
- PgAdmin (porta 5050)
- Redis Insight (porta 8001)

4. **Configure as variáveis de ambiente:**

Copie o `.env.example` e configure:
```bash
cp apps/backend/.env.example apps/backend/.env
```

Variáveis principais:
```bash
# Database (Docker local ou Supabase)
DATABASE_URL=postgresql://fnd_user:fnd_pass@localhost:5432/fnd_easyflow

# Redis (Docker local ou Railway)
REDIS_URL=redis://localhost:6379

# Node Mode
NODE_MODE=hybrid  # api | workers | hybrid

# Supabase Auth
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
SUPABASE_WEBHOOK_SECRET=your-webhook-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# API
API_PORT=3001
API_BASE_URL=http://localhost:3001

# Encryption
ENCRYPTION_KEY=your-32-byte-hex-key

# Email
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@domain.com

# Frontend
FRONTEND_URL=http://localhost:3000
```

5. **Execute as migrações do banco:**
```bash
npm run migrate:latest
```

6. **Inicie o ambiente de desenvolvimento:**
```bash
# Inicia API + Frontend em paralelo
npm run dev

# OU inicie separadamente:
npm run dev:api      # Backend em modo hybrid (API + Workers)
cd apps/frontend && npm run dev  # Frontend apenas
```

7. **Acesse as ferramentas:**
- Frontend: http://localhost:3000
- API: http://localhost:3001
- PgAdmin: http://localhost:5050 (admin@fnd.com / admin)
- Redis Insight: http://localhost:8001

## 📦 Stack Tecnológica

### Backend
- **NestJS 10** - Framework Node.js com dependency injection
- **PostgreSQL 15** - Banco de dados relacional (Supabase)
- **Kysely** - Query builder type-safe
- **BullMQ + Redis 7** - Job queue e cache para async jobs
- **Supabase** - Autenticação e gerenciamento de usuários
- **Stripe** - Pagamentos e assinaturas
- **Winston** - Logging estruturado
- **Railway** - Deploy Docker (backend)
- **Cloudflare Pages** - Deploy estático (frontend)

### Frontend
- **React 18** - Biblioteca UI
- **Vite** - Build tool moderna e rápida
- **TypeScript** - Type safety
- **Shadcn/ui** - Componentes UI
- **Tailwind CSS** - Utility-first CSS
- **Zustand** - State management
- **TanStack Query** - Data fetching e cache
- **React Hook Form + Zod** - Formulários e validação

### Infraestrutura
- **Turbo** - Build system para monorepo
- **Docker Compose** - Orquestração de serviços locais (PostgreSQL, Redis, PgAdmin, Redis Insight)
- **Railway** - Deploy backend (Docker)
- **Cloudflare Pages** - Deploy frontend (static)

## 📂 Estrutura do Projeto

```
fnd-easyflow-template/
├── apps/
│   ├── backend/       # API NestJS (API + Workers híbrido)
│   └── frontend/      # React App
├── libs/
│   ├── domain/        # Entidades e regras de negócio
│   ├── backend/       # Interfaces de serviços
│   └── app-database/  # Repositórios e migrations
├── infra/
│   └── docker-compose.yml  # Ambiente local (PostgreSQL, Redis, etc.)
├── docs/              # Documentação do projeto
└── .claude/           # Skills e comandos para Claude Code
```

## 🛠️ Comandos Principais

```bash
# Desenvolvimento
npm run dev              # API + Frontend
npm run dev:api          # Apenas API (local development)

# Build
npm run build            # Build de todos os packages
npm run typecheck        # Verificar tipos TypeScript

# Database
npm run migrate:latest   # Rodar migrations
npm run migrate:rollback # Reverter última migration
npm run seed:run         # Popular banco com dados

# Limpeza
npm run clean            # Remove dist/ e cache

# Deploy
git push origin main     # Railway auto-deploy (backend)
                         # Cloudflare Pages auto-deploy (frontend)
```

## 📖 Documentação Completa

Para detalhes técnicos completos sobre arquitetura, padrões e convenções, consulte:

- **[CLAUDE.md](./CLAUDE.md)** - Guia técnico completo (para desenvolvedores e agentes IA)
- **[docs/features/](./docs/features/)** - Documentação de features implementadas

## 🎓 Próximos Passos

1. **Customize o projeto:**
   - Altere o nome do projeto nos `package.json`
   - Configure suas credenciais de serviços (Supabase, Stripe, Resend)
   - Adapte o esquema do banco para seu domínio

2. **Desenvolva novas features:**
   - Use o workflow FND: `/feature` → `/plan` → `/dev` → `/review` → `/done`
   - Siga os padrões de Clean Architecture e CQRS
   - Documente suas features em `docs/features/`

3. **Deploy:**
   - Veja seção "Deploy" abaixo

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente (ver seção abaixo)
3. Deploy automático via git push

### Variáveis de Ambiente

**Obrigatórias:**
- `DATABASE_URL` - Supabase PostgreSQL
- `SUPABASE_URL` - Supabase API
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `QSTASH_TOKEN` - Upstash QStash
- `QSTASH_CURRENT_SIGNING_KEY`
- `QSTASH_NEXT_SIGNING_KEY`
- `RESEND_API_KEY` - Resend
- `STRIPE_SECRET_KEY` - Stripe
- `STRIPE_WEBHOOK_SECRET`
- `ENCRYPTION_KEY` - 32-byte hex key para AES-256-GCM

**Opcionais:**
- `VERCEL_URL` - Auto-set by Vercel
- `FRONTEND_URL` - URL do frontend em produção
- `LOG_LEVEL` - Log level (error, warn, info, debug)

## 🤝 Suporte

Este template faz parte do ecossistema **Fábrica de Negócios Digitais (FND)**. Para suporte:

- Consulte a documentação interna do FND
- Abra issues no repositório
- Entre em contato com o time FND

## 📄 Licença

Este projeto é propriedade da Fábrica de Negócios Digitais e destinado exclusivamente para uso de seus alunos.

---

**Desenvolvido com ❤️ pela Fábrica de Negócios Digitais**
