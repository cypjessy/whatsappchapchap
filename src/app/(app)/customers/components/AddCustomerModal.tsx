"use client";

import { useState } from "react";

interface NewCustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  customerType: string;
  companyName: string;
  businessReg: string;
  taxId: string;
  industry: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: string;
  segment: string;
  tags: string[];
  preferences: string[];
  orderUpdates: boolean;
  promotions: boolean;
  abandonedCart: boolean;
  notes: string;
}

interface AddCustomerModalProps {
  onClose: () => void;
  onSave: (customer: NewCustomerData) => Promise<void>;
  saving: boolean;
}

export default function AddCustomerModal({ onClose, onSave, saving }: AddCustomerModalProps) {
  const [newCustomer, setNewCustomer] = useState<NewCustomerData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    countryCode: "+254",
    customerType: "individual",
    companyName: "",
    businessReg: "",
    taxId: "",
    industry: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "KE",
    addressType: "home",
    segment: "",
    tags: [],
    preferences: [],
    orderUpdates: true,
    promotions: true,
    abandonedCart: false,
    notes: "",
  });
  const [newCustomerTag, setNewCustomerTag] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleNewCustomerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    if (name === "togglePreference") {
      const pref = value;
      setNewCustomer(prev => ({
        ...prev,
        preferences: prev.preferences.includes(pref)
          ? prev.preferences.filter(p => p !== pref)
          : [...prev.preferences, pref]
      }));
    } else if (type === "checkbox") {
      setNewCustomer(prev => ({ ...prev, [name]: checked }));
    } else {
      setNewCustomer(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateNewCustomer = () => {
    const errors: Record<string, string> = {};
    if (!newCustomer.firstName.trim()) errors.firstName = "First name is required";
    if (!newCustomer.lastName.trim()) errors.lastName = "Last name is required";
    if (!newCustomer.phone.trim()) {
      errors.phone = "WhatsApp number is required";
    } else {
      const cleanPhone = newCustomer.phone.replace(/[^0-9]/g, "");
      if (cleanPhone.length < 6) errors.phone = "Enter a valid number";
    }
    if (newCustomer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomer.email)) {
      errors.email = "Enter a valid email address";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateNewCustomer()) return;
    await onSave(newCustomer);
  };

  const addCustomerTag = () => {
    if (!newCustomerTag.trim()) return;
    if (!newCustomer.tags.includes(newCustomerTag.trim())) {
      setNewCustomer(prev => ({ ...prev, tags: [...prev.tags, newCustomerTag.trim()] }));
    }
    setNewCustomerTag("");
  };

  const removeCustomerTag = (tag: string) => {
    setNewCustomer(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  return (
    <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-50 flex items-start justify-center p-2 md:p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-4rem)] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-bold text-[#64748b] uppercase tracking-wider mb-4 flex items-center gap-2">
              <i className="fas fa-id-card text-[#25D366]"></i>Basic Information <span className="text-[#ef4444]">*</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-sm mb-1.5">First Name <span className="text-[#ef4444]">*</span></label>
                <div className="relative">
                  <i className="fas fa-user absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]"></i>
                  <input type="text" name="firstName" value={newCustomer.firstName} onChange={handleNewCustomerChange} className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl text-sm focus:outline-none transition-colors ${formErrors.firstName ? "border-[#ef4444] bg-[#fef2f2]" : "border-[#e2e8f0] focus:border-[#25D366]"}`} placeholder="John" />
                </div>
                {formErrors.firstName && <p className="text-[#ef4444] text-xs mt-1"><i className="fas fa-exclamation-circle mr-1"></i>{formErrors.firstName}</p>}
              </div>
              <div>
                <label className="block font-semibold text-sm mb-1.5">Last Name <span className="text-[#ef4444]">*</span></label>
                <div className="relative">
                  <i className="fas fa-user absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]"></i>
                  <input type="text" name="lastName" value={newCustomer.lastName} onChange={handleNewCustomerChange} className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl text-sm focus:outline-none transition-colors ${formErrors.lastName ? "border-[#ef4444] bg-[#fef2f2]" : "border-[#e2e8f0] focus:border-[#25D366]"}`} placeholder="Kamau" />
                </div>
                {formErrors.lastName && <p className="text-[#ef4444] text-xs mt-1"><i className="fas fa-exclamation-circle mr-1"></i>{formErrors.lastName}</p>}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-bold text-[#64748b] uppercase tracking-wider mb-4 flex items-center gap-2">
              <i className="fab fa-whatsapp text-[#25D366]"></i>Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-sm mb-1.5">WhatsApp Number <span className="text-[#ef4444]">*</span></label>
                <div className="flex gap-2">
                  <select name="countryCode" value={newCustomer.countryCode} onChange={handleNewCustomerChange} className="px-3 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm bg-white">
                    <option value="+254">🇰🇪 +254</option>
                    <option value="+255">🇹🇿 +255</option>
                    <option value="+256">🇺🇬 +256</option>
                    <option value="+250">🇷🇼 +250</option>
                    <option value="+233">🇬🇭 +233</option>
                    <option value="+234">🇳🇬 +234</option>
                    <option value="+27">🇿🇦 +27</option>
                  </select>
                  <input type="tel" name="phone" value={newCustomer.phone} onChange={handleNewCustomerChange} className={`flex-1 px-4 py-3 border-2 rounded-xl text-sm focus:outline-none transition-colors ${formErrors.phone ? "border-[#ef4444] bg-[#fef2f2]" : "border-[#e2e8f0] focus:border-[#25D366]"}`} placeholder="712 345 678" />
                </div>
                {formErrors.phone && <p className="text-[#ef4444] text-xs mt-1"><i className="fas fa-exclamation-circle mr-1"></i>{formErrors.phone}</p>}
              </div>
              <div>
                <label className="block font-semibold text-sm mb-1.5">Email Address</label>
                <div className="relative">
                  <i className="fas fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]"></i>
                  <input type="email" name="email" value={newCustomer.email} onChange={handleNewCustomerChange} className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl text-sm focus:outline-none transition-colors ${formErrors.email ? "border-[#ef4444] bg-[#fef2f2]" : "border-[#e2e8f0] focus:border-[#25D366]"}`} placeholder="john@example.com" />
                </div>
                {formErrors.email && <p className="text-[#ef4444] text-xs mt-1"><i className="fas fa-exclamation-circle mr-1"></i>{formErrors.email}</p>}
              </div>
            </div>
          </div>

          {/* Customer Type */}
          <div>
            <h3 className="text-sm font-bold text-[#64748b] uppercase tracking-wider mb-4 flex items-center gap-2">
              <i className="fas fa-users text-[#8b5cf6]"></i>Customer Type
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "individual", label: "Individual", icon: "fa-user", desc: "Regular customer" },
                { id: "business", label: "Business", icon: "fa-building", desc: "B2B client" },
                { id: "reseller", label: "Reseller", icon: "fa-exchange-alt", desc: "Bulk buyer" },
              ].map(type => (
                <button key={type.id} type="button" onClick={() => setNewCustomer(prev => ({ ...prev, customerType: type.id }))} className={`p-4 rounded-xl border-2 text-center transition-all ${newCustomer.customerType === type.id ? "border-[#25D366] bg-[#DCF8C6]/30" : "border-[#e2e8f0] hover:border-[#cbd5e1]"}`}>
                  <i className={`fas ${type.icon} text-xl mb-2 text-[#64748b]`}></i>
                  <div className="font-bold text-sm">{type.label}</div>
                  <div className="text-xs text-[#64748b]">{type.desc}</div>
                </button>
              ))}
            </div>
            {newCustomer.customerType === "business" && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <label className="block font-semibold text-sm mb-1.5">Company Name</label>
                  <input type="text" name="companyName" value={newCustomer.companyName} onChange={handleNewCustomerChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" placeholder="ABC Ltd" />
                </div>
                <div>
                  <label className="block font-semibold text-sm mb-1.5">Business Reg</label>
                  <input type="text" name="businessReg" value={newCustomer.businessReg} onChange={handleNewCustomerChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" placeholder="BRN-123456" />
                </div>
              </div>
            )}
          </div>

          {/* Address */}
          <div>
            <h3 className="text-sm font-bold text-[#64748b] uppercase tracking-wider mb-4 flex items-center gap-2">
              <i className="fas fa-map-marker-alt text-[#f59e0b]"></i>Delivery Address
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block font-semibold text-sm mb-1.5">Street Address</label>
                <input type="text" name="address" value={newCustomer.address} onChange={handleNewCustomerChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" placeholder="123 Kimathi Street" />
              </div>
              <div>
                <label className="block font-semibold text-sm mb-1.5">City</label>
                <input type="text" name="city" value={newCustomer.city} onChange={handleNewCustomerChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" placeholder="Nairobi" />
              </div>
              <div>
                <label className="block font-semibold text-sm mb-1.5">State/County</label>
                <input type="text" name="state" value={newCustomer.state} onChange={handleNewCustomerChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" placeholder="Nairobi County" />
              </div>
              <div>
                <label className="block font-semibold text-sm mb-1.5">Postal Code</label>
                <input type="text" name="postalCode" value={newCustomer.postalCode} onChange={handleNewCustomerChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" placeholder="00100" />
              </div>
              <div>
                <label className="block font-semibold text-sm mb-1.5">Country</label>
                <select name="country" value={newCustomer.country} onChange={handleNewCustomerChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]">
                  <option value="KE">Kenya</option>
                  <option value="TZ">Tanzania</option>
                  <option value="UG">Uganda</option>
                  <option value="RW">Rwanda</option>
                  <option value="GH">Ghana</option>
                  <option value="NG">Nigeria</option>
                </select>
              </div>
            </div>
          </div>

          {/* Segment & Tags */}
          <div>
            <h3 className="text-sm font-bold text-[#64748b] uppercase tracking-wider mb-4 flex items-center gap-2">
              <i className="fas fa-tags text-[#ec4899]"></i>Tags
            </h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {newCustomer.tags.map((tag, i) => (
                <span key={i} className="px-3 py-1 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-full text-xs font-semibold flex items-center gap-1.5">
                  {tag}
                  <button type="button" onClick={() => removeCustomerTag(tag)} className="hover:text-red-200">
                    <i className="fas fa-times text-[10px]"></i>
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newCustomerTag} onChange={(e) => setNewCustomerTag(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomerTag(); } }} className="flex-1 px-3 py-2 border-2 border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#25D366]" placeholder="Add tags (VIP, Bulk Buyer...)" />
              <button type="button" onClick={addCustomerTag} className="px-3 py-2 bg-[#25D366] text-white rounded-lg text-sm hover:bg-[#128C7E]">
                <i className="fas fa-plus"></i>
              </button>
            </div>
          </div>

          {/* Communication Preferences */}
          <div>
            <h3 className="text-sm font-bold text-[#64748b] uppercase tracking-wider mb-4 flex items-center gap-2">
              <i className="fas fa-bell text-[#3b82f6]"></i>Communication Preferences
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-xl">
                <div>
                  <div className="font-semibold text-sm">Order Updates via WhatsApp</div>
                  <div className="text-xs text-[#64748b]">Send order confirmations and shipping updates</div>
                </div>
                <button type="button" onClick={() => setNewCustomer(prev => ({ ...prev, orderUpdates: !prev.orderUpdates }))} className={`w-12 h-6 rounded-full transition-colors relative ${newCustomer.orderUpdates ? "bg-[#25D366]" : "bg-[#e2e8f0]"}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${newCustomer.orderUpdates ? "left-7" : "left-1"}`}></span>
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-xl">
                <div>
                  <div className="font-semibold text-sm">Promotional Messages</div>
                  <div className="text-xs text-[#64748b]">Send offers, discounts, and new arrivals</div>
                </div>
                <button type="button" onClick={() => setNewCustomer(prev => ({ ...prev, promotions: !prev.promotions }))} className={`w-12 h-6 rounded-full transition-colors relative ${newCustomer.promotions ? "bg-[#25D366]" : "bg-[#e2e8f0]"}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${newCustomer.promotions ? "left-7" : "left-1"}`}></span>
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-xl">
                <div>
                  <div className="font-semibold text-sm">Abandoned Cart Reminders</div>
                  <div className="text-xs text-[#64748b]">Remind about items left in cart</div>
                </div>
                <button type="button" onClick={() => setNewCustomer(prev => ({ ...prev, abandonedCart: !prev.abandonedCart }))} className={`w-12 h-6 rounded-full transition-colors relative ${newCustomer.abandonedCart ? "bg-[#25D366]" : "bg-[#e2e8f0]"}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${newCustomer.abandonedCart ? "left-7" : "left-1"}`}></span>
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-sm font-bold text-[#64748b] uppercase tracking-wider mb-4 flex items-center gap-2">
              <i className="fas fa-sticky-note text-[#f59e0b]"></i>Additional Notes
            </h3>
            <textarea name="notes" value={newCustomer.notes} onChange={handleNewCustomerChange} rows={3} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366] resize-none" placeholder="Add any notes about this customer..."></textarea>
          </div>
        </div>

        <div className="p-4 md:p-6 border-t border-[#e2e8f0] flex flex-col md:flex-row justify-between bg-[#f8fafc] rounded-b-2xl gap-3">
          <span className="text-xs text-[#94a3b8] self-center"><span className="text-[#ef4444]">*</span> Required fields</span>
          <div className="flex gap-2 md:gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none px-4 md:px-5 py-3 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#64748b] transition-colors min-h-[48px]" onClick={onClose}>Cancel</button>
            <button className="flex-1 md:flex-none px-4 md:px-5 py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 min-h-[48px]" onClick={handleSave} disabled={saving}>
              {saving ? <><i className="fas fa-circle-notch fa-spin"></i>Saving...</> : <><i className="fas fa-save"></i><span className="md:hidden">Save</span><span className="hidden md:inline">Save Customer</span></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
