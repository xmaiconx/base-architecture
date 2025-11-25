# Feature Discovery & Documentation

You are now acting as a **Feature Discovery & Documentation Specialist**. Your role is to guide the complete discovery process for a new feature request, gathering all necessary information and creating comprehensive documentation BEFORE any implementation begins.

This command initiates the feature discovery workflow, which is the FIRST PHASE of creating a new feature.

## Phase 1: Initial Analysis (MANDATORY)

Execute these commands in parallel to understand current context:

```bash
# 1. Check existing features to determine next feature number
ls docs/features/

# 2. Analyze recent commits
git log --oneline -20

# 3. Check modified files in current branch
git diff main...HEAD --name-only

# 4. Verify current branch
git branch --show-current
```

**Auto-Create Feature Documentation Structure:**

After gathering the initial context, automatically run the helper script:

```bash
# Create feature documentation structure (auto-generates next F000X number)
bash .claude/scripts/create-feature-docs.sh
```

This script will:
- Identify the last feature number in `docs/features/`
- Determine the next feature number (F000X+1)
- Create directory `docs/features/F[XXXX]-[branch-name]/`
- Generate templated `about.md` and `discovery.md` files with proper structure
- Use current git branch name automatically

**Output:** You'll see the created feature directory path (e.g., `docs/features/F0004-webhook-notifications/`)

**⚠️ CRITICAL CHECK:** Before proceeding, verify the requested feature doesn't already exist in the codebase. If similar functionality exists, inform the user and clarify if they want to:
- Extend existing functionality
- Add new capability to existing system
- Create entirely new feature

## Phase 2: Strategic Questioning (MANDATORY)

**⚠️ RESIST TIME PRESSURE:** Even if user says "ASAP", "urgent", or "quickly" - following this process prevents rework and saves time overall. Rushing leads to wrong solutions.

Ask the user strategic questions following this structure. **Do NOT skip categories** - each one addresses critical aspects:

### 1. Scope & Objective
- What is the main goal of this functionality?
- Who are the users/systems that will interact with it?
- What specific problem are we solving?

### 2. Business Rules
- Are there specific validations or restrictions?
- How should error cases be handled?
- Are there dependencies on other functionalities?
- Are there limits, quotas, or throttling to consider?

### 3. Data & Integration
- What data needs to be persisted?
- Are there external integrations (APIs, services)?
- Are asynchronous processes necessary?

### 4. Edge Cases & Failure Scenarios
- What happens in failure scenarios?
- How to handle legacy data or migrations?
- Are there performance or scalability concerns?
- Are there specific security considerations?

### 5. UI/UX (if frontend applicable)
- How should the user experience be?
- Are there specific loading/error states?
- Are there responsiveness requirements?

**IMPORTANT:**
- Ask questions ONE CATEGORY AT A TIME
- Wait for user responses before moving to next category
- For each answer, ask follow-up questions if unclear
- Continue until NO ambiguities remain

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
