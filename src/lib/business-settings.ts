import { User } from "firebase/auth";
import { shippingService, businessProfileService } from "./db";

/**
 * Fetch shipping methods for a tenant/user
 * @param user - Firebase user
 * @returns Array of shipping methods or empty array
 */
export async function getShippingMethodsForUser(user: User) {
  try {
    const methods = await shippingService.getShippingMethods(user);
    return methods || [];
  } catch (error) {
    console.error("Error fetching shipping methods:", error);
    return [];
  }
}

/**
 * Fetch payment methods from business profile
 * @param user - Firebase user
 * @returns Payment methods object or null
 */
export async function getPaymentMethodsForUser(user: User) {
  try {
    const profile = await businessProfileService.getProfile(user);
    return profile?.paymentMethods || null;
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return null;
  }
}

/**
 * Fetch business profile information
 * @param user - Firebase user
 * @returns Business profile or null
 */
export async function getBusinessProfileForUser(user: User) {
  try {
    const profile = await businessProfileService.getProfile(user);
    return profile || null;
  } catch (error) {
    console.error("Error fetching business profile:", error);
    return null;
  }
}

/**
 * Fetch all business settings at once (optimized)
 * @param user - Firebase user
 * @returns Object containing all business settings
 */
export async function getAllBusinessSettings(user: User) {
  try {
    const [shippingMethods, businessProfile] = await Promise.all([
      getShippingMethodsForUser(user),
      getBusinessProfileForUser(user),
    ]);

    return {
      shippingMethods,
      paymentMethods: businessProfile?.paymentMethods || null,
      businessProfile,
    };
  } catch (error) {
    console.error("Error fetching all business settings:", error);
    return {
      shippingMethods: [],
      paymentMethods: null,
      businessProfile: null,
    };
  }
}

/**
 * Format shipping method for display
 * @param method - Shipping method object
 * @returns Formatted string with name, price, and estimated days
 */
export function formatShippingMethod(method: { name: string; price: number; estimatedDays?: string }) {
  const price = method.price === 0 ? "FREE" : `KES ${method.price.toLocaleString()}`;
  const days = method.estimatedDays ? ` (${method.estimatedDays})` : "";
  return `${method.name} - ${price}${days}`;
}

/**
 * Get enabled payment methods as formatted list
 * @param paymentMethods - Payment methods object
 * @returns Array of formatted payment method strings
 */
export function getEnabledPaymentMethods(paymentMethods: any): string[] {
  if (!paymentMethods) return [];

  const methods: string[] = [];

  if (paymentMethods.mpesa?.enabled) {
    const mpesaInfo = paymentMethods.mpesa;
    methods.push(`M-Pesa: ${mpesaInfo.phoneNumber || 'N/A'}${mpesaInfo.businessName ? ` (${mpesaInfo.businessName})` : ''}`);
  }

  if (paymentMethods.bank?.enabled) {
    const bankInfo = paymentMethods.bank;
    methods.push(`${bankInfo.bankName || 'Bank'}: ${bankInfo.accountNumber || 'N/A'}`);
  }

  if (paymentMethods.card?.enabled) {
    methods.push(`Card Payment (${paymentMethods.card.provider || 'Credit/Debit'})`);
  }

  if (paymentMethods.cash?.enabled) {
    methods.push(paymentMethods.cash.instructions || "Cash on Delivery");
  }

  return methods;
}
