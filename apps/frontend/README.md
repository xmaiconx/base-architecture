# FND EasyFlow Frontend

Frontend React para o template FND EasyFlow.

## 🚀 Stack Tecnológica

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: Shadcn/ui + Tailwind CSS
- **State Management**: Zustand (client) + TanStack Query (server)
- **Forms**: React Hook Form + Zod
- **Routing**: React Router
- **HTTP Client**: Axios

## 📦 Desenvolvimento

### Pré-requisitos

- Node.js 16+
- npm 9+

### Instalação

```bash
# Do diretório raiz do monorepo
npm install

# Ou apenas para o frontend
cd apps/frontend
npm install
```

### Configuração

1. Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

2. Configure as variáveis de ambiente:
```env
VITE_API_URL=http://localhost:3001
NODE_ENV=development
```

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Preview do build
npm run preview

# Typecheck
npm run typecheck

# Lint
npm run lint
```

## 🏗️ Estrutura de Arquivos

```
src/
├── components/
│   ├── ui/           # Componentes Shadcn/ui
│   ├── forms/        # Componentes de formulário
│   ├── layout/       # Componentes de layout
│   └── auth/         # Componentes de autenticação
├── pages/            # Páginas da aplicação
├── hooks/            # Custom hooks
├── stores/           # Stores Zustand
├── lib/              # Utilitários e configurações
├── types/            # Tipos TypeScript
└── contexts/         # React Contexts
```

## 🔐 Autenticação

O sistema de autenticação inclui:

- **Login/Signup**: Formulários com validação Zod
- **Tokens JWT**: Armazenados no localStorage via Zustand persist
- **Rotas protegidas**: Redirecionamento automático
- **Auto-refresh**: Verificação automática do token via TanStack Query

## 📱 Mobile-First

- **Responsive design**: Tailwind CSS breakpoints
- **Modals**: Fullscreen no mobile, popup no desktop
- **Navigation**: Sidebar colapsível + drawer mobile

## 🎨 Componentes UI

Baseados no Shadcn/ui com customizações:

- **Button**: Variantes e loading states
- **Input**: Integração com React Hook Form
- **Card**: Layout consistente
- **FormField**: Wrapper com validação

## 🔧 Integração API

Configurada via Axios com interceptors:

- **Base URL**: Configurável por ambiente
- **Auth headers**: Automático via token
- **Error handling**: Interceptors globais
- **Types**: Espelhados do backend em types/api/ (frontend 100% desacoplado)