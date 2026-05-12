"use client";

import { useCallback } from 'react';

/**
 * Hook for showing toast messages in Capacitor apps
 * Lightweight feedback messages for user actions
 */
export function useToast() {
  const isCapacitor = typeof window !== 'undefined' && 
    ((window as any).Capacitor || (window as any).CapacitorPlatforms);

  /**
   * Show a toast message
   */
  const show = useCallback(async (options: {
    text: string;
    duration?: 'short' | 'long';
    position?: 'top' | 'center' | 'bottom';
  }) => {
    if (!isCapacitor) {
      // Fallback to custom toast implementation
      console.log('[Toast]', options.text);
      // You can implement a web-based toast here if needed
      return;
    }

    try {
      const { Toast } = await import('@capacitor/toast');
      await Toast.show({
        text: options.text,
        duration: options.duration || 'short',
        position: options.position || 'bottom',
      });
    } catch (err) {
      console.error('[Toast] Failed to show:', err);
    }
  }, [isCapacitor]);

  return {
    show,
    isAvailable: isCapacitor,
  };
}
