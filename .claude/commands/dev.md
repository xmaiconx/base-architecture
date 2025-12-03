# Development Execution Specialist

> **LANGUAGE RULE:** All interaction with the user (questions, responses, summaries, error messages) and generated documentation (markdown files) MUST be in Brazilian Portuguese (PT-BR). Keep git patterns (commit messages, branch names), code, and technical terms in English.

> **⚠️ REGRA CRÍTICA - DESENVOLVIMENTO CONTÍNUO:** Uma vez iniciado, você DEVE completar 100% do desenvolvimento sem parar para perguntar ao usuário. NÃO pergunte "quer continuar?", "devo prosseguir?", ou similar. Implemente TUDO até o build passar 100%. Se encontrar erros, CORRIJA e continue.

You are now acting as a **Development Execution Coordinator**. Your role is to **coordinate subagents** that implement the feature following the technical plan (or directly from requirements for simple features), ensuring all code compiles 100% and contracts are implemented exactly as specified.

This command initiates the DEVELOPMENT PHASE (FASE 3) of feature development.

## Subagent Strategy

**IMPORTANT:** This command uses the **Task tool with subagents** to parallelize development when possible. You act as the **Coordinator**, dispatching specialized subagents for each development area.

### When to Use Subagents

Use subagents when:
- The feature has **multiple independent components** (e.g., Backend + Frontend + Database)
- The `plan.md` defines **clear phase separation** with minimal dependencies
- Tasks can be **executed in parallel** without blocking each other

Do NOT use subagents when:
- The feature is **very simple** (single file change, small fix)
- Components have **strict sequential dependencies** that prevent parallelization
- The entire implementation can be done in **< 10 minutes**

### Subagent Types

| Subagent | When to Dispatch | Focus Area |
|----------|------------------|------------|
| `general-purpose` | Backend API, Workers, complex logic | NestJS modules, CQRS, services |
| `general-purpose` | Frontend development | React components, stores, hooks |
| `general-purpose` | Database layer | Migrations, entities, repositories |
| `Explore` | Quick codebase analysis | Find patterns, existing implementations |

### 100% Completion Guarantee

**O desenvolvimento com subagentes garante:**

1. **Paralelização Inteligente:** Tarefas independentes rodam em paralelo
2. **Coordenação Centralizada:** Você (Coordinator) gerencia todos os subagentes
3. **Verificação Contínua:** Build verificado após cada subagente
4. **Auto-Correção:** Se build falhar, dispatch fix subagent automaticamente
5. **Conclusão Garantida:** Só termina quando 100% compila

**Fluxo de Garantia:**
```
Subagent completa → Verifica build → Passou? → Próximo subagent
                                    ↓
                               Falhou? → Dispatch fix subagent → Loop até passar
```

## Phase 1: Identify Feature & Load Context (AUTOMATIC)

### Step 1: Detect Current Feature

Automatically identify the feature from the current branch:

```bash
# Identify feature from branch name
FEATURE_ID=$(bash .claude/scripts/identify-current-feature.sh)
```

**If feature identified:**
- Display feature ID and path
- **Proceed automatically** - do NOT ask for confirmation

**If no feature identified:**
- List available features: `ls -1 docs/features/ | grep -E '^F[0-9]{4}-'`
- If only ONE feature exists: use it automatically
- If MULTIPLE features exist: ask user which one (this is the ONLY acceptable interruption)

### Step 2: Load Feature Documentation (MANDATORY)

```bash
FEATURE_DIR="docs/features/${FEATURE_ID}"

# Check which documents exist
ls -la "${FEATURE_DIR}/"
```

**Load in priority order:**
1. **plan.md** (if exists) - Technical plan is SOURCE OF TRUTH
2. **about.md** (ALWAYS) - Feature requirements
3. **discovery.md** (ALWAYS) - Discovery insights

**If plan.md does NOT exist:**
- **Proceed automatically** with about.md and discovery.md only (simple feature mode)
- Do NOT ask for confirmation - just inform briefly: "Desenvolvendo sem plan.md (feature simples)"

### Step 3: Analyze Codebase Patterns (MANDATORY)

**Load existing patterns** for reference:

1. **Similar modules:**
   - Search for similar API modules
   - Search for similar workers
   - Search for similar frontend components

2. **Project architecture:**
   - Read `CLAUDE.md` - Complete architecture guide
   - Understand layer separation
   - Identify naming conventions

3. **Tech stack specifics:**
   - Backend: NestJS modules, CQRS, Repository pattern
   - Frontend: React components, Zustand stores, TanStack Query
   - Database: Kysely queries, Knex migrations

## Phase 2: Determine Development Scope (AUTOMATIC)

**DO NOT ask user to confirm scope.** Analyze plan.md (or about.md) and infer automatically:

**Scope Detection Rules:**
- **Backend API**: If plan mentions endpoints, controllers, DTOs, or API routes
- **Workers**: If plan mentions queues, jobs, background processing, or event handlers
- **Frontend**: If plan mentions pages, components, UI, forms, or user interface
- **Database**: If plan mentions entities, tables, migrations, or data models

**Briefly inform what was detected:**
> "Escopo identificado: Backend API + Frontend + Database. Iniciando implementação..."

**Then proceed immediately to implementation. Do NOT wait for confirmation.**

## Phase 3: Implementation (SUBAGENT COORDINATION)

### 3.0 Analyze Dependencies & Plan Parallelization

**BEFORE dispatching subagents**, analyze `plan.md` to determine:

1. **Dependency Graph:**
   - Which components depend on others?
   - What can run in parallel?
   - What must run sequentially?

2. **Typical Dependency Order:**
   ```
   Database (entities, migrations, repositories)
       ↓
   Backend API (controllers, services, DTOs)
       ↓ (parallel branch)
   ├── Workers (processors, jobs)
   └── Frontend (components, pages, stores)
   ```

3. **Parallelization Decision Matrix:**

   | Scenario | Strategy |
   |----------|----------|
   | Database + Backend + Frontend | Sequential: DB → Parallel: Backend + Frontend |
   | Backend + Frontend only | Parallel: Backend + Frontend |
   | Backend + Workers | Parallel: Backend + Workers |
   | Single component | No subagents, implement directly |

### 3.1 Database Development (Subagent - FIRST if needed)

**When:** Scope detection identified Database changes are needed
**Dispatch:** Sequential BEFORE other subagents (others depend on DB types)

**Subagent Prompt Template:**
```
You are implementing the DATABASE LAYER for feature ${FEATURE_ID}.

## Context
- Feature: ${FEATURE_ID}
- Plan: [paste relevant sections from plan.md]
- Architecture: Follow CLAUDE.md patterns

## Your Tasks
1. Create domain entities in `libs/domain/src/entities/`
2. Create Kysely table types in `libs/app-database/src/types/Database.ts`
3. Create Knex migration in `libs/app-database/migrations/`
4. Implement repository in `libs/app-database/src/repositories/`
5. Update barrel exports in `libs/domain/src/index.ts` and `libs/app-database/src/index.ts`

## Patterns to Follow
- snake_case for DB columns, camelCase for entities
- Repository methods: findById, findByAccountId, create, update, delete
- Always filter by account_id for multi-tenancy

## Deliverables
- Report: List of files created/modified
- Status: Build passes (run: npm run build -w @agentics/database -w @agentics/domain)
```

**Implementation Pattern:**
```
libs/domain/src/entities/[Entity].ts
libs/app-database/src/types/[Entity]Table.ts
libs/app-database/migrations/YYYYMMDD###_[description].js
libs/app-database/src/repositories/[Entity]Repository.ts
```

### 3.2 Backend API Development (Subagent)

**When:** Scope detection identified Backend API is needed
**Dispatch:** After Database subagent completes (if DB was needed), or in parallel with Frontend/Workers

**Subagent Prompt Template:**
```
You are implementing the BACKEND API for feature ${FEATURE_ID}.

## Context
- Feature: ${FEATURE_ID}
- Plan: [paste API contracts from plan.md]
- Architecture: Follow CLAUDE.md patterns (NestJS, CQRS, Clean Architecture)

## Your Tasks
1. Create module structure in `apps/backend/src/api/modules/[feature]/`
2. Implement DTOs (request/response) with class-validator decorators
3. Implement Commands and CommandHandlers
4. Implement Events and EventHandlers
5. Implement Controller with all endpoints
6. Implement Service for orchestration
7. Register module in app.module.ts

## API Contracts to Implement
[Paste contracts from plan.md]

## Patterns to Follow
- DTOs: CreateXxxDto, XxxResponseDto (with validation decorators)
- Commands: XxxCommand → XxxCommandHandler
- Events: XxxEvent → XxxEventHandler
- Controller: REST endpoints matching contracts exactly
- Service: Orchestrate command execution

## Deliverables
- Report: List of files created/modified with brief descriptions
- Endpoints: List of implemented endpoints
- Status: Build passes (run: npm run build -w @agentics/api)
```

**Implementation Pattern:**
```
apps/backend/src/api/modules/[feature-name]/
├── dtos/
│   ├── Create[Entity]Dto.ts
│   ├── [Entity]ResponseDto.ts
│   └── index.ts
├── commands/
│   ├── Create[Entity]Command.ts
│   ├── handlers/
│   │   ├── Create[Entity]CommandHandler.ts
│   │   └── index.ts
│   └── index.ts
├── events/
│   ├── [Entity]CreatedEvent.ts
│   ├── handlers/
│   │   └── [Entity]CreatedEventHandler.ts
│   └── index.ts
├── [feature].controller.ts
├── [feature].service.ts
└── [feature].module.ts
```

### 3.3 Worker Development (Subagent)

**When:** Scope detection identified Workers are needed
**Dispatch:** In parallel with Backend API (if independent) or after API (if depends on API events)

**Subagent Prompt Template:**
```
You are implementing WORKERS for feature ${FEATURE_ID}.

## Context
- Feature: ${FEATURE_ID}
- Plan: [paste Event/Command contracts from plan.md]
- Architecture: Follow CLAUDE.md patterns (BullMQ, Redis)

## Your Tasks
1. Create worker in `apps/backend/src/workers/`
2. Implement processor with correct event/command handling
3. Configure queue settings (retries, backoff, timeouts)
4. Implement error handling and logging
5. Ensure idempotency where required
6. Register worker in worker.module.ts

## Event/Command Contracts
[Paste contracts from plan.md]

## Patterns to Follow
- Processor: @Processor decorator with queue name
- Job handling: @Process decorator for each job type
- Error handling: Use OnQueueFailed for failed jobs
- Logging: Use ILoggerService for structured logs

## Deliverables
- Report: List of files created/modified
- Queues: List of queues and their job types
- Status: Build passes (run: npm run build -w @agentics/api)
```

**Implementation Pattern:**
```
apps/backend/src/workers/
├── [feature]-worker.ts
└── [feature]-processor.ts
```

### 3.4 Frontend Development (Subagent)

**When:** Scope detection identified Frontend is needed
**Dispatch:** In parallel with Backend API (frontend can mock API while backend is built) or after API

**Subagent Prompt Template:**
```
You are implementing the FRONTEND for feature ${FEATURE_ID}.

## Context
- Feature: ${FEATURE_ID}
- Plan: [paste UI/UX requirements and API contracts from plan.md]
- Architecture: Follow CLAUDE.md patterns (React, Zustand, TanStack Query)

## Your Tasks
1. Create/update pages in `apps/frontend/src/pages/`
2. Create components in `apps/frontend/src/components/[feature]/`
3. Create Zustand store in `apps/frontend/src/stores/`
4. Create hooks in `apps/frontend/src/hooks/`
5. Mirror DTOs as interfaces in `apps/frontend/src/types/api/[feature]/`
6. Implement API integration with TanStack Query
7. Implement forms with React Hook Form + Zod validation

## API Contracts (for integration)
[Paste API contracts from plan.md]

## Patterns to Follow
- Components: Functional components with TypeScript
- State: Zustand for client state, TanStack Query for server state
- Forms: React Hook Form + Zod schemas
- Styling: Tailwind CSS + Shadcn/ui components
- Error handling: Toast notifications for errors

## Deliverables
- Report: List of files created/modified
- Pages: List of new/modified pages
- Status: Build passes (run: npm run build -w @agentics/frontend)
```

**Implementation Pattern:**
```
apps/frontend/src/
├── pages/
│   └── [feature-page].tsx
├── components/
│   └── [feature]/
│       └── [Component].tsx
├── stores/
│   └── [feature]-store.ts
├── hooks/
│   └── use[Feature].ts
└── types/
    └── api/
        └── [feature]/
            └── [Feature]Dto.ts (mirrored from backend)
```

### 3.5 Subagent Dispatch Examples

**Example 1: Full-Stack Feature (Database + Backend + Frontend)**
```
Phase 1: Dispatch Database Subagent (sequential - others depend on it)
   ↓ wait for completion
Phase 2: Dispatch in PARALLEL:
   - Backend API Subagent
   - Frontend Subagent
   ↓ wait for both to complete
Phase 3: Integration verification
```

**Example 2: Backend + Workers**
```
Dispatch in PARALLEL:
- Backend API Subagent
- Workers Subagent
↓ wait for both to complete
```

**Example 3: Frontend-Only Change**
```
Single Subagent: Frontend
OR: Implement directly without subagent (if simple)
```

### 3.6 Subagent Dispatch Command

When dispatching a subagent, use the Task tool:

```
Use Task tool with:
- subagent_type: "general-purpose"
- description: "[Area] for [FEATURE_ID]"
- prompt: [Use template from 3.1-3.4 above, filled with actual plan content]
```

**CRITICAL:** When dispatching multiple subagents in parallel, send ALL Task tool calls in a SINGLE message to maximize parallelism.

**Example - Parallel Dispatch:**
```
[Single message with multiple Task tool calls:]
- Task 1: Backend API Subagent
- Task 2: Frontend Subagent
```

### 3.7 Subagent Coordination & 100% Completion Guarantee

**⚠️ REGRA CRÍTICA:** O desenvolvimento DEVE ser concluído 100%. NUNCA pare no meio.

**Coordinator Responsibilities:**

1. **Monitor All Subagents:**
   - Wait for each subagent to report completion
   - Collect deliverables from each subagent
   - Track which components are done

2. **Handle Subagent Failures:**
   - If a subagent reports build errors → dispatch new subagent to fix
   - If a subagent gets stuck → retry with more context
   - If integration issues arise → dispatch integration-fix subagent

3. **Ensure Sequential Dependencies:**
   - Database MUST complete before Backend/Frontend start (if DB is needed)
   - If subagent needs types from another → wait for that subagent first

4. **Verification After Each Subagent:**
   ```bash
   # After Database subagent
   npm run build -w @agentics/database -w @agentics/domain

   # After Backend subagent
   npm run build -w @agentics/api

   # After Frontend subagent
   npm run build -w @agentics/frontend
   ```

5. **Fix Errors Immediately:**
   - If build fails after a subagent completes, dispatch a FIX subagent:
   ```
   You are FIXING BUILD ERRORS for feature ${FEATURE_ID}.

   ## Error Output
   [paste build error output]

   ## Files Modified by Previous Subagent
   [list files]

   ## Your Task
   Fix ALL build errors. Do not stop until build passes 100%.
   ```

6. **Completion Criteria:**
   - ALL subagents have completed
   - ALL builds pass (backend + frontend)
   - NO TypeScript errors
   - ALL contracts implemented

**Workflow Diagram:**
```
Coordinator starts
    ↓
Analyze plan.md → Determine parallelization strategy
    ↓
Dispatch Phase 1 Subagents (e.g., Database)
    ↓
Wait → Collect results → Verify build
    ↓ (if build fails, dispatch fix subagent)
Dispatch Phase 2 Subagents (parallel if possible)
    ↓
Wait → Collect results → Verify build
    ↓ (if build fails, dispatch fix subagent)
Final Integration Verification
    ↓
Documentation
    ↓
DONE (100% complete)
```

## Phase 4: Integration Verification (CRITICAL)

**After implementing all components, verify integration:**

1. **Contract Adherence:**
   - API endpoints match contracts
   - Event payloads match contracts
   - Command payloads match contracts

2. **Data Flow:**
   - Frontend → API works correctly
   - API → Workers works correctly
   - Events flow properly

3. **Error Handling:**
   - Consistent error responses
   - User-friendly error messages
   - Proper logging

4. **Build Verification:**
   ```bash
   # Backend
   cd apps/backend && npm run build

   # Frontend
   cd apps/frontend && npm run build
   ```

**CRITICAL:** Code MUST compile 100%. Fix any build errors before proceeding.

## Phase 5: Documentation (MANDATORY)

Create implementation documentation:

**Create:** `docs/features/${FEATURE_ID}/implementation.md`

**Structure:**
```markdown
# Implementation: [Feature Name]

**Date:** [current date]
**Developer:** Claude Code

## Files Created

### Backend API
- \`apps/backend/src/api/modules/[feature]/[file].ts\` - [~20 word description]
- \`apps/backend/src/api/modules/[feature]/[file].ts\` - [~20 word description]

### Workers
- \`apps/backend/src/workers/[file].ts\` - [~20 word description]

### Frontend
- \`apps/frontend/src/pages/[file].tsx\` - [~20 word description]
- \`apps/frontend/src/components/[file].tsx\` - [~20 word description]

### Database
- \`libs/domain/src/entities/[Entity].ts\` - [~20 word description]
- \`libs/app-database/migrations/[migration].js\` - [~20 word description]
- \`libs/app-database/src/repositories/[Repository].ts\` - [~20 word description]

## Files Modified

- \`[file path]\` - [~20 word description of changes]

## Files Deleted

- \`[file path]\` - [~20 word description of why deleted]

## Build Status

- [ ] Backend compiles successfully
- [ ] Frontend compiles successfully
- [ ] No TypeScript errors
- [ ] No linting errors

## Integration Status

- [ ] API contracts implemented
- [ ] Event contracts implemented
- [ ] Frontend integration working
- [ ] Database migrations tested

## Notes

[Any important notes about the implementation, deviations from plan, or decisions made during development]
```

## Phase 6: Completion

**DO NOT commit code** - it will be reviewed by human first.

Inform the user:

**"✅ Development Complete!**

Implementation finished for feature `${FEATURE_ID}`.

**Summary:**
- Backend API: [X files created]
- Workers: [Y files created]
- Frontend: [Z files created]
- Database: [W files created/modified]

**Build Status:**
- ✅ Backend: Compiling successfully
- ✅ Frontend: Compiling successfully

**Documentation:**
- ✓ Implementation details in `docs/features/${FEATURE_ID}/implementation.md`

**Next Steps:**
1. Review the implementation
2. Test the functionality
3. Run code review (manual or with Code Review Agent)
4. When approved, stage and commit changes
5. Update PR/MR status"

---

## Critical Rules

**⚠️ 100% COMPLETION GUARANTEE - DESENVOLVIMENTO SEMPRE COMPLETO:**
- O desenvolvimento DEVE ser concluído 100%. NUNCA pare no meio.
- Use subagentes para paralelizar e coordenar até entregar 100%
- Cada subagente deve completar sua tarefa e reportar build passando
- Se um subagente falhar, dispatch outro para corrigir
- Só considere "done" quando TODOS os builds passarem

**⚠️ CONTINUOUS DEVELOPMENT - NO INTERRUPTIONS:**
- **NEVER stop mid-development to ask "do you want to continue?"**
- **NEVER ask for confirmation between phases** (Backend → Frontend → etc.)
- **NEVER summarize progress and wait** - keep implementing until 100% complete
- Once started, development runs to completion WITHOUT user interaction
- Only stop if there's a BLOCKING error that cannot be resolved
- If you hit an error, FIX IT and continue - don't ask permission

**SUBAGENT RULES:**
- Dispatch subagents for each major component (Database, Backend, Frontend, Workers)
- Use PARALLEL dispatch when components are independent
- Use SEQUENTIAL dispatch when there are dependencies (e.g., Database first)
- Wait for each subagent to complete before moving to next phase
- Verify build after each subagent completes
- If build fails, dispatch a FIX subagent immediately
- Never leave a subagent incomplete - either it succeeds or gets fixed

**DO NOT:**
- Commit or stage any code (human review comes first)
- Skip any section of the implementation
- Leave code in non-compiling state
- Deviate from contracts without documenting
- Add features not in specification
- **Stop to ask "want to continue?" or "should I proceed?"**
- **Pause between Backend/Frontend/Database phases**
- **Leave a subagent task incomplete**
- **Move on if build is failing**

**DO:**
- Follow existing patterns rigorously
- Implement contracts exactly as specified
- Ensure 100% compilation
- Add appropriate logging
- Handle errors properly
- Keep code simple (KISS, YAGNI)
- Document deviations if absolutely necessary
- **Complete ALL phases in a single continuous flow**
- **Run build verification and fix errors automatically**
- **Use subagents to parallelize independent work**
- **Coordinate subagents until ALL builds pass**
- **Dispatch fix subagents when builds fail**

---

## Skip Planning for Simple Features

For very simple features (e.g., adding a single field, small UI change), you can:

1. Skip `/plan` command
2. Go directly from `/feature` to `/dev`
3. Implement directly from `about.md` and `discovery.md`
4. Still follow all development best practices
