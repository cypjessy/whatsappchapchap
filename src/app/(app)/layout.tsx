"use client";

import AppLayout from "@/components/AppLayout";
import DashboardProtection from "@/components/DashboardProtection";
import { ModeProvider } from "@/context/ModeContext";
import { useAppLifecycle } from "@/hooks/useAppLifecycle";
import { useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize app lifecycle management for Capacitor
  useAppLifecycle();

  // Set status bar color on mount (Capacitor only)
  useEffect(() => {
    const setStatusBar = async () => {
      try {
        const isCapacitor = typeof window !== 'undefined' && 
          ((window as any).Capacitor || (window as any).CapacitorPlatforms);
        
        if (!isCapacitor) return;

        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#25D366' });
        console.log('[Layout] Status bar configured');
      } catch (err) {
        console.warn('[Layout] Failed to set status bar:', err);
      }
    };
    
    setStatusBar();
  }, []);

  return (
    <ModeProvider>
      <AppLayout>
        <DashboardProtection>{children}</DashboardProtection>
      </AppLayout>
    </ModeProvider>
  );
}
