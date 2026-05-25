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

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; icon: string; dot: string; gradient: string }> = {
  confirmed: {
    bg: "bg-[#D1FAE5]",
    text: "text-[#059669]",
    border: "border-[#059669]/20",
    icon: "fa-check-circle",
    dot: "bg-[#059669]",
    gradient: "from-[#059669] to-[#10B981]",
  },
  pending: {
    bg: "bg-[#FEF3C7]",
    text: "text-[#D97706]",
    border: "border-[#D97706]/20",
    icon: "fa-clock",
    dot: "bg-[#D97706]",
    gradient: "from-[#D97706] to-[#F59E0B]",
  },
  completed: {
    bg: "bg-[#EFF6FF]",
    text: "text-[#2563EB]",
    border: "border-[#2563EB]/20",
    icon: "fa-check-double",
    dot: "bg-[#2563EB]",
    gradient: "from-[#2563EB] to-[#3B82F6]",
  },
  cancelled: {
    bg: "bg-[#FEE2E2]",
    text: "text-[#DC2626]",
    border: "border-[#DC2626]/20",
    icon: "fa-times-circle",
    dot: "bg-[#DC2626]",
    gradient: "from-[#DC2626] to-[#EF4444]",
  },
};

const PAYMENT_CONFIG: Record<string, { bg: string; text: string; border: string; icon: string; gradient: string }> = {
  paid: { bg: "bg-[#D1FAE5]", text: "text-[#059669]", border: "border-[#059669]/20", icon: "fa-check-circle", gradient: "from-[#059669] to-[#10B981]" },
  partial: { bg: "bg-[#FEF3C7]", text: "text-[#D97706]", border: "border-[#D97706]/20", icon: "fa-adjust", gradient: "from-[#D97706] to-[#F59E0B]" },
  unpaid: { bg: "bg-[#FEE2E2]", text: "text-[#DC2626]", border: "border-[#DC2626]/20", icon: "fa-times-circle", gradient: "from-[#DC2626] to-[#EF4444]" },
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
    gradient: "from-[#94A3B8] to-[#94A3B8]",
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
            text-sm font-semibold animate-slideInRight backdrop-blur-md
            ${toast.type === "success" ? "bg-[#10B981]/95 text-white" : ""}
            ${toast.type === "error" ? "bg-[#EF4444]/95 text-white" : ""}
            ${toast.type === "info" ? "bg-[#8B5CF6]/95 text-white" : ""}
          `}
        >
          <i className={`fas ${toast.type === "success" ? "fa-check-circle" : toast.type === "error" ? "fa-exclamation-circle" : "fa-info-circle"}`} />
          {toast.message}
          <button onClick={() => onRemove(toast.id)} className="ml-2 opacity-70 hover:opacity-100 transition-opacity">
            <i className="fas fa-times text-xs" />
          </button>
        </div>
      ))}
    </div>
  );
}

function StatCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  delay = 0,
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`
        bg-surface rounded-2xl p-3.5 md:p-4 border border-outline-variant
        transition-all duration-500 ease-out cursor-default
        hover:shadow-md3-level2 hover:-translate-y-0.5
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center mb-2.5 transition-transform duration-300 group-hover:scale-110`}>
        <i className={`fas ${icon} text-sm md:text-base`} />
      </div>
      <div className="text-[10px] md:text-xs text-outline font-bold uppercase tracking-wider mb-0.5">{label}</div>
      <div className="font-extrabold text-sm md:text-base text-on-surface truncate">{value}</div>
    </div>
  );
}

function PremiumSectionHeader({ icon, title, color = "#8B5CF6" }: { icon: string; title: string; color?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
        <i className={`fas ${icon} text-xs`} style={{ color }} />
      </div>
      <span className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-on-surface-variant">{title}</span>
    </div>
  );
}

function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[2500] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <img src={src} alt="Payment proof" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 hover:rotate-90 transition-all duration-300"
      >
        <i className="fas fa-times" />
      </button>
    </div>
  );
}

function PremiumActionButton({
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
    default:
      "bg-surface text-on-surface-variant border-2 border-outline-variant hover:border-[#8B5CF6]/30 hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/5",
    danger:
      "bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white shadow-lg shadow-[#EF4444]/25 hover:shadow-xl hover:shadow-[#EF4444]/30",
    success:
      "bg-gradient-to-r from-[#10B981] to-[#059669] text-white shadow-lg shadow-[#10B981]/25 hover:shadow-xl hover:shadow-[#10B981]/30",
    whatsapp:
      "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white shadow-lg shadow-[#25D366]/25 hover:shadow-xl hover:shadow-[#25D366]/30",
    primary:
      "bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white shadow-lg shadow-[#8B5CF6]/25 hover:shadow-xl hover:shadow-[#8B5CF6]/30",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl font-bold text-sm
        transition-all duration-200 active:scale-[0.97] w-full
        ${variants[variant]}
        ${disabled || loading ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-0.5"}
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
  const contentRef = useRef<HTMLDivElement>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

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
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [open]);

  // Scroll progress
  const handleScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const progress = el.scrollTop / (el.scrollHeight - el.clientHeight);
    setScrollProgress(Math.min(progress, 1));
  }, []);

  // Close with animation
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  }, [onClose]);

  // Keyboard & outside click handlers
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
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
  }, [open, handleClose]);

  // All hooks must be called BEFORE early return
  const statusConfig = booking ? getStatusConfig(booking.status) : null;
  const paymentConfig = booking ? getPaymentConfig(booking.paymentStatus) : null;
  const balanceDue = booking ? Math.max(0, (booking.balance ?? booking.price) - (booking.deposit || 0)) : 0;
  const isCompleted = booking?.status === "completed";
  const isCancelled = booking?.status === "cancelled";

  const handleCopyId = useCallback(() => {
    if (!booking) return;
    navigator.clipboard.writeText(booking.id);
    addToast("Booking ID copied!", "success");
  }, [booking?.id, addToast]);

  const handleCopyPhone = useCallback(() => {
    if (!booking) return;
    navigator.clipboard.writeText(booking.phone);
    addToast("Phone number copied!", "success");
  }, [booking?.phone, addToast]);

  const handleCopyEmail = useCallback(() => {
    if (!booking?.email) return;
    navigator.clipboard.writeText(booking.email);
    addToast("Email copied!", "success");
  }, [booking?.email, addToast]);

  // Valid status transitions (disallow invalid transitions)
  const VALID_TRANSITIONS: Record<string, Set<string>> = {
    confirmed: new Set(["completed", "cancelled"]),
    pending: new Set(["confirmed", "completed", "cancelled"]),
    completed: new Set([]), // No transitions from completed
    cancelled: new Set([]), // No transitions from cancelled
  };

  const isTransitionValid = useCallback(
    (targetStatus: string): boolean => {
      if (!booking) return false;
      return VALID_TRANSITIONS[booking.status]?.has(targetStatus) ?? false;
    },
    [booking?.status]
  );

  const safeFirstLetter = useMemo(() => {
    const clientName = booking?.client || "";
    return clientName ? clientName.charAt(0).toUpperCase() : "?";
  }, [booking?.client]);

  const handleSendReminder = useCallback(async () => {
    if (!booking || !onSendReminder) return;
    setSendingMessage(true);
    try {
      await onSendReminder(booking.id);
      addToast("Reminder sent!", "success");
    } catch {
      addToast("Failed to send reminder", "error");
    } finally {
      setSendingMessage(false);
    }
  }, [booking?.id, onSendReminder, addToast]);

  const handleStatusUpdate = useCallback(
    (status: Booking["status"]) => {
      if (!booking) return;
      onUpdateStatus?.(booking.id, status);
      addToast(`Marked as ${status}`, "success");
    },
    [booking?.id, onUpdateStatus, addToast]
  );

  const handleDelete = useCallback(() => {
    if (!booking) return;
    if (window.confirm("Are you sure you want to delete this booking? This action cannot be undone.")) {
      onDelete?.(booking.id);
      handleClose();
    }
  }, [booking?.id, onDelete, handleClose]);

  if (!open || !booking) return null;

  const config = statusConfig!;
  const payConfig = paymentConfig!;
  const isUnpaid = booking.paymentStatus !== "paid";

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
      {lightboxImage && <ImageLightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />}

      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4
          transition-all duration-300
          ${isClosing ? "opacity-0" : "opacity-100"}
        `}
        onClick={handleClose}
      >
        <div
          className={`
            absolute inset-0 transition-all duration-300
            ${isClosing ? "bg-black/0 backdrop-blur-0" : "bg-black/60 backdrop-blur-sm"}
          `}
        />

        {/* Modal */}
        <div
          ref={modalRef}
          className={`
            relative w-full max-w-[680px] max-h-[94vh] sm:max-h-[88vh]
            rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col
            transition-all duration-300 ease-out
            bg-surface
            ${isVisible && !isClosing
              ? "opacity-100 translate-y-0 sm:scale-100"
              : "opacity-0 translate-y-12 sm:scale-[0.97]"
            }
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Scroll progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-surface-variant z-30">
            <div
              className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] rounded-full transition-all duration-150"
              style={{ width: `${scrollProgress * 100}%` }}
            />
          </div>

          {/* ========== HERO HEADER ========== */}
          <div className={`relative h-48 md:h-56 shrink-0 bg-gradient-to-br ${config.gradient}`}>
            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-8 -right-8 text-9xl text-white/20">📅</div>
              <div className="absolute bottom-4 left-4 text-5xl opacity-50 text-white/20">✦</div>
              <div className="absolute top-6 right-12 text-3xl opacity-30 text-white/20">✦</div>
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />

            {/* Hero content */}
            <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/20">
                  <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${booking.status === "pending" ? "animate-pulse" : ""}`} />
                  <i className={`fas ${config.icon} text-[9px]`} />
                  {booking.status}
                </span>
                {booking.verified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#10B981]/80 backdrop-blur-md text-white border border-white/20">
                    <i className="fas fa-badge-check text-[9px]" />
                    Verified
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-1 leading-tight">{booking.service || "N/A"}</h1>
              <div className="flex items-center gap-3 text-sm text-white/80 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <i className="fas fa-calendar-alt text-xs opacity-70" />
                  {formatDate(booking.date)}
                </span>
                <span className="text-white/40">•</span>
                <span className="flex items-center gap-1.5">
                  <i className="fas fa-clock text-xs opacity-70" />
                  {booking.time}
                </span>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/30 hover:rotate-90 transition-all duration-300 z-10 border border-white/20"
            >
              <i className="fas fa-times" />
            </button>
          </div>

          {/* ========== SCROLLABLE BODY ========== */}
          <div
            ref={contentRef}
            className="flex-1 overflow-y-auto scroll-smooth"
            onScroll={handleScroll}
          >
            {/* ─── Quick Stats Grid ─── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3 p-4 md:p-5 border-b border-outline-variant bg-gradient-to-b from-surface to-surface-variant/30">
              <StatCard icon="fa-calendar" iconBg="bg-[#EDE9FE]" iconColor="text-[#8B5CF6]" label="Date" value={formatDate(booking.date)} delay={0} />
              <StatCard icon="fa-clock" iconBg="bg-[#D1FAE5]" iconColor="text-[#10B981]" label="Time" value={booking.time} delay={80} />
              <StatCard icon="fa-map-marker-alt" iconBg="bg-[#FEF3C7]" iconColor="text-[#F59E0B]" label="Location" value={booking.location} delay={160} />
              <StatCard icon="fa-tag" iconBg="bg-[#DBEAFE]" iconColor="text-[#3B82F6]" label="Price" value={formatCurrency(booking.price)} delay={240} />
            </div>

            {/* ─── Client Profile Card ─── */}
            <div className="p-4 md:p-5">
              <PremiumSectionHeader icon="fa-user" title="Client" color="#8B5CF6" />
              <div className="bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] rounded-2xl p-4 md:p-5 border border-outline-variant shadow-md3-level1 hover:shadow-md3-level2 transition-shadow duration-300">
                <div className="flex items-center gap-4 md:gap-5 mb-5">
                  {/* Premium Avatar */}
                  <div className="relative">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] text-white flex items-center justify-center font-bold text-2xl md:text-3xl shadow-md3-level3 shadow-[#8B5CF6]/30">
                      {safeFirstLetter}
                    </div>
                    {booking.verified && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-[#10B981] to-[#059669] text-white rounded-full flex items-center justify-center text-[10px] border-[3px] border-white shadow-md3-level2">
                        <i className="fas fa-check" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-lg md:text-xl text-on-surface truncate">{booking.client}</div>
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="flex items-center gap-2 text-sm text-on-surface-variant group">
                        <i className="fab fa-whatsapp text-[#25D366] text-sm" />
                        <span className="truncate">{booking.phone}</span>
                        <button
                          onClick={handleCopyPhone}
                          className="shrink-0 opacity-0 md:group-hover:opacity-100 transition-opacity w-5 h-5 rounded-md bg-[#EDE9FE] text-[#8B5CF6] flex items-center justify-center hover:bg-[#8B5CF6] hover:text-white active:scale-90"
                          title="Copy phone number"
                        >
                          <i className="fas fa-copy text-[8px]" />
                        </button>
                      </div>
                      {booking.email && (
                        <div className="flex items-center gap-2 text-sm text-on-surface-variant group">
                          <i className="fas fa-envelope text-[#8B5CF6] text-xs" />
                          <span className="truncate">{booking.email}</span>
                          <button
                            onClick={handleCopyEmail}
                            className="shrink-0 opacity-0 md:group-hover:opacity-100 transition-opacity w-5 h-5 rounded-md bg-[#EDE9FE] text-[#8B5CF6] flex items-center justify-center hover:bg-[#8B5CF6] hover:text-white active:scale-90"
                            title="Copy email"
                          >
                            <i className="fas fa-copy text-[8px]" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick action buttons */}
                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href={`https://wa.me/${booking.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-bold text-sm shadow-md3-level2 shadow-[#25D366]/20 hover:shadow-md3-level3 hover:-translate-y-0.5 transition-all active:scale-[0.97]"
                  >
                    <i className="fab fa-whatsapp text-base" />
                    WhatsApp
                  </a>
                  <a
                    href={`tel:${booking.phone}`}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-surface border-2 border-outline-variant text-on-surface rounded-xl font-bold text-sm hover:border-[#8B5CF6]/40 hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/5 transition-all active:scale-[0.97]"
                  >
                    <i className="fas fa-phone text-sm" />
                    Call
                  </a>
                </div>
              </div>
            </div>

            {/* ─── Payment Section ─── */}
            <div className="px-4 md:px-5 pb-2">
              <PremiumSectionHeader icon="fa-credit-card" title="Payment" color="#10B981" />
              <div className="bg-gradient-to-br from-[#F0FDF4] to-[#ECFDF5] rounded-2xl p-4 md:p-5 border border-[#10B981]/20 shadow-md3-level1 space-y-3">
                {/* Total */}
                <div className="flex justify-between items-center pb-3 border-b border-[#10B981]/10">
                  <span className="text-sm text-on-surface-variant font-medium">Total Price</span>
                  <span className="font-extrabold text-2xl md:text-3xl text-[#8B5CF6]">{formatCurrency(booking.price)}</span>
                </div>

                {/* Deposit & Balance */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/60 rounded-xl p-3">
                    <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Deposit Paid</div>
                    <div className="font-bold text-lg text-[#10B981]">{formatCurrency(booking.deposit || 0)}</div>
                  </div>
                  <div className="bg-white/60 rounded-xl p-3">
                    <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Balance Due</div>
                    <div className={`font-bold text-lg ${balanceDue > 0 ? "text-[#F59E0B]" : "text-[#10B981]"}`}>
                      {formatCurrency(balanceDue)}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="pt-1">
                  <div className="h-2 bg-white/80 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#10B981] transition-all duration-700 ease-out"
                      style={{ width: `${Math.min(((booking.deposit || 0) / booking.price) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Payment status & method */}
                <div className="flex justify-between items-center pt-2 border-t border-[#10B981]/10">
                  <span className="text-sm text-on-surface-variant">Status</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${payConfig.bg} ${payConfig.text}`}>
                    <i className={`fas ${payConfig.icon} text-[9px]`} />
                    {booking.paymentStatus || "Unpaid"}
                  </span>
                </div>

                {booking.paymentMethod && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-on-surface-variant">Method</span>
                    <span className="text-sm font-bold text-on-surface capitalize flex items-center gap-1.5">
                      <i className={`fas ${
                        booking.paymentMethod === "mpesa" ? "fa-mobile-alt" :
                        booking.paymentMethod === "card" ? "fa-credit-card" :
                        booking.paymentMethod === "bank" ? "fa-university" :
                        "fa-money-bill-wave"
                      } text-[#8B5CF6] text-sm`} />
                      {booking.paymentMethod}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ─── Payment Proof ─── */}
            {booking.paymentProof && (
              <div className="px-4 md:px-5 pb-2">
                <PremiumSectionHeader icon="fa-check-circle" title="Payment Confirmed" color="#10B981" />
                <div className="bg-gradient-to-br from-[#F0FDF4] to-[#ECFDF5] rounded-2xl p-4 md:p-5 border border-[#10B981]/20 shadow-md3-level1 space-y-3">
                  {booking.paymentProof.transactionId && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-on-surface-variant">Transaction ID</span>
                      <span className="font-mono font-bold text-sm text-on-surface">{booking.paymentProof.transactionId}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-on-surface-variant">Amount Paid</span>
                    <span className="font-extrabold text-lg text-[#10B981]">{formatCurrency(booking.paymentProof.amount)}</span>
                  </div>
                  {booking.paymentProof.confirmedBy && (
                    <div className="flex justify-between items-center pt-2 border-t border-[#10B981]/10">
                      <span className="text-sm text-on-surface-variant">Confirmed By</span>
                      <span className="font-bold text-sm text-on-surface">{booking.paymentProof.confirmedBy}</span>
                    </div>
                  )}
                  {booking.paymentProof.proofImage && (
                    <div className="pt-2 border-t border-[#10B981]/10">
                      <div className="text-sm text-on-surface-variant mb-2">Proof</div>
                      <div
                        className="rounded-xl overflow-hidden border-2 border-[#10B981]/20 cursor-pointer hover:opacity-90 transition-all hover:shadow-md3-level2"
                        onClick={() => booking.paymentProof?.proofImage && setLightboxImage(booking.paymentProof.proofImage)}
                      >
                        <img src={booking.paymentProof.proofImage} alt="Payment proof" className="w-full h-36 object-cover" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── Additional Details Grid ─── */}
            <div className="px-4 md:px-5 pb-2">
              <PremiumSectionHeader icon="fa-info-circle" title="Details" color="#3B82F6" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-3">
                {booking.packageTier && (
                  <div className="bg-white rounded-2xl p-3.5 border border-outline-variant hover:border-[#8B5CF6]/30 transition-all duration-200">
                    <div className="w-8 h-8 rounded-xl bg-[#EDE9FE] text-[#8B5CF6] flex items-center justify-center mb-2">
                      <i className="fas fa-layer-group text-xs" />
                    </div>
                    <div className="text-[10px] text-outline font-bold uppercase tracking-wide mb-0.5">Package</div>
                    <div className="font-bold text-sm text-on-surface">{booking.packageTier}</div>
                  </div>
                )}
                {booking.duration && (
                  <div className="bg-white rounded-2xl p-3.5 border border-outline-variant hover:border-[#8B5CF6]/30 transition-all duration-200">
                    <div className="w-8 h-8 rounded-xl bg-[#D1FAE5] text-[#10B981] flex items-center justify-center mb-2">
                      <i className="fas fa-hourglass-half text-xs" />
                    </div>
                    <div className="text-[10px] text-outline font-bold uppercase tracking-wide mb-0.5">Duration</div>
                    <div className="font-bold text-sm text-on-surface">{booking.duration}</div>
                  </div>
                )}
                {booking.source && (
                  <div className="bg-white rounded-2xl p-3.5 border border-outline-variant hover:border-[#8B5CF6]/30 transition-all duration-200">
                    <div className="w-8 h-8 rounded-xl bg-[#DBEAFE] text-[#3B82F6] flex items-center justify-center mb-2">
                      <i className={`fas ${
                        booking.source === "whatsapp" ? "fa-whatsapp" :
                        booking.source === "online" ? "fa-globe" : "fa-phone"
                      } text-xs`} />
                    </div>
                    <div className="text-[10px] text-outline font-bold uppercase tracking-wide mb-0.5">Source</div>
                    <div className="font-bold text-sm text-on-surface capitalize">{booking.source}</div>
                  </div>
                )}
                {booking.assignedTo && (
                  <div className="bg-white rounded-2xl p-3.5 border border-outline-variant hover:border-[#8B5CF6]/30 transition-all duration-200">
                    <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#F59E0B] flex items-center justify-center mb-2">
                      <i className="fas fa-user-tie text-xs" />
                    </div>
                    <div className="text-[10px] text-outline font-bold uppercase tracking-wide mb-0.5">Assigned</div>
                    <div className="font-bold text-sm text-on-surface">{booking.assignedTo}</div>
                  </div>
                )}
              </div>
            </div>

            {/* ─── Notes ─── */}
            {booking.notes && (
              <div className="px-4 md:px-5 pb-2">
                <PremiumSectionHeader icon="fa-sticky-note" title="Notes" color="#F59E0B" />
                <div className="bg-[#FFFBEB] rounded-2xl p-4 border border-[#FDE68A]/40 shadow-md3-level1">
                  <p className="text-sm text-[#92400E] leading-relaxed">{booking.notes}</p>
                </div>
              </div>
            )}

            {/* ─── Cancellation Reason ─── */}
            {isCancelled && booking.cancellationReason && (
              <div className="px-4 md:px-5 pb-2">
                <PremiumSectionHeader icon="fa-exclamation-triangle" title="Cancellation Reason" color="#EF4444" />
                <div className="bg-[#FEF2F2] rounded-2xl p-4 border border-[#FCA5A5]/40 shadow-md3-level1">
                  <p className="text-sm text-[#991B1B] leading-relaxed">{booking.cancellationReason}</p>
                </div>
              </div>
            )}

            {/* ─── Reference ─── */}
            <div className="px-4 md:px-5 pb-2">
              <PremiumSectionHeader icon="fa-fingerprint" title="Reference" color="#64748B" />
              <div className="bg-surface rounded-2xl p-4 border border-outline-variant shadow-md3-level1 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <code className="text-sm font-mono text-[#8B5CF6] font-bold truncate">{booking.id}</code>
                  <button
                    onClick={handleCopyId}
                    className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-[#EDE9FE] text-[#8B5CF6] rounded-xl text-sm font-bold hover:bg-[#8B5CF6] hover:text-white transition-all active:scale-95"
                  >
                    <i className="fas fa-copy text-xs" />
                    Copy
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-outline-variant">
                  <div>
                    <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-0.5">Created</div>
                    <div className="font-bold text-sm text-on-surface">
                      {booking.createdAt?.toDate ? booking.createdAt.toDate().toLocaleDateString() : "Recent"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-0.5">Updated</div>
                    <div className="font-bold text-sm text-on-surface">
                      {booking.updatedAt?.toDate ? booking.updatedAt.toDate().toLocaleDateString() : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom spacing */}
            <div className="h-2" />
          </div>

          {/* ========== FOOTER ACTIONS ========== */}
          <div className="shrink-0 p-4 md:p-5 border-t border-outline-variant bg-gradient-to-t from-surface to-surface/95">
            <div className="flex flex-col gap-2.5">
              {/* Primary actions row */}
              <div className="grid grid-cols-2 gap-2.5">
                {onEdit && (
                  <PremiumActionButton icon="fa-edit" label="Edit Booking" variant="primary" onClick={() => onEdit(booking)} />
                )}

                {onSendReminder && (
                  <PremiumActionButton
                    icon="fa-bell"
                    label="Reminder"
                    variant={onEdit ? "default" : "primary"}
                    onClick={handleSendReminder}
                    loading={sendingMessage}
                  />
                )}
              </div>

              {/* Payment action */}
              {onOpenPaymentModal && isUnpaid && (
                <PremiumActionButton
                  icon="fa-check-circle"
                  label="Confirm Payment"
                  variant="success"
                  onClick={onOpenPaymentModal}
                />
              )}

              {/* Status actions divider */}
              {!isCompleted && !isCancelled && (
                <div className="h-px bg-gradient-to-r from-transparent via-outline-variant to-transparent my-1" />
              )}

              {/* Status change actions */}
              {!isCompleted && !isCancelled && (
                <div className="grid grid-cols-2 gap-2.5">
                  {booking.status !== "confirmed" && (
                    <PremiumActionButton
                      icon="fa-check-circle"
                      label="Confirm"
                      variant="primary"
                      onClick={() => handleStatusUpdate("confirmed")}
                    />
                  )}

                  <PremiumActionButton
                    icon="fa-check"
                    label={booking.status === "pending" ? "Complete" : "Complete"}
                    variant="success"
                    onClick={() => handleStatusUpdate("completed")}
                  />
                </div>
              )}

              {/* Cancel + Close */}
              <div className="grid grid-cols-2 gap-2.5">
                {!isCancelled && (
                  <PremiumActionButton
                    icon="fa-times"
                    label="Cancel Booking"
                    variant="danger"
                    onClick={() => handleStatusUpdate("cancelled")}
                  />
                )}

                {/* Delete button (always visible) */}
                <PremiumActionButton
                  icon="fa-trash-alt"
                  label="Delete"
                  variant="danger"
                  onClick={handleDelete}
                />
              </div>

              {/* Close */}
              <PremiumActionButton icon="fa-times" label="Close" variant="default" onClick={handleClose} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
