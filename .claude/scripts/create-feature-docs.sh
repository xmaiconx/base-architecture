#!/bin/bash

# Script to create next feature documentation structure
# Usage: ./create-feature-docs.sh [branch-name]
# If branch-name is not provided, uses current git branch

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get branch name (from argument or current branch)
if [ -z "$1" ]; then
    BRANCH_NAME=$(git branch --show-current)
    echo -e "${BLUE}Using current branch: ${BRANCH_NAME}${NC}"
else
    BRANCH_NAME="$1"
    echo -e "${BLUE}Using provided branch: ${BRANCH_NAME}${NC}"
fi

# Features directory
FEATURES_DIR="docs/features"

# Find the last feature number
LAST_FEATURE=$(ls -1 "$FEATURES_DIR" 2>/dev/null | grep -E '^F[0-9]{4}-' | sort -r | head -1 || echo "")

if [ -z "$LAST_FEATURE" ]; then
    # No features exist yet, start with F0001
    NEXT_NUMBER="0001"
    echo -e "${YELLOW}No existing features found. Starting with F0001${NC}"
else
    # Extract number from last feature (e.g., F0003 -> 0003)
    LAST_NUMBER=$(echo "$LAST_FEATURE" | grep -oE 'F[0-9]{4}' | grep -oE '[0-9]{4}')
    # Increment and format with leading zeros
    NEXT_NUMBER=$(printf "%04d" $((10#$LAST_NUMBER + 1)))
    echo -e "${GREEN}Last feature: ${LAST_FEATURE}${NC}"
fi

# Create feature directory name
FEATURE_DIR="F${NEXT_NUMBER}-${BRANCH_NAME}"
FEATURE_PATH="${FEATURES_DIR}/${FEATURE_DIR}"

echo -e "${BLUE}Creating feature: ${FEATURE_DIR}${NC}"

# Create directory
mkdir -p "$FEATURE_PATH"

# Get current date
CURRENT_DATE=$(date +%Y-%m-%d)

# Create about.md template
cat > "${FEATURE_PATH}/about.md" << 'EOF'
# Task: [Task Name]

**Branch:** BRANCH_NAME
**Date:** CURRENT_DATE

## Objective

[Clear description of main objective - 2-3 paragraphs explaining what this feature does and why it exists]

## Business Context

**Why this functionality is needed:**
[Explain the business need or opportunity]

**What problem it solves:**
[Describe the specific problem or pain point]

**Who are the stakeholders:**
[List stakeholders: end users, internal teams, external partners, etc.]

## Scope

### What IS included
- [Item 1: Specific functionality that will be implemented]
- [Item 2: Another included feature]
- [Item 3: etc.]

### What is NOT included (out of scope)
- [Item 1: Functionality explicitly excluded]
- [Item 2: Features postponed to future iterations]
- [Item 3: etc.]

## Business Rules

### Validations
1. **[Validation Name]**: [Detailed description of validation rule]
2. **[Validation Name]**: [Detailed description of validation rule]

### Flows

#### 1. Main Flow (Happy Path)
- Step 1: [User/System action]
- Step 2: [System response]
- Step 3: [Next action]
- Step 4: [Final outcome]

#### 2. Alternative Flows

**Scenario A: [Name]**
- [Description of alternative scenario]
- [How system should behave]

**Scenario B: [Name]**
- [Description of alternative scenario]
- [How system should behave]

#### 3. Error Flows

**Error Type 1: [Name]**
- Trigger: [What causes this error]
- Handling: [How to handle it]
- User feedback: [What user sees]

**Error Type 2: [Name]**
- Trigger: [What causes this error]
- Handling: [How to handle it]
- User feedback: [What user sees]

## Integrations

### External APIs
- **[API Name]**:
  - Purpose: [Why we need this API]
  - Endpoints: [Relevant endpoints]
  - Authentication: [How we authenticate]

### Internal Services
- **[Service Name]**:
  - Purpose: [How this service will be used]
  - Dependencies: [What this service depends on]

## Edge Cases Identified

1. **[Edge Case Name]**:
   - Description: [What is the edge case]
   - Handling: [How we handle it]

2. **[Edge Case Name]**:
   - Description: [What is the edge case]
   - Handling: [How we handle it]

## Acceptance Criteria

1. [ ] [Criterion 1 - must be measurable and testable]
2. [ ] [Criterion 2 - must be measurable and testable]
3. [ ] [Criterion 3 - must be measurable and testable]

## Next Steps

[Provide guidance for the Planning Agent about what needs to be designed/implemented]
EOF

# Create discovery.md template
cat > "${FEATURE_PATH}/discovery.md" << 'EOF'
# Discovery: [Task Name]

**Branch:** BRANCH_NAME
**Date:** CURRENT_DATE

## Initial Analysis

### Commit History

**Recent commits analyzed:**
```
[Paste git log output here]
```

**Key observations:**
- [Observation 1 about recent work]
- [Observation 2 about patterns in commits]

### Modified Files

**Files already modified in this branch:**
```
[Paste git diff --name-only output here]
```

**Analysis:**
- [File 1]: [What was changed and why]
- [File 2]: [What was changed and why]

### Related Functionalities

**Similar features in codebase:**
- [Feature 1]: [Location and how it's similar]
- [Feature 2]: [Location and how it's similar]

**Patterns identified:**
- [Pattern 1: How similar features are implemented]
- [Pattern 2: Common architectural approach]

## Strategic Questionnaire

### Category 1: Scope & Objective

**Q:** What is the main goal of this functionality?
**A:** [User response]

**Q:** Who are the users/systems that will interact with it?
**A:** [User response]

**Q:** What specific problem are we solving?
**A:** [User response]

### Category 2: Business Rules

**Q:** Are there specific validations or restrictions?
**A:** [User response]

**Q:** How should error cases be handled?
**A:** [User response]

**Q:** Are there dependencies on other functionalities?
**A:** [User response]

**Q:** Are there limits, quotas, or throttling to consider?
**A:** [User response]

### Category 3: Data & Integration

**Q:** What data needs to be persisted?
**A:** [User response]

**Q:** Are there external integrations (APIs, services)?
**A:** [User response]

**Q:** Are asynchronous processes necessary?
**A:** [User response]

### Category 4: Edge Cases & Failure Scenarios

**Q:** What happens in failure scenarios?
**A:** [User response]

**Q:** How to handle legacy data or migrations?
**A:** [User response]

**Q:** Are there performance or scalability concerns?
**A:** [User response]

**Q:** Are there specific security considerations?
**A:** [User response]

### Category 5: UI/UX (if applicable)

**Q:** How should the user experience be?
**A:** [User response]

**Q:** Are there specific loading/error states?
**A:** [User response]

**Q:** Are there responsiveness requirements?
**A:** [User response]

## Decisions and Clarifications

### Decision 1: [Topic]
**Context:** [Why this question/doubt arose during discovery]
**Decision:** [What was decided and by whom]
**Impact:** [Which areas/components are affected by this decision]
**Rationale:** [Why this decision makes sense]

### Decision 2: [Topic]
**Context:** [Why this question/doubt arose]
**Decision:** [What was decided]
**Impact:** [Affected areas]
**Rationale:** [Why this decision makes sense]

## Assumptions & Premises

1. **[Assumption 1]**: [Description and justification]
   - Impact if wrong: [What happens if this assumption is incorrect]

2. **[Assumption 2]**: [Description and justification]
   - Impact if wrong: [What happens if this assumption is incorrect]

## Edge Cases Identified

1. **[Edge Case Name]**:
   - Description: [Detailed description of the edge case]
   - Likelihood: [High/Medium/Low]
   - Handling Strategy: [How we plan to handle it]

2. **[Edge Case Name]**:
   - Description: [Detailed description]
   - Likelihood: [High/Medium/Low]
   - Handling Strategy: [How we plan to handle it]

## Out of Scope Items

1. **[Item Name]** - [Detailed explanation of why it's out of scope]
2. **[Item Name]** - [Detailed explanation of why it's out of scope]

## References

### Codebase Files Consulted
- [File path 1]: [What was learned from it]
- [File path 2]: [What was learned from it]

### Documentation Consulted
- [Document name/path]: [Key insights]
- [Document name/path]: [Key insights]

### Related Functionalities
- [Feature name]: [Location and relevance]
- [Feature name]: [Location and relevance]

## Summary for Planning

**Executive Summary:**
[2-3 paragraphs summarizing the entire discovery process, key decisions, and what the Planning Agent needs to focus on]

**Critical Requirements:**
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

**Technical Constraints:**
- [Constraint 1]
- [Constraint 2]

**Next Phase Focus:**
[What the Planning Agent should prioritize in the technical design]
EOF

# Replace placeholders with actual values
sed -i "s/BRANCH_NAME/${BRANCH_NAME}/g" "${FEATURE_PATH}/about.md"
sed -i "s/CURRENT_DATE/${CURRENT_DATE}/g" "${FEATURE_PATH}/about.md"
sed -i "s/BRANCH_NAME/${BRANCH_NAME}/g" "${FEATURE_PATH}/discovery.md"
sed -i "s/CURRENT_DATE/${CURRENT_DATE}/g" "${FEATURE_PATH}/discovery.md"

echo -e "${GREEN}✓ Created directory: ${FEATURE_PATH}${NC}"
echo -e "${GREEN}✓ Created file: ${FEATURE_PATH}/about.md${NC}"
echo -e "${GREEN}✓ Created file: ${FEATURE_PATH}/discovery.md${NC}"
echo ""
echo -e "${BLUE}Feature documentation structure ready!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Fill in the templates in ${FEATURE_PATH}/"
echo -e "  2. Complete the discovery process"
echo -e "  3. Proceed to planning phase"
