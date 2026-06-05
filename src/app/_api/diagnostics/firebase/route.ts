import { NextResponse } from 'next/server';

export async function GET() {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL || '';
  const privateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY || '';
  const preferRest = process.env.GOOGLE_CLOUD_FIRESTORE_PREFER_REST || '';

  const envVars = {
    projectId: !!projectId,
    clientEmail: !!clientEmail,
    privateKey: !!privateKey,
    preferRest: !!preferRest,
  };

  const allConfigured = envVars.projectId && envVars.clientEmail && envVars.privateKey;

  // Validate private key format
  let keyFormatValid = false;
  let keyFormatMessage = '';
  if (privateKey) {
    let clean = privateKey.trim();
    if (clean.startsWith('"') && clean.endsWith('"')) {
      clean = clean.slice(1, -1);
    }
    keyFormatValid = clean.includes('-----BEGIN PRIVATE KEY-----') && clean.includes('-----END PRIVATE KEY-----');
    if (keyFormatValid) {
      keyFormatMessage = 'PEM format valid (BEGIN/END markers found)';
    } else {
      keyFormatMessage = clean.includes('PRIVATE KEY')
        ? 'PEM markers found but format may be incorrect'
        : 'Missing PEM markers — check that the key starts with -----BEGIN PRIVATE KEY-----';
    }
  }

  // Get the first 20 chars to show it's populated, without leaking the key
  const keyPreview = privateKey ? privateKey.substring(0, 20) + '...' : null;

  // Try to verify by initializing Firebase Admin
  let initializationResult: {
    success: boolean;
    message: string;
    error?: string;
  } = { success: false, message: 'Not attempted' };

  if (allConfigured && keyFormatValid) {
    try {
      const { initializeApp, getApps, cert } = await import('firebase-admin/app');
      const { getFirestore } = await import('firebase-admin/firestore');

      if (getApps().length === 0) {
        // Normalize the key
        let cleanKey = privateKey.trim();
        if (cleanKey.startsWith('"') && cleanKey.endsWith('"')) {
          cleanKey = cleanKey.slice(1, -1);
        }
        cleanKey = cleanKey.replace(/\\n/g, '\n').trim();
        if (!cleanKey.endsWith('\n')) {
          cleanKey += '\n';
        }

        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: cleanKey,
          }),
        });

        initializationResult = {
          success: true,
          message: 'Firebase Admin SDK initialized successfully',
        };

        // Try a Firestore operation
        try {
          const db = getFirestore();
          await db.listCollections();
          initializationResult.message += ' — Firestore connection verified';
        } catch (fsError: any) {
          initializationResult.message += ' — Admin SDK initialized but Firestore query failed: ' + (fsError?.message || 'Unknown error');
        }
      } else {
        initializationResult = {
          success: true,
          message: 'Firebase Admin SDK was already initialized',
        };
      }
    } catch (initError: any) {
      initializationResult = {
        success: false,
        message: 'Initialization failed',
        error: initError?.message || String(initError),
      };
    }
  }

  return NextResponse.json({
    configured: allConfigured,
    initialized: initializationResult.success,
    envVars,
    keyFormat: {
      valid: keyFormatValid,
      message: keyFormatMessage,
      preview: keyPreview,
    },
    initialization: initializationResult,
  });
}
