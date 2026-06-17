/**
 * WhatsApp Typing Indicator Utility
 * 
 * Provides functions to show/hide typing indicators ("...") in WhatsApp
 * using the Evolution API presence update endpoint.
 * 
 * Improvements:
 * - Auto-expiry: intervals auto-stop after MAX_DURATION_MS (25s) to prevent runaway
 * - State tracking: prevents redundant start/stop operations
 * - Failure backoff: exponential backoff on API failures during refresh
 * - withTypingIndicator: convenience wrapper for async operations
 */

// Track active typing indicator intervals to prevent memory leaks
const activeTypingIntervals = new Map<string, NodeJS.Timeout>();
const activeTypingExpiry = new Map<string, NodeJS.Timeout>();
const activeTypingState = new Map<string, 'starting' | 'active' | 'stopping'>();

// Configuration
const REFRESH_INTERVAL_MS = 5000; // Refresh every 5 seconds (WhatsApp shows typing for ~20s)
const MAX_DURATION_MS = 25000;     // Auto-stop after 25 seconds (safety net)
const MAX_BACKOFF_MS = 20000;      // Max backoff between retries (20s)
const INITIAL_BACKOFF_MS = 1000;   // Start with 1s backoff

// Backoff tracking per conversation
const failureCount = new Map<string, number>();

/**
 * Send typing indicator to show "..." in WhatsApp
 * @param tenantId - The Evolution API instance/tenant ID
 * @param phoneNumber - The phone number to send typing indicator to
 * @param action - The typing action: "composing" (typing), "paused" (stopped), or "recording"
 */
import { getAdminDb } from "@/lib/firebase-admin";

export async function sendTypingIndicator(
  tenantId: string,
  phoneNumber: string,
  action: "composing" | "paused" | "recording" = "composing"
): Promise<boolean> {
  try {
    const evolutionApiUrl = process.env.EVOLUTION_API_URL || "";
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || "";

    if (!evolutionApiUrl || !evolutionApiKey) {
      if (process.env.DEBUG_MODE === 'true') {
        console.warn("[TypingIndicator] Evolution API credentials not configured");
      }
      return false;
    }

    // Use the correct Evolution instance name from the tenant's stored data
    let instanceName = tenantId;
    try {
      const adminDb = getAdminDb();
      if (adminDb) {
        const tenantDoc = await adminDb.collection("tenants").doc(tenantId).get();
        if (tenantDoc.exists) {
          const data = tenantDoc.data();
          if (data?.evolutionInstanceId) {
            instanceName = data.evolutionInstanceId;
          }
        }
      }
    } catch {
      // Fall back to tenantId if we can't look up the instance name
    }

    const response = await fetch(`${evolutionApiUrl}/chat/sendPresence/${instanceName}`, {
      method: "POST",
      headers: {
        apikey: evolutionApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        number: phoneNumber,
        presence: action,
        delay: 1000,
      }),
    });

    if (!response.ok) {
      console.warn(`[TypingIndicator] API returned ${response.status} for ${action} to ${phoneNumber}`);
      return false;
    }

    if (process.env.DEBUG_MODE === 'true') {
      console.log(`[TypingIndicator] ✓ ${action} to ${phoneNumber}`);
    }
    return true;
  } catch (error) {
    console.error(`[TypingIndicator] Error sending ${action}:`, error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Start continuous typing indicator that refreshes periodically.
 * Automatically stops after MAX_DURATION_MS (25s) as a safety net.
 * Handles backoff on failures to avoid hammering the API.
 * 
 * @param tenantId - The Evolution API instance/tenant ID
 * @param phone - The phone number to show typing indicator for
 */
export async function startTypingIndicator(tenantId: string, phone: string): Promise<void> {
  const key = `${tenantId}:${phone}`;

  // If already starting/active, clear existing interval to restart fresh
  if (activeTypingState.get(key) === 'active' || activeTypingState.get(key) === 'starting') {
    clearExistingInterval(key);
  }

  activeTypingState.set(key, 'starting');
  
  // Send initial composing signal
  const success = await sendTypingIndicator(tenantId, phone, "composing");
  
  if (!success) {
    // If initial send fails, still try to set up the interval
    // since the next attempt might work
    console.warn(`[TypingIndicator] Initial composing signal failed for ${key}, will retry`);
  } else {
    // Reset failure count on success
    failureCount.set(key, 0);
  }

  activeTypingState.set(key, 'active');

  // Set up periodic refresh
  let backoffMs = INITIAL_BACKOFF_MS;
  const interval = setInterval(async () => {
    // Check if still active (could have been stopped externally)
    if (activeTypingState.get(key) !== 'active') {
      clearInterval(interval);
      return;
    }

    const failures = failureCount.get(key) || 0;
    
    // Calculate delay based on failures (exponential backoff, capped)
    const delay = failures === 0 
      ? 0 
      : Math.min(INITIAL_BACKOFF_MS * Math.pow(2, failures - 1), MAX_BACKOFF_MS);
    
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Re-check state after delay
    if (activeTypingState.get(key) !== 'active') {
      return;
    }

    const ok = await sendTypingIndicator(tenantId, phone, "composing");
    
    if (ok) {
      failureCount.set(key, 0);
      backoffMs = INITIAL_BACKOFF_MS;
    } else {
      const newFailures = (failureCount.get(key) || 0) + 1;
      failureCount.set(key, newFailures);
      console.warn(`[TypingIndicator] Refresh failed for ${key} (${newFailures} consecutive failures)`);
      
      // If too many consecutive failures, stop the indicator entirely
      if (newFailures >= 5) {
        console.error(`[TypingIndicator] Too many failures for ${key}, stopping indicator`);
        await stopTypingIndicator(tenantId, phone);
      }
    }
  }, REFRESH_INTERVAL_MS);

  activeTypingIntervals.set(key, interval);

  // Auto-expiry: stop after MAX_DURATION_MS as a safety net
  const expiryTimer = setTimeout(() => {
    if (activeTypingState.get(key) === 'active') {
      console.warn(`[TypingIndicator] Auto-expiring typing for ${key} after ${MAX_DURATION_MS}ms`);
      stopTypingIndicator(tenantId, phone);
    }
  }, MAX_DURATION_MS);
  
  activeTypingExpiry.set(key, expiryTimer);

  if (process.env.DEBUG_MODE === 'true') {
    console.log(`[TypingIndicator] Started for ${key}`);
  }
}

/**
 * Stop typing indicator and clean up interval and expiry timer.
 * Should be called when bot finishes processing and is ready to send response.
 * 
 * @param tenantId - The Evolution API instance/tenant ID
 * @param phone - The phone number to stop typing indicator for
 */
export async function stopTypingIndicator(tenantId: string, phone: string): Promise<void> {
  const key = `${tenantId}:${phone}`;

  // Prevent redundant stops
  const currentState = activeTypingState.get(key);
  if (currentState === 'stopping' || currentState === undefined) {
    return;
  }

  activeTypingState.set(key, 'stopping');

  // Clean up interval and expiry
  clearExistingInterval(key);

  // Reset failure tracking
  failureCount.delete(key);

  // Send paused signal
  try {
    await sendTypingIndicator(tenantId, phone, "paused");
  } catch (error) {
    console.error(`[TypingIndicator] Failed to send paused signal:`, error);
  }

  activeTypingState.delete(key);

  if (process.env.DEBUG_MODE === 'true') {
    console.log(`[TypingIndicator] Stopped for ${key}`);
  }
}

/**
 * Clear the interval and expiry timer for a given key.
 */
function clearExistingInterval(key: string): void {
  const interval = activeTypingIntervals.get(key);
  if (interval) {
    clearInterval(interval);
    activeTypingIntervals.delete(key);
  }

  const expiry = activeTypingExpiry.get(key);
  if (expiry) {
    clearTimeout(expiry);
    activeTypingExpiry.delete(key);
  }
}

/**
 * Wraps an async operation with typing indicator lifecycle.
 * 
 * - Starts the typing indicator before the operation
 * - Stops the typing indicator after the operation completes (success or error)
 * - Properly cleans up even if the operation throws
 * 
 * @example
 * ```ts
 * await withTypingIndicator(tenantId, phone, async () => {
 *   const result = await doSomething();
 *   await sendMessage(result);
 * });
 * ```
 * 
 * @param tenantId - The Evolution API instance/tenant ID
 * @param phone - The phone number to show/hide typing indicator for
 * @param fn - The async operation to wrap
 * @returns The result of the wrapped operation
 */
export async function withTypingIndicator<T>(
  tenantId: string,
  phone: string,
  fn: () => Promise<T>
): Promise<T> {
  await startTypingIndicator(tenantId, phone);
  try {
    return await fn();
  } finally {
    await stopTypingIndicator(tenantId, phone);
  }
}

/**
 * Clean up all active typing intervals (useful for cleanup/shutdown)
 */
export function cleanupAllTypingIndicators(): void {
  const keys = [...activeTypingIntervals.keys(), ...activeTypingExpiry.keys()];
  const uniqueKeys = new Set(keys);
  
  uniqueKeys.forEach(key => {
    clearExistingInterval(key);
    activeTypingState.delete(key);
    failureCount.delete(key);
    console.log(`[TypingIndicator] Cleaned up ${key}`);
  });
}

/**
 * Check if a typing indicator is currently active for a given conversation.
 */
export function isTypingActive(tenantId: string, phone: string): boolean {
  return activeTypingState.get(`${tenantId}:${phone}`) === 'active';
}
