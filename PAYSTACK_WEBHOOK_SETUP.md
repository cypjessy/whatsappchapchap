# Paystack Webhook Setup Guide

## Overview
The webhook handler processes payment events from Paystack and automatically updates order statuses in your application.

**Webhook URL:** `https://whatsappchapchap.vercel.app/api/webhooks/paystack`

---

##  Setup Steps

### 1. Configure Environment Variables

#### On Vercel Dashboard:
1. Go to your project on [Vercel](https://vercel.com)
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

```bash
PAYSTACK_WEBHOOK_SECRET=whsec_your_actual_secret_here
```

#### Local Development (create `.env.local`):
```bash
cp .env.example .env.local
# Edit .env.local with your actual keys
```

---

### 2. Configure Webhook in Paystack Dashboard

1. **Go to Paystack Dashboard:**
   - Test Mode: https://dashboard.paystack.com/#/settings/developer/test
   - Live Mode: https://dashboard.paystack.com/#/settings/developer/live

2. **Add Webhook URL:**
   - Scroll to **Webhooks** section
   - Click **Add Webhook URL**
   - Enter: `https://whatsappchapchap.vercel.app/api/webhooks/paystack`
   - Click **Save**

3. **Get Webhook Secret:**
   - Paystack will generate a secret (starts with `whsec_`)
   - Copy this secret
   - Add it to your environment variables as `PAYSTACK_WEBHOOK_SECRET`

---

## 📋 Supported Webhook Events

The handler processes these Paystack events:

| Event | Description | Action |
|-------|-------------|--------|
| `charge.success` | Payment successful | Updates order to "paid", auto-confirms |
| `charge.failed` | Payment failed | Marks order as "failed" |
| `transfer.success` | Payout successful | Logs payout event |
| `transfer.failed` | Payout failed | Logs failed payout |
| `invoice.payment_failed` | Recurring payment failed | Logs invoice failure |

---

##  Security Features

### Signature Verification
- Every webhook includes an `x-paystack-signature` header
- Handler verifies signature using your webhook secret
- Invalid signatures are rejected (401 response)

### How It Works:
```typescript
const hash = crypto
  .createHmac("sha512", webhookSecret)
  .update(rawBody)
  .digest("hex");

if (hash !== signature) {
  return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
}
```

---

##  Metadata Requirements

When creating payment requests, include metadata with:

```javascript
{
  metadata: {
    orderId: "order_123",      // Required for order updates
    tenantId: "tenant_xyz",    // Your tenant ID
    customerEmail: "user@example.com"
  }
}
```

The webhook uses `orderId` from metadata to find and update the correct order.

---

## 🧪 Testing Webhooks

### Local Testing:
1. Use [ngrok](https://ngrok.com) to expose your local server:
   ```bash
   ngrok http 3000
   ```

2. Update webhook URL in Paystack to ngrok URL:
   ```
   https://your-ngrok-id.ngrok.io/api/webhooks/paystack
   ```

3. Make test payments in Paystack sandbox

### Using Paystack Test Cards:
- **Success:** 4084084084084081
- **Decline:** 4084084084084081 (with specific amounts)
- See: https://paystack.com/docs/payments/test-mode/

---

## 🔄 What Happens on Successful Payment

1. **Order Updated:**
   ```javascript
   {
     paymentStatus: "paid",
     paymentReference: "ref_123456",
     paidAmount: 5000,
     paymentMethod: "paystack",
     paidAt: timestamp,
     status: "confirmed"
   }
   ```

2. **Notifications (TODO):**
   - Send WhatsApp to customer: "Payment received! Your order is confirmed."
   - Send WhatsApp to business: "New paid order #12345"

3. **Order Fulfillment:**
   - Auto-confirm order
   - Trigger processing workflow

---

## 🐛 Troubleshooting

### Webhook Not Received:
- Check Vercel logs: `vercel logs`
- Verify webhook URL in Paystack dashboard
- Check `PAYSTACK_WEBHOOK_SECRET` is set correctly

### Invalid Signature Error:
- Ensure `PAYSTACK_WEBHOOK_SECRET` matches Paystack dashboard
- Secret format: `whsec_xxxxxxxxxxxxxxxx`

### Order Not Updated:
- Check `orderId` is in payment metadata
- Verify order exists in Firestore
- Check Vercel logs for errors

### View Logs:
```bash
# Vercel CLI
vercel logs https://whatsappchapchap.vercel.app/api/webhooks/paystack

# Or check Vercel Dashboard → Deployments → Functions
```

---

## 📁 File Structure

```
src/app/api/webhooks/paystack/
└── route.ts          # Main webhook handler

.env.example          # Environment variable template
.env.local            # Local environment variables (gitignored)
```

---

## 🔒 Security Best Practices

1. ✅ Always verify webhook signatures
2. ✅ Store secrets in environment variables (never in code)
3. ✅ Return 200 immediately to acknowledge receipt
4. ✅ Process events asynchronously if needed
5. ✅ Log all events for debugging
6. ✅ Handle duplicate events (idempotency)

---

## 📚 Resources

- [Paystack Webhook Docs](https://paystack.com/docs/payments/webhooks/)
- [Paystack Test Mode](https://paystack.com/docs/payments/test-mode/)
- [Paystack API Reference](https://paystack.com/docs/api/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

##  Support

If you encounter issues:
1. Check Vercel function logs
2. Verify environment variables are set
3. Test with Paystack sandbox mode first
4. Check metadata includes `orderId`
5. Review Paystack dashboard for webhook delivery status
