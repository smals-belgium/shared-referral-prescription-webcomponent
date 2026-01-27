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
git rm --cached api-contract
rm -rf api-contract

# Recreate as regular directory with the file
mkdir -p api-contract
cp /tmp/openapi.yaml api-contract/openapi.yaml

# Remove package-lock.json from index and disk
# 2>/dev/null || true fallback for when there is no package-lock
git rm --cached package-lock.json 2>/dev/null || true

# Commit the change
git add api-contract/openapi.yaml
git commit --amend --no-edit

# Push to github
git push github HEAD:${CURRENT_BRANCH} --force

# Delete the untracked file before switching back
rm -f package-lock.json

# Return to original branch
git checkout ${CURRENT_BRANCH}
git branch -D ${TEMP_BRANCH}

# Restore the submodule
git submodule update --init --recursive

echo "Pushed to github with openapi.yaml as regular file (without package-lock.json)"
