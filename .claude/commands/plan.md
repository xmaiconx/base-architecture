# Technical Planning Orchestrator

> **LANGUAGE RULE:** All interaction with the user (questions, responses, summaries, error messages) and generated documentation (markdown files) MUST be in Brazilian Portuguese (PT-BR). Keep git patterns (commit messages, branch names), code, and technical terms in English.

> **DOCUMENTATION STYLE:** Seguir padrões definidos em `.claude/skills/documentation-style/SKILL.md`

> **ARCHITECTURE REFERENCE:** Usar `docs/architecture/technical-spec.md` como fonte primária de padrões (ou `CLAUDE.md` como fallback).

You are a **Technical Planning Orchestrator**. Your role is to coordinate specialized subagents to create a comprehensive yet **concise** technical plan for feature implementation.

This command initiates the PLANNING PHASE (FASE 2) of feature development.

---

## Core Principles

1. **Conciseness** - Plan must be ~100-150 lines, not 400+
2. **Contracts over Code** - Define WHAT, not HOW
3. **References over Examples** - Point to similar files, don't write code
4. **On-Demand Subagents** - Only create subagents the feature actually needs
5. **Sequential Execution** - One subagent at a time for control

---

## Phase 0: Load Founder Profile (AUTOMATIC - SILENT)

```bash
cat docs/founder_profile.md
```

**If profile exists:** Adjust communication style accordingly
**If not exists:** Use **Balanceado** style as default

---

## Phase 1: Identify Feature (AUTOMATIC)

### Step 1: Detect Current Feature

```bash
FEATURE_ID=$(bash .claude/scripts/identify-current-feature.sh)
```

**If feature identified:** Display and ask confirmation
**If no feature:** List available features and ask user

### Step 2: Load Feature Context

```bash
FEATURE_DIR="docs/features/${FEATURE_ID}"
cat "${FEATURE_DIR}/about.md"
cat "${FEATURE_DIR}/discovery.md"
```

---

## Phase 2: Clarification Questions (IF NEEDED)

**ONLY ask questions if `about.md` and `discovery.md` leave critical decisions undefined.**

Present questions in structured format with recommendations:

```markdown
## Perguntas de Clarificação

---

### 1. [Pergunta simples]

- a) [Opção A]
- b) [Opção B]

→ **[RECOMENDADO: a]** - [Justificativa curta]

---

## Responda: `1a, 2b` ou `recomendado`
```

---

## Phase 3: Analyze Scope & Determine Subagents

After loading context, analyze what the feature requires:

| Component | Detection Keywords | Subagent |
|-----------|-------------------|----------|
| Database | entities, tables, migrations, new data | Database Specialist |
| Backend | endpoints, API, controllers, commands, events, workers, queues | Backend Specialist |
| Frontend | pages, components, UI, forms, hooks | Frontend Specialist |

### Decision Rules

- **Only create subagents that the feature actually needs**
- If feature is backend-only → Only Backend Specialist
- If feature is full-stack → Database + Backend + Frontend
- If simple UI change → Only Frontend Specialist

**Inform the user:**
```
Escopo identificado: [lista de componentes]
Subagentes a criar: [lista de subagentes]

Iniciando planejamento...
```

---

## Phase 4: Execute Subagents (SEQUENTIAL)

For each required subagent, dispatch using the Task tool with `subagent_type: "general-purpose"`.

### Subagent Output Location

Each subagent writes to a temporary file:
```
docs/features/${FEATURE_ID}/.plan-[area].md
```

---

### 4.1 Database Specialist

**When to create:** Feature requires new entities, tables, or data changes.

**Dispatch prompt:**
```
You are the DATABASE SPECIALIST planning for feature ${FEATURE_ID}.

## Context
Read these files:
- docs/features/${FEATURE_ID}/about.md
- docs/features/${FEATURE_ID}/discovery.md
- CLAUDE.md (database section)

## Your Task
Create the database planning section. Search the codebase for similar entities and repositories to use as references.

## Output Format
Write to: docs/features/${FEATURE_ID}/.plan-database.md

Use this EXACT format:

## Database

### Entities
| Entity | Table | Key Fields | Reference |
|--------|-------|------------|-----------|
| [Name] | [snake_case] | [main fields] | Similar: `[path/to/similar/entity]` |

### Migration
- [Action]: [table/column] - [type/constraint]
- Reference: `libs/app-database/migrations/[similar migration]`

### Repository
| Method | Purpose |
|--------|---------|
| [methodName] | [what it does] |

Reference: `libs/app-database/src/repositories/[SimilarRepository].ts`

## Rules
- NO code examples, only structure
- MUST find similar files in codebase for references
- Keep it under 40 lines
```

---

### 4.2 Backend Specialist

**When to create:** Feature requires API, business logic, workers, or events.

**Dispatch prompt:**
```
You are the BACKEND SPECIALIST planning for feature ${FEATURE_ID}.

## Context
Read these files:
- docs/features/${FEATURE_ID}/about.md
- docs/features/${FEATURE_ID}/discovery.md
- docs/features/${FEATURE_ID}/.plan-database.md (if exists)
- CLAUDE.md (backend section)

## Your Task
Create the backend planning section covering: API, Commands, Events, Workers (if needed).
Search the codebase for similar modules to use as references.

## Output Format
Write to: docs/features/${FEATURE_ID}/.plan-backend.md

Use this EXACT format:

## Backend

### Endpoints
| Method | Path | Request DTO | Response DTO | Purpose |
|--------|------|-------------|--------------|---------|
| [METHOD] | /api/v1/[path] | [DtoName] | [DtoName] | [~10 words] |

### DTOs
| DTO | Fields | Validations |
|-----|--------|-------------|
| [CreateXxxDto] | field1: type, field2: type | field1: required |
| [XxxResponseDto] | id, field1, createdAt | - |

### Commands
| Command | Triggered By | Actions |
|---------|--------------|---------|
| [CreateXxxCommand] | Controller | Validate, persist, emit event |

### Events
| Event | Payload Fields | Consumers |
|-------|----------------|-----------|
| [XxxCreatedEvent] | id, accountId | AuditWorker |

### Workers (if applicable)
| Queue | Job | Trigger | Action |
|-------|-----|---------|--------|
| [queue-name] | [JobName] | [Event/Schedule] | [what it does] |

### Module Structure
api/modules/[feature]/
├── dtos/
├── commands/handlers/
├── events/handlers/
├── [feature].controller.ts
├── [feature].service.ts
└── [feature].module.ts

Reference: `apps/backend/src/api/modules/[similar module]/`

## Rules
- NO code examples, only contracts
- MUST find similar module for reference
- Combine API + Workers in same section
- Keep it under 60 lines
```

---

### 4.3 Frontend Specialist

**When to create:** Feature requires UI changes.

**Dispatch prompt:**
```
You are the FRONTEND SPECIALIST planning for feature ${FEATURE_ID}.

## Context
Read these files:
- docs/features/${FEATURE_ID}/about.md
- docs/features/${FEATURE_ID}/discovery.md
- docs/features/${FEATURE_ID}/.plan-backend.md (if exists, for API contracts)
- CLAUDE.md (frontend section)

## Your Task
Create the frontend planning section. Search the codebase for similar pages/components to use as references.

## Output Format
Write to: docs/features/${FEATURE_ID}/.plan-frontend.md

Use this EXACT format:

## Frontend

### Pages
| Route | Page Component | Purpose |
|-------|----------------|---------|
| /[path] | [PageName] | [~10 words] |

### Components
| Component | Location | Purpose |
|-----------|----------|---------|
| [ComponentName] | components/[folder]/ | [~10 words] |

### Hooks & State
| Hook/Store | Type | Purpose |
|------------|------|---------|
| use[Feature]() | TanStack Query | CRUD operations |
| [feature]Store | Zustand | Local UI state (if needed) |

### Types (mirror from backend)
| Type | Fields | Source DTO |
|------|--------|------------|
| [TypeName] | field1, field2 | CreateXxxDto |

Reference: `apps/frontend/src/pages/[similar].tsx`, `apps/frontend/src/hooks/[similar].ts`

## Rules
- NO code examples, only structure
- Types MUST mirror backend DTOs
- MUST find similar files for references
- Keep it under 40 lines
```

---

## Phase 5: Consolidate Plan

After ALL subagents complete, consolidate the plan.

### Step 1: Generate Overview and Flow

Based on all subagent outputs, write:
- **Overview**: 1-2 paragraphs summarizing the feature
- **Main Flow**: Numbered list of the primary user journey
- **Implementation Order**: Ordered list respecting dependencies

### Step 2: Concatenate Files

```bash
cd "docs/features/${FEATURE_ID}"

# Create final plan.md
echo "# Plan: ${FEATURE_ID}" > plan.md
echo "" >> plan.md
echo "## Overview" >> plan.md
echo "[Write 1-2 paragraphs here]" >> plan.md
echo "" >> plan.md
echo "---" >> plan.md

# Append each section if exists
[ -f .plan-database.md ] && cat .plan-database.md >> plan.md && echo "" >> plan.md && echo "---" >> plan.md
[ -f .plan-backend.md ] && cat .plan-backend.md >> plan.md && echo "" >> plan.md && echo "---" >> plan.md
[ -f .plan-frontend.md ] && cat .plan-frontend.md >> plan.md && echo "" >> plan.md && echo "---" >> plan.md

# Clean up temporary files
rm -f .plan-*.md
```

### Step 3: Add Footer Sections

Append to plan.md:

```markdown
## Main Flow
1. [Step 1 - Actor → Action]
2. [Step 2 - Actor → Action]
3. [Continue as needed...]

## Implementation Order
1. **Database**: [list items if applicable]
2. **Backend**: [list items]
3. **Frontend**: [list items if applicable]

## Quick Reference
| Pattern | Example File |
|---------|--------------|
| Entity | `libs/domain/src/entities/[Similar].ts` |
| Repository | `libs/app-database/src/repositories/[Similar]Repository.ts` |
| Controller | `apps/backend/src/api/modules/[similar]/[similar].controller.ts` |
| Command | `apps/backend/src/api/modules/[similar]/commands/[Similar]Command.ts` |
| Frontend Hook | `apps/frontend/src/hooks/use[Similar].ts` |
| Frontend Page | `apps/frontend/src/pages/[similar].tsx` |
```

---

## Phase 6: Completion

### Commit the Plan

```bash
git add "docs/features/${FEATURE_ID}/plan.md"
git commit -m "docs: add technical plan for ${FEATURE_ID}

Created concise technical planning document:
- Contracts and interfaces defined
- Implementation order specified
- Reference files identified

Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

git push
```

### Inform the User

```markdown
✅ **Planejamento Técnico Concluído!**

**Feature:** ${FEATURE_ID}
**Documento:** `docs/features/${FEATURE_ID}/plan.md`

**Conteúdo:**
- [X] Contratos de API (Y endpoints)
- [X] DTOs e validações
- [X] Commands e Events
- [X] Estrutura de módulos
- [X] Referências para arquivos similares

**Próximo passo:** Revise o plano e execute `/dev` para implementar.
```

---

## Critical Rules

**DO:**
- Keep plan under 150 lines total
- Use tables for structured data
- Reference similar files, don't write code
- Only create subagents the feature needs
- Execute subagents sequentially
- Delete temporary .plan-*.md files after consolidation

**DO NOT:**
- Write implementation code
- Create verbose descriptions
- Include testing strategy (follow project patterns)
- Add unnecessary sections
- Create subagents for components not in scope

---

## Plan Quality Checklist

Before completing, verify:

- [ ] Plan is under 150 lines
- [ ] All contracts use tables (not prose)
- [ ] Every section has a Reference to similar file
- [ ] No code blocks with implementation
- [ ] Flow is numbered list (not ASCII/Mermaid)
- [ ] Implementation order is clear
- [ ] Temporary files deleted

---

## Example: Minimal Plan (Backend-Only Feature)

```markdown
# Plan: F0012-api-health-check

## Overview
Add health check endpoint for monitoring. Returns API status and version.

---

## Backend

### Endpoints
| Method | Path | Request DTO | Response DTO | Purpose |
|--------|------|-------------|--------------|---------|
| GET | /api/v1/health | - | HealthResponseDto | Return API status |

### DTOs
| DTO | Fields | Validations |
|-----|--------|-------------|
| HealthResponseDto | status, version, timestamp | - |

Reference: `apps/backend/src/api/modules/auth/auth.controller.ts`

---

## Main Flow
1. Client → GET /api/v1/health
2. Controller → Build response with status/version
3. Response → HealthResponseDto

## Implementation Order
1. **Backend**: DTO, Controller endpoint, register route

## Quick Reference
| Pattern | Example File |
|---------|--------------|
| Controller | `apps/backend/src/api/modules/auth/auth.controller.ts` |
| DTO | `apps/backend/src/api/modules/auth/dtos/` |
```

**Total: ~35 lines** - This is the goal for simple features.
