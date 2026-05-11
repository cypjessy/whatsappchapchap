#!/bin/bash

# Check Android Build Readiness
# This script verifies that everything is set up correctly for building the Android app

echo "🔍 Checking Android Build Readiness..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ISSUES=0

# Check 1: Node.js and npm
echo -n "1. Checking Node.js and npm... "
if command -v node &> /dev/null && command -v npm &> /dev/null; then
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓${NC} Node $NODE_VERSION, npm $NPM_VERSION"
else
    echo -e "${RED}✗${NC} Node.js or npm not found"
    ISSUES=$((ISSUES+1))
fi

# Check 2: Capacitor dependencies
echo -n "2. Checking Capacitor dependencies... "
if [ -d "node_modules/@capacitor" ]; then
    echo -e "${GREEN}✓${NC} Capacitor installed"
else
    echo -e "${RED}✗${NC} Capacitor not installed"
    echo "   Run: npm install @capacitor/core @capacitor/cli @capacitor/android"
    ISSUES=$((ISSUES+1))
fi

# Check 3: Android platform
echo -n "3. Checking Android platform... "
if [ -d "android" ]; then
    echo -e "${GREEN}✓${NC} Android platform added"
else
    echo -e "${RED}✗${NC} Android platform not added"
    echo "   Run: npx cap add android"
    ISSUES=$((ISSUES+1))
fi

# Check 4: capacitor.config.ts
echo -n "4. Checking capacitor.config.ts... "
if [ -f "capacitor.config.ts" ]; then
    echo -e "${GREEN}✓${NC} Configuration exists"
else
    echo -e "${RED}✗${NC} Configuration missing"
    ISSUES=$((ISSUES+1))
fi

# Check 5: Environment variables
echo -n "5. Checking .env.local file... "
if [ -f ".env.local" ]; then
    if grep -q "NEXT_PUBLIC_API_URL" .env.local; then
        API_URL=$(grep "NEXT_PUBLIC_API_URL" .env.local | cut -d '=' -f2)
        if [ "$API_URL" != "" ] && [ "$API_URL" != "https://your-deployed-app.vercel.app" ]; then
            echo -e "${GREEN}✓${NC} API URL configured: $API_URL"
        else
            echo -e "${YELLOW}⚠${NC} Using default API URL (needs to be updated)"
        fi
    else
        echo -e "${YELLOW}⚠${NC} NEXT_PUBLIC_API_URL not set"
    fi
else
    echo -e "${YELLOW}⚠${NC} .env.local not found"
    echo "   Copy .env.example to .env.local and configure"
fi

# Check 6: Android Studio
echo -n "6. Checking Android Studio... "
if command -v studio &> /dev/null || [ -d "/usr/local/android-studio" ] || [ -d "$HOME/Android/Sdk" ]; then
    echo -e "${GREEN}✓${NC} Android Studio found"
else
    echo -e "${YELLOW}⚠${NC} Android Studio not found in PATH"
    echo "   Download from: https://developer.android.com/studio"
fi

# Check 7: Java JDK
echo -n "7. Checking Java JDK... "
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
    if [ "$JAVA_VERSION" -ge 17 ] 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Java $JAVA_VERSION"
    else
        echo -e "${YELLOW}⚠${NC} Java version $JAVA_VERSION (JDK 17+ recommended)"
    fi
else
    echo -e "${YELLOW}⚠${NC} Java not found"
    echo "   Install JDK 17 or higher"
fi

# Check 8: ADB (Android Debug Bridge)
echo -n "8. Checking ADB... "
if command -v adb &> /dev/null; then
    echo -e "${GREEN}✓${NC} ADB available"
else
    echo -e "${YELLOW}⚠${NC} ADB not found"
    echo "   Install via Android Studio SDK Manager"
fi

# Check 9: Connected devices
echo -n "9. Checking connected devices... "
if command -v adb &> /dev/null; then
    DEVICE_COUNT=$(adb devices 2>/dev/null | tail -n +2 | grep -c "device$")
    if [ "$DEVICE_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓${NC} $DEVICE_COUNT device(s) connected"
        adb devices | tail -n +2 | grep "device$" | sed 's/\t.*$//' | while read device; do
            echo "     - $device"
        done
    else
        echo -e "${YELLOW}⚠${NC} No devices connected"
        echo "   Connect a device or start an emulator"
    fi
else
    echo -e "${YELLOW}⚠${NC} Cannot check (ADB not available)"
fi

# Check 10: Web assets
echo -n "10. Checking web build... "
if [ -d "out" ] && [ "$(ls -A out 2>/dev/null)" ]; then
    echo -e "${GREEN}✓${NC} Web assets built"
else
    echo -e "${YELLOW}⚠${NC} Web assets not built"
    echo "   Run: npm run build"
fi

echo ""
echo "=================================="
if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "You're ready to build your Android app!"
    echo ""
    echo "Next steps:"
    echo "  1. npm run build:android"
    echo "  2. npm run open:android"
    echo "  3. Build APK in Android Studio"
else
    echo -e "${RED}❌ Found $ISSUES issue(s)${NC}"
    echo ""
    echo "Please fix the issues above before building."
fi
echo "=================================="
echo ""
