"use client";

import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PickupStation {
  id: string;
  county: string;
  town: string;
  stationName: string;
  address: string;
  contactPhone?: string;
  operatingHours?: string;
  description?: string;
}

interface CustomerDetailsProps {
  customerName: string;
  setCustomerName: (value: string) => void;
  customerPhone: string;
  setCustomerPhone: (value: string) => void;
  customerEmail: string;
  setCustomerEmail: (value: string) => void;
  pickupStations: PickupStation[];
  selectedCounty: string;
  setSelectedCounty: (value: string) => void;
  selectedTown: string;
  setSelectedTown: (value: string) => void;
  selectedStation: string;
  setSelectedStation: (value: string) => void;
  errors: Record<string, boolean>;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function FloatingInput({
  id,
  type,
  value,
  onChange,
  label,
  placeholder,
  error,
  errorMessage,
  helperText,
  required = false,
}: {
  id: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  error?: boolean;
  errorMessage?: string;
  helperText?: string;
  required?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;

  return (
    <div className="mb-4 md:mb-5">
      <div className="relative">
        <input
          type={type}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder || " "}
          className={`
            w-full px-4 py-3 md:py-3.5 rounded-xl text-sm md:text-base
            border-2 outline-none bg-white transition-all duration-200
            ${error
              ? "border-[#ef4444] focus:border-[#ef4444] bg-[#fef2f2]"
              : isFocused
                ? "border-[#8b5cf6] shadow-md shadow-[#8b5cf6]/10"
                : "border-outline-variant hover:border-outline-variant"
            }
            ${hasValue || isFocused ? "pt-5 pb-2" : "py-3 md:py-3.5"}
          `}
        />
        <label
          htmlFor={id}
          className={`
            absolute left-4 transition-all duration-200 pointer-events-none
            ${hasValue || isFocused
              ? "top-1 text-[10px] md:text-xs font-bold text-[#8b5cf6]"
              : "top-1/2 -translate-y-1/2 text-sm md:text-base text-outline"
            }
            ${error && (hasValue || isFocused) ? "text-[#ef4444]" : ""}
          `}
        >
          {label}
          {required && <span className="text-[#ef4444] ml-0.5">*</span>}
        </label>
      </div>

      {helperText && !error && (
        <p className="text-[11px] md:text-xs text-on-surface-variant mt-1.5 flex items-center gap-1">
          <i className="fas fa-info-circle text-[10px] text-outline" />
          {helperText}
        </p>
      )}

      {error && errorMessage && (
        <p className="text-xs md:text-sm text-[#ef4444] mt-1.5 flex items-center gap-1.5 animate-shake">
          <i className="fas fa-exclamation-circle" />
          {errorMessage}
        </p>
      )}
    </div>
  );
}

function SelectDropdown({
  value,
  onChange,
  options,
  placeholder,
  error,
  errorMessage,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  error?: boolean;
  errorMessage?: string;
  disabled?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="mb-3">
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          className={`
            w-full px-4 py-3 md:py-3.5 rounded-xl text-sm md:text-base appearance-none
            border-2 outline-none bg-white transition-all duration-200 cursor-pointer
            ${error
              ? "border-[#ef4444] bg-[#fef2f2]"
              : isFocused
                ? "border-[#8b5cf6] shadow-md shadow-[#8b5cf6]/10"
                : "border-outline-variant hover:border-outline-variant"
            }
            ${disabled ? "opacity-50 cursor-not-allowed bg-surface-container-lowest" : ""}
          `}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <i className={`
          fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-xs
          transition-colors duration-200 pointer-events-none
          ${isFocused ? "text-[#8b5cf6]" : "text-outline"}
        `} />
      </div>
      {error && errorMessage && (
        <p className="text-xs md:text-sm text-[#ef4444] mt-1.5 flex items-center gap-1.5 animate-shake">
          <i className="fas fa-exclamation-circle" />
          {errorMessage}
        </p>
      )}
    </div>
  );
}

function StationCard({ station }: { station: PickupStation }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  return (
    <div className={`
      mt-3 p-3 md:p-4 rounded-xl border border-[#86efac] bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7]
      transition-all duration-300
      ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
    `}>
      <div className="flex items-start gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 flex items-center justify-center shrink-0">
          <i className="fas fa-map-marker-alt text-[#10b981] text-sm" />
        </div>
        <div>
          <p className="font-bold text-sm text-[#166534]">{station.stationName}</p>
          <p className="text-xs text-[#15803d] mt-0.5">{station.address}</p>
        </div>
      </div>

      <div className="space-y-1.5 ml-10.5">
        {station.contactPhone && (
          <p className="text-xs md:text-sm text-[#166534] flex items-center gap-2">
            <i className="fas fa-phone text-[10px] text-[#10b981]" />
            {station.contactPhone}
          </p>
        )}
        {station.operatingHours && (
          <p className="text-xs md:text-sm text-[#166534] flex items-center gap-2">
            <i className="fas fa-clock text-[10px] text-[#10b981]" />
            {station.operatingHours}
          </p>
        )}
        {station.description && (
          <p className="text-xs text-[#15803d] italic mt-2 pt-2 border-t border-[#86efac]/50">
            {station.description}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CustomerDetails({
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  customerEmail,
  setCustomerEmail,
  pickupStations,
  selectedCounty,
  setSelectedCounty,
  selectedTown,
  setSelectedTown,
  selectedStation,
  setSelectedStation,
  errors,
}: CustomerDetailsProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // Derived data
  const counties = [...new Set(pickupStations.map((s) => s.county))];
  const towns = selectedCounty
    ? [...new Set(pickupStations.filter((s) => s.county === selectedCounty).map((s) => s.town))]
    : [];
  const stations = selectedTown
    ? pickupStations.filter((s) => s.county === selectedCounty && s.town === selectedTown)
    : [];

  const selectedStationData = pickupStations.find((s) => s.id === selectedStation);

  return (
    <div className={`
      p-4 md:p-6 border-b border-outline-variant transition-all duration-500
      ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 md:mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-gradient-to-br from-[#8b5cf6]/10 to-[#7c3aed]/10 flex items-center justify-center">
            <i className="fas fa-truck text-[#8b5cf6] text-sm" />
          </div>
          <h2 className="text-base md:text-lg font-extrabold text-on-surface">Delivery Details</h2>
        </div>
        <span className="text-xs md:text-sm text-on-surface-variant font-medium hidden sm:inline">
          Where should we deliver?
        </span>
      </div>

      {/* Name */}
      <FloatingInput
        id="customerName"
        type="text"
        value={customerName}
        onChange={setCustomerName}
        label="Full Name"
        error={errors.name}
        errorMessage="Please enter your full name"
        required
      />

      {/* Phone */}
      <FloatingInput
        id="customerPhone"
        type="tel"
        value={customerPhone}
        onChange={setCustomerPhone}
        label="WhatsApp Number"
        helperText="We'll send order updates via WhatsApp"
        error={errors.phone}
        errorMessage="Please enter your phone number"
        required
      />

      {/* Pickup Location - County / Town / Station dropdowns */}
      <div className="mb-4 md:mb-5">
        <label className="block text-xs md:text-sm font-bold text-on-surface mb-2.5 uppercase tracking-wider">
          Delivery Location <span className="text-[#ef4444]">*</span>
        </label>

        <SelectDropdown
          value={selectedCounty}
          onChange={(value) => {
            setSelectedCounty(value);
            setSelectedTown("");
            setSelectedStation("");
          }}
          options={counties.map((c) => ({ value: c, label: c }))}
          placeholder="Select County"
          error={errors.address && !selectedCounty}
        />

        {selectedCounty && (
          <div className={`
            transition-all duration-300 ease-out
            ${selectedCounty ? "opacity-100 max-h-40" : "opacity-0 max-h-0"}
          `}>
            <SelectDropdown
              value={selectedTown}
              onChange={(value) => {
                setSelectedTown(value);
                setSelectedStation("");
              }}
              options={towns.map((t) => ({ value: t, label: t }))}
              placeholder="Select Town"
              error={errors.address && !selectedTown}
            />
          </div>
        )}

        {selectedTown && (
          <div className={`
            transition-all duration-300 ease-out
            ${selectedTown ? "opacity-100 max-h-40" : "opacity-0 max-h-0"}
          `}>
            <SelectDropdown
              value={selectedStation}
              onChange={setSelectedStation}
              options={stations.map((s) => ({
                value: s.id,
                label: `${s.stationName} - ${s.address}`,
              }))}
              placeholder="Select Pickup Station"
              error={errors.address && !selectedStation}
              errorMessage="Please select a pickup location"
            />
          </div>
        )}

        {selectedStationData && <StationCard station={selectedStationData} />}
      </div>

      {/* Email */}
      <FloatingInput
        id="customerEmail"
        type="email"
        value={customerEmail}
        onChange={setCustomerEmail}
        label="Email"
        placeholder="john@example.com"
        helperText="Optional - for order receipts"
      />
    </div>
  );
}