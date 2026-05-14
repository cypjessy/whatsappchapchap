"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useHaptics } from "@/hooks/useNativeAndroid";
import { useStatusBar } from "@/hooks/useStatusBar";
import LoginForm from "@/components/auth/LoginForm";
import BrandPanel from "@/components/auth/BrandPanel";
import MobileLogo from "@/components/auth/MobileLogo";
import FloatingShapes from "@/components/auth/FloatingShapes";
import { AnimatedSplash } from "@/components/AnimatedSplash";
import "./page-styles.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoginPageProps {
  redirectTo?: string;
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
  const [isLoading, setIsLoading] = useState(false); // Loading only during sign-in
  const [showSplash, setShowSplash] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();
  const { impactLight, notificationSuccess, notificationError } = useHaptics();

  // Set status bar to match purple gradient background with white icons
  useStatusBar({ color: '#667eea', style: 'light' });

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const togglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const clearError = useCallback(() => setError(""), []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Immediate loading feedback (no delay)
      setIsLoading(true);
      setError("");
      
      // Fire haptic feedback without blocking
      impactLight().catch(() => {});

      try {
        await signIn(email, password);
        // Fire success haptic without blocking
        notificationSuccess().catch(() => {});
        // Use Next.js router for client-side navigation (preserves auth state, no full reload)
        router.push(redirectTo);
      } catch (err: any) {
        setError(err.message || "Invalid email or password. Please try again.");
        setIsLoading(false);
        
        // Fire error haptic without blocking
        notificationError().catch(() => {});
      }
    },
    [email, password, signIn, router, redirectTo, impactLight, notificationSuccess, notificationError]
  );

  const handleGoogleLogin = useCallback(async () => {
    // Immediate loading feedback (no delay)
    setIsLoading(true);
    setError("");
    
    // Fire haptic feedback without blocking
    impactLight().catch(() => {});

    try {
      await signInWithGoogle();
      // Fire success haptic without blocking
      notificationSuccess().catch(() => {});
      // Use Next.js router for client-side navigation (preserves auth state, no full reload)
      router.push(redirectTo);
    } catch (err: any) {
      setError(err.message || "Google sign-in failed. Please try again.");
      setIsLoading(false);
      // Fire error haptic without blocking
      notificationError().catch(() => {});
    }
  }, [signInWithGoogle, router, redirectTo, impactLight, notificationSuccess, notificationError]);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#667eea] to-[#764ba2] relative overflow-hidden">
      <FloatingShapes />
      <BrandPanel />

      {/* Animated Splash Screen */}
      {showSplash && <AnimatedSplash onComplete={handleSplashComplete} />}

      {/* Sign-in Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#25D366] to-[#128C7E]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-2xl flex items-center justify-center">
              <svg className="w-12 h-12 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </div>
            <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        </div>
      )}

      {/* Error Toast */}
      <ErrorToast message={error} onDismiss={clearError} />

      {/* Main Content - Android Material Design 3 */}
      <div
        className={`
          w-full lg:w-[600px] bg-white flex flex-col justify-center
          p-4 sm:p-6 lg:p-12
          transition-all duration-700 ease-out
          ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}
        `}
      >
        {/* Mobile Header */}
        <div className="lg:hidden w-full max-w-md mx-auto mb-6">
          <MobileLogo />
        </div>

        <div className="w-full max-w-[420px] mx-auto">
          {/* Desktop Header */}
          <div className="hidden lg:block mb-8">
            <MobileLogo />
          </div>

          {/* Header */}
          <div
            className={`
              mb-6 lg:mb-8 text-center lg:text-left
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

          {/* Android Material Design 3 Card */}
          <div
            className={`
              bg-white rounded-2xl lg:rounded-none shadow-none lg:shadow-none
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
              mt-6 lg:mt-8
              transition-all duration-500 delay-300
              ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
            `}
          >
            {/* Material Design 3 Register Button - Instant Response */}
            <button
              onClick={() => {
                impactLight().catch(() => {});
                router.push("/register");
              }}
              disabled={isLoading}
              className={`
                w-full py-3.5 px-6 bg-gradient-to-r from-[#25D366] to-[#128C7E] 
                text-white border-none rounded-xl text-base lg:text-lg font-bold 
                cursor-pointer transition-all duration-300 
                hover:translate-y-[-2px] hover:shadow-lg 
                active:translate-y-0 active:shadow-md
                active:scale-[0.98]
                disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed
                mb-4 relative overflow-hidden
              `}
            >
              <span className="relative z-10">Create Free Account</span>
            </button>

            {/* Divider */}
            <div className="flex items-center my-4 text-[#6b7280] text-xs font-medium">
              <div className="flex-1 h-px bg-[#e5e7eb]" />
              <span className="px-4">or</span>
              <div className="flex-1 h-px bg-[#e5e7eb]" />
            </div>

            {/* Sign In Link */}
            <p className="text-center text-sm text-[#6b7280]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[#25D366] font-bold hover:underline inline-flex items-center gap-1"
              >
                Sign in here
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </p>

            {/* Back to Home Link */}
            <p className="mt-4 text-center">
              <Link
                href="/"
                className="text-[#6b7280] hover:text-[#25D366] transition-colors inline-flex items-center gap-2 text-sm"
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
