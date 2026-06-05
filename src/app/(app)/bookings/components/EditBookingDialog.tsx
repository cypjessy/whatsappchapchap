"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { bookingService, serviceService, Booking, Service } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditBookingDialogProps {
  booking: Booking | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface FormErrors {
  client?: string;
  phone?: string;
  date?: string;
  time?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash", icon: "fa-money-bill-wave" },
  { value: "mpesa", label: "M-Pesa", icon: "fa-mobile-alt" },
  { value: "card", label: "Card", icon: "fa-credit-card" },
  { value: "bank", label: "Bank Transfer", icon: "fa-university" },
];

const VALID_TRANSITIONS: Record<string, string[]> = {
  confirmed: ["completed", "cancelled"],
  pending: ["confirmed", "completed", "cancelled"],
  completed: [],
  cancelled: [],
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EditBookingDialog({ booking, open, onClose, onSaved }: EditBookingDialogProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isAnimating, setIsAnimating] = useState(false);

  // Form fields
  const [client, setClient] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("unpaid");
  const [status, setStatus] = useState<Booking["status"]>("pending");
  const [notes, setNotes] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<"basic" | "standard" | "premium">("standard");

  // Populate form when booking changes
  useEffect(() => {
    if (booking && open) {
      setClient(booking.client || "");
      setPhone(booking.phone || "");
      setEmail(booking.email || "");
      setDate(booking.date || "");
      setTime(booking.time || "");
      setDuration(booking.duration || "");
      setLocation(booking.location || "");
      setPrice(booking.price || 0);
      setDeposit(booking.deposit || 0);
      setPaymentMethod(booking.paymentMethod || "");
      setPaymentStatus(booking.paymentStatus || "unpaid");
      setStatus(booking.status || "pending");
      setNotes(booking.notes || "");
      setSelectedServiceId(booking.serviceId || "");
      setSelectedPackage((booking as any).packageTier || "standard");
    }
  }, [booking, open]);

  // Load services
  useEffect(() => {
    if (open && user) {
      serviceService.getServices(user).then(setServices).catch(console.error);
    }
  }, [open, user]);

  const selectedService = services.find((s) => s.id === selectedServiceId);

  const packagePrices = useMemo(() => {
    const basePrice = selectedService?.priceMin || 0;
    return {
      basic: basePrice,
      standard: Math.round(basePrice * 1.5),
      premium: Math.round(basePrice * 2),
    };
  }, [selectedService]);

  const availableTransitions = useMemo(() => {
    if (!booking) return [];
    return VALID_TRANSITIONS[booking.status] || [];
  }, [booking]);

  const handleClose = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      onClose();
    }, 200);
  }, [onClose]);

  // Keyboard: Escape to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !saving) handleClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, saving, handleClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !booking) return;

    const newErrors: FormErrors = {};
    if (!client.trim()) newErrors.client = "Required";
    if (!phone.trim()) newErrors.phone = "Required";
    if (!date) newErrors.date = "Required";
    if (!time) newErrors.time = "Required";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    try {
      const updates: Partial<Booking> = {
        client: client.trim(),
        clientInitials: getInitials(client),
        phone: phone.trim(),
        email: email || undefined,
        date,
        time,
        duration: duration || "60 min",
        location: location || "Not specified",
        price: Number(price),
        deposit: Number(deposit) || 0,
        paymentMethod: paymentMethod ? (paymentMethod as Booking["paymentMethod"]) : undefined,
        paymentStatus: (paymentStatus as Booking["paymentStatus"]) || "unpaid",
        notes: notes || undefined,
        status,
        service: selectedService?.name || booking.service,
        serviceId: selectedServiceId || booking.serviceId,
        balance: Number(price) - (Number(deposit) || 0),
      };

      await bookingService.updateBooking(user, booking.id, updates);
      onSaved();
      handleClose();
    } catch (error) {
      console.error("Error updating booking:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!open || !booking) return null;

  return (
    <div
      className="fixed inset-0 z-[2500] flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-black/60" />

      <div
        className={`
          relative w-full max-w-2xl max-h-[94vh] sm:max-h-[88vh]
          rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col
          transition-all duration-300 ease-out bg-surface
          ${isAnimating ? "opacity-0 translate-y-12 sm:scale-[0.97]" : "opacity-100 translate-y-0 sm:scale-100"}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-outline-variant">
          <div className="p-4 md:p-5 flex justify-between items-center">
            <h2 className="text-lg md:text-xl font-bold flex items-center gap-2.5 text-on-surface">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center shadow-sm shadow-[#8b5cf6]/20">
                <i className="fas fa-edit text-white text-sm" />
              </div>
              Edit Booking
            </h2>
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-full border-2 border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-[#8b5cf6] hover:text-[#8b5cf6] hover:bg-[#f5f3ff] transition-all active:scale-95"
              aria-label="Close"
            >
              <i className="fas fa-times text-sm" />
            </button>
          </div>

          {/* Status indicator */}
          <div className="px-4 md:px-5 pb-3 flex items-center gap-2 text-xs text-on-surface-variant">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F3E8FF] text-[#8b5cf6] font-bold">
              <i className="fas fa-fingerprint text-[9px]" />
              {booking.id.slice(0, 8)}...
            </span>
            <span className="text-outline">•</span>
            <span>Status: <strong className="text-on-surface capitalize">{booking.status}</strong></span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Client Section */}
            <div className="bg-surface rounded-2xl p-4 md:p-5 border border-outline-variant shadow-sm">
              <h3 className="text-sm md:text-base font-bold mb-4 flex items-center gap-2 text-on-surface">
                <div className="w-7 h-7 rounded-lg bg-[#EDE9FE] flex items-center justify-center">
                  <i className="fas fa-user text-[#8b5cf6] text-xs" />
                </div>
                Client Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                    Full Name <span className="text-[#ef4444]">*</span>
                  </label>
                  <input
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    className={`
                      w-full px-4 py-2.5 rounded-xl border-2 text-sm transition-all outline-none
                      ${errors.client
                        ? "border-[#ef4444] bg-[#ef4444]/5"
                        : "border-outline focus:border-[#8b5cf6] focus:shadow-md focus:shadow-[#8b5cf6]/10"
                      }
                    `}
                    placeholder="John Doe"
                  />
                  {errors.client && <p className="text-[11px] text-[#ef4444] mt-1 font-medium">{errors.client}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                    Phone <span className="text-[#ef4444]">*</span>
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`
                      w-full px-4 py-2.5 rounded-xl border-2 text-sm transition-all outline-none
                      ${errors.phone
                        ? "border-[#ef4444] bg-[#ef4444]/5"
                        : "border-outline focus:border-[#8b5cf6] focus:shadow-md focus:shadow-[#8b5cf6]/10"
                      }
                    `}
                    placeholder="+254 700 000 000"
                  />
                  {errors.phone && <p className="text-[11px] text-[#ef4444] mt-1 font-medium">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-outline text-sm outline-none focus:border-[#8b5cf6] focus:shadow-md focus:shadow-[#8b5cf6]/10 transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Schedule Section */}
            <div className="bg-surface rounded-2xl p-4 md:p-5 border border-outline-variant shadow-sm">
              <h3 className="text-sm md:text-base font-bold mb-4 flex items-center gap-2 text-on-surface">
                <div className="w-7 h-7 rounded-lg bg-[#D1FAE5] flex items-center justify-center">
                  <i className="fas fa-calendar-alt text-[#10b981] text-xs" />
                </div>
                Schedule
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                    Date <span className="text-[#ef4444]">*</span>
                  </label>
                  <input
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    type="date"
                    className={`
                      w-full px-4 py-2.5 rounded-xl border-2 text-sm transition-all outline-none
                      ${errors.date
                        ? "border-[#ef4444] bg-[#ef4444]/5"
                        : "border-outline focus:border-[#8b5cf6] focus:shadow-md focus:shadow-[#8b5cf6]/10"
                      }
                    `}
                  />
                  {errors.date && <p className="text-[11px] text-[#ef4444] mt-1 font-medium">{errors.date}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                    Time <span className="text-[#ef4444]">*</span>
                  </label>
                  <input
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    type="time"
                    className={`
                      w-full px-4 py-2.5 rounded-xl border-2 text-sm transition-all outline-none
                      ${errors.time
                        ? "border-[#ef4444] bg-[#ef4444]/5"
                        : "border-outline focus:border-[#8b5cf6] focus:shadow-md focus:shadow-[#8b5cf6]/10"
                      }
                    `}
                  />
                  {errors.time && <p className="text-[11px] text-[#ef4444] mt-1 font-medium">{errors.time}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Duration</label>
                  <input
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-outline text-sm outline-none focus:border-[#8b5cf6] focus:shadow-md focus:shadow-[#8b5cf6]/10 transition-all"
                    placeholder="60 min"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Location</label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-outline text-sm outline-none focus:border-[#8b5cf6] focus:shadow-md focus:shadow-[#8b5cf6]/10 transition-all"
                    placeholder="Client's Place"
                  />
                </div>
              </div>
            </div>

            {/* Service Section */}
            <div className="bg-surface rounded-2xl p-4 md:p-5 border border-outline-variant shadow-sm">
              <h3 className="text-sm md:text-base font-bold mb-4 flex items-center gap-2 text-on-surface">
                <div className="w-7 h-7 rounded-lg bg-[#EDE9FE] flex items-center justify-center">
                  <i className="fas fa-concierge-bell text-[#8b5cf6] text-xs" />
                </div>
                Service & Package
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Service</label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-outline text-sm outline-none focus:border-[#8b5cf6] focus:shadow-md transition-all appearance-none cursor-pointer"
                  >
                    <option value="">{booking.service} (current)</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} — {formatCurrency(s.priceMin)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Package Tier</label>
                  <div className="flex gap-2">
                    {(["basic", "standard", "premium"] as const).map((pkg) => (
                      <button
                        key={pkg}
                        type="button"
                        onClick={() => setSelectedPackage(pkg)}
                        className={`
                          flex-1 px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all
                          ${selectedPackage === pkg
                            ? "bg-[#8b5cf6] text-white shadow-sm"
                            : "bg-surface border-2 border-outline text-on-surface-variant hover:border-[#8b5cf6]/50"
                          }
                        `}
                      >
                        {pkg}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="bg-surface rounded-2xl p-4 md:p-5 border border-outline-variant shadow-sm">
              <h3 className="text-sm md:text-base font-bold mb-4 flex items-center gap-2 text-on-surface">
                <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] flex items-center justify-center">
                  <i className="fas fa-credit-card text-[#f59e0b] text-xs" />
                </div>
                Payment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Price (KES)</label>
                  <input
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    type="number"
                    min={0}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-outline text-sm outline-none focus:border-[#8b5cf6] focus:shadow-md transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Deposit (KES)</label>
                  <input
                    value={deposit}
                    onChange={(e) => setDeposit(Number(e.target.value))}
                    type="number"
                    min={0}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-outline text-sm outline-none focus:border-[#8b5cf6] focus:shadow-md transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-outline-variant text-sm outline-none focus:border-[#8b5cf6] transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select method</option>
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-outline-variant text-sm outline-none focus:border-[#8b5cf6] transition-all appearance-none cursor-pointer"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>

              {/* Balance due */}
              <div className="mt-4 p-3 bg-[#F3E8FF] rounded-xl flex justify-between items-center">
                <span className="text-sm text-on-surface-variant font-medium">Balance Due</span>
                <span className={`font-extrabold text-lg ${(price - deposit) > 0 ? "text-[#f59e0b]" : "text-[#10b981]"}`}>
                  {formatCurrency(price - deposit)}
                </span>
              </div>
            </div>

            {/* Status Section */}
            <div className="bg-surface rounded-2xl p-4 md:p-5 border border-outline-variant shadow-sm">
              <h3 className="text-sm md:text-base font-bold mb-4 flex items-center gap-2 text-on-surface">
                <div className="w-7 h-7 rounded-lg bg-[#DBEAFE] flex items-center justify-center">
                  <i className="fas fa-tag text-[#3b82f6] text-xs" />
                </div>
                Status
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {["pending", "confirmed", "completed", "cancelled"].map((s) => {
                  const isAllowed = s === booking.status || availableTransitions.includes(s);
                  const isActive = status === s;
                  const statusColors: Record<string, string> = {
                    pending: "bg-[#FEF3C7] text-[#D97706] border-[#D97706]/20",
                    confirmed: "bg-[#D1FAE5] text-[#059669] border-[#059669]/20",
                    completed: "bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/20",
                    cancelled: "bg-[#FEE2E2] text-[#DC2626] border-[#DC2626]/20",
                  };
                  const activeColors: Record<string, string> = {
                    pending: "bg-[#D97706] text-white border-[#D97706]",
                    confirmed: "bg-[#059669] text-white border-[#059669]",
                    completed: "bg-[#2563EB] text-white border-[#2563EB]",
                    cancelled: "bg-[#DC2626] text-white border-[#DC2626]",
                  };

                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => isAllowed && setStatus(s as Booking["status"])}
                      disabled={!isAllowed}
                      className={`
                        px-3 py-2.5 rounded-xl text-xs font-bold capitalize transition-all border-2
                        ${isActive ? activeColors[s] : isAllowed ? statusColors[s] + " hover:opacity-80" : "bg-surface-variant text-outline border-outline-variant/30 opacity-40 cursor-not-allowed"}
                      `}
                      title={!isAllowed ? `Cannot change from ${booking.status} to ${s}` : `Set status to ${s}`}
                    >
                      <i className={`fas ${
                        s === "confirmed" ? "fa-check-circle" :
                        s === "pending" ? "fa-clock" :
                        s === "completed" ? "fa-check-double" : "fa-times-circle"
                      } mr-1.5 text-[10px]`} />
                      {s}
                    </button>
                  );
                })}
              </div>
              {availableTransitions.length === 0 && (
                <p className="text-[11px] text-outline mt-2">No further status changes allowed from current state.</p>
              )}
            </div>

            {/* Notes */}
            <div className="bg-surface rounded-2xl p-4 md:p-5 border border-outline-variant shadow-sm">
              <h3 className="text-sm md:text-base font-bold mb-4 flex items-center gap-2 text-on-surface">
                <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] flex items-center justify-center">
                  <i className="fas fa-sticky-note text-[#f59e0b] text-xs" />
                </div>
                Notes
              </h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-outline text-sm outline-none focus:border-[#8b5cf6] focus:shadow-md transition-all resize-none"
                placeholder="Any additional notes..."
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-outline-variant p-4 md:p-5 bg-gradient-to-t from-surface to-surface/95">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-sm border-2 border-outline-variant text-on-surface-variant hover:border-[#8b5cf6]/40 hover:text-[#8b5cf6] transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-md shadow-[#8b5cf6]/20 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save text-xs" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
