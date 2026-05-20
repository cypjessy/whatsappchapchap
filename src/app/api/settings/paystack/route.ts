import { NextRequest, NextResponse } from "next/server";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// GET — return only public key to client (never expose secretKey)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const uid = decodedToken.uid;

    if (!adminDb) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    // Fetch tenantId from user's Firestore record
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const tenantId = userDoc.data()?.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant not found for user" }, { status: 403 });
    }

    const doc = await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("settings")
      .doc("paystack")
      .get();

    if (!doc.exists) {
      return NextResponse.json({ configured: false });
    }

    const data = doc.data()!;
    
    // Only return public key - NEVER expose secretKey or webhookSecret
    return NextResponse.json({
      configured: true,
      publicKey: data.publicKey,
      isLive: data.isLive,
    });
  } catch (error) {
    console.error("Error fetching Paystack settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// POST — save Paystack credentials (server-side only)
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const uid = decodedToken.uid;

    if (!adminDb) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    // Fetch tenantId from user's Firestore record
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const tenantId = userDoc.data()?.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant not found for user" }, { status: 403 });
    }

    const { publicKey, secretKey, webhookSecret, isLive } = await req.json();

    // Validation
    if (!publicKey || !secretKey || !webhookSecret) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate isLive is a boolean
    if (typeof isLive !== "boolean") {
      return NextResponse.json(
        { error: "isLive must be a boolean (true for live, false for test)" },
        { status: 400 }
      );
    }

    // Validate public key format
    const expectedPrefix = isLive ? "pk_live_" : "pk_test_";
    if (!publicKey.startsWith(expectedPrefix)) {
      return NextResponse.json(
        { error: `Invalid public key format. Must start with ${expectedPrefix}` },
        { status: 400 }
      );
    }

    // Validate secret key format
    const secretPrefix = isLive ? "sk_live_" : "sk_test_";
    if (!secretKey.startsWith(secretPrefix)) {
      return NextResponse.json(
        { error: `Invalid secret key format. Must start with ${secretPrefix}` },
        { status: 400 }
      );
    }

    // Check if document already exists to preserve createdAt
    const ref = adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("settings")
      .doc("paystack");

    const existing = await ref.get();

    // Save to Firestore - only set createdAt on first creation
    await ref.set({
      publicKey,
      secretKey,   // stored server-side, never returned to client
      webhookSecret,
      isLive,
      updatedAt: FieldValue.serverTimestamp(),
      // Only set createdAt if document doesn't exist yet
      ...(!existing.exists && { createdAt: FieldValue.serverTimestamp() }),
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving Paystack settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
