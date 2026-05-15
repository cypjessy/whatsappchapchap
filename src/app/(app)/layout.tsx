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
      {/* Premium Offline Modal - Mobile/Android Only */}
      {showOfflineBanner && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 lg:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" />
          
          {/* Modal */}
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
            {/* Gradient Header */}
            <div className="bg-gradient-to-br from-red-500 to-orange-500 p-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <i className="fas fa-wifi-slash text-4xl text-white" />
              </div>
              <h2 className="text-2xl font-black text-white mb-1">No Internet</h2>
              <p className="text-white/80 text-sm">Connection Lost</p>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-exclamation-triangle text-red-500 text-sm" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 mb-1">You're Offline</p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Some features require an internet connection. You can still view cached content.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-lightbulb text-blue-500 text-sm" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 mb-1">Quick Tip</p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Check your Wi-Fi or mobile data settings and try again.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Action Button */}
              <button
                onClick={() => setShowOfflineBanner(false)}
                className="mt-6 w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <i className="fas fa-check-circle" />
                Got It
              </button>
            </div>
          </div>
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
