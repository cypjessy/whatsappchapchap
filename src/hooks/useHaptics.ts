"use client";

import { useCallback } from 'react';

/**
 * Hook for haptic feedback in Capacitor apps
 * Provides tactile feedback for button presses and actions
 */
export function useHaptics() {
  const isCapacitor = typeof window !== 'undefined' && 
    ((window as any).Capacitor || (window as any).CapacitorPlatforms);

  /**
   * Light haptic feedback for button presses
   */
  const impactLight = useCallback(async () => {
    if (!isCapacitor) return;
    
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (err) {
      console.debug('[Haptics] Impact light failed:', err);
    }
  }, [isCapacitor]);

  /**
   * Medium haptic feedback for important actions
   */
  const impactMedium = useCallback(async () => {
    if (!isCapacitor) return;
    
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (err) {
      console.debug('[Haptics] Impact medium failed:', err);
    }
  }, [isCapacitor]);

  /**
   * Heavy haptic feedback for critical actions
   */
  const impactHeavy = useCallback(async () => {
    if (!isCapacitor) return;
    
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (err) {
      console.debug('[Haptics] Impact heavy failed:', err);
    }
  }, [isCapacitor]);

  /**
   * Success notification haptic
   */
  const notificationSuccess = useCallback(async () => {
    if (!isCapacitor) return;
    
    try {
      const { Haptics, NotificationType } = await import('@capacitor/haptics');
      await Haptics.notification({ type: NotificationType.Success });
    } catch (err) {
      console.debug('[Haptics] Notification success failed:', err);
    }
  }, [isCapacitor]);

  /**
   * Error notification haptic
   */
  const notificationError = useCallback(async () => {
    if (!isCapacitor) return;
    
    try {
      const { Haptics, NotificationType } = await import('@capacitor/haptics');
      await Haptics.notification({ type: NotificationType.Error });
    } catch (err) {
      console.debug('[Haptics] Notification error failed:', err);
    }
  }, [isCapacitor]);

  /**
   * Warning notification haptic
   */
  const notificationWarning = useCallback(async () => {
    if (!isCapacitor) return;
    
    try {
      const { Haptics, NotificationType } = await import('@capacitor/haptics');
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (err) {
      console.debug('[Haptics] Notification warning failed:', err);
    }
  }, [isCapacitor]);

  return {
    impactLight,
    impactMedium,
    impactHeavy,
    notificationSuccess,
    notificationError,
    notificationWarning,
    isAvailable: isCapacitor,
  };
}
