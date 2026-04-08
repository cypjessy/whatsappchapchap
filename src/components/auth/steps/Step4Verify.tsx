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
      <h3 className="text-2xl font-extrabold mb-2">Verify & Launch</h3>
      <p className="text-[#64748b] mb-6">Confirm your details to get started</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="bg-[#f8fafc] rounded-2xl p-6 mb-6">
        <h4 className="font-bold mb-4">Account Summary</h4>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[#64748b]">Name</span>
            <span className="font-semibold">{formData.firstName} {formData.lastName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748b]">Email</span>
            <span className="font-semibold">{formData.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748b]">Business</span>
            <span className="font-semibold">{formData.businessName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748b]">Location</span>
            <span className="font-semibold">{formData.country} · {formData.currency}</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-[#e2e8f0]">
            <span className="text-[#64748b]">Plan</span>
            <span className="font-bold text-[#25D366]">{getPlanName(selectedPlan)} {yearlyBilling && "(Yearly)"}</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Verification Code</label>
        <div className="flex gap-2">
          <input
            type="text"
            maxLength={6}
            className="flex-1 px-4 py-3 border-2 border-[#e2e8f0] rounded-xl focus:border-[#25D366] focus:outline-none text-center text-2xl tracking-widest"
            placeholder="000000"
          />
        </div>
        <p className="text-xs text-[#64748b] mt-2">
          We sent a verification code to {formData.email}
          {resendTimer > 0 ? (
            <span className="text-[#64748b]"> · Resend in {resendTimer}s</span>
          ) : (
            <button onClick={onResendCode} className="text-[#25D366] font-semibold ml-1">
              Resend code
            </button>
          )}
        </p>
      </div>

      <div className="flex justify-between mt-auto">
        <button className="py-3.5 px-6 bg-[#f8fafc] text-[#1a1a2e] border-2 border-[#e2e8f0] rounded-xl font-semibold hover:border-[#25D366] hover:text-[#25D366] transition-all flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
          Back
        </button>
        <button
          onClick={onComplete}
          disabled={isLoading}
          className="py-3.5 px-8 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-bold transition-all hover:translate-y-[-2px] hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Creating...
            </>
          ) : (
            <>
              Complete Setup <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
