# Paystack Integration Guide - WhatsApp Chap Chap

## Overview

This guide explains the per-tenant Paystack payment gateway integration for your multi-tenant WhatsApp Chap Chap platform. Each tenant can configure their own Paystack credentials, and payments are processed using their individual accounts.

---

## Architecture

```
Tenant Settings Page → Save to Firestore (server-side) → 
API Route fetches tenant's keys → Paystack API call → Webhook back to server
```

**Key Security Principles:**
- ✅ Secret keys stored in Firestore, never exposed to client
- ✅ Only public key returned to frontend
- ✅ All API routes verify tenant authentication
- ✅ Webhook signatures verified using tenant-specific secrets
- ✅ Firestore security rules block client access to settings

---

## Files Created

### 1. Settings Page UI
**Location:** `src/app/(app)/settings/paystack/page.tsx`

Features:
- Environment toggle (Test/Live mode)
- Public Key input (with format validation)
- Secret Key input (password field, not displayed after save)
- Webhook Secret input (for signature verification)
- Real-time validation and error handling
- Success/error notifications

### 2. Settings API Route
**Location:** `src/app/api/settings/paystack/route.ts`

Endpoints:
- `GET /api/settings/paystack` - Returns only public key and isLive flag
- `POST /api/settings/paystack` - Saves all credentials (server-side only)

Security:
- Requires Bearer token authentication
- Validates tenant ID from token
- Validates key formats (pk_live_, pk_test_, sk_live_, sk_test_)
- Never returns secretKey or webhookSecret to client

### 3. Payment Initialization API
**Location:** `src/app/api/payments/initialize/route.ts`

Endpoint:
- `POST /api/payments/initialize`

Request Body:
```json
{
  "email": "customer@example.com",
  "amount": 1000, // in KES/NGN/GHS
  "orderId": "ORD-123456",
  "metadata": {
    "customerName": "John Doe"
  }
}
```

Response:
```json
{
  "authorizationUrl": "https://checkout.paystack.com/...",
  "accessCode": "xxx",
  "reference": "order_ORD-123456_1234567890"
}
```

### 4. Webhook Handler
**Location:** `src/app/api/payments/webhook/route.ts`

Endpoint:
- `POST /api/payments/webhook`

Handles Events:
- `charge.success` - Marks order as paid
- `charge.failed` - Marks order as failed
- `charge.refund` - Marks order as refunded

Security:
- Verifies HMAC-SHA512 signature using tenant's webhookSecret
- Extracts tenantId from metadata
- Updates order status in Firestore

### 5. Firestore Security Rules
**Location:** `firestore.rules`

Rules:
```javascript
match /tenants/{tenantId}/settings/{settingId} {
  allow read, write: if false; // Block all client access
}
```

---

## Setup Instructions

### Step 1: Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

Or manually update rules in Firebase Console:
1. Go to Firebase Console → Firestore Database → Rules
2. Copy contents of `firestore.rules`
3. Publish rules

### Step 2: Configure Paystack for Each Tenant

For each tenant in your platform:

1. **Create Paystack Account**
   - Visit [paystack.com](https://paystack.com)
   - Sign up and verify business details

2. **Get API Keys**
   - Dashboard → Settings → API Keys & Webhooks
   - Copy Test keys for development
   - Copy Live keys for production

3. **Configure in Your App**
   - Navigate to `/settings/paystack` in your app
   - Toggle Test/Live mode
   - Enter Public Key, Secret Key, and Webhook Secret
   - Click "Save Paystack Settings"

4. **Set Up Webhook in Paystack**
   - In Paystack Dashboard → Settings → API Keys & Webhooks
   - Click "Add Webhook Endpoint"
   - URL: `https://yourdomain.com/api/payments/webhook`
   - Events to listen for:
     - ✅ charge.success
     - ✅ charge.failed
     - ✅ charge.refund
   - Copy the Webhook Secret provided
   - Update webhook secret in your app settings

### Step 3: Set Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## Firestore Data Structure

```
/tenants/{tenantId}/settings/paystack
  {
    publicKey: "pk_live_xxx",       // safe to expose to client
    secretKey: "sk_live_xxx",       // NEVER expose, server-only
    webhookSecret: "whsec_xxx",     // for verifying webhook signatures
    isLive: true,                   // toggle test/live mode
    createdAt: timestamp,
    updatedAt: timestamp
  }
```

---

## Payment Flow

### 1. Customer Initiates Payment

```typescript
// From checkout page or order page
const initiatePayment = async () => {
  const response = await fetch("/api/payments/initialize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await user.getIdToken()}`,
    },
    body: JSON.stringify({
      email: customerEmail,
      amount: orderTotal,
      orderId: orderId,
      metadata: { customerName },
    }),
  });

  const data = await response.json();
  
  // Redirect customer to Paystack checkout
  window.location.href = data.authorizationUrl;
};
```

### 2. Customer Completes Payment on Paystack

- Customer enters card details or uses mobile money
- Paystack processes payment
- Paystack redirects back to your callback_url

### 3. Paystack Sends Webhook

- Paystack POSTs to `/api/payments/webhook`
- Your server verifies signature
- Order status updated in Firestore

### 4. Order Status Updated

Firestore order document updated with:
```json
{
  "paymentStatus": "paid",
  "paidAt": "2024-01-01T12:00:00.000Z",
  "paymentReference": "ref_xxxxx",
  "paymentAmount": 1000,
  "paymentMethod": "paystack"
}
```

---

## Testing

### Test Mode

1. Use test keys (`pk_test_...`, `sk_test_...`)
2. Use Paystack test cards:
   - **Success:** `4084084084084081`, any future expiry, any CVV
   - **Insufficient Funds:** `4084084084084089`
   - **Requires OTP:** `4084084084084097`

3. Test webhook locally using ngrok:
   ```bash
   ngrok http 3000
   ```
   Update webhook URL in Paystack to: `https://xxxx.ngrok.io/api/payments/webhook`

### Verify Integration

1. ✅ Settings page saves credentials without errors
2. ✅ GET endpoint returns only public key
3. ✅ Payment initialization returns authorization URL
4. ✅ Webhook receives and verifies signature
5. ✅ Order status updates in Firestore after payment

---

## Troubleshooting

### Error: "Paystack not configured for this tenant"

**Cause:** Tenant hasn't saved Paystack credentials yet.

**Solution:** Navigate to `/settings/paystack` and configure credentials.

### Error: "Invalid signature"

**Cause:** Webhook secret doesn't match or request tampered.

**Solution:** 
1. Verify webhook secret in Paystack dashboard matches what's saved
2. Ensure you're copying the correct webhook secret (not API secret key)

### Error: "Database not configured"

**Cause:** Firebase Admin SDK credentials missing.

**Solution:** Add to `.env.local`:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Webhook Not Receiving Events

**Checklist:**
1. ✅ Webhook URL is publicly accessible (not localhost)
2. ✅ Webhook enabled in Paystack dashboard
3. ✅ Correct events selected (charge.success, etc.)
4. ✅ Check server logs for incoming requests
5. ✅ Use ngrok for local testing

---

## Security Best Practices

### ✅ DO:
- Store secret keys in Firestore, accessed only by server
- Validate all API inputs
- Verify webhook signatures before processing
- Use environment variables for sensitive config
- Enable HTTPS in production
- Monitor webhook failures

### ❌ DON'T:
- Expose secret keys to client-side code
- Log secret keys or webhook secrets
- Accept webhooks without signature verification
- Use same webhook secret across tenants
- Store credentials in localStorage or cookies

---

## Multi-Tenant Isolation

Each tenant has completely isolated:
- ✅ Paystack credentials
- ✅ Orders and payments
- ✅ Webhook processing
- ✅ Transaction history

Tenant identification happens via:
1. Firebase Auth token (contains `tenantId`)
2. Metadata embedded in Paystack transactions
3. Webhook payload metadata extraction

---

## Future Enhancements

Potential improvements:
- [ ] Encrypt secret keys at rest in Firestore
- [ ] Add payment retry logic
- [ ] Implement refund API endpoint
- [ ] Add payment analytics dashboard
- [ ] Support multiple currencies per tenant
- [ ] Add webhook retry mechanism for failures
- [ ] Implement idempotency keys for webhooks

---

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Verify Paystack dashboard for transaction status
3. Review Firestore documents for data integrity
4. Test with Paystack test mode first

---

**Last Updated:** May 2026  
**Version:** 1.0.0
