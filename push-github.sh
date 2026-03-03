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

# --- Remove translation scripts (backup first) ---
cp pull-translations.ps1 /tmp/pull-translations.ps1 2>/dev/null || true
cp pull-translations.sh /tmp/pull-translations.sh 2>/dev/null || true
git rm -f pull-translations.ps1 2>/dev/null || true
git rm -f pull-translations.sh 2>/dev/null || true
rm -f pull-translations.ps1 pull-translations.sh
# ----------------------------------

# --- Remove husky pre-commit hooks (backup first) ---
cp -r .husky /tmp/.husky 2>/dev/null || true
git rm -rf .husky 2>/dev/null || true
rm -rf .husky
# -------------------------------------

# Commit the change (skip pre-commit hook)
git add api-contract/openapi.yaml
git commit --amend --no-edit --no-verify

# Push to github
git push github HEAD:${CURRENT_BRANCH} --force

# Return to original branch
git checkout ${CURRENT_BRANCH}
git branch -D ${TEMP_BRANCH}

# Restore the submodule
git submodule update --init --recursive

# Restore backed up files
cp /tmp/pull-translations.ps1 pull-translations.ps1 2>/dev/null || true
cp /tmp/pull-translations.sh pull-translations.sh 2>/dev/null || true
cp -r /tmp/.husky .husky 2>/dev/null || true

echo "Pushed to github with openapi.yaml as regular file"
