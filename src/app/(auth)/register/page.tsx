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
      {/* Background decoration - top and bottom only */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#667eea]/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#764ba2]/20 to-transparent" />
      </div>
      
      {/* Floating shapes for visual interest */}
      <FloatingShapes />

      {/* Main content container - full screen, centered */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-5 bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Desktop Sidebar only */}
        <div className="hidden md:block relative">
          <RegisterSidebar currentStep={currentStep} />
          
          {/* Back to Home Link - Desktop */}
          <div className="absolute bottom-6 left-6 right-6">
            <Link
              href="/"
              className="text-white/70 hover:text-white transition-colors inline-flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>

        {/* Mobile Progress Bar - Material Design 3 */}
        <div className="md:hidden px-4 pt-4 pb-3">
          <div className="flex items-center gap-2 mb-3">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  step <= currentStep ? "bg-gradient-to-r from-[#25D366] to-[#128C7E]" : "bg-surface-variant"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-on-surface-variant font-medium">
            <span>Account</span>
            <span>Business</span>
            <span>WhatsApp</span>
            <span>Done</span>
          </div>
        </div>
        
        {/* Back to Home Link - Mobile */}
        <div className="md:hidden px-4 pb-2">
          <Link
            href="/"
            className="text-on-surface-variant hover:text-[#25D366] transition-colors inline-flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Content - Full width on mobile, col-span-3 on desktop */}
        <div className="md:col-span-3 px-4 sm:px-6 md:px-12 py-6 md:py-8 flex flex-col max-h-[calc(100vh-4rem)] md:max-h-none overflow-y-auto">
          {/* Mobile Back Button - Material Design 3 */}
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="md:hidden flex items-center gap-2 text-on-surface-variant mb-4 
                hover:text-[#25D366] transition-colors duration-300 
                active:scale-95 px-3 py-2 rounded-lg hover:bg-surface-container-lowest"
            >
              <i className="fas fa-arrow-left"></i>
              <span>Back</span>
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
            <div className="animate-[fadeIn_0.4s_ease] space-y-4">
              <h3 className="text-xl md:text-2xl font-extrabold mb-1 md:mb-2">Connect WhatsApp</h3>
              <p className="text-on-surface-variant mb-2 text-sm md:text-base">Link your WhatsApp number to start selling</p>

              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                  <i className="fab fa-whatsapp text-white text-sm" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-800">Almost there!</p>
                  <p className="text-xs text-green-600">Connect your WhatsApp to receive orders and chat with customers</p>
                </div>
              </div>

              {instanceName ? (
                <WhatsAppConnect
                  instanceName={instanceName}
                  onConnected={handleWhatsAppConnected}
                  autoStart={false}
                  showModeSelector={true}
                />
              ) : (
                <div className="p-4 bg-white rounded-xl border border-outline-variant text-center">
                  <p className="text-sm text-on-surface-variant">Initializing your account...</p>
                </div>
              )}

              {/* Skip for now */}
              <div className="text-center pt-2">
                <button
                  onClick={() => setCurrentStep(4)}
                  className="text-xs text-on-surface-variant hover:text-[#25D366] transition-colors underline underline-offset-2"
                >
                  Skip, I'll connect later
                </button>
              </div>
            </div>
          )}

          {currentStep === 4 && <SuccessStep />}

          {/* Navigation buttons - only on step 1 and 2 */}
          {currentStep === 1 && (
            <div className="flex justify-end mt-auto pt-6 md:pt-8 gap-3">
              <button
                onClick={verifyAndComplete}
                disabled={!validateStep(currentStep) || isLoading}
                className="py-3 px-5 md:px-8 bg-gradient-to-r from-[#25D366] to-[#128C7E] 
                  text-white rounded-xl font-bold transition-all duration-300 
                  hover:translate-y-[-2px] hover:shadow-lg 
                  active:translate-y-0 active:shadow-md active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
                  flex items-center gap-2 text-sm md:text-base"
              >
                {isLoading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    Create Account <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </>
                )}
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex justify-between mt-auto pt-6 md:pt-8 gap-3">
              <button
                onClick={handleBack}
                className="py-3 px-4 md:px-6 bg-white text-[#1a1a2e] border-2 border-outline-variant 
                  rounded-xl font-semibold transition-all duration-300 
                  hover:border-[#25D366] hover:text-[#25D366] hover:shadow-md
                  active:translate-y-0 active:shadow-none active:scale-[0.98]
                  flex items-center gap-2 text-sm md:text-base"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
                <span className="hidden sm:inline">Back</span>
              </button>
              <button
                onClick={handleSaveBusiness}
                disabled={!validateStep(currentStep) || isLoading}
                className="py-3 px-5 md:px-8 bg-gradient-to-r from-[#25D366] to-[#128C7E] 
                  text-white rounded-xl font-bold transition-all duration-300 
                  hover:translate-y-[-2px] hover:shadow-lg 
                  active:translate-y-0 active:shadow-md active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
                  flex items-center gap-2 text-sm md:text-base"
              >
                {isLoading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    Continue <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
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
