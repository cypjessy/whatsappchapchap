"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Constants ─────────────────────────────────────────────────────────────

const WIZARD_STEPS = [
  { id: 1, label: "Basic Info", icon: "fa-id-card", required: true },
  { id: 2, label: "Contact", icon: "fa-phone", required: true },
  { id: 3, label: "Type", icon: "fa-users", required: false },
  { id: 4, label: "Address", icon: "fa-map-marker-alt", required: false },
  { id: 5, label: "Tags", icon: "fa-tags", required: false },
  { id: 6, label: "Preferences", icon: "fa-bell", required: false },
] as const;

const COUNTRY_CODES = [
  { code: "+254", flag: "🇰🇪", name: "Kenya" },
  { code: "+255", flag: "🇹🇿", name: "Tanzania" },
  { code: "+256", flag: "🇺🇬", name: "Uganda" },
  { code: "+250", flag: "🇷🇼", name: "Rwanda" },
  { code: "+233", flag: "🇬🇭", name: "Ghana" },
  { code: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "+27", flag: "🇿🇦", name: "South Africa" },
  { code: "+1", flag: "🇺🇸", name: "USA" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
] as const;

const COUNTRIES = [
  { code: "KE", flag: "🇰🇪", name: "Kenya" },
  { code: "TZ", flag: "🇹🇿", name: "Tanzania" },
  { code: "UG", flag: "🇺🇬", name: "Uganda" },
  { code: "RW", flag: "🇷🇼", name: "Rwanda" },
  { code: "GH", flag: "🇬🇭", name: "Ghana" },
  { code: "NG", flag: "🇳🇬", name: "Nigeria" },
  { code: "ZA", flag: "🇿🇦", name: "South Africa" },
] as const;

const CUSTOMER_TYPES = [
  { id: "individual", label: "Individual", icon: "fa-user", desc: "Regular customer", color: "from-[#25D366]/10 to-[#128C7E]/5" },
  { id: "business", label: "Business", icon: "fa-building", desc: "B2B client", color: "from-[#3b82f6]/10 to-[#2563eb]/5" },
  { id: "reseller", label: "Reseller", icon: "fa-exchange-alt", desc: "Bulk buyer", color: "from-[#f59e0b]/10 to-[#d97706]/5" },
] as const;

const ADDRESS_TYPES = [
  { id: "home", label: "Home", icon: "fa-home" },
  { id: "office", label: "Office", icon: "fa-building" },
  { id: "other", label: "Other", icon: "fa-map-pin" },
] as const;

const SEGMENTS = [
  { id: "vip", label: "VIP", color: "bg-[#f59e0b]/10 text-[#f59e0b]" },
  { id: "loyal", label: "Loyal", color: "bg-[#10b981]/10 text-[#10b981]" },
  { id: "new", label: "New", color: "bg-[#3b82f6]/10 text-[#3b82f6]" },
  { id: "at-risk", label: "At Risk", color: "bg-[#ef4444]/10 text-[#ef4444]" },
  { id: "wholesale", label: "Wholesale", color: "bg-[#8b5cf6]/10 text-[#8b5cf6]" },
] as const;

// ─── Helper Functions ────────────────────────────────────────────────────────

function getStepValidation(step: number, data: NewCustomerData): boolean {
  switch (step) {
    case 1:
      return data.firstName.trim().length > 0 && data.lastName.trim().length > 0;
    case 2:
      return data.phone.trim().length >= 6;
    default:
      return true;
  }
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function StepIndicator({ currentStep, data }: { currentStep: number; data: NewCustomerData }) {
  return (
    <div className="flex items-center justify-between px-2 md:px-4 py-3 md:py-4 bg-white border-b border-[#e2e8f0] overflow-x-auto scrollbar-hide">
      {WIZARD_STEPS.map((step, idx) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;
        const isValid = getStepValidation(step.id, data);
        const isLast = idx === WIZARD_STEPS.length - 1;

        return (
          <div key={step.id} className="flex items-center shrink-0">
            <div className="flex flex-col items-center gap-1 min-w-[60px] md:min-w-[72px]">
              <div
                className={`
                  w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center
                  text-[10px] md:text-xs font-bold transition-all duration-300
                  ${isActive
                    ? "bg-[#25D366] text-white shadow-md shadow-[#25D366]/25 scale-110"
                    : isCompleted
                      ? isValid
                        ? "bg-[#10b981] text-white"
                        : "bg-[#f59e0b] text-white"
                      : "bg-[#e2e8f0] text-[#94a3b8]"
                  }
                `}
              >
                {isCompleted && isValid ? (
                  <i className="fas fa-check text-[9px]" />
                ) : (
                  <i className={`fas ${step.icon}`} />
                )}
              </div>
              <span
                className={`
                  text-[8px] md:text-[9px] font-bold uppercase tracking-wider transition-colors
                  ${isActive ? "text-[#25D366]" : isCompleted ? "text-[#10b981]" : "text-[#94a3b8]"}
                `}
              >
                {step.label}
              </span>
              {step.required && (
                <span className="text-[7px] text-[#ef4444] font-bold">*</span>
              )}
            </div>
            {!isLast && (
              <div
                className={`
                  w-3 md:w-6 h-[2px] mx-0.5 md:mx-1 rounded-full transition-colors duration-300 shrink-0
                  ${isCompleted ? "bg-[#10b981]" : "bg-[#e2e8f0]"}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FormInput({
  label,
  name,
  value,
  onChange,
  error,
  icon,
  type = "text",
  placeholder,
  required = false,
  autoFocus = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  icon?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && error) {
      inputRef.current?.focus();
    }
  }, [autoFocus, error]);

  return (
    <div className="md3-input-outlined">
      {icon && (
        <i className={`fas ${icon} absolute left-4 top-1/2 -translate-y-1/2 text-sm z-10 ${error ? "text-[var(--md-sys-color-error)]" : "text-[var(--md-sys-color-on-surface-variant)]"} transition-colors`} />
      )}
      <input
        ref={inputRef}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder=" "
        className={`${icon ? 'pl-11' : 'pl-4'} pr-4 ${error ? 'input-error' : ''}`}
      />
      <label>
        {label}
        {required && <span className="text-[var(--md-sys-color-error)] ml-0.5">*</span>}
      </label>
      {error && (
        <div className="md3-input-error-text flex items-center gap-1">
          <i className="fas fa-exclamation-circle text-[10px]" />
          {error}
        </div>
      )}
    </div>
  );
}

function ToggleSwitch({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-[var(--md-sys-color-surface)] rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-all duration-200">
      <div className="min-w-0 mr-3">
        <div className="font-medium text-sm text-[var(--md-sys-color-on-surface)]">{label}</div>
        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">{description}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`
          relative w-14 h-8 rounded-full transition-colors duration-200 shrink-0
          ${checked ? "bg-[var(--md-sys-color-primary)]" : "bg-[var(--md-sys-color-outline)]"}
        `}
        aria-checked={checked}
        role="switch"
      >
        <div
          className={`
            absolute top-1 w-6 h-6 bg-white rounded-full shadow-md
            transition-transform duration-200
            ${checked ? "translate-x-7" : "translate-x-1"}
          `}
        />
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AddCustomerModal({ onClose, onSave, saving }: AddCustomerModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [newCustomerTag, setNewCustomerTag] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const [data, setData] = useState<NewCustomerData>({
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

  const updateField = useCallback(<K extends keyof NewCustomerData>(key: K, value: NewCustomerData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }, [formErrors]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setTouched((prev) => new Set(prev).add(name));

    if (type === "checkbox") {
      updateField(name as keyof NewCustomerData, checked as any);
    } else {
      updateField(name as keyof NewCustomerData, value as any);
    }
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!data.firstName.trim()) errors.firstName = "First name is required";
      if (!data.lastName.trim()) errors.lastName = "Last name is required";
    }

    if (step === 2) {
      if (!data.phone.trim()) {
        errors.phone = "WhatsApp number is required";
      } else {
        const cleanPhone = data.phone.replace(/[^0-9]/g, "");
        if (cleanPhone.length < 6) errors.phone = "Enter a valid number (min 6 digits)";
      }
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = "Enter a valid email address";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) return;
    setDirection("next");
    setCurrentStep((s) => Math.min(s + 1, WIZARD_STEPS.length));
  };

  const prevStep = () => {
    setDirection("prev");
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const handleSave = async () => {
    if (!validateStep(currentStep)) return;
    // Validate all required steps
    for (let i = 1; i <= 2; i++) {
      if (!getStepValidation(i, data)) {
        setCurrentStep(i);
        validateStep(i);
        return;
      }
    }
    await onSave(data);
  };

  const addTag = () => {
    const tag = newCustomerTag.trim();
    if (!tag) return;
    if (!data.tags.includes(tag)) {
      updateField("tags", [...data.tags, tag]);
    }
    setNewCustomerTag("");
  };

  const removeTag = (tag: string) => {
    updateField("tags", data.tags.filter((t) => t !== tag));
  };

  // ─── Render Steps ──────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormInput
          label="First Name"
          name="firstName"
          value={data.firstName}
          onChange={handleChange}
          error={formErrors.firstName}
          icon="fa-user"
          placeholder="John"
          required
          autoFocus
        />
        <FormInput
          label="Last Name"
          name="lastName"
          value={data.lastName}
          onChange={handleChange}
          error={formErrors.lastName}
          icon="fa-user"
          placeholder="Kamau"
          required
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-0">
          <label className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-2">
            WhatsApp Number <span className="text-[var(--md-sys-color-error)]">*</span>
          </label>
          <div className="flex gap-2">
            <div className="relative shrink-0 md3-input-outlined" style={{ minWidth: '110px' }}>
              <select
                name="countryCode"
                value={data.countryCode}
                onChange={handleChange}
                className="pl-3 pr-8 appearance-none cursor-pointer"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
              <label>Code</label>
              <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--md-sys-color-on-surface-variant)] pointer-events-none" />
            </div>
            <FormInput
              label=""
              name="phone"
              value={data.phone}
              onChange={handleChange}
              error={formErrors.phone}
              type="tel"
              placeholder="712 345 678"
            />
          </div>
          {formErrors.phone && (
            <p className="md3-input-error-text flex items-center gap-1">
              <i className="fas fa-exclamation-circle text-[10px]" />
              {formErrors.phone}
            </p>
          )}
        </div>

        <FormInput
          label="Email Address"
          name="email"
          value={data.email}
          onChange={handleChange}
          error={formErrors.email}
          icon="fa-envelope"
          type="email"
          placeholder="john@example.com"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CUSTOMER_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => updateField("customerType", type.id)}
            className={`
              relative p-5 rounded-xl border-2 text-center transition-all duration-200
              ${data.customerType === type.id
                ? "border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] shadow-md"
                : "border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:border-[var(--md-sys-color-outline)]"
              }
            `}
          >
            {data.customerType === type.id && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--md-sys-color-primary)] rounded-full flex items-center justify-center shadow-sm">
                <i className="fas fa-check text-white text-xs" />
              </div>
            )}
            <div className={`
              w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center
              bg-gradient-to-br ${type.color}
            `}>
              <i className={`fas ${type.icon} text-lg ${data.customerType === type.id ? "text-[var(--md-sys-color-primary)]" : "text-[var(--md-sys-color-on-surface-variant)]"}`} />
            </div>
            <div className="font-medium text-sm text-[var(--md-sys-color-on-surface)]">{type.label}</div>
            <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">{type.desc}</div>
          </button>
        ))}
      </div>

      {data.customerType === "business" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Company Name"
            name="companyName"
            value={data.companyName}
            onChange={handleChange}
            icon="fa-building"
            placeholder="ABC Ltd"
          />
          <FormInput
            label="Business Registration"
            name="businessReg"
            value={data.businessReg}
            onChange={handleChange}
            icon="fa-certificate"
            placeholder="BRN-123456"
          />
          <FormInput
            label="Tax ID"
            name="taxId"
            value={data.taxId}
            onChange={handleChange}
            icon="fa-file-invoice"
            placeholder="TIN-789012"
          />
          <FormInput
            label="Industry"
            name="industry"
            value={data.industry}
            onChange={handleChange}
            icon="fa-industry"
            placeholder="Technology"
          />
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="flex gap-2 mb-3">
        {ADDRESS_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => updateField("addressType", type.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium
              transition-all duration-200
              ${data.addressType === type.id
                ? "border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)]"
                : "border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] hover:border-[var(--md-sys-color-outline)]"
              }
            `}
          >
            <i className={`fas ${type.icon}`} />
            {type.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <FormInput
            label="Street Address"
            name="address"
            value={data.address}
            onChange={handleChange}
            icon="fa-map-marker-alt"
            placeholder="123 Kimathi Street"
          />
        </div>
        <FormInput
          label="City"
          name="city"
          value={data.city}
          onChange={handleChange}
          icon="fa-city"
          placeholder="Nairobi"
        />
        <FormInput
          label="State/County"
          name="state"
          value={data.state}
          onChange={handleChange}
          icon="fa-map"
          placeholder="Nairobi County"
        />
        <FormInput
          label="Postal Code"
          name="postalCode"
          value={data.postalCode}
          onChange={handleChange}
          icon="fa-mail-bulk"
          placeholder="00100"
        />
        <div className="md3-input-outlined">
          <select
            name="country"
            value={data.country}
            onChange={handleChange}
            className="pl-4 pr-10 appearance-none cursor-pointer"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
          <label>Country</label>
          <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--md-sys-color-on-surface-variant)] pointer-events-none" />
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        <label className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">Customer Segment</label>
        <div className="flex flex-wrap gap-2">
          {SEGMENTS.map((seg) => (
            <button
              key={seg.id}
              type="button"
              onClick={() => updateField("segment", data.segment === seg.id ? "" : seg.id)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all duration-200
                ${data.segment === seg.id
                  ? `${seg.color} border-current`
                  : "bg-[var(--md-sys-color-surface)] border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] hover:border-[var(--md-sys-color-outline)]"
                }
              `}
            >
              {seg.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">Tags</label>
        <div className="flex flex-wrap gap-2 min-h-[32px]">
          {data.tags.map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-full text-xs font-medium shadow-sm hover:shadow-md transition-all"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors"
              >
                <i className="fas fa-times text-[8px]" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCustomerTag}
            onChange={(e) => setNewCustomerTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            className="flex-1 px-4 py-3 rounded-lg border border-[var(--md-sys-color-outline)] text-sm font-medium focus:border-[var(--md-sys-color-primary)] focus:outline-none placeholder:text-[var(--md-sys-color-on-surface-variant)]"
            placeholder="Add tags (VIP, Bulk Buyer...)"
          />
          <button
            type="button"
            onClick={addTag}
            disabled={!newCustomerTag.trim()}
            className="px-4 py-3 bg-[var(--md-sys-color-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--md-sys-color-primary-dark)] disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <i className="fas fa-plus" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        <ToggleSwitch
          label="Order Updates via WhatsApp"
          description="Send order confirmations and shipping updates"
          checked={data.orderUpdates}
          onChange={(v) => updateField("orderUpdates", v)}
        />
        <ToggleSwitch
          label="Promotional Messages"
          description="Send offers, discounts, and new arrivals"
          checked={data.promotions}
          onChange={(v) => updateField("promotions", v)}
        />
        <ToggleSwitch
          label="Abandoned Cart Reminders"
          description="Remind about items left in cart"
          checked={data.abandonedCart}
          onChange={(v) => updateField("abandonedCart", v)}
        />
      </div>

      <div className="md3-input-outlined">
        <textarea
          name="notes"
          value={data.notes}
          onChange={handleChange}
          rows={3}
          className="pl-4 pr-4 resize-none"
        />
        <label>Additional Notes</label>
      </div>
    </div>
  );

  // ─── Main Render ───────────────────────────────────────────────────────────

  const canProceed = getStepValidation(currentStep, data);
  const isLastStep = currentStep === WIZARD_STEPS.length;

  return (
    <div
      className="fixed inset-0 md3-dialog-backdrop z-[2500] flex items-start justify-center p-3 md:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="md3-dialog w-full max-w-sm md:max-w-2xl my-2 md:my-8 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - MD3 Dialog Header */}
        <div className="sticky top-0 z-10 bg-[var(--md-sys-color-surface)]">
          <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--md-sys-color-outline-variant)]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white shadow-lg">
                <i className="fas fa-user-plus text-lg" />
              </div>
              <div>
                <h2 className="text-xl font-normal text-[var(--md-sys-color-on-surface)] leading-tight">Add New Customer</h2>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">Step {currentStep} of {WIZARD_STEPS.length}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={saving}
              className="w-10 h-10 rounded-full bg-transparent text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-all duration-200 active:scale-95"
            >
              <i className="fas fa-times" />
            </button>
          </div>

          <StepIndicator currentStep={currentStep} data={data} />
        </div>

        {/* Body - MD3 Dialog Content */}
        <div className="md3-dialog-content">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
          {currentStep === 6 && renderStep6()}
        </div>

        {/* Footer - MD3 Dialog Actions */}
        <div className="md3-dialog-actions">
          <span className="flex-1 text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium">
            <span className="text-[var(--md-sys-color-error)]">*</span> Required fields
          </span>

          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                disabled={saving}
                className="md3-btn-text"
              >
                Back
              </button>
            )}

            {!isLastStep ? (
              <button
                onClick={nextStep}
                disabled={!canProceed || saving}
                className={`md3-btn-filled ${!canProceed ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className={`md3-btn-filled ${saving ? 'opacity-50 cursor-wait' : ''} flex items-center gap-2`}
              >
                {saving ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin text-sm" />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save text-sm" />
                    Save Customer
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}