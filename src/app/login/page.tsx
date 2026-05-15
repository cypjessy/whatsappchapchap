"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useHaptics } from "@/hooks/useNativeAndroid";
import { useStatusBar } from "@/hooks/useStatusBar";
import { useAppLifecycle } from "@/hooks/useAppLifecycle";
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

function PremiumErrorModal({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      // Auto-dismiss after 6 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`
          absolute inset-0 bg-black/60 backdrop-blur-sm
          transition-opacity duration-300
          ${isVisible ? "opacity-100" : "opacity-0"}
        `}
        onClick={() => {
          setIsVisible(false);
          setTimeout(onDismiss, 300);
        }}
      />
      
      {/* Modal */}
      <div
        className={`
          relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden
          transition-all duration-300 ease-out
          ${isVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"}
        `}
      >
        {/* Gradient Header */}
        <div className="bg-gradient-to-br from-red-500 to-pink-500 p-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <i className="fas fa-shield-alt text-4xl text-white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-1">Access Denied</h2>
          <p className="text-white/80 text-sm">Authentication Failed</p>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-exclamation-triangle text-red-500 text-sm" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 mb-1">Invalid Credentials</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  The email or password you entered is incorrect. Please check your details and try again.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-lightbulb text-blue-500 text-sm" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 mb-1">Need Help?</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Forgot your password? Try resetting it or contact support for assistance.
                </p>
              </div>
            </div>
          </div>
          
          {/* Action Button */}
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onDismiss, 300);
            }}
            className="mt-6 w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <i className="fas fa-check-circle" />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LoginPage({ redirectTo = "/dashboard" }: LoginPageProps) {
  // Initialize Capacitor lifecycle management to prevent idle freeze
  useAppLifecycle();
  
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

      {/* Premium Error Modal */}
      <PremiumErrorModal message={error} onDismiss={clearError} />

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
