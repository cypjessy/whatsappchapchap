"use client";

import { useEffect } from 'react';

/**
 * Hook for premium mobile Android optimizations using Capacitor plugins
 * Enhances native app feel with status bar, keyboard handling, and device features
 */
export function useMobileOptimizations() {
  useEffect(() => {
    const isCapacitor = typeof window !== 'undefined' && 
      ((window as any).Capacitor || (window as any).CapacitorPlatforms);

    if (!isCapacitor) return;

    console.log('[MobileOpt] Initializing premium mobile optimizations');

    // Initialize all mobile optimizations
    const initMobileFeatures = async () => {
      try {
        // 1. Enhanced Status Bar Management
        const [{ StatusBar, Style }, { Keyboard }, { App }] = await Promise.all([
          import('@capacitor/status-bar'),
          import('@capacitor/keyboard'),
          import('@capacitor/app'),
        ]);

        // Configure status bar for premium look
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#ffffff' });
        await StatusBar.setOverlaysWebView({ overlay: false });
        console.log('[MobileOpt] Status bar configured for white theme');

        // 2. Keyboard behavior optimization - listen for keyboard events
        Keyboard.addListener('keyboardWillShow', (info) => {
          console.log('[MobileOpt] Keyboard will show:', info.keyboardHeight);
          document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
        });

        Keyboard.addListener('keyboardWillHide', () => {
          console.log('[MobileOpt] Keyboard will hide');
          document.body.style.removeProperty('--keyboard-height');
        });

        console.log('[MobileOpt] Keyboard optimization enabled');

        // 3. Handle app resume - refresh data if needed
        App.addListener('resume', () => {
          console.log('[MobileOpt] App resumed - refreshing state');
          // Dispatch custom event for components to listen
          window.dispatchEvent(new CustomEvent('appResumed'));
        });

        // 4. Prevent zoom on double-tap (premium app behavior)
        const preventZoom = (e: TouchEvent) => {
          if (e.touches.length > 1) {
            e.preventDefault();
          }
        };

        document.addEventListener('touchstart', preventZoom, { passive: false });

        // 5. Optimize scrolling momentum
        const optimizeScrolling = () => {
          const scrollableElements = document.querySelectorAll('.overflow-y-auto, .overflow-y-scroll');
          scrollableElements.forEach(el => {
            el.classList.add('momentum-scroll');
          });
        };

        // Run on initial load and after DOM updates
        setTimeout(optimizeScrolling, 100);
        
        // Observe DOM changes to apply to new elements
        const observer = new MutationObserver(() => {
          optimizeScrolling();
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });

        console.log('[MobileOpt] All mobile optimizations initialized');

        // Cleanup
        return () => {
          document.removeEventListener('touchstart', preventZoom);
          observer.disconnect();
        };

      } catch (err) {
        console.warn('[MobileOpt] Failed to initialize mobile optimizations:', err);
      }
    };

    const cleanup = initMobileFeatures();

    return () => {
      cleanup?.then(fn => fn?.());
    };
  }, []);
}
