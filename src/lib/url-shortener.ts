// Custom URL Shortener using Vercel + Firebase
// Creates short links like: yourdomain.com/go/abc123

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
let adminDb: ReturnType<typeof getFirestore> | null = null;

function getAdminDb() {
  if (!adminDb) {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    }
    adminDb = getFirestore();
  }
  return adminDb;
}

/**
 * Generate a random short code (6 characters)
 * Example: "abc123", "x7k9mz"
 */
function generateShortCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Shorten a URL by creating a short link in our database
 * Returns: https://yourdomain.com/go/abc123
 */
export async function shortenURL(longURL: string): Promise<string> {
  try {
    const db = getAdminDb();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://whatsappchapchap.vercel.app';
    
    console.log(`[URL Shortener] Input URL: ${longURL}`);
    console.log(`[URL Shortener] Base URL: ${baseUrl}`);
    
    // Clean up the URL - remove any query parameters, fragments, or webhook paths
    let cleanUrl = longURL.split('?')[0].split('#')[0];
    
    // Remove /api/webhook/whatsapp if present (common mistake in product data)
    cleanUrl = cleanUrl.replace(/\/api\/webhook\/whatsapp/g, '');
    
    // Ensure URL starts with https://
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = baseUrl + (cleanUrl.startsWith('/') ? '' : '/') + cleanUrl;
    }
    
    console.log(`[URL Shortener] Cleaned URL: ${cleanUrl}`);
    
    // Check if URL already has a short code (avoid duplicates)
    const existingDoc = await db
      .collection("shortLinks")
      .where("fullUrl", "==", cleanUrl)
      .limit(1)
      .get();
    
    if (!existingDoc.empty) {
      const existing = existingDoc.docs[0].data();
      const shortUrl = `${baseUrl}/go/${existing.code}`;
      console.log(`[URL Shortener] Found existing: ${shortUrl}`);
      return shortUrl;
    }
    
    // Generate unique short code
    let code = generateShortCode();
    let attempts = 0;
    
    // Ensure code is unique (max 10 attempts)
    while (attempts < 10) {
      const doc = await db.collection("shortLinks").doc(code).get();
      if (!doc.exists) break;
      code = generateShortCode();
      attempts++;
    }
    
    console.log(`[URL Shortener] Generated code: ${code}`);
    
    // Save to database
    await db
      .collection("shortLinks")
      .doc(code)
      .set({
        code,
        fullUrl: cleanUrl,
        createdAt: new Date(),
        clicks: 0,
      });
    
    const shortUrl = `${baseUrl}/go/${code}`;
    console.log(`[URL Shortener] Created: ${shortUrl}`);
    return shortUrl;
  } catch (error) {
    console.error('[URL Shortener] Error:', error);
    console.error('[URL Shortener] Returning original URL as fallback');
    return longURL; // Fallback to original
  }
}

/**
 * Format order link for WhatsApp with vibrant styling
 * Returns a formatted string with emojis and clickable link
 */
export function formatOrderLink(orderLink: string, shortUrl?: string): string {
  const displayUrl = shortUrl || orderLink;
  
  // WhatsApp button-style format with vibrant emojis
  return `\n🛒 *ORDER NOW:* ${displayUrl}`;
}

/**
 * Create a short product code for manual entry (fallback)
 * Example: "ORD-ABC123"
 */
export function generateProductCode(productId: string): string {
  // Create a short code from product ID
  const hash = productId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const code = Math.abs(hash).toString(36).toUpperCase().slice(0, 6);
  return `ORD-${code}`;
}
