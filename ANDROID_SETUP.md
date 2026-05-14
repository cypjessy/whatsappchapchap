# WhatsApp Chap Chap - Android App Setup Guide

## Overview
This guide explains how to build your Next.js WhatsApp Chap Chap app as an Android application using Capacitor.

## Important Architecture Note

Your app uses Next.js API routes which require a server. For the Android app, you have two options:

### Option 1: Hybrid Approach (Recommended for Development)
- Build the frontend as static files
- Deploy API backend separately (Vercel, Railway, etc.)
- Configure the app to use the deployed API endpoints

### Option 2: Full Static Export (Limited Functionality)
- Remove all API dependencies
- Use client-side only features
- Connect to external services directly from the client

## Current Setup

The following has been configured:
- ✅ Capacitor installed and initialized
- ✅ Android platform added
- ✅ Basic app configuration created

## Building the Android App

### Prerequisites
1. **Android Studio** - Download from https://developer.android.com/studio
2. **Java JDK 17** - Required for Android development
3. **Android SDK** - Installed via Android Studio

### Step 1: Prepare Your Backend API

Since your app uses API routes, you need to deploy them first:

1. Deploy your Next.js app to Vercel/Railway/Render
2. Get your production API URL (e.g., `https://your-app.vercel.app`)

### Step 2: Configure API Endpoints

Create or update `.env.local` with your production API URL:

```bash
NEXT_PUBLIC_API_URL=https://your-deployed-app.vercel.app
```

Update your API calls in the codebase to use this URL instead of relative paths.

### Step 3: Build for Production

```bash
# Make the build script executable
chmod +x build-android.sh

# Run the build
./build-android.sh
```

### Step 4: Open in Android Studio

```bash
npx cap open android
```

### Step 5: Build APK in Android Studio

1. Wait for Gradle sync to complete
2. Go to **Build → Build Bundle(s) / APK(s) → Build APK**
3. Find the APK in `android/app/build/outputs/apk/debug/`

## Development Workflow

### Live Reload During Development

1. Start your Next.js dev server:
   ```bash
   npm run dev
   ```

2. In another terminal, run Capacitor with live reload:
   ```bash
   npx cap run android --livereload --external
   ```

3. The app will connect to your local dev server

### Testing on Device

1. Enable USB debugging on your Android device
2. Connect via USB
3. Run: `npx cap run android`

## Production Deployment

### Building Release APK

1. In Android Studio:
   - Go to **Build → Generate Signed Bundle / APK**
   - Choose **APK**
   - Create or select a keystore
   - Build the release APK

2. Or via command line:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

### Publishing to Play Store

1. Generate Android App Bundle (AAB):
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

2. Upload the AAB file to Google Play Console

## Troubleshooting

### Issue: API Routes Not Working
**Solution**: Deploy your Next.js app and configure the API URL in your environment variables.

### Issue: CORS Errors
**Solution**: Add CORS headers to your API routes or use a proxy.

### Issue: Images Not Loading
**Solution**: Ensure image URLs are absolute and accessible from mobile devices.

### Issue: Firebase Authentication Issues
**Solution**: 
1. Add your Android app's SHA-1 fingerprint to Firebase console
2. Update Firebase configuration in your app

## Next Steps

1. **Deploy your backend** - Set up your Next.js API on a hosting platform
2. **Configure environment variables** - Point to your production API
3. **Test thoroughly** - Test all features on actual devices
4. **Optimize performance** - Minimize bundle size and optimize images
5. **Add app icons and splash screens** - Customize for your brand

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Next.js Export Guide](https://nextjs.org/docs/advanced-features/static-html-export)
- [Android Studio Guide](https://developer.android.com/studio/intro)

## Support

For issues specific to your app's functionality, ensure:
- All environment variables are properly set
- Firebase is configured for mobile apps
- Evolution API is accessible from mobile networks
- WhatsApp integration works on mobile devices
