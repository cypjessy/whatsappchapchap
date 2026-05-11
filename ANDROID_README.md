# 📱 Android App - Quick Reference

## ⚡ Quick Commands

```bash
# Check if everything is ready
./check-android-setup.sh

# Build the app
npm run build:android

# Open in Android Studio
npm run open:android

# Run on device
npm run run:android

# Run with live reload (development)
npm run run:android:live
```

## 📋 Build Checklist

- [ ] Backend deployed (Vercel/Railway/Render)
- [ ] `.env.local` created with `NEXT_PUBLIC_API_URL`
- [ ] Android Studio installed
- [ ] Java JDK 17+ installed
- [ ] Run: `npm run build:android`
- [ ] Open Android Studio: `npm run open:android`
- [ ] Build APK in Android Studio

## 📁 Important Files

| File | Purpose |
|------|---------|
| `capacitor.config.ts` | Capacitor configuration |
| `.env.example` | Environment variables template |
| `BUILD_ANDROID_QUICKSTART.md` | Step-by-step guide |
| `ANDROID_SETUP.md` | Detailed documentation |
| `android/` | Android project directory |

## 🔗 Documentation

- **Quick Start**: [BUILD_ANDROID_QUICKSTART.md](BUILD_ANDROID_QUICKSTART.md)
- **Full Guide**: [ANDROID_SETUP.md](ANDROID_SETUP.md)
- **Complete Info**: [ANDROID_TRANSFORMATION_COMPLETE.md](ANDROID_TRANSFORMATION_COMPLETE.md)

## 🆘 Troubleshooting

**API not working?** → Deploy backend and set `NEXT_PUBLIC_API_URL`  
**Gradle errors?** → Invalidate caches in Android Studio  
**App crashes?** → Check logcat for errors  
**Need help?** → Read the full guides above

---

For detailed instructions, see [BUILD_ANDROID_QUICKSTART.md](BUILD_ANDROID_QUICKSTART.md)
