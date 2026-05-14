#!/bin/bash

# Build APK without Android Studio
# This script installs required tools and builds the APK from command line

set -e  # Exit on error

echo "🚀 Building WhatsApp Chap Chap APK..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Check if Java is installed
print_status "Checking Java installation..."
if ! command -v java &> /dev/null; then
    print_warning "Java not found. Installing OpenJDK 17..."
    sudo apt update
    sudo apt install -y openjdk-17-jdk
fi

JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
print_success "Java version: $JAVA_VERSION"

# Step 2: Check if Android SDK is available
print_status "Checking Android SDK..."
ANDROID_HOME="$HOME/Android/Sdk"
if [ ! -d "$ANDROID_HOME" ]; then
    print_warning "Android SDK not found at $ANDROID_HOME"
    print_status "You need to install Android SDK command-line tools"
    echo ""
    echo "Please install Android Studio or download command-line tools from:"
    echo "https://developer.android.com/studio#command-tools"
    echo ""
    echo "After installation, set ANDROID_HOME in your ~/.bashrc:"
    echo "export ANDROID_HOME=\$HOME/Android/Sdk"
    echo "export PATH=\$PATH:\$ANDROID_HOME/platform-tools:\$ANDROID_HOME/build-tools/34.0.0"
    echo ""
    exit 1
fi

export ANDROID_HOME
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin

# Step 3: Check for required Android SDK components
print_status "Checking Android SDK components..."
REQUIRED_COMPONENTS=("platforms;android-34" "build-tools;34.0.0" "platform-tools")

for component in "${REQUIRED_COMPONENTS[@]}"; do
    if [ ! -d "$ANDROID_HOME/$component" ] && [ ! -d "$ANDROID_HOME/$(echo $component | tr ';' '/')" ]; then
        print_warning "Installing missing component: $component"
        yes | sdkmanager "$component" 2>/dev/null || true
    fi
done

print_success "Android SDK ready"

# Step 4: Build Next.js app
print_status "Building Next.js app..."
npm run build

if [ $? -ne 0 ]; then
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

# Step 6: Build APK using Gradle
print_status "Building APK with Gradle..."
cd android

# Make gradlew executable
chmod +x gradlew

# Build debug APK
./gradlew assembleDebug

if [ $? -ne 0 ]; then
    print_error "Gradle build failed!"
    exit 1
fi

cd ..

print_success "APK build complete!"

# Step 7: Locate the APK
APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"

if [ -f "$APK_PATH" ]; then
    echo ""
    echo "=========================================="
    print_success "✅ APK Built Successfully!"
    echo "=========================================="
    echo ""
    echo "📱 APK Location: $APK_PATH"
    echo ""
    echo "📏 APK Size: $(du -h $APK_PATH | cut -f1)"
    echo ""
    echo "📥 To install on your device:"
    echo "   1. Transfer the APK to your Android device"
    echo "   2. Enable 'Install from Unknown Sources'"
    echo "   3. Tap the APK file to install"
    echo ""
    echo "   OR via USB:"
    echo "   adb install $APK_PATH"
    echo ""
    echo "=========================================="
else
    print_error "APK file not found at expected location!"
    exit 1
fi
