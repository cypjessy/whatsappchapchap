"use client";

import { useEffect, useState } from "react";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { PreferenceService, PREF_KEYS } from "@/lib/preference-service";
import Link from "next/link";

// ─── Main Component ───────────────────────────────────────────────────────────

export function BiometricPromptBanner() {
  const { isAvailable, biometricType, getBiometricIcon } = useBiometricAuth();
  const [biometricEnabled, setBiometricEnabled] = useState<boolean | null>(null);
  const [isNative, setIsNative] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Check if running on native Android
  useEffect(() => {
    const checkPlatform = () => {
      try {
        const isCap =
          typeof window !== "undefined" &&
          (window as any).Capacitor?.isNativePlatform?.();
        setIsNative(!!isCap);
      } catch {
        setIsNative(false);
      }
    };
    checkPlatform();
  }, []);

  // Check biometric preference
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const enabled = await PreferenceService.get(PREF_KEYS.BIOMETRIC_ENABLED);
        setBiometricEnabled(enabled === "true");
      } catch {
        setBiometricEnabled(false);
      }
    };
    loadPreference();
  }, []);

  // Animate in after mount
  useEffect(() => {
    if (!dismissed && isNative && isAvailable && biometricEnabled === false) {
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => clearTimeout(timer);
    }
  }, [dismissed, isNative, isAvailable, biometricEnabled]);

  // Don't render if not applicable
  if (!isNative || !isAvailable || biometricEnabled !== false || dismissed) {
    return null;
  }

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl
        bg-gradient-to-br from-[#667eea] to-[#764ba2]
        shadow-lg shadow-purple-500/20
        transition-all duration-500 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}
      `}
    >
      {/* Background decorative circles */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />

      {/* Dismiss button */}
      <button
        onClick={() => {
          setDismissed(true);
          setIsVisible(false);
        }}
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all z-10"
        aria-label="Dismiss"
      >
        <i className="fas fa-times text-sm" />
      </button>

      <div className="relative p-4 md:p-5 flex items-start gap-4">
        {/* Icon */}
        <div className="shrink-0 w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
          <i className={`fas ${getBiometricIcon()} text-2xl text-white`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-white mb-1">
            Enable {biometricType === "fingerprint" ? "Fingerprint" : "Biometric"} Login
          </h3>
          <p className="text-sm text-white/80 leading-relaxed mb-3">
            Quicker and more secure access to your dashboard. No need to type your password every time you open the app.
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className="
                inline-flex items-center gap-2 px-4 py-2
                bg-white text-[#667eea] font-bold text-sm rounded-xl
                shadow-sm hover:shadow-md
                hover:-translate-y-0.5 active:translate-y-0 active:scale-95
                transition-all duration-200
              "
            >
              <i className="fas fa-cog text-xs" />
              Enable Now
            </Link>
            <button
              onClick={() => {
                setDismissed(true);
                setIsVisible(false);
              }}
              className="
                text-sm font-medium text-white/70 hover:text-white
                transition-colors px-3 py-2 rounded-lg
                hover:bg-white/10
              "
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>

      {/* Bottom progress bar */}
      <div className="relative h-1 bg-white/10">
        <div className="h-full bg-white/40 rounded-full transition-all duration-1000 ease-linear"
          style={{ width: isVisible ? "100%" : "0%" }}
        />
      </div>
    </div>
  );
}
