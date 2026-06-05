"use client";

import { useState, useCallback, useEffect } from "react";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";

interface BiometricGateProps {
  email: string;
  onVerified: () => void;
  onFallback: () => void;
  onLogout: () => void;
}

export default function BiometricGate({ email, onVerified, onFallback, onLogout }: BiometricGateProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);
  const { authenticate, biometricType, getBiometricIcon, getBiometricLabel, isAvailable } = useBiometricAuth();

  // Define handleAuthenticate BEFORE the useEffect that uses it
  const handleAuthenticate = useCallback(async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    setError(null);
    setHasAttempted(true);

    try {
      const result = await authenticate("Verify your identity to access your account");

      if (result.success) {
        onVerified();
      } else {
        setError(result.error || "Biometric verification failed. Try again or use your password.");
        // Don't auto-retry — let the user decide
      }
    } catch (err: any) {
      setError(err?.message || "Biometric verification failed");
    } finally {
      setIsAuthenticating(false);
    }
  }, [authenticate, onVerified, isAuthenticating]);

  // Auto-trigger biometric on mount - NOW handleAuthenticate is defined above
  useEffect(() => {
    if (!hasAttempted && isAvailable) {
      const timer = setTimeout(() => {
        handleAuthenticate();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isAvailable, hasAttempted, handleAuthenticate]);

  const getIcon = () => {
    switch (biometricType) {
      case "fingerprint":
        return (
          <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C8.13 2 5 5.13 5 9v3c0 2.38 1.19 4.47 3 5.74V17c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-.26c1.81-1.27 3-3.36 3-5.74V9c0-3.87-3.13-7-7-7z" />
            <path d="M9 14.25c-.69 0-1.25-.56-1.25-1.25v-2c0-.69.56-1.25 1.25-1.25s1.25.56 1.25 1.25v2c0 .69-.56 1.25-1.25 1.25z" />
            <path d="M15 14.25c-.69 0-1.25-.56-1.25-1.25v-2c0-.69.56-1.25 1.25-1.25s1.25.56 1.25 1.25v2c0 .69-.56 1.25-1.25 1.25z" />
            <path d="M12 19c-1.1 0-2-.9-2-2v-1h4v1c0 1.1-.9 2-2 2z" />
            <path d="M8 11V9c0-2.21 1.79-4 4-4s4 1.79 4 4v2" opacity="0.4" />
          </svg>
        );
      case "face":
      case "faceId":
        return (
          <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        );
      default:
        return (
          <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        );
    }
  };

  const getFriendlyLabel = () => {
    switch (biometricType) {
      case "fingerprint":
        return "Touch the fingerprint sensor";
      case "face":
      case "faceId":
        return "Look at your device to unlock";
      case "touchId":
        return "Touch the Touch ID sensor";
      case "iris":
        return "Iris scan required";
      default:
        return "Verify with biometrics";
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2]">
      {/* Decorative shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-white/[0.03] rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-6">
        {/* Icon with pulse animation */}
        <div className="relative mb-8">
          <div className={`w-28 h-28 rounded-full bg-white/10 flex items-center justify-center text-white
            ${isAuthenticating ? 'animate-pulse' : ''}
            transition-all duration-500`}>
            {getIcon()}
          </div>
          {/* Outer ripple rings */}
          <div className={`absolute inset-0 rounded-full border-2 border-white/20 ${isAuthenticating ? 'animate-ping' : ''}`} style={{ animationDuration: '2s' }} />
          <div className={`absolute -inset-4 rounded-full border border-white/10 ${isAuthenticating ? 'animate-ping' : ''}`} style={{ animationDuration: '2.5s', animationDelay: '0.3s' }} />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-2 text-center">
          Quick Verify
        </h1>

        {/* Instruction */}
        <p className="text-white/70 text-center text-sm mb-2 leading-relaxed">
          {isAuthenticating ? "Checking..." : getFriendlyLabel()}
        </p>

        {/* User email */}
        <p className="text-white/50 text-xs text-center mb-8">
          Signed in as <span className="text-white/70 font-medium">{email}</span>
        </p>

        {/* Verify Button */}
        {!isAuthenticating && (
          <button
            onClick={handleAuthenticate}
            disabled={isAuthenticating}
            className="w-full py-3.5 px-6 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl border border-white/20 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 group"
          >
            <i className={`${getBiometricIcon()} text-lg group-hover:scale-110 transition-transform`}></i>
            <span>{getBiometricLabel()}</span>
          </button>
        )}

        {/* Loading spinner when authenticating */}
        {isAuthenticating && (
          <div className="flex items-center gap-3 py-3.5 px-6 text-white/70">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-sm">Authenticating...</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 w-full p-3 bg-red-500/15 border border-red-400/30 rounded-xl">
            <div className="flex items-start gap-2">
              <i className="fas fa-exclamation-circle text-red-300 mt-0.5 text-sm"></i>
              <p className="text-red-200 text-xs leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Fallback options */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={onFallback}
            className="text-white/50 hover:text-white/80 text-sm transition-colors underline underline-offset-4 decoration-white/20 hover:decoration-white/40"
          >
            Use Password Instead
          </button>
          <button
            onClick={onLogout}
            className="text-white/40 hover:text-white/60 text-xs transition-colors flex items-center gap-1.5"
          >
            <i className="fas fa-sign-out-alt text-[10px]"></i>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
