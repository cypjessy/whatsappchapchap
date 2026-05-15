"use client";

import { useEffect, useRef } from 'react';

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

  useEffect(() => {
    // Check if running in Capacitor environment
    const isCapacitor = typeof window !== 'undefined' && 
      ((window as any).Capacitor || (window as any).CapacitorPlatforms);

    if (!isCapacitor) return;

    // Skip if config hasn't changed
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

        // CRITICAL: Disable overlay mode so status bar doesn't cover content
        // This ensures Android respects the status bar as a separate area
        await StatusBar.setOverlaysWebView({ overlay: false });

        // Set status bar color
        await StatusBar.setBackgroundColor({ color: config.color });

        // Set icon style based on background
        const iconStyle = config.style === 'light' ? Style.Light : Style.Dark;
        await StatusBar.setStyle({ style: iconStyle });

        console.log('[StatusBar] Set to', config.color, 'with', config.style || 'auto', 'icons (overlay: false)');
      } catch (err) {
        console.warn('[StatusBar] Failed to set status bar:', err);
      }
    };

    // Also update meta theme-color for Android navigation bar
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

    setStatusBar();
    updateMetaThemeColor();
  }, [config.color, config.style]);
}
