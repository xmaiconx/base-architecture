---
name: updating-claude-documentation
description: |
  **ALWAYS use (NEVER edit CLAUDE.md directly)** when user says: "atualizar CLAUDE.md", "verificar CLAUDE.md", "sincronizar documentação", "check if CLAUDE.md is up to date", or after adding apps/libs/modules/services/architectural changes. Systematic verification prevents documentation drift (project)
---

# Updating Claude Documentation

## 🚨 CRITICAL: NEVER EDIT CLAUDE.md DIRECTLY

**ALWAYS invoke this skill** instead of using Edit tool on CLAUDE.md.

**Trigger Phrases (use skill immediately when you see these)**:
- "atualizar CLAUDE.md" / "update CLAUDE.md"
- "verificar se CLAUDE.md está atualizado" / "check if CLAUDE.md is up to date"
- "sincronizar documentação" / "sync documentation"
- "CLAUDE.md está desatualizado" / "documentation is outdated"
- After adding libs, modules, services, or architectural changes

**Why This Matters**:
Manual edits skip systematic verification and introduce inconsistencies. This skill ensures:
1. ✅ Verification against actual codebase state
2. ✅ Concise, accurate updates (no verbosity)
3. ✅ No missed conventions or architectural patterns
4. ✅ Consistency with existing tone/format

## Overview

Project documentation (CLAUDE.md) is architectural source of truth for onboarding, AI assistants, and team alignment. It MUST reflect actual codebase state, not aspirations. This skill prevents documentation drift through systematic verification before updates, enforcing brevity (~50 words per concept), and maintaining consistency with established patterns.

**Core Principle**: Documentation is code. Outdated docs are worse than no docs - they mislead and erode trust.

## When to Use

**ALWAYS use this skill when:**
- Adding/removing packages in the monorepo (apps/*, libs/*)
- Introducing new architectural patterns (CQRS handlers, event patterns, etc.)
- Changing core infrastructure (database, queues, event brokers)
- Modifying tech stack dependencies (major version bumps, library swaps)
- Before onboarding new team members (verify freshness)
- After 5+ feature commits without doc updates

**ESPECIALLY when:**
- You hear yourself say "I'll document this later"
- Pull request reviewer asks "Is CLAUDE.md updated?"
- New developer asks "Where is [feature] documented?" and it's missing
- Git diff shows changes to shared.module.ts, worker.module.ts, or package.json

**Don't skip when:**
- "It's just a small change" - small changes accumulate into big drift
- "Everyone already knows this" - onboarding and AI don't
- "The code is self-documenting" - architecture and conventions are not

## The Iron Law

```
DOCUMENTATION IS CODE: ALWAYS VERIFY BEFORE UPDATING
Never document aspirations, guesses, or "should work" architectures.
Read actual code, check git log, verify imports. Evidence first, docs second.
```

## The Update Process

### Phase 1: Audit Current State

**Objective**: Identify gaps between CLAUDE.md and codebase reality.

**Steps**:
0. **⚠️ MANDATÓRIO: Verify master-instructions directive exists**:
   ```bash
   grep -q "master-instructions.md" CLAUDE.md
   ```
   **If NOT found**, you MUST add this block at the very top of CLAUDE.md (after the title):
   ```markdown
   ## Master Instructions
   @.claude/master-instructions.md
   ```
   This is **non-negotiable**. No CLAUDE.md updates proceed without this directive.

1. **Check recent commits** for architectural changes:
   ```bash
   git log --oneline -20 --name-status
   ```
   Look for: new modules, deleted files, dependency changes, shared service updates

2. **Verify monorepo structure**:
   ```bash
   ls apps/ libs/
   ```
   Compare against CLAUDE.md "Estrutura do Monorepo" section

3. **Check package.json dependencies** for stack changes:
   ```bash
   grep -A5 "dependencies" apps/backend/package.json
   ```

4. **Scan shared.module.ts and worker.module.ts**:
   - New providers = new documentation needed
   - Deleted providers = remove from docs
   - Changed DI tokens = update examples

**Red Flags**:
- ❌ **CRITICAL**: Skipping master-instructions directive verification in CLAUDE.md
- ❌ Skipping `.claude/master-instructions.md` ("I know the patterns already")
- ❌ Skipping git log review ("I remember what changed")
- ❌ Assuming CLAUDE.md is correct without verification
- ❌ Documenting based on memory, not code inspection

### Phase 2: Map Technology Stack

**Objective**: Describe libs/apps concisely (~50 words each).

**Template** (per lib/app):
```
### [Package Name]
**Purpose**: [What problem it solves] (10-15 words)
**Key Components**: [Main exports/modules] (15-20 words)
**Dependencies**: [Critical integrations] (10-15 words)
```

**Examples**:

<Good>
### @agentics/domain
**Purpose**: Pure domain layer with entities, enums, and business rules. No external dependencies.
**Key Components**: Account, User, Workspace entities; UserRole, EntityStatus enums; domain interfaces.
**Dependencies**: Zero dependencies (pure TypeScript).
</Good>

<Bad>
### @agentics/domain
This package contains all the domain entities and stuff we use across the application. It has users, accounts, workspaces, and lots of other things. We also have some enums here for statuses and roles. It's really important because everything depends on it. We try to keep it clean and follow DDD principles as much as possible. There are also some value objects we might add later.

**Problem**: 73 words (too long), vague ("stuff", "things"), includes aspirations ("might add later").
</Bad>

**Guidelines**:
- Target: 40-60 words total
- Be specific: "Kysely 0.27 for type-safe queries" not "database stuff"
- List concrete exports: "EmailQueueService, ResendEmailService" not "various services"
- Omit obvious details: Don't say "written in TypeScript" for every package

### Phase 3: Update Affected Sections

**Objective**: Modify only sections impacted by changes, preserving style.

**CLAUDE.md Section Map**:
1. **Stack Tecnológica** - Dependencies, versions, core libs
2. **Clean Architecture** - Monorepo structure (apps/*, libs/*)
3. **Convenções de Nomenclatura** - Naming patterns (if new patterns added)
4. **File Structure & Separation of Concerns** - New modules or file conventions
5. **Backend Architecture** - Shared.module, worker.module, CQRS updates
6. **Padrões Arquiteturais** - New patterns (factories, strategies, etc.)
7. **Multi-Tenancy** - Tenant isolation changes
8. **Database** - Schema updates, new tables, migrations
9. **Configuration & Environment** - New env vars
10. **Scripts Disponíveis** - New npm scripts
11. **Frontend Architecture** - New pages, stores, components
12. **Best Practices** - New conventions or anti-patterns
13. **Observability** - Logging/monitoring changes
14. **Configuration Best Practices** - Service configuration patterns
15. **Key Files** - New critical files (module roots, etc.)
16. **Design Principles** - Rarely changes

**Update Strategy**:
- ✅ Locate exact subsection needing update
- ✅ Preserve existing tone and format (emoji, checkmarks, structure)
- ✅ Keep examples minimal (5-10 lines max)
- ✅ Use ✅/❌ for best practices
- ✅ Add "Por quê?" explanations for non-obvious rules

**Red Flags**:
- ❌ Rewriting entire sections when only one subsection changed
- ❌ Changing tone from concise to verbose
- ❌ Adding 50-line code examples (use 5-10 lines)
- ❌ Removing existing good examples to make room for new ones (expand section instead)

### Phase 4: Verify Consistency

**Objective**: Ensure update matches established patterns.

**Checklist**:
- [ ] **Master Instructions Directive**: CLAUDE.md contains the master-instructions.md reference at top
- [ ] **Master Instructions Read**: Read `.claude/master-instructions.md` before making updates
- [ ] **Brevity**: No single paragraph exceeds 100 words
- [ ] **Examples**: Code blocks are 5-15 lines, not 50+
- [ ] **Specificity**: Mentions concrete files/classes (e.g., "apps/backend/src/shared/shared.module.ts")
- [ ] **Versions**: Includes version numbers for dependencies (e.g., "NestJS 10", "Kysely 0.27")
- [ ] **Formatting**:
  - [ ] Section headers use emoji (📋, 🏗️, 🔧, etc.)
  - [ ] Code blocks specify language (```typescript, ```bash, etc.)
  - [ ] Best practices use ✅/❌ prefixes
  - [ ] Conventions use camelCase, PascalCase, snake_case formatting
- [ ] **Cross-references**: File paths match actual structure
- [ ] **Tone**: Portuguese headers, English code terms, no excessive politeness

**Verification Commands**:
```bash
# Verify file paths mentioned in docs exist
grep -oP '`[^`]+\.(ts|js|json|yml)`' CLAUDE.md | sort -u

# Check for outdated package names
grep "@agentics" CLAUDE.md

# Validate referenced files exist
cat apps/backend/src/shared/shared.module.ts > /dev/null
```

**Red Flags**:
- ❌ "Looks good enough" without running verification commands
- ❌ Skipping format consistency check (emoji, checkmarks)
- ❌ Not testing referenced file paths

## Common Rationalizations (and Reality)

| Excuse | Reality |
|--------|---------|
| "Master-instructions directive is already there" | Verify with grep. Trust but verify. Takes 2 seconds. |
| "I'll document this later" | Later never comes. Do it now while context is fresh. |
| "It's just a small change" | Small changes accumulate. Broken window theory applies. |
| "The code is self-documenting" | Architecture, conventions, and "why" decisions are not in code. |
| "Everyone on the team knows this" | Onboarding, future you, and AI assistants don't. |
| "Documentation always gets outdated anyway" | Only if you don't maintain it. This skill prevents that. |
| "I'm too tired to write docs now" | Then you're too tired to merge. Docs = part of done. |

## Red Flags: You're Violating the Spirit

Watch for these thoughts/statements:
- "The master-instructions directive is probably already in CLAUDE.md" (verify first!)
- "I'll add a TODO comment to document this later"
- "Let me just push this, docs can wait"
- "It works, that's what matters" (without updating CLAUDE.md)
- "Nobody reads this anyway"
- Writing aspirational docs: "This will support X feature" (not yet implemented)
- Copy-pasting from old docs without verifying current code
- Adding verbose explanations that belong in comments, not architecture docs
- Documenting implementation details instead of patterns/conventions

## Quick Reference: Writing Patterns

### Master-Instructions Directive (MANDATORY at top of CLAUDE.md)
```markdown
# [Project Name] - Development Guide

⚠️ **IMPORTANTE**: Antes de ler este documento, SEMPRE consulte `.claude/master-instructions.md` primeiro. Este arquivo contém diretrizes meta que governam todas as convenções e padrões descritos aqui.

## [First section...]
```

### Package Description Template (~50 words)
```
**Purpose**: [Problem solved in 10-15 words]
**Key Components**: [Main exports, 15-20 words]
**Dependencies**: [Critical integrations, 10-15 words]
```

### Code Example Guidelines
- Max 10 lines per example
- Show correct pattern, not full implementation
- Use comments for clarity: `// ✅ CORRETO` or `// ❌ ERRADO`
- Include file path reference: `// apps/backend/src/shared/shared.module.ts`

### Best Practice Format
```
✅ Always inject ILoggerService interface, never concrete WinstonLoggerService
❌ Never inject ConfigService directly, always use IConfigurationService
```

### Section Update Checklist
When adding new architectural pattern:
- [ ] Add to "Padrões Arquiteturais" with brief description
- [ ] Update "Backend Architecture" if affects modules
- [ ] Add example to "Best Practices" (✅/❌)
- [ ] Reference in "Key Files" if introduces new critical file
- [ ] Total addition: 100-200 words maximum

## Integration with Other Skills

**Use before this skill**:
- `systematic-debugging` - If unsure what changed, debug the codebase first
- `root-cause-tracing` - Trace architectural changes back to requirements

**Use after this skill**:
- `verification-before-completion` - Always verify paths/commands in docs work
- `requesting-code-review` - Have docs reviewed as part of PR

**Related skills**:
- `writing-plans` - Plans often become documentation sections
- `test-driven-development` - Testing patterns belong in CLAUDE.md

## Real-World Impact

**Scenario 0: Missing Master-Instructions Directive**
```
CLAUDE.md exists but has no reference to .claude/master-instructions.md

Impact: Developer/AI reads CLAUDE.md, misses meta-directives in master-instructions.
Applies outdated or wrong conventions. Creates inconsistent code.

Fix: Add directive at top of CLAUDE.md (Step 0 of Phase 1). Takes 10 seconds.
Result: 100% compliance with meta-level documentation governance.
```

**Scenario 1: Outdated Monorepo Structure**
```
Git log shows: "Add libs/mercadophone package"
CLAUDE.md shows:
  libs/
  ├── domain/
  ├── api-contracts/
  ├── backend/
  └── app-database/

Missing: libs/mercadophone

Impact: New developer clones repo, reads CLAUDE.md, confused by unlisted package.
Fix: 30 seconds to add libs/mercadophone to diagram + 50-word description.
```

**Scenario 2: Event Broker Evolution**
```
Git log shows: "Replace EventBrokerService with BullMQEventBrokerService"
CLAUDE.md still references: "IEventBroker → EventBrokerService"

Impact: AI assistant suggests old EventBrokerService in new code.
Fix: Update Shared Module section, add migration note, 2 minutes.
```

## Final Note: Documentation is a Feature

Treat CLAUDE.md updates with the same rigor as code:
- Review in PRs
- Run verification commands
- Test that paths/examples work
- Enforce in CI (future: lint docs for broken paths)

**Evidence before claims**: If you document a pattern, verify it exists in code first.

No exceptions. No "later". No rationalization.
