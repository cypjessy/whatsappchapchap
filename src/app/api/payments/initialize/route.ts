import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

/**
 * Paystack Initialize Route
 * 
 * ⚠️  CURRENTLY UNUSED - Checkout page uses direct popup mode (no server initialize)
 * 
 * This route is kept for future use cases:
 * - Redirect mode payments (instead of popup)
 * - Server-side payment flows
 * - Dashboard-initiated payments
 * - Subscription/recurring payment setups
 * 
 * When using this route, ensure you understand the amount conversion:
 * - Client sends amount in KES (whole units, e.g., 1500 for KES 1,500)
 * - Route converts to kobo/cents (multiplies by 100) before sending to Paystack API
 */

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
    const { email, amount, orderId, tenantId, metadata } = await req.json();

    // Validation - require tenantId from request body (customer-facing endpoint)
    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

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

    // Get tenant's Paystack credentials using tenantId from request
    const { secretKey } = await getTenantPaystack(tenantId);

    // Initialize transaction with Paystack (for reference generation only)
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        // ⚠️  IMPORTANT: Expects amount in KES (whole units). Converts to kobo internally.
        // Example: amount=1500 (KES) → sends 150000 (kobo) to Paystack API
        amount: Math.round(amount * 100), // Convert KES to cents for Paystack API
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
