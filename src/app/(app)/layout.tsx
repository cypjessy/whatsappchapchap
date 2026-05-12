"use client";

import AppLayout from "@/components/AppLayout";
import DashboardProtection from "@/components/DashboardProtection";
import { ModeProvider } from "@/context/ModeContext";
import { useAppLifecycle } from "@/hooks/useAppLifecycle";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useEffect, useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  
  // Initialize app lifecycle management for Capacitor
  useAppLifecycle();
  
  // Monitor network status
  const { isOnline } = useNetworkStatus();

  // Show offline banner when connection is lost
  useEffect(() => {
    if (!isOnline) {
      setShowOfflineBanner(true);
    } else {
      // Hide banner after a short delay when back online
      const timer = setTimeout(() => setShowOfflineBanner(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  // Set status bar color on mount (Capacitor only)
  useEffect(() => {
    const setupCapacitor = async () => {
      try {
        const isCapacitor = typeof window !== 'undefined' && 
          ((window as any).Capacitor || (window as any).CapacitorPlatforms);
        
        if (!isCapacitor) return;

        // Import all Capacitor plugins
        const [{ StatusBar, Style }, { App }, { ScreenOrientation }, { SplashScreen }] = await Promise.all([
          import('@capacitor/status-bar'),
          import('@capacitor/app'),
          import('@capacitor/screen-orientation'),
          import('@capacitor/splash-screen'),
        ]);

        // 1. Status Bar - Green with light text
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#25D366' });
        console.log('[Layout] Status bar configured');

        // 2. Navigation Bar - Green with light buttons
        // Note: Using CSS approach since plugin doesn't exist
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
          metaThemeColor.setAttribute('content', '#25D366');
        } else {
          const meta = document.createElement('meta');
          meta.name = 'theme-color';
          meta.content = '#25D366';
          document.head.appendChild(meta);
        }
        console.log('[Layout] Navigation bar color set via meta tag');

        // 3. Lock screen orientation to portrait
        try {
          await ScreenOrientation.lock({ orientation: 'portrait' });
          console.log('[Layout] Screen orientation locked to portrait');
        } catch (err) {
          console.warn('[Layout] Failed to lock orientation:', err);
        }

        // 4. Handle Android back button
        App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            // Show exit confirmation or exit app
            console.log('[Layout] Back button pressed at root - exiting app');
            App.exitApp();
          }
        });
        console.log('[Layout] Back button handler registered');

        // 5. Hide splash screen with fade effect
        setTimeout(async () => {
          try {
            await SplashScreen.hide({ fadeOutDuration: 300 });
            console.log('[Layout] Splash screen hidden');
          } catch (err) {
            console.warn('[Layout] Failed to hide splash:', err);
          }
        }, 500); // Small delay to ensure content is ready

      } catch (err) {
        console.warn('[Layout] Failed to setup Capacitor:', err);
      }
    };
    
    setupCapacitor();
  }, []);

  return (
    <>
      {/* Offline Banner */}
      {showOfflineBanner && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-500 text-white px-4 py-2 text-center text-sm font-medium shadow-lg">
          <i className="fas fa-wifi-slash mr-2"></i>
          You're offline. Some features may be limited.
        </div>
      )}
      
      <ModeProvider>
        <AppLayout>
          <DashboardProtection>{children}</DashboardProtection>
        </AppLayout>
      </ModeProvider>
    </>
  );
}
