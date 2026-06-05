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

# ─── Step 2: Bump version (local files only — Firestore update runs AFTER deploy) ─
print_step "Step 2: Bumping version"

node scripts/bump-version.js

# Get the new version for the commit message
VERSION_NAME=$(node -p "require('fs').readFileSync('src/lib/app-version.ts','utf-8').match(/APP_VERSION_NAME\s*=\s*\"([^\"]+)\"/)[1]")
VERSION_CODE=$(node -p "require('fs').readFileSync('src/lib/app-version.ts','utf-8').match(/APP_VERSION_CODE\s*=\s*(\d+)/)[1]")
print_success "Version bumped to $VERSION_NAME (code $VERSION_CODE)"

# ─── Step 3: Build Android APK ────────────────────────────────────────────
print_step "Step 3: Building Android APK"

print_status "Building Next.js + Capacitor + Gradle..."

# Build without bumping version again (step 2 already bumped)
npm run build:android
cd android
JAVA_HOME=/usr/lib/jvm/java-21-openjdk ANDROID_HOME=/opt/android-sdk ./gradlew clean assembleRelease
cd "$PROJECT_ROOT"
mkdir -p public
cp android/app/build/outputs/apk/debug/app-debug.apk public/whatsappchapchap.apk

print_success "APK build complete!"

# ─── Step 4: Commit and push to GitHub ────────────────────────────────────
print_step "Step 4: Committing and pushing to GitHub"

# Add changed files (version files only — APK is distributed via GitHub Releases)
git add src/lib/app-version.ts android/app/build.gradle

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
if git push origin master:main; then
    print_success "✅ Pushed to GitHub!"
    echo ""
    echo "  🚀 GitHub Actions should now auto-build the release:"
    echo "     https://github.com/$(git remote get-url origin 2>/dev/null | sed 's/.*:\/\/[^/]*\///' | sed 's/\.git$//')/actions"
else
    print_error "Failed to push to GitHub!"
    echo ""
    echo "  Manual step: git push origin master:main"
    exit 1
fi

# ─── Step 5: Update Firestore (post-deploy) ────────────────────────────────
print_step "Step 5: Update Firestore minimum version"

echo ""
echo "  ⚠️  IMPORTANT: Do NOT update Firestore until the deployment is complete!"
echo "  The APK at the download URL must be the NEW version first."
echo ""
echo "  1. Wait for GitHub Actions deployment to finish"
echo "  2. Verify the new APK is available at the download URL"
echo "  3. Then run this command to force-update all users:"
echo ""

# Auto-detect the APK download URL (now using GitHub Releases)
APK_URL=$(node -e "
try {
  const fs = require('fs');
  const envPath = '.env.local';
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const match = content.match(/^NEXT_PUBLIC_API_URL\s*=\s*(\S+)$/m);
    if (match) {
      console.log('https://github.com/cypjessy/whatsappchapchap/releases/latest/download/whatsappchapchap.apk');
    }
  }
} catch {}
" 2>/dev/null || echo "https://github.com/cypjessy/whatsappchapchap/releases/latest/download/whatsappchapchap.apk")

echo "  npm run release:firestore -- --url $APK_URL"
echo ""
echo "  This will set minimumVersionCode = $VERSION_CODE in Firestore"
echo "  and trigger the force update dialog for users on older versions."
echo ""

# ─── Done ──────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║        🚀 RELEASE PUBLISHED SUCCESSFULLY!        ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Version:  $(echo $VERSION_NAME | head -c 20) (code $VERSION_CODE)              ║"
echo "║  Branch:   master → main                                 ║"
echo "║  GitHub:   Pushed ✅                                     ║"
echo "║  Actions:  Running... (check the Actions tab)            ║"
echo "║  ⚠️  Run 'npm run release:firestore' AFTER deploy!       ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
