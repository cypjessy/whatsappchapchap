import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

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
    // ⚠️  SECURITY NOTE: Parsing untrusted input before signature verification
    // This is necessary because we use per-tenant webhook secrets.
    // Mitigation: Signature verification below will reject invalid payloads.
    const event = JSON.parse(body);
    const tenantId = event.data?.metadata?.tenantId;

    if (!tenantId) {
      console.error("Webhook received without tenantId in metadata");
      return NextResponse.json({ error: "No tenantId in metadata" }, { status: 400 });
    }

    // Validate tenantId format to prevent injection attacks
    if (!/^tenant_[a-zA-Z0-9]+$/.test(tenantId)) {
      console.error(`Invalid tenantId format: ${tenantId}`);
      return NextResponse.json({ error: "Invalid tenantId format" }, { status: 400 });
    }

    // Fetch tenant's webhook secret to verify signature
    // If tenantId is invalid/non-existent, this will throw and be caught below
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
        // ✅ Use root 'orders' collection to match checkout page
        const orderRef = adminDb.collection("orders").doc(orderId);

        // ✅ Idempotency guard - check if already processed
        const orderSnap = await orderRef.get();
        if (orderSnap.exists && orderSnap.data()?.paymentStatus === "paid") {
          console.log(`⚠️ Order ${orderId} already marked as paid - skipping duplicate webhook`);
          return NextResponse.json({ received: true });
        }

        await orderRef.update({
          paymentStatus: "paid",
          paidAt: paidAt.toISOString(),  // Keep ISO string for Paystack's actual payment time
          paymentReference: reference,
          paymentAmount: amount,
          paymentMethod: "paystack",
          updatedAt: FieldValue.serverTimestamp(),  // ✅ Use server timestamp for consistency
        });

        console.log(`✅ Order ${orderId} marked as paid via Paystack`);
      }
    } else if (event.event === "charge.failed") {
      const { orderId } = event.data.metadata;

      if (orderId && adminDb) {
        // ✅ Use root 'orders' collection to match checkout page
        const orderRef = adminDb.collection("orders").doc(orderId);

        // ✅ Idempotency guard - check if already processed
        const orderSnap = await orderRef.get();
        if (orderSnap.exists && orderSnap.data()?.paymentStatus === "failed") {
          console.log(`⚠️ Order ${orderId} already marked as failed - skipping duplicate webhook`);
          return NextResponse.json({ received: true });
        }

        await orderRef.update({
          paymentStatus: "failed",
          paymentFailureReason: event.data.gateway_response,
          updatedAt: FieldValue.serverTimestamp(),  // ✅ Use server timestamp for consistency
        });

        console.log(`❌ Order ${orderId} payment failed via Paystack`);
      }
    } else if (event.event === "refund.processed") {  // ✅ Correct Paystack event name
      // ⚠️  IMPORTANT: refund.processed does NOT include metadata like charge.success
      // Must extract orderId from transaction_reference format: "order_<orderId>_<timestamp>"
      const transactionRef = event.data.transaction_reference as string;
      const orderId = transactionRef?.split('_')[1];  // Extract orderId from reference

      if (!orderId) {
        console.error("Webhook refund.processed without valid transaction_reference");
        return NextResponse.json({ error: "No orderId in transaction_reference" }, { status: 400 });
      }

      if (adminDb) {
        // ✅ Use root 'orders' collection to match checkout page
        const orderRef = adminDb.collection("orders").doc(orderId);

        // ✅ Idempotency guard - check if already processed
        const orderSnap = await orderRef.get();
        if (orderSnap.exists && orderSnap.data()?.paymentStatus === "refunded") {
          console.log(`⚠️ Order ${orderId} already marked as refunded - skipping duplicate webhook`);
          return NextResponse.json({ received: true });
        }

        await orderRef.update({
          paymentStatus: "refunded",
          refundedAt: new Date().toISOString(),  // Keep ISO string for refund timestamp
          updatedAt: FieldValue.serverTimestamp(),  // ✅ Use server timestamp for consistency
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
