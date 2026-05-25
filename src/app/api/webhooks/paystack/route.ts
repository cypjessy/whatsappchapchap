import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Paystack Webhook Handler
 * Processes payment events from Paystack and updates order statuses
 * Sends WhatsApp payment confirmations to customers
 * 
 * Webhook URL: https://whatsappchapchap.vercel.app/api/webhooks/paystack
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
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    
    console.log("[Paystack Webhook] Received webhook event");

    // Verify webhook signature
    if (!signature) {
      console.error("[Paystack Webhook] No signature provided");
      return NextResponse.json({ error: "No signature provided" }, { status: 401 });
    }

    // Parse event to extract tenantId from metadata
    let event;
    try {
      event = JSON.parse(rawBody);
    } catch (err) {
      console.error("[Paystack Webhook] Invalid JSON payload");
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    console.log("[Paystack Webhook] Event:", event.event);
    console.log("[Paystack Webhook] Data:", JSON.stringify(event.data, null, 2));

    const tenantId = event.data?.metadata?.tenantId || event.data?.metadata?.tenant_id;

    // Fallback: Try global PAYSTACK_WEBHOOK_SECRET first
    const globalWebhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;
    let webhookSecret = globalWebhookSecret;

    // If tenantId is available, try to get per-tenant webhook secret
    if (tenantId) {
      // Validate tenantId format to prevent injection attacks
      if (!/^tenant_[a-zA-Z0-9]+$/.test(tenantId)) {
        console.error(`[Paystack Webhook] Invalid tenantId format: ${tenantId}`);
        return NextResponse.json({ error: "Invalid tenantId format" }, { status: 400 });
      }

      try {
        const tenantPaystack = await getTenantPaystack(tenantId);
        if (tenantPaystack.webhookSecret) {
          webhookSecret = tenantPaystack.webhookSecret;
        }
      } catch (err) {
        console.warn(`[Paystack Webhook] Could not fetch per-tenant secret for ${tenantId}, falling back to global`);
      }
    }

    if (webhookSecret) {
      // Verify signature
      const hash = crypto
        .createHmac("sha512", webhookSecret)
        .update(rawBody)
        .digest("hex");
      
      if (hash !== signature) {
        console.error("[Paystack Webhook] Invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
      console.log(`[Paystack Webhook] ✅ Signature verified for tenant: ${tenantId || "global"}`);
    } else {
      console.warn("[Paystack Webhook] No webhook secret configured, skipping signature verification");
    }

    // Process different event types
    switch (event.event) {
      case "charge.success":
        await handleChargeSuccess(event, tenantId);
        break;
      
      case "charge.failed":
        await handleChargeFailed(event, tenantId);
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
 * Handle successful charge event — sends WhatsApp payment confirmation
 */
async function handleChargeSuccess(event: any, tenantId?: string) {
  try {
    const { data } = event;
    const { reference, amount, customer, metadata } = data;
    
    console.log("[Paystack Webhook] Charge successful:", {
      reference,
      amount,
      customer: customer?.email,
    });

    // Extract order ID from metadata
    const orderId = metadata?.orderId || metadata?.order_id;
    
    if (!orderId) {
      console.warn("[Paystack Webhook] No order ID in metadata");
      return;
    }

    // Update order status in Firestore
    if (adminDb) {
      const orderRef = adminDb.collection("orders").doc(orderId);
      const orderSnap = await orderRef.get();
      
      if (!orderSnap.exists) {
        console.warn("[Paystack Webhook] Order not found:", orderId);
        return;
      }

      // ✅ Idempotency guard - check if already processed
      const existingData = orderSnap.data();
      if (existingData?.paymentStatus === "paid") {
        console.log(`[Paystack Webhook] ⚠️ Order ${orderId} already marked as paid - skipping duplicate webhook`);
        return;
      }

      const paidAt = new Date(event.data.paid_at || new Date());

      await orderRef.update({
        paymentStatus: "paid",
        paymentReference: reference,
        paidAmount: amount / 100, // Convert from kobo/cents to main currency
        paymentMethod: "paystack",
        paymentGateway: "paystack",
        paidAt: paidAt.toISOString(),
        updatedAt: FieldValue.serverTimestamp(),
        status: "confirmed", // Auto-confirm on successful payment
      });

      console.log(`[Paystack Webhook] ✅ Order ${orderId} marked as paid`);

      // 📱 Send WhatsApp payment confirmation to customer
      try {
        if (!existingData) {
          console.warn("[Paystack Webhook] ⚠️ No order data available, skipping WhatsApp notification");
          return;
        }

        if (!tenantId) {
          console.warn("[Paystack Webhook] ⚠️ No tenantId available, skipping WhatsApp notification");
          return;
        }

        const evolutionApiUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, '') || "";
        const evolutionApiKey = process.env.EVOLUTION_API_KEY || "";

        if (!evolutionApiUrl || !evolutionApiKey) {
          console.warn("[Paystack Webhook] ⚠️ Evolution API credentials not configured, skipping WhatsApp notification");
          return;
        }

        // 🔍 Get the correct Evolution instance name from the tenant document
        let instanceName = tenantId;
        try {
          if (adminDb) {
            const tenantDoc = await adminDb.collection("tenants").doc(tenantId).get();
            if (tenantDoc.exists) {
              const tenantData = tenantDoc.data();
              const evoId = tenantData?.evolutionInstanceId || tenantData?.evolutionInstance || tenantData?.whatsappInstanceId;
              if (evoId) {
                instanceName = evoId;
              }
            }
          }
        } catch (err) {
          console.warn(`[Paystack Webhook] ⚠️ Failed to fetch tenant evolution instance, falling back to tenantId:`, err);
        }

        const customerPhone = existingData.customerPhone || "";
        const customerName = existingData.customerName || "Customer";
        const orderNumberVal = existingData.orderNumber || orderId.substring(0, 8);
        const productName = existingData.products?.[0]?.name || existingData.productName || "Order";
        const total = existingData.total || 0;

        // Clean phone number for WhatsApp
        const cleanPhone = customerPhone.replace(/[^0-9]/g, "");
        const fullPhone = cleanPhone.startsWith("254") ? cleanPhone : "254" + cleanPhone.slice(-9);

        if (fullPhone.length < 10) {
          console.warn(`[Paystack Webhook] ⚠️ Invalid phone number for WhatsApp: ${customerPhone} (cleaned: ${fullPhone})`);
          return;
        }

        const formattedTotal = new Intl.NumberFormat("en-KE", {
          style: "currency",
          currency: "KES",
        }).format(total);

        const message = `━━━━━━━━━━━━━━━━━━━━\n✅ *PAYMENT CONFIRMED & ORDER PAID* ✅\n━━━━━━━━━━━━━━━━━━━━\n\nDear *${customerName}*,\n\nThank you for your order! 🎉\n\nYour payment has been successfully processed and your order is now confirmed!\n\n📋 *ORDER DETAILS*\n━━━━━━━━━━━━━━━━━━\n🏷️ *Product:* ${productName}\n🔖 *Order ID:* ${orderNumberVal}\n💰 *Amount Paid:* ${formattedTotal}\n📊 *Status:* Processing\n━━━━━━━━━━━━━━━━━━\n\nWe will begin preparing your order shortly. You'll receive updates as it progresses.\n\n💬 Need help? Just reply to this message!\n\n━━━━━━━━━━━━━━━━━━━━\n✨ *Thank you for choosing us!* ✨\n━━━━━━━━━━━━━━━━━━━━`;

        console.log(`[Paystack Webhook] Sending WhatsApp via instance: ${instanceName} to ${fullPhone}`);

        const waResponse = await fetch(`${evolutionApiUrl}/message/sendText/${instanceName}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: evolutionApiKey,
          },
          body: JSON.stringify({
            number: fullPhone,
            text: message,
          }),
        });

        if (waResponse.ok) {
          console.log(`[Paystack Webhook] ✅ WhatsApp payment confirmation sent to ${fullPhone} for order ${orderId}`);
        } else {
          const waError = await waResponse.text();
          console.error(`[Paystack Webhook] ❌ Failed to send WhatsApp (${waResponse.status}): ${waError.substring(0, 500)}`);
        }
      } catch (waErr) {
        console.error("[Paystack Webhook] ❌ Error sending WhatsApp payment confirmation:", waErr);
      }
    }

  } catch (error) {
    console.error("[Paystack Webhook] Error handling charge.success:", error);
  }
}

/**
 * Handle failed charge event
 */
async function handleChargeFailed(event: any, tenantId?: string) {
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
      const orderSnap = await orderRef.get();
      
      if (!orderSnap.exists) {
        console.warn("[Paystack Webhook] Order not found:", orderId);
        return;
      }

      // ✅ Idempotency guard
      const existingData = orderSnap.data();
      if (existingData?.paymentStatus === "failed") {
        console.log(`[Paystack Webhook] ⚠️ Order ${orderId} already marked as failed - skipping duplicate webhook`);
        return;
      }

      await orderRef.update({
        paymentStatus: "failed",
        paymentReference: reference,
        paymentFailureReason: gateway_response,
        updatedAt: FieldValue.serverTimestamp(),
      });

      console.log(`[Paystack Webhook] ❌ Order ${orderId} marked as failed`);

      // 📱 Send WhatsApp failure notification
      try {
        if (existingData) {
          const evolutionApiUrl = process.env.EVOLUTION_API_URL || "";
          const evolutionApiKey = process.env.EVOLUTION_API_KEY || "";

          if (evolutionApiUrl && evolutionApiKey) {
            const customerPhone = existingData.customerPhone || "";
            const customerName = existingData.customerName || "Customer";
            const orderNumber = existingData.orderNumber || orderId.substring(0, 8);

            const cleanPhone = customerPhone.replace(/[^0-9]/g, "");
            const fullPhone = cleanPhone.startsWith("254") ? cleanPhone : "254" + cleanPhone.slice(-9);

            if (fullPhone.length >= 10) {
              const message = `━━━━━━━━━━━━━━━━━━━━\n❌ *PAYMENT FAILED* ❌\n━━━━━━━━━━━━━━━━━━━━\n\nDear *${customerName}*,\n\nWe were unable to process your payment for order *${orderNumber}*.\n\n📋 *Reason:* ${gateway_response || "Transaction declined"}\n\nPlease try making the payment again or choose a different payment method.\n\n💬 Need help? Just reply to this message!\n\n━━━━━━━━━━━━━━━━━━━━`;

              if (!tenantId) {
                console.warn("[Paystack Webhook] ⚠️ No tenantId available, skipping WhatsApp failure notification");
                return;
              }

              await fetch(`${evolutionApiUrl}/message/sendText/${tenantId}`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  apikey: evolutionApiKey,
                },
                body: JSON.stringify({
                  number: fullPhone,
                  text: message,
                }),
              });

              console.log(`[Paystack Webhook] ✅ WhatsApp failure notification sent to ${fullPhone} for order ${orderId}`);
            }
          }
        }
      } catch (waErr) {
        console.error("[Paystack Webhook] ❌ Error sending WhatsApp failure notification:", waErr);
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
