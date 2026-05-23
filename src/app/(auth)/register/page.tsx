"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useHaptics } from "@/hooks/useNativeAndroid";
import { useStatusBar } from "@/hooks/useStatusBar";
import { useAppLifecycle } from "@/hooks/useAppLifecycle";
import { tenantService } from "@/lib/db";
import WhatsAppConnect from "@/components/WhatsAppConnect";
import FloatingShapes from "@/components/auth/FloatingShapes";
import RegisterSidebar from "@/components/auth/RegisterSidebar";
import { Step1Account, Step2Business, SuccessStep } from "@/components/auth/steps";

export default function RegisterPage() {
  // Initialize Capacitor lifecycle management to prevent idle freeze
  useAppLifecycle();
  
  // Set status bar to white with dark icons
  useStatusBar({ color: '#ffffff', style: 'dark' });
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedBusinessType, setSelectedBusinessType] = useState("");
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
  const [instanceName, setInstanceName] = useState<string | null>(null);
  const { signUp, user } = useAuth();
  const { impactLight, notificationSuccess } = useHaptics();

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

    const verifyAndComplete = async () => {
    setIsLoading(true);
    setError("");
    
    // Fire haptic feedback without blocking
    impactLight().catch(() => {});
    
    try {
      const credential = await signUp(formData.email, formData.password);
      const user = credential.user;
      if (!user) {
        throw new Error("Unable to create user account");
      }

      const tenantId = `tenant_${user.uid}`;
      setInstanceName(tenantId);

      // Fire success haptic without blocking
      notificationSuccess().catch(() => {});
      setCurrentStep(2);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to create account");
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    // Fire haptic feedback without blocking
    impactLight().catch(() => {});
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveBusiness = async () => {
    if (!user) return;
    impactLight().catch(() => {});
    
    try {
      const tenantId = `tenant_${user.uid}`;
      await tenantService.createTenant(user, formData.businessName);
      await tenantService.updateTenant(user, {
        businessName: formData.businessName,
        businessType: selectedBusinessType,
        category: formData.category,
        country: formData.country,
        currency: formData.currency,
      });
      setCurrentStep(3);
    } catch (err: any) {
      setError(err.message || "Failed to save business info");
    }
  };

  const handleWhatsAppConnected = async (data?: { instanceId: string; evolutionUrl: string; evolutionKey: string; evolutionUUID?: string }) => {
    if (!user || !instanceName) return;

    await notificationSuccess();
    
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
      evolutionServerUrl: data?.evolutionUrl || "http://evo-xi7da27bck86s6jwe25w0zt4.173.249.50.98.sslip.io",
      evolutionInstanceId: data?.instanceId || instanceName,
      evolutionApiUrl: data?.evolutionUrl || "http://evo-xi7da27bck86s6jwe25w0zt4.173.249.50.98.sslip.io",
      evolutionApiKey: data?.evolutionKey || "",
      evolutionUUID: data?.evolutionUUID || "",
      whatsappInstanceId: data?.instanceId || instanceName,
      whatsappConnectionStatus: "connected",
    };
    
    console.log('[Register] Firestore update payload:', tenantUpdate);
    
    await setDoc(doc(db, "tenants", tenantId), tenantUpdate, { merge: true });
    
    console.log('[Register] Tenant saved successfully with evolutionApiKey:', tenantUpdate.evolutionApiKey);
    
    // Go to success step
    setCurrentStep(4);
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthInfo = getStrengthClass(passwordStrength);

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#667eea]/15 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#764ba2]/15 to-transparent" />
      </div>

      {/* Floating shapes for visual interest */}
      <FloatingShapes />

      {/* Main content container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="w-full min-h-screen md:min-h-0 md:h-[calc(100vh-2rem)] md:max-w-5xl bg-white md:rounded-2xl md:shadow-xl overflow-hidden flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex relative w-72 shrink-0">
          <RegisterSidebar currentStep={currentStep} />
          <div className="absolute bottom-6 left-6 right-6">
            <Link href="/" className="text-white/70 hover:text-white transition-colors inline-flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>

        {/* Mobile Progress Bar - MD3 */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-20 px-4 pt-4 pb-3 bg-white/95 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                  step <= currentStep ? "bg-gradient-to-r from-[#25D366] to-[#128C7E]" : "bg-surface-variant"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-on-surface-variant font-medium">
            <span>Account</span>
            <span>Business</span>
            <span>WhatsApp</span>
            <span>Done</span>
          </div>
        </div>

        {/* Back Link - Mobile */}
        <div className="lg:hidden fixed top-12 left-4 z-20">
          <Link href="/" className="text-on-surface-variant hover:text-[#25D366] transition-colors inline-flex items-center gap-1.5 text-xs">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Link>
        </div>

        {/* Content Area */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 pt-16 pb-6 lg:pt-6 lg:pb-8 flex flex-col overflow-y-auto">
          {/* Mobile Back Button */}
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="lg:hidden flex items-center gap-2 text-on-surface-variant mb-3 hover:text-[#25D366] transition-colors active:scale-95"
            >
              <i className="fas fa-arrow-left text-sm"></i>
              <span className="text-sm">Back</span>
            </button>
          )}

          {currentStep === 1 && (
            <div>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                  <i className="fas fa-exclamation-circle shrink-0" />
                  {error}
                </div>
              )}
              <Step1Account
                formData={formData}
                termsAccepted={termsAccepted}
                passwordStrength={passwordStrength}
                strengthInfo={strengthInfo}
                onChange={handleInputChange}
                onTermsChange={setTermsAccepted}
              />
            </div>
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
            <div className="animate-[fadeIn_0.4s_ease] flex-1 flex flex-col">
              {/* MD3 Header */}
              <div className="text-center mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md3-level1">
                  <i className="fab fa-whatsapp text-2xl text-white" />
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-1">Connect WhatsApp</h3>
                <p className="text-xs text-on-surface-variant">Link your number to start selling</p>
              </div>

              {/* Info Banner */}
              <div className="flex items-center gap-2.5 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg mb-4">
                <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center shrink-0 shadow-sm">
                  <i className="fas fa-check text-white text-xs" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-green-800">Almost done!</p>
                  <p className="text-[10px] text-green-600 leading-tight">Connect WhatsApp for orders & chat</p>
                </div>
              </div>

              {/* Connection Section */}
              {instanceName ? (
                <div className="flex-1 bg-surface-variant/50 rounded-xl border border-outline-variant p-3 overflow-y-auto">
                  <WhatsAppConnect
                    instanceName={instanceName}
                    onConnected={handleWhatsAppConnected}
                    autoStart={false}
                    showModeSelector={true}
                  />
                </div>
              ) : (
                <div className="p-4 bg-surface-variant/50 rounded-xl border border-outline-variant text-center">
                  <div className="w-10 h-10 border-3 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-on-surface-variant">Initializing...</p>
                </div>
              )}

              {/* Skip Link */}
              <div className="text-center pt-3">
                <button
                  onClick={() => setCurrentStep(4)}
                  className="text-[11px] text-on-surface-variant hover:text-[#25D366] transition-colors underline underline-offset-2"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {currentStep === 4 && <SuccessStep />}

          {/* Navigation buttons */}
          {currentStep === 1 && (
            <div className="flex justify-end mt-auto pt-4 gap-2">
              <button
                onClick={verifyAndComplete}
                disabled={!validateStep(currentStep) || isLoading}
                className="py-2.5 px-5 bg-[#25D366] text-white rounded-lg font-semibold transition-all 
                  hover:shadow-md3-level2 active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center gap-2 text-sm shadow-md3-level1"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    Create Account
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </>
                )}
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex justify-between mt-auto pt-4 gap-3">
              <button
                onClick={handleBack}
                className="py-2.5 px-4 bg-surface-variant text-on-surface rounded-lg font-semibold transition-all 
                  hover:bg-surface-container-high active:scale-[0.98]
                  flex items-center gap-2 text-sm border border-outline-variant"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
                <span className="hidden sm:inline">Back</span>
              </button>
              <button
                onClick={handleSaveBusiness}
                disabled={!validateStep(currentStep) || isLoading}
                className="py-2.5 px-5 bg-[#25D366] text-white rounded-lg font-semibold transition-all 
                  hover:shadow-md3-level2 active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center gap-2 text-sm shadow-md3-level1"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    Continue
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
