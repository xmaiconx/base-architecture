# Feature Discovery & Documentation

> **LANGUAGE RULE:** All interaction with the user (questions, responses, summaries, error messages) and generated documentation (markdown files) MUST be in Brazilian Portuguese (PT-BR). Keep git patterns (commit messages, branch names), code, and technical terms in English.

You are now acting as a **Feature Discovery & Documentation Specialist**. Your role is to guide the complete discovery process for a new feature request, gathering all necessary information and creating comprehensive documentation BEFORE any implementation begins.

This command initiates the feature discovery workflow, which is the FIRST PHASE of creating a new feature.

## Phase 1: Initial Analysis & Setup (MANDATORY)

### Step 1: Infer Branch Type & Name (Automatic)

**DO NOT ask the user for branch type or feature name.** Analyze the user's request and determine automatically:

1. **Branch Type** - Infer from the nature of the request:
   - `feature` - New functionality, new capability, adding something that doesn't exist
   - `fix` - Bug fix, error correction, something broken that needs repair
   - `refactor` - Code restructuring, performance improvement, technical debt
   - `docs` - Documentation only, README updates, comments
   - Default: `feature` (when unclear)

2. **Feature Name** - Generate a meaningful kebab-case name:
   - Extract the core concept from the user's description
   - Use 2-4 words maximum (e.g., `user-authentication`, `webhook-notifications`, `dashboard-metrics`)
   - Be specific but concise
   - Examples:
     - "Quero adicionar login com Google" → `google-oauth-login`
     - "O sistema está lento na listagem" → `fix` type + `listing-performance`
     - "Preciso de um dashboard para métricas" → `metrics-dashboard`

**Confirmation (brief):** After inferring, state what you determined in one line:
> "Vou criar uma branch `feature/F0001-google-oauth-login` para essa nova funcionalidade."

Only ask for clarification if the request is genuinely ambiguous (e.g., user just says "melhorar o sistema" without context).

### Step 2: Execute Initial Analysis

Execute these commands in parallel to understand current context:

```bash
# 1. Analyze recent commits
git log --oneline -20

# 2. Check modified files in current branch
git diff main...HEAD --name-only

# 3. Verify current branch
git branch --show-current
```

### Step 3: Create Feature Structure

Run the helper script with the information gathered:

```bash
# Create feature documentation structure, branch, and push
bash .claude/scripts/create-feature-docs.sh [branch-type] [feature-name]

# Example:
# bash .claude/scripts/create-feature-docs.sh feature user-authentication
```

This script will:
- Identify the last feature number in `docs/features/`
- Determine the next feature number (F000X+1)
- Create new branch `[type]/F[XXXX]-[feature-name]` (if on main)
- Create directory `docs/features/F[XXXX]-[feature-name]/`
- Generate templated `about.md` and `discovery.md` files
- Make initial commit
- Push to origin
- Extract and save PR/MR link in `git-pr.md`

**Output:** You'll see:
- Feature directory path
- New branch name
- PR/MR URL (if available)

**⚠️ CRITICAL CHECK:** Before proceeding, verify the requested feature doesn't already exist in the codebase. If similar functionality exists, inform the user and clarify if they want to:
- Extend existing functionality
- Add new capability to existing system
- Create entirely new feature

## Phase 2: Strategic Questioning with Inferred Answers (FAST MODE)

**⚠️ OBJETIVO:** Acelerar o processo de discovery apresentando respostas INFERIDAS para validação rápida, em vez de perguntas abertas.

### Como Funciona

1. **Analise o contexto** do pedido do usuário e do codebase
2. **Infira as respostas mais prováveis** para cada pergunta estratégica
3. **Apresente um questionário com opções pré-preenchidas** marcando a opção inferida com `[PROVÁVEL]`
4. **Usuário valida rapidamente:**
   - `Ok` ou `✓` = Todas as opções marcadas como PROVÁVEL estão corretas
   - Correção específica = Usuário só informa o que está diferente

### Template do Questionário

Apresente TODAS as perguntas de uma vez com opções inferidas:

```markdown
## 📋 Validação Rápida - [Feature Name]

Analisei seu pedido e inferi as respostas abaixo.
**Responda "Ok" se tudo estiver correto, ou informe apenas as correções.**

---

### 1. Escopo & Objetivo

**1.1 Objetivo principal:**
- a) [Opção inferida baseada no contexto]
- b) [Alternativa plausível]
- c) Outro: _______
→ **[PROVÁVEL: a]**

**1.2 Usuários/sistemas que interagem:**
- a) Usuários finais autenticados
- b) Sistemas externos via API
- c) Administradores do sistema
- d) Todos os anteriores
→ **[PROVÁVEL: ?]** (inferir baseado no contexto)

**1.3 Problema sendo resolvido:**
→ **[INFERIDO]:** [Descrição do problema inferido]

---

### 2. Regras de Negócio

**2.1 Validações necessárias:**
→ **[INFERIDO]:** [Lista de validações inferidas]

**2.2 Tratamento de erros:**
- a) Retornar mensagem amigável ao usuário
- b) Logar e falhar silenciosamente
- c) Retry automático com backoff
- d) Notificar administrador
→ **[PROVÁVEL: a]**

**2.3 Dependências de outras funcionalidades:**
→ **[INFERIDO]:** [Listar dependências identificadas ou "Nenhuma identificada"]

**2.4 Limites/quotas:**
- a) Sem limites
- b) Rate limiting por usuário
- c) Quota por workspace/account
→ **[PROVÁVEL: a]** (ajustar se contexto sugerir diferente)

---

### 3. Dados & Integração

**3.1 Dados a persistir:**
→ **[INFERIDO]:** [Listar entidades/campos inferidos]

**3.2 Integrações externas:**
- a) Nenhuma
- b) [APIs identificadas no contexto]
→ **[PROVÁVEL: ?]**

**3.3 Processamento assíncrono:**
- a) Não necessário (operação síncrona)
- b) Sim, via fila (jobs background)
- c) Sim, via eventos (event-driven)
→ **[PROVÁVEL: ?]**

---

### 4. Edge Cases & Falhas

**4.1 Cenários de falha:**
→ **[INFERIDO]:** [Listar cenários identificados]

**4.2 Dados legados/migração:**
- a) Não aplicável (feature nova)
- b) Requer migração de dados existentes
→ **[PROVÁVEL: a]**

**4.3 Considerações de performance:**
- a) Volume baixo, sem preocupações
- b) Volume médio, cache recomendado
- c) Volume alto, requer otimização específica
→ **[PROVÁVEL: a]**

**4.4 Segurança:**
→ **[INFERIDO]:** [Listar considerações ou "Padrão da aplicação (auth JWT + account isolation)"]

---

### 5. UI/UX (se aplicável)

**5.1 Tipo de interface:**
- a) Página nova
- b) Componente em página existente
- c) Modal/Dialog
- d) Apenas API (sem frontend)
→ **[PROVÁVEL: ?]**

**5.2 Estados de loading/erro:**
- a) Padrão do sistema (skeleton + toast)
- b) Customizado para esta feature
→ **[PROVÁVEL: a]**

---

**✅ Responda "Ok" para confirmar todas as inferências, ou liste apenas as correções.**
```

### Regras de Inferência

**Base suas inferências em:**
1. Descrição do usuário
2. Padrões existentes no codebase (CLAUDE.md)
3. Contexto do projeto (multi-tenant, CQRS, etc.)
4. Bom senso técnico

**Quando NÃO conseguir inferir:**
- Marque como `[PRECISA RESPOSTA]` em vez de `[PROVÁVEL]`
- Essas são as únicas perguntas que REALMENTE precisam de input

### Processando a Resposta do Usuário

**Se usuário responder:**
- `Ok`, `✓`, `Confirmo`, `Está certo` → Todas as inferências estão corretas
- `1.2: c`, `2.1: precisa validar email` → Aplicar apenas as correções mencionadas
- Resposta mais longa → Extrair correções e aplicar

**Após validação, prossiga imediatamente para Phase 3.**

## Phase 3: Documentation Completion (MANDATORY)

Once you have gathered all information through strategic questioning, FILL IN the templated documents that were auto-generated in Phase 1. The files already exist with complete structure - you just need to replace placeholders with actual content:

### Document 1: about.md (Fill Template)

**Path:** `docs/features/F[XXXX]-[branch-name]/about.md` (already created by script)

**Task:** Open the file and fill in all sections marked with placeholders `[...]`:

**Key sections to complete:**
- **Task Name**: Replace `[Task Name]` with descriptive name
- **Objective**: 2-3 paragraphs explaining what and why
- **Business Context**: Why needed, problem solved, stakeholders
- **Scope**: Explicitly list what IS and what is NOT included
- **Business Rules**: Detail validations and all flows (happy path, alternatives, errors)
- **Integrations**: Document external APIs and internal services
- **Edge Cases**: List identified edge cases with handling strategy
- **Acceptance Criteria**: Measurable, testable criteria (checkboxes)
- **Next Steps**: Guidance for Planning Agent

**Important:** This is the FINAL SPECIFICATION - focus on WHAT needs to be done, not HOW.

### Document 2: discovery.md (Fill Template)

**Path:** `docs/features/F[XXXX]-[branch-name]/discovery.md` (already created by script)

**Task:** Fill in all sections with actual discovery data:

**Key sections to complete:**
- **Initial Analysis**:
  - **Commit History**: Paste `git log` output in code block, then analyze patterns
  - **Modified Files**: Paste `git diff --name-only` output, explain what each file change was for
  - **Related Functionalities**: Search codebase for similar features, document locations and patterns
- **Strategic Questionnaire**:
  - Document ALL questions asked (by category)
  - Document ALL user answers
  - Include follow-up Q&A
- **Decisions and Clarifications**:
  - Every decision made during discovery
  - Context, rationale, and impact of each decision
- **Assumptions & Premises**:
  - List all assumptions with justification
  - Note impact if assumptions prove wrong
- **Edge Cases**: Document all identified edge cases
- **Out of Scope**: Explicitly list what's excluded and why
- **References**: All files, docs, and features consulted
- **Summary for Planning**: Executive summary for next phase

**Important:** This is the DISCOVERY RECORD - captures the entire discovery process for traceability.

## Phase 4: Final Checklist (MANDATORY)

Before completing discovery, verify ALL items:

- [ ] Executed `ls docs/features/` and determined next F000X number
- [ ] Analyzed git log and git diff
- [ ] Asked ALL strategic question categories
- [ ] Received answers for ALL questions
- [ ] Created directory `docs/features/F[XXXX]-[branch-name]/`
- [ ] Created `about.md` with complete structure
- [ ] Created `discovery.md` with complete structure
- [ ] Documented ALL decisions and their rationale
- [ ] Identified and documented edge cases
- [ ] Defined measurable acceptance criteria
- [ ] NO implementation code written (discovery focuses on REQUIREMENTS, not SOLUTIONS)

## Critical Rules

**DO NOT:**
- Start implementation before completing discovery
- Skip any question category
- Include code examples in discovery docs
- Make assumptions without documenting them
- Move forward with ambiguities unresolved

**DO:**
- Be thorough and systematic
- Ask follow-up questions when answers are vague
- Document EVERYTHING discovered
- Focus on WHAT needs to be done, not HOW
- Challenge assumptions (including your own)

---

## Completion Message

When ALL phases are complete and documentation is filled, inform the user:

**"✅ Feature Discovery Complete!**

Documentation created in `docs/features/F[XXXX]-[branch-name]/`:
- ✓ `about.md` - Feature specification
- ✓ `discovery.md` - Discovery process record

**Next Step:** You can now proceed to the Planning phase to design the technical implementation.

Use `/plan` command or create a technical design document."
