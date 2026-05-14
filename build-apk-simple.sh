#!/bin/bash

# Simple APK Build Guide
# This script helps you build the APK with minimal setup

echo "📱 WhatsApp Chap Chap - APK Build Guide"
echo "======================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."
echo ""

# 1. Check Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js installed: $(node --version)"
else
    echo "❌ Node.js not found - Please install Node.js first"
    exit 1
fi

# 2. Check npm
if command -v npm &> /dev/null; then
    echo "✅ npm installed: $(npm --version)"
else
    echo "❌ npm not found"
    exit 1
fi

# 3. Check Java
if command -v java &> /dev/null; then
    JAVA_VER=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
    echo "✅ Java installed: $JAVA_VER"
else
    echo "⚠️  Java not found - Required for building APK"
    echo ""
    echo "To install Java:"
    echo "  sudo apt update"
    echo "  sudo apt install -y openjdk-17-jdk"
    echo ""
fi

# 4. Check Android SDK
if [ -d "$HOME/Android/Sdk" ]; then
    echo "✅ Android SDK found"
else
    echo "⚠️  Android SDK not found"
    echo ""
    echo "You have two options:"
    echo ""
    echo "OPTION 1: Install Android Studio (Recommended)"
    echo "  1. Download from: https://developer.android.com/studio"
    echo "  2. Install and open once"
    echo "  3. Run this script again"
    echo ""
    echo "OPTION 2: Use Online Build Service"
    echo "  Use services like:"
    echo "  - Appetize.io (for testing)"
    echo "  - Expo Application Services (EAS Build)"
    echo "  - GitHub Actions with Android workflow"
    echo ""
fi

echo ""
echo "======================================="
echo "Configuration Status:"
echo "======================================="

# Check .env.local
if [ -f ".env.local" ]; then
    if grep -q "whatsappchapchap.vercel.app" .env.local; then
        echo "✅ Vercel URL configured: whatsappchapchap.vercel.app"
    else
        echo "⚠️  .env.local exists but Vercel URL may not be set correctly"
    fi
else
    echo "❌ .env.local not found"
    echo "   Created one for you with your Vercel URL"
fi

echo ""
echo "======================================="
echo "Next Steps:"
echo "======================================="
echo ""
echo "If you have Android Studio installed:"
echo "  1. chmod +x build-apk.sh"
echo "  2. ./build-apk.sh"
echo ""
echo "If you DON'T have Android Studio:"
echo "  Option A: Install Android Studio (easiest)"
echo "  Option B: Use GitHub Actions (see GITHUB_ACTIONS_BUILD.md)"
echo "  Option C: Use online build services"
echo ""
echo "For detailed instructions, see:"
echo "  - BUILD_APK_NO_STUDIO.md"
echo "  - GITHUB_ACTIONS_BUILD.md"
echo ""
