#!/bin/bash
set -e

echo "🚀 Building WhatsApp Chap Chap APK..."
echo ""

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Step 1: Set up Java and Android SDK
print_status "Setting up Java and Android SDK..."
export JAVA_HOME=/home/cypherr/Downloads/WebStorm-261.24374.125/jbr
export PATH=$JAVA_HOME/bin:$PATH
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/36.1.0
print_success "Java: $(java -version 2>&1 | head -n 1)"

# Step 2: Clean all build artifacts (prevents APK bloat from stale caches)
print_status "Cleaning old build artifacts..."
rm -rf .next out
if [ -d "android/app/build" ]; then
    rm -rf android/app/build
    print_success "Android build artifacts cleaned"
fi
print_success "Clean complete"

# Step 3: Temporarily exclude API routes for static export
print_status "Excluding API routes from static export (they run on Vercel)..."
API_DIR="src/app/api"
API_BAK_DIR="../api-temp-backup"

if [ -d "$API_DIR" ] && [ ! -d "$API_BAK_DIR" ]; then
    mkdir -p "$API_BAK_DIR"
    cp -r "$API_DIR"/* "$API_BAK_DIR/" 2>/dev/null || true
    rm -rf "$API_DIR"
    print_success "API routes moved to $API_BAK_DIR (outside src)"
fi

# Step 4: Ensure NEXT_PUBLIC_API_URL is set (required for Android)
if [ -z "${NEXT_PUBLIC_API_URL:-}" ] && [ -f ".env.local" ]; then
    export NEXT_PUBLIC_API_URL=$(grep "^NEXT_PUBLIC_API_URL=" .env.local | cut -d '=' -f2)
fi
if [ -z "${NEXT_PUBLIC_API_URL:-}" ]; then
    print_warning "NEXT_PUBLIC_API_URL not set! Defaulting to https://whatsappchapchap.vercel.app"
    export NEXT_PUBLIC_API_URL="https://whatsappchapchap.vercel.app"
fi
print_success "NEXT_PUBLIC_API_URL = $NEXT_PUBLIC_API_URL"

# Step 5: Build Next.js static export
print_status "Building Next.js static export ($NEXT_PUBLIC_API_URL)..."
npm run build
BUILD_EXIT=$?

# Step 4: Restore API routes
print_status "Restoring API routes..."
if [ -d "$API_BAK_DIR" ]; then
    mkdir -p "$API_DIR"
    cp -r "$API_BAK_DIR"/* "$API_DIR/" 2>/dev/null || true
    rm -rf "$API_BAK_DIR"
    print_success "API routes restored"
fi

if [ $BUILD_EXIT -ne 0 ]; then
    print_error "Next.js build failed!"
    exit 1
fi
print_success "Next.js build complete"

# Step 5: Sync with Capacitor
print_status "Syncing with Capacitor..."
npx cap sync android
if [ $? -ne 0 ]; then
    print_error "Capacitor sync failed!"
    exit 1
fi
print_success "Capacitor sync complete"

# Step 6: Build APK with Gradle
print_status "Building APK with Gradle..."
cd android
chmod +x gradlew
./gradlew assembleRelease
GRADLE_EXIT=$?
cd ..

if [ $GRADLE_EXIT -ne 0 ]; then
    print_error "Gradle build failed!"
    exit 1
fi
print_success "APK build complete!"

# Step 7: Locate the APK
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
    echo ""
    echo "=========================================="
    print_success "✅ APK Built Successfully!"
    echo "=========================================="
    echo ""
    echo "📱 APK Location: $APK_PATH"
    echo "📏 APK Size: $(du -h $APK_PATH | cut -f1)"
    echo ""
    echo "📥 To install: adb install $APK_PATH"
    echo "=========================================="
else
    print_error "APK file not found at expected location!"
    exit 1
fi
