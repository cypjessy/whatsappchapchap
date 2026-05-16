"use client";

import { AuthProvider } from "@/context/AuthContext";
import { useAppLifecycle } from "@/hooks/useAppLifecycle";
import { usePWARegistration } from "@/hooks/usePWARegistration";
import { ReactNode, useState, useEffect } from "react";

export default function ClientLayout({ children }: { children: ReactNode }) {
  // Initialize Capacitor lifecycle management to prevent idle freeze
  useAppLifecycle();
  
  // Initialize PWA registration and updates
  const { updateAvailable, reloadApp } = usePWARegistration();
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);

  // Show update banner when update is available
  useEffect(() => {
    if (updateAvailable) {
      setShowUpdateBanner(true);
      // Auto-hide after 10 seconds
      setTimeout(() => setShowUpdateBanner(false), 10000);
    }
  });

  return (
    <>
      {/* PWA Update Notification Banner */}
      {showUpdateBanner && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white px-4 py-3 shadow-lg animate-slideDown">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="fas fa-sync-alt fa-spin" />
              <span className="font-semibold text-sm">
                New version available!
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUpdateBanner(false)}
                className="px-3 py-1 text-xs bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                Later
              </button>
              <button
                onClick={() => {
                  setShowUpdateBanner(false);
                  reloadApp();
                }}
                className="px-3 py-1 text-xs bg-white text-[#8b5cf6] font-bold rounded-lg hover:bg-white/90 transition-colors"
              >
                Update Now
              </button>
            </div>
          </div>
        </div>
      )}
      
      <AuthProvider>{children}</AuthProvider>
    </>
  );
}
