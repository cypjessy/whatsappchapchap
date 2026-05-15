"use client";

import { useEffect, useRef } from 'react';
import { getAuth } from 'firebase/auth';

/**
 * Hook to handle app lifecycle events in Capacitor
 * Prevents session issues when app goes idle/background
 * Uses keep-alive ping + visibility change detection + Capacitor native listeners
 * 
 * This hook ensures the app stays responsive even after long idle periods by:
 * 1. Registering Capacitor native listeners that stay active even when WebView sleeps
 * 2. Keeping the JavaScript context alive with periodic pings
 * 3. Waking up all web listeners on touch/click events
 * 4. Detecting long idle periods and reloading if needed
 */
export function useAppLifecycle() {
  const initializedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate initialization
    if (initializedRef.current) {
      console.log('[AppLifecycle] Already initialized, skipping');
      return;
    }
    initializedRef.current = true;

    // Check if running in Capacitor environment
    const isCapacitor = typeof window !== 'undefined' && 
      ((window as any).Capacitor || (window as any).CapacitorPlatforms);

    if (!isCapacitor) {
      console.log('[AppLifecycle] Not in Capacitor environment, skipping');
      return;
    }

    console.log('[AppLifecycle] ========== INITIALIZING Capacitor lifecycle management ==========');
    console.log('[AppLifecycle] Registering native listeners to prevent idle freeze');

    // ========================================
    // Fix 1: Capacitor Native App Listeners (CRITICAL - ALWAYS ACTIVE)
    // These listeners are registered at the native level and fire even when WebView is frozen
    // ========================================
    import('@capacitor/app').then(({ App }) => {
      console.log('[AppLifecycle] Capacitor App plugin loaded - native listeners active');
      
      // Native listener: Fires when app state changes (foreground/background)
      // This is the MOST RELIABLE listener - works even after long idle
      App.addListener('appStateChange', async ({ isActive }) => {
        console.log('[AppLifecycle] appStateChange: isActive =', isActive);
        
        // Always update timestamp - this is critical for detecting idle state
        sessionStorage.setItem('lastActiveTime', Date.now().toString());
        sessionStorage.setItem('appState', isActive ? 'active' : 'background');
        
        if (isActive) {
          console.log('[AppLifecycle] ✅ App resumed - waking up all listeners');
          
          // FIX: Refresh Firebase token on app resume to prevent 401 errors
          try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (user) {
              await user.getIdToken(true); // Force token refresh
              console.log('[AppLifecycle] ✅ Firebase token refreshed on app resume');
            }
          } catch (error) {
            console.error('[AppLifecycle] ❌ Failed to refresh Firebase token:', error);
          }
          
          // Force wake up all web event listeners
          window.dispatchEvent(new Event('focus'));
          window.dispatchEvent(new Event('pageshow'));
          window.dispatchEvent(new CustomEvent('appresumed'));
        } else {
          console.log('[AppLifecycle] App going to background - saving state');
        }
      });

      // Native resume event - fires when app returns from background
      App.addListener('resume', () => {
        console.log('[AppLifecycle] Native RESUME event - checking idle time');
        const lastActive = sessionStorage.getItem('lastActiveTime');
        
        if (lastActive) {
          const timeAway = Date.now() - parseInt(lastActive);
          console.log('[AppLifecycle] Time away from app:', Math.round(timeAway / 1000), 'seconds');
          
          if (timeAway > 10 * 60 * 1000) { // 10 minutes
            console.log('[AppLifecycle] ⚠️ Long absence detected (>10 min), reloading for fresh state...');
            // Update timestamp before reload
            sessionStorage.setItem('lastActiveTime', Date.now().toString());
            window.location.reload();
          } else {
            console.log('[AppLifecycle] ✅ Waking up without reload');
            // Just wake up listeners
            window.dispatchEvent(new Event('focus'));
            window.dispatchEvent(new Event('pageshow'));
          }
        }
      });

      // Native pause event - fires when app goes to background
      App.addListener('pause', () => {
        console.log('[AppLifecycle] Native PAUSE event - saving state');
        sessionStorage.setItem('lastActiveTime', Date.now().toString());
        sessionStorage.setItem('appState', 'background');
      });

      console.log('[AppLifecycle] ✅ Native app listeners registered - these NEVER sleep');
    }).catch(err => {
      console.error('[AppLifecycle] ❌ Could not load Capacitor App plugin:', err);
    });

    // ========================================
    // Fix 2: Keep-alive ping every 2 minutes to prevent WebView JavaScript context from sleeping
    // ========================================
    const keepAliveInterval = setInterval(() => {
      // Ping a lightweight endpoint to keep JS context alive
      fetch('/api/ping', { method: 'GET', cache: 'no-cache' })
        .then(() => {
          console.debug('[AppLifecycle] Keep-alive ping successful');
          sessionStorage.setItem('lastKeepAlive', Date.now().toString());
        })
        .catch((err) => {
          // Silent fail - endpoint might not exist or network might be offline
          console.debug('[AppLifecycle] Keep-alive ping failed (expected if offline)');
        });
    }, 2 * 60 * 1000); // 2 minutes

    // ========================================
    // Fix 3: Persistent global touch/click handlers (CRITICAL - WAKES UP APP)
    // Uses capture phase to intercept ALL touches before they reach any component
    // This ensures the app wakes up on ANY user interaction
    // ========================================
    const handleGlobalTouch = () => {
      const lastActive = sessionStorage.getItem('lastActiveTime');
      
      if (lastActive) {
        const timeSinceActive = Date.now() - parseInt(lastActive);
        
        // If idle for more than 5 seconds, wake up immediately
        if (timeSinceActive > 5 * 1000) {
          console.log('[AppLifecycle] Global touch after', Math.round(timeSinceActive / 1000), 's idle - WAKING UP');
          sessionStorage.setItem('lastActiveTime', Date.now().toString());
          window.dispatchEvent(new Event('focus'));
          window.dispatchEvent(new Event('pageshow'));
        }
      }
      
      // Always update active time
      sessionStorage.setItem('lastActiveTime', Date.now().toString());
    };

    // Register persistent listeners with capture=true
    // capture=true means these fire BEFORE component-level listeners
    document.addEventListener('touchstart', handleGlobalTouch, { passive: true, capture: true });
    document.addEventListener('touchend', handleGlobalTouch, { passive: true, capture: true });
    document.addEventListener('click', handleGlobalTouch, { passive: true, capture: true });
    document.addEventListener('mousedown', handleGlobalTouch, { passive: true, capture: true });

    console.log('[AppLifecycle] ✅ Global touch/click listeners registered with capture=true');

    // ========================================
    // Fix 4: Visibility change handler
    // ========================================
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[AppLifecycle] Page became visible - reinitializing listeners');
        
        // Force re-initialize any broken event listeners
        window.dispatchEvent(new Event('focus'));
        window.dispatchEvent(new Event('pageshow'));
        
        // Update active timestamp
        sessionStorage.setItem('lastActiveTime', Date.now().toString());
      } else {
        console.log('[AppLifecycle] Page hidden - saving state');
        sessionStorage.setItem('lastActiveTime', Date.now().toString());
      }
    };

    // ========================================
    // Fix 5: Activity tracking
    // ========================================
    const trackActivity = () => {
      sessionStorage.setItem('lastActiveTime', Date.now().toString());
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Track various user interactions
    window.addEventListener('click', trackActivity);
    window.addEventListener('touchstart', trackActivity);
    window.addEventListener('touchend', trackActivity);
    window.addEventListener('keydown', trackActivity);
    window.addEventListener('scroll', trackActivity, { passive: true });

    // ========================================
    // Initialize: Set initial state
    // ========================================
    sessionStorage.setItem('lastActiveTime', Date.now().toString());
    sessionStorage.setItem('appState', 'active');
    sessionStorage.setItem('lastKeepAlive', Date.now().toString());
    
    console.log('[AppLifecycle] ✅ Initial state set - app is ACTIVE and listening');
    console.log('[AppLifecycle] ========== Lifecycle management fully active ==========');

    // ========================================
    // Cleanup: Only clean up non-persistent listeners
    // Global touch handlers remain active to ensure responsiveness
    // ========================================
    return () => {
      console.log('[AppLifecycle] Cleaning up non-persistent listeners...');
      
      clearInterval(keepAliveInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('click', trackActivity);
      window.removeEventListener('touchstart', trackActivity);
      window.removeEventListener('touchend', trackActivity);
      window.removeEventListener('keydown', trackActivity);
      window.removeEventListener('scroll', trackActivity);
      
      // NOTE: Global touch handlers (handleGlobalTouch) are NOT removed
      // They remain active to ensure app responsiveness even after component unmount
      console.log('[AppLifecycle] ✅ Cleanup complete - persistent listeners remain active');
    };
  }, []);
}
