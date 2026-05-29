/**
 * Payment Info Handler
 * Displays business payment methods from business profile
 */

import { getFirestore } from "firebase-admin/firestore";

/**
 * Dependencies passed from main route
 */
export interface PaymentInfoDeps {
  sendMessage: (tenantId: string, phone: string, message: string) => Promise<void>;
  startTyping: (tenantId: string, phone: string) => Promise<void>;
  stopTyping: (tenantId: string, phone: string) => Promise<void>;
}

/**
 * Send payment information to customer
 * Fetches actual payment methods from business profile
 */
export async function sendPaymentInfo(
  tenantId: string,
  phone: string,
  deps: PaymentInfoDeps
): Promise<void> {
  const adminDb = getFirestore();
  
  await deps.startTyping(tenantId, phone);
  
  try {
    // Fetch business profile to get payment methods
    const profileSnap = await adminDb.collection("businessProfiles").doc(tenantId).get();
    const profileData = profileSnap.exists ? profileSnap.data() : null;
    const paymentMethods = profileData?.paymentMethods;
    
    if (!paymentMethods) {
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(
        tenantId, 
        phone, 
        "💳 *Payment Methods*\n\nWe're currently updating our payment options. Please check back soon!\n\nFor urgent inquiries, reply *8* to talk to support."
      );
      return;
    }
    
    let response = "💳 *Accepted Payment Methods*\n\n";
    let hasAnyMethod = false;
    
    // M-Pesa Payment Methods
    if (paymentMethods.mpesa?.enabled) {
      const mpesa = paymentMethods.mpesa;
      
      // Buy Goods (Till Number)
      if (mpesa.buyGoods?.enabled && mpesa.buyGoods.tillNumber) {
        hasAnyMethod = true;
        response += `🟢 *M-Pesa Buy Goods (Till)*\n`;
        response += `   Business: ${mpesa.buyGoods.businessName || 'N/A'}\n`;
        response += `   Till Number: *${mpesa.buyGoods.tillNumber}*\n`;
        response += `   💡 Send payment to this till number\n\n`;
      }
      
      // Paybill
      if (mpesa.paybill?.enabled && mpesa.paybill.paybillNumber) {
        hasAnyMethod = true;
        response += `🔵 *M-Pesa Paybill*\n`;
        response += `   Business: ${mpesa.paybill.businessName || 'N/A'}\n`;
        response += `   Paybill Number: *${mpesa.paybill.paybillNumber}*\n`;
        if (mpesa.paybill.accountNumber) {
          response += `   Account Number: *${mpesa.paybill.accountNumber}*\n`;
        }
        response += `   💡 Use this paybill for payments\n\n`;
      }
      
      // Personal Number
      if (mpesa.personal?.enabled && mpesa.personal.phoneNumber) {
        hasAnyMethod = true;
        response += `📱 *M-Pesa Personal Number*\n`;
        response += `   Name: ${mpesa.personal.accountName || 'N/A'}\n`;
        response += `   Phone: *${mpesa.personal.phoneNumber}*\n`;
        response += `   💡 Send to this personal number\n\n`;
      }
    }
    
    // Bank Transfer
    if (paymentMethods.bank?.enabled) {
      const bank = paymentMethods.bank;
      hasAnyMethod = true;
      response += `🏦 *Bank Transfer*\n`;
      response += `   Bank: ${bank.bankName || 'N/A'}\n`;
      response += `   Account Name: ${bank.accountName || 'N/A'}\n`;
      response += `   Account Number: *${bank.accountNumber || 'N/A'}*\n`;
      if (bank.branch) {
        response += `   Branch: ${bank.branch}\n`;
      }
      if (bank.swiftCode) {
        response += `   SWIFT Code: ${bank.swiftCode}\n`;
      }
      response += `   💡 Make transfer and share receipt\n\n`;
    }
    
    // Card Payments
    if (paymentMethods.card?.enabled) {
      const card = paymentMethods.card;
      hasAnyMethod = true;
      response += `💳 *Card Payment*\n`;
      if (card.provider) {
        response += `   Provider: ${card.provider}\n`;
      }
      if (card.instructions) {
        response += `   Instructions: ${card.instructions}\n`;
      } else {
        response += `   💡 We accept Visa/Mastercard\n`;
      }
      response += `\n`;
    }
    
    // Cash on Delivery
    if (paymentMethods.cash?.enabled) {
      const cash = paymentMethods.cash;
      hasAnyMethod = true;
      response += `💵 *Cash on Delivery*\n`;
      if (cash.instructions) {
        response += `   ${cash.instructions}\n`;
      } else {
        response += `   Pay when you receive your order\n`;
      }
      response += `\n`;
    }
    
    if (!hasAnyMethod) {
      response = "💳 *Payment Methods*\n\nNo payment methods configured yet. Please contact us for payment arrangements.\n\nReply *8* to talk to support.";
    } else {
      response += `━━━━━━━━━━━━━━━\n`;
      response += `💡 *How to Pay:*\n`;
      response += `1️⃣ Choose your preferred method above\n`;
      response += `2️⃣ Complete the payment\n`;
      response += `3️⃣ Share transaction ID/receipt with us\n`;
      response += `4️⃣ We'll confirm and process your order\n\n`;
      response += `Need help? Reply *8* to talk to support.`;
    }
    
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, response);
  } catch (error) {
    console.error('[PaymentInfo] Error fetching payment methods:', error);
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId, 
      phone, 
      "❌ Unable to fetch payment information. Please try again later or reply *8* for support."
    );
  }
}
