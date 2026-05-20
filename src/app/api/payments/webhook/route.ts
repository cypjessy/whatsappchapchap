import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
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
    // Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature provided" }, { status: 401 });
    }

    // Parse event to extract tenantId from metadata
    const event = JSON.parse(body);
    const tenantId = event.data?.metadata?.tenantId;

    if (!tenantId) {
      console.error("Webhook received without tenantId in metadata");
      return NextResponse.json({ error: "No tenantId in metadata" }, { status: 400 });
    }

    // Fetch tenant's webhook secret to verify signature
    const { webhookSecret } = await getTenantPaystack(tenantId);

    // Verify webhook signature
    const hash = crypto
      .createHmac("sha512", webhookSecret)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      console.error("Invalid webhook signature for tenant:", tenantId);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log(`✅ Webhook verified for tenant: ${tenantId}, event: ${event.event}`);

    // Handle different event types
    if (event.event === "charge.success") {
      const { orderId } = event.data.metadata;
      const reference = event.data.reference;
      const amount = event.data.amount / 100; // Convert from kobo/pesewas
      const paidAt = new Date(event.data.paid_at);

      if (!orderId) {
        console.error("Webhook charge.success without orderId");
        return NextResponse.json({ error: "No orderId in metadata" }, { status: 400 });
      }

      // Update order status in Firestore
      if (adminDb) {
        const orderRef = adminDb
          .collection("tenants")
          .doc(tenantId)
          .collection("orders")
          .doc(orderId);

        await orderRef.update({
          paymentStatus: "paid",
          paidAt: paidAt.toISOString(),
          paymentReference: reference,
          paymentAmount: amount,
          paymentMethod: "paystack",
          updatedAt: new Date().toISOString(),
        });

        console.log(`✅ Order ${orderId} marked as paid via Paystack`);
      }
    } else if (event.event === "charge.failed") {
      const { orderId } = event.data.metadata;

      if (orderId && adminDb) {
        const orderRef = adminDb
          .collection("tenants")
          .doc(tenantId)
          .collection("orders")
          .doc(orderId);

        await orderRef.update({
          paymentStatus: "failed",
          paymentFailureReason: event.data.gateway_response,
          updatedAt: new Date().toISOString(),
        });

        console.log(`❌ Order ${orderId} payment failed via Paystack`);
      }
    } else if (event.event === "charge.refund") {
      const { orderId } = event.data.metadata;

      if (orderId && adminDb) {
        const orderRef = adminDb
          .collection("tenants")
          .doc(tenantId)
          .collection("orders")
          .doc(orderId);

        await orderRef.update({
          paymentStatus: "refunded",
          refundedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        console.log(`💰 Order ${orderId} refunded via Paystack`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error processing Paystack webhook:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process webhook" },
      { status: 500 }
    );
  }
}
