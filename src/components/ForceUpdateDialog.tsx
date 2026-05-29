"use client";

import { useEffect, useRef } from "react";

interface ForceUpdateDialogProps {
  currentVersion: string;
  minimumVersion: string;
  updateUrl?: string;
  message?: string;
}

/**
 * Force Update Dialog
 * 
 * A full-screen modal that CANNOT be dismissed by the user.
 * - No close button
 * - No backdrop click dismissal
 * - Back button (Android hardware) is intercepted
 * - Only option is to click "Update Now" which opens the Play Store / APK URL
 * 
 * This renders at z-[99999] to sit above everything including modals.
 */
export function ForceUpdateDialog({
  currentVersion,
  minimumVersion,
  updateUrl,
  message,
}: ForceUpdateDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Block the Android hardware back button
  useEffect(() => {
    let backButtonListener: { remove: () => void } | null = null;

    const blockBack = async () => {
      try {
        const isCapacitor =
          typeof window !== "undefined" &&
          ((window as any).Capacitor || (window as any).CapacitorPlatforms);

        if (isCapacitor) {
          const { App } = await import("@capacitor/app");
          // Override all back button events while this dialog is shown
          const handle = await App.addListener("backButton", () => {
            // Do nothing — user can't go back
            console.log("[ForceUpdate] Back button blocked — update required");
          });
          backButtonListener = handle;
        }
      } catch {
        // Not in Capacitor, back button isn't a concern
      }
    };

    blockBack();

    // Cleanup: remove the listener when dialog unmounts
    return () => {
      if (backButtonListener?.remove) {
        backButtonListener.remove();
      }
    };
  }, []);

  const handleUpdate = async () => {
    if (!updateUrl) return;

    try {
      const isCapacitor =
        typeof window !== "undefined" &&
        ((window as any).Capacitor || (window as any).CapacitorPlatforms);

      if (isCapacitor) {
        // Use Capacitor Browser plugin to open system browser reliably
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url: updateUrl });
      } else {
        // Fallback for web
        window.open(updateUrl, "_blank");
      }
    } catch {
      // Fallback if Browser plugin isn't available
      window.open(updateUrl, "_blank");
    }
  };

  // Block all touch events that might try to dismiss the dialog
  const preventDismiss = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[99999] flex items-center justify-center"
      style={{ pointerEvents: "auto" }}
      onClick={preventDismiss}
      onTouchStart={preventDismiss}
    >
      {/* Backdrop with blur — can't be clicked to dismiss */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" />

      {/* Main Dialog Card */}
      <div className="relative z-10 w-[90%] max-w-md mx-auto animate-slideUp">
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
          {/* Header with gradient */}
          <div className="bg-gradient-to-br from-[#25D366] to-[#128C7E] px-8 pt-10 pb-8 text-center relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full" />

            {/* Warning Icon */}
            <div className="w-20 h-20 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>

            <h2 className="text-2xl font-extrabold text-white mb-2">
              Update Required
            </h2>
            <p className="text-white/80 text-sm leading-relaxed">
              {message || "A new version of WhatsApp Chap Chap is available. Please update to continue using the app."}
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-6 space-y-4">
            {/* Version Info */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 font-medium">Your version</span>
                <span className="text-gray-400 font-semibold">{currentVersion}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 font-medium">Required version</span>
                <span className="text-[#25D366] font-bold">{minimumVersion}</span>
              </div>
            </div>

            {/* Info box */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="text-xs text-amber-700 leading-relaxed">
                This app will not function until you update to the latest version. Your data is safe and will be available after the update.
              </p>
            </div>

            {/* Update Button — only action available */}
            {updateUrl ? (
              <button
                onClick={handleUpdate}
                className="w-full py-4 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-bold text-base rounded-xl 
                  hover:shadow-lg hover:shadow-[#25D366]/30 hover:scale-[1.02] active:scale-[0.98] 
                  transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  <span>Download Update Now</span>
                </div>
              </button>
            ) : (
              <button
                disabled
                className="w-full py-4 bg-gray-300 text-gray-500 font-bold text-base rounded-xl cursor-not-allowed"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Preparing update...</span>
                </div>
              </button>
            )}

            {/* Update instructions */}
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              After downloading, open the APK file and tap <strong className="text-gray-500">Install</strong>.
              You may need to enable &quot;Install from unknown sources&quot; in your settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
