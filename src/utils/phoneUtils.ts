/**
 * Phone number utilities for WhatsApp integration
 * Handles normalization and JID extraction for reliable message delivery
 */

export interface OrderPhoneData {
  customerPhone: string;
  whatsappJid?: string;
}

/**
 * Extracts and normalizes WhatsApp phone number from order data
 * Priority: whatsappJid (verified) > normalized customerPhone
 * 
 * @param order - Order object with customerPhone and optional whatsappJid
 * @returns Normalized international format phone number (e.g., "254712345678")
 */
export const getWhatsAppPhone = (order: OrderPhoneData): string => {
  // If we have a verified JID from WhatsApp, use it
  if (order.whatsappJid) {
    return order.whatsappJid.split('@')[0];
  }
  
  // Fallback: normalize typed phone to international format
  const digits = order.customerPhone.replace(/[^0-9]/g, '');
  
  // Kenyan local format 07xx/01xx → 2547xx/2541xx
  if (digits.startsWith('0') && digits.length === 10) {
    return '254' + digits.slice(1);
  }
  
  // Already international format or other formats
  return digits;
};

/**
 * Normalizes a phone number to international format
 * Handles various input formats and converts to standard format
 * 
 * @param phone - Raw phone number input
 * @returns Normalized phone number without country code prefix
 */
export const normalizePhone = (phone: string): string => {
  const digits = phone.replace(/[^0-9]/g, '');
  
  // Convert Kenyan local format 07xx/01xx → 2547xx/2541xx
  if (digits.startsWith('0') && digits.length === 10) {
    return '254' + digits.slice(1);
  }
  
  // Strip leading + if already international
  return digits;
};

/**
 * Creates a WhatsApp JID from a phone number
 * 
 * @param phone - Phone number in any format
 * @returns WhatsApp JID (e.g., "254712345678@s.whatsapp.net")
 */
export const createWhatsAppJid = (phone: string): string => {
  const normalized = normalizePhone(phone);
  return `${normalized}@s.whatsapp.net`;
};
