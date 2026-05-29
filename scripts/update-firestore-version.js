#!/usr/bin/env node

/**
 * Firestore Version Updater
 *
 * Updates the Firestore appVersions/android document with the current app version.
 * This triggers the forced update dialog on users running older versions.
 *
 * Usage:
 *   node scripts/update-firestore-version.js                                    # Just update latestVersion
 *   node scripts/update-firestore-version.js --force                            # Also bump minimumVersion (forces old users to update)
 *   node scripts/update-firestore-version.js --url https://example.com/app.apk  # Set the APK download URL
 *   node scripts/update-firestore-version.js --force --url https://...          # Full release
 *
 * Prerequisites:
 *   Firebase Admin credentials must be set as environment variables or in .env.local:
 *     FIREBASE_PROJECT_ID=your-project-id
 *     FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
 *     FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

// ─── Parse Arguments ──────────────────────────────────────────────────
const args = process.argv.slice(2);
const shouldForce = args.includes("--force") || args.includes("-f");
const urlArg = args.find((a) => a.startsWith("--url="));
const manualUrl = urlArg ? urlArg.split("=")[1] : args.find((a) => a.startsWith("-u="))?.split("=")[1];

// ─── Read Current Version ────────────────────────────────────────────
const appVersionPath = path.join(ROOT, "src/lib/app-version.ts");
const appVersionContent = fs.readFileSync(appVersionPath, "utf-8");

const versionCodeMatch = appVersionContent.match(/APP_VERSION_CODE\s*=\s*(\d+)/);
const versionNameMatch = appVersionContent.match(/APP_VERSION_NAME\s*=\s*"([^"]+)"/);
const firestorePathMatch = appVersionContent.match(/APP_VERSION_FIRESTORE_PATH\s*=\s*"([^"]+)"/);

if (!versionCodeMatch || !versionNameMatch) {
  console.error("❌ Could not parse version from src/lib/app-version.ts");
  process.exit(1);
}

const versionCode = parseInt(versionCodeMatch[1], 10);
const versionName = versionNameMatch[1];
const firestorePath = firestorePathMatch ? firestorePathMatch[1] : "appVersions/android";

console.log(`📱 Current version: ${versionName} (code ${versionCode})`);
console.log(`📝 Firestore path: ${firestorePath}`);
console.log(`🔧 Force update: ${shouldForce ? "YES ⚠️" : "No (only latestVersion)"}`);
console.log("");

// ─── Load Firebase Admin Credentials ──────────────────────────────────
function loadEnvVar(key) {
  // 1. Check process.env (already set in shell)
  if (process.env[key]) return process.env[key];

  // 2. Try reading from .env.local
  try {
    const envPath = path.join(ROOT, ".env.local");
    const envContent = fs.readFileSync(envPath, "utf-8");
    const match = envContent.match(new RegExp(`^${key}\\s*=\\s*(.*)$`, "m"));
    if (match) {
      let value = match[1].trim();
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      return value;
    }
  } catch {
    // .env.local doesn't exist or can't be read
  }

  return null;
}

const PROJECT_ID = loadEnvVar("FIREBASE_PROJECT_ID");
const CLIENT_EMAIL = loadEnvVar("FIREBASE_CLIENT_EMAIL");
const PRIVATE_KEY = loadEnvVar("FIREBASE_PRIVATE_KEY");

if (!PROJECT_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
  console.error("❌ Firebase Admin credentials not found!");
  console.error("");
  console.error("  Add these to your .env.local file:");
  console.error("");
  console.error("  FIREBASE_PROJECT_ID=your-project-id");
  console.error("  FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com");
  console.error('  FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----"');
  console.error("");
  console.error("  💡 Get these from Firebase Console:");
  console.error("     Project Settings → Service Accounts → Generate New Private Key");
  console.error("");
  process.exit(1);
}

// ─── Initialize Firebase Admin & Update Firestore ────────────────────
async function main() {
  try {
    const { initializeApp, getApps, cert } = require("firebase-admin/app");
    const { getFirestore } = require("firebase-admin/firestore");

    // Initialize Admin SDK
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId: PROJECT_ID,
          clientEmail: CLIENT_EMAIL,
          privateKey: PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
    }

    const db = getFirestore();
    const docRef = db.doc(firestorePath);

    // ─── Prepare Update Data ────────────────────────────────────────
    const updateData = {
      latestVersionCode: versionCode,
      latestVersionName: versionName,
      updatedAt: new Date(),
    };

    // When forcing, also bump the minimum version (triggers force update on old apps)
    if (shouldForce) {
      updateData.minimumVersionCode = versionCode;
      updateData.minimumVersionName = versionName;
    }

    // Set APK download URL if provided
    if (manualUrl) {
      updateData.updateUrl = manualUrl;
    }

    // ─── Ask for APK URL if not provided ────────────────────────────
    if (!manualUrl) {
      const readline = require("readline");
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const url = await new Promise((resolve) => {
        rl.question(
          "🌐 Enter APK download URL (or press Enter to skip): ",
          (answer) => {
            resolve(answer.trim());
          }
        );
      });
      rl.close();

      if (url) {
        updateData.updateUrl = url;
      }
    }

    // ─── Read existing doc to preserve fields ────────────────────────
    const existingSnap = await docRef.get();
    if (existingSnap.exists) {
      const existing = existingSnap.data();

      // Preserve minimumVersion if we're not forcing an update
      if (!shouldForce && existing.minimumVersionCode != null) {
        updateData.minimumVersionCode = existing.minimumVersionCode;
        updateData.minimumVersionName = existing.minimumVersionName;
      }

      // Preserve existing updateUrl if none provided
      if (!updateData.updateUrl && existing.updateUrl) {
        updateData.updateUrl = existing.updateUrl;
      }

      // Preserve existing forceUpdateMessage
      if (existing.forceUpdateMessage) {
        updateData.forceUpdateMessage = existing.forceUpdateMessage;
      }
    }

    // ─── Write to Firestore ─────────────────────────────────────────
    await docRef.set(updateData, { merge: true });

    console.log("");
    console.log("╔══════════════════════════════════════════════════╗");
    console.log("║    ✅ Firestore Version Updated!                 ║");
    console.log("╠══════════════════════════════════════════════════╣");
    console.log(`║  Path:     ${firestorePath.padEnd(27)} ║`);
    console.log(`║  Latest:   ${versionName.padEnd(20)} (${versionCode})        ║`);
    console.log(`║  Minimum:  ${(shouldForce ? versionName : existingSnap.exists ? "preserved" : versionName).padEnd(20)} ${String(shouldForce ? versionCode : existingSnap.exists ? "-" : versionCode).padEnd(8)}║`);
    console.log(`║  URL:      ${(updateData.updateUrl || "(not set)").padEnd(26)} ║`);
    console.log(`║  Updated:  ${new Date().toISOString().slice(0, 19).replace("T", " ")}           ║`);
    console.log("╚══════════════════════════════════════════════════╝");
    console.log("");

    if (shouldForce) {
      console.log("⚠️  FORCE UPDATE ENABLED — Users on older versions will see the update dialog.");
    } else {
      console.log("ℹ️  Only latestVersion updated. Existing users are NOT forced to update.");
      console.log("   Pass --force to also bump minimumVersionCode and force updates.");
    }
  } catch (error) {
    console.error("❌ Failed to update Firestore:", error.message);
    console.error("");
    console.error("   Make sure:");
    console.error("   • Firebase Admin credentials are correct");
    console.error("   • The service account has Firestore write permissions");
    console.error("   • Your internet connection is working");
    process.exit(1);
  }
}

main();
