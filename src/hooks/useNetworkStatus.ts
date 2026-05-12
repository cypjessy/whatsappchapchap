"use client";

import { useState, useEffect } from 'react';

/**
 * Hook for network status monitoring in Capacitor apps
 * Detects online/offline state and shows appropriate UI
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isCapacitor, setIsCapacitor] = useState(false);

  useEffect(() => {
    // Check if running in Capacitor
    const capacitorCheck = typeof window !== 'undefined' && 
      ((window as any).Capacitor || (window as any).CapacitorPlatforms);
    
    setIsCapacitor(!!capacitorCheck);

    if (!capacitorCheck) {
      // Use browser's native online/offline events
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Set initial state
      setIsOnline(navigator.onLine);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    // Use Capacitor Network plugin
    let networkListener: any = null;

    import('@capacitor/network').then(({ Network }) => {
      // Get initial status
      Network.getStatus().then(status => {
        setIsOnline(status.connected);
      });

      // Listen for changes
      networkListener = Network.addListener('networkStatusChange', status => {
        console.log('[Network] Status changed:', status);
        setIsOnline(status.connected);
      });
    }).catch(err => {
      console.warn('[Network] Failed to load Capacitor Network plugin:', err);
    });

    return () => {
      if (networkListener) {
        networkListener.remove();
      }
    };
  }, []);

  return {
    isOnline,
    isCapacitor,
  };
}
