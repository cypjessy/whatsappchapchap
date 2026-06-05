"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { tenantService } from "@/lib/db";
import WhatsAppConnect from "@/components/WhatsAppConnect";
import { Step1Account, Step2Business } from "@/components/auth/steps";
import RegisterSidebar from "@/components/auth/RegisterSidebar";

interface AddTenantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTenantDialog({ isOpen, onClose, onSuccess }: AddTenantDialogProps) {
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
  const [termsAccepted, setTermsAccepted] = useState(true); // Auto-accept for admin-created accounts
  const [instanceName, setInstanceName] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<any>(null);

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
      if (!firstName || !lastName || !email || !phone || !password) {
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

    try {
      // Create user with Firebase Auth
      const credential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = credential.user;
      if (!user) {
        throw new Error("Unable to create user account");
      }

      const tenantId = `tenant_${user.uid}`;
      setInstanceName(tenantId);
      setCreatedUser(user);

      setCurrentStep(2);
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

  const handleSaveBusiness = async () => {
    if (!createdUser) return;

    try {
      const tenantId = `tenant_${createdUser.uid}`;
      await tenantService.createTenant(createdUser, formData.businessName);
      await tenantService.updateTenant(createdUser, {
        businessName: formData.businessName,
        businessType: selectedBusinessType,
        category: formData.category,
        country: formData.country,
        currency: formData.currency,
        status: "active",
      });
      setCurrentStep(3);
    } catch (err: any) {
      setError(err.message || "Failed to save business info");
    }
  };

  const handleWhatsAppConnected = async (data?: { instanceId: string; evolutionUrl: string; evolutionKey: string; evolutionUUID?: string }) => {
    if (!createdUser || !instanceName) return;

    const tenantId = `tenant_${createdUser.uid}`;
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

    // Go to success step
    setCurrentStep(4);
  };

  const handleClose = () => {
    // Reset state
    setCurrentStep(1);
    setSelectedBusinessType("");
    setIsLoading(false);
    setError("");
    setFormData({
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
    setInstanceName(null);
    setCreatedUser(null);
    onClose();
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthInfo = getStrengthClass(passwordStrength);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => {
      if (e.target === e.currentTarget) handleClose();
    }}>
      <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#25D366] to-[#128C7E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <i className="fab fa-whatsapp text-xl text-[#25D366]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Add New Tenant</h2>
              <p className="text-xs text-white/80">Step {currentStep} of 4</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar */}
          <div className="hidden md:flex w-64 shrink-0 bg-gray-50 border-r border-gray-200">
            <RegisterSidebar currentStep={currentStep} />
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                <i className="fas fa-exclamation-circle shrink-0" />
                {error}
              </div>
            )}

            {/* Step 1: Account */}
            {currentStep === 1 && (
              <div className="animate-[fadeIn_0.4s_ease]">
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

            {/* Step 2: Business */}
            {currentStep === 2 && (
              <Step2Business
                formData={formData}
                selectedBusinessType={selectedBusinessType}
                onChange={handleInputChange}
                onTypeSelect={setSelectedBusinessType}
              />
            )}

            {/* Step 3: WhatsApp */}
            {currentStep === 3 && (
              <div className="animate-[fadeIn_0.4s_ease] flex flex-col">
                <div className="text-center mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
                    <i className="fab fa-whatsapp text-2xl text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Connect WhatsApp</h3>
                  <p className="text-xs text-gray-500">Link their number to start selling</p>
                </div>

                <div className="flex items-center gap-2.5 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center shrink-0 shadow-sm">
                    <i className="fas fa-check text-white text-xs" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-green-800">Almost done!</p>
                    <p className="text-[10px] text-green-600 leading-tight">Connect WhatsApp for orders & chat</p>
                  </div>
                </div>

                {instanceName ? (
                  <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 p-3 overflow-y-auto">
                    <WhatsAppConnect
                      instanceName={instanceName}
                      onConnected={handleWhatsAppConnected}
                      autoStart={false}
                      showModeSelector={true}
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
                    <div className="w-10 h-10 border-3 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Initializing...</p>
                  </div>
                )}

                <div className="text-center pt-3">
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="text-[11px] text-gray-500 hover:text-[#25D366] transition-colors underline underline-offset-2"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Success */}
            {currentStep === 4 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <i className="fas fa-check text-3xl text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Tenant Created!</h3>
                <p className="text-gray-600 mb-6 max-w-sm">
                  <strong>{formData.businessName}</strong> has been successfully added to the platform.
                </p>
                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left w-full max-w-sm">
                  <div className="text-sm mb-2">
                    <span className="text-gray-500">Email:</span>{" "}
                    <span className="font-medium">{formData.email}</span>
                  </div>
                  <div className="text-sm mb-2">
                    <span className="text-gray-500">Password:</span>{" "}
                    <span className="font-medium">{formData.password}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Business:</span>{" "}
                    <span className="font-medium">{formData.businessName}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onSuccess();
                    handleClose();
                  }}
                  className="py-3 px-8 bg-[#25D366] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        {currentStep < 4 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-arrow-left text-sm" />
              Back
            </button>

            {currentStep === 1 && (
              <button
                onClick={verifyAndComplete}
                disabled={!validateStep(currentStep) || isLoading}
                className="py-2.5 px-6 bg-[#25D366] text-white rounded-lg font-semibold hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    Create Account
                    <i className="fas fa-arrow-right" />
                  </>
                )}
              </button>
            )}

            {currentStep === 2 && (
              <button
                onClick={handleSaveBusiness}
                disabled={!validateStep(currentStep) || isLoading}
                className="py-2.5 px-6 bg-[#25D366] text-white rounded-lg font-semibold hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
              >
                Continue
                <i className="fas fa-arrow-right" />
              </button>
            )}

            {currentStep === 3 && (
              <button
                onClick={() => setCurrentStep(4)}
                className="py-2.5 px-6 bg-gray-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Skip & Finish
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
