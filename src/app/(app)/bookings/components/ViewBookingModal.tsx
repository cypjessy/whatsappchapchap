"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
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
    bg: "bg-surface-variant",
    text: "text-on-surface-variant",
    border: "border-outline-variant",
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
            pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-md3-level3
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
    <div className="bg-surface rounded-2xl p-3.5 md:p-4 border border-outline-variant hover:border-[#8B5CF6]/30 transition-all duration-200 group">
      <div className={`w-8 h-8 md:w-9 md:h-9 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform`}>
        <i className={`fas ${icon} text-xs md:text-sm`} />
      </div>
      <div className="text-[10px] md:text-xs text-outline font-semibold uppercase tracking-wide mb-0.5">{label}</div>
      <div className="font-bold text-xs md:text-sm text-on-surface truncate">{value}</div>
      {subValue && <div className="text-[10px] text-outline mt-0.5">{subValue}</div>}
    </div>
  );
}

function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[2500] bg-black/90 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <img src={src} alt="Payment proof" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-surface/10 text-white flex items-center justify-center hover:bg-surface/20 transition-colors"
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
    default: "bg-[var(--md-sys-color-surface-variant,white)] text-[var(--md-sys-color-on-surface-variant,#64748B)] border border-[var(--md-sys-color-outline,#E2E8F0)] hover:bg-[var(--md-sys-color-surface-variant-hover,#F1F5F9)]",
    danger: "bg-[var(--md-sys-color-error,#EF4444)] text-[var(--md-sys-color-on-error,white)] hover:bg-[var(--md-sys-color-error-hover,#DC2626)] shadow-md3-level1",
    success: "bg-[var(--md-sys-color-tertiary,#10B981)] text-[var(--md-sys-color-on-tertiary,white)] hover:bg-[var(--md-sys-color-tertiary-hover,#059669)] shadow-md3-level1",
    whatsapp: "bg-[#25D366] text-white hover:bg-[#128C7E] shadow-md3-level1",
    primary: "bg-[var(--md-sys-color-primary,#8B5CF6)] text-[var(--md-sys-color-on-primary,white)] hover:bg-[var(--md-sys-color-primary-hover,#7C3AED)] shadow-md3-level1",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        flex items-center justify-center gap-2 px-4 py-3 rounded-full font-medium text-sm md:text-base
        transition-all duration-200 active:scale-95 w-full
        ${variants[variant]}
        ${disabled || loading ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <i className={`fas ${icon} text-sm`} />
      )}
      <span>{label}</span>
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

  // Safe first letter helper - handles undefined, empty, or invalid client names
  const safeFirstLetter = useMemo(() => {
    const clientName = booking?.client || "";
    if (!clientName) {
      return "?";
    }
    // Return first character, uppercase
    return clientName.charAt(0).toUpperCase();
  }, [booking?.client]);

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
            relative w-full max-w-[640px] max-h-[92vh] sm:max-h-[85vh]
            rounded-t-[28px] sm:rounded-[28px] shadow-md3-level3 overflow-hidden flex flex-col
            transition-all duration-300 ease-out
            ${isVisible ? "opacity-100 translate-y-0 sm:scale-100" : "opacity-0 translate-y-8 sm:scale-95"}
            bg-[var(--md-sys-color-surface,white)]
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile drag handle - MD3 styling */}
          <div className="flex justify-center pt-3 pb-2 sm:hidden">
            <div className="w-10 h-1 bg-[var(--md-sys-color-outline-variant,#E2E8F0)] rounded-full" />
          </div>

          {/* Header - MD3 styling */}
          <div className="shrink-0 px-5 md:px-6 py-4 border-b border-[var(--md-sys-color-outline-variant,#E2E8F0)]">
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`
                    inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium uppercase tracking-wide
                    ${config.bg} ${config.text}
                  `}>
                    <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                    <i className={`fas ${config.icon} text-[9px]`} />
                    {booking.status}
                  </span>
                  {booking.verified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#D1FAE5] text-[#059669]">
                      <i className="fas fa-badge-check text-[9px]" />
                      Verified
                    </span>
                  )}
                </div>
                <h2 className="text-xl md:text-2xl font-normal text-[var(--md-sys-color-on-surface,#1E293B)] leading-tight truncate">
                  {booking.service || 'N/A'}
                </h2>
                <p className="text-sm md:text-base text-[var(--md-sys-color-on-surface-variant,#64748B)] flex items-center gap-2 mt-1.5 flex-wrap">
                  <i className="fas fa-calendar-alt text-xs opacity-70" />
                  {formatDate(booking.date)}
                  <span className="text-[var(--md-sys-color-outline,#E2E8F0)]">•</span>
                  <i className="fas fa-clock text-xs opacity-70" />
                  {booking.time}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Mobile actions menu toggle - MD3 icon button */}
                <button
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                  className="sm:hidden w-11 h-11 rounded-full bg-transparent text-[var(--md-sys-color-on-surface-variant,#64748B)] flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant,#F1F5F9)] active:bg-[var(--md-sys-color-surface-variant,#F1F5F9)] transition-all"
                >
                  <i className="fas fa-ellipsis-v text-base" />
                </button>
                <button
                  onClick={handleDelete}
                  className="w-11 h-11 rounded-full bg-transparent text-[var(--md-sys-color-on-surface-variant,#64748B)] flex items-center justify-center hover:bg-[var(--md-sys-color-error-container,#FEE2E2)] hover:text-[var(--md-sys-color-error,#EF4444)] active:bg-[var(--md-sys-color-error-container,#FEE2E2)] transition-all"
                  title="Delete"
                >
                  <i className="fas fa-trash-alt text-base" />
                </button>
                <button
                  onClick={onClose}
                  className="w-11 h-11 rounded-full bg-transparent text-[var(--md-sys-color-on-surface-variant,#64748B)] flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant,#F1F5F9)] active:bg-[var(--md-sys-color-surface-variant,#F1F5F9)] transition-all"
                >
                  <i className="fas fa-times text-base" />
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 md:px-6 py-4 md:py-5 space-y-5 md:space-y-6">
            {/* Client Card - MD3 elevated card */}
            <div className="bg-gradient-to-br from-[var(--md-sys-color-primary-container,#F3E8FF)] to-[var(--md-sys-color-surface,#F8FAFC)] rounded-[16px] p-4 md:p-5 border border-[var(--md-sys-color-outline-variant,#E2E8F0)] shadow-md3-level1">
              <div className="flex items-center gap-3 md:gap-4 mb-4">
                {/* Avatar - MD3 large avatar */}
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-[16px] bg-gradient-to-br from-[var(--md-sys-color-primary,#8B5CF6)] to-[var(--md-sys-color-on-primary,#7C3AED)] text-[var(--md-sys-color-on-primary,white)] flex items-center justify-center font-medium text-2xl md:text-3xl shrink-0 relative shadow-md3-level2">
                  {safeFirstLetter}
                  {booking.verified && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[var(--md-sys-color-tertiary,#10B981)] text-white rounded-full flex items-center justify-center text-xs border-2 border-white">
                      <i className="fas fa-check" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-lg md:text-xl text-[var(--md-sys-color-on-surface,#1E293B)] truncate">
                    {booking.client}
                  </div>
                  <div className="text-sm md:text-base text-[var(--md-sys-color-on-surface-variant,#64748B)] flex items-center gap-2">
                    <i className="fab fa-whatsapp text-[#25D366] text-sm" />
                    <span className="truncate">{booking.phone}</span>
                  </div>
                  {booking.email && (
                    <div className="text-sm text-[var(--md-sys-color-on-surface-variant,#64748B)] flex items-center gap-2 mt-0.5">
                      <i className="fas fa-envelope text-[var(--md-sys-color-primary,#8B5CF6)] text-xs" />
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
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--md-sys-color-secondary-container,#DCFCE7)] text-[var(--md-sys-color-on-secondary-container,#059669)] rounded-full font-medium text-sm md:text-base hover:bg-[var(--md-sys-color-secondary,#10B981)] hover:text-white transition-all active:scale-95 border-none"
                >
                  <i className="fab fa-whatsapp text-base" />
                  WhatsApp
                </a>
                <a
                  href={`tel:${booking.phone}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--md-sys-color-surface-variant,#F1F5F9)] text-[var(--md-sys-color-on-surface-variant,#475569)] rounded-full font-medium text-sm md:text-base hover:bg-[var(--md-sys-color-primary,#8b5cf6)] hover:text-white transition-all active:scale-95 border-none"
                >
                  <i className="fas fa-phone text-sm" />
                  Call
                </a>
              </div>
            </div>

            {/* Details Grid */}
            <div>
              <h3 className="text-xs md:text-sm font-medium text-[var(--md-sys-color-on-surface-variant,#94a3b8)] mb-3 flex items-center gap-2">
                <i className="fas fa-info-circle" />
                Booking Details
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                <DetailCard icon="fa-calendar" iconBg="bg-[var(--md-sys-color-primary-container,#ede9fe)]" iconColor="text-[var(--md-sys-color-on-primary-container,#8b5cf6)]" label="Date" value={formatDate(booking.date)} />
                <DetailCard icon="fa-clock" iconBg="bg-[var(--md-sys-color-tertiary-container,#d1fae5)]" iconColor="text-[var(--md-sys-color-on-tertiary-container,#10b981)]" label="Time" value={booking.time} subValue={booking.duration} />
                <DetailCard icon="fa-map-marker-alt" iconBg="bg-[var(--md-sys-color-secondary-container,#ffedd5)]" iconColor="text-[var(--md-sys-color-on-secondary-container,#f97316)]" label="Location" value={booking.location} />
                {booking.packageTier && (
                  <DetailCard icon="fa-layer-group" iconBg="bg-[var(--md-sys-color-primary-container,#ede9fe)]" iconColor="text-[var(--md-sys-color-on-primary-container,#8b5cf6)]" label="Package" value={booking.packageTier} />
                )}
                {booking.source && (
                  <DetailCard
                    icon={booking.source === "whatsapp" ? "fa-whatsapp" : booking.source === "online" ? "fa-globe" : "fa-phone"}
                    iconBg="bg-[var(--md-sys-color-surface-variant,#dbeafe)]"
                    iconColor="text-[var(--md-sys-color-primary,#3b82f6)]"
                    label="Source"
                    value={booking.source}
                  />
                )}
                {booking.assignedTo && (
                  <DetailCard icon="fa-user-tie" iconBg="bg-[var(--md-sys-color-primary-container,#ede9fe)]" iconColor="text-[var(--md-sys-color-on-primary-container,#8b5cf6)]" label="Assigned" value={booking.assignedTo} />
                )}
              </div>
            </div>

            {/* Payment Section */}
            <div>
              <h3 className="text-xs md:text-sm font-medium text-[var(--md-sys-color-on-surface-variant,#94a3b8)] mb-3 flex items-center gap-2">
                <i className="fas fa-credit-card" />
                Payment
              </h3>
              <div className="bg-[var(--md-sys-color-surface,white)] rounded-[16px] md:rounded-[20px] p-4 md:p-5 border border-[var(--md-sys-color-outline-variant,#e2e8f0)] shadow-md3-level1 space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-[var(--md-sys-color-outline-variant,#e2e8f0)]">
                  <span className="text-sm md:text-base text-[var(--md-sys-color-on-surface-variant,#64748b)]">Total Price</span>
                  <span className="font-medium text-xl md:text-2xl text-[var(--md-sys-color-primary,#8b5cf6)]">{formatCurrency(booking.price)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm md:text-base text-[var(--md-sys-color-on-surface-variant,#64748b)]">Deposit Paid</span>
                  <span className="font-medium text-[var(--md-sys-color-tertiary,#10b981)]">{formatCurrency(booking.deposit || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm md:text-base text-[var(--md-sys-color-on-surface-variant,#64748b)]">Balance Due</span>
                  <span className={`font-medium ${balanceDue > 0 ? "text-[var(--md-sys-color-error,#f59e0b)]" : "text-[var(--md-sys-color-tertiary,#10b981)]"}`}>
                    {formatCurrency(balanceDue)}
                  </span>
                </div>

                {/* Payment progress bar - MD3 linear progress indicator */}
                <div className="pt-2">
                  <div className="h-1.5 bg-[var(--md-sys-color-surface-variant,#e2e8f0)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--md-sys-color-primary,#8b5cf6)] to-[var(--md-sys-color-tertiary,#10b981)] transition-all duration-500"
                      style={{ width: `${Math.min(((booking.deposit || 0) / booking.price) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[var(--md-sys-color-outline-variant,#e2e8f0)]">
                  <span className="text-sm md:text-base text-[var(--md-sys-color-on-surface-variant,#64748b)]">Status</span>
                  <span className={`
                    inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium uppercase
                    ${payConfig.bg} ${payConfig.text}
                  `}>
                    <i className={`fas ${payConfig.icon} text-[9px]`} />
                    {booking.paymentStatus || "Unpaid"}
                  </span>
                </div>

                {booking.paymentMethod && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm md:text-base text-[var(--md-sys-color-on-surface-variant,#64748b)]">Method</span>
                    <span className="text-sm md:text-base font-medium text-[var(--md-sys-color-on-surface,#1e293b)] capitalize flex items-center gap-1.5">
                      <i className={`fas ${
                        booking.paymentMethod === "mpesa" ? "fa-mobile-alt" :
                        booking.paymentMethod === "card" ? "fa-credit-card" :
                        booking.paymentMethod === "bank" ? "fa-university" :
                        "fa-money-bill-wave"
                      } text-[var(--md-sys-color-primary,#8b5cf6)] text-sm`} />
                      {booking.paymentMethod}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Proof */}
            {booking.paymentProof && (
              <div>
                <h3 className="text-xs md:text-sm font-medium text-[var(--md-sys-color-tertiary,#10b981)] mb-3 flex items-center gap-2">
                  <i className="fas fa-check-circle" />
                  Payment Confirmed
                </h3>
                <div className="bg-gradient-to-br from-[var(--md-sys-color-tertiary-container,#f0fdf4)] to-[var(--md-sys-color-surface,#ecfdf5)] rounded-[16px] md:rounded-[20px] p-4 md:p-5 border border-[var(--md-sys-color-tertiary,#10b981)]/20 shadow-md3-level1 space-y-3">
                  {booking.paymentProof.transactionId && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm md:text-base text-[var(--md-sys-color-on-surface-variant,#64748b)]">Transaction ID</span>
                      <span className="font-mono font-medium text-sm md:text-base text-[var(--md-sys-color-on-surface,#1e293b)]">{booking.paymentProof.transactionId}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm md:text-base text-[var(--md-sys-color-on-surface-variant,#64748b)]">Amount Paid</span>
                    <span className="font-medium text-[var(--md-sys-color-tertiary,#10b981)]">{formatCurrency(booking.paymentProof.amount)}</span>
                  </div>
                  {booking.paymentProof.confirmedBy && (
                    <div className="flex justify-between items-center pt-2 border-t border-[var(--md-sys-color-tertiary,#10b981)]/10">
                      <span className="text-sm md:text-base text-[var(--md-sys-color-on-surface-variant,#64748b)]">Confirmed By</span>
                      <span className="text-sm md:text-base font-medium text-[var(--md-sys-color-on-surface,#1e293b)]">{booking.paymentProof.confirmedBy}</span>
                    </div>
                  )}
                  {booking.paymentProof.proofImage && (
                    <div className="pt-2 border-t border-[var(--md-sys-color-tertiary,#10b981)]/10">
                      <div className="text-sm md:text-base text-[var(--md-sys-color-on-surface-variant,#64748b)] mb-2">Proof</div>
                      <div
                        className="rounded-[12px] overflow-hidden border border-[var(--md-sys-color-tertiary,#10b981)]/20 cursor-pointer hover:opacity-90 transition-opacity"
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
                <h3 className="text-xs md:text-sm font-medium text-[var(--md-sys-color-on-surface-variant,#94a3b8)] mb-3 flex items-center gap-2">
                  <i className="fas fa-sticky-note" />
                  Notes
                </h3>
                <div className="bg-[var(--md-sys-color-surface,white)] rounded-[16px] p-4 border border-[var(--md-sys-color-outline-variant,#e2e8f0)] shadow-md3-level1">
                  <p className="text-sm md:text-base text-[var(--md-sys-color-on-surface-variant,#64748b)] leading-relaxed">{booking.notes}</p>
                </div>
              </div>
            )}

            {/* Cancellation Reason */}
            {isCancelled && booking.cancellationReason && (
              <div>
                <h3 className="text-xs md:text-sm font-medium text-[var(--md-sys-color-error,#ef4444)] mb-3 flex items-center gap-2">
                  <i className="fas fa-exclamation-triangle" />
                  Cancellation Reason
                </h3>
                <div className="bg-[var(--md-sys-color-error-container,#fef2f2)] rounded-[16px] p-4 border border-[var(--md-sys-color-error,#ef4444)]/20 shadow-md3-level1">
                  <p className="text-sm md:text-base text-[var(--md-sys-color-error,#ef4444)] leading-relaxed">{booking.cancellationReason}</p>
                </div>
              </div>
            )}

            {/* Booking Reference */}
            <div>
              <h3 className="text-xs md:text-sm font-medium text-[var(--md-sys-color-on-surface-variant,#94a3b8)] mb-3 flex items-center gap-2">
                <i className="fas fa-fingerprint" />
                Reference
              </h3>
              <div className="bg-[var(--md-sys-color-surface,white)] rounded-[16px] p-4 border border-[var(--md-sys-color-outline-variant,#e2e8f0)] shadow-md3-level1 space-y-3">
                <div className="flex items-center justify-between">
                  <code className="text-sm md:text-base font-mono text-[var(--md-sys-color-primary,#8b5cf6)] font-medium truncate max-w-[200px]">
                    {booking.id}
                  </code>
                  <button
                    onClick={handleCopyId}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[var(--md-sys-color-primary-container,#ede9fe)] text-[var(--md-sys-color-on-primary-container,#8b5cf6)] rounded-full text-sm font-medium hover:bg-[var(--md-sys-color-primary,#8b5cf6)] hover:text-white transition-all active:scale-95 shrink-0 ml-2"
                  >
                    <i className="fas fa-copy text-xs" />
                    Copy
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--md-sys-color-outline-variant,#e2e8f0)] text-sm">
                  <div>
                    <div className="text-[var(--md-sys-color-on-surface-variant,#94a3b8)] font-medium mb-0.5">Created</div>
                    <div className="font-medium text-[var(--md-sys-color-on-surface,#1e293b)]">
                      {booking.createdAt?.toDate ? booking.createdAt.toDate().toLocaleDateString() : "Recent"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--md-sys-color-on-surface-variant,#94a3b8)] font-medium mb-0.5">Updated</div>
                    <div className="font-medium text-[var(--md-sys-color-on-surface,#1e293b)]">
                      {booking.updatedAt?.toDate ? booking.updatedAt.toDate().toLocaleDateString() : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions - MD3 buttons optimized for mobile */}
          <div className="shrink-0 p-4 md:p-5 border-t border-[var(--md-sys-color-outline-variant,#e2e8f0)] bg-[var(--md-sys-color-surface,white)]">
            {/* Mobile: Single column with clear labels | Desktop: Grid layout */}
            <div className="flex flex-col gap-2">
              {/* Primary Action - Edit (if available) */}
              {onEdit && (
                <ActionButton 
                  icon="fa-edit" 
                  label="Edit Booking" 
                  variant="primary" 
                  onClick={() => onEdit(booking)} 
                />
              )}
              
              {/* Payment Action (if unpaid) */}
              {onOpenPaymentModal && booking.paymentStatus !== "paid" && (
                <ActionButton
                  icon="fa-check-circle"
                  label="Confirm Payment"
                  variant="success"
                  onClick={onOpenPaymentModal}
                />
              )}
              
              {/* Reminder Button */}
              {onSendReminder && (
                <ActionButton
                  icon="fa-bell"
                  label="Send Reminder"
                  variant="default"
                  onClick={handleSendReminder}
                  loading={sendingMessage}
                />
              )}
              
              {/* Divider for status actions */}
              {!isCompleted && !isCancelled && (
                <div className="h-px bg-[var(--md-sys-color-outline-variant,#e2e8f0)] my-1" />
              )}
              
              {/* Status Change Actions - Only show relevant ones */}
              <div className="grid grid-cols-2 gap-2">
                {!isCompleted && !isCancelled && booking.status !== "confirmed" && (
                  <ActionButton
                    icon="fa-check-circle"
                    label="Confirm"
                    variant="primary"
                    onClick={() => handleStatusUpdate("confirmed")}
                  />
                )}
                
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
                
                {/* Close button - always visible */}
                <ActionButton 
                  icon="fa-times" 
                  label="Close" 
                  variant="default" 
                  onClick={onClose} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}