#!/bin/bash

# Script para detectar o estado atual do projeto
# Uso: bash .claude/scripts/detect-project-state.sh
# Retorna informações sobre PRD, features, branch atual, etc.

set -e

echo "=== PROJECT STATE ==="

# 1. Check PRD
if [ -f "docs/prd.md" ]; then
    echo "PRD_STATUS: EXISTS"
    # Check if PRD is filled or just template
    if grep -q "\[Descrição clara e concisa do produto\]" docs/prd.md 2>/dev/null; then
        echo "PRD_FILLED: NO"
    else
        echo "PRD_FILLED: YES"
    fi
else
    echo "PRD_STATUS: NONE"
    echo "PRD_FILLED: NO"
fi

# 2. Check current branch
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "CURRENT_BRANCH: $CURRENT_BRANCH"

# 3. Detect branch type
if [[ "$CURRENT_BRANCH" == "main" || "$CURRENT_BRANCH" == "master" ]]; then
    echo "BRANCH_TYPE: main"
elif [[ "$CURRENT_BRANCH" == feature/* ]]; then
    echo "BRANCH_TYPE: feature"
elif [[ "$CURRENT_BRANCH" == fix/* ]]; then
    echo "BRANCH_TYPE: fix"
elif [[ "$CURRENT_BRANCH" == refactor/* ]]; then
    echo "BRANCH_TYPE: refactor"
elif [[ "$CURRENT_BRANCH" == docs/* ]]; then
    echo "BRANCH_TYPE: docs"
else
    echo "BRANCH_TYPE: other"
fi

# 4. Check for features
FEATURES_DIR="docs/features"
if [ -d "$FEATURES_DIR" ]; then
    FEATURE_COUNT=$(ls -1 "$FEATURES_DIR" 2>/dev/null | grep -E '^F[0-9]{4}-' | wc -l)
    echo "FEATURE_COUNT: $FEATURE_COUNT"

    # List features
    if [ "$FEATURE_COUNT" -gt 0 ]; then
        echo "FEATURES:"
        ls -1 "$FEATURES_DIR" | grep -E '^F[0-9]{4}-' | while read feature; do
            echo "  - $feature"
        done
    fi
else
    echo "FEATURE_COUNT: 0"
fi

# 5. Identify current feature (if on feature branch)
FEATURE_ID=""
if [[ "$CURRENT_BRANCH" == feature/* || "$CURRENT_BRANCH" == fix/* || "$CURRENT_BRANCH" == refactor/* || "$CURRENT_BRANCH" == docs/* ]]; then
    FEATURE_ID=$(bash .claude/scripts/identify-current-feature.sh 2>/dev/null || echo "")
fi

if [ -n "$FEATURE_ID" ]; then
    echo "CURRENT_FEATURE: $FEATURE_ID"
    FEATURE_DIR="docs/features/$FEATURE_ID"

    # Check feature documents
    [ -f "$FEATURE_DIR/about.md" ] && echo "HAS_ABOUT: YES" || echo "HAS_ABOUT: NO"
    [ -f "$FEATURE_DIR/discovery.md" ] && echo "HAS_DISCOVERY: YES" || echo "HAS_DISCOVERY: NO"
    [ -f "$FEATURE_DIR/plan.md" ] && echo "HAS_PLAN: YES" || echo "HAS_PLAN: NO"
    [ -f "$FEATURE_DIR/implementation.md" ] && echo "HAS_IMPLEMENTATION: YES" || echo "HAS_IMPLEMENTATION: NO"
    [ -f "$FEATURE_DIR/fixes.md" ] && echo "HAS_FIXES: YES" || echo "HAS_FIXES: NO"
else
    echo "CURRENT_FEATURE: NONE"
fi

# 6. Check git status
UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l)
echo "UNCOMMITTED_CHANGES: $UNCOMMITTED"

# 7. Check if ahead/behind remote
if [ "$CURRENT_BRANCH" != "unknown" ]; then
    AHEAD=$(git rev-list --count origin/$CURRENT_BRANCH..$CURRENT_BRANCH 2>/dev/null || echo "0")
    BEHIND=$(git rev-list --count $CURRENT_BRANCH..origin/$CURRENT_BRANCH 2>/dev/null || echo "0")
    echo "COMMITS_AHEAD: $AHEAD"
    echo "COMMITS_BEHIND: $BEHIND"
fi

echo "=== END STATE ==="
