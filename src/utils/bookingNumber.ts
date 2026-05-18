/**
 * Booking Number Generator
 * Generates unique booking numbers for the system
 */

/**
 * Generate a unique booking number
 * Format: BK-{timestamp}-{random}
 * Example: BK-1705123456789-ABC123
 */
export function generateBookingNumber(): string {
  const timestamp = Date.now().toString().slice(-10);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BK-${timestamp}-${random}`;
}
