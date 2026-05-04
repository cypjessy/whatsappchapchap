"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { tenantService } from "@/lib/db";
import WhatsAppConnect from "@/components/WhatsAppConnect";
import FloatingShapes from "@/components/auth/FloatingShapes";
import RegisterSidebar from "@/components/auth/RegisterSidebar";
import { Step1Account, Step2Business, Step3Plan, Step4Verify, SuccessStep } from "@/components/auth/steps";

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedBusinessType, setSelectedBusinessType] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("professional");
  const [resendTimer, setResendTimer] = useState(30);
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

  const prevStep = (step: number) => {
    setCurrentStep(step);
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
    if (strength < 3) return { class: "weak", text: "Weak password", color: "text-red-500" };
    if (strength < 5) return { class: "medium", text: "Medium strength", color: "text-yellow-500" };
    return { class: "strong", text: "Strong password", color: "text-green-500" };
  };

  const resendCode = () => {
    setResendTimer(30);
  };

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const verifyAndComplete = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const credential = await signUp(formData.email, formData.password);
      const user = credential.user;
      if (!user) {
        throw new Error("Unable to create user account");
      }

      const tenantId = `tenant_${user.uid}`;
      setInstanceName(tenantId);
      await tenantService.createTenant(user, formData.businessName);
      await tenantService.updateTenant(user, {
        whatsappInstanceId: tenantId,
        whatsappConnectionStatus: "pending",
      });

      setCurrentStep(5);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to create account");
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleWhatsAppConnected = async (data?: { instanceId: string; evolutionUrl: string; evolutionKey: string; evolutionUUID?: string }) => {
    if (!user || !instanceName) return;

    setIsConnected(true);
    
    const tenantId = `tenant_${user.uid}`;
    const { doc, setDoc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");
    
    console.log('[Register] Saving tenant Evolution data:', {
      tenantId,
      evolutionKey: data?.evolutionKey,
      evolutionUUID: data?.evolutionUUID,
      instanceId: data?.instanceId,
    });
    
    const tenantUpdate = {
      evolutionServerUrl: data?.evolutionUrl || "https://evo-xi7da27bck86s6jwe25w0zt4.173.249.50.98.sslip.io",
      evolutionInstanceId: data?.instanceId || instanceName,
      evolutionApiUrl: data?.evolutionUrl || "https://evo-xi7da27bck86s6jwe25w0zt4.173.249.50.98.sslip.io",
      evolutionApiKey: data?.evolutionKey || "",
      evolutionUUID: data?.evolutionUUID || "",
      whatsappInstanceId: data?.instanceId || instanceName,
      whatsappConnectionStatus: "connected",
    };
    
    console.log('[Register] Firestore update payload:', tenantUpdate);
    
    await setDoc(doc(db, "tenants", tenantId), tenantUpdate, { merge: true });
    
    console.log('[Register] Tenant saved successfully with evolutionApiKey:', tenantUpdate.evolutionApiKey);
    
    router.push("/dashboard");
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthInfo = getStrengthClass(passwordStrength);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#667eea] to-[#764ba2] relative overflow-hidden">
      <FloatingShapes />

      {/* Mobile: Full width card, Desktop: Split layout */}
      <div className="w-full md:max-w-[1200px] m-auto grid grid-cols-1 md:grid-cols-5 bg-white md:rounded-2xl shadow-2xl overflow-hidden relative z-10 min-h-[700px]">
        {/* Desktop Sidebar only */}
        <div className="hidden md:block">
          <RegisterSidebar currentStep={currentStep} />
        </div>

        {/* Mobile Progress Bar */}
        <div className="md:hidden px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`w-8 h-1 rounded-full transition-colors ${
                  step <= currentStep ? "bg-[#25D366]" : "bg-[#e2e8f0]"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-[#64748b]">
            <span>Account</span>
            <span>Business</span>
            <span>Plan</span>
            <span>Verify</span>
            <span>Done</span>
          </div>
        </div>

        {/* Content - Mobile full width, Desktop col-span-3 */}
        <div className="md:col-span-3 px-4 md:px-12 py-4 md:py-8 flex flex-col">
          {/* Mobile Back Button */}
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="md:hidden flex items-center gap-2 text-[#64748b] mb-4"
            >
              <i className="fas fa-arrow-left"></i>
              <span>Back</span>
            </button>
          )}

          {currentStep === 1 && (
            <Step1Account
              formData={formData}
              termsAccepted={termsAccepted}
              passwordStrength={passwordStrength}
              strengthInfo={strengthInfo}
              onChange={handleInputChange}
              onTermsChange={setTermsAccepted}
            />
          )}

          {currentStep === 2 && (
            <Step2Business
              formData={formData}
              selectedBusinessType={selectedBusinessType}
              onChange={handleInputChange}
              onTypeSelect={setSelectedBusinessType}
            />
          )}

          {currentStep === 3 && (
            <Step3Plan
              selectedPlan={selectedPlan}
              yearlyBilling={yearlyBilling}
              onPlanSelect={setSelectedPlan}
              onBillingToggle={() => setYearlyBilling(!yearlyBilling)}
            />
          )}

          {currentStep === 4 && (
            <Step4Verify
              formData={formData}
              selectedPlan={selectedPlan}
              yearlyBilling={yearlyBilling}
              resendTimer={resendTimer}
              isLoading={isLoading}
              error={error}
              onResendCode={resendCode}
              onComplete={verifyAndComplete}
            />
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold">Connect your WhatsApp Business</h2>
                <p className="text-[#64748b] mt-3">
                  Scan the QR code below to create your Evolution app instance and connect your WhatsApp number.
                </p>
              </div>

              {instanceName ? (
                <WhatsAppConnect
                  instanceName={instanceName}
                  onConnected={handleWhatsAppConnected}
                  autoStart={false}
                />
              ) : (
                <div className="p-6 bg-[#f8fafc] rounded-3xl border border-[#e2e8f0] text-center">
                  <p className="text-[#64748b]">Waiting for your account to initialize. Please try again if this message persists.</p>
                </div>
              )}
            </div>
          )}

          {currentStep === 6 && <SuccessStep />}

          {currentStep < 4 && (
            <div className="flex justify-between mt-auto pt-8">
              {currentStep > 1 ? (
                <button
                  onClick={handleBack}
                  className="py-3.5 px-6 bg-[#f8fafc] text-[#1a1a2e] border-2 border-[#e2e8f0] rounded-xl font-semibold hover:border-[#25D366] hover:text-[#25D366] transition-all flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
                  Back
                </button>
              ) : (
                <div></div>
              )}
              <button
                onClick={() => nextStep(currentStep + 1)}
                disabled={!validateStep(currentStep)}
                className="py-3.5 px-8 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-bold transition-all hover:translate-y-[-2px] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Continue <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
