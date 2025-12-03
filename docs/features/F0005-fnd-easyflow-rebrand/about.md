# Task: FND EasyFlow Template Rebrand

**Branch:** refactor/F0005-fnd-easyflow-rebrand
**Date:** 2025-12-03

## Objective

Transformar o template atual (originalmente "agentics" - sistema de consultório) em **FND EasyFlow Template**, um template base genérico e bem documentado para alunos da **Fábrica de Negócios Digitais (FND)** utilizarem como fundação para construir seus SaaS utilizando IA.

Este refactoring envolve rebrand completo de nomes de packages, imports, documentação e descrições do projeto, mantendo 100% da arquitetura técnica e features existentes. O objetivo é remover qualquer contexto específico do projeto anterior (consultório médico, "agentics", "tinyce", "rugido digital") e estabelecer identidade genérica alinhada com a proposta de valor da FND: transformar alunos em "Tech Owners" através de templates prontos, agentes de IA e metodologia de negócios.

A grande promessa do FND é: **"Pare de tentar construir tijolo por tijolo. Entre na Fábrica, use nossas máquinas (EasyFlow + SalesFlow) e tenha não só o produto pronto, mas a máquina de vendas construída."**

## Business Context

**Por que esta funcionalidade é necessária:**

O template atual possui identidade de projeto específico ("agentics", "tinyce") que não reflete seu propósito real: ser um template educacional genérico para alunos FND. Isso causa confusão, dificulta onboarding e não comunica claramente a proposta de valor do ecossistema FND.

**Qual problema resolve:**

- **Confusão de identidade**: Nomes legados (agentics, tinyce) não comunicam propósito educacional
- **Documentação desalinhada**: CLAUDE.md está correto arquiteturalmente mas package names estão desatualizados
- **Barreira de entrada**: Alunos não entendem imediatamente que este é um template para eles usarem
- **Falta de clareza**: Não há distinção clara entre documentação para humanos (README) e agentes IA (CLAUDE.md)

**Quem são os stakeholders:**

- **Alunos FND**: Usuários primários do template (precisam de README claro)
- **Agentes IA (Claude Code)**: Consumidores do CLAUDE.md (precisam de instruções arquiteturais precisas)
- **Criador do FND**: Precisa de template alinhado com branding e proposta de valor do ecossistema

## Scope

### O que ESTÁ incluído

- **Renomear todos os packages**: `@agentics/*` → `@fnd/*`
  - `@agentics/domain` → `@fnd/domain`
  - `@agentics/backend` → `@fnd/backend`
  - `@agentics/database` → `@fnd/database`
  - `@agentics/frontend` → `@fnd/frontend`
  - `@agentics/api` → `@fnd/api` (apps/backend)

- **Atualizar todos os imports TypeScript** (~100+ arquivos):
  - `apps/backend/src/**/*.ts`
  - `apps/frontend/src/**/*.ts`
  - `libs/*/src/**/*.ts`

- **Atualizar package.json files** (6 principais):
  - Root: Renomear de "tinyce" para "fnd-easyflow-template", atualizar descrição
  - apps/backend: Atualizar name, description, dependencies
  - apps/frontend: Atualizar name, description
  - libs/domain: Renomear package
  - libs/backend: Renomear package e dependencies
  - libs/app-database: Renomear package e dependencies

- **Atualizar tsconfig.json project references**:
  - Root tsconfig.json
  - apps/backend/tsconfig.json
  - apps/frontend/tsconfig.json

- **Atualizar CLAUDE.md**:
  - Substituir todas as referências `@agentics` por `@fnd`
  - Manter TODA a estrutura e conteúdo arquitetural existente
  - Aplicar regras da skill `updating-claude-documentation` (brevidade, sem emojis, sem código extenso)
  - Garantir que permanece como documentação para agentes IA (não para humanos)

- **Criar README.md** (atualmente não existe):
  - Documentação orientada a humanos (alunos FND)
  - Descrição clara do FND EasyFlow e propósito educacional
  - Stack tecnológica resumida
  - Quick start guide
  - Link para CLAUDE.md para detalhes arquiteturais

- **Remover contextos legados**:
  - Qualquer menção a "agentics" (exceto em commits git - histórico preservado)
  - Referências a "tinyce", "rugido digital", "consultório", "terapeutas"
  - Descrições específicas de domínio médico/clínico

- **Build e validação**:
  - Garantir que `npm run build` passa sem erros
  - Verificar imports estão corretos
  - Testar que aplicação inicia (api + frontend)

### O que NÃO está incluído (out of scope)

- **Mudanças arquiteturais**: Arquitetura permanece 100% inalterada
- **Mudanças em features**: Todas as features existentes (auth, workspace, audit, webhooks, billing) são mantidas
- **Mudanças no database schema**: Tabelas e migrations permanecem iguais
- **Mudanças em Docker services**: docker-compose.yml permanece igual
- **Mudanças em .env**: Variáveis de ambiente mantidas (apenas adicionar comentários se necessário)
- **Limpeza de branches git**: Branches antigas mantidas
- **Criação de tutoriais/exemplos**: Focar apenas no rebrand, tutoriais são fase futura
- **Tradução de código/comentários**: Manter inglês em código técnico
- **Refatoração de código**: Zero mudanças em lógica de negócio

## Business Rules

### Validações

1. **Package Name Consistency**: Todos os packages devem usar prefixo `@fnd/` consistentemente
2. **Import Resolution**: Nenhum import quebrado após renomeação (verificar com TypeScript compiler)
3. **Build Success**: `npm run build` deve passar sem erros TypeScript
4. **Git History Preservation**: Manter todo histórico de commits (não squash, não rebase)
5. **Documentation Separation**: README.md (humanos) e CLAUDE.md (agentes IA) com propósitos distintos

### Flows

#### 1. Main Flow (Happy Path)

**Fase 1 - Análise e Mapeamento:**
- Passo 1: Mapear TODOS os arquivos com referências a `@agentics` (Grep completo)
- Passo 2: Listar todos os package.json e tsconfig.json do projeto
- Passo 3: Identificar padrões de import nos arquivos TypeScript
- Passo 4: Documentar estado atual completo

**Fase 2 - Renomeação de Packages:**
- Passo 1: Atualizar root package.json (name + description)
- Passo 2: Atualizar libs/domain/package.json (name)
- Passo 3: Atualizar libs/backend/package.json (name + dependencies)
- Passo 4: Atualizar libs/app-database/package.json (name + dependencies)
- Passo 5: Atualizar apps/backend/package.json (name + description + dependencies)
- Passo 6: Atualizar apps/frontend/package.json (name + description)

**Fase 3 - Atualização de Imports:**
- Passo 1: Buscar e substituir `@agentics/domain` → `@fnd/domain` em todos os arquivos .ts
- Passo 2: Buscar e substituir `@agentics/backend` → `@fnd/backend` em todos os arquivos .ts
- Passo 3: Buscar e substituir `@agentics/database` → `@fnd/database` em todos os arquivos .ts
- Passo 4: Buscar e substituir `@agentics/frontend` → `@fnd/frontend` (se houver)
- Passo 5: Buscar e substituir `@agentics/api` → `@fnd/api` (se houver)

**Fase 4 - Documentação:**
- Passo 1: Atualizar CLAUDE.md (substituir @agentics → @fnd, manter estrutura)
- Passo 2: Criar README.md orientado a humanos/alunos
- Passo 3: Verificar .env.example tem comentários explicativos

**Fase 5 - Validação:**
- Passo 1: Executar `npm install` (reinstalar dependências)
- Passo 2: Executar `npm run build` (verificar TypeScript compila)
- Passo 3: Executar `npm run typecheck` (verificar tipos)
- Passo 4: Testar inicialização da API (`npm run dev:api`)
- Passo 5: Testar inicialização do frontend (`npm run dev`)
- Passo 6: Revisar logs para erros de import

#### 2. Alternative Flows

**Cenário A: Encontrar referências a package não mapeado (@agentics/api-contracts)**

- Investigar se package existe ou é referência obsoleta
- Se existe: adicionar ao mapeamento e renomear para @fnd/api-contracts
- Se não existe: remover referência do package.json

**Cenário B: Build falha após renomeação**

- Analisar erros TypeScript no output
- Identificar imports não atualizados
- Procurar padrões: imports relativos vs absolutos, barrel exports
- Corrigir imports faltantes iterativamente

**Cenário C: Database local usa nome "agentics"**

- Não renomear database em produção (Supabase mantém nome atual)
- Para desenvolvimento local: pode usar "fnd" como nome do database
- Atualizar .env.example com exemplo: `DATABASE_URL=postgresql://user:pass@localhost:5432/fnd`

#### 3. Error Flows

**Error Type 1: Module not found após renomeação**

- **Trigger**: TypeScript não encontra módulo com novo nome @fnd/*
- **Handling**:
  - Verificar package.json tem o novo nome
  - Verificar tsconfig.json project references
  - Executar `npm install` novamente (limpar cache)
  - Verificar dist/ folders foram rebuilt
- **User feedback**: Log detalhado do erro TypeScript com path do arquivo problemático

**Error Type 2: Circular dependency após mudanças**

- **Trigger**: Imports circulares expostos durante rebuild
- **Handling**:
  - Analisar cadeia de imports
  - Reorganizar exports se necessário
  - Usar barrel exports (index.ts) para quebrar ciclos
- **User feedback**: Erro de compilação TypeScript indicando ciclo

**Error Type 3: Git merge conflicts em branches existentes**

- **Trigger**: Outras branches têm mudanças conflitantes em package.json
- **Handling**:
  - Este rebrand é feature isolada (branch refactor/F0005)
  - Merge para main após aprovação
  - Outras branches precisarão rebase após merge
- **User feedback**: Instruções claras para rebase de branches dependentes

## Integrations

### External APIs

Nenhuma integração externa necessária para este refactoring. Todas as integrações existentes (Supabase, Resend, Stripe, Redis, etc.) permanecem inalteradas.

### Internal Services

- **TypeScript Compiler**: Validação de imports e project references
- **npm workspaces**: Resolução de packages locais após renomeação
- **Turbo (build system)**: Build paralelo dos packages renomeados
- **Git**: Preservação de histórico durante refactoring

## Edge Cases Identified

1. **Packages com @ no nome**:
   - Descrição: Escopo de packages npm usa `@` que pode causar problemas em regex
   - Handling: Escapar corretamente em regex ou usar substituição literal

2. **Imports em comentários**:
   - Descrição: Código comentado pode ter imports com @agentics
   - Handling: Substituir também em comentários para consistência (buscar em comments também)

3. **package-lock.json desatualizado**:
   - Descrição: package-lock.json pode ter referências a @agentics
   - Handling: Deletar package-lock.json e node_modules, executar `npm install` fresh

4. **tsconfig project references quebrados**:
   - Descrição: tsconfig.json pode referenciar paths antigos
   - Handling: Atualizar "references" array em todos os tsconfig.json

5. **Barrel exports (index.ts) com re-exports**:
   - Descrição: index.ts que re-exportam de packages podem quebrar
   - Handling: Verificar libs/*/src/index.ts após renomeação

6. **Strings literais em runtime**:
   - Descrição: Código que constrói package names dinamicamente
   - Handling: Buscar strings literais "agentics" no código (não só imports)

## Acceptance Criteria

- [ ] **AC1 - Packages Renomeados**: Todos os 5 packages principais usam prefixo `@fnd/` em seus package.json
  - [ ] @fnd/domain
  - [ ] @fnd/backend
  - [ ] @fnd/database
  - [ ] @fnd/frontend
  - [ ] @fnd/api (apps/backend)

- [ ] **AC2 - Imports Atualizados**: Zero referências a `@agentics` em arquivos TypeScript (.ts, .tsx)
  - Verificável via: `grep -r "@agentics" apps/ libs/ --include="*.ts" --include="*.tsx"`

- [ ] **AC3 - Build Success**: `npm run build` executa sem erros TypeScript
  - Todos os packages compilam com sucesso
  - Zero erros de module not found
  - Zero erros de type checking

- [ ] **AC4 - Typecheck Success**: `npm run typecheck` passa em todos os workspaces
  - apps/backend: 0 errors
  - apps/frontend: 0 errors
  - Todas as libs: 0 errors

- [ ] **AC5 - CLAUDE.md Atualizado**: Documentação arquitetural reflete novos nomes
  - Todas as referências `@agentics` substituídas por `@fnd`
  - Estrutura e conteúdo arquitetural mantidos 100%
  - Aplica regras de brevidade e formatação da skill updating-claude-documentation
  - Permanece como documentação para agentes IA (não humanos)

- [ ] **AC6 - README.md Criado**: Documentação orientada a humanos existe
  - Descreve FND EasyFlow e propósito educacional
  - Inclui stack tecnológica resumida
  - Inclui quick start guide
  - Link para CLAUDE.md para detalhes técnicos

- [ ] **AC7 - Zero Contextos Legados**: Nenhuma menção a projetos anteriores
  - Zero menções a "tinyce" (exceto git history)
  - Zero menções a "rugido digital"
  - Zero menções a "consultório" ou domínio médico
  - Zero menções a "terapeutas" ou contexto de saúde

- [ ] **AC8 - Runtime Funcional**: Aplicação inicia sem erros
  - `npm run dev:api` inicia backend na porta 3001
  - `npm run dev` (frontend) inicia Vite dev server
  - Logs não mostram erros de module resolution
  - Endpoints básicos respondem (health check)

- [ ] **AC9 - Git History Preservado**: Histórico de commits intacto
  - Nenhum rebase ou squash de commits
  - Branch refactor/F0005-fnd-easyflow-rebrand criada a partir de main
  - Commits descritivos de cada etapa do refactoring

- [ ] **AC10 - Dependency Resolution**: npm install funciona corretamente
  - package-lock.json regenerado com novos nomes
  - Zero warnings de dependências quebradas
  - Workspaces resolvem packages locais corretamente

## Next Steps

**Para o Planning Agent:**

Este refactoring é sistemático e bem definido, mas envolve mudanças em muitos arquivos (~100+). A implementação deve ser dividida em fases claras e sequenciais para evitar estado intermediário quebrado.

**Estratégia de implementação recomendada:**

1. **Criar branch de segurança**: Garantir que temos backup antes de mudanças massivas

2. **Fase 1 - Preparação**:
   - Mapear 100% dos arquivos afetados
   - Criar scripts de busca e substituição
   - Planejar ordem de atualizações (bottom-up: libs → apps)

3. **Fase 2 - Execução atômica**:
   - Atualizar todos os package.json em uma única operação
   - Atualizar todos os imports TypeScript em batch
   - Commit atômico para evitar estado intermediário

4. **Fase 3 - Validação iterativa**:
   - Executar build após cada fase
   - Corrigir erros identificados
   - Testar runtime

5. **Fase 4 - Documentação**:
   - Atualizar CLAUDE.md
   - Criar README.md
   - Validar formatação

**Áreas de atenção técnica:**

- **TypeScript project references**: tsconfig.json pode quebrar se referências não forem atualizadas sincronizadamente
- **Barrel exports**: libs/*/src/index.ts precisam ser verificados manualmente
- **Runtime strings**: Buscar por strings "agentics" que não sejam imports (podem existir em logs, configs)
- **package-lock.json**: Deve ser regenerado completamente

**Critério de sucesso final:**

Template 100% funcional com nova identidade FND, zero referências legadas, documentação clara separando instruções para humanos (README) e agentes IA (CLAUDE.md), e build/runtime passando sem erros.
