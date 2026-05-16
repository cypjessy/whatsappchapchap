/**
 * Order Number Generator
 * Generates unique order numbers for the system
 */

/**
 * Generate a unique order number
 * Format: ORD-{timestamp}-{random}
 * Example: ORD-1705123456789-ABC123
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-10);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}
