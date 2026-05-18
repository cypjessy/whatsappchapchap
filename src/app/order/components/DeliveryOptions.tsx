"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShippingMethod {
  id: string;
  name: string;
  price: number;
  estimatedDays?: string;
}

interface DeliveryOptionsProps {
  shippingMethods: ShippingMethod[];
  deliveryMethod: string;
  setDeliveryMethod: (value: string) => void;
  setDeliveryCost: (value: number) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_METHODS: ShippingMethod[] = [
  { id: "standard", name: "Standard Delivery", price: 500, estimatedDays: "2-3 days" },
  { id: "express", name: "Express Delivery", price: 1000, estimatedDays: "Same day" },
  { id: "pickup", name: "Store Pickup", price: 0, estimatedDays: "Same day" },
];

const METHOD_ICONS: Record<string, string> = {
  pickup: "fa-store",
  express: "fa-shipping-fast",
  standard: "fa-truck",
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getMethodIcon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("pickup")) return METHOD_ICONS.pickup;
  if (lower.includes("express")) return METHOD_ICONS.express;
  return METHOD_ICONS.standard;
}

function getMethodDescription(name: string, estimatedDays?: string): string {
  if (estimatedDays) return estimatedDays;
  const lower = name.toLowerCase();
  if (lower.includes("pickup")) return "Available today after 2PM";
  if (lower.includes("express")) return "1-2 business days";
  return "3-5 business days";
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function MethodCard({
  option,
  isSelected,
  index,
  onSelect,
}: {
  option: ShippingMethod;
  isSelected: boolean;
  index: number;
  onSelect: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  const icon = getMethodIcon(option.name);
  const description = getMethodDescription(option.name, option.estimatedDays);
  const isFree = option.price === 0;

  return (
    <div
      className={`
        relative flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl cursor-pointer
        border-2 transition-all duration-200 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}
        ${isSelected
          ? "border-[#25D366] bg-[rgba(37,211,102,0.05)] shadow-md shadow-[#25D366]/10"
          : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1] hover:shadow-sm"
        }
        ${isPressed ? "scale-[0.98]" : "scale-100"}
        ${isSelected && !isPressed ? "-translate-y-0.5" : "translate-y-0"}
      `}
      style={{ transitionDelay: `${index * 100}ms` }}
      onClick={onSelect}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
    >
      {/* Radio Button */}
      <div className={`
        w-5 h-5 md:w-6 md:h-6 rounded-full border-2 shrink-0 flex items-center justify-center
        transition-all duration-200
        ${isSelected
          ? "border-[#25D366] bg-[#25D366]"
          : "border-[#e2e8f0] bg-white"
        }
      `}>
        <div className={`
          w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-white transition-transform duration-200
          ${isSelected ? "scale-100" : "scale-0"}
        `} />
      </div>

      {/* Icon */}
      <div className={`
        w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0
        transition-all duration-200
        ${isSelected
          ? "bg-[#25D366]/10 text-[#25D366]"
          : "bg-[#f8fafc] text-[#94a3b8]"
        }
      `}>
        <i className={`fas ${icon} text-base md:text-xl`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm md:text-base text-[#1e293b] truncate">
            {option.name}
          </span>
          {isSelected && (
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#25D366]/10 text-[#25D366] text-[9px] font-bold uppercase tracking-wider">
              Selected
            </span>
          )}
        </div>
        <p className="text-xs md:text-sm text-[#64748b] mt-0.5 truncate">
          {description}
        </p>
      </div>

      {/* Price */}
      <div className="text-right shrink-0 ml-2">
        <span className={`
          font-extrabold text-sm md:text-lg
          ${isFree ? "text-[#10b981]" : "text-[#25D366]"}
        `}>
          {isFree ? "FREE" : `KES ${option.price.toLocaleString()}`}
        </span>
        {isFree && (
          <p className="text-[9px] md:text-[10px] text-[#10b981] font-semibold uppercase tracking-wider">
            No charge
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DeliveryOptions({
  shippingMethods,
  deliveryMethod,
  setDeliveryMethod,
  setDeliveryCost,
}: DeliveryOptionsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const methods = shippingMethods.length > 0 ? shippingMethods : DEFAULT_METHODS;

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleSelect = useCallback((method: ShippingMethod) => {
    setDeliveryMethod(method.id);
    setDeliveryCost(method.price);
  }, [setDeliveryMethod, setDeliveryCost]);

  return (
    <div className={`
      p-4 md:p-6 border-b border-[#e2e8f0] transition-all duration-500
      ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
    `}>
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4 md:mb-5">
        <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10 flex items-center justify-center">
          <i className="fas fa-shipping-fast text-[#25D366] text-sm" />
        </div>
        <h2 className="text-base md:text-lg font-extrabold text-[#1e293b]">Delivery Method</h2>
      </div>

      {/* Options */}
      <div className="space-y-2.5 md:space-y-3">
        {methods.map((option, index) => (
          <MethodCard
            key={option.id}
            option={option}
            isSelected={deliveryMethod === option.id}
            index={index}
            onSelect={() => handleSelect(option)}
          />
        ))}
      </div>
    </div>
  );
}