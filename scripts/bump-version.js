#!/usr/bin/env node

/**
 * Auto Bump Version Script
 *
 * Usage: node scripts/bump-version.js
 *   or:   node scripts/bump-version.js --firestore  (also prints Firestore update command)
 *
 * What it does:
 *   1. Reads src/lib/app-version.ts → extracts APP_VERSION_CODE and APP_VERSION_NAME
 *   2. Increments versionCode by 1
 *   3. Increments patch version (e.g. "1.0.1" → "1.0.2")
 *   4. Updates BOTH src/lib/app-version.ts and android/app/build.gradle
 *   5. Prints the new version info
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

// ─── Helper: Detect Vercel URL from .env.local ───────────────────────
function getVercelUrl() {
  try {
    const envPath = path.join(ROOT, ".env.local");
    const envContent = fs.readFileSync(envPath, "utf-8");
    const match = envContent.match(/^NEXT_PUBLIC_API_URL\s*=\s*(\S+)$/m);
    if (match) {
      const base = match[1].replace(/[\"']/g, "").replace(/\/+$/, "");
      return base + "/whatsappchapchap.apk";
    }
  } catch {}
  // Fallback: hardcoded known Vercel URL
  return "https://whatsappchapchap.vercel.app/whatsappchapchap.apk";
}

// ─── File Paths ──────────────────────────────────────────────────────
const APP_VERSION_PATH = path.join(ROOT, "src/lib/app-version.ts");
const BUILD_GRADLE_PATH = path.join(ROOT, "android/app/build.gradle");

// ─── Read & Parse Current Version ────────────────────────────────────
const appVersionContent = fs.readFileSync(APP_VERSION_PATH, "utf-8");

const versionCodeMatch = appVersionContent.match(/APP_VERSION_CODE\s*=\s*(\d+)/);
const versionNameMatch = appVersionContent.match(/APP_VERSION_NAME\s*=\s*"([^"]+)"/);

if (!versionCodeMatch || !versionNameMatch) {
  console.error("❌ Could not parse version from src/lib/app-version.ts");
  process.exit(1);
}

const oldVersionCode = parseInt(versionCodeMatch[1], 10);
const oldVersionName = versionNameMatch[1];

// ─── Compute New Version ──────────────────────────────────────────────
const newVersionCode = oldVersionCode + 1;

// Parse "1.0.1" → [1, 0, 1], increment patch
const versionParts = oldVersionName.split(".").map(Number);
if (versionParts.length < 3) {
  // Pad to at least 3 parts
  while (versionParts.length < 3) versionParts.push(0);
}
versionParts[versionParts.length - 1] += 1;
const newVersionName = versionParts.join(".");

console.log(`🔢 Version bump: ${oldVersionName} (code ${oldVersionCode}) → ${newVersionName} (code ${newVersionCode})`);

// ─── Update src/lib/app-version.ts ───────────────────────────────────
let newAppVersion = appVersionContent
  .replace(/APP_VERSION_CODE\s*=\s*\d+/, `APP_VERSION_CODE = ${newVersionCode}`)
  .replace(/APP_VERSION_NAME\s*=\s*"[^"]+"/, `APP_VERSION_NAME = "${newVersionName}"`);

fs.writeFileSync(APP_VERSION_PATH, newAppVersion, "utf-8");
console.log(`✅ Updated ${path.relative(ROOT, APP_VERSION_PATH)}`);

// ─── Update android/app/build.gradle ─────────────────────────────────
let buildGradleContent = fs.readFileSync(BUILD_GRADLE_PATH, "utf-8");

buildGradleContent = buildGradleContent
  .replace(/versionCode\s+\d+/, `versionCode ${newVersionCode}`)
  .replace(/versionName\s+"[^"]+"/, `versionName "${newVersionName}"`);

fs.writeFileSync(BUILD_GRADLE_PATH, buildGradleContent, "utf-8");
console.log(`✅ Updated ${path.relative(ROOT, BUILD_GRADLE_PATH)}`);

// ─── Summary ──────────────────────────────────────────────────────────
console.log("");
console.log("╔══════════════════════════════════════════════════╗");
console.log("║            ✅ Version Bumped!                    ║");
console.log("╠══════════════════════════════════════════════════╣");
console.log(`║  Old:     ${oldVersionName.padEnd(20)} (code ${oldVersionCode})        ║`);
console.log(`║  New:     ${newVersionName.padEnd(20)} (code ${newVersionCode})        ║`);
console.log("╠══════════════════════════════════════════════════╣");
console.log("║  Next: npm run build:android                     ║");
console.log("╚══════════════════════════════════════════════════╝");
console.log("");

// ─── Firestore Update ───────────────────────────────────────────────
const useFirestore = process.argv.includes("--firestore");
if (useFirestore) {
  console.log("🔥 Updating Firestore with new version...");
  console.log("");

  // Call the Firestore update script with --url passthrough
  const firestoreArgs = [];
  if (process.argv.includes("--force")) firestoreArgs.push("--force");
  const urlIdx = process.argv.indexOf("--url");
  if (urlIdx !== -1 && urlIdx + 1 < process.argv.length) {
    firestoreArgs.push("--url", process.argv[urlIdx + 1]);
  } else {
    // Also handle --url=VALUE format
    const equalsUrl = process.argv.find(a => a.startsWith("--url="));
    if (equalsUrl) firestoreArgs.push(equalsUrl);
  }

  // Auto-detect Vercel URL for APK download
  if (!firestoreArgs.some(a => a.startsWith("--url"))) {
    const vercelUrl = getVercelUrl();
    if (vercelUrl) {
      firestoreArgs.push("--url", vercelUrl);
    }
  }

  const { spawnSync } = require("child_process");
  const result = spawnSync("node", [
    path.join(__dirname, "update-firestore-version.js"),
    ...firestoreArgs,
  ], {
    stdio: "inherit",
    cwd: ROOT,
  });

  if (result.status !== 0) {
    console.warn("⚠️  Firestore update had issues (see above).");
  }
}
