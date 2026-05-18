"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import './PaymentMethods.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentMethod {
  id: string;
  name: string;
  details: string;
  icon: string;
  color: string;
}

interface PaymentMethodsProps {
  paymentMethods: PaymentMethod[] | null;
  paymentMethod: string;
  setPaymentMethod: (value: string) => void;
  paymentDetails: string;
  setPaymentDetails: (value: string) => void;
  paymentNotes: string;
  setPaymentNotes: (value: string) => void;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getPaymentLabel(methodId: string): string {
  if (methodId.startsWith("mpesa")) return "M-Pesa Payment Instructions";
  if (methodId === "bank") return "Bank Transfer Details";
  if (methodId === "cod") return "Cash on Delivery";
  return "Payment Instructions";
}

function getPaymentPlaceholder(methodId: string): string {
  if (methodId === "mpesa") return "Enter M-Pesa transaction ID";
  if (methodId === "bank") return "Enter transaction/reference number";
  return "Enter payment reference";
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ShimmerMethod() {
  return (
    <div className="relative overflow-hidden p-3.5 md:p-4 rounded-xl border border-[#e2e8f0] bg-white">
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#f1f5f9] shrink-0" />
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#f1f5f9] shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-[#f1f5f9] rounded-lg w-28" />
          <div className="h-3 bg-[#f1f5f9] rounded-lg w-full" />
        </div>
      </div>
    </div>
  );
}

function PaymentMethodCard({
  option,
  isSelected,
  index,
  onSelect,
}: {
  option: PaymentMethod;
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
      {/* Radio */}
      <div
        className={`
          w-5 h-5 md:w-6 md:h-6 rounded-full border-2 shrink-0 flex items-center justify-center
          transition-all duration-200
          ${isSelected ? "border-[#25D366] bg-[#25D366]" : "border-[#e2e8f0] bg-white"}
        `}
      >
        <div
          className={`
            w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-white transition-transform duration-200
            ${isSelected ? "scale-100" : "scale-0"}
          `}
        />
      </div>

      {/* Icon */}
      <div
        className={`
          w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0
          transition-all duration-200
          ${isSelected ? "shadow-md" : ""}
        `}
        style={{ backgroundColor: option.color || "#64748b" }}
      >
        <i className={`fas ${option.icon || "fa-money-bill-wave"} text-white text-base md:text-xl`} />
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
        <p className="text-xs md:text-sm text-[#64748b] mt-0.5 whitespace-pre-wrap line-clamp-2">
          {option.details}
        </p>
      </div>
    </div>
  );
}

function PaymentDetailsPanel({
  methodId,
  details,
  paymentDetails,
  setPaymentDetails,
  paymentNotes,
  setPaymentNotes,
}: {
  methodId: string;
  details: string;
  paymentDetails: string;
  setPaymentDetails: (v: string) => void;
  paymentNotes: string;
  setPaymentNotes: (v: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [detailsFocused, setDetailsFocused] = useState(false);
  const [notesFocused, setNotesFocused] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(details);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [details]);

  return (
    <div
      className={`
        mt-4 p-4 md:p-5 rounded-xl border-2 border-[#e2e8f0] bg-[#f8fafc]
        transition-all duration-300 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#25D366]/10 flex items-center justify-center">
            <i className="fas fa-info-circle text-[#25D366] text-xs" />
          </div>
          <h3 className="font-bold text-sm md:text-base text-[#1e293b]">
            {getPaymentLabel(methodId)}
          </h3>
        </div>
        <button
          onClick={handleCopy}
          className={`
            flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] md:text-xs font-bold
            transition-all duration-200 active:scale-95
            ${copied
              ? "bg-[#10b981]/10 text-[#10b981]"
              : "bg-white border border-[#e2e8f0] text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6]"
            }
          `}
        >
          <i className={`fas ${copied ? "fa-check" : "fa-copy"} text-[10px]`} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {/* Instructions */}
      <div className="p-3 md:p-4 rounded-lg bg-white border border-[#e2e8f0] mb-4">
        <p className="text-xs md:text-sm text-[#64748b] whitespace-pre-wrap leading-relaxed">
          {details || "Payment instructions not available"}
        </p>
      </div>

      {/* Payment Details Input */}
      <div className="mb-3">
        <label className="block text-xs md:text-sm font-bold text-[#1e293b] mb-2">
          Enter Payment Details <span className="text-[#ef4444]">*</span>
        </label>
        <div
          className={`
            relative flex items-center rounded-xl border-2 transition-all duration-200 bg-white
            ${detailsFocused
              ? "border-[#8b5cf6] shadow-md shadow-[#8b5cf6]/10"
              : "border-[#e2e8f0] hover:border-[#cbd5e1]"
            }
          `}
        >
          <i
            className={`
              fas fa-receipt absolute left-3 text-sm transition-colors
              ${detailsFocused ? "text-[#8b5cf6]" : "text-[#94a3b8]"}
            `}
          />
          <input
            type="text"
            value={paymentDetails}
            onChange={(e) => setPaymentDetails(e.target.value)}
            onFocus={() => setDetailsFocused(true)}
            onBlur={() => setDetailsFocused(false)}
            placeholder={getPaymentPlaceholder(methodId)}
            className="w-full pl-10 pr-4 py-2.5 md:py-3 bg-transparent text-sm md:text-base outline-none rounded-xl placeholder:text-[#94a3b8]"
          />
        </div>
      </div>

      {/* Notes Input */}
      <div>
        <label className="block text-xs md:text-sm font-bold text-[#1e293b] mb-2">
          Payment Notes <span className="text-[#94a3b8] font-normal">(Optional)</span>
        </label>
        <div
          className={`
            relative rounded-xl border-2 transition-all duration-200 bg-white
            ${notesFocused
              ? "border-[#8b5cf6] shadow-md shadow-[#8b5cf6]/10"
              : "border-[#e2e8f0] hover:border-[#cbd5e1]"
            }
          `}
        >
          <textarea
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            onFocus={() => setNotesFocused(true)}
            onBlur={() => setNotesFocused(false)}
            placeholder="Add a message about your payment (optional)"
            rows={2}
            className="w-full px-4 py-2.5 md:py-3 bg-transparent text-sm md:text-base outline-none rounded-xl resize-none placeholder:text-[#94a3b8]"
          />
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 md:py-10 text-[#64748b] animate-fadeIn">
      <div className="w-10 h-10 md:w-12 md:h-12 border-2 border-[#8b5cf6]/30 border-t-[#8b5cf6] rounded-full animate-spin mb-3" />
      <p className="text-sm font-medium">Loading payment methods...</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 md:py-10 text-[#64748b] animate-fadeIn">
      <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#fef3c7] flex items-center justify-center mb-3">
        <i className="fas fa-info-circle text-xl md:text-2xl text-[#f59e0b]" />
      </div>
      <p className="font-bold text-sm md:text-base text-[#475569]">No payment methods configured</p>
      <p className="text-xs md:text-sm text-[#94a3b8] mt-1">Please contact the seller</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PaymentMethods({
  paymentMethods,
  paymentMethod,
  setPaymentMethod,
  paymentDetails,
  setPaymentDetails,
  paymentNotes,
  setPaymentNotes,
}: PaymentMethodsProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const selectedMethod = paymentMethods?.find((p) => p.id === paymentMethod);
  const showDetails = paymentMethod !== "cod" && paymentMethods && selectedMethod;

  return (
    <div
      className={`
        p-4 md:p-6 border-b border-[#e2e8f0] transition-all duration-500
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4 md:mb-5">
        <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-gradient-to-br from-[#25D366]/10 to-[#8b5cf6]/10 flex items-center justify-center">
          <i className="fas fa-credit-card text-[#8b5cf6] text-sm" />
        </div>
        <h2 className="text-base md:text-lg font-extrabold text-[#1e293b]">Payment Method</h2>
      </div>

      {/* Content */}
      {!paymentMethods ? (
        <LoadingState />
      ) : paymentMethods.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Method List */}
          <div className="space-y-2.5 md:space-y-3">
            {paymentMethods.map((option, index) => (
              <PaymentMethodCard
                key={option.id}
                option={option}
                isSelected={paymentMethod === option.id}
                index={index}
                onSelect={() => setPaymentMethod(option.id)}
              />
            ))}
          </div>

          {/* Details Panel */}
          {showDetails && (
            <PaymentDetailsPanel
              methodId={paymentMethod}
              details={selectedMethod.details}
              paymentDetails={paymentDetails}
              setPaymentDetails={setPaymentDetails}
              paymentNotes={paymentNotes}
              setPaymentNotes={setPaymentNotes}
            />
          )}
        </>
      )}
    </div>
  );
}