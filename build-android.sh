#!/bin/bash

# Build script for Capacitor Android App
# This script builds the Next.js app and prepares it for Capacitor

echo "🔨 Building Next.js app for Capacitor..."

# Clean previous builds
rm -rf out

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
