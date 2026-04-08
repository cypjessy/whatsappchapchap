"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { settingsService, TenantSettings } from "@/lib/db";
import WhatsAppConnect from "@/components/WhatsAppConnect";

type ToggleState = {
  autoAccept: boolean;
  inventory: boolean;
  autoReply: boolean;
  smartOrder: boolean;
  orderConfirm: boolean;
  twoFactor: boolean;
  loginNotif: boolean;
  apiAccess: boolean;
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [toggles, setToggles] = useState<ToggleState>({
    autoAccept: true,
    inventory: true,
    autoReply: true,
    smartOrder: true,
    orderConfirm: true,
    twoFactor: true,
    loginNotif: true,
    apiAccess: false,
  });

  const [profileForm, setProfileForm] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+254 712 345 678",
    bio: "Experienced e-commerce seller specializing in fashion and electronics.",
    country: "Kenya",
    city: "Nairobi",
  });

  const [businessForm, setBusinessForm] = useState({
    businessName: "Chap Chap Store",
    businessDescription: "Premium quality products delivered fast via WhatsApp.",
    businessCategory: "Retail & E-commerce",
    businessRegNumber: "BN/2024/123456",
    businessAddress: "123 Kimathi Street, Nairobi CBD, Kenya",
    currency: "KES (Kenyan Shilling)",
    taxRate: "16",
  });

  const [whatsAppForm, setWhatsAppForm] = useState({
    whatsAppNumber: "+254 712 345 678",
    welcomeMessage: "",
  });

  const [evolutionForm, setEvolutionForm] = useState({
    apiUrl: "",
    apiKey: "",
  });

  const [whatsappStatus, setWhatsappStatus] = useState<{
    status: string;
    qrCode: string | null;
    qrCodeBase64: string | null;
  }>({ status: "disconnected", qrCode: null, qrCodeBase64: null });

  const [connecting, setConnecting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await settingsService.getSettings(user);
      setSettings(data);
      
      setToggles({
        autoAccept: data.autoAcceptOrders ?? true,
        inventory: data.inventoryTracking ?? true,
        autoReply: data.autoReply ?? true,
        smartOrder: data.smartOrderDetection ?? true,
        orderConfirm: data.orderConfirmations ?? true,
        twoFactor: true,
        loginNotif: true,
        apiAccess: false,
      });

      setBusinessForm({
        businessName: data.businessName || "Chap Chap Store",
        businessDescription: data.businessDescription || "",
        businessCategory: data.businessCategory || "Retail & E-commerce",
        businessRegNumber: data.businessRegNumber || "",
        businessAddress: data.businessAddress || "",
        currency: data.currency || "KES (Kenyan Shilling)",
        taxRate: String(data.taxRate || 16),
      });

      setWhatsAppForm({
        whatsAppNumber: data.whatsAppNumber || "+254 712 345 678",
        welcomeMessage: data.welcomeMessage || "",
      });

      setEvolutionForm({
        apiUrl: data.evolutionApiUrl || "",
        apiKey: data.evolutionApiKey || "",
      });

      setWhatsappStatus({
        status: data.whatsappConnectionStatus || "disconnected",
        qrCode: null,
        qrCodeBase64: null,
      });
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveEvolutionSettings = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await settingsService.updateSettings(user, {
        evolutionApiUrl: evolutionForm.apiUrl,
        evolutionApiKey: evolutionForm.apiKey,
      });
      alert("Evolution API settings saved!");
    } catch (error) {
      console.error("Error saving evolution settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const disconnectWhatsApp = async () => {
    if (!user || !settings?.whatsappInstanceId) return;
    
    if (!confirm("Disconnect WhatsApp? You'll need to scan QR code again.")) return;
    
    try {
      await settingsService.updateSettings(user, {
        whatsappInstanceId: "",
        whatsappConnectionStatus: "disconnected",
      });
      setWhatsappStatus({
        status: "disconnected",
        qrCode: null,
        qrCodeBase64: null,
      });
    } catch (error) {
      console.error("Error disconnecting WhatsApp:", error);
    }
  };

  const saveBusinessSettings = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await settingsService.updateSettings(user, {
        businessName: businessForm.businessName,
        businessDescription: businessForm.businessDescription,
        businessCategory: businessForm.businessCategory,
        businessRegNumber: businessForm.businessRegNumber,
        businessAddress: businessForm.businessAddress,
        currency: businessForm.currency,
        taxRate: parseFloat(businessForm.taxRate),
        autoAcceptOrders: toggles.autoAccept,
        inventoryTracking: toggles.inventory,
      });
      alert("Business settings saved!");
    } catch (error) {
      console.error("Error saving business settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const saveWhatsAppSettings = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await settingsService.updateSettings(user, {
        whatsAppNumber: whatsAppForm.whatsAppNumber,
        welcomeMessage: whatsAppForm.welcomeMessage,
        autoReply: toggles.autoReply,
        smartOrderDetection: toggles.smartOrder,
        orderConfirmations: toggles.orderConfirm,
      });
      alert("WhatsApp settings saved!");
    } catch (error) {
      console.error("Error saving WhatsApp settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const saveNotificationSettings = async (notifType: string, channel: string, value: boolean) => {
    if (!user || !settings) return;
    try {
      const updatedNotifications = {
        ...settings.notifications,
        [notifType]: {
          ...settings.notifications[notifType as keyof typeof settings.notifications],
          [channel]: value,
        },
      };
      await settingsService.updateSettings(user, { notifications: updatedNotifications });
      setSettings({ ...settings, notifications: updatedNotifications });
    } catch (error) {
      console.error("Error saving notification settings:", error);
    }
  };

  const toggleSwitch = (key: keyof ToggleState) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const navItems = [
    { id: "profile", label: "Profile", icon: "fa-user" },
    { id: "business", label: "Business", icon: "fa-store" },
    { id: "whatsapp", label: "WhatsApp", icon: "fa-whatsapp", badge: "1" },
    { id: "notifications", label: "Notifications", icon: "fa-bell" },
    { id: "team", label: "Team Members", icon: "fa-users" },
    { id: "billing", label: "Billing", icon: "fa-credit-card" },
    { id: "security", label: "Security", icon: "fa-shield-alt" },
    { id: "integrations", label: "Integrations", icon: "fa-plug" },
  ];

  const teamMembers = [
    { name: "John Doe", initials: "JD", email: "john.doe@example.com", role: "Owner", color: "from-[#25D366] to-[#128C7E]" },
    { name: "Sarah Miller", initials: "SM", email: "sarah.m@example.com", role: "Admin", color: "from-[#8b5cf6] to-[#7c3aed]" },
    { name: "Mike Johnson", initials: "MJ", email: "mike.j@example.com", role: "Manager", color: "from-[#f59e0b] to-[#d97706]" },
    { name: "Emma Wilson", initials: "EW", email: "emma.w@example.com", role: "Support Agent", color: "from-[#ec4899] to-[#db2777]" },
    { name: "David Lee", initials: "DL", email: "david.l@example.com", role: "Viewer", color: "from-[#14b8a6] to-[#0d9488]" },
  ];

  const notifications = [
    { title: "New Orders", desc: "Get notified when a customer places a new order", icon: "fa-shopping-bag", color: "text-[#10b981]", key: "newOrders" },
    { title: "Low Stock Alerts", desc: "Get warned when product inventory is running low", icon: "fa-exclamation-triangle", color: "text-[#f59e0b]", key: "lowStock" },
    { title: "New Messages", desc: "Get notified when customers send you WhatsApp messages", icon: "fa-comments", color: "text-[#3b82f6]", key: "newMessages" },
    { title: "Daily Summary", desc: "Receive a daily report of your sales and performance", icon: "fa-chart-line", color: "text-[#25D366]", key: "dailySummary" },
    { title: "Security Alerts", desc: "Important notifications about your account security", icon: "fa-shield-alt", color: "text-[#ef4444]", key: "securityAlerts" },
  ];

  const integrations = [
    { name: "Sendy Delivery", desc: "Automatic delivery fulfillment and tracking", icon: "fa-truck", color: "#f59e0b", connected: true },
    { name: "Google Analytics", desc: "Track your store performance and customer behavior", icon: "fa-chart-pie", color: "#3b82f6", connected: false },
    { name: "Mailchimp", desc: "Email marketing automation for your customers", icon: "fa-envelope", color: "#8b5cf6", connected: false },
    { name: "Stripe", desc: "Accept online card payments securely", icon: "fa-money-bill-wave", color: "#10b981", connected: true },
    { name: "Twilio SMS", desc: "Send SMS notifications to customers", icon: "fa-sms", color: "#ec4899", connected: false },
  ];

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-[#1e293b] flex items-center gap-2">
            <i className="fas fa-cog text-[#25D366]"></i>Settings
          </h1>
          <p className="text-[#64748b]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1e293b] flex items-center gap-2">
          <i className="fas fa-cog text-[#25D366]"></i>Settings
        </h1>
        <p className="text-[#64748b]">Manage your account, business, and WhatsApp integration settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <aside className="bg-white rounded-2xl border border-[#e2e8f0] p-3 lg:sticky lg:top-24 h-fit">
          {navItems.map(item => (
            <div key={item.id} onClick={() => setActiveSection(item.id)} className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all mb-1 font-semibold ${activeSection === item.id ? "bg-gradient-to-r from-[rgba(37,211,102,0.1)] to-[rgba(18,140,126,0.1)] text-[#25D366]" : "text-[#64748b] hover:bg-[#f8fafc] hover:text-[#1e293b]"}`}>
              <i className={`fas ${item.icon} w-6 text-center`}></i>
              <span>{item.label}</span>
              {item.badge && <span className="ml-auto bg-[#ef4444] text-white text-xs px-2 py-0.5 rounded-full">{item.badge}</span>}
            </div>
          ))}
        </aside>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
          {activeSection === "profile" && (
            <div>
              <div className="p-6 border-b border-[#e2e8f0]">
                <h2 className="text-xl font-bold">Profile Settings</h2>
                <p className="text-[#64748b]">Update your personal information and profile details</p>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-4xl font-bold text-white relative group cursor-pointer overflow-hidden">
                    {profileForm.firstName.charAt(0)}{profileForm.lastName.charAt(0)}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <i className="fas fa-camera text-white"></i>
                    </div>
                  </div>
                  <div>
                    <button className="px-4 py-2 bg-[#25D366] text-white rounded-xl font-semibold text-sm mb-2"><i className="fas fa-upload mr-2"></i>Upload Photo</button>
                    <button className="px-4 py-2 bg-[#f8fafc] text-[#ef4444] rounded-xl font-semibold text-sm ml-2">Remove</button>
                    <p className="text-xs text-[#64748b] mt-2">JPG, GIF or PNG. Max size of 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">First Name <span className="text-[#ef4444]">*</span></label>
                    <input type="text" value={profileForm.firstName} onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl focus:border-[#25D366] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Last Name <span className="text-[#ef4444]">*</span></label>
                    <input type="text" value={profileForm.lastName} onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl focus:border-[#25D366] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Email Address <span className="text-[#ef4444]">*</span></label>
                    <div className="relative">
                      <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]"></i>
                      <input type="email" value={profileForm.email} onChange={(e) => setProfileForm({...profileForm, email: e.target.value})} className="w-full pl-11 pr-4 py-3 border-2 border-[#e2e8f0] rounded-xl focus:border-[#25D366] focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Phone Number <span className="text-[#ef4444]">*</span></label>
                    <div className="relative">
                      <i className="fas fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]"></i>
                      <input type="tel" value={profileForm.phone} onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})} className="w-full pl-11 pr-4 py-3 border-2 border-[#e2e8f0] rounded-xl focus:border-[#25D366] focus:outline-none" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-2">Bio</label>
                    <textarea value={profileForm.bio} onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl focus:border-[#25D366] focus:outline-none h-28 resize-none"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Country</label>
                    <select value={profileForm.country} onChange={(e) => setProfileForm({...profileForm, country: e.target.value})} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl focus:border-[#25D366] focus:outline-none">
                      <option>Kenya</option>
                      <option>Nigeria</option>
                      <option>South Africa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">City</label>
                    <input type="text" value={profileForm.city} onChange={(e) => setProfileForm({...profileForm, city: e.target.value})} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl focus:border-[#25D366] focus:outline-none" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-[#e2e8f0]">
                  <button className="px-4 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366]">Cancel</button>
                  <button className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm"><i className="fas fa-save mr-2"></i>Save Changes</button>
                </div>
              </div>
            </div>
          )}

          {activeSection === "business" && (
            <div>
              <div className="p-6 border-b border-[#e2e8f0]">
                <h2 className="text-xl font-bold">Business Settings</h2>
                <p className="text-[#64748b]">Configure your business information and preferences</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-2">Business Name</label>
                    <input type="text" value={businessForm.businessName} onChange={(e) => setBusinessForm({...businessForm, businessName: e.target.value})} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl focus:border-[#25D366] focus:outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-2">Business Description</label>
                    <textarea value={businessForm.businessDescription} onChange={(e) => setBusinessForm({...businessForm, businessDescription: e.target.value})} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl focus:border-[#25D366] focus:outline-none h-24 resize-none"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Business Category</label>
                    <select value={businessForm.businessCategory} onChange={(e) => setBusinessForm({...businessForm, businessCategory: e.target.value})} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl focus:border-[#25D366] focus:outline-none">
                      <option>Retail & E-commerce</option>
                      <option>Wholesale</option>
                      <option>Services</option>
                      <option>Food & Beverage</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Business Registration Number</label>
                    <input type="text" value={businessForm.businessRegNumber} onChange={(e) => setBusinessForm({...businessForm, businessRegNumber: e.target.value})} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl focus:border-[#25D366] focus:outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-2">Business Address</label>
                    <textarea value={businessForm.businessAddress} onChange={(e) => setBusinessForm({...businessForm, businessAddress: e.target.value})} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl focus:border-[#25D366] focus:outline-none h-24 resize-none"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Currency</label>
                    <select value={businessForm.currency} onChange={(e) => setBusinessForm({...businessForm, currency: e.target.value})} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl focus:border-[#25D366] focus:outline-none">
                      <option>KES (Kenyan Shilling)</option>
                      <option>USD (US Dollar)</option>
                      <option>NGN (Nigerian Naira)</option>
                      <option>ZAR (South African Rand)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Tax Rate (%)</label>
                    <input type="number" value={businessForm.taxRate} onChange={(e) => setBusinessForm({...businessForm, taxRate: e.target.value})} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl focus:border-[#25D366] focus:outline-none" />
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-xl">
                    <div><div className="font-bold">Auto-Accept Orders</div><div className="text-sm text-[#64748b]">Automatically confirm orders when payment is received</div></div>
                    <button onClick={() => toggleSwitch("autoAccept")} className={`w-13 h-7 rounded-full relative transition-all ${toggles.autoAccept ? "bg-[#25D366]" : "bg-[#e2e8f0]"}`}>
                      <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${toggles.autoAccept ? "left-6" : "left-1"}`}></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-xl">
                    <div><div className="font-bold">Inventory Tracking</div><div className="text-sm text-[#64748b]">Automatically update stock levels when orders are placed</div></div>
                    <button onClick={() => toggleSwitch("inventory")} className={`w-13 h-7 rounded-full relative transition-all ${toggles.inventory ? "bg-[#25D366]" : "bg-[#e2e8f0]"}`}>
                      <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${toggles.inventory ? "left-6" : "left-1"}`}></span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-[#e2e8f0]">
                  <button className="px-4 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm">Cancel</button>
                  <button onClick={saveBusinessSettings} disabled={saving} className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm">
                    {saving ? <><i className="fas fa-circle-notch fa-spin mr-2"></i>Saving...</> : <><i className="fas fa-save mr-2"></i>Save Changes</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === "whatsapp" && (
            <div>
              <div className="p-6 border-b border-[#e2e8f0]">
                <h2 className="text-xl font-bold">WhatsApp Integration</h2>
                <p className="text-[#64748b]">Connect and manage your WhatsApp Business API</p>
              </div>
              <div className="p-6">
                <div className="bg-gradient-to-br from-[rgba(37,211,102,0.1)] to-[rgba(18,140,126,0.1)] border-2 border-[#25D366] rounded-2xl p-6 text-center mb-6">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-md text-[#25D366]">
                    <i className="fab fa-whatsapp"></i>
                  </div>
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#10b981] text-white rounded-full text-sm font-bold mb-3"><i className="fas fa-check-circle"></i> Connected</span>
                  <h3 className="font-bold text-lg mb-1">WhatsApp Business API</h3>
                  <p className="text-[#64748b] mb-4">{whatsAppForm.whatsAppNumber}</p>
                  <button className="px-4 py-2 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm"><i className="fas fa-sync-alt mr-2"></i>Reconnect</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-2">WhatsApp Business Phone Number</label>
                    <div className="relative">
                      <i className="fab fa-whatsapp absolute left-4 top-1/2 -translate-y-1/2 text-[#25D366]"></i>
                      <input type="tel" value={whatsAppForm.whatsAppNumber} onChange={(e) => setWhatsAppForm({...whatsAppForm, whatsAppNumber: e.target.value})} className="w-full pl-11 pr-4 py-3 border-2 border-[#e2e8f0] rounded-xl focus:border-[#25D366] focus:outline-none bg-[#f8fafc]" />
                    </div>
                    <p className="text-xs text-[#64748b] mt-2">This is the number customers will message for orders</p>
                  </div>
                </div>

                {/* Evolution API Settings */}
                <div className="mt-8 pt-6 border-t border-[#e2e8f0]">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <i className="fab fa-whatsapp text-[#25D366]"></i>WhatsApp Connection
                  </h3>
                  
                  <div className="bg-gradient-to-br from-[rgba(37,211,102,0.1)] to-[rgba(18,140,126,0.1)] border-2 border-[#25D366] rounded-2xl p-6 mb-6">
                    {!user ? (
                      <p className="text-[#64748b]">Please sign in to connect WhatsApp</p>
                    ) : settings?.whatsappInstanceId && whatsappStatus.status === "connected" ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center text-2xl text-white">
                            <i className="fab fa-whatsapp"></i>
                          </div>
                          <div>
                            <div className="font-bold text-lg">WhatsApp Connected</div>
                            <div className="text-sm text-[#64748b]">Ready to send and receive messages</div>
                          </div>
                        </div>
                        <button onClick={disconnectWhatsApp} className="px-4 py-2 border-2 border-[#ef4444] text-[#ef4444] rounded-xl font-semibold text-sm hover:bg-[#ef4444] hover:text-white">
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <WhatsAppConnect
                        instanceName={`tenant_${user.uid}`}
                        onConnected={() => {
                          setWhatsappStatus(prev => ({ ...prev, status: "connected" }));
                          settingsService.updateSettings(user, {
                            whatsappInstanceId: `tenant_${user.uid}`,
                            whatsappConnectionStatus: "connected",
                          });
                        }}
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Evolution API URL</label>
                      <input type="text" value={evolutionForm.apiUrl} onChange={(e) => setEvolutionForm({...evolutionForm, apiUrl: e.target.value})} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl focus:border-[#25D366] focus:outline-none" placeholder="http://173.249.50.98:8080" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Evolution API Key</label>
                      <input type="password" value={evolutionForm.apiKey} onChange={(e) => setEvolutionForm({...evolutionForm, apiKey: e.target.value})} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl focus:border-[#25D366] focus:outline-none" placeholder="Your API Key" />
                    </div>
                  </div>

                  {testResult && (
                    <div className={`p-4 rounded-xl mb-4 ${testResult.success ? "bg-[#10b981]/10 text-[#10b981]" : "bg-[#ef4444]/10 text-[#ef4444]"}`}>
                      <i className={`fas ${testResult.success ? "fa-check-circle" : "fa-exclamation-circle"} mr-2`}></i>
                      {testResult.message}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button onClick={saveEvolutionSettings} disabled={saving} className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm disabled:opacity-50">
                      {saving ? <><i className="fas fa-circle-notch fa-spin mr-2"></i>Saving...</> : <><i className="fas fa-save mr-2"></i>Save API Settings</>}
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-lg mb-4 mt-8">AI Assistant Configuration</h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-xl">
                    <div><div className="font-bold">Auto-Reply to New Messages</div><div className="text-sm text-[#64748b]">AI will automatically respond to customer inquiries</div></div>
                    <button onClick={() => toggleSwitch("autoReply")} className={`w-13 h-7 rounded-full relative transition-all ${toggles.autoReply ? "bg-[#25D366]" : "bg-[#e2e8f0]"}`}>
                      <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${toggles.autoReply ? "left-6" : "left-1"}`}></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-xl">
                    <div><div className="font-bold">Smart Order Detection</div><div className="text-sm text-[#64748b]">Automatically detect order intent in messages</div></div>
                    <button onClick={() => toggleSwitch("smartOrder")} className={`w-13 h-7 rounded-full relative transition-all ${toggles.smartOrder ? "bg-[#25D366]" : "bg-[#e2e8f0]"}`}>
                      <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${toggles.smartOrder ? "left-6" : "left-1"}`}></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-xl">
                    <div><div className="font-bold">Send Order Confirmations</div><div className="text-sm text-[#64748b]">Automatically send confirmation messages for new orders</div></div>
                    <button onClick={() => toggleSwitch("orderConfirm")} className={`w-13 h-7 rounded-full relative transition-all ${toggles.orderConfirm ? "bg-[#25D366]" : "bg-[#e2e8f0]"}`}>
                      <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${toggles.orderConfirm ? "left-6" : "left-1"}`}></span>
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-semibold mb-2">Welcome Message Template</label>
                  <textarea value={whatsAppForm.welcomeMessage} onChange={(e) => setWhatsAppForm({...whatsAppForm, welcomeMessage: e.target.value})} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl focus:border-[#25D366] focus:outline-none h-40 resize-none" placeholder="Enter welcome message template..."></textarea>
                  <p className="text-xs text-[#64748b] mt-2">Use {'{{variable_name}}'} for dynamic content</p>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-[#e2e8f0]">
                  <button className="px-4 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm">Test Connection</button>
                  <button onClick={saveWhatsAppSettings} disabled={saving} className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm">
                    {saving ? <><i className="fas fa-circle-notch fa-spin mr-2"></i>Saving...</> : <><i className="fas fa-save mr-2"></i>Save Changes</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === "notifications" && (
            <div>
              <div className="p-6 border-b border-[#e2e8f0]">
                <h2 className="text-xl font-bold">Notification Preferences</h2>
                <p className="text-[#64748b]">Choose how and when you want to be notified</p>
              </div>
              <div className="p-6 space-y-4">
                {notifications.map((notif, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 bg-[#f8fafc] rounded-xl">
                    <div className={`w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl shadow-md ${notif.color}`}>
                      <i className={`fas ${notif.icon}`}></i>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold mb-1">{notif.title}</div>
                      <div className="text-sm text-[#64748b] mb-3">{notif.desc}</div>
                      <div className="flex gap-4 text-sm">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked={settings?.notifications[notif.key as keyof typeof settings.notifications]?.push} onChange={(e) => saveNotificationSettings(notif.key, "push", e.target.checked)} className="accent-[#25D366]" /> Push
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked={settings?.notifications[notif.key as keyof typeof settings.notifications]?.email} onChange={(e) => saveNotificationSettings(notif.key, "email", e.target.checked)} className="accent-[#25D366]" /> Email
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked={settings?.notifications[notif.key as keyof typeof settings.notifications]?.sms} onChange={(e) => saveNotificationSettings(notif.key, "sms", e.target.checked)} className="accent-[#25D366]" /> SMS
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked={settings?.notifications[notif.key as keyof typeof settings.notifications]?.wa} onChange={(e) => saveNotificationSettings(notif.key, "wa", e.target.checked)} className="accent-[#25D366]" /> WhatsApp
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end gap-3 pt-6 border-t border-[#e2e8f0]">
                  <button className="px-4 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm">Reset to Default</button>
                  <button className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm"><i className="fas fa-save mr-2"></i>Save Preferences</button>
                </div>
              </div>
            </div>
          )}

          {activeSection === "team" && (
            <div>
              <div className="p-6 border-b border-[#e2e8f0]">
                <h2 className="text-xl font-bold">Team Members</h2>
                <p className="text-[#64748b]">Manage who has access to your Chap Chap dashboard</p>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div><h3 className="font-bold">Team Plan: Professional</h3><p className="text-sm text-[#64748b]">5 of 10 seats used</p></div>
                  <button className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm"><i className="fas fa-plus mr-2"></i>Invite Member</button>
                </div>
                <div className="space-y-3">
                  {teamMembers.map((member, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-[#f8fafc] rounded-xl">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center font-bold text-white`}>{member.initials}</div>
                      <div className="flex-1"><div className="font-bold">{member.name}</div><div className="text-sm text-[#64748b]">{member.email}</div></div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${member.role === "Owner" ? "bg-[#25D366] text-white" : "bg-white text-[#64748b]"}`}>{member.role}</span>
                      <button className="w-10 h-10 flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] rounded-lg"><i className="fas fa-ellipsis-v"></i></button>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-[rgba(239,68,68,0.05)] border border-[#ef4444] rounded-xl">
                  <div className="font-bold text-[#ef4444] flex items-center gap-2 mb-3"><i className="fas fa-exclamation-triangle"></i>Danger Zone</div>
                  <div className="flex items-center justify-between">
                    <div><div className="font-bold">Transfer Ownership</div><p className="text-sm text-[#64748b]">Transfer this account to another team member</p></div>
                    <button className="px-4 py-2 border-2 border-[#ef4444] text-[#ef4444] rounded-xl font-semibold text-sm">Transfer</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "billing" && (
            <div>
              <div className="p-6 border-b border-[#e2e8f0]">
                <h2 className="text-xl font-bold">Billing & Subscription</h2>
                <p className="text-[#64748b]">Manage your subscription and payment methods</p>
              </div>
              <div className="p-6">
                <div className="bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-2xl p-6 mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-2xl font-extrabold">Professional Plan</div>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-bold">Active</span>
                  </div>
                  <div className="text-5xl font-extrabold mb-2">$49<span className="text-lg font-normal opacity-80">/month</span></div>
                  <p className="opacity-90 mb-4">Your next billing date is April 15, 2026</p>
                  <div className="flex gap-6 text-sm">
                    <span><i className="fas fa-check mr-2"></i>Unlimited Orders</span>
                    <span><i className="fas fa-check mr-2"></i>10 Team Members</span>
                    <span><i className="fas fa-check mr-2"></i>AI Assistant</span>
                  </div>
                </div>

                <div className="flex gap-3 mb-6">
                  <button className="flex-1 px-4 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366]"><i className="fas fa-arrow-up mr-2"></i>Upgrade Plan</button>
                  <button className="flex-1 px-4 py-2 bg-[#f8fafc] border-2 border-[#ef4444] text-[#ef4444] rounded-xl font-semibold text-sm">Cancel Subscription</button>
                </div>

                <h3 className="font-bold mb-4">Payment Methods</h3>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-4 p-4 bg-[#f8fafc] rounded-xl border-2 border-[#25D366]">
                    <div className="text-3xl text-[#1a1f71]"><i className="fab fa-cc-visa"></i></div>
                    <div className="flex-1"><div className="font-bold">Visa ending in 4242</div><div className="text-sm text-[#64748b]">Expires 12/2027</div></div>
                    <span className="px-3 py-1 bg-[#25D366] text-white rounded-full text-xs font-bold">Default</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-[#f8fafc] rounded-xl">
                    <div className="text-3xl text-[#eb001b]"><i className="fab fa-cc-mastercard"></i></div>
                    <div className="flex-1"><div className="font-bold">Mastercard ending in 8888</div><div className="text-sm text-[#64748b]">Expires 08/2026</div></div>
                    <button className="w-10 h-10 flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] rounded-lg"><i className="fas fa-trash"></i></button>
                  </div>
                </div>
                <button className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366] mb-6"><i className="fas fa-plus mr-2"></i>Add Payment Method</button>

                <h3 className="font-bold mb-4">Billing History</h3>
                <div className="bg-[#f8fafc] rounded-xl overflow-hidden">
                  {["Apr 7, 2026", "Mar 7, 2026", "Feb 7, 2026"].map((date, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 border-b border-[#e2e8f0] last:border-0">
                      <div><div className="font-bold">{date}</div><div className="text-sm text-[#64748b]">Professional Plan - Monthly</div></div>
                      <div className="text-right"><div className="font-bold">$49.00</div><div className="text-sm text-[#10b981]"><i className="fas fa-check-circle"></i> Paid</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === "security" && (
            <div>
              <div className="p-6 border-b border-[#e2e8f0]">
                <h2 className="text-xl font-bold">Security Settings</h2>
                <p className="text-[#64748b]">Protect your account with advanced security features</p>
              </div>
              <div className="p-6">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-xl">
                    <div><div className="font-bold">Two-Factor Authentication (2FA)</div><div className="text-sm text-[#64748b]">Add an extra layer of security</div></div>
                    <button onClick={() => toggleSwitch("twoFactor")} className={`w-13 h-7 rounded-full relative transition-all ${toggles.twoFactor ? "bg-[#25D366]" : "bg-[#e2e8f0]"}`}>
                      <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${toggles.twoFactor ? "left-6" : "left-1"}`}></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-xl">
                    <div><div className="font-bold">Login Notifications</div><div className="text-sm text-[#64748b]">Get notified when someone logs into your account</div></div>
                    <button onClick={() => toggleSwitch("loginNotif")} className={`w-13 h-7 rounded-full relative transition-all ${toggles.loginNotif ? "bg-[#25D366]" : "bg-[#e2e8f0]"}`}>
                      <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${toggles.loginNotif ? "left-6" : "left-1"}`}></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-xl">
                    <div><div className="font-bold">API Key Access</div><div className="text-sm text-[#64748b]">Allow third-party integrations via API</div></div>
                    <button onClick={() => toggleSwitch("apiAccess")} className={`w-13 h-7 rounded-full relative transition-all ${toggles.apiAccess ? "bg-[#25D366]" : "bg-[#e2e8f0]"}`}>
                      <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${toggles.apiAccess ? "left-6" : "left-1"}`}></span>
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-3">Change Password</label>
                  <div className="space-y-3">
                    <input type="password" placeholder="Current password" className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl focus:border-[#25D366] focus:outline-none" />
                    <input type="password" placeholder="New password" className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl focus:border-[#25D366] focus:outline-none" />
                    <input type="password" placeholder="Confirm new password" className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl focus:border-[#25D366] focus:outline-none" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mb-6">
                  <button className="px-4 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm">Cancel</button>
                  <button className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm"><i className="fas fa-lock mr-2"></i>Update Password</button>
                </div>

                <div className="p-4 bg-[rgba(239,68,68,0.05)] border border-[#ef4444] rounded-xl">
                  <div className="font-bold text-[#ef4444] flex items-center gap-2 mb-3"><i className="fas fa-exclamation-triangle"></i>Danger Zone</div>
                  <div className="flex items-center justify-between">
                    <div><div className="font-bold">Delete Account</div><p className="text-sm text-[#64748b]">Permanently delete your Chap Chap account</p></div>
                    <button className="px-4 py-2 bg-[#ef4444] text-white rounded-xl font-semibold text-sm">Delete Account</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "integrations" && (
            <div>
              <div className="p-6 border-b border-[#e2e8f0]">
                <h2 className="text-xl font-bold">Integrations</h2>
                <p className="text-[#64748b]">Connect Chap Chap with your favorite tools</p>
              </div>
              <div className="p-6 space-y-4">
                {integrations.map((int, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 bg-[#f8fafc] rounded-xl">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl`} style={{ backgroundColor: int.color }}>
                      <i className={`fas ${int.icon}`}></i>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold mb-1">{int.name}</div>
                      <div className="text-sm text-[#64748b]">{int.desc}</div>
                      <div className="mt-3">
                        {int.connected ? (
                          <button className="px-4 py-2 bg-[#10b981] text-white rounded-xl font-semibold text-sm"><i className="fas fa-check mr-2"></i>Connected</button>
                        ) : (
                          <button className="px-4 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366]"><i className="fas fa-plug mr-2"></i>Connect</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
