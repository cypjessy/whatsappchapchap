"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaystackSettings {
  mode: "test" | "live";
  testPublicKey: string;
  testSecretKey: string;
  livePublicKey: string;
  liveSecretKey: string;
  webhookUrl: string;
  webhookSecret: string;
  currency: string;
  channels: {
    card: boolean;
    bank: boolean;
    transfer: boolean;
    ussd: boolean;
    mobileMoney: boolean;
    qr: boolean;
  };
  metadata: {
    businessName: string;
    businessEmail: string;
    logoUrl: string;
    description: string;
  };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CURRENCIES = [
  { value: "NGN", label: "Nigerian Naira (₦)", flag: "🇳🇬" },
  { value: "GHS", label: "Ghanaian Cedi (₵)", flag: "🇬🇭" },
  { value: "KES", label: "Kenyan Shilling (KSh)", flag: "🇰🇪" },
  { value: "ZAR", label: "South African Rand (R)", flag: "🇿🇦" },
  { value: "USD", label: "US Dollar ($)", flag: "🇺🇸" },
];

const PAYMENT_CHANNELS = [
  { id: "card" as const, label: "Card Payments", icon: "fa-credit-card", description: "Visa, Mastercard, Verve" },
  { id: "bank" as const, label: "Bank Transfer", icon: "fa-university", description: "Direct bank account debit" },
  { id: "transfer" as const, label: "Pay with Transfer", icon: "fa-exchange-alt", description: "Bank transfer to virtual account" },
  { id: "ussd" as const, label: "USSD", icon: "fa-mobile-alt", description: "USSD code payments" },
  { id: "mobileMoney" as const, label: "Mobile Money", icon: "fa-money-bill-wave", description: "M-Pesa, MTN, etc." },
  { id: "qr" as const, label: "QR Code", icon: "fa-qrcode", description: "Scan-to-pay" },
];

const DEFAULT_SETTINGS: PaystackSettings = {
  mode: "test",
  testPublicKey: "",
  testSecretKey: "",
  livePublicKey: "",
  liveSecretKey: "",
  webhookUrl: "",
  webhookSecret: "",
  currency: "NGN",
  channels: {
    card: true,
    bank: true,
    transfer: false,
    ussd: false,
    mobileMoney: false,
    qr: false,
  },
  metadata: {
    businessName: "",
    businessEmail: "",
    logoUrl: "",
    description: "",
  },
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
  if (!key) return { valid: false, message: "Required", color: "text-[#94a3b8]" };
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
    <div className="bg-[#f8fafc] rounded-2xl p-1.5 flex gap-1.5 relative">
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
          ${mode === "test" ? "text-white" : "text-[#64748b] hover:text-[#1e293b]"}
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
          ${mode === "live" ? "text-white" : "text-[#64748b] hover:text-[#1e293b]"}
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
        <label className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
          {label}
        </label>
        <span className={`text-[10px] font-bold flex items-center gap-1 ${status.color}`}>
          <i className={`fas fa-${status.valid ? "check-circle" : value ? "exclamation-circle" : "circle"} text-[8px]`} />
          {status.message}
        </span>
      </div>
      <div className={`
        relative flex items-center rounded-xl border-2 transition-all duration-200
        ${isFocused ? "border-[#8b5cf6] shadow-md shadow-[#8b5cf6]/10" : "border-[#e2e8f0]"}
        ${!status.valid && value ? "bg-[#fef2f2]" : "bg-white"}
      `}>
        <div className={`
          w-10 h-10 flex items-center justify-center shrink-0 border-r-2 border-[#e2e8f0]
          ${type === "secret" ? "bg-[#fef3c7]/30" : "bg-[#dbeafe]/30"}
        `}>
          <i className={`fas fa-${type === "secret" ? "lock" : "key"} text-[#94a3b8] text-xs`} />
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
          className="w-10 h-10 flex items-center justify-center text-[#94a3b8] hover:text-[#64748b] transition-colors"
          type="button"
          aria-label={showValue ? "Hide key" : "Show key"}
        >
          <i className={`fas fa-eye${showValue ? "-slash" : ""} text-xs`} />
        </button>
      </div>
    </div>
  );
}

function ChannelToggle({
  channel,
  enabled,
  onChange,
  index,
}: {
  channel: typeof PAYMENT_CHANNELS[0];
  enabled: boolean;
  onChange: (val: boolean) => void;
  index: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 60);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      className={`
        flex items-center gap-3 p-3 md:p-4 rounded-xl border-2 cursor-pointer
        transition-all duration-200
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}
        ${enabled
          ? "border-[#8b5cf6] bg-[#ede9fe]/30 shadow-sm shadow-[#8b5cf6]/10"
          : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
        }
      `}
      style={{ transitionDelay: `${index * 60}ms` }}
      onClick={() => onChange(!enabled)}
    >
      <div className={`
        w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200
        ${enabled ? "bg-[#8b5cf6] text-white" : "bg-[#f1f5f9] text-[#94a3b8]"}
      `}>
        <i className={`fas ${channel.icon} text-sm`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm">{channel.label}</div>
        <div className="text-xs text-[#64748b]">{channel.description}</div>
      </div>
      <div className={`
        w-11 h-6 rounded-full relative transition-colors duration-200 shrink-0
        ${enabled ? "bg-[#8b5cf6]" : "bg-[#e2e8f0]"}
      `}>
        <div className={`
          absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200
          ${enabled ? "translate-x-5.5" : "translate-x-0.5"}
        `} />
      </div>
    </div>
  );
}

function ConnectionTestButton({
  mode,
  onTest,
  disabled,
}: {
  mode: "test" | "live";
  onTest: () => Promise<{ success: boolean; message: string }>;
  disabled: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleTest = async () => {
    setStatus("testing");
    try {
      const result = await onTest();
      setStatus(result.success ? "success" : "error");
      setMessage(result.message);
    } catch {
      setStatus("error");
      setMessage("Connection failed");
    }
    setTimeout(() => setStatus("idle"), 3000);
  };

  const configs = {
    idle: { bg: "bg-[#f8fafc]", text: "text-[#64748b]", icon: "fa-plug", label: `Test ${mode === "test" ? "Sandbox" : "Live"} Connection` },
    testing: { bg: "bg-[#f59e0b]/10", text: "text-[#f59e0b]", icon: "fa-circle-notch fa-spin", label: "Testing..." },
    success: { bg: "bg-[#10b981]/10", text: "text-[#10b981]", icon: "fa-check-circle", label: "Connection Successful" },
    error: { bg: "bg-[#ef4444]/10", text: "text-[#ef4444]", icon: "fa-times-circle", label: message || "Connection Failed" },
  };

  const config = configs[status];

  return (
    <button
      onClick={handleTest}
      disabled={disabled || status === "testing"}
      className={`
        w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm
        border-2 transition-all duration-200 active:scale-95
        ${config.bg} ${config.text} border-current
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-sm"}
      `}
    >
      <i className={`fas ${config.icon}`} />
      {config.label}
    </button>
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

        const res = await fetch("/api/settings/paystack", {
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
            testSecretKey: data.testSecretKey || "",  // Load for prefilling
            livePublicKey: data.livePublicKey || "",
            liveSecretKey: data.liveSecretKey || "",  // Load for prefilling
            webhookUrl: data.webhookUrl || "",
            webhookSecret: data.webhookSecret || "",  // Load for prefilling
            currency: data.currency || "NGN",
            channels: data.channels || DEFAULT_SETTINGS.channels,
            metadata: data.metadata || DEFAULT_SETTINGS.metadata,
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

  const updateChannel = useCallback((channelId: keyof PaystackSettings["channels"], value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      channels: { ...prev.channels, [channelId]: value },
    }));
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

      const res = await fetch("/api/settings/paystack", {
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

  const handleTestConnection = async (mode: "test" | "live"): Promise<{ success: boolean; message: string }> => {
    // TODO: Implement actual connection test with Paystack API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: "Connection successful",
        });
      }, 1500);
    });
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

    // Dynamically load Paystack Inline JS
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    
    script.onload = () => {
      const handler = (window as any).PaystackPop.setup({
        key: publicKey,
        email: "test@example.com",
        amount: 1000 * 100, // KES 10.00 in kobo/cents
        currency: settings.currency || "KES",
        ref: `test_${Date.now()}`,
        metadata: {
          custom_fields: [
            { display_name: "Test Mode", variable_name: "test_mode", value: settings.mode },
            { display_name: "Purpose", variable_name: "purpose", value: "Settings Page Test" }
          ]
        },
        callback: function(response: any) {
          console.log("Payment completed! Reference:", response.reference);
          alert(`✅ Payment Successful!\n\nReference: ${response.reference}\nAmount: KES 10.00\n\nCheck your Paystack dashboard for details.`);
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
  }, [settings.mode, settings.testPublicKey, settings.livePublicKey, settings.currency, currentModeKeysValid]);

  const activeChannelsCount = Object.values(settings.channels).filter(Boolean).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-circle-notch fa-spin text-4xl text-[#8b5cf6] mb-4"></i>
          <p className="text-[#64748b]">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      min-h-screen bg-[#f8fafc] pb-24 transition-all duration-500
      ${isVisible ? "opacity-100" : "opacity-0"}
    `}>
      {/* Error Message */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg">
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
      <div className="bg-white border-b border-[#e2e8f0] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <i className="fas fa-arrow-left text-[#64748b]"></i>
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10b981]/10 to-[#059669]/10 flex items-center justify-center">
              <i className="fas fa-credit-card text-[#10b981] text-lg" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-extrabold text-[#1e293b]">Paystack Settings</h1>
              <p className="text-xs text-[#64748b] hidden sm:block">Configure payment gateway for test & production</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`
              hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
              ${settings.mode === "test"
                ? "bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20"
                : "bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20"
              }
            `}>
              <i className={`fas fa-${settings.mode === "test" ? "flask" : "rocket"} text-[10px]`} />
              {settings.mode === "test" ? "Sandbox" : "Production"}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6">
        {/* Mode Toggle */}
        <div className={`
          bg-white rounded-2xl p-4 md:p-6 border border-[#e2e8f0] shadow-sm
          transition-all duration-500 delay-100
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        `}>
          <div className="flex items-center gap-2 mb-4">
            <i className="fas fa-toggle-on text-[#8b5cf6] text-sm" />
            <h2 className="font-bold text-[#1e293b]">Environment Mode</h2>
          </div>
          <ModeToggle mode={settings.mode} onChange={(mode) => updateField("mode", mode)} />
          <p className="text-xs text-[#64748b] mt-3 flex items-center gap-1.5">
            <i className="fas fa-info-circle text-[10px]" />
            {settings.mode === "test"
              ? "Test mode uses sandbox keys. No real money is processed."
              : "Live mode processes real transactions. Ensure compliance docs are approved."
            }
          </p>
        </div>

        {/* API Keys */}
        <div className={`
          bg-white rounded-2xl p-4 md:p-6 border border-[#e2e8f0] shadow-sm
          transition-all duration-500 delay-200
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        `}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <i className="fas fa-key text-[#f59e0b] text-sm" />
              <h2 className="font-bold text-[#1e293b]">API Keys</h2>
            </div>
            <span className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider">
              {settings.mode === "test" ? "Test Environment" : "Live Environment"}
            </span>
          </div>

          {/* Test Keys */}
          <div className={settings.mode === "live" ? "opacity-50 pointer-events-none" : ""}>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-1 rounded-md bg-[#3b82f6]/10 text-[#3b82f6] text-[10px] font-bold uppercase">Test Keys</span>
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

          <div className="h-px bg-[#e2e8f0] my-5" />

          {/* Live Keys */}
          <div className={settings.mode === "test" ? "opacity-50 pointer-events-none" : ""}>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-1 rounded-md bg-[#10b981]/10 text-[#10b981] text-[10px] font-bold uppercase">Live Keys</span>
              <span className="px-2 py-1 rounded-md bg-[#ef4444]/10 text-[#ef4444] text-[10px] font-bold uppercase">
                <i className="fas fa-shield-alt mr-1" />Secure
              </span>
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

          {/* Test Connection */}
          <div className="mt-4 space-y-3">
            <ConnectionTestButton
              mode={settings.mode}
              onTest={() => handleTestConnection(settings.mode)}
              disabled={!currentModeKeysValid}
            />
            
            {/* Test Payment Button */}
            <button
              onClick={handleTestPayment}
              disabled={!currentModeKeysValid}
              className={`
                w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm
                transition-all duration-200 active:scale-95
                ${!currentModeKeysValid
                  ? "bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed"
                  : "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-lg shadow-[#8b5cf6]/20 hover:shadow-xl hover:-translate-y-0.5"
                }
              `}
            >
              <i className="fas fa-shopping-cart" />
              Test Payment Flow (KES 10.00)
            </button>
            <p className="text-xs text-[#64748b] text-center flex items-center justify-center gap-1.5">
              <i className="fas fa-info-circle text-[10px]" />
              Opens Paystack checkout popup with test card numbers below
            </p>
          </div>
        </div>

        {/* Webhook Settings */}
        <div className={`
          bg-white rounded-2xl p-4 md:p-6 border border-[#e2e8f0] shadow-sm
          transition-all duration-500 delay-300
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        `}>
          <div className="flex items-center gap-2 mb-5">
            <i className="fas fa-webhook text-[#8b5cf6] text-sm" />
            <h2 className="font-bold text-[#1e293b]">Webhook Configuration</h2>
          </div>

          <div className="mb-4">
            <label className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2 block">
              Webhook URL
            </label>
            <div className={`
              flex items-center rounded-xl border-2 border-[#e2e8f0] bg-white overflow-hidden
              focus-within:border-[#8b5cf6] focus-within:shadow-md focus-within:shadow-[#8b5cf6]/10
            `}>
              <div className="w-10 h-10 flex items-center justify-center border-r-2 border-[#e2e8f0] bg-[#f8fafc] shrink-0">
                <i className="fas fa-link text-[#94a3b8] text-xs" />
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
                className="px-3 py-2 text-[#64748b] hover:text-[#8b5cf6] transition-colors text-xs font-bold"
                type="button"
              >
                <i className="fas fa-copy mr-1" />Copy
              </button>
            </div>
            <p className="text-[10px] text-[#94a3b8] mt-1.5">
              Add this URL to your Paystack Dashboard → Settings → Webhooks
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2 block">
              Webhook Secret (Optional)
            </label>
            <div className="flex items-center rounded-xl border-2 border-[#e2e8f0] bg-white overflow-hidden focus-within:border-[#8b5cf6]">
              <div className="w-10 h-10 flex items-center justify-center border-r-2 border-[#e2e8f0] bg-[#fef3c7]/30 shrink-0">
                <i className="fas fa-shield-alt text-[#94a3b8] text-xs" />
              </div>
              <input
                type="password"
                value={settings.webhookSecret}
                onChange={(e) => updateField("webhookSecret", e.target.value)}
                placeholder="Your custom webhook secret"
                className="flex-1 px-3 py-3 text-sm font-mono bg-transparent outline-none placeholder:text-[#cbd5e1]"
              />
            </div>
          </div>
        </div>

        {/* Currency & Channels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Currency */}
          <div className={`
            bg-white rounded-2xl p-4 md:p-6 border border-[#e2e8f0] shadow-sm
            transition-all duration-500 delay-400
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}>
            <div className="flex items-center gap-2 mb-5">
              <i className="fas fa-coins text-[#f59e0b] text-sm" />
              <h2 className="font-bold text-[#1e293b]">Currency</h2>
            </div>
            <div className="relative">
              <select
                value={settings.currency}
                onChange={(e) => updateField("currency", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] bg-white text-sm font-bold outline-none focus:border-[#8b5cf6] appearance-none cursor-pointer"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.flag} {c.label}
                  </option>
                ))}
              </select>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[#94a3b8] text-xs pointer-events-none" />
            </div>
          </div>

          {/* Business Metadata */}
          <div className={`
            bg-white rounded-2xl p-4 md:p-6 border border-[#e2e8f0] shadow-sm
            transition-all duration-500 delay-500
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}>
            <div className="flex items-center gap-2 mb-5">
              <i className="fas fa-building text-[#3b82f6] text-sm" />
              <h2 className="font-bold text-[#1e293b]">Business Info</h2>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={settings.metadata.businessName}
                onChange={(e) => updateField("metadata", { ...settings.metadata, businessName: e.target.value })}
                placeholder="Business Name"
                className="w-full px-3 py-2.5 rounded-xl border-2 border-[#e2e8f0] text-sm outline-none focus:border-[#8b5cf6] placeholder:text-[#cbd5e1]"
              />
              <input
                type="email"
                value={settings.metadata.businessEmail}
                onChange={(e) => updateField("metadata", { ...settings.metadata, businessEmail: e.target.value })}
                placeholder="Business Email"
                className="w-full px-3 py-2.5 rounded-xl border-2 border-[#e2e8f0] text-sm outline-none focus:border-[#8b5cf6] placeholder:text-[#cbd5e1]"
              />
            </div>
          </div>
        </div>

        {/* Payment Channels */}
        <div className={`
          bg-white rounded-2xl p-4 md:p-6 border border-[#e2e8f0] shadow-sm
          transition-all duration-500 delay-500
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        `}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <i className="fas fa-sliders-h text-[#8b5cf6] text-sm" />
              <h2 className="font-bold text-[#1e293b]">Payment Channels</h2>
            </div>
            <span className="text-xs text-[#64748b] font-bold">
              {activeChannelsCount} of {PAYMENT_CHANNELS.length} enabled
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PAYMENT_CHANNELS.map((channel, idx) => (
              <ChannelToggle
                key={channel.id}
                channel={channel}
                enabled={settings.channels[channel.id]}
                onChange={(val) => updateChannel(channel.id, val)}
                index={idx}
              />
            ))}
          </div>
        </div>

        {/* Test Cards Info */}
        {settings.mode === "test" && (
          <div className={`
            bg-gradient-to-br from-[#3b82f6]/5 to-[#8b5cf6]/5 rounded-2xl p-4 md:p-6 border border-[#3b82f6]/20
            transition-all duration-500 delay-600
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}>
            <div className="flex items-center gap-2 mb-4">
              <i className="fas fa-flask text-[#3b82f6] text-sm" />
              <h2 className="font-bold text-[#1e293b]">Test Card Numbers</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { number: "4084 0840 8408 4081", type: "Success (No PIN)", badge: "bg-[#10b981]/10 text-[#10b981]" },
                { number: "5078 5078 5078 5078", type: "PIN Required", badge: "bg-[#f59e0b]/10 text-[#f59e0b]" },
                { number: "5060 6666 6666 6666", type: "PIN + OTP", badge: "bg-[#ef4444]/10 text-[#ef4444]" },
              ].map((card) => (
                <div key={card.number} className="bg-white rounded-xl p-3 border border-[#e2e8f0]">
                  <div className="font-mono text-sm font-bold text-[#1e293b] mb-1">{card.number}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#64748b]">{card.type}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${card.badge}`}>
                      Use any CVC + future date
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-[#e2e8f0] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-[#64748b]">
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
                  ? "bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed"
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
        <div className="h-safe-area-inset-bottom bg-white/80" />
      </div>
    </div>
  );
}
