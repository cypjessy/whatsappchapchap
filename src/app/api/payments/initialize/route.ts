import { NextRequest, NextResponse } from "next/server";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase-admin";

// Helper function to get tenant's Paystack credentials
async function getTenantPaystack(tenantId: string) {
  if (!adminDb) {
    throw new Error("Database not configured");
  }

  const doc = await adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("settings")
    .doc("paystack")
    .get();

  if (!doc.exists) {
    throw new Error("Paystack not configured for this tenant");
  }

  return doc.data() as { 
    secretKey: string; 
    publicKey: string; 
    isLive: boolean;
    webhookSecret: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
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
      return NextResponse.json({ error: "User not associated with a tenant" }, { status: 403 });
    }

    const { email, amount, orderId, metadata } = await req.json();

    // Validation - explicit check for amount > 0
    if (!email || amount == null || amount <= 0 || !orderId) {
      return NextResponse.json(
        { error: "Email, amount (must be > 0), and orderId are required" },
        { status: 400 }
      );
    }

    // Fail loudly if APP_URL not configured
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      return NextResponse.json(
        { error: "APP_URL not configured" },
        { status: 500 }
      );
    }

    // Get tenant's Paystack credentials
    const { secretKey } = await getTenantPaystack(tenantId);

    // Initialize transaction with Paystack
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100), // Convert to kobo/pesewas (smallest currency unit)
        reference: `order_${orderId}_${Date.now()}`,
        callback_url: `${appUrl}/api/payments/callback`,
        metadata: { 
          orderId, 
          tenantId,
          ...metadata 
        },
      }),
    });

    const data = await response.json();
    
    if (!data.status) {
      // Handle duplicate reference gracefully (409 Conflict)
      const statusCode = data.message?.includes("Duplicate") ? 409 : 500;
      return NextResponse.json(
        { error: data.message || "Failed to initialize payment" },
        { status: statusCode }
      );
    }

    return NextResponse.json({ 
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    });
  } catch (error: any) {
    console.error("Error initializing Paystack payment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initialize payment" },
      { status: 500 }
    );
  }
}
