/**
 * Phone number utilities for WhatsApp integration
 * Handles normalization, validation, and JID extraction for reliable message delivery
 */

export interface OrderPhoneData {
  customerPhone: string;
  whatsappJid?: string;
}

/**
 * Normalizes a phone number by stripping non-digits and converting local formats
 * Handles various input formats: +254..., 254..., 07xx, (555) 123-4567
 * 
 * @param phone - Raw phone number input in any format
 * @returns Normalized digits-only phone number
 */
export const normalizePhone = (phone: string): string => {
  const digits = phone.replace(/[^0-9]/g, '');
  
  // Convert Kenyan local format 07xx/01xx → 2547xx/2541xx
  if (digits.startsWith('0') && digits.length === 10) {
    return '254' + digits.slice(1);
  }
  
  // Return digits as-is (already international or other country codes)
  return digits;
};

/**
 * Validates if a phone number is suitable for WhatsApp messaging
 * Checks E.164 standard length requirements (7-15 digits)
 * 
 * @param phone - Phone number to validate (can be in any format)
 * @returns true if valid length for WhatsApp, false otherwise
 */
export const isValidWhatsAppPhone = (phone: string): boolean => {
  const normalized = normalizePhone(phone);
  // Valid international number: 7-15 digits (E.164 standard)
  return normalized.length >= 7 && normalized.length <= 15;
};

/**
 * Extracts and normalizes WhatsApp phone number from order data
 * Priority: verified individual JID > normalized customerPhone
 * Filters out group JIDs to prevent sending to wrong recipients
 * 
 * @param order - Order object with customerPhone and optional whatsappJid
 * @returns Normalized international format phone number (e.g., "254712345678")
 */
export const getWhatsAppPhone = (order: OrderPhoneData): string => {
  // If we have a verified JID from WhatsApp, use it (but validate it's not a group)
  if (order.whatsappJid) {
    // Ignore group JIDs - only use individual chat JIDs
    if (order.whatsappJid.includes('@g.us')) {
      console.warn('Group JID detected, falling back to customerPhone:', order.whatsappJid);
    } else {
      return order.whatsappJid.split('@')[0];
    }
  }
  
  // Fallback: normalize typed phone to international format
  return normalizePhone(order.customerPhone);
};

/**
 * Creates a WhatsApp JID from a phone number
 * Prevents double-suffixing if already a JID
 * 
 * @param phone - Phone number in any format OR existing JID
 * @returns WhatsApp JID (e.g., "254712345678@s.whatsapp.net")
 */
export const createWhatsAppJid = (phone: string): string => {
  // Already a JID, return as-is
  if (phone.includes('@')) return phone;
  
  const normalized = normalizePhone(phone);
  return `${normalized}@s.whatsapp.net`;
};
