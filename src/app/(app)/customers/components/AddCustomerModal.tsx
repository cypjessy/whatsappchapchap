"use client";

import { useState, useRef, useEffect, forwardRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewCustomerData {
  firstName: string;
  lastName: string;
  phone: string;
  status: "new" | "active" | "vip" | "inactive";
  location: string;
}

interface AddCustomerModalProps {
  onClose: () => void;
  onSave: (customer: NewCustomerData) => Promise<void>;
  saving: boolean;
}

// ─── Gradient pool for the live avatar ────────────────────────────────────────

const AVATAR_GRADIENTS = [
  "from-[#667eea] to-[#764ba2]",
  "from-[#f093fb] to-[#f5576c]",
  "from-[#4facfe] to-[#00f2fe]",
  "from-[#43e97b] to-[#38f9d7]",
  "from-[#fa709a] to-[#fee140]",
  "from-[#a18cd1] to-[#fbc2eb]",
  "from-[#fccb90] to-[#d57eeb]",
  "from-[#e0c3fc] to-[#8ec5fc]",
];

function getGradient(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LiveAvatar({ firstName, lastName }: { firstName: string; lastName: string }) {
  const initials = `${firstName.charAt(0) || "?"}${lastName.charAt(0) || "?"}`.toUpperCase();
  const seed = `${firstName}${lastName}`.trim() || "?";
  const gradient = getGradient(seed);
  const fullName = `${firstName} ${lastName}`.trim() || "New Customer";

  return (
    <div className="flex flex-col items-center gap-4 py-6 md:py-8">
      <div className="relative group">
        <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-indigo-400/20 to-violet-400/20 blur-xl animate-pulse" />
        <div
          className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl md:text-3xl font-bold text-white shadow-2xl transition-all duration-300 group-hover:scale-105`}
        >
          {initials}
        </div>
      </div>
      <div className="text-center">
        <h3 className="text-xl font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">
          {fullName}
        </h3>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-0.5 font-medium flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          New Customer
        </p>
      </div>
    </div>
  );
}

function FieldGroup({ label, children, accent = false }: { label: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`${accent ? "modal-card-accent p-4" : "p-4"}`}>
      <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--md-sys-color-on-surface-variant)] mb-3">
        {label}
      </label>
      {children}
    </div>
  );
}

const PillInput = forwardRef<HTMLInputElement, {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  type?: string;
}>(({ value, onChange, placeholder, onKeyDown, type = "text" }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className="
        w-full px-3 py-2 bg-[var(--md-sys-color-surface)] rounded-xl text-sm font-medium
        text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-outline)]
        border border-[var(--md-sys-color-outline-variant)]
        focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30
        transition-all duration-200
      "
    />
  );
});
PillInput.displayName = "PillInput";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AddCustomerModal({ onClose, onSave, saving }: AddCustomerModalProps) {
  const [data, setData] = useState<NewCustomerData>({
    firstName: "",
    lastName: "",
    phone: "",
    status: "new",
    location: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => firstNameRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const updateField = (key: keyof NewCustomerData, value: string | string[]) => {
    setData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!data.firstName.trim()) errs.firstName = "Required";
    if (!data.lastName.trim()) errs.lastName = "Required";
    const clean = data.phone.replace(/[^0-9]/g, "");
    if (!clean) errs.phone = "Required";
    else if (clean.length < 6) errs.phone = "Min 6 digits";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    await onSave(data);
  };

  // ─── Status toggle ──────────────────────────────────────────────────────
  const STATUS_OPTIONS: { key: NewCustomerData["status"]; label: string; color: string }[] = [
    { key: "new",     label: "New",     color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400" },
    { key: "active",  label: "Active",  color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400" },
    { key: "vip",     label: "VIP",     color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400" },
  ];

  return (
    <div
      className="fixed inset-0 z-[2500] flex items-center justify-center p-3 md:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div
        className="relative w-full max-w-md bg-[var(--md-sys-color-surface-container)] rounded-3xl shadow-2xl border border-white/10 flex flex-col max-h-[90vh] overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md">
              <i className="fas fa-user-plus text-xs" />
            </div>
            <span className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">Add Customer</span>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)] transition-all active:scale-90"
          >
            <i className="fas fa-times text-sm" />
          </button>
        </div>

        {/* ─── Live Avatar Preview ──────────────────────────────────────── */}
        <LiveAvatar firstName={data.firstName} lastName={data.lastName} />

        {/* ─── Scrollable form body ─────────────────────────────────────── */}
        <div className="px-5 pb-5 space-y-3 overflow-y-auto">
          {/* Identity */}
          <FieldGroup label="Identity" accent>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <PillInput
                  ref={firstNameRef}
                  value={data.firstName}
                  onChange={(v) => updateField("firstName", v)}
                  placeholder="First"
                />
                {errors.firstName && (
                  <p className="text-[10px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                    <i className="fas fa-circle text-[4px]" />{errors.firstName}
                  </p>
                )}
              </div>
              <div>
                <PillInput
                  value={data.lastName}
                  onChange={(v) => updateField("lastName", v)}
                  placeholder="Last"
                />
                {errors.lastName && (
                  <p className="text-[10px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                    <i className="fas fa-circle text-[4px]" />{errors.lastName}
                  </p>
                )}
              </div>
            </div>
          </FieldGroup>

          {/* Status */}
          <FieldGroup label="Status" accent>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => updateField("status", opt.key)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all duration-200 active:scale-95 ${
                    data.status === opt.key
                      ? `${opt.color} shadow-sm`
                      : "border-transparent text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-variant)]/40 hover:bg-[var(--md-sys-color-surface-variant)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </FieldGroup>

          {/* Contact */}
          <FieldGroup label="Contact" accent>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-indigo-500 shrink-0">+254</span>
                <PillInput
                  value={data.phone}
                  onChange={(v) => updateField("phone", v.replace(/[^0-9]/g, ""))}
                  placeholder="712 345 678"
                />
              </div>
              {errors.phone && (
                <p className="text-[10px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                  <i className="fas fa-circle text-[4px]" />{errors.phone}
                </p>
              )}
            </div>
          </FieldGroup>

          {/* Location */}
          <FieldGroup label="Location" accent>
            <PillInput
              value={data.location}
              onChange={(v) => updateField("location", v)}
              placeholder="Nairobi, Kenya"
            />
          </FieldGroup>
        </div>

        {/* ─── Footer ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] rounded-b-3xl">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)] transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="
              px-6 py-2.5 rounded-xl font-bold text-sm text-white
              bg-gradient-to-r from-indigo-500 to-violet-500
              hover:from-indigo-600 hover:to-violet-600
              shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40
              transition-all duration-200 active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center gap-2
            "
          >
            {saving ? (
              <><i className="fas fa-circle-notch fa-spin text-sm" />Saving...</>
            ) : (
              <><i className="fas fa-sparkles text-sm" />Create Customer</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
