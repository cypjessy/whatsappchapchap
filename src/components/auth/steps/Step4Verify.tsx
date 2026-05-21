interface Step4Props {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    businessName: string;
    country: string;
    currency: string;
  };
  selectedPlan: string;
  yearlyBilling: boolean;
  resendTimer: number;
  isLoading: boolean;
  error: string;
  onResendCode: () => void;
  onComplete: () => void;
}

export default function Step4Verify({
  formData,
  selectedPlan,
  yearlyBilling,
  resendTimer,
  isLoading,
  error,
  onResendCode,
  onComplete,
}: Step4Props) {
  const getPlanName = (id: string) => {
    const plans: Record<string, string> = {
      free: "Free",
      starter: "Starter",
      professional: "Professional",
    };
    return plans[id] || id;
  };

  return (
    <div className="animate-[fadeIn_0.4s_ease]">
      <h3 className="text-xl md:text-2xl font-extrabold mb-1 md:mb-2">Verify & Launch</h3>
      <p className="text-on-surface-variant mb-4 md:mb-6 text-sm md:text-base">Confirm your details to get started</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl p-4 md:p-6 mb-4 md:mb-6 border border-outline-variant shadow-md3-level1">
        <h4 className="font-bold mb-3 md:mb-4 text-sm md:text-base">Account Summary</h4>
        <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Name</span>
            <span className="font-semibold">{formData.firstName} {formData.lastName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Email</span>
            <span className="font-semibold">{formData.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Business</span>
            <span className="font-semibold">{formData.businessName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Location</span>
            <span className="font-semibold">{formData.country} · {formData.currency}</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-outline-variant">
            <span className="text-on-surface-variant">Plan</span>
            <span className="font-bold text-[#25D366]">{getPlanName(selectedPlan)} {yearlyBilling && "(Yearly)"}</span>
          </div>
        </div>
      </div>

      <div className="mb-4 md:mb-6">
        <label className="block text-xs md:text-sm font-semibold mb-1.5 md:mb-2">Verification Code</label>
        <div className="flex gap-2">
          <input
            type="text"
            maxLength={6}
            className="flex-1 px-3 md:px-4 py-3 md:py-3.5 border-2 border-outline-variant rounded-xl 
              focus:border-[#25D366] focus:outline-none text-center text-xl md:text-2xl tracking-widest
              transition-all duration-300 hover:border-[#c4b5fd] hover:shadow-md3-level1
              bg-[#fafafa] focus:bg-white focus:shadow-[0_0_0_4px_rgba(37,211,102,0.1)]"
            placeholder="000000"
          />
        </div>
        <p className="text-xs text-on-surface-variant mt-2">
          We sent a verification code to {formData.email}
          {resendTimer > 0 ? (
            <span className="text-on-surface-variant"> · Resend in {resendTimer}s</span>
          ) : (
            <button onClick={onResendCode} className="text-[#25D366] font-semibold ml-1 hover:text-[#128C7E] transition-colors">
              Resend code
            </button>
          )}
        </p>
      </div>

      <div className="flex justify-between gap-3 mt-auto pt-4 md:pt-6">
        <button className="py-2.5 md:py-3.5 px-3 md:px-6 bg-white text-[#1a1a2e] border-2 border-outline-variant 
          rounded-xl font-semibold transition-all duration-300 
          hover:border-[#25D366] hover:text-[#25D366] hover:shadow-md3-level2
          active:translate-y-0 active:shadow-none active:scale-[0.98]
          flex items-center gap-2 text-xs md:text-base">
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
          <span className="hidden sm:inline">Back</span>
        </button>
        <button
          onClick={onComplete}
          disabled={isLoading}
          className="py-2.5 md:py-3.5 px-4 md:px-8 bg-gradient-to-r from-[#25D366] to-[#128C7E] 
            text-white rounded-xl font-bold transition-all duration-300 
            hover:translate-y-[-2px] hover:shadow-md3-level3 
            active:translate-y-0 active:shadow-md3-level2 active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
            flex items-center gap-2 text-xs md:text-base"
        >
          {isLoading ? (
            <>
              <span className="inline-block w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span className="hidden sm:inline">Creating...</span>
            </>
          ) : (
            <>
              <span className="hidden sm:inline">Complete Setup</span>
              <span className="sm:hidden">Complete</span>
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
