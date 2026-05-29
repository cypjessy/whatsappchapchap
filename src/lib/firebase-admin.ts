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
 * Get the Firebase private key with proper newline handling.
 * Vercel may store the key with literal \n characters instead of actual newlines.
 */
function getPrivateKey(): string | undefined {
  const key = process.env.FIREBASE_PRIVATE_KEY || process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY;
  if (!key) return undefined;
  // Replace literal \n (backslash + n) with actual newlines
  return key.replace(/\\n/g, '\n');
}

/**
 * Check if all required Firebase Admin credentials are available.
 */
function hasValidCredentials(): boolean {
  const projectId = getProjectId();
  const clientEmail = getClientEmail();
  const privateKey = getPrivateKey();
  
  return !!(
    projectId &&
    clientEmail &&
    privateKey &&
    !privateKey.includes('Your-Private-Key-Here')
  );
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
    return;
  }
  
  try {
    adminApp = getApps().length === 0
      ? initializeApp({
          credential: cert({
            projectId: getProjectId()!,
            clientEmail: getClientEmail()!,
            privateKey: getPrivateKey()!
          })
        })
      : getApps()[0];
    
    adminDb = getFirestore(adminApp);
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    // Reset so next call can retry
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
