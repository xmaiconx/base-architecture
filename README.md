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
- ✅ Pipeline de mensagens com IA
- ✅ Webhooks para integrações externas
- ✅ Workers assíncronos com BullMQ
- ✅ Logs de auditoria

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+ e npm 9+
- PostgreSQL 15+ (ou Supabase)
- Redis 7+
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

3. **Configure as variáveis de ambiente:**

Crie um arquivo `.env` na raiz do projeto:
```bash
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:port/db

# Supabase Auth
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
SUPABASE_WEBHOOK_SECRET=your-webhook-secret

# Redis
REDIS_JOBS_URL=redis://localhost:6379

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

# Feature Flags
FEATURES_WORKSPACE_ENABLED=true
FEATURES_WORKSPACE_SWITCHING_ENABLED=true
```

4. **Execute as migrações do banco:**
```bash
npm run migrate:latest
```

5. **Inicie o ambiente de desenvolvimento:**
```bash
# Inicia API + Frontend em paralelo
npm run dev

# OU inicie separadamente:
npm run dev:api      # Backend API apenas
npm run dev:workers  # Workers apenas
cd apps/frontend && npm run dev  # Frontend apenas
```

6. **Acesse a aplicação:**
- Frontend: http://localhost:3000
- API: http://localhost:3001

## 📦 Stack Tecnológica

### Backend
- **NestJS 10** - Framework Node.js com dependency injection
- **PostgreSQL 15** - Banco de dados relacional
- **Kysely** - Query builder type-safe
- **BullMQ** - Filas de jobs com Redis
- **Supabase** - Autenticação e gerenciamento de usuários
- **Stripe** - Pagamentos e assinaturas
- **Winston** - Logging estruturado

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
- **Docker Compose** - Orquestração de serviços locais
- **Redis** - Cache e message broker
- **CloudBeaver** - GUI para banco de dados

## 📂 Estrutura do Projeto

```
fnd-easyflow-template/
├── apps/
│   ├── backend/       # API NestJS + Workers
│   └── frontend/      # React App
├── libs/
│   ├── domain/        # Entidades e regras de negócio
│   ├── backend/       # Interfaces de serviços
│   └── app-database/  # Repositórios e migrations
├── docs/              # Documentação do projeto
└── .claude/           # Skills e comandos para Claude Code
```

## 🛠️ Comandos Principais

```bash
# Desenvolvimento
npm run dev              # API + Frontend
npm run dev:api          # Apenas API
npm run dev:workers      # Apenas workers

# Build
npm run build            # Build de todos os packages
npm run typecheck        # Verificar tipos TypeScript

# Database
npm run migrate:latest   # Rodar migrations
npm run migrate:rollback # Reverter última migration
npm run seed:run         # Popular banco com dados

# Limpeza
npm run clean            # Remove dist/ e cache
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
   - Configure CI/CD
   - Deploy do backend (Render, Railway, AWS, etc.)
   - Deploy do frontend (Vercel, Netlify, etc.)
   - Configure banco em produção (Supabase)

## 🤝 Suporte

Este template faz parte do ecossistema **Fábrica de Negócios Digitais (FND)**. Para suporte:

- Consulte a documentação interna do FND
- Abra issues no repositório
- Entre em contato com o time FND

## 📄 Licença

Este projeto é propriedade da Fábrica de Negócios Digitais e destinado exclusivamente para uso de seus alunos.

---

**Desenvolvido com ❤️ pela Fábrica de Negócios Digitais**
