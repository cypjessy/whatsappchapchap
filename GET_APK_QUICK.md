# 🚀 Quick Start: Get Your APK

## Fastest Way (No Android Studio Needed!)

### Using GitHub Actions ☁️

```bash
# 1. Push to GitHub
git add .
git commit -m "Ready to build APK"
git push origin main

# 2. Go to GitHub → Your Repo → Actions tab

# 3. Click "Run workflow" on "Build Android APK"

# 4. Wait 5-10 minutes

# 5. Download APK from Artifacts section
```

**That's it!** Your APK will be ready to download.

---

## Alternative: Build Locally

If you have Java and Android SDK installed:

```bash
chmod +x build-apk.sh
./build-apk.sh
```

APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Install on Your Phone

**Via USB:**
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**Manual:**
1. Copy APK to phone
2. Enable "Install from Unknown Sources"
3. Tap APK to install

---

## Configuration

✅ **Vercel URL**: `https://whatsappchapchap.vercel.app`  
✅ **Capacitor**: Configured  
✅ **Android Platform**: Added  
✅ **GitHub Actions**: Ready  

---

## Need Help?

📖 Full guide: [BUILD_APK_NO_STUDIO.md](BUILD_APK_NO_STUDIO.md)  
🔧 Troubleshooting: Check GitHub Actions logs  
💬 Issues: Review workflow file at `.github/workflows/build-apk.yml`
