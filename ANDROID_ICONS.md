# Android App Icons Setup

## Quick Setup Guide

### Step 1: Create Icon Files

You need to create two PNG files in the `assets/` folder:

1. **`assets/icon.png`** - App icon (1024x1024 pixels)
   - This will be automatically resized for all Android devices
   - Use your WhatsApp Chap Chap logo
   - Transparent background recommended

2. **`assets/splash.png`** - Splash screen (2732x2732 pixels)
   - Shown when app launches
   - Can include your logo on a gradient background
   - Or use solid color background

### Step 2: Generate Icons

After creating the PNG files, run:

```bash
npx capacitor-assets generate --android
```

This will automatically create all required icon sizes for Android.

### Step 3: Rebuild APK

Push to GitHub and trigger the workflow again:

```bash
git add assets/ capacitor.config.json
git commit -m "Add Android app icons"
git push origin master
```

Then go to GitHub Actions and run the workflow.

---

## How to Create the Icon Files

### Option 1: Online Tools (Easiest)

**For App Icon:**
1. Go to https://cloudconvert.com/svg-to-png
2. Upload `public/icon.svg`
3. Set width: **1024**, height: **1024**
4. Download and save as `assets/icon.png`

**For Splash Screen:**
1. Use Canva or Figma to create a 2732x2732 image
2. Add your logo on gradient background (#667eea to #764ba2)
3. Export as PNG
4. Save as `assets/splash.png`

### Option 2: Using Inkscape (Linux)

```bash
# Install Inkscape if not installed
sudo apt install inkscape

# Convert SVG to PNG for icon
inkscape --export-type=png --export-width=1024 --export-height=1024 public/icon.svg -o assets/icon.png

# Create splash screen (you'll need to design this separately)
```

### Option 3: Using GIMP

1. Open `public/icon.svg` in GIMP
2. Image → Scale Image → Set to 1024x1024
3. Export As → `assets/icon.png`

---

## Icon Requirements

### App Icon (`icon.png`)
- **Size:** 1024x1024 pixels
- **Format:** PNG with transparency
- **Design:** 
  - Keep important elements centered
  - Avoid thin lines (they may disappear at small sizes)
  - Use high contrast colors
  - Recommended: WhatsApp green (#25D366) theme

### Splash Screen (`splash.png`)
- **Size:** 2732x2732 pixels (or 2048x2048 minimum)
- **Format:** PNG
- **Background:** Gradient or solid color
- **Content:** Optional logo in center
- **Safe Zone:** Keep important content within center 50%

---

## Current Configuration

The app is configured with:
- **Icon Background Color:** #25D366 (WhatsApp Green)
- **Splash Background Color:** #667eea (Purple gradient start)
- **Splash Scale Type:** CENTER_CROP

These can be adjusted in `capacitor.config.json`.

---

## Testing Icons Locally

If you want to test before building:

```bash
# Sync icons with Android project
npx cap sync android

# Open in Android Studio (optional)
npx cap open android
```

---

## Troubleshooting

**Icons not showing?**
- Make sure files are named exactly `icon.png` and `splash.png`
- Check they're in the `assets/` folder
- Run `npx capacitor-assets generate --android` again

**Icons look blurry?**
- Ensure source images are high resolution (1024x1024+)
- Don't upscale small images

**Wrong colors?**
- Update `capacitor.config.json` with correct hex colors
- Regenerate assets
