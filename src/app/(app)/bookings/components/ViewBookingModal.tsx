"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Booking } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";
import { sendEvolutionWhatsAppMessage } from "@/utils/sendWhatsApp";
import { useAuth } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ViewBookingModalProps {
  booking: Booking | null;
  open: boolean;
  onClose: () => void;
  onUpdateStatus?: (bookingId: string, status: Booking["status"]) => void;
  onDelete?: (bookingId: string) => void;
  onEdit?: (booking: Booking) => void;
  onConfirmPayment?: (bookingId: string, paymentProof: any) => Promise<void>;
  onOpenPaymentModal?: () => void;
  onSendReminder?: (bookingId: string) => Promise<void>;
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

// ─── Constants ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; icon: string; dot: string }> = {
  confirmed: {
    bg: "bg-[#D1FAE5]",
    text: "text-[#059669]",
    border: "border-[#059669]/20",
    icon: "fa-check-circle",
    dot: "bg-[#059669]",
  },
  pending: {
    bg: "bg-[#FEF3C7]",
    text: "text-[#D97706]",
    border: "border-[#D97706]/20",
    icon: "fa-clock",
    dot: "bg-[#D97706]",
  },
  completed: {
    bg: "bg-[#EFF6FF]",
    text: "text-[#2563EB]",
    border: "border-[#2563EB]/20",
    icon: "fa-check-double",
    dot: "bg-[#2563EB]",
  },
  cancelled: {
    bg: "bg-[#FEE2E2]",
    text: "text-[#DC2626]",
    border: "border-[#DC2626]/20",
    icon: "fa-times-circle",
    dot: "bg-[#DC2626]",
  },
};

const PAYMENT_CONFIG: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  paid: { bg: "bg-[#D1FAE5]", text: "text-[#059669]", border: "border-[#059669]/20", icon: "fa-check-circle" },
  partial: { bg: "bg-[#FEF3C7]", text: "text-[#D97706]", border: "border-[#D97706]/20", icon: "fa-adjust" },
  unpaid: { bg: "bg-[#FEE2E2]", text: "text-[#DC2626]", border: "border-[#DC2626]/20", icon: "fa-times-circle" },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || {
    bg: "bg-[#F1F5F9]",
    text: "text-[#64748B]",
    border: "border-[#E2E8F0]",
    icon: "fa-question",
    dot: "bg-[#94A3B8]",
  };
}

function getPaymentConfig(status?: string) {
  return PAYMENT_CONFIG[status || "unpaid"] || PAYMENT_CONFIG.unpaid;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[3000] space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg
            text-sm font-semibold animate-slideInRight
            ${toast.type === "success" ? "bg-[#10B981] text-white" : ""}
            ${toast.type === "error" ? "bg-[#EF4444] text-white" : ""}
            ${toast.type === "info" ? "bg-[#8B5CF6] text-white" : ""}
          `}
        >
          <i className={`fas ${toast.type === "success" ? "fa-check-circle" : toast.type === "error" ? "fa-exclamation-circle" : "fa-info-circle"}`} />
          {toast.message}
          <button onClick={() => onRemove(toast.id)} className="ml-2 opacity-70 hover:opacity-100">
            <i className="fas fa-times text-xs" />
          </button>
        </div>
      ))}
    </div>
  );
}

function DetailCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  subValue,
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-3.5 md:p-4 border border-[#E2E8F0] hover:border-[#8B5CF6]/30 transition-all duration-200 group">
      <div className={`w-8 h-8 md:w-9 md:h-9 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform`}>
        <i className={`fas ${icon} text-xs md:text-sm`} />
      </div>
      <div className="text-[10px] md:text-xs text-[#94A3B8] font-semibold uppercase tracking-wide mb-0.5">{label}</div>
      <div className="font-bold text-xs md:text-sm text-[#1E293B] truncate">{value}</div>
      {subValue && <div className="text-[10px] text-[#94A3B8] mt-0.5">{subValue}</div>}
    </div>
  );
}

function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[2500] bg-black/90 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <img src={src} alt="Payment proof" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
      >
        <i className="fas fa-times" />
      </button>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  variant = "default",
  onClick,
  disabled,
  loading,
}: {
  icon: string;
  label: string;
  variant?: "default" | "danger" | "success" | "whatsapp" | "primary";
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const variants = {
    default: "bg-white text-[#64748B] border border-[#E2E8F0] hover:border-[#8B5CF6] hover:text-[#8B5CF6]",
    danger: "bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-md shadow-[#EF4444]/20",
    success: "bg-[#10B981] text-white hover:bg-[#059669] shadow-md shadow-[#10B981]/20",
    whatsapp: "bg-[#25D366] text-white hover:bg-[#128C7E] shadow-md shadow-[#25D366]/20",
    primary: "bg-[#8B5CF6] text-white hover:bg-[#7C3AED] shadow-md shadow-[#8B5CF6]/20",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-xs md:text-sm
        transition-all duration-200 active:scale-95
        ${variants[variant]}
        ${disabled || loading ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {loading ? (
        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <i className={`fas ${icon} text-xs`} />
      )}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ViewBookingModal({
  booking,
  open,
  onClose,
  onUpdateStatus,
  onDelete,
  onEdit,
  onOpenPaymentModal,
  onSendReminder,
}: ViewBookingModalProps) {
  const { user } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const toastIdRef = useRef(0);

  const addToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  // Entrance animation
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    }
    setIsVisible(false);
  }, [open]);

  // Close handlers
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (open) {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  // All hooks must be called BEFORE early return to satisfy React's Rules of Hooks
  const statusConfig = booking ? getStatusConfig(booking.status) : null;
  const paymentConfig = booking ? getPaymentConfig(booking.paymentStatus) : null;
  const balanceDue = booking ? Math.max(0, (booking.balance ?? booking.price) - (booking.deposit || 0)) : 0;
  const isCompleted = booking?.status === "completed";
  const isCancelled = booking?.status === "cancelled";

  const handleCopyId = useCallback(() => {
    if (!booking) return;
    navigator.clipboard.writeText(booking.id);
    addToast("Booking ID copied to clipboard!", "success");
  }, [booking?.id, addToast]);

  const handleSendReminder = useCallback(async () => {
    if (!booking || !onSendReminder) return;
    setSendingMessage(true);
    try {
      await onSendReminder(booking.id);
      addToast("Reminder sent successfully!", "success");
    } catch {
      addToast("Failed to send reminder", "error");
    } finally {
      setSendingMessage(false);
    }
  }, [booking?.id, onSendReminder, addToast]);

  const handleStatusUpdate = useCallback((status: Booking["status"]) => {
    if (!booking) return;
    onUpdateStatus?.(booking.id, status);
    addToast(`Booking marked as ${status}`, "success");
  }, [booking?.id, onUpdateStatus, addToast]);

  const handleDelete = useCallback(() => {
    if (!booking) return;
    if (window.confirm("Are you sure you want to delete this booking? This action cannot be undone.")) {
      onDelete?.(booking.id);
      onClose();
    }
  }, [booking?.id, onDelete, onClose, addToast]);

  // ✅ NOW safe to do early return - ALL hooks have been called above
  if (!open || !booking) return null;

  // At this point, booking is guaranteed to exist, so we can safely use non-null assertions
  const config = statusConfig!;
  const payConfig = paymentConfig!;

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
      {lightboxImage && <ImageLightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />}

      <div
        className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <div
          ref={modalRef}
          className={`
            relative bg-white w-full max-w-[640px] max-h-[92vh] sm:max-h-[85vh]
            rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col
            transition-all duration-500 ease-out
            ${isVisible ? "opacity-100 translate-y-0 sm:scale-100" : "opacity-0 translate-y-8 sm:scale-95"}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile drag handle - MD3 styling */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 bg-[#E2E8F0] rounded-full" />
          </div>

          {/* Header - MD3 styling */}
          <div className="shrink-0 px-5 md:px-6 py-4 border-b border-[#E2E8F0]">
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`
                    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide border
                    ${config.bg} ${config.text} ${config.border}
                  `}>
                    <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                    <i className={`fas ${config.icon} text-[8px]`} />
                    {booking.status}
                  </span>
                  {booking.verified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#D1FAE5] text-[#059669] border border-[#059669]/20">
                      <i className="fas fa-badge-check text-[8px]" />
                      Verified
                    </span>
                  )}
                </div>
                <h2 className="text-lg md:text-xl font-bold text-[#1E293B] leading-tight truncate">
                  {booking.service || 'N/A'}
                </h2>
                <p className="text-xs md:text-sm text-[#64748B] flex items-center gap-2 mt-1 flex-wrap">
                  <i className="fas fa-calendar-alt text-[10px]" />
                  {formatDate(booking.date)}
                  <span className="text-[#E2E8F0]">•</span>
                  <i className="fas fa-clock text-[10px]" />
                  {booking.time}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Mobile actions menu toggle - MD3 styling */}
                <button
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                  className="sm:hidden w-9 h-9 rounded-xl bg-white text-[#64748B] flex items-center justify-center hover:bg-[#8B5CF6] hover:text-white transition-all"
                >
                  <i className="fas fa-ellipsis-v text-sm" />
                </button>
                <button
                  onClick={handleDelete}
                  className="w-9 h-9 rounded-xl bg-white text-[#64748B] flex items-center justify-center hover:bg-[#EF4444] hover:text-white transition-all active:scale-95"
                  title="Delete"
                >
                  <i className="fas fa-trash-alt text-sm" />
                </button>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-white text-[#64748B] flex items-center justify-center hover:bg-[#8B5CF6] hover:text-white transition-all active:scale-95"
                >
                  <i className="fas fa-times text-sm" />
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 md:px-6 py-4 md:py-5 space-y-5 md:space-y-6">
            {/* Client Card - MD3 styling */}
            <div className="bg-gradient-to-br from-[#F3E8FF] to-[#F8FAFC] rounded-2xl p-4 md:p-5 border border-[#8B5CF6]/10">
              <div className="flex items-center gap-3 md:gap-4 mb-4">
                {/* Avatar - MD3 shape system */}
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] text-white flex items-center justify-center font-bold text-lg md:text-xl shrink-0 relative shadow-md shadow-[#8B5CF6]/20">
                  {booking.clientInitials}
                  {booking.verified && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[#10B981] text-white rounded-full flex items-center justify-center text-[9px] border-2 border-white shadow-sm">
                      <i className="fas fa-check" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-base md:text-lg text-[#1E293B] truncate">
                    {booking.client}
                  </div>
                  <div className="text-xs md:text-sm text-[#64748B] flex items-center gap-1.5">
                    <i className="fab fa-whatsapp text-[#25D366] text-xs" />
                    <span className="truncate">{booking.phone}</span>
                  </div>
                  {booking.email && (
                    <div className="text-xs text-[#64748B] flex items-center gap-1.5 mt-0.5">
                      <i className="fas fa-envelope text-[#8B5CF6] text-[10px]" />
                      <span className="truncate">{booking.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href={`https://wa.me/${booking.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/80 text-[#25D366] rounded-xl font-bold text-xs md:text-sm hover:bg-[#25D366] hover:text-white transition-all active:scale-95 border border-white/50"
                >
                  <i className="fab fa-whatsapp text-sm" />
                  WhatsApp
                </a>
                <a
                  href={`tel:${booking.phone}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/80 text-[#475569] rounded-xl font-bold text-xs md:text-sm hover:bg-[#8b5cf6] hover:text-white transition-all active:scale-95 border border-white/50"
                >
                  <i className="fas fa-phone text-xs" />
                  Call
                </a>
              </div>
            </div>

            {/* Details Grid */}
            <div>
              <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-3 flex items-center gap-2">
                <i className="fas fa-info-circle" />
                Booking Details
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                <DetailCard icon="fa-calendar" iconBg="bg-[#ede9fe]" iconColor="text-[#8b5cf6]" label="Date" value={formatDate(booking.date)} />
                <DetailCard icon="fa-clock" iconBg="bg-[#d1fae5]" iconColor="text-[#10b981]" label="Time" value={booking.time} subValue={booking.duration} />
                <DetailCard icon="fa-map-marker-alt" iconBg="bg-[#ffedd5]" iconColor="text-[#f97316]" label="Location" value={booking.location} />
                {booking.packageTier && (
                  <DetailCard icon="fa-layer-group" iconBg="bg-[#ede9fe]" iconColor="text-[#8b5cf6]" label="Package" value={booking.packageTier} />
                )}
                {booking.source && (
                  <DetailCard
                    icon={booking.source === "whatsapp" ? "fa-whatsapp" : booking.source === "online" ? "fa-globe" : "fa-phone"}
                    iconBg="bg-[#dbeafe]"
                    iconColor="text-[#3b82f6]"
                    label="Source"
                    value={booking.source}
                  />
                )}
                {booking.assignedTo && (
                  <DetailCard icon="fa-user-tie" iconBg="bg-[#ede9fe]" iconColor="text-[#8b5cf6]" label="Assigned" value={booking.assignedTo} />
                )}
              </div>
            </div>

            {/* Payment Section */}
            <div>
              <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-3 flex items-center gap-2">
                <i className="fas fa-credit-card" />
                Payment
              </h3>
              <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-5 border border-[#e2e8f0] space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-[#e2e8f0]">
                  <span className="text-sm text-[#64748b]">Total Price</span>
                  <span className="font-extrabold text-lg md:text-xl text-[#8b5cf6]">{formatCurrency(booking.price)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#64748b]">Deposit Paid</span>
                  <span className="font-bold text-[#10b981]">{formatCurrency(booking.deposit || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#64748b]">Balance Due</span>
                  <span className={`font-bold ${balanceDue > 0 ? "text-[#f59e0b]" : "text-[#10b981]"}`}>
                    {formatCurrency(balanceDue)}
                  </span>
                </div>

                {/* Payment progress bar */}
                <div className="pt-2">
                  <div className="h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#10b981] transition-all duration-500"
                      style={{ width: `${Math.min(((booking.deposit || 0) / booking.price) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[#e2e8f0]">
                  <span className="text-sm text-[#64748b]">Status</span>
                  <span className={`
                    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border
                    ${payConfig.bg} ${payConfig.text} ${payConfig.border}
                  `}>
                    <i className={`fas ${payConfig.icon} text-[8px]`} />
                    {booking.paymentStatus || "Unpaid"}
                  </span>
                </div>

                {booking.paymentMethod && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#64748b]">Method</span>
                    <span className="text-sm font-semibold text-[#1e293b] capitalize flex items-center gap-1.5">
                      <i className={`fas ${
                        booking.paymentMethod === "mpesa" ? "fa-mobile-alt" :
                        booking.paymentMethod === "card" ? "fa-credit-card" :
                        booking.paymentMethod === "bank" ? "fa-university" :
                        "fa-money-bill-wave"
                      } text-[#8b5cf6] text-xs`} />
                      {booking.paymentMethod}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Proof */}
            {booking.paymentProof && (
              <div>
                <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-[#10b981] mb-3 flex items-center gap-2">
                  <i className="fas fa-check-circle" />
                  Payment Confirmed
                </h3>
                <div className="bg-gradient-to-br from-[#f0fdf4] to-[#ecfdf5] rounded-xl md:rounded-2xl p-4 md:p-5 border border-[#10b981]/20 space-y-3">
                  {booking.paymentProof.transactionId && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#64748b]">Transaction ID</span>
                      <span className="font-mono font-semibold text-sm text-[#1e293b]">{booking.paymentProof.transactionId}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#64748b]">Amount Paid</span>
                    <span className="font-bold text-[#10b981]">{formatCurrency(booking.paymentProof.amount)}</span>
                  </div>
                  {booking.paymentProof.confirmedBy && (
                    <div className="flex justify-between items-center pt-2 border-t border-[#10b981]/10">
                      <span className="text-sm text-[#64748b]">Confirmed By</span>
                      <span className="text-sm font-semibold text-[#1e293b]">{booking.paymentProof.confirmedBy}</span>
                    </div>
                  )}
                  {booking.paymentProof.proofImage && (
                    <div className="pt-2 border-t border-[#10b981]/10">
                      <div className="text-sm text-[#64748b] mb-2">Proof</div>
                      <div
                        className="rounded-xl overflow-hidden border border-[#10b981]/20 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setLightboxImage(booking.paymentProof!.proofImage!)}
                      >
                        <img src={booking.paymentProof.proofImage} alt="Payment proof" className="w-full h-32 object-cover" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {booking.notes && (
              <div>
                <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-3 flex items-center gap-2">
                  <i className="fas fa-sticky-note" />
                  Notes
                </h3>
                <div className="bg-white rounded-xl p-4 border border-[#e2e8f0]">
                  <p className="text-sm text-[#64748b] leading-relaxed">{booking.notes}</p>
                </div>
              </div>
            )}

            {/* Cancellation Reason */}
            {isCancelled && booking.cancellationReason && (
              <div>
                <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-[#ef4444] mb-3 flex items-center gap-2">
                  <i className="fas fa-exclamation-triangle" />
                  Cancellation Reason
                </h3>
                <div className="bg-[#fef2f2] rounded-xl p-4 border border-[#ef4444]/20">
                  <p className="text-sm text-[#ef4444] leading-relaxed">{booking.cancellationReason}</p>
                </div>
              </div>
            )}

            {/* Booking Reference */}
            <div>
              <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-3 flex items-center gap-2">
                <i className="fas fa-fingerprint" />
                Reference
              </h3>
              <div className="bg-white rounded-xl p-4 border border-[#e2e8f0] space-y-3">
                <div className="flex items-center justify-between">
                  <code className="text-xs md:text-sm font-mono text-[#8b5cf6] font-semibold truncate max-w-[200px]">
                    {booking.id}
                  </code>
                  <button
                    onClick={handleCopyId}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ede9fe] text-[#8b5cf6] rounded-lg text-xs font-bold hover:bg-[#8b5cf6] hover:text-white transition-all active:scale-95 shrink-0 ml-2"
                  >
                    <i className="fas fa-copy text-[10px]" />
                    Copy
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#e2e8f0] text-xs">
                  <div>
                    <div className="text-[#94a3b8] font-medium mb-0.5">Created</div>
                    <div className="font-semibold text-[#1e293b]">
                      {booking.createdAt?.toDate ? booking.createdAt.toDate().toLocaleDateString() : "Recent"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#94a3b8] font-medium mb-0.5">Updated</div>
                    <div className="font-semibold text-[#1e293b]">
                      {booking.updatedAt?.toDate ? booking.updatedAt.toDate().toLocaleDateString() : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="shrink-0 p-4 md:p-5 border-t border-[#e2e8f0] bg-white space-y-2">
            {/* Primary actions */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {onEdit && (
                <ActionButton icon="fa-edit" label="Edit" variant="primary" onClick={() => onEdit(booking)} />
              )}
              {onSendReminder && (
                <ActionButton
                  icon="fa-bell"
                  label="Reminder"
                  variant="default"
                  onClick={handleSendReminder}
                  loading={sendingMessage}
                />
              )}
              {onOpenPaymentModal && booking.paymentStatus !== "paid" && (
                <ActionButton
                  icon="fa-check-circle"
                  label="Payment"
                  variant="success"
                  onClick={onOpenPaymentModal}
                />
              )}
            </div>

            {/* Status actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {!isCompleted && !isCancelled && (
                <ActionButton
                  icon="fa-check"
                  label="Complete"
                  variant="success"
                  onClick={() => handleStatusUpdate("completed")}
                />
              )}
              {!isCancelled && (
                <ActionButton
                  icon="fa-times"
                  label="Cancel"
                  variant="danger"
                  onClick={() => handleStatusUpdate("cancelled")}
                />
              )}
              {!isCompleted && !isCancelled && booking.status !== "confirmed" && (
                <ActionButton
                  icon="fa-check-circle"
                  label="Confirm"
                  variant="primary"
                  onClick={() => handleStatusUpdate("confirmed")}
                />
              )}
              <ActionButton icon="fa-times" label="Close" variant="default" onClick={onClose} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}