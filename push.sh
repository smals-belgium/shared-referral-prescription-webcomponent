# --- CONFIGURATION ---
REMOTE_GITLAB="origin"
REMOTE_GITHUB="github"
RELEASE_BRANCH_GITLAB="release/business-1.1.x"
SUBMODULE_PATH="api-contract"
# VERIFICATION
INDEX_MODE=$(git ls-files --stage "${SUBMODULE_PATH}" | awk '{print $1}')
if [ "$INDEX_MODE" = "160000" ]; then
    echo "❌ ERROR: ${SUBMODULE_PATH} is still recorded as a submodule (160000) in the index!"
    echo "Please check if a .git directory or file still exists inside ${SUBMODULE_PATH}"
    exit 1
fi

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
