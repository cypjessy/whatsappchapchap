/**
 * WhatsApp Typing Indicator Utility
 * 
 * Provides functions to show/hide typing indicators ("...") in WhatsApp
 * using the Evolution API presence update endpoint.
 */

// Track active typing indicator intervals to prevent memory leaks
const activeTypingIntervals = new Map<string, NodeJS.Timeout>();

/**
 * Send typing indicator to show "..." in WhatsApp
 * @param tenantId - The Evolution API instance/tenant ID
 * @param phoneNumber - The phone number to send typing indicator to
 * @param action - The typing action: "composing" (typing), "paused" (stopped), or "recording"
 */
export async function sendTypingIndicator(
  tenantId: string,
  phoneNumber: string,
  action: "composing" | "paused" | "recording" = "composing"
): Promise<void> {
  try {
    const evolutionApiUrl = process.env.EVOLUTION_API_URL || "";
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || "";

    if (!evolutionApiUrl || !evolutionApiKey) {
      console.warn("[TypingIndicator] Evolution API credentials not configured");
      return;
    }

    const typingAction = action === "composing" ? "composing" : "paused";

    await fetch(`${evolutionApiUrl}/chat/updatePresence/${tenantId}`, {
      method: "POST",
      headers: {
        apikey: evolutionApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        number: phoneNumber,
        presence: typingAction,
      }),
    });
    
    console.log(`[TypingIndicator] Sent: ${typingAction} to ${phoneNumber}`);
  } catch (error) {
    console.error(`[TypingIndicator] Error:`, error);
  }
}

/**
 * Start continuous typing indicator that refreshes every 4 seconds
 * This prevents the typing indicator from disappearing while processing
 * @param tenantId - The Evolution API instance/tenant ID
 * @param phone - The phone number to show typing indicator for
 */
export async function startTypingIndicator(tenantId: string, phone: string): Promise<void> {
  const existingInterval = activeTypingIntervals.get(phone);
  if (existingInterval) {
    clearInterval(existingInterval);
  }
  
  await sendTypingIndicator(tenantId, phone, "composing");
  
  const interval = setInterval(async () => {
    await sendTypingIndicator(tenantId, phone, "composing");
  }, 4000); // Refresh every 4 seconds
  
  activeTypingIntervals.set(phone, interval);
  console.log(`[TypingIndicator] Started for ${phone}`);
}

/**
 * Stop typing indicator and clean up interval
 * Should be called when bot finishes processing and is ready to send response
 * @param tenantId - The Evolution API instance/tenant ID
 * @param phone - The phone number to stop typing indicator for
 */
export async function stopTypingIndicator(tenantId: string, phone: string): Promise<void> {
  const interval = activeTypingIntervals.get(phone);
  if (interval) {
    clearInterval(interval);
    activeTypingIntervals.delete(phone);
  }
  await sendTypingIndicator(tenantId, phone, "paused");
  console.log(`[TypingIndicator] Stopped for ${phone}`);
}

/**
 * Clean up all active typing intervals (useful for cleanup/shutdown)
 */
export function cleanupAllTypingIndicators(): void {
  activeTypingIntervals.forEach((interval, phone) => {
    clearInterval(interval);
    console.log(`[TypingIndicator] Cleaned up interval for ${phone}`);
  });
  activeTypingIntervals.clear();
}
