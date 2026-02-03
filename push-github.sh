#!/bin/bash
set -e

# Store current branch
CURRENT_BRANCH=$(git branch --show-current)
TEMP_BRANCH="${CURRENT_BRANCH}-release"

# Create a temporary branch for github push
git checkout -B ${TEMP_BRANCH}

# Copy the actual openapi.yaml content (from submodule) to a temp location
cp api-contract/openapi.yaml /tmp/openapi.yaml

# Remove the submodule from index only
git rm -r --cached api-contract
rm -rf api-contract

# Recreate as regular directory with the file
mkdir -p api-contract
cp /tmp/openapi.yaml api-contract/openapi.yaml

# --- package-lock handling for GitHub ---
# Remove existing package-lock.json (if any)
git rm --cached package-lock.json 2>/dev/null || true
rm -f package-lock.json

# Replace with GitHub-specific lockfile
cp package-lock.github.json package-lock.json
git add package-lock.json

# ---------------------------------------

# --- Remove translation scripts ---
git rm -f pull-translations.ps1 2>/dev/null || true
git rm -f pull-translations.sh 2>/dev/null || true
# ----------------------------------

# --- Remove husky pre-commit hooks ---
git rm -rf .husky 2>/dev/null || true
# -------------------------------------

# Commit the change (skip pre-commit hook)
git add api-contract/openapi.yaml
git commit --amend --no-edit --no-verify

# Push to github
git push github HEAD:${CURRENT_BRANCH} --force

# Cleanup before switching back
rm -f package-lock.json

# Return to original branch
git checkout ${CURRENT_BRANCH}
git branch -D ${TEMP_BRANCH}

# Restore the submodule
git submodule update --init --recursive

echo "Pushed to github with openapi.yaml as regular file and GitHub-specific package-lock.json"
