"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { businessProfileService, whatsappSettingsService, shippingService, BusinessProfile, WhatsAppSettings, ShippingMethod } from "@/lib/db";

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "products" | "services" | "shipping" | "whatsapp">("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Business Profile State (shared)
  const [profile, setProfile] = useState<Partial<BusinessProfile>>({
    businessName: "",
    tagline: "",
    description: "",
    email: "",
    phone: "",
    whatsappNumber: "",
    website: "",
    address: "",
    city: "",
    country: "Kenya",
    postalCode: "",
    category: "",
  });

  // Product Store Settings
  const [productSettings, setProductSettings] = useState({
    enabled: false,
    storeDescription: "",
    returnPolicy: "",
    warrantyInfo: "",
  });

  // Service Business Settings
  const [serviceSettings, setServiceSettings] = useState({
    enabled: false,
    serviceDescription: "",
    bookingPolicy: "",
    cancellationPolicy: "",
  });

  // Shipping Methods State
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [newShippingMethod, setNewShippingMethod] = useState({
    name: "",
    price: 0,
    estimatedDays: "",
    description: "",
  });

  // WhatsApp Settings State
  const [whatsappSettings, setWhatsappSettings] = useState<Partial<WhatsAppSettings>>({
    welcomeMessageEnabled: true,
    welcomeMessage: "",
    autoReplyEnabled: false,
    autoReplyMessage: "Thank you for your message! We'll get back to you shortly.",
    awayMessageEnabled: false,
    awayMessage: "Hi! Thanks for reaching out. We're currently away but will respond as soon as we're back during our business hours.",
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [profileData, whatsappData, shippingData] = await Promise.all([
        businessProfileService.getProfile(user),
        whatsappSettingsService.getSettings(user),
        shippingService.getShippingMethods(user),
      ]);

      if (profileData) {
        setProfile(profileData);
      }

      if (whatsappData) {
        setWhatsappSettings(whatsappData);
      }

      if (shippingData) {
        setShippingMethods(shippingData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (field: keyof BusinessProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleWhatsAppChange = (field: keyof WhatsAppSettings, value: any) => {
    setWhatsappSettings(prev => ({ ...prev, [field]: value }));
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await businessProfileService.createOrUpdateProfile(user, profile as any);
      alert("Business profile saved successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const saveWhatsAppSettings = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await whatsappSettingsService.createOrUpdateSettings(user, whatsappSettings as any);
      alert("WhatsApp settings saved successfully!");
    } catch (error) {
      console.error("Error saving WhatsApp settings:", error);
      alert("Failed to save WhatsApp settings");
    } finally {
      setSaving(false);
    }
  };

  const addShippingMethod = async () => {
    if (!user || !newShippingMethod.name) return;
    setSaving(true);
    try {
      await shippingService.createShippingMethod(user, newShippingMethod as any);
      setNewShippingMethod({ name: "", price: 0, estimatedDays: "", description: "" });
      await loadData();
      alert("Shipping method added!");
    } catch (error) {
      console.error("Error adding shipping method:", error);
      alert("Failed to add shipping method");
    } finally {
      setSaving(false);
    }
  };

  const deleteShippingMethod = async (methodId: string) => {
    if (!user) return;
    if (!confirm("Delete this shipping method?")) return;
    try {
      await shippingService.deleteShippingMethod(user, methodId);
      await loadData();
    } catch (error) {
      console.error("Error deleting shipping method:", error);
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById("welcomeMessage") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = whatsappSettings.welcomeMessage || "";
      const newText = text.substring(0, start) + variable + text.substring(end);
      setWhatsappSettings(prev => ({ ...prev, welcomeMessage: newText }));
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-[#64748b]">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 animate-fadeIn">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-extrabold text-[#1e293b] flex items-center gap-2">
          <i className="fas fa-cog text-[#8b5cf6]"></i>
          Settings
        </h1>
        <p className="text-[#64748b] text-sm mt-1">
          Manage your business profile, products, services, shipping, and WhatsApp automation
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex-shrink-0 px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
            activeTab === "profile"
              ? "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-lg"
              : "bg-white border-2 border-[#e2e8f0] text-[#64748b] hover:border-[#8b5cf6]"
          }`}
        >
          <i className="fas fa-building"></i>
          Business Profile
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={`flex-shrink-0 px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
            activeTab === "products"
              ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
              : "bg-white border-2 border-[#e2e8f0] text-[#64748b] hover:border-blue-500"
          }`}
        >
          <i className="fas fa-store"></i>
          Product Store
        </button>
        <button
          onClick={() => setActiveTab("services")}
          className={`flex-shrink-0 px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
            activeTab === "services"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
              : "bg-white border-2 border-[#e2e8f0] text-[#64748b] hover:border-purple-500"
          }`}
        >
          <i className="fas fa-concierge-bell"></i>
          Services
        </button>
        <button
          onClick={() => setActiveTab("shipping")}
          className={`flex-shrink-0 px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
            activeTab === "shipping"
              ? "bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg"
              : "bg-white border-2 border-[#e2e8f0] text-[#64748b] hover:border-green-500"
          }`}
        >
          <i className="fas fa-shipping-fast"></i>
          Shipping
        </button>
        <button
          onClick={() => setActiveTab("whatsapp")}
          className={`flex-shrink-0 px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
            activeTab === "whatsapp"
              ? "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-lg"
              : "bg-white border-2 border-[#e2e8f0] text-[#64748b] hover:border-[#8b5cf6]"
          }`}
        >
          <i className="fab fa-whatsapp"></i>
          WhatsApp
        </button>
      </div>

      {/* Business Profile Tab */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-purple-500">
            <div className="flex items-start gap-3">
              <i className="fas fa-info-circle text-2xl text-purple-500"></i>
              <div>
                <h3 className="font-bold text-lg mb-1">Unified Business Profile</h3>
                <p className="text-sm text-[#64748b]">
                  This information is shared across both products and services. Customers will see this in WhatsApp chats.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="md:col-span-2">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <i className="fas fa-info-circle text-[#8b5cf6]"></i>
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#64748b] mb-2">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={profile.businessName || ""}
                    onChange={(e) => handleProfileChange("businessName", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                    placeholder="Your business name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#64748b] mb-2">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={profile.tagline || ""}
                    onChange={(e) => handleProfileChange("tagline", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                    placeholder="Your business tagline"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[#64748b] mb-2">
                    Description
                  </label>
                  <textarea
                    value={profile.description || ""}
                    onChange={(e) => handleProfileChange("description", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none resize-none"
                    placeholder="Tell customers about your business..."
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="md:col-span-2">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <i className="fas fa-phone text-[#8b5cf6]"></i>
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#64748b] mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email || ""}
                    onChange={(e) => handleProfileChange("email", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                    placeholder="business@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#64748b] mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profile.phone || ""}
                    onChange={(e) => handleProfileChange("phone", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                    placeholder="+254 7XX XXX XXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#64748b] mb-2">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={profile.whatsappNumber || ""}
                    onChange={(e) => handleProfileChange("whatsappNumber", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                    placeholder="+254 7XX XXX XXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#64748b] mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={profile.website || ""}
                    onChange={(e) => handleProfileChange("website", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                    placeholder="https://www.example.com"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <i className="fas fa-map-marker-alt text-[#8b5cf6]"></i>
                Business Address
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[#64748b] mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={profile.address || ""}
                    onChange={(e) => handleProfileChange("address", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                    placeholder="Street address or building name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#64748b] mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={profile.city || ""}
                    onChange={(e) => handleProfileChange("city", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                    placeholder="Nairobi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#64748b] mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={profile.postalCode || ""}
                    onChange={(e) => handleProfileChange("postalCode", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                    placeholder="00100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#64748b] mb-2">
                    Country
                  </label>
                  <select
                    value={profile.country || "Kenya"}
                    onChange={(e) => handleProfileChange("country", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                  >
                    <option value="Kenya">Kenya</option>
                    <option value="Uganda">Uganda</option>
                    <option value="Tanzania">Tanzania</option>
                    <option value="Rwanda">Rwanda</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#64748b] mb-2">
                    Business Category
                  </label>
                  <input
                    type="text"
                    value={profile.category || ""}
                    onChange={(e) => handleProfileChange("category", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                    placeholder="e.g., Electronics, Healthcare, Beauty"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={saveProfile}
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  Save Business Profile
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Product Store Tab */}
      {activeTab === "products" && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500">
            <div className="flex items-start gap-3">
              <i className="fas fa-store text-2xl text-blue-500"></i>
              <div>
                <h3 className="font-bold text-lg mb-1">Product Store Settings</h3>
                <p className="text-sm text-[#64748b]">
                  Configure settings specific to your product store. Enable this tab if you sell products.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={productSettings.enabled}
                  onChange={(e) => setProductSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-5 h-5 rounded border-[#e2e8f0] text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-[#64748b]">Enable Product Store</span>
              </label>
            </div>

            {productSettings.enabled && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-[#64748b] mb-2">
                    Store Description
                  </label>
                  <textarea
                    value={productSettings.storeDescription}
                    onChange={(e) => setProductSettings(prev => ({ ...prev, storeDescription: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-blue-500 focus:outline-none resize-none"
                    placeholder="Tell customers about your products, what you sell, and why they should shop with you..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#64748b] mb-2">
                    Return Policy
                  </label>
                  <textarea
                    value={productSettings.returnPolicy}
                    onChange={(e) => setProductSettings(prev => ({ ...prev, returnPolicy: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-blue-500 focus:outline-none resize-none"
                    placeholder="Your return and refund policy..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#64748b] mb-2">
                    Warranty Information
                  </label>
                  <textarea
                    value={productSettings.warrantyInfo}
                    onChange={(e) => setProductSettings(prev => ({ ...prev, warrantyInfo: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-blue-500 focus:outline-none resize-none"
                    placeholder="Warranty details for your products..."
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Services Tab */}
      {activeTab === "services" && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500">
            <div className="flex items-start gap-3">
              <i className="fas fa-concierge-bell text-2xl text-purple-500"></i>
              <div>
                <h3 className="font-bold text-lg mb-1">Service Business Settings</h3>
                <p className="text-sm text-[#64748b]">
                  Configure settings specific to your services. Enable this tab if you offer services.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={serviceSettings.enabled}
                  onChange={(e) => setServiceSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-5 h-5 rounded border-[#e2e8f0] text-purple-500 focus:ring-purple-500"
                />
                <span className="text-sm font-semibold text-[#64748b]">Enable Services</span>
              </label>
            </div>

            {serviceSettings.enabled && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-[#64748b] mb-2">
                    Service Description
                  </label>
                  <textarea
                    value={serviceSettings.serviceDescription}
                    onChange={(e) => setServiceSettings(prev => ({ ...prev, serviceDescription: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-purple-500 focus:outline-none resize-none"
                    placeholder="Describe your services, expertise, and what makes you stand out..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#64748b] mb-2">
                    Booking Policy
                  </label>
                  <textarea
                    value={serviceSettings.bookingPolicy}
                    onChange={(e) => setServiceSettings(prev => ({ ...prev, bookingPolicy: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-purple-500 focus:outline-none resize-none"
                    placeholder="How customers can book your services..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#64748b] mb-2">
                    Cancellation Policy
                  </label>
                  <textarea
                    value={serviceSettings.cancellationPolicy}
                    onChange={(e) => setServiceSettings(prev => ({ ...prev, cancellationPolicy: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-purple-500 focus:outline-none resize-none"
                    placeholder="Your cancellation and rescheduling policy..."
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Shipping Tab */}
      {activeTab === "shipping" && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-green-50 to-teal-50 border-l-4 border-green-500">
            <div className="flex items-start gap-3">
              <i className="fas fa-shipping-fast text-2xl text-green-500"></i>
              <div>
                <h3 className="font-bold text-lg mb-1">Shipping Methods</h3>
                <p className="text-sm text-[#64748b]">
                  Configure delivery options for your customers. These will be used in orders and shown by the AI.
                </p>
              </div>
            </div>
          </div>

          {/* Add New Shipping Method */}
          <div className="mb-6 p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
            <h3 className="font-bold text-lg mb-4">Add Shipping Method</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#64748b] mb-2">
                  Method Name *
                </label>
                <input
                  type="text"
                  value={newShippingMethod.name}
                  onChange={(e) => setNewShippingMethod(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-green-500 focus:outline-none"
                  placeholder="e.g., Standard Delivery"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#64748b] mb-2">
                  Price (KES) *
                </label>
                <input
                  type="number"
                  value={newShippingMethod.price}
                  onChange={(e) => setNewShippingMethod(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-green-500 focus:outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#64748b] mb-2">
                  Estimated Days
                </label>
                <input
                  type="text"
                  value={newShippingMethod.estimatedDays}
                  onChange={(e) => setNewShippingMethod(prev => ({ ...prev, estimatedDays: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-green-500 focus:outline-none"
                  placeholder="e.g., 2-3 days"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#64748b] mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newShippingMethod.description}
                  onChange={(e) => setNewShippingMethod(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-green-500 focus:outline-none"
                  placeholder="e.g., Free delivery for orders over KES 5000"
                />
              </div>
            </div>
            <button
              onClick={addShippingMethod}
              disabled={saving || !newShippingMethod.name}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <i className="fas fa-plus"></i>
              Add Shipping Method
            </button>
          </div>

          {/* Existing Shipping Methods */}
          <div>
            <h3 className="font-bold text-lg mb-4">Current Shipping Methods</h3>
            {shippingMethods.length === 0 ? (
              <div className="text-center py-12 text-[#64748b]">
                <i className="fas fa-shipping-fast text-4xl mb-3 opacity-30"></i>
                <p>No shipping methods added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shippingMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                    <div>
                      <h4 className="font-bold">{method.name}</h4>
                      <p className="text-sm text-[#64748b]">
                        KES {method.price} {method.estimatedDays && `• ${method.estimatedDays}`}
                      </p>
                      {method.description && <p className="text-sm text-[#64748b]">{method.description}</p>}
                    </div>
                    <button
                      onClick={() => deleteShippingMethod(method.id)}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* WhatsApp Tab */}
      {activeTab === "whatsapp" && (
        <div className="space-y-6">
          {/* Welcome Message */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <i className="fas fa-hand-sparkles text-[#8b5cf6]"></i>
                Welcome Message
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsappSettings.welcomeMessageEnabled}
                  onChange={(e) => handleWhatsAppChange("welcomeMessageEnabled", e.target.checked)}
                  className="w-5 h-5 rounded border-[#e2e8f0] text-[#8b5cf6] focus:ring-[#8b5cf6]"
                />
                <span className="text-sm font-semibold text-[#64748b]">Enable</span>
              </label>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-[#64748b] mb-2">
                Message Template
              </label>
              <textarea
                id="welcomeMessage"
                value={whatsappSettings.welcomeMessage || ""}
                onChange={(e) => handleWhatsAppChange("welcomeMessage", e.target.value)}
                rows={12}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none font-mono text-sm resize-none"
                placeholder="Enter your welcome message..."
              />
            </div>

            {/* Quick Variables */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-[#64748b] mb-2">
                Insert Variables (click to add):
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => insertVariable("{{business_name}}")}
                  className="px-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-xs font-semibold text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all"
                >
                  Business Name
                </button>
                <button
                  onClick={() => insertVariable("{{phone}}")}
                  className="px-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-xs font-semibold text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all"
                >
                  Phone
                </button>
                <button
                  onClick={() => insertVariable("{{website}}")}
                  className="px-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-xs font-semibold text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all"
                >
                  Website
                </button>
                <button
                  onClick={() => insertVariable("\n")}
                  className="px-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-xs font-semibold text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all"
                >
                  New Line
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0]">
              <label className="block text-sm font-semibold text-[#64748b] mb-2">
                Preview:
              </label>
              <div className="bg-white rounded-lg p-4 text-sm whitespace-pre-wrap border border-[#e2e8f0]">
                {(whatsappSettings.welcomeMessage || "")
                  .replace(/\{\{business_name\}\}/g, profile.businessName || "Your Business")
                  .replace(/\{\{phone\}\}/g, profile.phone || "+254 7XX XXX XXX")
                  .replace(/\{\{website\}\}/g, profile.website || "www.example.com")}
              </div>
            </div>
          </div>

          {/* Auto Reply */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <i className="fas fa-reply text-[#8b5cf6]"></i>
                Auto Reply
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsappSettings.autoReplyEnabled}
                  onChange={(e) => handleWhatsAppChange("autoReplyEnabled", e.target.checked)}
                  className="w-5 h-5 rounded border-[#e2e8f0] text-[#8b5cf6] focus:ring-[#8b5cf6]"
                />
                <span className="text-sm font-semibold text-[#64748b]">Enable</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#64748b] mb-2">
                Auto Reply Message
              </label>
              <textarea
                value={whatsappSettings.autoReplyMessage || ""}
                onChange={(e) => handleWhatsAppChange("autoReplyMessage", e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none resize-none"
                placeholder="Thank you for your message! We'll get back to you shortly."
              />
            </div>
          </div>

          {/* Away Message */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <i className="fas fa-moon text-[#8b5cf6]"></i>
                Away Message
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsappSettings.awayMessageEnabled}
                  onChange={(e) => handleWhatsAppChange("awayMessageEnabled", e.target.checked)}
                  className="w-5 h-5 rounded border-[#e2e8f0] text-[#8b5cf6] focus:ring-[#8b5cf6]"
                />
                <span className="text-sm font-semibold text-[#64748b]">Enable</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#64748b] mb-2">
                Away Message
              </label>
              <textarea
                value={whatsappSettings.awayMessage || ""}
                onChange={(e) => handleWhatsAppChange("awayMessage", e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none resize-none"
                placeholder="Hi! Thanks for reaching out. We're currently away..."
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={saveWhatsAppSettings}
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  Save WhatsApp Settings
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
