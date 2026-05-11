# 🚀 Quick Start: Build Android App

## Prerequisites Checklist

Before building, ensure you have:
- [ ] Node.js installed (✅ Already installed)
- [ ] Android Studio installed
- [ ] Java JDK 17 installed
- [ ] Android SDK installed (via Android Studio)
- [ ] Your Next.js app deployed to a hosting platform (Vercel, Railway, etc.)

## Step-by-Step Guide

### 1️⃣ Deploy Your Backend (Required!)

Your app uses API routes that need a server. Deploy your app first:

```bash
# Option A: Deploy to Vercel (Recommended)
npm install -g vercel
vercel

# Option B: Deploy to Railway
# Connect your GitHub repo to Railway.app

# Option C: Deploy to Render
# Connect your GitHub repo to Render.com
```

After deployment, note your production URL (e.g., `https://your-app.vercel.app`)

### 2️⃣ Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Copy the example
cp .env.example .env.local

# Edit .env.local and set:
NEXT_PUBLIC_API_URL=https://your-deployed-app.vercel.app
```

**Important**: Replace with your actual deployed URL!

### 3️⃣ Install Dependencies

```bash
npm install
```

(Capacitor dependencies are already installed ✅)

### 4️⃣ Build the Web App

```bash
npm run build
```

This creates the `out` directory with static files.

### 5️⃣ Sync with Capacitor

```bash
npx cap sync android
```

This copies your web assets to the Android project.

### 6️⃣ Open in Android Studio

```bash
npx cap open android
```

Android Studio will open automatically.

### 7️⃣ Build APK

In Android Studio:

1. **Wait for Gradle sync** to complete (watch the bottom status bar)
2. Go to **Build → Build Bundle(s) / APK(s) → Build APK**
3. Wait for the build to complete
4. Click **locate** when prompted to find the APK

The APK will be at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### 8️⃣ Install on Device

**Option A: Via USB**
1. Enable USB debugging on your Android device
2. Connect via USB
3. Run: `adb install android/app/build/outputs/apk/debug/app-debug.apk`

**Option B: Manual Transfer**
1. Copy the APK to your device
2. Enable "Install from Unknown Sources"
3. Tap the APK to install

## 🧪 Development Mode (Live Reload)

For faster development with live reload:

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run on device with live reload
npm run run:android:live
```

Changes to your code will automatically reload in the app!

## 📱 Testing on Emulator

1. Open Android Studio
2. Go to **Tools → Device Manager**
3. Create/start an emulator
4. Run: `npx cap run android`

## 🔧 Common Issues & Solutions

### Issue: "Cannot connect to API"
**Solution**: 
- Ensure `NEXT_PUBLIC_API_URL` is set correctly in `.env.local`
- Verify your backend is deployed and accessible
- Check CORS settings on your backend

### Issue: "Gradle sync failed"
**Solution**:
- Open Android Studio
- Go to **File → Invalidate Caches / Restart**
- Re-sync Gradle files

### Issue: "App crashes on startup"
**Solution**:
- Check Android Studio logcat for errors
- Ensure all environment variables are set
- Verify Firebase configuration for Android

### Issue: "Images not loading"
**Solution**:
- Use absolute URLs for images
- Ensure image hosting allows mobile access
- Check Android network security config

## 🎯 Next Steps After Building

1. **Test thoroughly** on real devices
2. **Add app icons** - Replace icons in `android/app/src/main/res/`
3. **Configure splash screen** - Update in `android/app/src/main/res/`
4. **Set up Firebase for Android**:
   - Add Android app in Firebase Console
   - Download `google-services.json`
   - Place in `android/app/`
5. **Generate release APK** for distribution
6. **Publish to Play Store** (optional)

## 📚 Useful Commands

```bash
# Build and sync
npm run build:android

# Open Android Studio
npm run open:android

# Run on connected device
npm run run:android

# Run with live reload
npm run run:android:live

# List connected devices
adb devices

# View app logs
adb logcat | grep -i "chromium\|console"
```

## 💡 Pro Tips

1. **Always test on real devices** - Emulators don't catch everything
2. **Use Chrome DevTools** for debugging:
   - Open Chrome
   - Go to `chrome://inspect/#devices`
   - Select your device/app
3. **Optimize images** before including them
4. **Minimize bundle size** for faster loads
5. **Handle offline states** gracefully

## 🆘 Need Help?

- Check `ANDROID_SETUP.md` for detailed documentation
- Review Capacitor docs: https://capacitorjs.com/docs
- Check Android Studio logs for errors
- Test API endpoints separately first

---

**Ready to build?** Start with Step 1 and follow along! 🚀
