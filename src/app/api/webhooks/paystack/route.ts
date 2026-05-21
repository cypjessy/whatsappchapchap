import { NextRequest, NextResponse } from "next/server";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase-admin";
import crypto from "crypto";

/**
 * Paystack Webhook Handler
 * Processes payment events from Paystack and updates order statuses
 * 
 * Webhook URL: https://whatsappchapchap.vercel.app/api/webhooks/paystack
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    
    console.log("[Paystack Webhook] Received webhook event");

    // Verify webhook signature
    if (!signature) {
      console.error("[Paystack Webhook] No signature provided");
      return NextResponse.json({ error: "No signature provided" }, { status: 401 });
    }

    // Get webhook secret from Firestore (tenant-specific)
    // For now, we'll use environment variable or query all tenants
    const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.warn("[Paystack Webhook] PAYSTACK_WEBHOOK_SECRET not configured");
      // Continue processing for development/testing
    } else {
      // Verify signature
      const hash = crypto
        .createHmac("sha512", webhookSecret)
        .update(rawBody)
        .digest("hex");
      
      if (hash !== signature) {
        console.error("[Paystack Webhook] Invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // Parse the webhook payload
    let event;
    try {
      event = JSON.parse(rawBody);
    } catch (err) {
      console.error("[Paystack Webhook] Invalid JSON payload");
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    console.log("[Paystack Webhook] Event:", event.event);
    console.log("[Paystack Webhook] Data:", JSON.stringify(event.data, null, 2));

    // Process different event types
    switch (event.event) {
      case "charge.success":
        await handleChargeSuccess(event);
        break;
      
      case "charge.failed":
        await handleChargeFailed(event);
        break;
      
      case "transfer.success":
        await handleTransferSuccess(event);
        break;
      
      case "transfer.failed":
        await handleTransferFailed(event);
        break;
      
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event);
        break;
      
      default:
        console.log("[Paystack Webhook] Unhandled event type:", event.event);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("[Paystack Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Handle successful charge event
 */
async function handleChargeSuccess(event: any) {
  try {
    const { data } = event;
    const { reference, amount, customer, metadata } = data;
    
    console.log("[Paystack Webhook] Charge successful:", {
      reference,
      amount,
      customer: customer.email,
    });

    // Extract order ID from metadata if present
    const orderId = metadata?.orderId || metadata?.order_id;
    const tenantId = metadata?.tenantId || metadata?.tenant_id;
    
    if (!orderId) {
      console.warn("[Paystack Webhook] No order ID in metadata");
      return;
    }

    // Update order status in Firestore
    if (adminDb) {
      const orderRef = adminDb.collection("orders").doc(orderId);
      const orderDoc = await orderRef.get();
      
      if (orderDoc.exists) {
        await orderRef.update({
          paymentStatus: "paid",
          paymentReference: reference,
          paidAmount: amount / 100, // Convert from kobo/cents to main currency
          paymentMethod: "paystack",
          paymentGateway: "paystack",
          paidAt: new Date(),
          updatedAt: new Date(),
          status: "confirmed", // Auto-confirm on successful payment
        });

        console.log("[Paystack Webhook] Order updated:", orderId);

        // TODO: Send WhatsApp notification to customer
        // TODO: Send WhatsApp notification to business owner
        // TODO: Trigger order fulfillment workflow
      } else {
        console.warn("[Paystack Webhook] Order not found:", orderId);
      }
    }

  } catch (error) {
    console.error("[Paystack Webhook] Error handling charge.success:", error);
  }
}

/**
 * Handle failed charge event
 */
async function handleChargeFailed(event: any) {
  try {
    const { data } = event;
    const { reference, gateway_response, metadata } = data;
    
    console.log("[Paystack Webhook] Charge failed:", {
      reference,
      reason: gateway_response,
    });

    const orderId = metadata?.orderId || metadata?.order_id;
    
    if (!orderId) {
      console.warn("[Paystack Webhook] No order ID in metadata");
      return;
    }

    // Update order status
    if (adminDb) {
      const orderRef = adminDb.collection("orders").doc(orderId);
      const orderDoc = await orderRef.get();
      
      if (orderDoc.exists) {
        await orderRef.update({
          paymentStatus: "failed",
          paymentReference: reference,
          paymentFailureReason: gateway_response,
          updatedAt: new Date(),
        });

        console.log("[Paystack Webhook] Order marked as failed:", orderId);

        // TODO: Send WhatsApp notification about failed payment
      } else {
        console.warn("[Paystack Webhook] Order not found:", orderId);
      }
    }

  } catch (error) {
    console.error("[Paystack Webhook] Error handling charge.failed:", error);
  }
}

/**
 * Handle successful transfer event (for payouts)
 */
async function handleTransferSuccess(event: any) {
  try {
    const { data } = event;
    console.log("[Paystack Webhook] Transfer successful:", data.reference);
    
    // Handle payout/transfers if your app supports them
    // This is for when you send money FROM your Paystack account
    
  } catch (error) {
    console.error("[Paystack Webhook] Error handling transfer.success:", error);
  }
}

/**
 * Handle failed transfer event
 */
async function handleTransferFailed(event: any) {
  try {
    const { data } = event;
    console.log("[Paystack Webhook] Transfer failed:", data.reference);
    
    // Handle failed payouts
    
  } catch (error) {
    console.error("[Paystack Webhook] Error handling transfer.failed:", error);
  }
}

/**
 * Handle invoice payment failed
 */
async function handleInvoicePaymentFailed(event: any) {
  try {
    const { data } = event;
    console.log("[Paystack Webhook] Invoice payment failed:", data.invoice_code);
    
    // Handle recurring payment failures if you use invoices
    
  } catch (error) {
    console.error("[Paystack Webhook] Error handling invoice.payment_failed:", error);
  }
}

// Also handle GET requests for testing
export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: "Paystack webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
}
