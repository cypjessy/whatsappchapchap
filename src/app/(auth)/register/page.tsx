"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { tenantService } from "@/lib/db";
import WhatsAppConnect from "@/components/WhatsAppConnect";
import RegisterSidebar from "@/components/auth/RegisterSidebar";
import { Step1Account, Step2Business, Step3Plan, SuccessStep } from "@/components/auth/steps";

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedBusinessType, setSelectedBusinessType] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("professional");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    businessName: "",
    category: "",
    country: "KE",
    currency: "KES (Kenyan Shilling)",
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [yearlyBilling, setYearlyBilling] = useState(false);
  const [instanceName, setInstanceName] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();
  const { signUp, user } = useAuth();

  const currencyMap: Record<string, string> = {
    KE: "KES (Kenyan Shilling)",
    NG: "NGN (Nigerian Naira)",
    ZA: "ZAR (South African Rand)",
    GH: "GHS (Ghanaian Cedi)",
    TZ: "TZS (Tanzanian Shilling)",
    UG: "UGX (Ugandan Shilling)",
    other: "USD (US Dollar)",
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (id === "country") {
      setFormData((prev) => ({ ...prev, currency: currencyMap[value] || "USD (US Dollar)" }));
    }
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      const { firstName, lastName, email, phone, password } = formData;
      if (!firstName || !lastName || !email || !phone || !password || !termsAccepted) {
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return false;
      if (phone.length < 10) return false;
    }
    if (step === 2) {
      if (!selectedBusinessType || !formData.businessName) return false;
    }
    return true;
  };

  const nextStep = (step: number) => {
    if (!validateStep(currentStep)) return;
    setCurrentStep(step);
  };

  const handleBack = () => {
    if (currentStep > 1 && currentStep < 4) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length > 6) strength++;
    if (password.length > 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getStrengthClass = (strength: number) => {
    if (strength < 3) return { class: "weak", text: "Weak password", color: "text-[#B3261E]" };
    if (strength < 5) return { class: "medium", text: "Medium strength", color: "text-[#F9A03F]" };
    return { class: "strong", text: "Strong password", color: "text-[#25D366]" };
  };

  const handleCreateAccount = async () => {
    setIsLoading(true);
    setError("");

    try {
      const credential = await signUp(formData.email, formData.password);
      const fbUser = credential.user;
      if (!fbUser) {
        throw new Error("Unable to create user account");
      }

      const tenantId = `tenant_${fbUser.uid}`;
      setInstanceName(tenantId);
      await tenantService.createTenant(fbUser, formData.businessName);
      await tenantService.updateTenant(fbUser, {
        whatsappInstanceId: tenantId,
        whatsappConnectionStatus: "pending",
      });

      setCurrentStep(4);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to create account");
      setIsLoading(false);
    }
  };

  const handleWhatsAppConnected = async (data?: { instanceId: string; evolutionUrl: string; evolutionKey: string; evolutionUUID?: string }) => {
    if (!user || !instanceName) return;

    setIsConnected(true);

    const tenantId = `tenant_${user.uid}`;
    const { doc, setDoc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");

    const tenantUpdate = {
      evolutionServerUrl: data?.evolutionUrl || "http://evo-xi7da27bck86s6jwe25w0zt4.173.249.50.98.sslip.io",
      evolutionInstanceId: data?.instanceId || instanceName,
      evolutionApiUrl: data?.evolutionUrl || "http://evo-xi7da27bck86s6jwe25w0zt4.173.249.50.98.sslip.io",
      evolutionApiKey: data?.evolutionKey || "",
      evolutionUUID: data?.evolutionUUID || "",
      whatsappInstanceId: data?.instanceId || instanceName,
      whatsappConnectionStatus: "connected",
    };

    await setDoc(doc(db, "tenants", tenantId), tenantUpdate, { merge: true });

    setCurrentStep(5);
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthInfo = getStrengthClass(passwordStrength);

  const isStepNavVisible = currentStep >= 1 && currentStep <= 3;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Account
            formData={formData}
            termsAccepted={termsAccepted}
            passwordStrength={passwordStrength}
            strengthInfo={strengthInfo}
            onChange={handleInputChange}
            onTermsChange={setTermsAccepted}
          />
        );
      case 2:
        return (
          <Step2Business
            formData={formData}
            selectedBusinessType={selectedBusinessType}
            onChange={handleInputChange}
            onTypeSelect={setSelectedBusinessType}
          />
        );
      case 3:
        return (
          <Step3Plan
            selectedPlan={selectedPlan}
            yearlyBilling={yearlyBilling}
            onPlanSelect={setSelectedPlan}
            onBillingToggle={() => setYearlyBilling(!yearlyBilling)}
          />
        );
      case 4:
        return (
          <div className="flex flex-col gap-6 px-1 animate-[fadeIn_0.35s_ease]">
            <div className="text-center mb-4">
              <h1 className="text-[1.75rem] font-normal tracking-tight text-[#1C1B1F]">
                Connect WhatsApp
              </h1>
              <p className="text-base text-[#49454F] mt-1.5 leading-relaxed">
                Scan the QR code below to connect your WhatsApp Business number
              </p>
            </div>

            {error && (
              <div className="p-4 bg-[#F9DEDC] border border-[#B3261E]/20 rounded-2xl text-sm text-[#B3261E]">
                {error}
              </div>
            )}

            {instanceName ? (
              <div className="bg-white rounded-2xl border border-[#CAC4D0] shadow-sm overflow-hidden">
                <WhatsAppConnect
                  instanceName={instanceName}
                  onConnected={handleWhatsAppConnected}
                  autoStart={false}
                />
              </div>
            ) : (
              <div className="p-8 bg-[#F5F5F5] rounded-2xl border border-[#CAC4D0] text-center">
                <p className="text-[#49454F]">Initializing your account. Please wait...</p>
              </div>
            )}
          </div>
        );
      case 5:
        return <SuccessStep />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FFFBFF] relative overflow-hidden">
      {/* Desktop: Full-height split layout */}
      <div className="hidden md:grid md:grid-cols-5 min-h-screen">
        {/* Sidebar - col-span-2 */}
        <RegisterSidebar currentStep={currentStep} />

        {/* Content - col-span-3 */}
        <div className="col-span-3 flex flex-col bg-[#FFFBFF]">
          {/* M3 Top App Bar */}
          <div className="flex items-center justify-between px-8 py-4 border-b border-[#E7E0EC]">
            <h2 className="text-lg font-medium text-[#1C1B1F]">
              {currentStep === 1 && "Create Account"}
              {currentStep === 2 && "Business Information"}
              {currentStep === 3 && "Choose Plan"}
              {currentStep === 4 && "Connect WhatsApp"}
              {currentStep === 5 && "Welcome"}
            </h2>
            <Link
              href="/"
              className="text-sm font-medium text-[#49454F] hover:text-[#25D366] transition-colors"
            >
              Back to Home
            </Link>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-8 py-8">
            <div className="max-w-[560px] mx-auto">
              {renderStepContent()}

              {/* Navigation buttons for steps 1-3 */}
              {isStepNavVisible && (
                <div className="flex items-center justify-between mt-10 pt-8 border-t border-[#E7E0EC]">
                  {currentStep > 1 ? (
                    <button
                      onClick={handleBack}
                      className="flex items-center justify-center gap-2 h-12 px-6 rounded-2xl border-2 border-[#79747E] text-sm font-medium text-[#1C1B1F] hover:bg-[#F5F5F5] active:scale-[0.98] transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                      </svg>
                      Back
                    </button>
                  ) : (
                    <div />
                  )}
                  {currentStep === 3 ? (
                    <button
                      onClick={handleCreateAccount}
                      disabled={isLoading || !validateStep(currentStep)}
                      className="flex items-center justify-center gap-2 h-12 px-8 rounded-2xl bg-[#25D366] text-sm font-medium text-white shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 transition-all"
                    >
                      {isLoading ? (
                        <>
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          Create Account
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => nextStep(currentStep + 1)}
                      disabled={!validateStep(currentStep)}
                      className="flex items-center justify-center gap-2 h-12 px-8 rounded-2xl bg-[#25D366] text-sm font-medium text-white shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 transition-all"
                    >
                      Continue
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== MOBILE VIEW ===== */}
      <div className="md:hidden min-h-screen flex flex-col bg-[#FFFBFF]">
        {/* M3 Top App Bar */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-[#E7E0EC] bg-[#FFFBFF]">
          <button
            onClick={() => {
              if (currentStep > 1 && currentStep <= 3) {
                handleBack();
              } else {
                router.push("/");
              }
            }}
            className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-[#F5F5F5] active:bg-[#E8E8E8] transition-colors"
          >
            <svg className="w-6 h-6 text-[#1C1B1F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-base font-medium text-[#1C1B1F]">
            {currentStep === 1 && "Create Account"}
            {currentStep === 2 && "Business Info"}
            {currentStep === 3 && "Choose Plan"}
            {currentStep === 4 && "Connect WhatsApp"}
            {currentStep === 5 && "Welcome"}
          </h1>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>

        {/* M3 Progress Dots */}
        {currentStep <= 3 && (
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                    step <= currentStep ? "bg-[#25D366]" : "bg-[#E7E0EC]"
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 px-0.5">
              <span className={`text-xs font-medium ${currentStep === 1 ? "text-[#25D366]" : "text-[#49454F]"}`}>
                Account
              </span>
              <span className={`text-xs font-medium ${currentStep === 2 ? "text-[#25D366]" : "text-[#49454F]"}`}>
                Business
              </span>
              <span className={`text-xs font-medium ${currentStep === 3 ? "text-[#25D366]" : "text-[#49454F]"}`}>
                Plan
              </span>
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-md mx-auto">
            {renderStepContent()}

            {/* Show error if any */}
            {error && currentStep > 3 && (
              <div className="mt-4 p-4 bg-[#F9DEDC] border border-[#B3261E]/20 rounded-2xl text-sm text-[#B3261E]">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Bottom Button Bar - M3 */}
        {isStepNavVisible && (
          <div className="px-4 py-3 border-t border-[#E7E0EC] bg-[#FFFBFF]">
            <div className="flex items-center gap-3 max-w-md mx-auto">
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  className="flex items-center justify-center gap-2 h-12 px-5 rounded-2xl border-2 border-[#79747E] text-sm font-medium text-[#1C1B1F] hover:bg-[#F5F5F5] active:scale-[0.98] transition-all flex-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                  Back
                </button>
              )}
              {currentStep === 3 ? (
                <button
                  onClick={handleCreateAccount}
                  disabled={isLoading || !validateStep(currentStep)}
                  className="flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-[#25D366] text-sm font-medium text-white shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 transition-all flex-1"
                >
                  {isLoading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Account
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => nextStep(currentStep + 1)}
                  disabled={!validateStep(currentStep)}
                  className="flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-[#25D366] text-sm font-medium text-white shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 transition-all flex-1"
                >
                  Continue
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
