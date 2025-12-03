# Discovery: FND EasyFlow Template Rebrand

**Branch:** refactor/F0005-fnd-easyflow-rebrand
**Date:** 2025-12-03

## Initial Analysis

### Commit History

**Recent commits analyzed:**
```
74370fa Merge pull request #1 from xmaiconx/refactor/F0004-supabase-env-config
3480e8b refactor(F0004): update documentation for getUserById to clarify key usage
8fc50e2 docs: add technical plan for F0004-supabase-env-config
6a41615 refactor(F0004): update Supabase env variables to match current dashboard nomenclature
66a4e41 docs: add PR/MR link to F0004-supabase-env-config
4c6d737 feat: initialize F0004-supabase-env-config - discovery phase
0b82fd9 .
6c647d3 refactor(F0003): complete Supabase Auth migration
380f840 modified: .claude/settings.local.json, apps/backend/.env.example, libs/app-database/.env.example
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
```

**Key observations:**
- Projeto passou por refactoring recente de Supabase Auth (F0003) e variáveis de ambiente (F0004)
- Já existe workflow bem estabelecido de feature discovery (comandos /feature, /plan, /dev)
- Commits seguem convenção semântica (feat, refactor, docs)
- Features anteriores focadas em billing (Stripe), workspace, e autenticação
- CLAUDE.md já foi atualizado na feature F0004 para refletir Supabase

### Modified Files

**Files already modified in this branch:**
```
docs/features/F0005-fnd-easyflow-rebrand/about.md
docs/features/F0005-fnd-easyflow-rebrand/discovery.md
docs/features/F0005-fnd-easyflow-rebrand/git-pr.md
```

**Analysis:**
- Apenas arquivos de documentação da feature foram criados até agora
- Nenhuma mudança em código ainda (discovery phase)
- Branch criada limpa a partir de main

### Related Functionalities

**Features desenvolvidas no projeto:**
- F0001: Billing system e workspace enhancements (Stripe integration)
- F0002: (não documentado explicitamente nos commits recentes)
- F0003: Supabase Auth migration (substituiu auth legado)
- F0004: Supabase env config (atualizou nomenclatura de variáveis)
- F0005: **FND EasyFlow Rebrand** (esta feature)

**Patterns identificados:**
- **Feature discovery estruturado**: Sempre criar docs/features/F000X-[nome]/ com about.md, discovery.md
- **Workflow em fases**: Discovery → Planning → Development → Done
- **Documentação dual**: CLAUDE.md (agentes IA) separado de README (humanos) - identificado na skill `updating-claude-documentation`
- **Commits descritivos**: Uso de conventional commits (feat, refactor, docs, fix)

## Strategic Questionnaire

### Category 1: Scope & Objective

**Q:** Qual é o objetivo principal desta funcionalidade?
**A:** Transformar o template atual (com branding "agentics", "tinyce", "rugido digital") em "FND EasyFlow Template", um template genérico para alunos da Fábrica de Negócios Digitais (FND) construírem seus SaaS com IA. Remover contextos legados e estabelecer identidade FND.

**Q:** Quem são os usuários/sistemas que vão interagir com isso?
**A:**
- **Alunos FND**: Usuários primários (precisam de README claro para onboarding)
- **Agentes IA (Claude Code)**: Consumidores do CLAUDE.md (precisam de instruções arquiteturais)
- **Criador do FND**: Precisa de template alinhado com branding do ecossistema

**Q:** Qual problema específico estamos resolvendo?
**A:**
1. **Confusão de identidade**: Nomes "agentics", "tinyce" não comunicam propósito educacional
2. **Documentação desalinhada**: CLAUDE.md arquiteturalmente correto mas package names desatualizados
3. **Barreira de entrada**: Alunos não entendem que é template para eles
4. **Falta de README**: Não existe documentação orientada a humanos

### Category 2: Business Rules

**Q:** Existem validações ou restrições específicas?
**A:**
1. **Package Name Consistency**: Todos os packages devem usar `@fnd/*` (não `@agentics/*`)
2. **Import Resolution**: Nenhum import quebrado após renomeação (TypeScript deve compilar)
3. **Build Success**: `npm run build` deve passar sem erros
4. **Git History Preservation**: Manter histórico completo (não squash, não rebase)
5. **Documentation Separation**: README.md (humanos) vs CLAUDE.md (agentes IA) com propósitos distintos

**Q:** Como devem ser tratados os casos de erro?
**A:**
- **Module not found**: Verificar package.json, tsconfig references, executar npm install fresh
- **Circular dependencies**: Analisar cadeia de imports, reorganizar exports
- **Build failures**: Analisar erros TypeScript, corrigir imports iterativamente
- Retornar mensagens de erro detalhadas com paths dos arquivos problemáticos

**Q:** Existem dependências de outras funcionalidades?
**A:**
- **Nenhuma dependência funcional**: Este é pure refactoring (não adiciona/remove features)
- **Dependências técnicas**:
  - TypeScript compiler (validação de imports)
  - npm workspaces (resolução de packages locais)
  - Turbo (build system)
  - Git (preservação de histórico)

**Q:** Há limites, quotas ou throttling a considerar?
**A:** Não aplicável (refactoring técnico, não tem aspectos de runtime/performance)

### Category 3: Data & Integration

**Q:** Quais dados precisam ser persistidos?
**A:** Nenhum dado novo. Refactoring não afeta database schema ou dados existentes.

**Q:** Existem integrações externas (APIs, serviços)?
**A:** Nenhuma integração nova. Todas as integrações existentes (Supabase, Resend, Stripe, Redis) permanecem inalteradas.

**Q:** É necessário processamento assíncrono?
**A:** Não. Refactoring é operação síncrona em tempo de desenvolvimento (build-time).

### Category 4: Edge Cases & Failure Scenarios

**Q:** O que acontece em cenários de falha?
**A:**
1. **Build failures**: Identificar imports não atualizados, corrigir iterativamente
2. **Package não encontrado**: Verificar package.json e tsconfig.json, reinstalar dependencies
3. **Circular dependencies**: Reorganizar exports, usar barrel exports
4. **Git conflicts**: Outras branches precisarão rebase após merge para main

**Q:** Como lidar com dados legados ou migrações?
**A:**
- **Database**: Sem migração necessária (schema não muda)
- **Database local**: Pode usar "fnd" como nome, mas não obrigatório
- **Production (Supabase)**: Mantém nome atual
- **package-lock.json**: Deletar e regenerar completamente

**Q:** Existem preocupações de performance ou escalabilidade?
**A:** Não aplicável (refactoring não afeta runtime performance)

**Q:** Há considerações específicas de segurança?
**A:** Não. Refactoring é puramente cosmético (nomes de packages), não afeta lógica de segurança.

### Category 5: UI/UX (if applicable)

**Q:** Como deve ser a experiência do usuário?
**A:**
- **Alunos FND**: README.md claro e objetivo com quick start guide
- **Desenvolvedores**: Documentação arquitetural precisa no CLAUDE.md
- **Sem mudanças visuais**: Frontend UI permanece igual (apenas package names mudam)

**Q:** Existem estados de loading/erro específicos?
**A:** Não aplicável (não há UI changes)

**Q:** Há requisitos de responsividade?
**A:** Não aplicável (refactoring não afeta frontend)

## Decisions and Clarifications

### Decision 1: Escopo do Rebrand

**Context:** Questionamento sobre até onde vai o rebrand - apenas packages ou também database, branches, etc.

**Decision:** Rebrand completo de packages e documentação, mas preservar:
- Git history completo
- Database schema inalterado (produção e local)
- Branches existentes (não limpar)
- Docker services (docker-compose.yml)
- Features funcionais (auth, workspace, billing, webhooks)

**Impact:**
- Foco claro: apenas packages npm e documentação
- Evita over-engineering e mudanças desnecessárias
- Mantém estabilidade da aplicação

**Rationale:** Princípio KISS (Keep It Simple, Stupid) e YAGNI (You Aren't Gonna Need It). Rebrand deve ser cirúrgico, não destrutivo.

### Decision 2: Separação de Documentação (README vs CLAUDE.md)

**Context:** Durante discovery, identificamos que CLAUDE.md é documentação para agentes IA, não para humanos.

**Decision:**
- **CLAUDE.md**: Permanece como documentação arquitetural para agentes IA (aplicar skill `updating-claude-documentation`)
  - Brevidade (~50-100 palavras por conceito)
  - Sem emojis, sem blocos de código extensos
  - Listar apenas paths de arquivos críticos
  - Sempre pt-BR
- **README.md**: Criar novo arquivo orientado a humanos (alunos FND)
  - Descrição do FND EasyFlow
  - Stack tecnológica resumida
  - Quick start guide
  - Link para CLAUDE.md

**Impact:**
- Onboarding de alunos mais eficiente (README claro)
- Agentes IA continuam usando CLAUDE.md (instruções precisas)
- Separação clara de propósitos

**Rationale:** Públicos diferentes (humanos vs IA) precisam de formatos diferentes. README deve ser acolhedor, CLAUDE.md deve ser preciso e conciso.

### Decision 3: Database Name em Desenvolvimento Local

**Context:** Questionamento sobre renomear database local de "agentics" para "fnd".

**Decision:**
- **Produção (Supabase)**: Manter nome atual (não renomear)
- **Local**: Pode usar "fnd" como nome, mas não obrigatório
- **Atualizar .env.example**: Adicionar exemplo com "fnd" como sugestão

**Impact:**
- Flexibilidade para desenvolvedores
- Sem breaking changes em produção
- .env.example mais alinhado com branding

**Rationale:** Database name é detalhe de implementação, não afeta funcionalidade. Produção não deve ser tocada desnecessariamente.

### Decision 4: Ordem de Execução do Refactoring

**Context:** Refactoring envolve ~100+ arquivos. Qual ordem minimiza estado intermediário quebrado?

**Decision:**
1. **Fase 1**: Atualizar todos os package.json simultaneamente (bottom-up: libs → apps)
2. **Fase 2**: Atualizar todos os imports TypeScript em batch (busca e substituição global)
3. **Fase 3**: Atualizar tsconfig.json project references
4. **Fase 4**: Deletar package-lock.json e node_modules, executar `npm install` fresh
5. **Fase 5**: Executar build e validação
6. **Fase 6**: Atualizar documentação (CLAUDE.md e criar README.md)

**Impact:**
- Minimiza tempo em estado quebrado
- Permite rollback atômico se algo falhar
- Build valida tudo de uma vez

**Rationale:** Atualização atômica (all-or-nothing) é mais segura que incremental em refactoring de nomes.

### Decision 5: Tratamento de package-lock.json

**Context:** package-lock.json terá referências a `@agentics/*` após mudanças.

**Decision:**
- Deletar `package-lock.json` completamente
- Executar `npm install` para regenerar do zero
- Commitar novo package-lock.json

**Impact:**
- Garante lockfile 100% consistente com novos nomes
- Evita inconsistências de cache npm

**Rationale:** Regenerar é mais confiável que tentar editar manualmente arquivo gigante de lockfile.

## Assumptions & Premises

1. **TypeScript compila sem erros atualmente**:
   - Assumimos que codebase atual está em estado funcional (build passa)
   - Impact if wrong: Precisaremos corrigir erros existentes antes do rebrand

2. **Todos os imports usam package names com @agentics (não paths relativos)**:
   - Assumimos que libs são importadas via `@agentics/*`, não `../../libs/`
   - Impact if wrong: Teremos que mapear imports relativos também (mais trabalho)

3. **Nenhuma string literal hardcoded com "agentics" em runtime**:
   - Assumimos que "agentics" só aparece em imports/package.json (não em logs, configs runtime)
   - Impact if wrong: Teremos que buscar e substituir strings literais também

4. **npm workspaces está configurado corretamente**:
   - Assumimos que root package.json tem `"workspaces": ["apps/*", "libs/*"]`
   - Impact if wrong: Resolução de packages locais pode quebrar

5. **Não há dependências de @agentics/api-contracts** (referência obsoleta):
   - Observado em libs/backend/package.json mas package não existe
   - Assumimos que é referência obsoleta que deve ser removida
   - Impact if wrong: Se package existe, teremos que renomeá-lo também

6. **Frontend não importa diretamente de @agentics/api**:
   - Frontend deve importar apenas de @agentics/frontend (seu próprio package)
   - Assumimos separação limpa entre frontend e backend packages
   - Impact if wrong: Teremos que mapear imports cross-package

## Edge Cases Identified

1. **Package com @ no nome pode causar problemas em regex**:
   - Description: Escopo npm usa `@` que é caractere especial em regex
   - Likelihood: Alta (certamente teremos)
   - Handling Strategy: Usar substituição literal (string replace) em vez de regex, ou escapar `@` corretamente

2. **Imports em comentários de código**:
   - Description: Código comentado pode ter `import { X } from '@agentics/domain'`
   - Likelihood: Média
   - Handling Strategy: Buscar e substituir também em comentários para consistência total

3. **package-lock.json com milhares de linhas**:
   - Description: Lockfile gigante pode ter referências espalhadas
   - Likelihood: Alta
   - Handling Strategy: Deletar completamente e regenerar (não editar manualmente)

4. **tsconfig.json project references desatualizados**:
   - Description: `"references": [{ "path": "../../libs/domain" }]` pode não resolver com novos nomes
   - Likelihood: Média
   - Handling Strategy: Verificar todos os tsconfig.json manualmente, atualizar references se necessário

5. **Barrel exports (index.ts) com re-exports de packages**:
   - Description: `libs/domain/src/index.ts` faz `export * from './entities'` (ok) ou `export * from '@agentics/domain'` (problemático)
   - Likelihood: Baixa (padrão é usar paths relativos em barrel exports)
   - Handling Strategy: Verificar libs/*/src/index.ts após renomeação

6. **Node modules cache com packages antigos**:
   - Description: npm cache pode ter versões antigas com nome @agentics
   - Likelihood: Alta
   - Handling Strategy: Deletar node_modules completamente antes de `npm install`

## Out of Scope Items

1. **Mudanças arquiteturais** - Clean Architecture, CQRS, Multi-tenancy permanecem 100% iguais. Não refatorar estrutura de pastas, patterns, ou design decisions.

2. **Mudanças em features funcionais** - Auth, workspace, audit, webhooks, billing permanecem iguais. Não adicionar, remover, ou modificar funcionalidades.

3. **Mudanças no database schema** - Tabelas, colunas, constraints, indexes permanecem iguais. Não criar migrations.

4. **Renomeação de database em produção** - Supabase database mantém nome atual. Renomear database seria breaking change desnecessário.

5. **Limpeza de branches antigas** - Branches de features anteriores (F0001, F0002, F0003, F0004) permanecem. Não deletar histórico git.

6. **Criação de tutoriais ou exemplos para alunos** - Focar apenas no rebrand. Tutoriais (como criar primeira feature, como usar pipeline, etc.) são fase futura.

7. **Tradução de código técnico para português** - Código permanece em inglês (variáveis, funções, classes). Apenas documentação (README, CLAUDE.md) em pt-BR.

8. **Refatoração de código legado** - Não aproveitar rebrand para "melhorar" código. YAGNI: apenas o necessário para rebrand.

9. **Atualização de dependências npm** - Não atualizar versões de libs (NestJS, React, etc.). Apenas renomear packages internos.

10. **Criação de logo ou branding visual para FND** - Rebrand é textual (nomes, descrições). Assets visuais são out of scope.

## References

### Codebase Files Consulted

- **package.json** (root): Identificado nome "tinyce" e descrição "Sistema de Gestão para Terapeutas Autônomos"
- **apps/backend/package.json**: Identificado dependencies com @agentics/*, descrição "Backend API for Rugido Digital"
- **apps/frontend/package.json**: Identificado package name @agentics/frontend, descrição "Frontend for TinyCE"
- **libs/domain/package.json**: Identificado @agentics/domain
- **libs/backend/package.json**: Identificado @agentics/backend e referência obsoleta a @agentics/api-contracts
- **libs/app-database/package.json**: Identificado @agentics/database
- **CLAUDE.md** (primeiras 50 linhas): Confirmado que About section já menciona FND, mas package names usam @agentics
- **.claude/skills/updating-claude-documentation/SKILL.md**: Consultado para entender regras de documentação para agentes IA

### Documentation Consulted

- **Skill: updating-claude-documentation**: Regras de formatação e conteúdo para CLAUDE.md
  - Sempre pt-BR
  - Sem emojis em headers
  - Brevidade (max 100 palavras/parágrafo)
  - Listar apenas paths de arquivos (sem blocos de código extensos)
  - Separação clara: CLAUDE.md (agentes IA) vs README.md (humanos)

- **Git log**: Histórico dos últimos 20 commits para entender padrões do projeto
  - Features seguem padrão F000X-[nome]
  - Commits seguem conventional commits
  - Workflow: Discovery → Planning → Implementation

- **Documento Mestre FND v2.0** (fornecido pelo usuário):
  - Grande promessa: "Pare de tentar construir tijolo por tijolo"
  - Objetivo: Transformar curiosos em "Tech Owners"
  - Ecossistema: EasyFlow + SalesFlow

### Related Functionalities

- **F0001**: Billing system e workspace enhancements - Relevante para entender que workspaces são multi-tenant feature essencial
- **F0003**: Supabase Auth migration - Relevante porque substituiu auth legado recentemente (sistema está em evolução)
- **F0004**: Supabase env config - Relevante porque CLAUDE.md foi atualizado recentemente (último refactoring de docs)

## Summary for Planning

**Executive Summary:**

Este refactoring transforma o template "agentics" em "FND EasyFlow Template" através de rebrand sistemático de packages npm, imports TypeScript, e documentação. Envolve renomeação de 5 packages principais (`@agentics/*` → `@fnd/*`), atualização de ~100+ arquivos com imports, e separação clara de documentação para humanos (novo README.md) vs agentes IA (CLAUDE.md atualizado).

Escopo é bem definido e cirúrgico: **apenas nomes e documentação mudam**, zero mudanças arquiteturais ou funcionais. Arquitetura (Clean Architecture, CQRS, Multi-tenancy) e features (auth, workspace, billing, webhooks) permanecem 100% inalteradas.

Principais decisões tomadas durante discovery:
1. **Execução atômica**: Atualizar todos os packages simultaneamente (não incremental) para minimizar tempo em estado quebrado
2. **Separação de docs**: README.md (humanos/alunos) separado de CLAUDE.md (agentes IA)
3. **Database local**: Pode usar "fnd" mas não obrigatório (produção mantém nome atual)
4. **package-lock.json**: Deletar e regenerar completamente (não editar manualmente)
5. **Git history**: Preservar 100% do histórico (não squash, não rebase)

Edge cases identificados e mitigados:
- Package names com `@` (usar substituição literal)
- package-lock.json gigante (deletar e regenerar)
- tsconfig project references (verificar manualmente)
- node_modules cache (limpar completamente)

**Critical Requirements:**

1. **Package Name Consistency**: Todos os packages devem usar prefixo `@fnd/` sem exceções
2. **Import Resolution**: Nenhum import quebrado (TypeScript deve compilar sem erros)
3. **Build Success**: `npm run build` deve passar em todos os workspaces
4. **Documentation Separation**: README.md para humanos, CLAUDE.md para agentes IA
5. **Git History Preservation**: Manter histórico completo de commits

**Technical Constraints:**

1. **TypeScript**: Strict mode habilitado, project references devem estar corretos
2. **npm workspaces**: Packages locais devem resolver corretamente após renomeação
3. **Turbo**: Build system deve compilar todos os packages em paralelo
4. **Zero breaking changes**: Aplicação deve continuar funcional após refactoring
5. **Skill compliance**: CLAUDE.md deve seguir regras da skill `updating-claude-documentation`

**Next Phase Focus:**

Planning Agent deve criar plano técnico detalhado com:

1. **Scripts de busca e substituição**: Comandos exatos para renomear packages e imports (find/replace em massa)
2. **Ordem de execução**: Sequência precisa de operações para evitar estado quebrado
3. **Checkpoints de validação**: Pontos de verificação (build, typecheck) após cada fase
4. **Rollback strategy**: Como reverter se algo falhar
5. **Testing plan**: Como validar que aplicação continua funcional

Focar em automação máxima (scripts) e validação contínua (build após cada mudança). Este é refactoring mecânico e repetitivo - perfeito para automação.
