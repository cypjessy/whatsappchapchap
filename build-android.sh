#!/bin/bash

# Build script for Capacitor Android App
# This script builds the Next.js app and prepares it for Capacitor

echo "🔨 Building Next.js app for Capacitor..."

# Ensure NEXT_PUBLIC_API_URL is set (required for Android)
if [ -z "${NEXT_PUBLIC_API_URL:-}" ] && [ -f ".env.local" ]; then
    export NEXT_PUBLIC_API_URL=$(grep "^NEXT_PUBLIC_API_URL=" .env.local | cut -d '=' -f2)
fi
if [ -z "${NEXT_PUBLIC_API_URL:-}" ]; then
    echo "⚠️  WARNING: NEXT_PUBLIC_API_URL not set! Defaulting to https://whatsappchapchap.vercel.app"
    export NEXT_PUBLIC_API_URL="https://whatsappchapchap.vercel.app"
fi
echo "✅ NEXT_PUBLIC_API_URL = $NEXT_PUBLIC_API_URL"

# Thorough clean of all build artifacts (prevents APK size bloat)
echo "🧹 Cleaning all build artifacts..."
rm -rf .next out android/app/build 2>/dev/null || true
echo "✅ Clean complete"

# Build the app
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📱 Syncing with Capacitor..."
    npx cap sync android
    echo "✅ Sync complete!"
    echo ""
    echo "🎉 Ready to build Android app!"
    echo "Run 'npx cap open android' to open in Android Studio"
else
    echo "❌ Build failed!"
    exit 1
fi
