"use client";

import { useEffect } from 'react';

/**
 * Hook to handle app lifecycle events in Capacitor
 * Prevents session issues when app goes idle/background
 * Uses keep-alive ping + visibility change detection (recommended approach)
 */
export function useAppLifecycle() {
  useEffect(() => {
    // Check if running in Capacitor environment
    const isCapacitor = typeof window !== 'undefined' && 
      ((window as any).Capacitor || (window as any).CapacitorPlatforms);

    if (!isCapacitor) return;

    console.log('[AppLifecycle] Initializing Capacitor lifecycle management');

    // Fix 1: App State listener - Handle native app state changes
    import('@capacitor/app').then(({ App }) => {
      console.log('[AppLifecycle] Capacitor App plugin loaded');
      
      // When app comes back from background, dispatch focus event
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          console.log('[AppLifecycle] App resumed from background');
          window.dispatchEvent(new Event('focus'));
        }
      });

      // On resume, check if page needs refresh
      App.addListener('resume', () => {
        console.log('[AppLifecycle] Resume event triggered');
        // Only reload if we've been gone for a long time
        const lastActive = sessionStorage.getItem('lastActiveTime');
        if (lastActive) {
          const timeAway = Date.now() - parseInt(lastActive);
          if (timeAway > 10 * 60 * 1000) { // 10 minutes
            console.log('[AppLifecycle] Long absence detected, reloading...');
            window.location.reload();
          }
        }
      });

      // Save timestamp when going to background
      App.addListener('pause', () => {
        console.log('[AppLifecycle] App paused (background)');
        sessionStorage.setItem('lastActiveTime', Date.now().toString());
      });
    }).catch(err => {
      console.warn('[AppLifecycle] Could not load Capacitor App plugin:', err);
    });

    // Fix 2: Keep-alive ping every 2 minutes to prevent WebView sleep (reduced from 4 min)
    const keepAliveInterval = setInterval(() => {
      // Ping a lightweight endpoint to keep JS context alive
      fetch('/api/ping')
        .then(() => console.log('[AppLifecycle] Keep-alive ping successful'))
        .catch((err) => {
          // Silent fail - endpoint might not exist yet
          console.debug('[AppLifecycle] Keep-alive ping failed (expected if API route missing)');
        });
    }, 2 * 60 * 1000); // 2 minutes (more frequent to prevent sleep)

    // Fix 3: Visibility change handler (most reliable)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[AppLifecycle] Page became visible - reinitializing');
        
        // Check if we were away for a while
        const lastActive = sessionStorage.getItem('lastActiveTime');
        if (lastActive) {
          const timeAway = Date.now() - parseInt(lastActive);
          if (timeAway > 30 * 1000) { // 30 seconds
            console.log('[AppLifecycle] Returning from idle state, waking up listeners');
            // Force re-initialization of event system
            window.dispatchEvent(new Event('pageshow'));
          }
        }
        
        // Re-initialize any broken event listeners
        window.dispatchEvent(new Event('focus'));
        
        // Update active timestamp
        sessionStorage.setItem('lastActiveTime', Date.now().toString());
      } else {
        console.log('[AppLifecycle] Page hidden');
        sessionStorage.setItem('lastActiveTime', Date.now().toString());
      }
    };

    // Track user activity
    const trackActivity = () => {
      const lastActive = sessionStorage.getItem('lastActiveTime');
      if (lastActive) {
        const timeSinceActive = Date.now() - parseInt(lastActive);
        // If idle for more than 30 seconds, wake up the app
        if (timeSinceActive > 30 * 1000) {
          console.log('[AppLifecycle] User interaction after idle - waking up app');
          window.dispatchEvent(new Event('focus'));
          window.dispatchEvent(new Event('pageshow'));
        }
      }
      sessionStorage.setItem('lastActiveTime', Date.now().toString());
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Track various user interactions to update active time
    window.addEventListener('click', trackActivity);
    window.addEventListener('touchstart', trackActivity);
    window.addEventListener('keydown', trackActivity);
    window.addEventListener('scroll', trackActivity, { passive: true });

    // Initialize active time
    sessionStorage.setItem('lastActiveTime', Date.now().toString());

    return () => {
      clearInterval(keepAliveInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('click', trackActivity);
      window.removeEventListener('touchstart', trackActivity);
      window.removeEventListener('keydown', trackActivity);
      window.removeEventListener('scroll', trackActivity);
    };
  }, []);
}
