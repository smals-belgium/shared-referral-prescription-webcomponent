#!/bin/bash
set -e

PROXY_URL="http://proxy.smals-mvm.be:8080"
git config http.proxy ${PROXY_URL}
npm config set proxy "${PROXY_URL}"
npm config set https-proxy "${PROXY_URL}"

# --- CONFIGURATION ---
REMOTE_GITLAB="origin"
REMOTE_GITHUB="github"
RELEASE_BRANCH_GITLAB="release/business-1.1.x"
SUBMODULE_PATH="api-contract"

echo "🚀 Preparing to push release ${VERSION} to GitHub---"

git checkout $RELEASE_BRANCH_GITLAB
git fetch origin
git fetch github

# --- Version retrieval from package.json
VERSION=$(grep -E '^[[:space:]]*"version"[[:space:]]*:' package.json | head -n 1 | sed -E 's/.*"([0-9]+\.[0-9]+\.[0-9]+)".*/\1/')
if [ -z "${VERSION}" ]; then
    echo "❌ Error : Impossible to extract the version from package.json"
    exit 1
fi
PR_BRANCH_NAME="release-v${VERSION}"
echo "📦 Target version : ${VERSION}"
echo "🌿 PR branch : ${PR_BRANCH_NAME}"

echo "🧹 Cleanup of the local file to avoid getting untracked files issues..."
rm -rf "${SUBMODULE_PATH}"
git rm -r --cached "${SUBMODULE_PATH}" 2>/dev/null || true

# Create a transition branch for github push
git branch -D "${PR_BRANCH_NAME}" 2>/dev/null || true
git checkout -b "${PR_BRANCH_NAME}" ${REMOTE_GITHUB}/master

git checkout $REMOTE_GITLAB/$RELEASE_BRANCH_GITLAB -- .
git submodule update --remote

# Cleanup of the submodule directory such that it appears as a regular directory
if [ -d "${SUBMODULE_PATH}" ]; then
  echo "Clearing the submodule directory to make it appear as a regular directory and not a sub-module"
  # Remove the submodule from index only and remove the unnecessary files
  git rm --cached -r "$SUBMODULE_PATH" 2>/dev/null || true
  # Using find to remove .git as it might be a file (submodule) or a directory
  find "${SUBMODULE_PATH}" -name ".git" -exec rm -rf {} + 2>/dev/null || rm -rf "${SUBMODULE_PATH}/.git"
  rm -rf ${SUBMODULE_PATH}/README.md ${SUBMODULE_PATH}/.gitignore
  # Also remove .gitmodules to avoid GitHub identifying it as a submodule
  git rm --cached .gitmodules 2>/dev/null || true
  rm -f .gitmodules
fi

rm -f update-translations.bat pull-translations.ps1 pull-translations.sh push-github.sh
rm -rf .husky
rm -rf .openshift
rm -rf .gitlab
rm -rf contrib
rm -f package-lock.json
rm -f DEVELOPMENT.md

npm cache clean --force
npm cache verify
rm -rf node_modules/
npm i

echo "Adding changes to the index"
git add .
if ! git diff-index --quiet HEAD; then
    git commit -m "Release $VERSION"
    echo "✅ Release commit successfully created."
else
    echo "⚠️ No changes detected."
fi

echo "📤 Pushing to GitHub..."
git push $REMOTE_GITHUB "${PR_BRANCH_NAME}"

git checkout "${RELEASE_BRANCH_GITLAB}"
git submodule update --remote
