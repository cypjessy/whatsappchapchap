#!/bin/bash
#
# 🚀 Full Release & Publish Script
#
# Cleans all build artifacts, builds a fresh APK, commits, and pushes to GitHub.
# This prevents APK bloat from stale build artifacts accumulating.
#
# Usage:
#   bash scripts/release-publish.sh
#
# Or via npm:
#   npm run release:publish
#
# What it does:
#   1. Cleans ALL build artifacts (.next, out, android/app/build)
#   2. Bumps version + updates Firestore (force update)
#   3. Builds Next.js static export for Android
#   4. Builds APK with Gradle (clean build)
#   5. Copies APK to public/
#   6. Commits version bump and APK changes
#   7. Pushes to GitHub (triggers GitHub Actions auto-release)
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# ─── Colors ──────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_step() { echo -e "\n${CYAN}══════════════════════════════════════════════${NC}"; echo -e "${CYAN}  $1${NC}"; echo -e "${CYAN}══════════════════════════════════════════════${NC}"; }

# ─── Step 0: Ensure we're on main branch ─────────────────────────────────
print_step "Step 0: Checking git status"
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
if [ "$BRANCH" != "main" ]; then
    print_warning "You're on branch '$BRANCH', not 'main'. Publishing from a non-main branch."
    echo "  Press Ctrl+C to cancel, or wait 5s to continue..."
    sleep 5
fi

# Check for uncommitted changes
if ! git diff --quiet --cached || ! git diff --quiet; then
    print_warning "You have uncommitted changes."
    echo "  The release commit will only include version/app files, not your working changes."
    echo "  Continuing in 3 seconds... (Ctrl+C to cancel and commit separately)"
    sleep 3
fi

# ─── Step 1: Clean all build artifacts ────────────────────────────────────
print_step "Step 1: Cleaning all build artifacts"

print_status "Removing .next/ (Next.js build cache)..."
rm -rf .next

print_status "Removing out/ (static export)..."
rm -rf out

print_status "Cleaning Android build artifacts (gradle clean)..."
if [ -d "android" ]; then
    cd android
    if [ -f "gradlew" ]; then
        chmod +x gradlew 2>/dev/null || true
        ./gradlew clean 2>&1 | tail -n 3 || true
    fi
    rm -rf app/build 2>/dev/null || true
    cd "$PROJECT_ROOT"
fi

print_status "Removing public/whatsappchapchap.apk (old APK)..."
rm -f public/whatsappchapchap.apk

print_success "Clean complete!"

# ─── Step 2: Bump version ─────────────────────────────────────────────────
print_step "Step 2: Bumping version"

node scripts/bump-version.js --firestore --force

# Get the new version for the commit message
VERSION_NAME=$(node -p "require('fs').readFileSync('src/lib/app-version.ts','utf-8').match(/APP_VERSION_NAME\s*=\s*\"([^\"]+)\"/)[1]")
VERSION_CODE=$(node -p "require('fs').readFileSync('src/lib/app-version.ts','utf-8').match(/APP_VERSION_CODE\s*=\s*(\d+)/)[1]")
print_success "Version bumped to $VERSION_NAME (code $VERSION_CODE)"

# ─── Step 3: Build Android APK ────────────────────────────────────────────
print_step "Step 3: Building Android APK"

print_status "Building Next.js + Capacitor + Gradle..."
npm run release:full

print_success "APK build complete!"

# ─── Step 4: Commit and push to GitHub ────────────────────────────────────
print_step "Step 4: Committing and pushing to GitHub"

# Add changed files (only the version/APK files, not .env.local which is gitignored)
git add src/lib/app-version.ts android/app/build.gradle public/whatsappchapchap.apk

# Commit with version info
COMMIT_MSG="Release v$VERSION_NAME (build $VERSION_CODE)"
print_status "Committing: $COMMIT_MSG"

if git diff --cached --quiet; then
    print_warning "No changes to commit (version files unchanged — manual commit needed?)"
else
    git commit -m "$COMMIT_MSG"
    print_success "Committed: $COMMIT_MSG"
fi

# Push to GitHub
print_status "Pushing to GitHub..."
if git push origin main; then
    print_success "✅ Pushed to GitHub!"
    echo ""
    echo "  🚀 GitHub Actions should now auto-build the release:"
    echo "     https://github.com/$(git remote get-url origin 2>/dev/null | sed 's/.*:\/\/[^/]*\///' | sed 's/\.git$//')/actions"
else
    print_error "Failed to push to GitHub!"
    echo ""
    echo "  Manual step: git push origin main"
    exit 1
fi

# ─── Done ──────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║        🚀 RELEASE PUBLISHED SUCCESSFULLY!        ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Version:  $VERSION_NAME (code $VERSION_CODE)              ║"
echo "║  Branch:   main                                          ║"
echo "║  GitHub:   Pushed ✅                                     ║"
echo "║  Actions:  Running... (check the Actions tab)            ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
