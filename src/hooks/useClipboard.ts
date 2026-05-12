"use client";

import { useCallback } from 'react';

/**
 * Hook for clipboard operations in Capacitor apps
 * Allows copying text like order IDs, M-Pesa codes, etc.
 */
export function useClipboard() {
  const isCapacitor = typeof window !== 'undefined' && 
    ((window as any).Capacitor || (window as any).CapacitorPlatforms);

  /**
   * Copy text to clipboard
   */
  const copy = useCallback(async (text: string) => {
    if (!isCapacitor) {
      // Fallback to browser API
      try {
        await navigator.clipboard.writeText(text);
        console.log('[Clipboard] Copied using browser API');
        return true;
      } catch (err) {
        console.error('[Clipboard] Browser copy failed:', err);
        return false;
      }
    }

    try {
      const { Clipboard } = await import('@capacitor/clipboard');
      await Clipboard.write({ string: text });
      console.log('[Clipboard] Copied successfully');
      return true;
    } catch (err) {
      console.error('[Clipboard] Copy failed:', err);
      return false;
    }
  }, [isCapacitor]);

  /**
   * Read text from clipboard
   */
  const paste = useCallback(async (): Promise<string | null> => {
    if (!isCapacitor) {
      // Fallback to browser API
      try {
        const text = await navigator.clipboard.readText();
        return text;
      } catch (err) {
        console.error('[Clipboard] Browser paste failed:', err);
        return null;
      }
    }

    try {
      const { Clipboard } = await import('@capacitor/clipboard');
      const result = await Clipboard.read();
      return result.value;
    } catch (err) {
      console.error('[Clipboard] Paste failed:', err);
      return null;
    }
  }, [isCapacitor]);

  return {
    copy,
    paste,
    isAvailable: isCapacitor,
  };
}
