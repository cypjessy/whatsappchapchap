"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface PaystackSettings {
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  isLive: boolean;
}

export default function PaystackSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [settings, setSettings] = useState<PaystackSettings>({
    publicKey: "",
    secretKey: "",
    webhookSecret: "",
    isLive: false,
  });
  
  const [savedSettings, setSavedSettings] = useState<PaystackSettings>({
    publicKey: "",
    secretKey: "",
    webhookSecret: "",
    isLive: false,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load existing settings
  useEffect(() => {
    if (!user) return; // wait for auth to initialize
    
    const loadSettings = async () => {
      try {
        const token = await user.getIdToken();
        if (!token) {
          console.error("No authentication token available");
          setLoading(false);
          return;
        }

        const res = await fetch("/api/settings/paystack", {
          headers: { 
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!res.ok) {
          console.error("Failed to fetch settings:", res.status, res.statusText);
          setLoading(false);
          return;
        }
        
        const data = await res.json();
        
        if (data.configured) {
          setConfigured(true);
          const loadedSettings = {
            publicKey: data.publicKey || "",
            secretKey: "", // Don't show secret key for security
            webhookSecret: "", // Don't show webhook secret for security
            isLive: data.isLive || false,
          };
          setSettings(loadedSettings);
          setSavedSettings(loadedSettings);
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [user]);

  const handleSave = async () => {
    setError("");
    setSuccess("");
    
    // Check authentication
    if (!user) {
      setError("You must be logged in");
      return;
    }
    
    const token = await user.getIdToken();
    if (!token) {
      setError("Not authenticated");
      return;
    }
    
    // Validation
    if (!settings.publicKey.trim()) {
      setError("Public key is required");
      return;
    }
    
    if (!settings.secretKey.trim()) {
      setError("Secret key is required");
      return;
    }
    
    if (!settings.webhookSecret.trim()) {
      setError("Webhook secret is required");
      return;
    }
    
    // Validate public key format
    const expectedPrefix = settings.isLive ? "pk_live_" : "pk_test_";
    if (!settings.publicKey.startsWith(expectedPrefix)) {
      setError(`Public key must start with ${expectedPrefix}`);
      return;
    }
    
    // Validate secret key format
    const secretPrefix = settings.isLive ? "sk_live_" : "sk_test_";
    if (!settings.secretKey.startsWith(secretPrefix)) {
      setError(`Secret key must start with ${secretPrefix}`);
      return;
    }
    
    setSaving(true);
    
    try {
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
      
      const data = await res.json();
      
      setSuccess("Paystack settings saved successfully!");
      setConfigured(true);
      
      // Update saved settings to reflect what's in Firestore
      setSavedSettings({
        publicKey: settings.publicKey,
        secretKey: "",
        webhookSecret: "",
        isLive: settings.isLive,
      });
      
      // Clear sensitive fields after save
      setSettings(prev => ({
        ...prev,
        secretKey: "",
        webhookSecret: "",
      }));
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-circle-notch fa-spin text-4xl text-indigo-600 mb-4"></i>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-2"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Paystack Settings</h1>
          <p className="text-gray-600 mt-1">Configure your Paystack payment gateway credentials</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <i className="fas fa-exclamation-circle text-red-600 mt-1 mr-3"></i>
              <div>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start">
              <i className="fas fa-check-circle text-green-600 mt-1 mr-3"></i>
              <div>
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Configuration Status */}
        {configured && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <i className="fas fa-info-circle text-blue-600 mt-1 mr-3"></i>
              <div>
                <p className="text-sm text-blue-800 font-medium">Paystack is configured</p>
                <p className="text-xs text-blue-600 mt-1">
                  Public Key: {savedSettings.publicKey ? `${savedSettings.publicKey.substring(0, 20)}...` : "Not set"}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Mode: {savedSettings.isLive ? "Live" : "Test/Sandbox"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Settings Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Paystack Credentials</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Environment Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Environment Mode
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="environment"
                    checked={!settings.isLive}
                    onChange={() => setSettings({ 
                      ...settings, 
                      isLive: false,
                      publicKey: "",
                      secretKey: "",
                    })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Test/Sandbox</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="environment"
                    checked={settings.isLive}
                    onChange={() => setSettings({ 
                      ...settings, 
                      isLive: true,
                      publicKey: "",
                      secretKey: "",
                    })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Live/Production</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Use Test mode for development and testing. Switch to Live when ready to accept real payments.
              </p>
            </div>

            {/* Public Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Public Key <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={settings.publicKey}
                onChange={(e) => setSettings({ ...settings, publicKey: e.target.value })}
                placeholder={settings.isLive ? "pk_live_xxxxxxxxxxxxx" : "pk_test_xxxxxxxxxxxxx"}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Found in your Paystack Dashboard → Settings → API Keys & Webhooks
              </p>
            </div>

            {/* Secret Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secret Key <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={settings.secretKey}
                onChange={(e) => setSettings({ ...settings, secretKey: e.target.value })}
                placeholder={settings.isLive ? "sk_live_xxxxxxxxxxxxx" : "sk_test_xxxxxxxxxxxxx"}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                ⚠️ Never share this key. Stored securely on the server only.
              </p>
            </div>

            {/* Webhook Secret */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Webhook Secret <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={settings.webhookSecret}
                onChange={(e) => setSettings({ ...settings, webhookSecret: e.target.value })}
                placeholder="Your custom webhook secret"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Set a secret string in Paystack dashboard → Webhooks, then paste the same value here.
              </p>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full sm:w-auto px-6 py-3 rounded-lg font-medium text-white transition-colors ${
                  saving
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {saving ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin mr-2"></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    Save Paystack Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">
            <i className="fas fa-lightbulb mr-2"></i>
            Setup Instructions
          </h3>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>Create a Paystack account at <a href="https://paystack.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">paystack.com</a></li>
            <li>Go to Dashboard → Settings → API Keys & Webhooks</li>
            <li>Copy your Public Key and Secret Key (Test or Live depending on mode)</li>
            <li>Set up a webhook endpoint in Paystack dashboard pointing to your server</li>
            <li>Copy the Webhook Secret from Paystack after creating the webhook</li>
            <li>Enter all three keys above and click Save</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
