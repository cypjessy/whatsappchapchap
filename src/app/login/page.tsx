"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import LoginForm from "@/components/auth/LoginForm";
import BrandPanel from "@/components/auth/BrandPanel";
import MobileLogo from "@/components/auth/MobileLogo";
import FloatingShapes from "@/components/auth/FloatingShapes";
import "./page-styles.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoginPageProps {
  redirectTo?: string;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function LoadingOverlay({ isVisible }: { isVisible: boolean }) {
  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        bg-white/80 backdrop-blur-sm
        transition-all duration-300
        ${isVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
      `}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#667eea]/30 border-t-[#667eea] rounded-full animate-spin" />
        <span className="text-sm font-semibold text-[#667eea]">Signing in...</span>
      </div>
    </div>
  );
}

function ErrorToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      className={`
        fixed top-4 left-4 right-4 z-50 max-w-md mx-auto
        bg-[#ef4444] text-white px-4 py-3 rounded-xl shadow-lg
        flex items-center gap-3
        transition-all duration-300
        ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"}
      `}
    >
      <i className="fas fa-exclamation-circle text-lg shrink-0" />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onDismiss, 300);
        }}
        className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors shrink-0"
      >
        <i className="fas fa-times text-xs" />
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LoginPage({ redirectTo = "/dashboard" }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();

  // Entrance animation
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const togglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const clearError = useCallback(() => setError(""), []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Haptic feedback (if supported)
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(50);
      }

      setIsLoading(true);
      setError("");

      try {
        await signIn(email, password);
        router.push(redirectTo);
      } catch (err: any) {
        setError(err.message || "Invalid email or password. Please try again.");
        setIsLoading(false);
        
        // Error haptic
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([50, 100, 50]);
        }
      }
    },
    [email, password, signIn, router, redirectTo]
  );

  const handleGoogleLogin = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }

    setIsLoading(true);
    setError("");

    try {
      await signInWithGoogle();
      router.push(redirectTo);
    } catch (err: any) {
      setError(err.message || "Google sign-in failed. Please try again.");
      setIsLoading(false);
      
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([50, 100, 50]);
      }
    }
  }, [signInWithGoogle, router, redirectTo]);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#667eea] to-[#764ba2] relative overflow-hidden">
      <FloatingShapes />
      <BrandPanel />

      {/* Loading Overlay */}
      <LoadingOverlay isVisible={isLoading} />

      {/* Error Toast */}
      <ErrorToast message={error} onDismiss={clearError} />

      {/* Main Content */}
      <div
        className={`
          w-full lg:w-[600px] bg-white flex flex-col justify-center
          p-6 sm:p-8 lg:p-12
          transition-all duration-700 ease-out
          ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}
        `}
      >
        <div className="w-full max-w-[420px] mx-auto">
          <MobileLogo />

          {/* Header */}
          <div
            className={`
              mb-8 text-center lg:text-left
              transition-all duration-500 delay-100
              ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
            `}
          >
            <h1 className="text-2xl lg:text-[2.25rem] font-extrabold text-[#1a1a2e] mb-2 tracking-tight">
              Welcome Back! 👋
            </h1>
            <p className="text-[#6b7280] text-sm leading-relaxed">
              Sign in to manage your products and automate your WhatsApp sales
            </p>
          </div>

          {/* Form */}
          <div
            className={`
              transition-all duration-500 delay-200
              ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
            `}
          >
            <LoginForm
              email={email}
              password={password}
              error="" // Error shown in toast instead
              isLoading={isLoading}
              showPassword={showPassword}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onTogglePassword={togglePassword}
              onSubmit={handleSubmit}
              onGoogleLogin={handleGoogleLogin}
            />
          </div>

          {/* Footer */}
          <div
            className={`
              text-center mt-8 text-sm
              transition-all duration-500 delay-300
              ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
            `}
          >
            <p className="text-[#6b7280]">
              Don&apos;t have an account?{" "}
              <button
                onClick={() => router.push("/register")}
                disabled={isLoading}
                className={`
                  text-[#25D366] font-bold hover:underline
                  bg-transparent border-none cursor-pointer
                  transition-all duration-200
                  ${isLoading ? "opacity-50 cursor-not-allowed" : "opacity-100"}
                `}
              >
                Start free trial
              </button>
            </p>
            <p className="mt-4">
              <Link
                href="/"
                className="text-[#6b7280] hover:text-[#25D366] transition-colors inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
