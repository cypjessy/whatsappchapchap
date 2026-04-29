import { NextRequest, NextResponse } from "next/server";
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
 * GET /go/[code]
 * Redirects short URL to full order link
 * Example: /go/abc123 -> https://yourapp.com/order/laptops/prod_123...
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    
    console.log(`[Short Link] Looking up code: ${code}`);
    
    // Lookup short code in database
    const db = getAdminDb();
    const shortLinkDoc = await db
      .collection("shortLinks")
      .doc(code)
      .get();
    
    if (!shortLinkDoc.exists) {
      console.error(`[Short Link] Code not found: ${code}`);
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    const data = shortLinkDoc.data();
    const fullUrl = data?.fullUrl;
    
    if (!fullUrl) {
      console.error(`[Short Link] No URL for code: ${code}`);
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    console.log(`[Short Link] Redirecting to: ${fullUrl}`);
    
    // Track click (optional analytics)
    await db
      .collection("shortLinks")
      .doc(code)
      .update({
        clicks: (data?.clicks || 0) + 1,
        lastClicked: new Date(),
      }).catch(err => console.error('[Short Link] Click tracking error:', err));
    
    // Redirect to full URL with 301 (permanent) or 302 (temporary)
    return NextResponse.redirect(fullUrl, 302);
  } catch (error) {
    console.error("[Short Link] Error:", error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
