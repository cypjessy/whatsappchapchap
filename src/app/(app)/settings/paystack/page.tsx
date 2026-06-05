"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { buildApiUrl } from "@/lib/api-config";
import PageHeaderCard from "@/components/PageHeaderCard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaystackSettings {
  mode: "test" | "live";
  testPublicKey: string;
  testSecretKey: string;
  livePublicKey: string;
  liveSecretKey: string;
  webhookUrl: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: PaystackSettings = {
  mode: "test",
  testPublicKey: "",
  testSecretKey: "",
  livePublicKey: "",
  liveSecretKey: "",
  webhookUrl: "",
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

function validateKey(key: string, mode: "test" | "live", type: "public" | "secret"): boolean {
  if (!key || key.length < 20) return false;
  const expectedPrefix = mode === "test"
    ? (type === "public" ? "pk_test_" : "sk_test_")
    : (type === "public" ? "pk_live_" : "sk_live_");
  return key.startsWith(expectedPrefix);
}

function getKeyStatus(key: string, mode: "test" | "live", type: "public" | "secret"): {
  valid: boolean;
  message: string;
  color: string;
} {
  if (!key) return { valid: false, message: "Required", color: "text-outline" };
  if (validateKey(key, mode, type)) return { valid: true, message: "Valid format", color: "text-[#10b981]" };
  const expectedPrefix = mode === "test"
    ? (type === "public" ? "pk_test_" : "sk_test_")
    : (type === "public" ? "pk_live_" : "sk_live_");
  return {
    valid: false,
    message: `Should start with ${expectedPrefix}`,
    color: "text-[#ef4444]",
  };
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ModeToggle({ mode, onChange }: { mode: "test" | "live"; onChange: (m: "test" | "live") => void }) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = (newMode: "test" | "live") => {
    if (newMode === mode) return;
    setIsAnimating(true);
    onChange(newMode);
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-1.5 flex gap-1.5 relative shadow-inner">
      {/* Sliding background */}
      <div
        className={`
          absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl transition-all duration-300 ease-out shadow-md
          ${mode === "test" ? "left-1.5 bg-gradient-to-r from-[#3b82f6] to-[#2563eb]" : "left-[calc(50%+3px)] bg-gradient-to-r from-[#10b981] to-[#059669]"}
        `}
      />
      
      <button
        onClick={() => handleToggle("test")}
        className={`
          relative z-10 flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
          font-bold text-sm transition-colors duration-200
          ${mode === "test" ? "text-white" : "text-on-surface-variant hover:text-on-surface"}
        `}
      >
        <i className={`fas fa-flask text-xs ${mode === "test" ? "animate-pulse" : ""}`} />
        <span>Test Mode</span>
      </button>

      <button
        onClick={() => handleToggle("live")}
        className={`
          relative z-10 flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
          font-bold text-sm transition-colors duration-200
          ${mode === "live" ? "text-white" : "text-on-surface-variant hover:text-on-surface"}
        `}
      >
        <i className={`fas fa-rocket text-xs ${mode === "live" ? "animate-pulse" : ""}`} />
        <span>Live Mode</span>
      </button>
    </div>
  );
}

function KeyInput({
  label,
  value,
  onChange,
  placeholder,
  mode,
  type,
  showValue,
  onToggleVisibility,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  mode: "test" | "live";
  type: "public" | "secret";
  showValue: boolean;
  onToggleVisibility: () => void;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const status = getKeyStatus(value, mode, type);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          {label}
        </label>
        <span className={`text-[10px] font-bold flex items-center gap-1 ${status.color}`}>
          <i className={`fas fa-${status.valid ? "check-circle" : value ? "exclamation-circle" : "circle"} text-[8px]`} />
          {status.message}
        </span>
      </div>
      <div className={`
        relative flex items-center rounded-xl border-2 transition-all duration-200
        ${isFocused ? "border-[#8b5cf6] shadow-lg shadow-[#8b5cf6]/10" : "border-outline-variant"}
        ${!status.valid && value ? "bg-[#fef2f2]" : "bg-surface"}
      `}>
        <div className={`
          w-10 h-10 flex items-center justify-center shrink-0 border-r-2 border-outline-variant
          ${type === "secret" ? "bg-[#fef3c7]/30" : "bg-[#dbeafe]/30"}
        `}>
          <i className={`fas fa-${type === "secret" ? "lock" : "key"} text-outline text-xs`} />
        </div>
        <input
          type={showValue ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 px-3 py-3 text-sm font-mono bg-transparent outline-none placeholder:text-[#cbd5e1]"
        />
        {type === "secret" && (
          <button
            onClick={onToggleVisibility}
            className="w-10 h-10 flex items-center justify-center text-outline hover:text-on-surface-variant hover:bg-surface-variant/50 transition-all rounded-r-xl"
            type="button"
            aria-label={showValue ? "Hide key" : "Show key"}
          >
            <i className={`fas fa-eye${showValue ? "-slash" : ""} text-xs`} />
          </button>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, subtitle, color }: { icon: string; title: string; subtitle?: string; color: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0 shadow-sm`}>
        <i className={`fas ${icon} text-white text-sm`} />
      </div>
      <div className="min-w-0">
        <h2 className="font-bold text-base md:text-lg text-on-surface">{title}</h2>
        {subtitle && <p className="text-xs md:text-sm text-on-surface-variant">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PaystackSettingsPage() {
  const { user } = useAuth();
  
  const [settings, setSettings] = useState<PaystackSettings>({
    ...DEFAULT_SETTINGS,
  });
  const [showTestSecret, setShowTestSecret] = useState(true);
  const [showLiveSecret, setShowLiveSecret] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [paymentSuccess, setPaymentSuccess] = useState<{reference: string; amount: string} | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // Load settings from API
  useEffect(() => {
    if (!user) return;
    
    const loadSettings = async () => {
      try {
        const token = await user.getIdToken();
        if (!token) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        const res = await fetch(buildApiUrl("/api/settings/paystack"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!res.ok) {
          console.error("Failed to fetch settings:", res.status);
          setError("Failed to load saved settings");
          setLoading(false);
          return;
        }
        
        const data = await res.json();
        
        if (data.configured) {
          setSettings(prev => ({
            ...prev,
            mode: data.mode || "test",
            testPublicKey: data.testPublicKey || "",
            testSecretKey: data.testSecretKey || "",
            livePublicKey: data.livePublicKey || "",
            liveSecretKey: data.liveSecretKey || "",
            webhookUrl: data.webhookUrl || "",
          }));
        }
      } catch (err) {
        console.error("Error loading settings:", err);
        setError("Could not load your saved settings — try refreshing");
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [user]);

  const updateField = useCallback(<K extends keyof PaystackSettings>(key: K, value: PaystackSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    if (!user) {
      setError("You must be logged in");
      return;
    }

    setIsSaving(true);
    setSaveStatus("saving");
    
    try {
      const token = await user.getIdToken();
      if (!token) {
        setError("Not authenticated");
        setIsSaving(false);
        return;
      }

      const res = await fetch(buildApiUrl("/api/settings/paystack"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save settings");
      }
      
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const currentModeKeysValid = settings.mode === "test"
    ? validateKey(settings.testPublicKey, "test", "public") && validateKey(settings.testSecretKey, "test", "secret")
    : validateKey(settings.livePublicKey, "live", "public") && validateKey(settings.liveSecretKey, "live", "secret");

  // Test Payment Handler - Opens Paystack checkout popup
  const handleTestPayment = useCallback(() => {
    if (!currentModeKeysValid) {
      alert(`Please enter valid ${settings.mode} mode API keys first`);
      return;
    }

    const publicKey = settings.mode === "test" ? settings.testPublicKey : settings.livePublicKey;
    
    if (!publicKey) {
      alert("Public key is required");
      return;
    }

    // Use KES (Kenyan Shillings) - Paystack uses cents for KES
    // KES 10.00 = 1000 cents (1000/100 = KES 10.00)
    const amountInCents = 1000;
    const currency = "KES";

    // Dynamically load Paystack Inline JS
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    
    script.onload = () => {
      const handler = (window as any).PaystackPop.setup({
        key: publicKey,
        email: "test@example.com",
        amount: amountInCents,
        currency: currency,
        ref: `test_${Date.now()}`,
        metadata: {
          custom_fields: [
            { display_name: "Test Mode", variable_name: "test_mode", value: settings.mode },
            { display_name: "Purpose", variable_name: "purpose", value: "Settings Page Test" },
            { display_name: "Country", variable_name: "country", value: "Kenya" }
          ]
        },
        callback: function(response: any) {
          console.log("Payment completed! Reference:", response.reference);
          setPaymentSuccess({
            reference: response.reference,
            amount: "KES 10.00"
          });
        },
        onClose: function() {
          console.log("Payment window closed");
        }
      });
      
      handler.openIframe();
    };

    script.onerror = () => {
      alert("Failed to load Paystack payment widget");
    };

    document.head.appendChild(script);
  }, [settings.mode, settings.testPublicKey, settings.livePublicKey, currentModeKeysValid]);

  if (loading) {
    return (
      <div className="overflow-x-hidden px-3 md:px-6 py-3 md:py-4 bg-surface-dim">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#8b5cf6]/20">
              <i className="fas fa-circle-notch fa-spin text-2xl text-white"></i>
            </div>
            <p className="text-on-surface-variant font-medium">Loading Paystack Settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden bg-surface-dim">
      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 right-4 z-50 animate-slideDown">
          <div className="bg-white border-2 border-red-200 rounded-2xl p-4 shadow-2xl shadow-red-500/10 max-w-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <i className="fas fa-exclamation-circle text-red-500 text-sm"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-red-800 mb-0.5">Error</p>
                <p className="text-xs text-red-600">{error}</p>
              </div>
              <button
                onClick={() => setError("")}
                className="w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center shrink-0 transition-colors"
              >
                <i className="fas fa-times text-red-400 text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-hidden px-3 md:px-6 py-3 md:py-4 pb-24 space-y-4 md:space-y-5 max-w-4xl mx-auto">
        {/* Header */}
        <PageHeaderCard>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-on-surface flex items-center gap-2.5 md:gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-[#10b981]/10 to-[#059669]/10 flex items-center justify-center shrink-0">
              <i className="fas fa-credit-card text-[#10b981] text-sm md:text-base"></i>
            </div>
            <span>Paystack Settings</span>
          </h1>
          <p className="text-on-surface-variant text-sm mt-1.5 md:mt-2 max-w-2xl">
            Configure your Paystack payment gateway integration for online payments
          </p>
        </PageHeaderCard>

        {/* Info Banner */}
        <div className={`
          bg-gradient-to-r from-[#10b981]/5 via-[#059669]/5 to-[#047857]/5 rounded-2xl border border-[#10b981]/20 shadow-sm
          transition-all duration-500 delay-75
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        `}>
          <div className="p-3 md:p-4 rounded-xl bg-gradient-to-r from-[#10b981]/10 to-[#059669]/10 border-l-4 border-[#10b981] mx-3 md:mx-4 mt-3 md:mt-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center shrink-0 shadow-sm">
                <i className="fas fa-cog text-white text-sm" />
              </div>
              <div>
                <h3 className="font-bold text-sm md:text-base text-on-surface mb-0.5">Paystack Integration Setup</h3>
                <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed">
                  Configure your Paystack API keys to enable online payments. Use <strong>Test Mode</strong> while developing and switch to <strong>Live Mode</strong> when ready to accept real payments.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className={`
          bg-surface rounded-2xl p-4 md:p-6 border border-outline-variant shadow-sm
          transition-all duration-500 delay-100
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        `}>
          <SectionHeader
            icon="fa-random"
            title="Environment Mode"
            subtitle={`Currently in ${settings.mode === "test" ? "Test" : "Live"} mode — ${settings.mode === "test" ? "no real transactions" : "real payments enabled"}`}
            color="from-[#8b5cf6] to-[#7c3aed]"
          />
          <ModeToggle mode={settings.mode} onChange={(mode) => updateField("mode", mode)} />

          {/* Status indicator */}
          <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
            settings.mode === "test"
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${settings.mode === "test" ? "bg-amber-500" : "bg-emerald-500"} ${settings.mode === "live" ? "animate-pulse" : ""}`} />
            {settings.mode === "test"
              ? "Test mode: Payments will be simulated — no real money will be charged"
              : "Live mode: Payments will process real transactions — ensure your keys are correct"
            }
          </div>
        </div>

        {/* API Keys */}
        <div className={`
          bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden
          transition-all duration-500 delay-200
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        `}>
          {/* Section Header with gradient */}
          <div className="bg-gradient-to-r from-[#f59e0b]/5 to-[#d97706]/5 border-b border-outline-variant px-4 md:px-6 py-3 md:py-4">
            <SectionHeader
              icon="fa-key"
              title="API Keys"
              subtitle="Enter your Paystack API keys from the Paystack Dashboard"
              color="from-[#f59e0b] to-[#d97706]"
            />
          </div>

          <div className="p-4 md:p-6 space-y-6">
            {/* Test Keys */}
            <div className={`rounded-xl border-2 p-4 md:p-5 transition-all duration-300 ${
              settings.mode === "test"
                ? "border-[#3b82f6]/30 bg-[#3b82f6]/5"
                : "border-outline-variant bg-surface opacity-60"
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-[#3b82f6] flex items-center justify-center">
                  <i className="fas fa-flask text-white text-[10px]" />
                </div>
                <h3 className="font-bold text-sm text-on-surface">Test Keys</h3>
                {settings.mode === "test" && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-[#3b82f6]/10 text-[#3b82f6] rounded-full border border-[#3b82f6]/20">Active</span>
                )}
              </div>
              <KeyInput
                label="Test Public Key"
                value={settings.testPublicKey}
                onChange={(val) => updateField("testPublicKey", val)}
                placeholder="pk_test_xxxxxxxxxxxxxxxx"
                mode="test"
                type="public"
                showValue={true}
                onToggleVisibility={() => {}}
              />
              <KeyInput
                label="Test Secret Key"
                value={settings.testSecretKey}
                onChange={(val) => updateField("testSecretKey", val)}
                placeholder="sk_test_xxxxxxxxxxxxxxxx"
                mode="test"
                type="secret"
                showValue={showTestSecret}
                onToggleVisibility={() => setShowTestSecret(!showTestSecret)}
              />
            </div>

            {/* Gradient Divider */}
            <div className="relative flex items-center gap-4 py-1">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#f59e0b]/30 to-transparent" />
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-200">
                <i className="fas fa-arrow-down text-amber-500 text-xs" />
                <span className="text-[10px] font-bold text-amber-700">Or</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#f59e0b]/30 to-transparent" />
            </div>

            {/* Live Keys */}
            <div className={`rounded-xl border-2 p-4 md:p-5 transition-all duration-300 ${
              settings.mode === "live"
                ? "border-[#10b981]/30 bg-[#10b981]/5"
                : "border-outline-variant bg-surface opacity-60"
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-[#10b981] flex items-center justify-center">
                  <i className="fas fa-rocket text-white text-[10px]" />
                </div>
                <h3 className="font-bold text-sm text-on-surface">Live Keys</h3>
                {settings.mode === "live" && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-[#10b981]/10 text-[#10b981] rounded-full border border-[#10b981]/20">Active</span>
                )}
              </div>
              <KeyInput
                label="Live Public Key"
                value={settings.livePublicKey}
                onChange={(val) => updateField("livePublicKey", val)}
                placeholder="pk_live_xxxxxxxxxxxxxxxx"
                mode="live"
                type="public"
                showValue={true}
                onToggleVisibility={() => {}}
              />
              <KeyInput
                label="Live Secret Key"
                value={settings.liveSecretKey}
                onChange={(val) => updateField("liveSecretKey", val)}
                placeholder="sk_live_xxxxxxxxxxxxxxxx"
                mode="live"
                type="secret"
                showValue={showLiveSecret}
                onToggleVisibility={() => setShowLiveSecret(!showLiveSecret)}
              />
            </div>

            {/* Test Payment Button */}
            <div className="bg-gradient-to-r from-[#8b5cf6]/5 to-[#7c3aed]/5 rounded-xl border border-[#8b5cf6]/20 p-4 md:p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center shrink-0 shadow-sm">
                  <i className="fas fa-shopping-cart text-white text-xs" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-on-surface">Test Payment Flow</h3>
                  <p className="text-xs text-on-surface-variant">Run a test transaction to verify your configuration</p>
                </div>
              </div>
              <button
                onClick={handleTestPayment}
                disabled={!currentModeKeysValid}
                className={`
                  w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm
                  transition-all duration-200 active:scale-95
                  ${!currentModeKeysValid
                    ? "bg-surface-variant text-outline cursor-not-allowed"
                    : "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-lg shadow-[#8b5cf6]/20 hover:shadow-xl hover:-translate-y-0.5"
                  }
                `}
              >
                <i className="fas fa-shopping-cart" />
                Pay KES 10.00 — Test Transaction
              </button>
              {!currentModeKeysValid && (
                <p className="text-[10px] text-outline mt-2 text-center">Enter your {settings.mode} mode API keys above first</p>
              )}
            </div>
          </div>
        </div>

        {/* Webhook URL */}
        <div className={`
          bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden
          transition-all duration-500 delay-300
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        `}>
          {/* Section Header with gradient */}
          <div className="bg-gradient-to-r from-[#8b5cf6]/5 to-[#7c3aed]/5 border-b border-outline-variant px-4 md:px-6 py-3 md:py-4">
            <SectionHeader
              icon="fa-webhook"
              title="Webhook URL"
              subtitle="Configure webhook to receive payment notifications automatically"
              color="from-[#8b5cf6] to-[#7c3aed]"
            />
          </div>

          <div className="p-4 md:p-6">
            <div className="bg-surface rounded-xl border-2 border-outline-variant overflow-hidden focus-within:border-[#8b5cf6] focus-within:shadow-lg focus-within:shadow-[#8b5cf6]/10 transition-all duration-200">
              <div className="flex items-center">
                <div className="w-10 h-10 flex items-center justify-center border-r-2 border-outline-variant bg-gradient-to-b from-[#8b5cf6]/5 to-transparent shrink-0">
                  <i className="fas fa-link text-[#8b5cf6] text-xs" />
                </div>
                <input
                  type="url"
                  value={settings.webhookUrl}
                  onChange={(e) => updateField("webhookUrl", e.target.value)}
                  placeholder="https://yourdomain.com/api/webhooks/paystack"
                  className="flex-1 px-3 py-3 text-sm font-mono bg-transparent outline-none placeholder:text-[#cbd5e1]"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(settings.webhookUrl)}
                  className="px-4 py-2 text-on-surface-variant hover:text-[#8b5cf6] hover:bg-[#8b5cf6]/5 transition-all text-xs font-bold flex items-center gap-1.5 h-10"
                  type="button"
                >
                  <i className="fas fa-copy" />
                  <span className="hidden sm:inline">Copy</span>
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-2 px-3 py-2.5 bg-[#f0fdf4] rounded-xl border border-[#bbf7d0]">
              <i className="fas fa-info-circle text-[#10b981] text-xs mt-0.5" />
              <p className="text-[10px] md:text-xs text-[#166534] leading-relaxed">
                Copy this URL and add it to your Paystack Dashboard under <strong>Settings → Webhooks</strong>. This allows Paystack to notify your server when payments are made.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="bg-surface/90 border-t border-outline-variant shadow-2xl shadow-black/5">
          <div className="max-w-4xl mx-auto px-3 md:px-6 py-3 md:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs md:text-sm text-on-surface-variant">
              <i className="fas fa-info-circle text-[10px] md:text-xs hidden sm:inline" />
              <span>
                {saveStatus === "saved"
                  ? "✓ Settings saved successfully"
                  : saveStatus === "error"
                  ? "✗ Failed to save — try again"
                  : "Configure your Paystack integration"
                }
              </span>
            </div>
            <div className="flex items-center gap-3">
              {saveStatus === "saved" && (
                <span className="flex items-center gap-1.5 text-sm font-bold text-[#10b981] animate-fadeIn">
                  <i className="fas fa-check-circle" />
                  Saved
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving || !currentModeKeysValid}
                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm
                  transition-all duration-200 active:scale-95
                  ${isSaving || !currentModeKeysValid
                    ? "bg-surface-variant text-outline cursor-not-allowed"
                    : "bg-gradient-to-r from-[#10b981] to-[#059669] text-white shadow-lg shadow-[#10b981]/20 hover:shadow-xl hover:-translate-y-0.5"
                  }
                `}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="h-safe-area-inset-bottom bg-surface/90" />
        </div>
      </div>

      {/* Premium Payment Success Modal */}
      {paymentSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-modalBackdrop">
          <div className="bg-surface rounded-3xl shadow-2xl max-w-sm w-full animate-modalSlideUp overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-br from-[#10b981] to-[#059669] p-6 md:p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 animate-checkmarkBounce shadow-lg">
                <i className="fas fa-check text-3xl md:text-4xl text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-extrabold text-white mb-1">Payment Successful!</h3>
              <p className="text-sm text-white/80">Your test payment was processed</p>
            </div>

            {/* Payment Details */}
            <div className="p-6 md:p-8 space-y-4">
              <div className="bg-surface-container-lowest rounded-2xl p-4 divide-y divide-outline-variant/50 border border-outline-variant">
                <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <span className="text-xs font-medium text-on-surface-variant">Reference</span>
                  <span className="text-xs font-bold text-on-surface font-mono bg-surface px-2 py-1 rounded-lg border border-outline-variant">
                    {paymentSuccess.reference}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-xs font-medium text-on-surface-variant">Amount</span>
                  <span className="text-sm font-extrabold text-[#10b981]">{paymentSuccess.amount}</span>
                </div>
                <div className="flex items-center justify-between py-2.5 last:pb-0">
                  <span className="text-xs font-medium text-on-surface-variant">Status</span>
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-[#10b981]/10 rounded-full border border-[#10b981]/20">
                    <i className="fas fa-check-circle text-[#10b981] text-[10px]" />
                    <span className="text-xs font-bold text-[#10b981]">Completed</span>
                  </span>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-gradient-to-r from-[#dbeafe] to-[#eff6ff] rounded-2xl p-4 border border-[#bfdbfe]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                    <i className="fas fa-info-circle text-white text-xs" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#1e40af] mb-0.5">Test Mode Payment</h4>
                    <p className="text-xs text-[#1e40af]/70 leading-relaxed">
                      This was a test transaction. No real money was charged. Check your Paystack dashboard for details.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setPaymentSuccess(null)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#10b981] to-[#059669] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#10b981]/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
              >
                <i className="fas fa-check-circle" />
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
