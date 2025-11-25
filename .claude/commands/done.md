# Feature Completion & Merge Specialist

You are now acting as a **Feature Completion & Merge Coordinator**. Your role is to finalize the feature development, commit remaining changes, merge to main/master using squash merge, and clean up the feature branch.

This command COMPLETES the feature development workflow and integrates the feature into the main codebase.

## Phase 1: Identify Feature & Verify State (AUTOMATIC)

### Step 1: Detect Current Feature

Automatically identify the feature from the current branch:

```bash
# Identify feature from branch name
FEATURE_ID=$(bash .claude/scripts/identify-current-feature.sh)
CURRENT_BRANCH=$(git branch --show-current)
```

**If feature identified:**
- Display feature ID, path, and current branch
- Ask user: "Complete and merge feature `${FEATURE_ID}` to main? (yes/no)"

**If no feature identified:**
- Error: "You're not on a feature branch. Cannot proceed with /done."
- Display current branch name
- Suggest: "Switch to your feature branch first, or use git commands manually."
- Exit command

### Step 2: Verify Git Status

Check for uncommitted changes:

```bash
git status --porcelain
```

**If there are uncommitted changes:**
- Display list of modified/untracked files
- Ask user: "You have uncommitted changes. Commit them now? (yes/no)"
  - **If yes**: Proceed to commit
  - **If no**: Exit /done - "Please commit or stash your changes first, then run /done again."

**If yes (Commit changes):**
- Generate commit message automatically (DO NOT ask user)
- Execute commit:
  ```bash
  git add .
  git commit -m "feat(${FEATURE_ID}): finalize feature implementation

  🤖 Generated with Claude Code

  Co-Authored-By: Claude <noreply@anthropic.com>"
  ```

## Phase 2: Final Push to Feature Branch (MANDATORY)

Ensure all changes are pushed to the remote feature branch:

```bash
# Push to feature branch
git push origin ${CURRENT_BRANCH}
```

**If push fails:**
- Check if it's a divergence issue
- Ask user: "Remote branch has diverged. Pull and rebase? (yes/no)"
  - **If yes**: `git pull --rebase origin ${CURRENT_BRANCH}` then retry push
  - **If no**: Exit /done - "Please resolve manually and run /done again."

## Phase 3: Switch to Main Branch (MANDATORY)

### Step 1: Detect Main Branch

```bash
# Detect main branch (main or master)
if git show-ref --verify --quiet refs/heads/main; then
    MAIN_BRANCH="main"
elif git show-ref --verify --quiet refs/heads/master; then
    MAIN_BRANCH="master"
else
    # Ask user
    echo "Cannot detect main branch. Please specify: main or master?"
fi
```

### Step 2: Checkout and Update Main

```bash
# Checkout main branch
git checkout ${MAIN_BRANCH}

# Pull latest changes
git pull origin ${MAIN_BRANCH}
```

**If pull fails or has conflicts:**
- Exit /done with error message
- "Main branch has conflicts. Please resolve manually:
  1. git checkout ${MAIN_BRANCH}
  2. git pull origin ${MAIN_BRANCH}
  3. Resolve conflicts
  4. Run /done again"

## Phase 4: Squash Merge Feature Branch (AUTOMATIC)

**Strategy:** Always use squash merge for clean, linear history.

### Step 1: Generate Squash Commit Message (AUTOMATIC)

**DO NOT ask user for message.** Generate it automatically based on:

1. **Read feature documentation** from `docs/features/${FEATURE_ID}/`:
   - `about.md` - Feature description
   - `discovery.md` - Problem statement
   - `implementation.md` - What was built

2. **Analyze git history** of the feature branch for context

3. **Generate concise message** following this format:
   ```
   [type](${FEATURE_ID}): [concise description of what was done]

   [2-3 lines explaining the key changes/solution]

   See docs/features/${FEATURE_ID}/ for complete documentation.
   ```

   **Type prefixes:**
   - `feat` - New feature (feature/ branch)
   - `fix` - Bug fix (fix/ branch)
   - `refactor` - Code refactoring (refactor/ branch)
   - `docs` - Documentation (docs/ branch)

### Step 2: Execute Squash Merge

```bash
# Squash merge feature branch
git merge --squash ${CURRENT_BRANCH}

# Check if merge has conflicts
if git diff --check; then
    # No conflicts, commit
    git commit -m "[squash commit message]

    🤖 Generated with Claude Code

    Co-Authored-By: Claude <noreply@anthropic.com>"
else
    # Conflicts detected - ABORT and use /fix
    echo "MERGE CONFLICTS DETECTED"
fi
```

### Step 3: Handle Merge Conflicts (CRITICAL)

**If conflicts are detected during squash merge:**

1. **Abort the merge:**
   ```bash
   git merge --abort
   git checkout ${CURRENT_BRANCH}
   ```

2. **Inform user with clear instructions:**
   ```
   ⚠️ MERGE CONFLICTS DETECTED

   Conflicts found when attempting to merge ${CURRENT_BRANCH} into ${MAIN_BRANCH}.

   **Resolution Process:**

   1. Use /fix command to investigate and resolve conflicts:
      - /fix will help you identify conflicting files
      - /fix will guide you through resolution
      - /fix will document the resolution in fixes.md

   2. After /fix completes:
      - Review the conflict resolutions
      - Commit the fixes manually
      - Push to ${CURRENT_BRANCH}

   3. Run /done again:
      - /done will retry the merge
      - If no conflicts, merge will complete successfully

   **Conflicting files:**
   [List conflicting files from git status]

   **Next command:** /fix
   ```

3. **Exit /done command**
   - User must use `/fix` to resolve conflicts
   - User commits and pushes fixes
   - User runs `/done` again after resolution

**Important:** Do NOT attempt to auto-resolve conflicts. Always delegate to `/fix` for proper investigation and documentation.

## Phase 5: Push Merged Changes (MANDATORY)

Push the squash-merged commit to remote main:

```bash
git push origin ${MAIN_BRANCH}
```

**If push fails (non-fast-forward):**
- Exit /done with error
- "Remote main has new commits. Please:
  1. git pull origin ${MAIN_BRANCH}
  2. Resolve any conflicts
  3. git push origin ${MAIN_BRANCH}
  4. Run /done again if needed"

## Phase 6: Cleanup Feature Branch (AUTOMATIC)

### Step 1: Delete Local Branch

```bash
# Delete local feature branch
git branch -d ${CURRENT_BRANCH}
```

**If deletion fails (not fully merged):**
- This shouldn't happen with squash merge, but if it does:
- Ask user: "Branch has unmerged commits. Force delete? (yes/no)"
  - **If yes**: `git branch -D ${CURRENT_BRANCH}`
  - **If no**: Keep local branch

### Step 2: Delete Remote Branch

```bash
# Delete remote feature branch
git push origin --delete ${CURRENT_BRANCH}
```

**If deletion fails:**
- Inform user but don't block
- "Failed to delete remote branch. You can delete it manually later:
  git push origin --delete ${CURRENT_BRANCH}"

## Phase 7: Completion Summary

Display comprehensive completion summary:

```
✅ Feature Completed and Merged!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Feature: ${FEATURE_ID}
Branch: ${CURRENT_BRANCH}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Actions Completed:
✅ Final changes committed and pushed to feature branch
✅ Switched to ${MAIN_BRANCH}
✅ Squash merged ${CURRENT_BRANCH} into ${MAIN_BRANCH}
✅ Pushed merged changes to remote
✅ Deleted local branch: ${CURRENT_BRANCH}
✅ Deleted remote branch: ${CURRENT_BRANCH}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Branch: ${MAIN_BRANCH}

Documentation: docs/features/${FEATURE_ID}/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What's Next:
1. ✅ Feature is now live in ${MAIN_BRANCH}
2. Verify functionality in main branch (optional)
3. Deploy to staging/production (if applicable)
4. Close any related issues/tickets
5. Start next feature with /feature command

🎉 Great work! Feature development complete.
```

---

## Critical Rules

**DO:**
- Always use squash merge (no other strategies)
- Verify every step succeeded before proceeding
- Delegate conflict resolution to /fix command
- Delete both local and remote branches automatically
- Provide clear guidance on errors
- Preserve all documentation in main

**DO NOT:**
- Force push to main/master
- Auto-resolve merge conflicts
- Proceed if conflicts are detected
- Skip conflict documentation
- Delete branches before confirming merge succeeded

---

## Error Handling

### Common Errors:

**1. Merge Conflicts (MOST IMPORTANT)**
- **Action**: Abort merge immediately
- **Instruction**: Use /fix to resolve
- **Process**:
  1. /fix investigates conflicts
  2. /fix resolves conflicts
  3. User commits and pushes
  4. User runs /done again
- **Never** attempt auto-resolution

**2. Push Rejected (Remote Changes)**
- **Action**: Exit /done
- **Instruction**: Pull, resolve, push manually
- **Do NOT** force push

**3. Uncommitted Changes**
- **Action**: Offer to commit
- **Instruction**: Commit now or exit
- **Default**: Safe option (commit)

**4. Branch Not on Remote**
- **Action**: Push will create it
- **No blocking**: Normal first push

**5. Permission Errors**
- **Action**: Exit with clear message
- **Instruction**: Check permissions, try manually

---

## Conflict Resolution Workflow

```
User runs: /done

↓

Merge conflicts detected

↓

/done aborts and instructs:
"Use /fix to resolve conflicts"

↓

User runs: /fix

↓

/fix investigates:
- Identifies conflicting files
- Analyzes root cause
- Resolves conflicts
- Documents in fixes.md
- Updates implementation.md

↓

User reviews and commits fixes:
git add .
git commit -m "fix: resolve merge conflicts"
git push

↓

User runs: /done again

↓

No conflicts this time

↓

Merge succeeds ✅
```

---

## Example Usage

### Scenario 1: Clean Merge (No Conflicts)

```bash
# On feature/F0001-user-authentication
/done

# Agent: "Complete and merge feature F0001-user-authentication to main? (yes)"
# You: yes

# Agent detects uncommitted changes
# Agent: "You have uncommitted changes. Commit them now? (yes)"
# You: yes

# Agent auto-generates commit message and commits
# Agent pushes to feature branch
# Agent switches to main, pulls latest
# Agent reads feature docs, generates squash message automatically
# Agent squash merges (no conflicts)
# Agent pushes to main
# Agent deletes local and remote branches

# ✅ Feature Completed and Merged!
# Current Branch: main
# 🎉 Great work!
```

### Scenario 2: Merge Conflicts Detected

```bash
# On feature/F0002-email-notifications
/done

# Agent: "Complete and merge feature F0002-email-notifications to main? (yes)"
# You: yes

# Agent commits, pushes to feature branch
# Agent switches to main, pulls latest
# Agent attempts squash merge
# ⚠️ MERGE CONFLICTS DETECTED

# Agent aborts merge
# Agent returns to feature branch

# Agent: "
# ⚠️ MERGE CONFLICTS DETECTED
#
# Conflicts found when merging to main.
#
# Resolution Process:
# 1. Use /fix command to resolve conflicts
# 2. Commit and push fixes
# 3. Run /done again
#
# Conflicting files:
# - apps/frontend/src/components/Header.tsx
# - apps/backend/src/api/modules/notifications/notifications.controller.ts
#
# Next command: /fix
# "

# You run: /fix
# /fix investigates and resolves conflicts
# /fix documents in fixes.md

# You review, commit, push:
git add .
git commit -m "fix: resolve merge conflicts with main"
git push

# You run: /done
# Agent: Merge succeeds this time ✅
# Feature completed!
```

---

## Integration with Complete Workflow

```
/feature → /plan → /dev → /fix → /done
                              ↑      ↓
                              └──────┘
                         (if conflicts)
```

**After /done:** You're back on main, ready to start next feature with `/feature`.

---

## Safety Checklist

Before running /done, ensure:

- [ ] All tests passing (if test suite exists)
- [ ] Code compiles successfully
- [ ] Documentation complete (about.md, discovery.md, plan.md, implementation.md)
- [ ] All features working as expected
- [ ] No known bugs (or documented in fixes.md)
- [ ] Ready to merge to main

**If unsure, test locally on main first:**
```bash
# Manually test merge locally (dry run)
git checkout main
git pull origin main
git merge --squash feature/F000X-name
# Check for conflicts
git merge --abort  # abort dry run
git checkout feature/F000X-name
# Now run /done if dry run was clean
```

---

## Squash Merge Benefits

**Why squash merge is the default:**

1. **Clean History**: One commit per feature in main
2. **Easy Rollback**: Revert entire feature with one command
3. **Clear Intent**: Each commit describes a complete feature
4. **Reduced Noise**: No "WIP", "fix typo", "oops" commits in main
5. **Better Bisect**: Each commit is a working state
6. **Professional**: Clean history for open source or team review

**Squash commit includes:**
- Feature summary (what was implemented)
- Reference to documentation directory
- Co-authored by Claude Code attribution
