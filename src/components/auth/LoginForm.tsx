"use client";

import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import "./login-styles.css";

interface LoginFormProps {
  email: string;
  password: string;
  error: string;
  isLoading: boolean;
  showPassword: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onTogglePassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onGoogleLogin: () => void;
  onBiometricLogin?: () => void;
}

export default function LoginForm({
  email,
  password,
  error,
  isLoading,
  showPassword,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
  onGoogleLogin,
  onBiometricLogin,
}: LoginFormProps) {
  const { isAvailable, getBiometricIcon, getBiometricLabel } = useBiometricAuth();
  return (
    <>
      <form onSubmit={onSubmit}>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}
        
        {/* Email Input - Material Design 3 */}
        <div className="mb-5 lg:mb-6">
          <label className="block mb-2 font-semibold text-[#1a1a2e] text-sm lg:text-base">Email Address</label>
          <div className="relative">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="w-full px-4 py-3.5 pl-14 border-2 border-[#e5e7eb] rounded-xl text-base bg-[#fafafa] text-[#1a1a2e] 
                focus:outline-none focus:border-[#25D366] focus:bg-white focus:shadow-[0_0_0_4px_rgba(37,211,102,0.1)] 
                transition-all duration-300 hover:border-[#c4b5fd] hover:shadow-md3-level1"
              placeholder="Enter your email"
              required
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b7280]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
        </div>

        {/* Password Input - Material Design 3 */}
        <div className="mb-5 lg:mb-6">
          <label className="block mb-2 font-semibold text-[#1a1a2e] text-sm lg:text-base">Password</label>
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b7280] pointer-events-none z-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="password-input-with-toggle w-full px-5 py-3.5 pl-12 border-2 border-[#e5e7eb] rounded-xl text-base bg-[#fafafa] text-[#1a1a2e] 
                focus:outline-none focus:border-[#25D366] focus:bg-white focus:shadow-[0_0_0_4px_rgba(37,211,102,0.1)] 
                transition-all duration-300 hover:border-[#c4b5fd] hover:shadow-md3-level1"
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="password-toggle-btn"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg className="w-5 h-5 text-[#6b7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-[#6b7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password - Material Design 3 */}
        <div className="mb-6 flex justify-between items-center flex-wrap gap-3 lg:gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none group">
            <input type="checkbox" className="w-[18px] h-[18px] accent-[#25D366] cursor-pointer" />
            <span className="text-sm text-[#6b7280] font-medium group-hover:text-[#1a1a2e] transition-colors">Remember me</span>
          </label>
          <a href="#" className="text-[#25D366] no-underline font-semibold text-sm hover:text-[#128C7E] transition-colors">
            Forgot Password?
          </a>
        </div>

        {/* Sign In Button - Material Design 3 */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 lg:py-4 px-6 bg-gradient-to-r from-[#25D366] to-[#128C7E]
            text-white border-none rounded-xl text-base lg:text-lg font-bold cursor-pointer
            transition-all duration-300 hover:translate-y-[-2px] hover:shadow-md3-level3
            active:translate-y-0 active:shadow-md3-level2 active:scale-[0.98]
            disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed
            relative overflow-hidden"
        >
          {isLoading ? (
            <>
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>

        {/* Biometric Login Button - Only show if available */}
        {isAvailable && onBiometricLogin && (
          <>
            <div className="flex items-center my-4 text-[#6b7280] text-xs font-medium">
              <div className="flex-1 h-px bg-[#e5e7eb]" />
              <span className="px-4">or</span>
              <div className="flex-1 h-px bg-[#e5e7eb]" />
            </div>
            <button
              type="button"
              onClick={onBiometricLogin}
              disabled={isLoading}
              className="w-full py-3.5 px-6 bg-white border-2 border-[#e5e7eb] text-[#1a1a2e] rounded-xl text-base font-bold cursor-pointer transition-all duration-300 hover:border-[#25D366] hover:bg-[#f0fdf4] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <i className={`${getBiometricIcon()} text-[#25D366] text-lg`}></i>
              <span>{getBiometricLabel()}</span>
            </button>
          </>
        )}
      </form>
    </>
  );
}
