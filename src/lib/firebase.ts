import { initializeApp, getApps, FirebaseApp, getApp } from "firebase/app";
import { getAuth, Auth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (typeof window !== "undefined") {
  try {
    // Validate config
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.error('[Firebase] CRITICAL: Firebase configuration is missing or invalid. Check your .env.local file.', {
        hasApiKey: !!firebaseConfig.apiKey,
        hasProjectId: !!firebaseConfig.projectId
      });
      // Try to provide a dummy app to prevent complete crash
    }

    if (!getApps().length) {
      app = initializeApp(firebaseConfig as any);
    } else {
      app = getApp();
    }
    
    auth = getAuth(app);
    
    // CRITICAL: Set persistence to LOCAL so users stay logged in until they explicitly log out
    // This ensures session persists across browser/app restarts
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log('[Firebase] Auth persistence set to LOCAL - users stay logged in');
      })
      .catch((error) => {
        console.error('[Firebase] Failed to set auth persistence:', error);
      });
    
    db = getFirestore(app);
  } catch (error) {
    console.error('[Firebase] Initialization error:', error);
    // If it fails, we still need to export something to avoid import errors
    // but the app will likely show errors in components that use auth/db
  }
}

// Helper function for client components that need to initialize Firebase
export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

export { app, auth, db };
