#!/bin/bash
set -e

# =============================================================================
# pull-from-github.sh
# -----------------------------------------------------------------------------
# Reverse of push-github.sh. Imports changes made on the public GitHub mirror
# back into the internal GitLab repository — SAFELY.
#
# Why this is not just "push-github.sh in reverse":
#   push-github.sh is LOSSY/TRANSFORMATIVE. Before pushing to GitHub it:
#     * flattens the `api-contract` git submodule into plain files,
#     * strips a set of internal-only files (CI, husky, SBOMs, this script...),
#     * regenerates package-lock.json,
#     * uses release versions (GitLab keeps SNAPSHOT versions).
#   A blind reverse overlay would therefore DELETE all internal-only files from
#   GitLab, clobber the SNAPSHOT versions, and turn the submodule into files.
#
# This script instead:
#   1. Creates a throw-away review branch off the GitLab target branch.
#   2. Overlays the GitHub tree onto it, EXCEPT a protected "deny-list" of
#      internal-only / transformed paths (and the api-contract submodule).
#   3. Propagates deletions, but ONLY within non-protected paths.
#   4. Preserves the `version` field of every package.json (keeps SNAPSHOT).
#   5. Pushes the review branch to GitLab and prints a Merge Request URL.
#      It NEVER commits onto or force-pushes a protected branch.
#
# api-contract (the submodule) is intentionally NOT synced here: changes to the
# API contract must be made in the submodule's OWN repository, then the gitlink
# bumped. This script only warns if the contract diverged on GitHub.
#
# Usage:
#   ./pull-from-github.sh <gitlab-target-branch> [github-source-ref]
# Example:
#   ./pull-from-github.sh main
#   ./pull-from-github.sh develop master
# =============================================================================

# --- npm proxy snapshot/restore (identical strategy to push-github.sh) --------
NPM_PREV_PROXY="$(npm config get proxy 2>/dev/null || echo "null")"
NPM_PREV_HTTPS_PROXY="$(npm config get https-proxy 2>/dev/null || echo "null")"

restore_npm_proxy() {
    if [ "${NPM_PREV_PROXY}" = "null" ] || [ -z "${NPM_PREV_PROXY}" ]; then
        npm config delete proxy >/dev/null 2>&1 || true
    else
        npm config set proxy "${NPM_PREV_PROXY}" >/dev/null 2>&1 || true
    fi
    if [ "${NPM_PREV_HTTPS_PROXY}" = "null" ] || [ -z "${NPM_PREV_HTTPS_PROXY}" ]; then
        npm config delete https-proxy >/dev/null 2>&1 || true
    else
        npm config set https-proxy "${NPM_PREV_HTTPS_PROXY}" >/dev/null 2>&1 || true
    fi
}

keep_window_open() {
    local exit_code=$?
    restore_npm_proxy
    echo
    if [ ${exit_code} -eq 0 ]; then
        echo "✅ Script completed successfully."
    else
        echo "❌ Script stopped with exit code ${exit_code}."
    fi
    read -r -p "Press Enter to close this window..." _
    exit ${exit_code}
}

trap keep_window_open EXIT

PROXY_URL="http://proxy.smals-mvm.be:8080"
git config http.proxy ${PROXY_URL}
npm config set proxy "${PROXY_URL}"
npm config set https-proxy "${PROXY_URL}"

# --- Configuration ------------------------------------------------------------
REMOTE_GITLAB="origin"
REMOTE_GITHUB="github"
SUBMODULE_PATH="api-contract"

if [ -z "${1:-}" ]; then
    echo "❌ Error: GitLab target branch name is required."
    echo "Usage: $0 <gitlab-target-branch> [github-source-ref]"
    echo "Example: $0 main"
    exit 1
fi
GITLAB_TARGET_BRANCH="$1"
GITHUB_SOURCE_REF="${2:-master}"
GITHUB_REF="${REMOTE_GITHUB}/${GITHUB_SOURCE_REF}"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
SYNC_BRANCH="sync/from-github-${TIMESTAMP}"

echo "🌿 GitLab target branch : ${GITLAB_TARGET_BRANCH}"
echo "🐙 GitHub source ref    : ${GITHUB_REF}"
echo "🌱 Review (sync) branch : ${SYNC_BRANCH}"

# --- Protected (deny-list) paths ----------------------------------------------
# These are internal-only OR transformed by push-github.sh. They must NEVER be
# added, modified, or deleted by the GitHub->GitLab overlay. Keep in sync with
# the strip/transform steps of push-github.sh.
PROTECTED_PATHS=(
    "${SUBMODULE_PATH}"                 # submodule: handled separately, not here
    ".gitmodules"                       # removed on GitHub, required on GitLab
    "push-github.sh"
    "pull-from-github.sh"               # this very script
    "pull-translations.ps1"
    "pull-translations.sh"
    "update-translations.bat"
    "bom.json"
    "bom.xml"
    ".husky"
    ".openshift"
    ".gitlab"
    ".gitlab-ci.yml"
    ".github"                           # GitHub-specific workflows: don't import
    ".jfrog"
    ".junie"
    "contrib"
    "package-lock.json"                 # regenerated; not synced from GitHub
    "DEVELOPMENT.md"
    "docker"
)
# Glob-based protected patterns (SBOM artifacts).
PROTECTED_GLOBS=(
    "smals-nihdi-uhmep-healix-web-components-*-cyclonedx.xml"
    "smals-nihdi-uhmep-healix-web-components-*-sbom.cdx.json"
)

# package.json files whose "version" field must be preserved from GitLab.
VERSION_PRESERVE_PKGS=(
    "package.json"
    "wc-prescription-create/package.json"
    "wc-prescription-list/package.json"
    "wc-prescription-details/package.json"
)

# --- Helpers ------------------------------------------------------------------
read_pkg_version() {
    grep -E '^[[:space:]]*"version"[[:space:]]*:' "$1" | head -n 1 \
        | sed -E 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/'
}

set_pkg_version() {
    sed -i -E "s/(\"version\"[[:space:]]*:[[:space:]]*\")[^\"]+(\")/\1$2\2/" "$1"
}

# Returns 0 (true) if the given path is protected, 1 otherwise.
is_protected() {
    local path="$1"
    local p
    for p in "${PROTECTED_PATHS[@]}"; do
        # Exact match or nested under a protected directory.
        if [ "${path}" = "${p}" ] || [[ "${path}" == "${p}/"* ]]; then
            return 0
        fi
    done
    for p in "${PROTECTED_GLOBS[@]}"; do
        # shellcheck disable=SC2053
        if [[ "${path}" == ${p} ]]; then
            return 0
        fi
    done
    return 1
}

# --- Working-tree safety check ------------------------------------------------
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    echo "❌ Working tree has uncommitted changes to tracked files."
    echo "   Please commit or stash them before running this script."
    git status --short --untracked-files=no
    exit 1
fi

# --- Fetch both remotes -------------------------------------------------------
echo "⬇️  Fetching remotes..."
git fetch "${REMOTE_GITLAB}"
git fetch "${REMOTE_GITHUB}"

# Verify the source ref exists.
if ! git rev-parse -q --verify "${GITHUB_REF}^{commit}" >/dev/null; then
    echo "❌ Error: GitHub source ref '${GITHUB_REF}' not found."
    exit 1
fi
# Verify the target branch exists on GitLab.
if ! git rev-parse -q --verify "${REMOTE_GITLAB}/${GITLAB_TARGET_BRANCH}^{commit}" >/dev/null; then
    echo "❌ Error: GitLab target branch '${REMOTE_GITLAB}/${GITLAB_TARGET_BRANCH}' not found."
    exit 1
fi

# --- Capture GitLab version fields BEFORE overlay -----------------------------
# We read them from the target branch tree (not the working tree) so the values
# are authoritative regardless of what is currently checked out.
declare -A ORIGINAL_VERSIONS
for pkg in "${VERSION_PRESERVE_PKGS[@]}"; do
    if git cat-file -e "${REMOTE_GITLAB}/${GITLAB_TARGET_BRANCH}:${pkg}" 2>/dev/null; then
        ORIGINAL_VERSIONS["${pkg}"]="$(git show "${REMOTE_GITLAB}/${GITLAB_TARGET_BRANCH}:${pkg}" \
            | grep -E '^[[:space:]]*"version"[[:space:]]*:' | head -n 1 \
            | sed -E 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/')"
    fi
done

# --- Create the review branch off the GitLab target ---------------------------
git branch -D "${SYNC_BRANCH}" 2>/dev/null || true
git checkout -b "${SYNC_BRANCH}" "${REMOTE_GITLAB}/${GITLAB_TARGET_BRANCH}"
# Make sure the submodule is initialised/consistent for the target branch.
git submodule update --init --recursive >/dev/null 2>&1 || true

# --- Build exclude pathspecs for the overlay ----------------------------------
EXCLUDE_PATHSPECS=()
for p in "${PROTECTED_PATHS[@]}"; do
    EXCLUDE_PATHSPECS+=(":(exclude)${p}")
done
for p in "${PROTECTED_GLOBS[@]}"; do
    EXCLUDE_PATHSPECS+=(":(exclude)${p}")
done

# --- Overlay GitHub tree (adds + modifications), except protected paths -------
echo "🔀 Overlaying '${GITHUB_REF}' onto '${SYNC_BRANCH}' (protected paths excluded)..."
git checkout "${GITHUB_REF}" -- . "${EXCLUDE_PATHSPECS[@]}"

# --- Propagate deletions, but ONLY within non-protected paths -----------------
# Files tracked on the GitLab target but absent on the GitHub source, that are
# not protected, are removed so the sync reflects upstream deletions.
echo "🗑️  Checking for files deleted on GitHub..."
GITLAB_FILES="$(git ls-tree -r --name-only "${REMOTE_GITLAB}/${GITLAB_TARGET_BRANCH}")"
GITHUB_FILES="$(git ls-tree -r --name-only "${GITHUB_REF}")"
DELETED_ANY=0
while IFS= read -r f; do
    [ -z "${f}" ] && continue
    if is_protected "${f}"; then
        continue
    fi
    # Present on GitLab, absent on GitHub -> candidate for deletion.
    if ! printf '%s\n' "${GITHUB_FILES}" | grep -Fxq -- "${f}"; then
        git rm -q -- "${f}" 2>/dev/null || true
        echo "   - removed ${f}"
        DELETED_ANY=1
    fi
done <<< "$(printf '%s\n' "${GITLAB_FILES}" | grep -Fxvf <(printf '%s\n' "${GITHUB_FILES}") || true)"
[ "${DELETED_ANY}" = "0" ] && echo "   (none)"

# --- Restore preserved version fields -----------------------------------------
echo "🔖 Restoring GitLab version fields (keeping SNAPSHOT / target versions)..."
for pkg in "${VERSION_PRESERVE_PKGS[@]}"; do
    orig="${ORIGINAL_VERSIONS["${pkg}"]:-}"
    if [ -n "${orig}" ] && [ -f "${pkg}" ]; then
        current="$(read_pkg_version "${pkg}")"
        if [ "${current}" != "${orig}" ]; then
            set_pkg_version "${pkg}" "${orig}"
            echo "   - ${pkg}: ${current} -> ${orig} (restored)"
        fi
    fi
done

# --- Warn if the API contract diverged on GitHub ------------------------------
# The submodule cannot be synced through the parent repo. Detect divergence so
# the operator can port the change into the api-contract repo separately.
if git cat-file -e "${GITHUB_REF}:${SUBMODULE_PATH}/openapi.yaml" 2>/dev/null; then
    GITHUB_CONTRACT="$(git show "${GITHUB_REF}:${SUBMODULE_PATH}/openapi.yaml" 2>/dev/null || true)"
    LOCAL_CONTRACT=""
    if [ -f "${SUBMODULE_PATH}/openapi.yaml" ]; then
        LOCAL_CONTRACT="$(cat "${SUBMODULE_PATH}/openapi.yaml")"
    fi
    if [ "${GITHUB_CONTRACT}" != "${LOCAL_CONTRACT}" ]; then
        echo ""
        echo "⚠️  The API contract (${SUBMODULE_PATH}/openapi.yaml) differs on GitHub."
        echo "    This script does NOT sync the submodule. Port the change into the"
        echo "    api-contract repository directly, then bump the submodule gitlink."
        echo ""
    fi
fi

# --- Stage and detect whether there is anything to sync -----------------------
git add -A
if git diff-index --quiet HEAD; then
    echo "✅ No syncable changes from GitHub. Nothing to do."
    # Return to the target branch and drop the empty sync branch.
    git checkout "${GITLAB_TARGET_BRANCH}" 2>/dev/null || git checkout "${REMOTE_GITLAB}/${GITLAB_TARGET_BRANCH}"
    git branch -D "${SYNC_BRANCH}" 2>/dev/null || true
    exit 0
fi

echo ""
echo "The following changes will be committed to '${SYNC_BRANCH}':"
git --no-pager diff --cached --stat
echo ""
printf "Create commit and push review branch to GitLab? [y/N] "
read -r CONFIRM
case "${CONFIRM}" in
    [yY]|[yY][eE][sS]) ;;
    *)
        echo "❌ Aborted by user. The sync branch '${SYNC_BRANCH}' is left in place for inspection."
        exit 1
        ;;
esac

git commit -m "chore: sync changes from GitHub (${GITHUB_REF} @ ${TIMESTAMP})"
echo "📤 Pushing review branch to GitLab..."
git push -u "${REMOTE_GITLAB}" "${SYNC_BRANCH}"

# --- Print a Merge Request URL ------------------------------------------------
GITLAB_URL="$(git remote get-url "${REMOTE_GITLAB}")"
GITLAB_URL_NO_GIT="${GITLAB_URL%.git}"
MR_URL="${GITLAB_URL_NO_GIT}/-/merge_requests/new?merge_request%5Bsource_branch%5D=${SYNC_BRANCH}&merge_request%5Btarget_branch%5D=${GITLAB_TARGET_BRANCH}"

echo ""
echo "========== GitHub -> GitLab sync summary =========="
echo "Source        : ${GITHUB_REF}"
echo "Target branch : ${GITLAB_TARGET_BRANCH}"
echo "Review branch : ${SYNC_BRANCH} -> ${REMOTE_GITLAB}"
echo "Open MR here  : ${MR_URL}"
echo "==================================================="
echo "ℹ️  Review the MR carefully. The api-contract submodule is NOT synced by"
echo "    this script — handle contract changes in its own repository."

