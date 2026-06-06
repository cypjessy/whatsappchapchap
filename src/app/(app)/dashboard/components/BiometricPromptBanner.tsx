"use client";

import { useEffect, useState, useCallback } from "react";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { useAuth } from "@/context/AuthContext";
import { PreferenceService, PREF_KEYS } from "@/lib/preference-service";

// ─── Types ────────────────────────────────────────────────────────────────────

type BannerState = "prompt" | "enrolling" | "success" | "error";

// ─── Success Component ────────────────────────────────────────────────────────

function EnableSuccess({ biometricType, onDismiss }: { biometricType: string; onDismiss: () => void }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl
        bg-gradient-to-br from-emerald-500 to-green-600
        shadow-lg shadow-emerald-500/20
        transition-all duration-500 ease-out
        ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
    >
      {/* Confetti-like decorative dots */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/10" />
      <div className="absolute top-1/2 right-1/4 w-8 h-8 rounded-full bg-white/5" />

      <div className="relative p-4 md:p-5 flex items-start gap-4">
        {/* Success icon */}
        <div className="shrink-0 w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-white mb-1">
            {biometricType === "fingerprint" ? "Fingerprint" : "Biometric"} Login Enabled! 🎉
          </h3>
          <p className="text-sm text-white/80 leading-relaxed mb-3">
            You can now use your fingerprint to quickly access your dashboard. Next time you open the app, just scan and you&apos;re in!
          </p>

          <button
            onClick={onDismiss}
            className="
              inline-flex items-center gap-2 px-4 py-2
              bg-white text-emerald-600 font-bold text-sm rounded-xl
              shadow-sm hover:shadow-md
              hover:-translate-y-0.5 active:translate-y-0 active:scale-95
              transition-all duration-200
            "
          >
            <i className="fas fa-check-circle text-xs" />
            Got it!
          </button>
        </div>
      </div>

      {/* Bottom progress bar - animated fill */}
      <div className="relative h-1 bg-white/10">
        <div
          className="h-full bg-white/40 rounded-full transition-all duration-[1500ms] ease-linear"
          style={{ width: show ? "100%" : "0%" }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BiometricPromptBanner() {
  const { isAvailable, biometricType, getBiometricIcon, authenticate } = useBiometricAuth();
  const { user } = useAuth();
  const [biometricEnabled, setBiometricEnabled] = useState<boolean | null>(null);
  const [isNative, setIsNative] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [bannerState, setBannerState] = useState<BannerState>("prompt");
  const [errorMsg, setErrorMsg] = useState<string>("");

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

  // Handle enable biometric - everything happens right here on the dashboard
  const handleEnableBiometric = useCallback(async () => {
    setBannerState("enrolling");
    setErrorMsg("");

    try {
      // 1. First authenticate the user via biometrics
      const bioResult = await authenticate(
        "Verify your identity to enable fingerprint login"
      );

      if (!bioResult.success) {
        setErrorMsg(bioResult.error || "Verification failed. Please try again.");
        setBannerState("error");
        return;
      }

      // 2. Save biometric preference
      await PreferenceService.set({
        key: PREF_KEYS.BIOMETRIC_ENABLED,
        value: "true",
      });

      // 3. Save the user's email for biometric login
      if (user?.email) {
        await PreferenceService.set({
          key: PREF_KEYS.BIOMETRIC_EMAIL,
          value: user.email,
        });
      }

      // 4. Update local state
      setBiometricEnabled(true);
      setBannerState("success");
    } catch (err: any) {
      console.error("[BiometricPromptBanner] Error enabling biometric:", err);
      setErrorMsg(err?.message || "Something went wrong. Please try again.");
      setBannerState("error");
    }
  }, [authenticate, user]);

  // Handle dismiss / got it
  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setIsVisible(false);
  }, []);

  // ─── Success State (must render BEFORE null-guard below) ─────────────────
  if (bannerState === "success") {
    return (
      <EnableSuccess biometricType={biometricType} onDismiss={handleDismiss} />
    );
  }

  // Don't render if not applicable
  if (!isNative || !isAvailable || biometricEnabled !== false || dismissed) {
    return null;
  }

  // ─── Prompt / Enrolling / Error State ─────────────────────────────────────
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

      {/* Dismiss button - hide during enrollment */}
      {bannerState !== "enrolling" && (
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all z-10"
          aria-label="Dismiss"
        >
          <i className="fas fa-times text-sm" />
        </button>
      )}

      <div className="relative p-4 md:p-5 flex items-start gap-4">
        {/* Icon */}
        <div className="shrink-0 w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
          {bannerState === "enrolling" ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : bannerState === "error" ? (
            <i className="fas fa-exclamation-triangle text-2xl text-white" />
          ) : (
            <i className={`fas ${getBiometricIcon()} text-2xl text-white`} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {bannerState === "enrolling" ? (
            <>
              <h3 className="text-base font-bold text-white mb-1">
                Setting up {biometricType === "fingerprint" ? "Fingerprint" : "Biometric"} Login...
              </h3>
              <p className="text-sm text-white/80 leading-relaxed mb-3">
                Please scan your fingerprint to verify your identity.
              </p>
              <div className="flex items-center gap-2 text-white/60 text-xs">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Waiting for verification...</span>
              </div>
            </>
          ) : bannerState === "error" ? (
            <>
              <h3 className="text-base font-bold text-white mb-1">
                Verification Failed
              </h3>
              <p className="text-sm text-white/80 leading-relaxed mb-3">
                {errorMsg}
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleEnableBiometric}
                  className="
                    inline-flex items-center gap-2 px-4 py-2
                    bg-white text-[#667eea] font-bold text-sm rounded-xl
                    shadow-sm hover:shadow-md
                    hover:-translate-y-0.5 active:translate-y-0 active:scale-95
                    transition-all duration-200
                  "
                >
                  <i className="fas fa-redo text-xs" />
                  Try Again
                </button>
                <button
                  onClick={handleDismiss}
                  className="
                    text-sm font-medium text-white/70 hover:text-white
                    transition-colors px-3 py-2 rounded-lg
                    hover:bg-white/10
                  "
                >
                  Not Now
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-base font-bold text-white mb-1">
                Enable {biometricType === "fingerprint" ? "Fingerprint" : "Biometric"} Login
              </h3>
              <p className="text-sm text-white/80 leading-relaxed mb-3">
                Quicker and more secure access to your dashboard. No need to type your password every time you open the app.
              </p>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleEnableBiometric}
                  className="
                    inline-flex items-center gap-2 px-4 py-2
                    bg-white text-[#667eea] font-bold text-sm rounded-xl
                    shadow-sm hover:shadow-md
                    hover:-translate-y-0.5 active:translate-y-0 active:scale-95
                    transition-all duration-200
                  "
                >
                  <i className={`fas ${getBiometricIcon()} text-xs`} />
                  Enable Now
                </button>
                <button
                  onClick={handleDismiss}
                  className="
                    text-sm font-medium text-white/70 hover:text-white
                    transition-colors px-3 py-2 rounded-lg
                    hover:bg-white/10
                  "
                >
                  Maybe Later
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom progress bar */}
      <div className="relative h-1 bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${
            bannerState === "error" ? "bg-red-400" : "bg-white/40"
          }`}
          style={{ width: isVisible ? "100%" : "0%" }}
        />
      </div>
    </div>
  );
}
