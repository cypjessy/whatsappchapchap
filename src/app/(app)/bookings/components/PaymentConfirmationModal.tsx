"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Booking, Order } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";
import { useAuth } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentConfirmationModalProps {
  item: Booking | Order | null;
  itemType: "booking" | "order";
  open: boolean;
  onClose: () => void;
  onConfirm?: (itemId: string, paymentProof: PaymentProof) => Promise<void>;
}

interface PaymentProof {
  method: string;
  transactionId?: string;
  amount: number;
  paidAt: Date;
  confirmedBy: string;
  confirmedAt: Date;
  proofImage?: string;
  notes?: string;
}

type PaymentMethod = "mpesa" | "cash" | "card" | "bank" | "other";

interface MethodConfig {
  value: PaymentMethod;
  label: string;
  icon: string;
  color: string;
  bg: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const PAYMENT_METHODS: MethodConfig[] = [
  { value: "mpesa", label: "M-Pesa", icon: "fa-mobile-alt", color: "text-[#10b981]", bg: "bg-[#10b981]/10" },
  { value: "cash", label: "Cash", icon: "fa-money-bill-wave", color: "text-[#3b82f6]", bg: "bg-[#3b82f6]/10" },
  { value: "card", label: "Card", icon: "fa-credit-card", color: "text-[#8b5cf6]", bg: "bg-[#8b5cf6]/10" },
  { value: "bank", label: "Bank", icon: "fa-university", color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10" },
  { value: "other", label: "Other", icon: "fa-ellipsis-h", color: "text-[#64748b]", bg: "bg-[#64748b]/10" },
];

// ─── Sub-Components ───────────────────────────────────────────────────────────

function SuccessOverlay({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(100), 50);
    const closeTimer = setTimeout(onComplete, 1800);
    return () => {
      clearTimeout(timer);
      clearTimeout(closeTimer);
    };
  }, [onComplete]);

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-20 h-20 mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="#e2e8f0" strokeWidth="4" />
          <circle
            cx="40" cy="40" r="36" fill="none" stroke="#10b981" strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 36}`}
            strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <i className="fas fa-check text-[#10b981] text-2xl animate-scaleIn" style={{ animationDelay: "0.3s" }} />
        </div>
      </div>
      <h3 className="text-lg font-bold text-[#1e293b] animate-fadeIn" style={{ animationDelay: "0.2s" }}>
        Payment Confirmed!
      </h3>
      <p className="text-sm text-[#64748b] mt-1 animate-fadeIn" style={{ animationDelay: "0.4s" }}>
        Redirecting...
      </p>
    </div>
  );
}

function PaymentMethodSelector({
  selected,
  onChange,
}: {
  selected: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {PAYMENT_METHODS.map((method) => (
        <button
          key={method.value}
          type="button"
          onClick={() => onChange(method.value)}
          className={`
            flex flex-col items-center gap-1.5 p-2.5 md:p-3 rounded-xl border-2 transition-all duration-200
            ${selected === method.value
              ? `${method.bg} border-current ${method.color} shadow-sm`
              : "border-[#e2e8f0] hover:border-[#cbd5e1] text-[#64748b]"
            }
          `}
        >
          <div className={`
            w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center transition-colors
            ${selected === method.value ? method.bg : "bg-[#f8fafc]"}
          `}>
            <i className={`fas ${method.icon} text-sm ${selected === method.value ? method.color : "text-[#94a3b8]"}`} />
          </div>
          <span className="text-[9px] md:text-[10px] font-bold">{method.label}</span>
        </button>
      ))}
    </div>
  );
}

function AmountInput({
  value,
  onChange,
  totalAmount,
  min = 0,
}: {
  value: number;
  onChange: (val: number) => void;
  totalAmount: number;
  min?: number;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const balance = totalAmount - value;
  const isPartial = value > 0 && value < totalAmount;
  const isOver = value > totalAmount;
  const isFull = value === totalAmount;

  return (
    <div className="space-y-2">
      <div className={`
        relative flex items-center rounded-xl border-2 transition-all duration-200 overflow-hidden
        ${isFocused
          ? "border-[#10b981] shadow-md shadow-[#10b981]/10"
          : isPartial
            ? "border-[#f59e0b]"
            : isOver
              ? "border-[#3b82f6]"
              : "border-[#e2e8f0] hover:border-[#cbd5e1]"
        }
      `}>
        <div className={`
          px-4 py-3 font-bold text-sm border-r-2 transition-colors
          ${isFocused ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20" : "bg-[#f8fafc] text-[#64748b] border-[#e2e8f0]"}
        `}>
          KES
        </div>
        <input
          ref={inputRef}
          type="number"
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value))}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          min={min}
          className="w-full px-4 py-3 text-lg font-extrabold bg-transparent focus:outline-none text-[#1e293b]"
          placeholder="0"
        />
        <button
          type="button"
          onClick={() => onChange(totalAmount)}
          className={`
            mr-2 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all
            ${value === totalAmount
              ? "bg-[#10b981] text-white"
              : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#10b981]/10 hover:text-[#10b981]"
            }
          `}
        >
          Full
        </button>
      </div>

      {/* Balance indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isPartial && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-0.5 rounded-full">
              <i className="fas fa-adjust text-[8px]" />
              Partial: {formatCurrency(balance)} remaining
            </span>
          )}
          {isOver && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3b82f6] bg-[#3b82f6]/10 px-2 py-0.5 rounded-full">
              <i className="fas fa-plus-circle text-[8px]" />
              Overpaid: {formatCurrency(Math.abs(balance))}
            </span>
          )}
          {isFull && value > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded-full">
              <i className="fas fa-check-circle text-[8px]" />
              Full payment
            </span>
          )}
        </div>
        <span className="text-[11px] text-[#94a3b8] font-medium">
          Total: {formatCurrency(totalAmount)}
        </span>
      </div>
    </div>
  );
}

function ImagePreview({ url, onRemove }: { url: string; onRemove: () => void }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative rounded-xl overflow-hidden border border-[#e2e8f0] bg-[#f8fafc]">
      {!loaded && (
        <div className="aspect-video flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#e2e8f0] border-t-[#8b5cf6] rounded-full animate-spin" />
        </div>
      )}
      <img
        src={url}
        alt="Payment proof"
        className={`w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0 absolute inset-0"}`}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
        aria-label="Remove image"
      >
        <i className="fas fa-times text-xs" />
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PaymentConfirmationModal({
  item,
  itemType,
  open,
  onClose,
  onConfirm,
}: PaymentConfirmationModalProps) {
  const { user } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mpesa");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [proofImage, setProofImage] = useState("");

  const isBooking = itemType === "booking";
  const booking = item as Booking;
  const order = item as Order;

  const itemName = isBooking ? booking.service : order.productName || `${order.products?.length || 0} items`;
  const customerName = isBooking ? booking.client : order.customerName;
  const totalAmount = isBooking ? booking.price : order.total;

  // Reset form when item changes
  useEffect(() => {
    if (item) {
      setAmount(totalAmount);
      setTransactionId("");
      setPaymentMethod("mpesa");
      setPaymentNotes("");
      setProofImage("");
      setShowSuccess(false);
    }
  }, [item, totalAmount]);

  // Keyboard: Escape to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !confirming) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, confirming, onClose]);

  const handleConfirm = useCallback(async () => {
    if (!item || !onConfirm || amount <= 0) return;

    setConfirming(true);

    try {
      const paymentProof: PaymentProof = {
        method: paymentMethod,
        transactionId: transactionId || undefined,
        amount,
        paidAt: new Date(),
        confirmedBy: user?.email || "Admin",
        confirmedAt: new Date(),
        proofImage: proofImage || undefined,
        notes: paymentNotes || undefined,
      };

      await onConfirm(item.id, paymentProof);
      setShowSuccess(true);
    } catch (error) {
      console.error("Error confirming payment:", error);
      alert("❌ Failed to confirm payment. Please try again.");
      setConfirming(false);
    }
  }, [item, onConfirm, amount, paymentMethod, transactionId, proofImage, paymentNotes, user?.email]);

  const handleClose = useCallback(() => {
    if (confirming) return;
    setTransactionId("");
    setAmount(0);
    setPaymentMethod("mpesa");
    setPaymentNotes("");
    setProofImage("");
    setShowSuccess(false);
    onClose();
  }, [confirming, onClose]);

  const handleSuccessComplete = useCallback(() => {
    handleClose();
    // Give parent time to refresh
    setTimeout(() => window.location.reload(), 100);
  }, [handleClose]);

  if (!open || !item) return null;

  const isValid = amount > 0;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-3 md:p-4 animate-fadeIn"
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className={`
          relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden
          flex flex-col max-h-[90vh]
          ${showSuccess ? "" : "animate-scaleIn"}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {showSuccess && <SuccessOverlay onComplete={handleSuccessComplete} />}

        {/* Header */}
        <div className="shrink-0 px-5 md:px-6 py-4 md:py-5 border-b border-[#e2e8f0] bg-gradient-to-r from-[#f0fdf4] to-[#ecfdf5]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] text-white flex items-center justify-center shadow-md shadow-[#10b981]/20">
              <i className="fas fa-check-circle text-lg md:text-xl" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-extrabold text-[#1e293b]">Confirm Payment</h2>
              <p className="text-xs md:text-sm text-[#64748b]">
                {isBooking ? "Booking" : "Order"} #{item.id.slice(0, 8)}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5">
          {/* Item Summary */}
          <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0]">
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0">
                <div className="text-[10px] md:text-xs text-[#94a3b8] font-bold uppercase tracking-wider mb-1">
                  {isBooking ? "Service" : "Product"}
                </div>
                <div className="font-bold text-sm md:text-base text-[#1e293b] truncate">{itemName}</div>
              </div>
              <div className="text-right shrink-0 ml-3">
                <div className="text-[10px] md:text-xs text-[#94a3b8] font-bold uppercase tracking-wider mb-1">
                  Total
                </div>
                <div className="font-extrabold text-base md:text-lg text-[#10b981]">
                  {formatCurrency(totalAmount)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm text-[#64748b]">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ede9fe] to-[#e0e7ff] flex items-center justify-center">
                <span className="text-[#8b5cf6] font-bold text-[10px]">
                  {customerName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <span className="truncate">{customerName}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="block text-xs md:text-sm font-semibold text-[#475569]">
              Payment Method
            </label>
            <PaymentMethodSelector selected={paymentMethod} onChange={setPaymentMethod} />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-[#475569] mb-2">
              Amount Received <span className="text-[#ef4444]">*</span>
            </label>
            <AmountInput
              value={amount}
              onChange={setAmount}
              totalAmount={totalAmount}
            />
          </div>

          {/* Transaction ID */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-[#475569] mb-2">
              Transaction ID / Reference
            </label>
            <div className="relative">
              <i className="fas fa-hashtag absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] text-xs" />
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g., QKH123456789"
                className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#10b981] focus:shadow-md focus:shadow-[#10b981]/10 focus:outline-none text-sm transition-all"
              />
            </div>
            <p className="text-[10px] md:text-xs text-[#94a3b8] mt-1.5">
              Optional but recommended for tracking
            </p>
          </div>

          {/* Proof Image */}
          <div className="space-y-2">
            <label className="block text-xs md:text-sm font-semibold text-[#475569]">
              Payment Proof <span className="text-[#94a3b8] font-normal">(Optional)</span>
            </label>
            {!proofImage ? (
              <div className="relative">
                <i className="fas fa-link absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] text-xs" />
                <input
                  type="url"
                  value={proofImage}
                  onChange={(e) => setProofImage(e.target.value)}
                  placeholder="Paste image URL or screenshot link"
                  className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#10b981] focus:shadow-md focus:shadow-[#10b981]/10 focus:outline-none text-sm transition-all"
                />
              </div>
            ) : (
              <ImagePreview url={proofImage} onRemove={() => setProofImage("")} />
            )}
            <p className="text-[10px] md:text-xs text-[#94a3b8]">
              Screenshot of M-Pesa message or bank transfer
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-[#475569] mb-2">
              Notes <span className="text-[#94a3b8] font-normal">(Optional)</span>
            </label>
            <textarea
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Any additional details..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#10b981] focus:shadow-md focus:shadow-[#10b981]/10 focus:outline-none text-sm resize-none transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 md:px-6 py-4 border-t border-[#e2e8f0] bg-white">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={confirming}
              className="flex-1 px-4 py-3 border-2 border-[#e2e8f0] text-[#64748b] rounded-xl font-bold text-sm hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirming || !isValid}
              className={`
                flex-1 px-4 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2
                transition-all active:scale-95
                ${isValid && !confirming
                  ? "bg-gradient-to-r from-[#10b981] to-[#059669] hover:opacity-90 shadow-lg shadow-[#10b981]/20"
                  : "bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed"
                }
              `}
            >
              {confirming ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <i className="fas fa-check text-xs" />
                  Confirm Payment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}