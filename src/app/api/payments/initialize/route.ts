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
    const tenantId = decodedToken.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "No tenant ID in token" }, { status: 403 });
    }

    const { email, amount, orderId, metadata } = await req.json();

    // Validation
    if (!email || !amount || !orderId) {
      return NextResponse.json(
        { error: "Email, amount, and orderId are required" },
        { status: 400 }
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
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/payments/callback`,
        metadata: { 
          orderId, 
          tenantId,
          ...metadata 
        },
      }),
    });

    const data = await response.json();
    
    if (!data.status) {
      throw new Error(data.message || "Failed to initialize payment");
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
