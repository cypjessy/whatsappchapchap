"use client";

import { AuthProvider } from "@/context/AuthContext";
import { useAppLifecycle } from "@/hooks/useAppLifecycle";
import { usePWARegistration } from "@/hooks/usePWARegistration";
import { ReactNode, useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  APP_VERSION_CODE,
  APP_VERSION_NAME,
  APP_VERSION_FIRESTORE_PATH,
} from "@/lib/app-version";
import { ForceUpdateDialog } from "@/components/ForceUpdateDialog";

export default function ClientLayout({ children }: { children: ReactNode }) {
  // Initialize Capacitor lifecycle management to prevent idle freeze
  useAppLifecycle();

  // Initialize PWA registration and updates
  const { updateAvailable, reloadApp } = usePWARegistration();
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);

  // ─── Forced Update Check ─────────────────────────────────────────
  // This runs once on mount and blocks the entire app if an update is required
  const [forceUpdateState, setForceUpdateState] = useState<{
    force: boolean;
    minimumVersion: string;
    updateUrl?: string;
    message?: string;
  } | null>(null);

  useEffect(() => {
    checkForcedUpdate();
  }, []);

  const checkForcedUpdate = async () => {
    try {
      const versionDoc = await getDoc(doc(db, APP_VERSION_FIRESTORE_PATH));

      if (!versionDoc.exists()) {
        // ─── Auto-create version document on first launch ───
        // No Firestore doc means this is the first time anyone has run the app.
        // Create it with the current version as both latest and minimum,
        // so the current app is valid and no update is forced.
        console.log(
          "[ForceUpdate] No version config found — auto-creating with current version"
        );

        const initialData = {
          minimumVersionCode: APP_VERSION_CODE,
          minimumVersionName: APP_VERSION_NAME,
          latestVersionCode: APP_VERSION_CODE,
          latestVersionName: APP_VERSION_NAME,
          updateUrl: "",
          forceUpdateMessage: "",
          updatedAt: new Date(),
        };

        await setDoc(doc(db, APP_VERSION_FIRESTORE_PATH), initialData);
        console.log(
          "[ForceUpdate] ✅ Version config auto-created at",
          APP_VERSION_FIRESTORE_PATH
        );
        return; // No force update needed — we're on the latest version
      }

      const config = versionDoc.data();
      const minimumVersionCode = config.minimumVersionCode as number;

      if (!minimumVersionCode) {
        console.log(
          "[ForceUpdate] No minimumVersionCode in config, skipping"
        );
        return;
      }

      console.log(
        "[ForceUpdate] Installed v" +
          APP_VERSION_CODE +
          " | Minimum required v" +
          minimumVersionCode
      );

      if (APP_VERSION_CODE < minimumVersionCode) {
        console.log(
          "[ForceUpdate] ⚠️ App is outdated — showing force update dialog"
        );
        setForceUpdateState({
          force: true,
          minimumVersion:
            (config.minimumVersionName as string) ||
            String(minimumVersionCode),
          updateUrl: config.updateUrl as string | undefined,
          message: config.forceUpdateMessage as string | undefined,
        });
      } else {
        console.log(
          "[ForceUpdate] ✅ App is up to date (v" +
            APP_VERSION_CODE +
            ")"
        );
      }
    } catch (error) {
      // If we can't reach Firestore (offline), let the user use the app
      console.log(
        "[ForceUpdate] Could not check version (offline?):",
        error
      );
    }
  };

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
      {/* ⭐ Forced Update Dialog — renders ABOVE everything including modals */}
      {forceUpdateState?.force && (
        <ForceUpdateDialog
          currentVersion={`${APP_VERSION_NAME} (build ${APP_VERSION_CODE})`}
          minimumVersion={forceUpdateState.minimumVersion}
          updateUrl={forceUpdateState.updateUrl}
          message={forceUpdateState.message}
        />
      )}

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
