import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminDb: Firestore | null = null;
let adminApp: App | null = null;

// Initialize Firebase Admin SDK for server-side API routes
// Only initialize if we have valid credentials
if (
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY &&
  !process.env.FIREBASE_PRIVATE_KEY.includes('Your-Private-Key-Here')
) {
  try {
    adminApp = getApps().length === 0
      ? initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
          })
        })
      : getApps()[0];
    
    adminDb = getFirestore(adminApp);
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    console.warn('API routes requiring Admin SDK will not work until credentials are configured');
  }
} else {
  console.warn('Firebase Admin SDK credentials not configured or invalid');
  console.warn('Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local');
}

export { adminDb };
