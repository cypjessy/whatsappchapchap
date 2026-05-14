"use client";

import { useCallback } from 'react';

/**
 * Hook for sharing content in Capacitor apps
 * Allows users to share products, orders, etc.
 */
export function useShare() {
  const isCapacitor = typeof window !== 'undefined' && 
    ((window as any).Capacitor || (window as any).CapacitorPlatforms);

  /**
   * Share content via native share sheet
   */
  const share = useCallback(async (options: {
    title?: string;
    text?: string;
    url?: string;
  }) => {
    if (!isCapacitor) {
      // Fallback to Web Share API
      if (navigator.share) {
        try {
          await navigator.share(options);
          console.log('[Share] Shared using Web Share API');
          return true;
        } catch (err) {
          if ((err as Error).name !== 'AbortError') {
            console.error('[Share] Web Share failed:', err);
          }
          return false;
        }
      } else {
        console.warn('[Share] Web Share API not supported');
        return false;
      }
    }

    try {
      const { Share } = await import('@capacitor/share');
      await Share.share(options);
      console.log('[Share] Shared successfully');
      return true;
    } catch (err) {
      if ((err as Error).message !== 'Share canceled') {
        console.error('[Share] Share failed:', err);
      }
      return false;
    }
  }, [isCapacitor]);

  return {
    share,
    isAvailable: isCapacitor || (typeof navigator !== 'undefined' && !!navigator.share),
  };
}
