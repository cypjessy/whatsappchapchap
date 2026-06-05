import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

/**
 * Paystack Settings API
 * 
 * GET: Fetches saved settings for the tenant (omitting secret keys for security)
 * POST: Saves all settings (server-side only)
 */

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In this app, we extract tenantId from the request if possible, 
    // or assume the client provides it (verified against their token in production)
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId"); 

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    const db = getAdminDb();
    if (!db) return NextResponse.json({ error: "DB error" }, { status: 500 });

    const doc = await db.collection("paystackSettings").doc(tenantId).get();
    
    if (!doc.exists) {
      return NextResponse.json({ configured: false });
    }

    const data = doc.data() || {};
    
    // Security: Only return public info and existence of secret keys
    return NextResponse.json({
      configured: true,
      mode: data.mode || "test",
      testPublicKey: data.testPublicKey || "",
      livePublicKey: data.livePublicKey || "",
      webhookUrl: data.webhookUrl || "",
      // We don't send back the actual secret keys for security
      hasTestSecret: !!data.testSecretKey,
      hasLiveSecret: !!data.liveSecretKey
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, ...settings } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    const db = getAdminDb();
    if (!db) return NextResponse.json({ error: "DB error" }, { status: 500 });

    await db.collection("paystackSettings").doc(tenantId).set({
      ...settings,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
