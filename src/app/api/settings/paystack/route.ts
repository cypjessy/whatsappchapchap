import { NextRequest, NextResponse } from "next/server";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// Default settings for fallback
const DEFAULT_SETTINGS = {
  channels: {
    card: true,
    bank: true,
    transfer: false,
    ussd: false,
    mobileMoney: false,
    qr: false,
  },
  metadata: {
    businessName: "",
    businessEmail: "",
    logoUrl: "",
    description: "",
  },
};

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
    const tenantId = userDoc.data()?.tenantId || `tenant_${uid}`;

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
    
    // Return settings structure (include webhook secret for prefilling)
    return NextResponse.json({
      configured: true,
      mode: data.mode || "test",
      testPublicKey: data.testPublicKey || "",
      livePublicKey: data.livePublicKey || "",
      currency: data.currency || "NGN",
      channels: data.channels || DEFAULT_SETTINGS.channels,
      metadata: data.metadata || DEFAULT_SETTINGS.metadata,
      webhookUrl: data.webhookUrl || "",
      webhookSecret: data.webhookSecret || "",  // Return for prefilling (authenticated users only)
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

    // Derive tenantId from user's UID (format: tenant_${uid})
    const tenantId = `tenant_${uid}`;

    // Verify tenant exists
    const tenantDoc = await adminDb.collection("tenants").doc(tenantId).get();
    if (!tenantDoc.exists) {
      return NextResponse.json({ error: "Tenant not found for user" }, { status: 403 });
    }

    const { testPublicKey, testSecretKey, livePublicKey, liveSecretKey, webhookSecret, mode, currency, channels, metadata } = await req.json();

    // Validation - at least current mode keys are required, webhook secret is optional
    const currentModeKeys = mode === "test" 
      ? { publicKey: testPublicKey, secretKey: testSecretKey }
      : { publicKey: livePublicKey, secretKey: liveSecretKey };

    if (!currentModeKeys.publicKey || !currentModeKeys.secretKey) {
      return NextResponse.json(
        { error: "API keys are required for the selected mode" },
        { status: 400 }
      );
    }

    // Validate mode is valid
    if (mode !== "test" && mode !== "live") {
      return NextResponse.json(
        { error: "Mode must be 'test' or 'live'" },
        { status: 400 }
      );
    }

    // Validate current mode public key format
    const expectedPrefix = mode === "live" ? "pk_live_" : "pk_test_";
    if (!currentModeKeys.publicKey.startsWith(expectedPrefix)) {
      return NextResponse.json(
        { error: `Invalid public key format. Must start with ${expectedPrefix}` },
        { status: 400 }
      );
    }

    // Validate current mode secret key format
    const secretPrefix = mode === "live" ? "sk_live_" : "sk_test_";
    if (!currentModeKeys.secretKey.startsWith(secretPrefix)) {
      return NextResponse.json(
        { error: `Invalid secret key format. Must start with ${secretPrefix}` },
        { status: 400 }
      );
    }

    // Validate other mode keys if provided
    if (mode === "test" && livePublicKey && livePublicKey.length > 0) {
      if (!livePublicKey.startsWith("pk_live_")) {
        return NextResponse.json(
          { error: "Invalid live public key format. Must start with pk_live_" },
          { status: 400 }
        );
      }
    }
    
    if (mode === "test" && liveSecretKey && liveSecretKey.length > 0) {
      if (!liveSecretKey.startsWith("sk_live_")) {
        return NextResponse.json(
          { error: "Invalid live secret key format. Must start with sk_live_" },
          { status: 400 }
        );
      }
    }

    if (mode === "live" && testPublicKey && testPublicKey.length > 0) {
      if (!testPublicKey.startsWith("pk_test_")) {
        return NextResponse.json(
          { error: "Invalid test public key format. Must start with pk_test_" },
          { status: 400 }
        );
      }
    }
    
    if (mode === "live" && testSecretKey && testSecretKey.length > 0) {
      if (!testSecretKey.startsWith("sk_test_")) {
        return NextResponse.json(
          { error: "Invalid test secret key format. Must start with sk_test_" },
          { status: 400 }
        );
      }
    }

    // Check if document already exists to preserve createdAt
    const ref = adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("settings")
      .doc("paystack");

    const existing = await ref.get();

    // Save to Firestore with new data structure
    await ref.set({
      testPublicKey,
      testSecretKey,
      livePublicKey,
      liveSecretKey,
      webhookSecret,
      mode,
      currency,
      channels,
      metadata,
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
