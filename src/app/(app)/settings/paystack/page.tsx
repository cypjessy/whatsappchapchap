"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { buildApiUrl } from "@/lib/api-config";

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

function maskKey(key: string): string {
  if (!key || key.length < 12) return key;
  return `${key.slice(0, 8)}••••••••••••${key.slice(-4)}`;
}

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
    <div className="bg-surface-container-lowest rounded-2xl p-1.5 flex gap-1.5 relative">
      {/* Sliding background */}
      <div
        className={`
          absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl transition-all duration-300 ease-out
          ${mode === "test" ? "left-1.5 bg-[#3b82f6]" : "left-[calc(50%+3px)] bg-[#10b981]"}
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
        <i className="fas fa-flask text-xs" />
        Test Mode
      </button>
      <button
        onClick={() => handleToggle("live")}
        className={`
          relative z-10 flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
          font-bold text-sm transition-colors duration-200
          ${mode === "live" ? "text-white" : "text-on-surface-variant hover:text-on-surface"}
        `}
      >
        <i className="fas fa-rocket text-xs" />
        Live Mode
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
        ${isFocused ? "border-[#8b5cf6] shadow-md3-level2 shadow-[#8b5cf6]/10" : "border-outline-variant"}
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
        <button
          onClick={onToggleVisibility}
          className="w-10 h-10 flex items-center justify-center text-outline hover:text-on-surface-variant transition-colors"
          type="button"
          aria-label={showValue ? "Hide key" : "Show key"}
        >
          <i className={`fas fa-eye${showValue ? "-slash" : ""} text-xs`} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PaystackSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [settings, setSettings] = useState<PaystackSettings>({
    ...DEFAULT_SETTINGS,
  });
  const [showTestSecret, setShowTestSecret] = useState(false);
  const [showLiveSecret, setShowLiveSecret] = useState(false);
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

  const allKeysValid = 
    validateKey(settings.testPublicKey, "test", "public") &&
    validateKey(settings.testSecretKey, "test", "secret") &&
    validateKey(settings.livePublicKey, "live", "public") &&
    validateKey(settings.liveSecretKey, "live", "secret");

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
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-circle-notch fa-spin text-4xl text-[#8b5cf6] mb-4"></i>
          <p className="text-on-surface-variant">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      min-h-screen bg-surface-container-lowest pb-24 transition-all duration-500
      ${isVisible ? "opacity-100" : "opacity-0"}
    `}>
      {/* Error Message */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-xl p-4 shadow-md3-level3">
          <div className="flex items-center gap-2">
            <i className="fas fa-exclamation-circle text-red-500"></i>
            <span className="text-sm text-red-800 font-medium">{error}</span>
            <button onClick={() => setError("")} className="ml-2 text-red-400 hover:text-red-600">
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-surface border-b border-outline-variant sticky top-0 z-30">
        <div className="px-3 md:px-6 py-4 md:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl hover:bg-surface-variant flex items-center justify-center transition-colors"
            >
              <i className="fas fa-arrow-left text-on-surface-variant"></i>
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10b981]/10 to-[#059669]/10 flex items-center justify-center">
              <i className="fas fa-credit-card text-[#10b981] text-lg" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-extrabold text-on-surface">Paystack Settings</h1>
              <p className="text-xs text-on-surface-variant hidden sm:block">Configure payment gateway integration</p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-hidden px-3 md:px-6 py-3 md:py-4 pb-2 space-y-6">
        {/* Mode Toggle */}
        <div className={`
          bg-surface rounded-2xl p-4 md:p-6 border border-outline-variant shadow-md3-level1
          transition-all duration-500 delay-100
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        `}>
          <ModeToggle mode={settings.mode} onChange={(mode) => updateField("mode", mode)} />
        </div>

        {/* API Keys */}
        <div className={`
          bg-surface rounded-2xl p-4 md:p-6 border border-outline-variant shadow-md3-level1
          transition-all duration-500 delay-200
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        `}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <i className="fas fa-key text-[#f59e0b] text-sm" />
              <h2 className="font-bold text-on-surface">API Keys</h2>
            </div>
          </div>

          {/* Test Keys */}
          <div className={settings.mode === "live" ? "opacity-50 pointer-events-none" : ""}>
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

          <div className="h-px bg-surface-variant my-5" />

          {/* Live Keys */}
          <div className={settings.mode === "test" ? "opacity-50 pointer-events-none" : ""}>
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
          <div className="mt-4">
            <button
              onClick={handleTestPayment}
              disabled={!currentModeKeysValid}
              className={`
                w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm
                transition-all duration-200 active:scale-95
                ${!currentModeKeysValid
                  ? "bg-surface-variant text-outline cursor-not-allowed"
                  : "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-md3-level3 shadow-[#8b5cf6]/20 hover:shadow-md3-level4 hover:-translate-y-0.5"
                }
              `}
            >
              <i className="fas fa-shopping-cart" />
              Test Payment Flow (KES 10.00)
            </button>
          </div>
        </div>

        {/* Webhook URL */}
        <div className={`
          bg-surface rounded-2xl p-4 md:p-6 border border-outline-variant shadow-md3-level1
          transition-all duration-500 delay-300
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        `}>
          <div className="flex items-center gap-2 mb-4">
            <i className="fas fa-webhook text-[#8b5cf6] text-sm" />
            <h2 className="font-bold text-on-surface">Webhook URL</h2>
          </div>

          <div className={`
            flex items-center rounded-xl border-2 border-outline-variant bg-surface overflow-hidden
            focus-within:border-[#8b5cf6] focus-within:shadow-md3-level2 focus-within:shadow-[#8b5cf6]/10
          `}>
            <div className="w-10 h-10 flex items-center justify-center border-r-2 border-outline-variant bg-surface-container-lowest shrink-0">
              <i className="fas fa-link text-outline text-xs" />
            </div>
            <input
              type="url"
              value={settings.webhookUrl}
              onChange={(e) => updateField("webhookUrl", e.target.value)}
              placeholder="https://yourdomain.com/api/webhooks/paystack"
              className="flex-1 px-3 py-3 text-sm bg-transparent outline-none placeholder:text-[#cbd5e1]"
            />
            <button
              onClick={() => navigator.clipboard.writeText(settings.webhookUrl)}
              className="px-3 py-2 text-on-surface-variant hover:text-[#8b5cf6] transition-colors text-xs font-bold"
              type="button"
            >
              <i className="fas fa-copy mr-1" />Copy
            </button>
          </div>
          <p className="text-[10px] text-outline mt-2">
            Add this URL to your Paystack Dashboard → Settings → Webhooks
          </p>
        </div>








      </div>

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface/80 backdrop-blur-md border-t border-outline-variant z-40">
        <div className="px-3 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <i className="fas fa-info-circle text-[10px]" />
            <span className="hidden sm:inline">
              {saveStatus === "saved" ? "Settings saved successfully" : "Unsaved changes"}
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
                  : "bg-gradient-to-r from-[#10b981] to-[#059669] text-white shadow-md3-level3 shadow-[#10b981]/20 hover:shadow-md3-level4 hover:-translate-y-0.5"
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
        <div className="h-safe-area-inset-bottom bg-surface/80" />
      </div>

      {/* Premium Payment Success Modal */}
      {paymentSuccess && (
        <div className="payment-modal-overlay animate-modalBackdrop">
          <div className="payment-modal animate-modalSlideUp">
            {/* Success Header */}
            <div className="payment-modal-header">
              <div className="payment-checkmark-icon animate-checkmarkBounce">
                <i className="fas fa-check text-4xl text-white" />
              </div>
              <h3>Payment Successful!</h3>
              <p>Your test payment was processed</p>
            </div>

            {/* Payment Details */}
            <div className="payment-modal-body">
              <div className="payment-details-card">
                <div className="payment-detail-row">
                  <span className="payment-detail-label">Reference</span>
                  <span className="payment-detail-value">{paymentSuccess.reference}</span>
                </div>
                <div className="payment-detail-row">
                  <span className="payment-detail-label">Amount</span>
                  <span className="payment-detail-value amount">{paymentSuccess.amount}</span>
                </div>
                <div className="payment-detail-row">
                  <span className="payment-detail-label">Status</span>
                  <span className="payment-status-badge">
                    <i className="fas fa-check-circle text-[10px]" />
                    Completed
                  </span>
                </div>
              </div>

              {/* Info Box */}
              <div className="payment-info-box">
                <div className="payment-info-box-content">
                  <i className="fas fa-info-circle payment-info-box-icon" />
                  <div className="payment-info-box-text">
                    <h4>Test Mode Payment</h4>
                    <p>This was a test transaction. No real money was charged. Check your Paystack dashboard for details.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="payment-modal-footer">
              <button
                onClick={() => setPaymentSuccess(null)}
                className="payment-confirm-btn"
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
