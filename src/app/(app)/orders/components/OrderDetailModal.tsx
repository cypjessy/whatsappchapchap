"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Order, OrderStatus } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (status: OrderStatus) => Promise<void> | void;
  onPrintInvoice: (order: Order) => Promise<void> | void;
  onDuplicateOrder: (order: Order) => Promise<void> | void;
  onSendWhatsApp: (order: Order, status: OrderStatus) => Promise<void> | void;
  onCancelOrder: () => Promise<void> | void;
  onAddNote: (note: string) => Promise<void> | void;
  onMarkAsPaid: () => Promise<void> | void;
  getStatusBadge: (status?: string) => { bg: string; color: string; label: string; icon?: string };
  formatDate: (date: any) => string;
  formatTime: (date: any) => string;
  productImages?: Record<string, string>;
}

// ─── Status Theme Config ─────────────────────────────────────────────────────

interface StatusTheme {
  label: string;
  icon: string;
  gradient: string;
  accent: string;
  light: string;
  dot: string;
}

const STATUS_THEMES: Record<string, StatusTheme> = {
  pending: {
    label: "Pending",
    icon: "fa-clock",
    gradient: "from-amber-500 via-amber-400 to-yellow-500",
    accent: "#f59e0b",
    light: "#fffbeb",
    dot: "bg-amber-400",
  },
  confirmed: {
    label: "Confirmed",
    icon: "fa-check-circle",
    gradient: "from-blue-500 via-blue-400 to-indigo-500",
    accent: "#3b82f6",
    light: "#eff6ff",
    dot: "bg-blue-400",
  },
  processing: {
    label: "Processing",
    icon: "fa-cog",
    gradient: "from-purple-500 via-purple-400 to-fuchsia-500",
    accent: "#8b5cf6",
    light: "#f5f3ff",
    dot: "bg-purple-400",
  },
  shipped: {
    label: "Shipped",
    icon: "fa-truck",
    gradient: "from-indigo-500 via-indigo-400 to-blue-500",
    accent: "#6366f1",
    light: "#eef2ff",
    dot: "bg-indigo-400",
  },
  delivered: {
    label: "Delivered",
    icon: "fa-check-double",
    gradient: "from-emerald-500 via-emerald-400 to-teal-500",
    accent: "#10b981",
    light: "#ecfdf5",
    dot: "bg-emerald-400",
  },
  cancelled: {
    label: "Cancelled",
    icon: "fa-times-circle",
    gradient: "from-red-500 via-red-400 to-rose-500",
    accent: "#ef4444",
    light: "#fef2f2",
    dot: "bg-red-400",
  },
  refunded: {
    label: "Refunded",
    icon: "fa-undo",
    gradient: "from-amber-500 via-amber-400 to-orange-500",
    accent: "#f59e0b",
    light: "#fffbeb",
    dot: "bg-amber-400",
  },
};

const ALL_STATUSES: { value: OrderStatus; label: string; color: string; icon: string; desc: string }[] = [
  { value: "pending", label: "Pending", color: "#f59e0b", icon: "fa-clock", desc: "Awaiting payment confirmation" },
  { value: "confirmed", label: "Confirmed", color: "#3b82f6", icon: "fa-check-circle", desc: "Order confirmed by admin" },
  { value: "processing", label: "Processing", color: "#8b5cf6", icon: "fa-cog", desc: "Order is being prepared" },
  { value: "shipped", label: "Shipped", color: "#6366f1", icon: "fa-truck", desc: "Order is on its way" },
  { value: "delivered", label: "Delivered", color: "#10b981", icon: "fa-check-double", desc: "Order delivered successfully" },
  { value: "cancelled", label: "Cancelled", color: "#ef4444", icon: "fa-times-circle", desc: "Order has been cancelled" },
  { value: "refunded", label: "Refunded", color: "#f59e0b", icon: "fa-undo", desc: "Payment has been refunded" },
];

const VALID_TRANSITIONS: Record<string, Set<string>> = {
  pending: new Set(["confirmed", "cancelled", "refunded"]),
  confirmed: new Set(["processing", "cancelled"]),
  processing: new Set(["shipped", "cancelled"]),
  shipped: new Set(["delivered", "cancelled"]),
  delivered: new Set(["refunded"]),
  cancelled: new Set([]),
  refunded: new Set([]),
};

const STATUS_ORDER = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;

// ─── Image Viewer ────────────────────────────────────────────────────────────

function ImageViewer({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-lg p-4 animate-fadeIn"
      onClick={onClose}
    >
      <button
        className="absolute top-6 right-6 w-11 h-11 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/25 transition-all hover:scale-105 active:scale-95"
        onClick={onClose}
      >
        <i className="fas fa-times text-lg" />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-[88vh] rounded-2xl shadow-2xl object-contain animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ─── Confirmation Dialog ─────────────────────────────────────────────────────

function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  gradient,
  icon,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  gradient: string;
  icon: string;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm animate-modalSlideUp">
        <div className="bg-surface rounded-3xl shadow-2xl overflow-hidden border border-outline-variant/50">
          {/* Gradient top accent */}
          <div className={`h-2 bg-gradient-to-r ${gradient}`} />
          <div className="p-6 pt-5">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mx-auto mb-5 shadow-lg`}>
              <i className={`fas ${icon} text-2xl text-white`} />
            </div>
            <h3 className="text-xl font-bold text-on-surface text-center mb-2">{title}</h3>
            <p className="text-on-surface-variant text-center mb-7 text-sm leading-relaxed">{message}</p>
            <div className="flex gap-3">
              <button
                className="flex-1 px-5 py-3.5 bg-surface dim:text-surface-dim-hover rounded-2xl font-semibold text-sm text-on-surface border-2 border-outline-variant hover:bg-surface-variant transition-all active:scale-[0.97]"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className={`flex-1 px-5 py-3.5 bg-gradient-to-r ${gradient} text-white rounded-2xl font-semibold text-sm shadow-lg transition-all active:scale-[0.97] hover:shadow-xl flex items-center justify-center gap-2`}
                onClick={onConfirm}
                aria-label={confirmText}
              >
                <i className={`fas ${icon} text-xs`} />
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Status Dropdown (MD3 Menu) ──────────────────────────────────────────────

function StatusMenu({
  currentStatus,
  onUpdate,
  isOpen,
  onClose,
}: {
  currentStatus: string;
  onUpdate: (status: OrderStatus) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: Event) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside, { passive: true });
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 bg-surface rounded-2xl shadow-2xl border border-outline-variant min-w-[240px] z-50 overflow-hidden origin-top-right"
      style={{
        boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      <div className="py-2">
        <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
          Change Status
        </div>
        {ALL_STATUSES.map((s) => {
          const isCurrentStatus = currentStatus === s.value;
          const isAvailable = VALID_TRANSITIONS[currentStatus]?.has(s.value);
          const disabled = !isCurrentStatus && !isAvailable;

          return (
            <button
              key={s.value}
              disabled={disabled}
              className={`w-full px-4 py-3 text-sm flex items-center gap-3 transition-all text-left ${
                isCurrentStatus
                  ? "bg-surface-container-high"
                  : "hover:bg-surface-container-low"
              } ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
              onClick={() => {
                if (disabled) return;
                onUpdate(s.value);
                onClose();
              }}
            >
              {/* Status dot with pulse if current */}
              <span className="relative flex-shrink-0">
                <span
                  className={`w-3 h-3 rounded-full block ${
                    isCurrentStatus ? "ring-2 ring-offset-2 ring-offset-surface" : ""
                  }`}
                  style={{ backgroundColor: s.color }}
                />
                {isCurrentStatus && (
                  <span
                    className="absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-30"
                    style={{ backgroundColor: s.color }}
                  />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold ${isCurrentStatus ? "text-on-surface" : "text-on-surface"}`}>
                  {s.label}
                </div>
                <div className="text-[11px] text-on-surface-variant truncate">{s.desc}</div>
              </div>
              {isCurrentStatus && (
                <span className="flex-shrink-0">
                  <i className="fas fa-check text-xs" style={{ color: s.color }} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Section Wrapper ─────────────────────────────────────────────────────────

function SectionCard({ icon, title, children, className = "" }: { icon: string; title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-surface rounded-2xl border border-outline-variant/60 p-4 md:p-5 ${className}`}>
      <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-outline-variant/40">
        <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0">
          <i className={`fas ${icon} text-xs text-on-surface-variant`} />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{title}</span>
      </div>
      {children}
    </div>
  );
}

// ─── Info Row ────────────────────────────────────────────────────────────────

function InfoRow({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${className}`}>
      <span className="text-sm text-on-surface-variant">{label}</span>
      <span className="text-sm font-semibold text-on-surface text-right ml-4">{children}</span>
    </div>
  );
}

// ─── Timeline ────────────────────────────────────────────────────────────────

function OrderTimeline({ order, formatDate, formatTime }: { order: Order; formatDate: (d: any) => string; formatTime: (d: any) => string }) {
  const currentStatusIndex = STATUS_ORDER.indexOf(order.status as any);
  const statusTheme = STATUS_THEMES[order.status] || STATUS_THEMES.pending;

  const timelineEvents = [
    { status: "pending", label: "Order Placed", desc: `Order #${order.orderNumber || order.id.substring(0, 8)} created`, time: order.createdAt },
    { status: "confirmed", label: "Confirmed", desc: "Payment verified", time: order.createdAt },
    { status: "processing", label: "Processing", desc: "Being prepared", time: order.createdAt },
    { status: "shipped", label: "Shipped", desc: "On its way", time: order.createdAt },
    { status: "delivered", label: "Delivered", desc: "Completed successfully", time: order.createdAt },
  ];

  return (
    <div className="relative pl-7">
      {/* Vertical connecting line */}
      <div className="absolute left-[7px] top-3 bottom-3 w-[2px] bg-outline-variant/60 rounded-full" />

      {timelineEvents.map((event, idx) => {
        const eventIndex = STATUS_ORDER.indexOf(event.status as any);
        const isCompleted = eventIndex <= currentStatusIndex && currentStatusIndex >= 0;
        const isCurrent = event.status === order.status;
        const hasTime = event.time;

        return (
          <div key={event.status} className="relative pb-5 last:pb-0">
            {/* Dot */}
            <div className="absolute left-[-21px] top-1">
              <div
                className={`w-[14px] h-[14px] rounded-full border-[3px] border-surface transition-all duration-300 ${
                  isCompleted
                    ? "bg-emerald-400 shadow-[0_0_0_2px_rgba(52,211,153,0.3)]"
                    : isCurrent
                    ? `shadow-[0_0_0_2px_rgba(251,191,36,0.3)] animate-pulse`
                    : "bg-outline-variant"
                }`}
                style={isCurrent ? { backgroundColor: statusTheme.accent, boxShadow: `0 0 0 3px ${statusTheme.accent}30` } : {}}
              />
            </div>

            {/* Content card */}
            <div
              className={`rounded-xl p-3.5 transition-all duration-200 ${
                isCurrent
                  ? "bg-surface-container-low border-2 shadow-sm"
                  : isCompleted
                  ? "bg-surface-container-low/50 border border-outline-variant/40"
                  : "bg-surface border border-outline-variant/30 opacity-50"
              }`}
              style={isCurrent ? { borderColor: `${statusTheme.accent}40` } : {}}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span
                    className={`text-sm font-bold block ${
                      isCompleted || isCurrent ? "text-on-surface" : "text-on-surface-variant/60"
                    }`}
                  >
                    {event.label}
                  </span>
                  <span
                    className={`text-xs ${
                      isCompleted || isCurrent ? "text-on-surface-variant" : "text-on-surface-variant/40"
                    }`}
                  >
                    {event.desc}
                  </span>
                </div>
                {hasTime && (
                  <span className="text-[10px] text-on-surface-variant/70 font-medium flex-shrink-0 text-right leading-tight">
                    {formatDate(event.time)}
                    <br />
                    {formatTime(event.time)}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Product Item ────────────────────────────────────────────────────────────

function ProductItem({
  name,
  price,
  quantity,
  imageUrl,
  onClickImage,
}: {
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  onClickImage?: () => void;
}) {
  return (
    <div className="flex items-center gap-3.5 p-3.5 bg-surface-container-low/50 rounded-xl border border-outline-variant/40 hover:border-outline/60 transition-all group">
      {/* Product image */}
      <div
        className="w-[52px] h-[52px] rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-surface to-surface-variant shadow-sm cursor-pointer hover:ring-2 hover:ring-[#25D366]/40 transition-all group-hover:scale-[1.03]"
        onClick={onClickImage}
      >
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover product-img"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
                const parent = img.parentElement;
                const fallback = parent?.querySelector('.product-img-fallback') as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="w-full h-full hidden product-img-fallback items-center justify-center text-xl">
              <i className="fas fa-box text-on-surface-variant/40" />
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl">
            <i className="fas fa-box text-on-surface-variant/40" />
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm text-on-surface truncate">{name}</h4>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-semibold text-on-surface-variant">{formatCurrency(price)}</span>
          <span className="text-[10px] text-on-surface-variant/50">×</span>
          <span className="text-xs font-medium text-on-surface-variant">{quantity}</span>
        </div>
      </div>

      {/* Total */}
      <div className="text-right flex-shrink-0">
        <div className="font-bold text-sm text-on-surface">{formatCurrency(price * quantity)}</div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
  onPrintInvoice,
  onDuplicateOrder,
  onSendWhatsApp,
  onCancelOrder,
  onAddNote,
  onMarkAsPaid,
  getStatusBadge,
  formatDate,
  formatTime,
  productImages = {},
}: OrderDetailModalProps) {
  const [orderNotes, setOrderNotes] = useState("");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: string;
    title: string;
    message: string;
    confirmText: string;
    gradient: string;
    icon: string;
    handler: () => void;
  }>({ isOpen: false, action: "", title: "", message: "", confirmText: "", gradient: "", icon: "", handler: () => {} });
  const [imageViewer, setImageViewer] = useState<{ src: string; alt: string } | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setOrderNotes("");
      setShowStatusMenu(false);
      setLoadingAction(null);
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      setImageViewer(null);
      // Scroll to top
      if (bodyRef.current) bodyRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (confirmDialog.isOpen) {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, confirmDialog.isOpen, onClose]);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const handleAction = useCallback(
    async (action: string, handler: () => Promise<void> | void) => {
      setLoadingAction(action);
      try {
        await handler();
      } finally {
        setLoadingAction(null);
      }
    },
    []
  );

  const handleStatusUpdate = useCallback(
    (status: OrderStatus) => {
      const config = ALL_STATUSES.find((s) => s.value === status);
      if (!config) return;
      const theme = STATUS_THEMES[status] || STATUS_THEMES.pending;

      setConfirmDialog({
        isOpen: true,
        action: `status-${status}`,
        title: `Update to "${config.label}"?`,
        message: `Change order #${order?.orderNumber || order?.id.substring(0, 8)} status to "${config.label}"? The customer will be notified.`,
        confirmText: `Yes, ${config.label}`,
        gradient: theme.gradient,
        icon: config.icon,
        handler: () => handleAction("update-status", () => onUpdateStatus(status)),
      });
    },
    [handleAction, onUpdateStatus, order]
  );

  const handleCancel = useCallback(() => {
    setConfirmDialog({
      isOpen: true,
      action: "cancel",
      title: "Cancel Order?",
      message: `Are you sure you want to cancel order #${order?.orderNumber || order?.id.substring(0, 8)}? This action cannot be undone.`,
      confirmText: "Yes, Cancel",
      gradient: STATUS_THEMES.cancelled.gradient,
      icon: "fa-times-circle",
      handler: () => handleAction("cancel", onCancelOrder),
    });
  }, [handleAction, onCancelOrder, order]);

  const handleAddNoteClick = useCallback(() => {
    if (!orderNotes.trim()) return;
    handleAction("add-note", () => onAddNote(orderNotes.trim()));
    setOrderNotes("");
  }, [handleAction, onAddNote, orderNotes]);

  const getProductImage = (product: { productId?: string; name?: string; imageUrl?: string; image?: string } | null): string | undefined => {
    if (!product) return undefined;
    if (product.imageUrl) return product.imageUrl;
    if (product.image) return product.image;
    if (product.productId && productImages[product.productId]) return productImages[product.productId];
    if (product.name) return productImages[`name:${product.name.toLowerCase().trim()}`];
    return undefined;
  };

  // ─── Guard ────────────────────────────────────────────────────────────────

  if (!isOpen || !order) return null;

  const theme = STATUS_THEMES[order.status] || STATUS_THEMES.pending;
  const statusConfig = ALL_STATUSES.find((s) => s.value === order.status);
  const orderNumber = order.orderNumber || order.id.substring(0, 8);
  const isPending = order.status === "pending";
  const isCancelled = order.status === "cancelled";
  const isDelivered = order.status === "delivered";

  const nextActions = (() => {
    if (isCancelled || isDelivered) return [];
    const actions: { label: string; icon: string; gradient: string; status: OrderStatus }[] = [];
    if (isPending) {
      actions.push({ label: "Confirm", icon: "fa-check-circle", gradient: STATUS_THEMES.confirmed.gradient, status: "confirmed" });
    }
    if (order.status === "confirmed") {
      actions.push({ label: "Process", icon: "fa-cog", gradient: STATUS_THEMES.processing.gradient, status: "processing" });
    }
    if (order.status === "processing") {
      actions.push({ label: "Ship", icon: "fa-truck", gradient: STATUS_THEMES.shipped.gradient, status: "shipped" });
    }
    if (order.status === "shipped") {
      actions.push({ label: "Deliver", icon: "fa-check-double", gradient: STATUS_THEMES.delivered.gradient, status: "delivered" });
    }
    return actions;
  })();

  const statusBadge = getStatusBadge(order.status);
  const customerInitial = order.customerName?.charAt(0)?.toUpperCase() || "C";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9990] animate-fadeIn" onClick={onClose} />

      {/* Modal Container */}
      <div className="fixed inset-0 z-[9991] flex items-center justify-center p-3 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Order #${orderNumber} details`}
          className="pointer-events-auto w-full md:max-w-[800px] md:max-h-[90vh] bg-surface-dim md:rounded-3xl md:shadow-2xl overflow-hidden flex flex-col animate-slideUp md:border md:border-outline-variant/50"
          style={{ maxHeight: "92vh" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ─── Sticky Gradient Header ─── */}
          <div
            className={`relative flex-shrink-0 bg-gradient-to-r ${theme.gradient} px-4 md:px-6 pt-4 md:pt-6 pb-5`}
          >
            {/* Background decorative circles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
              <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/5" />
              <div className="absolute top-1/2 left-1/3 w-20 h-20 rounded-full bg-white/5" />
            </div>

            {/* Top row: back/close + actions */}
            <div className="relative flex items-center justify-between mb-3">
              <button
                className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/25 transition-all active:scale-90 flex-shrink-0"
                onClick={onClose}
                aria-label="Close order details"
              >
                <i className="fas fa-arrow-left md:hidden text-sm" />
                <i className="fas fa-times hidden md:block text-sm" />
              </button>

              <div className="flex items-center gap-1.5">
                {/* Print */}                  <button
                    className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white/90 hover:bg-white/25 transition-all active:scale-90"
                    onClick={() => handleAction("print", () => onPrintInvoice(order))}
                    disabled={loadingAction === "print"}
                    aria-label="Print Invoice"
                  >
                  {loadingAction === "print" ? (
                    <i className="fas fa-circle-notch fa-spin text-xs" />
                  ) : (
                    <i className="fas fa-print text-sm" />
                  )}
                </button>
                {/* Duplicate */}
                <button
                  className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white/90 hover:bg-white/25 transition-all active:scale-90"
                  onClick={() => handleAction("duplicate", () => onDuplicateOrder(order))}
                  disabled={loadingAction === "duplicate"}
                  aria-label="Duplicate Order"
                >
                  {loadingAction === "duplicate" ? (
                    <i className="fas fa-circle-notch fa-spin text-xs" />
                  ) : (
                    <i className="fas fa-copy text-sm" />
                  )}
                </button>
                {/* WhatsApp */}
                <button
                  className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white/90 hover:bg-white/25 transition-all active:scale-90"
                  onClick={() => handleAction("whatsapp", () => onSendWhatsApp(order, order.status as OrderStatus))}
                  disabled={loadingAction === "whatsapp"}
                  aria-label="Send WhatsApp notification"
                >
                  {loadingAction === "whatsapp" ? (
                    <i className="fas fa-circle-notch fa-spin text-xs" />
                  ) : (
                    <i className="fab fa-whatsapp text-sm" />
                  )}
                </button>
                {/* Close (desktop) */}
                {!isCancelled && (
                  <button
                    className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white/90 hover:bg-white/25 transition-all active:scale-90"
                    onClick={handleCancel}
                    disabled={loadingAction === "cancel"}
                    aria-label="Cancel Order"
                  >
                    {loadingAction === "cancel" ? (
                      <i className="fas fa-circle-notch fa-spin text-xs" />
                    ) : (
                      <i className="fas fa-times text-sm" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Order info */}
            <div className="relative">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl md:text-2xl font-extrabold text-white drop-shadow-sm">
                  Order #{orderNumber}
                </h2>
                {statusConfig?.icon && (
                  <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-md text-white">
                    <i className={`fas ${statusConfig.icon} text-[10px]`} />
                    {statusConfig.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-white/80 text-sm">
                <span className="flex items-center gap-1.5">
                  <i className="far fa-calendar text-xs" />
                  {formatDate(order.createdAt)}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/40" />
                <span className="flex items-center gap-1.5">
                  <i className="fas fa-clock text-xs" />
                  {formatTime(order.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* ─── Scrollable Body ─── */}
          <div ref={bodyRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-5 scrollbar-thin">
            {/* Mobile Status Badge */}
            <div className="md:hidden flex items-center gap-2.5">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-sm ${statusBadge.bg} ${statusBadge.color}`}>
                <i className={`fas ${statusConfig?.icon || "fa-circle"} text-[10px]`} />
                {statusBadge.label}
              </span>
              <span className="text-xs text-on-surface-variant">{statusConfig?.desc}</span>
            </div>

            {/* ─── Status Banner (Desktop) ─── */}
            <div className="hidden md:flex items-center gap-4 p-4 bg-surface rounded-2xl border border-outline-variant/60 shadow-sm">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${theme.accent}20, ${theme.accent}10)`,
                  color: theme.accent,
                }}
              >
                <i className={`fas ${statusConfig?.icon || "fa-circle"}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base capitalize">{statusConfig?.label}</h3>
                <p className="text-sm text-on-surface-variant">{statusConfig?.desc}</p>
              </div>
              <div className="relative">
                <button
                  className="px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm font-semibold hover:border-[#25D366] transition-all flex items-center gap-2 shadow-sm active:scale-95"
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                >
                  <i className="fas fa-tag text-xs" />
                  Update
                  <i className={`fas fa-chevron-${showStatusMenu ? "up" : "down"} text-xs transition-transform`} />
                </button>
                <StatusMenu
                  currentStatus={order.status || "pending"}
                  onUpdate={handleStatusUpdate}
                  isOpen={showStatusMenu}
                  onClose={() => setShowStatusMenu(false)}
                />
              </div>
            </div>

            {/* ─── Customer Profile Card ─── */}
            <SectionCard icon="fa-user" title="Customer">
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-outline-variant/40">
                <div
                  className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-md flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}cc)`,
                  }}
                >
                  {customerInitial}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-lg text-on-surface truncate">{order.customerName || "Customer"}</h3>
                  <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant">
                    <i className="fas fa-crown text-[10px] text-amber-400" />
                    Order #{orderNumber}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {/* Phone */}
                <div className="flex items-center gap-3 text-sm group">
                  <div className="w-9 h-9 rounded-xl bg-surface-container-low flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-phone text-xs text-on-surface-variant" />
                  </div>
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="text-[#25D366] font-medium hover:underline flex-1 truncate"
                  >
                    {order.customerPhone || "N/A"}
                  </a>
                  {order.customerPhone && (
                    <button
                      onClick={async () => {
                        try { await navigator.clipboard.writeText(order.customerPhone!); } catch {}
                      }}
                      className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-[#25D366] transition-all"
                    >
                      <i className="fas fa-copy text-xs" />
                    </button>
                  )}
                </div>

                {/* Email */}
                <div className="flex items-center gap-3 text-sm group">
                  <div className="w-9 h-9 rounded-xl bg-surface-container-low flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-envelope text-xs text-on-surface-variant" />
                  </div>
                  <span className="text-on-surface truncate flex-1">{order.customerEmail || "N/A"}</span>
                  {order.customerEmail && (
                    <button
                      onClick={async () => {
                        try { await navigator.clipboard.writeText(order.customerEmail!); } catch {}
                      }}
                      className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-[#25D366] transition-all"
                    >
                      <i className="fas fa-copy text-xs" />
                    </button>
                  )}
                </div>

                {/* Address */}
                <div className="flex items-start gap-3 text-sm group">
                  <div className="w-9 h-9 rounded-xl bg-surface-container-low flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fas fa-map-marker-alt text-xs text-on-surface-variant" />
                  </div>
                  <span className="text-on-surface leading-relaxed flex-1">
                    {order.deliveryAddress || order.customerAddress || "N/A"}
                  </span>
                  {(order.deliveryAddress || order.customerAddress) && (
                    <button
                      onClick={async () => {
                        try { await navigator.clipboard.writeText(order.deliveryAddress || order.customerAddress || ""); } catch {}
                      }}
                      className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-[#25D366] transition-all mt-1"
                    >
                      <i className="fas fa-copy text-xs" />
                    </button>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* ─── Order Products ─── */}
            <SectionCard icon="fa-box" title={`Items (${order.products?.length || (order.productName ? 1 : 0)})`}>
              <div className="space-y-3">
                {order.products && order.products.length > 0 ? (
                  order.products.map((product, idx) => {
                    const img = getProductImage(product);
                    return (
                      <ProductItem
                        key={idx}
                        name={product.name}
                        price={product.price}
                        quantity={product.quantity}
                        imageUrl={img}
                        onClickImage={() => img && setImageViewer({ src: img, alt: product.name })}
                      />
                    );
                  })
                ) : order.productName ? (
                  <ProductItem
                    name={order.productName}
                    price={order.basePrice || 0}
                    quantity={order.quantity || 1}
                    imageUrl={order.productImage}
                    onClickImage={() => order.productImage && setImageViewer({ src: order.productImage, alt: order.productName! })}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-on-surface-variant">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center mb-3">
                      <i className="fas fa-box-open text-lg text-on-surface-variant/50" />
                    </div>
                    <p className="text-sm">No items in this order</p>
                  </div>
                )}
              </div>

              {/* Selected Specs */}
              {order.selectedSpecs && Object.keys(order.selectedSpecs ?? {}).filter((k) => order.selectedSpecs?.[k]).length > 0 && (
                <div className="mt-4 pt-4 border-t border-outline-variant/40">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(order.selectedSpecs ?? {})
                      .filter(([_, v]) => v)
                      .map(([key, value]) => (
                        <span
                          key={key}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low rounded-lg text-xs font-medium border border-outline-variant/50"
                        >
                          <i className="fas fa-check text-[10px] text-emerald-500" />
                          <span className="text-on-surface-variant">{key.replace(/_/g, " ")}:</span>
                          <span className="text-on-surface font-semibold">{value}</span>
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </SectionCard>

            {/* ─── Order Summary ─── */}
            <SectionCard icon="fa-receipt" title="Payment Summary">
              <div className="space-y-1">
                <InfoRow label="Subtotal">{formatCurrency(order.subtotal || 0)}</InfoRow>
                <InfoRow label="Shipping">
                  {order.deliveryMethod ? `${order.deliveryMethod} — ` : ""}
                  {formatCurrency(order.deliveryCost || 0)}
                </InfoRow>
                <InfoRow label="Tax (16%)">{formatCurrency(order.tax || 0)}</InfoRow>
                {(order.discount || 0) > 0 && (
                  <InfoRow label="Discount" className="!text-emerald-600">
                    <span className="flex items-center gap-1">
                      <i className="fas fa-tag text-[10px]" />
                      -{formatCurrency(order.discount || 0)}
                    </span>
                  </InfoRow>
                )}
              </div>
              <div className="mt-4 pt-4 border-t-2 border-outline-variant/60 flex items-center justify-between">
                <span className="text-base font-bold text-on-surface">Total</span>
                <span className="text-xl md:text-2xl font-extrabold" style={{ color: theme.accent }}>
                  {formatCurrency(order.total || 0)}
                </span>
              </div>
            </SectionCard>

            {/* ─── Timeline ─── */}
            <SectionCard icon="fa-history" title="Order Timeline">
              <OrderTimeline order={order} formatDate={formatDate} formatTime={formatTime} />
            </SectionCard>

            {/* ─── Payment Info ─── */}
            <SectionCard icon="fa-credit-card" title="Payment Details">
              <div className="space-y-2">
                <InfoRow label="Method">
                  <span className="flex items-center gap-2">
                    <i
                      className={`fas ${
                        order.paymentMethod?.toLowerCase().includes("mpesa")
                          ? "fa-mobile-alt text-[#00A650]"
                          : order.paymentMethod?.toLowerCase().includes("bank")
                          ? "fa-university text-on-surface-variant"
                          : "fa-money-bill-wave text-emerald-500"
                      }`}
                    />
                    {order.paymentMethod || "COD"}
                  </span>
                </InfoRow>
                <InfoRow label="Status">
                  <span className={`font-semibold ${
                    order.status === "pending" ? "text-amber-500" :
                    order.status === "cancelled" ? "text-red-500" :
                    order.status === "delivered" ? "text-emerald-500" :
                    "text-blue-500"
                  }`}>
                    {order.status === "pending" ? "Awaiting" :
                     order.status === "cancelled" ? "Cancelled" :
                     order.status === "delivered" ? "Paid" :
                     "Confirmed"}
                  </span>
                </InfoRow>
                {order.deliveryMethod && (
                  <InfoRow label="Delivery">{order.deliveryMethod}</InfoRow>
                )}
              </div>

              {/* Payment Proof */}
              {order.paymentProof && (
                <div className="mt-4 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <i className="fas fa-check-circle text-emerald-600 text-sm" />
                    </div>
                    <div className="text-xs font-bold uppercase text-emerald-800">Payment Confirmed</div>
                  </div>
                  <div className="space-y-2.5">
                    {order.paymentProof.transactionId && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-emerald-700">Transaction ID:</span>
                        <span className="font-mono font-semibold text-xs text-emerald-900 bg-emerald-100/50 px-2 py-0.5 rounded">
                          {order.paymentProof.transactionId}
                        </span>
                      </div>
                    )}
                    {order.paymentProof.amount && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-emerald-700">Amount:</span>
                        <span className="font-bold text-sm text-emerald-900">{formatCurrency(order.paymentProof.amount)}</span>
                      </div>
                    )}
                    {order.paymentProof.paidAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-emerald-700">Paid At:</span>
                        <span className="text-xs text-emerald-900 font-medium">
                          {formatDate(order.paymentProof.paidAt)} {formatTime(order.paymentProof.paidAt)}
                        </span>
                      </div>
                    )}
                    {order.paymentProof.confirmedBy && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-emerald-700">Confirmed By:</span>
                        <span className="text-xs font-semibold text-emerald-900">{order.paymentProof.confirmedBy}</span>
                      </div>
                    )}
                    {order.paymentProof.notes && (
                      <div className="mt-2 pt-2 border-t border-emerald-200">
                        <span className="text-xs text-emerald-700 block mb-1">Notes:</span>
                        <span className="text-xs text-emerald-900">{order.paymentProof.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Customer Notes */}
              {order.orderNotes && (
                <div className="mt-4 p-4 bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200/80 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <i className="fas fa-sticky-note text-amber-600 text-sm" />
                    </div>
                    <div className="text-xs font-bold uppercase text-amber-800">Customer Note</div>
                  </div>
                  <p className="text-sm text-amber-900">{order.orderNotes}</p>
                </div>
              )}

              {/* Mark as Paid */}
              {order.paymentStatus !== "paid" && order.paymentMethod !== "paystack" && !isCancelled && (
                <button
                  className="mt-4 w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl transition-all active:scale-[0.97] flex items-center justify-center gap-2"
                  onClick={() => {
                    setConfirmDialog({
                      isOpen: true,
                      action: "mark-paid",
                      title: "Confirm Payment?",
                      message: `Mark order #${orderNumber} as paid? This will confirm the payment and notify the customer.`,
                      confirmText: "Mark as Paid",
                      gradient: "from-emerald-500 to-teal-500",
                      icon: "fa-check-circle",
                      handler: () => handleAction("mark-paid", onMarkAsPaid),
                    });
                  }}
                  disabled={loadingAction === "mark-paid"}
                >
                  {loadingAction === "mark-paid" ? (
                    <i className="fas fa-circle-notch fa-spin" />
                  ) : (
                    <i className="fas fa-check-circle" />
                  )}
                  Mark as Paid
                </button>
              )}
            </SectionCard>

            {/* ─── Internal Notes ─── */}
            <SectionCard icon="fa-sticky-note" title="Internal Notes">
              {order.notes && (
                <div className="flex gap-3.5 pb-4 mb-4 border-b border-outline-variant/40">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm">
                    SM
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-semibold text-sm text-on-surface">Staff</span>
                      <span className="text-[10px] text-on-surface-variant">{formatTime(order.createdAt)}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{order.notes}</p>
                  </div>
                </div>
              )}
              <textarea
                className="w-full p-3.5 bg-surface-container-low border-2 border-outline-variant/60 rounded-xl text-sm resize-none min-h-[90px] focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/15 transition-all placeholder:text-on-surface-variant/50"
                placeholder="Add an internal note..."
                aria-label="Add internal note"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
              />
              {orderNotes.trim() && (
                <button
                  className="mt-3 w-full py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl transition-all active:scale-[0.97] flex items-center justify-center gap-2"
                  onClick={handleAddNoteClick}
                  disabled={loadingAction === "add-note"}
                >
                  {loadingAction === "add-note" ? (
                    <i className="fas fa-circle-notch fa-spin" />
                  ) : (
                    <i className="fas fa-plus" />
                  )}
                  Add Note
                </button>
              )}
            </SectionCard>

            {/* Spacer for the sticky footer */}
            <div className="h-4 md:hidden" />
          </div>

          {/* ─── Sticky Footer ─── */}
          <div className="flex-shrink-0 bg-surface border-t border-outline-variant/60 px-4 md:px-6 py-3 md:py-4">
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              {/* Left: Secondary actions */}
              <div className="flex gap-2">
                <button
                  className="px-3.5 py-2.5 bg-surface border-2 border-outline-variant/60 rounded-xl text-xs font-semibold text-on-surface-variant hover:border-blue-400 hover:text-blue-500 transition-all active:scale-95 flex items-center gap-2"
                  onClick={() => handleAction("invoice", () => onPrintInvoice(order))}
                  disabled={loadingAction === "invoice"}
                >
                  {loadingAction === "invoice" ? (
                    <i className="fas fa-circle-notch fa-spin" />
                  ) : (
                    <i className="fas fa-file-invoice text-xs" />
                  )}
                  <span className="hidden md:inline">Invoice</span>
                </button>
                <button
                  className="hidden md:flex px-3.5 py-2.5 bg-surface border-2 border-outline-variant/60 rounded-xl text-xs font-semibold text-on-surface-variant hover:border-[#25D366] hover:text-[#25D366] transition-all active:scale-95 items-center gap-2"
                  onClick={() => handleAction("duplicate", () => onDuplicateOrder(order))}
                  disabled={loadingAction === "duplicate"}
                >
                  {loadingAction === "duplicate" ? (
                    <i className="fas fa-circle-notch fa-spin" />
                  ) : (
                    <i className="fas fa-copy text-xs" />
                  )}
                  Duplicate
                </button>
              </div>

              {/* Right: Primary actions */}
              <div className="flex-1 flex gap-2 justify-end">
                {/* Next step actions */}
                {nextActions.map((action) => (
                  <button
                    key={action.status}
                    className={`flex-1 md:flex-none px-4 py-2.5 bg-gradient-to-r ${action.gradient} text-white rounded-xl font-bold text-xs shadow-lg hover:shadow-xl transition-all active:scale-[0.97] flex items-center justify-center gap-2`}
                    onClick={() => handleStatusUpdate(action.status)}
                    disabled={loadingAction === "update-status"}
                  >
                    {loadingAction === "update-status" ? (
                      <i className="fas fa-circle-notch fa-spin" />
                    ) : (
                      <i className={`fas ${action.icon} text-xs`} />
                    )}
                    <span className="hidden md:inline">{action.label}</span>
                  </button>
                ))}

                {/* Mobile Status Button */}
                <div className="relative md:hidden">
                  <button
                    className="px-3.5 py-2.5 bg-surface border-2 border-outline-variant/60 rounded-xl font-semibold text-xs flex items-center gap-2 active:scale-95"
                    onClick={() => setShowStatusMenu(!showStatusMenu)}
                  >
                    <i className="fas fa-tag text-xs" />
                    <i className={`fas fa-chevron-${showStatusMenu ? "up" : "down"} text-[10px]`} />
                  </button>
                  <StatusMenu
                    currentStatus={order.status || "pending"}
                    onUpdate={handleStatusUpdate}
                    isOpen={showStatusMenu}
                    onClose={() => setShowStatusMenu(false)}
                  />
                </div>

                {/* Fast Deliver button */}
                {!isDelivered && !isCancelled && (
                  <button
                    className={`flex-1 md:flex-none px-4 py-2.5 bg-gradient-to-r ${theme.gradient} text-white rounded-xl font-bold text-xs shadow-lg hover:shadow-xl transition-all active:scale-[0.97] flex items-center justify-center gap-2`}
                    onClick={() => handleStatusUpdate("delivered")}
                    disabled={loadingAction === "update-status"}
                  >
                    {loadingAction === "update-status" ? (
                      <i className="fas fa-circle-notch fa-spin" />
                    ) : (
                      <i className="fas fa-check-double text-xs" />
                    )}
                    <span className="hidden md:inline">Delivered</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Viewer */}
      {imageViewer && (
        <ImageViewer
          src={imageViewer.src}
          alt={imageViewer.alt}
          onClose={() => setImageViewer(null)}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          confirmDialog.handler();
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        gradient={confirmDialog.gradient}
        icon={confirmDialog.icon}
      />
    </>
  );
}
