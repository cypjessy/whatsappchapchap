"use client";

import { useEffect, useRef, useState } from 'react';

interface StatusBarConfig {
  color: string;
  style?: 'light' | 'dark';
}

/**
 * Hook to dynamically set Android status bar and navigation bar colors per page
 * Works with Capacitor StatusBar plugin
 *
 * Usage:
 *   useStatusBar({ color: '#667eea', style: 'light' });
 *   useStatusBar({ color: '#ffffff', style: 'dark' });
 *
 * @param config - Status bar color and icon style (light for dark icons, dark for white icons)
 */
export function useStatusBar(config: StatusBarConfig) {
  const prevConfigRef = useRef<StatusBarConfig | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Wait for Capacitor to be ready
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if Capacitor is available
    const checkCapacitor = () => {
      const hasCapacitor = !!(window as any).Capacitor;
      const hasCapacitorPlatforms = !!(window as any).CapacitorPlatforms;
      const isNative = hasCapacitor || hasCapacitorPlatforms;

      console.log('[StatusBar] Capacitor check:', { hasCapacitor, hasCapacitorPlatforms, isNative });

      if (isNative) {
        setIsReady(true);
      }
    };

    // Check immediately
    checkCapacitor();

    // Also check after a short delay in case Capacitor loads async
    const timer = setTimeout(checkCapacitor, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Always update meta theme-color immediately (works on web too)
    const updateMetaThemeColor = () => {
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', config.color);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = config.color;
        document.head.appendChild(meta);
      }
      console.log('[StatusBar] Navigation bar color set to', config.color);
    };

    updateMetaThemeColor();

    // Skip if not ready or config hasn't changed
    if (!isReady) {
      console.log('[StatusBar] Not ready yet, skipping native status bar update');
      return;
    }

    if (
      prevConfigRef.current &&
      prevConfigRef.current.color === config.color &&
      prevConfigRef.current.style === config.style
    ) {
      return;
    }

    prevConfigRef.current = config;

    const setStatusBar = async () => {
      try {
        const [{ StatusBar, Style }] = await Promise.all([
          import('@capacitor/status-bar'),
        ]);

        console.log('[StatusBar] Setting status bar to', config.color);

        // CRITICAL: Disable overlay mode so status bar doesn't cover content
        await StatusBar.setOverlaysWebView({ overlay: false });

        // Set status bar color
        await StatusBar.setBackgroundColor({ color: config.color });

        // Set icon style based on background
        const iconStyle = config.style === 'light' ? Style.Light : Style.Dark;
        await StatusBar.setStyle({ style: iconStyle });

        console.log('[StatusBar] Successfully set to', config.color, 'with', config.style || 'auto', 'icons');
      } catch (err) {
        console.warn('[StatusBar] Failed to set status bar:', err);
      }
    };

    setStatusBar();
  }, [config.color, config.style, isReady]);
}
