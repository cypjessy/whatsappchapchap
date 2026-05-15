"use client";

import AppLayout from "@/components/AppLayout";
import DashboardProtection from "@/components/DashboardProtection";
import { ModeProvider } from "@/context/ModeContext";
import { useAppLifecycle } from "@/hooks/useAppLifecycle";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useMobileOptimizations } from "@/hooks/useMobileOptimizations";
import { useStatusBar } from "@/hooks/useStatusBar";
import { modalRegistry } from "@/lib/modal-registry";
import { useEffect, useState } from 'react';

// Helper function to show exit toast on Android back button
const showExitToast = () => {
  if (typeof window === 'undefined') return;
  
  // Don't show multiple toasts
  if (document.getElementById('exit-toast')) return;
  
  const toast = document.createElement('div');
  toast.id = 'exit-toast';
  toast.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 10px 24px;
    border-radius: 20px;
    font-size: 14px;
    z-index: 9999;
    white-space: nowrap;
    pointer-events: none;
  `;
  toast.innerText = 'Press back again to exit';
  document.body.appendChild(toast);
  
  setTimeout(() => {
    document.getElementById('exit-toast')?.remove();
  }, 2000);
};

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

  // Apply premium mobile optimizations
  useMobileOptimizations();

  // Force status bar color on initial mount - runs immediately before any other effects
  useEffect(() => {
    const setInitialStatusBar = async () => {
      try {
        const [{ StatusBar, Style }] = await Promise.all([
          import('@capacitor/status-bar'),
        ]);
        // CRITICAL: Disable overlay mode so status bar doesn't cover content
        await StatusBar.setOverlaysWebView({ overlay: false });
        // Set green status bar immediately on mount
        await StatusBar.setBackgroundColor({ color: '#25D366' });
        await StatusBar.setStyle({ style: Style.Light });
        console.log('[AppLayout] Initial status bar set to green (overlay: false)');
      } catch (err) {
        console.log('[AppLayout] Not in Capacitor environment or StatusBar failed:', err);
      }
    };
    setInitialStatusBar();
  }, []);

  // Default status bar color - matches TopBar's default green state
  // Will be updated dynamically when scrolling
  useStatusBar({ color: '#25D366', style: 'light' });

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

  // Set up Capacitor native features (orientation, back button, splash)
  useEffect(() => {
    const setupCapacitor = async () => {
      try {
        const isCapacitor = typeof window !== 'undefined' && 
          ((window as any).Capacitor || (window as any).CapacitorPlatforms);
        
        if (!isCapacitor) return;

        // Import all Capacitor plugins
        const [{ App }, { ScreenOrientation }, { SplashScreen }] = await Promise.all([
          import('@capacitor/app'),
          import('@capacitor/screen-orientation'),
          import('@capacitor/splash-screen'),
        ]);

        // 1. Lock screen orientation to portrait
        try {
          await ScreenOrientation.lock({ orientation: 'portrait' });
          console.log('[Layout] Screen orientation locked to portrait');
        } catch (err) {
          console.warn('[Layout] Failed to lock orientation:', err);
        }

        // 2. Handle Android back button with modal support and double-press-to-exit
        let lastBackPress = 0;
        App.addListener('backButton', ({ canGoBack }) => {
          const now = Date.now();
          
          // Priority 1: If any modal is open, close the topmost modal
          if (modalRegistry.hasOpenModals()) {
            console.log('[Layout] Back button pressed - closing top modal');
            const closed = modalRegistry.closeTopModal();
            if (closed) return; // Modal was closed, don't navigate
          }
          
          // Priority 2: Navigate back in app history
          if (canGoBack) {
            console.log('[Layout] Back button pressed - navigating back');
            window.history.back();
          } else {
            // Priority 3: On root page — double press to exit
            if (now - lastBackPress < 2000) {
              console.log('[Layout] Double back press detected - exiting app');
              App.exitApp();
            } else {
              lastBackPress = now;
              showExitToast();
            }
          }
        });
        console.log('[Layout] Back button handler registered with modal support');

        // 3. Hide splash screen with fade effect
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
