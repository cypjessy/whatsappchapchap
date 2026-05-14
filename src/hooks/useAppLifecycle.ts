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

    // Fix 1: App State listener - Handle native app state changes (ALWAYS ACTIVE)
    import('@capacitor/app').then(({ App }) => {
      console.log('[AppLifecycle] Capacitor App plugin loaded');
      
      // Native listener that stays active even when WebView is idle
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          console.log('[AppLifecycle] App resumed from background - waking up');
          // Update timestamp immediately
          sessionStorage.setItem('lastActiveTime', Date.now().toString());
          // Wake up all web listeners
          window.dispatchEvent(new Event('focus'));
          window.dispatchEvent(new Event('pageshow'));
        } else {
          console.log('[AppLifecycle] App going to background');
          sessionStorage.setItem('lastActiveTime', Date.now().toString());
        }
      });

      // Native resume event - fires when app returns from background
      App.addListener('resume', () => {
        console.log('[AppLifecycle] Native resume event - ensuring responsiveness');
        const lastActive = sessionStorage.getItem('lastActiveTime');
        if (lastActive) {
          const timeAway = Date.now() - parseInt(lastActive);
          if (timeAway > 5 * 60 * 1000) { // 5 minutes
            console.log('[AppLifecycle] Long absence detected, reloading for fresh state...');
            window.location.reload();
          } else {
            // Just wake up without reload
            window.dispatchEvent(new Event('focus'));
          }
        }
      });

      // Native pause event - fires when app goes to background
      App.addListener('pause', () => {
        console.log('[AppLifecycle] Native pause event - saving state');
        sessionStorage.setItem('lastActiveTime', Date.now().toString());
      });

      console.log('[AppLifecycle] Native app listeners registered - ALWAYS ACTIVE');
    }).catch(err => {
      console.warn('[AppLifecycle] Could not load Capacitor App plugin:', err);
    });

    // Fix 2: Keep-alive ping every 2 minutes to prevent WebView sleep
    const keepAliveInterval = setInterval(() => {
      // Ping a lightweight endpoint to keep JS context alive
      fetch('/api/ping')
        .then(() => console.log('[AppLifecycle] Keep-alive ping successful'))
        .catch((err) => {
          // Silent fail - endpoint might not exist yet
          console.debug('[AppLifecycle] Keep-alive ping failed (expected if API route missing)');
        });
    }, 2 * 60 * 1000); // 2 minutes

    // Fix 2.5: Persistent global touch handler - ALWAYS ACTIVE
    // Uses capture phase to intercept ALL touches before they reach components
    const handleGlobalTouch = () => {
      const lastActive = sessionStorage.getItem('lastActiveTime');
      if (lastActive) {
        const timeSinceActive = Date.now() - parseInt(lastActive);
        // If idle for more than 10 seconds, immediately wake up
        if (timeSinceActive > 10 * 1000) {
          console.log('[AppLifecycle] Global touch after idle - waking up instantly');
          window.dispatchEvent(new Event('focus'));
          window.dispatchEvent(new Event('pageshow'));
        }
      }
      sessionStorage.setItem('lastActiveTime', Date.now().toString());
    };

    // Register persistent listeners with capture=true (fires before component listeners)
    document.addEventListener('touchstart', handleGlobalTouch, { passive: true, capture: true });
    document.addEventListener('click', handleGlobalTouch, { passive: true, capture: true });

    // Fix 3: Visibility change handler (most reliable)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[AppLifecycle] Page became visible - reinitializing');
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
      // Clean up intervals and non-persistent listeners
      clearInterval(keepAliveInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('click', trackActivity);
      window.removeEventListener('touchstart', trackActivity);
      window.removeEventListener('keydown', trackActivity);
      window.removeEventListener('scroll', trackActivity);
      
      // NOTE: Global touch handlers (handleGlobalTouch) are NOT removed
      // They remain active to ensure app responsiveness even after component unmount
      console.log('[AppLifecycle] Cleanup complete - persistent listeners remain active');
    };
  }, []);
}
