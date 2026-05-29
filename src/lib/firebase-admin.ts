import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminDb: Firestore | null = null;
let adminApp: App | null = null;
let initAttempted = false;

/**
 * Get the Firebase project ID from environment variables.
 * Supports both FIREBASE_PROJECT_ID and NEXT_PUBLIC_FIREBASE_PROJECT_ID
 * to work regardless of which naming convention is used on Vercel.
 */
function getProjectId(): string | undefined {
  return process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
}

/**
 * Get the Firebase client email from environment variables.
 */
function getClientEmail(): string | undefined {
  return process.env.FIREBASE_CLIENT_EMAIL || process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL;
}

/**
 * Get the Firebase private key with robust formatting.
 *
 * Handles these common Vercel/env scenarios:
 * 1. Key with actual newlines (pasted as multi-line in Vercel UI) → no change needed
 * 2. Key with literal \n characters ("\n" as two chars) → replace with real newlines
 * 3. Key with escaped \\n (double backslash + n) → replace with real newlines
 * 4. Key wrapped in double quotes from JSON copy-paste → strip quotes
 * 5. Key with leading/trailing whitespace → trim
 */
function getPrivateKey(): string | undefined {
  const key = process.env.FIREBASE_PRIVATE_KEY || process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY;
  if (!key) return undefined;

  // Trim whitespace
  let clean = key.trim();

  // Strip surrounding double quotes if present (common from JSON copy-paste)
  if (clean.startsWith('"') && clean.endsWith('"')) {
    clean = clean.slice(1, -1);
  }

  // Replace literal \n (backslash + n, two characters) with actual newlines
  // Also handles \\n (double backslash + n) — the regex matches \n
  clean = clean.replace(/\\n/g, '\n');

  // Final trim again in case there were trailing quotes after quote removal
  clean = clean.trim();

  return clean;
}

/**
 * Normalize private key further by removing any \r characters (Windows line endings).
 * Also ensures the key starts and ends with the proper PEM markers.
 */
function normalizePrivateKey(key: string): string {
  // Remove carriage returns
  let normalized = key.replace(/\r/g, '');

  // Ensure there's a trailing newline after the END line (Firebase expects it)
  if (!normalized.endsWith('\n')) {
    normalized += '\n';
  }

  return normalized;
}

/**
 * Check if all required Firebase Admin credentials are available.
 */
function hasValidCredentials(): boolean {
  const projectId = getProjectId();
  const clientEmail = getClientEmail();
  const privateKey = getPrivateKey();

  // Check that all three values exist and the private key isn't the placeholder
  if (!projectId || !clientEmail || !privateKey) {
    return false;
  }

  if (privateKey.includes('Your-Private-Key-Here') || privateKey.includes('your_private_key')) {
    return false;
  }

  // Quick PEM format validation
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    console.warn('Firebase private key appears to be missing the PEM header');
    return false;
  }

  if (!privateKey.includes('-----END PRIVATE KEY-----')) {
    console.warn('Firebase private key appears to be missing the PEM footer');
    return false;
  }

  return true;
}

/**
 * Initialize Firebase Admin SDK.
 * Called automatically at module load time, and can also be called lazily.
 */
function initFirebaseAdmin(): void {
  if (initAttempted) return;
  initAttempted = true;

  if (!hasValidCredentials()) {
    console.warn('Firebase Admin SDK credentials not configured or invalid');
    console.warn('Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in Vercel env vars');
    console.warn('Also set GOOGLE_CLOUD_FIRESTORE_PREFER_REST=1 in Vercel to avoid gRPC native binding issues');
    return;
  }

  try {
    adminApp = getApps().length === 0
      ? initializeApp({
          credential: cert({
            projectId: getProjectId()!,
            clientEmail: getClientEmail()!,
            privateKey: normalizePrivateKey(getPrivateKey()!)
          })
        })
      : getApps()[0];

    adminDb = getFirestore(adminApp);
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    console.error('Check that FIREBASE_PRIVATE_KEY in Vercel env vars:');
    console.error('  1. Does NOT have surrounding quotes');
    console.error('  2. Has \\n representing newlines (one backslash + n)');
    console.error('  3. Starts with "-----BEGIN PRIVATE KEY-----"');
    console.error('  4. Ends with "-----END PRIVATE KEY-----"');
    // Reset so next call can retry in case it was a transient error
    initAttempted = false;
  }
}

/**
 * Get the Firebase Admin Firestore instance.
 * Initializes the Admin SDK if not already done.
 * Returns null if credentials are not configured.
 */
export function getAdminDb(): Firestore | null {
  if (!adminDb && !initAttempted) {
    initFirebaseAdmin();
  }
  return adminDb;
}

/**
 * Legacy export for backward compatibility.
 * Initialize at module load time so existing imports still work.
 */
initFirebaseAdmin();
export { adminDb };
