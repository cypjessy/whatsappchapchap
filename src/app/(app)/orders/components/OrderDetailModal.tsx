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
  productImages?: Record<string, string>; // Map of productId (and name) to image URL
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_STATUSES: { value: OrderStatus; label: string; color: string; icon: string; desc: string }[] = [
  { value: "pending", label: "Pending", color: "#f59e0b", icon: "fa-clock", desc: "Awaiting payment confirmation" },
  { value: "confirmed", label: "Confirmed", color: "#3b82f6", icon: "fa-check", desc: "Order confirmed by admin" },
  { value: "processing", label: "Processing", color: "#8b5cf6", icon: "fa-cog", desc: "Order is being prepared" },
  { value: "shipped", label: "Shipped", color: "#6366f1", icon: "fa-shipping-fast", desc: "Order is on its way" },
  { value: "delivered", label: "Delivered", color: "#10b981", icon: "fa-check-double", desc: "Order delivered successfully" },
  { value: "cancelled", label: "Cancelled", color: "#ef4444", icon: "fa-times", desc: "Order has been cancelled" },
  { value: "refunded", label: "Refunded", color: "#f59e0b", icon: "fa-undo", desc: "Payment has been refunded" },
];

const STATUS_ORDER = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;

// ─── Sub-Components ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title, color = "#25D366" }: { icon: string; title: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <i className={`fas ${icon} text-xs`} style={{ color }} />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{title}</span>
    </div>
  );
}

function InfoRow({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex justify-between py-2.5 border-b border-outline-variant last:border-b-0 text-sm ${className}`}>
      <span className="text-on-surface-variant flex-shrink-0 mr-4">{label}</span>
      <span className="font-semibold text-right text-on-surface">{children}</span>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  color,
  onClick,
  loading,
  disabled,
  className = "",
}: {
  icon: string;
  label: string;
  color: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      className={`flex-1 md:flex-none px-3 md:px-4 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${color} ${className}`}
      onClick={onClick}
      disabled={loading || disabled}
    >
      {loading ? <i className="fas fa-circle-notch fa-spin text-xs" /> : <i className={`fas ${icon} text-xs`} />}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  confirmColor,
  icon,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  confirmColor: string;
  icon: string;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slideUp">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmColor.replace("bg-gradient-to-r", "").split(" ")[0]?.replace("from-", "bg-") || "bg-surface-variant"}`}>
          <i className={`fas ${icon} text-2xl text-white`} />
        </div>
        <h3 className="text-xl font-bold text-on-surface text-center mb-2">{title}</h3>
        <p className="text-on-surface-variant text-center mb-6 text-sm">{message}</p>
        <div className="flex gap-3">
          <button
            className="flex-1 px-4 py-3 bg-surface-variant text-on-surface rounded-xl font-semibold hover:bg-surface-container-high transition-all active:scale-95"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={`flex-1 px-4 py-3 ${confirmColor} text-white rounded-xl font-semibold transition-all active:scale-95 shadow-md3-level3 flex items-center justify-center gap-2`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Timeline Component ───────────────────────────────────────────────────────

function OrderTimeline({ order, formatDate, formatTime }: { order: Order; formatDate: (d: any) => string; formatTime: (d: any) => string }) {
  const currentStatusIndex = STATUS_ORDER.indexOf(order.status as any);
  
  const timelineEvents = [
    { status: "pending", label: "Order Placed", desc: `Order #${order.orderNumber || order.id.substring(0, 8)} created`, time: order.createdAt },
    { status: "confirmed", label: "Order Confirmed", desc: "Payment confirmed by admin", time: order.createdAt },
    { status: "processing", label: "Processing", desc: "Order is being prepared", time: order.createdAt },
    { status: "shipped", label: "Shipped", desc: "Order is on its way", time: order.createdAt },
    { status: "delivered", label: "Delivered", desc: "Order delivered successfully", time: order.createdAt },
  ];

  return (
    <div className="relative pl-6">
      <div className="absolute left-[5px] top-2 bottom-2 w-[2px] bg-surface-variant" />
      {timelineEvents.map((event, idx) => {
        const eventIndex = STATUS_ORDER.indexOf(event.status as any);
        const isCompleted = eventIndex <= currentStatusIndex && currentStatusIndex >= 0;
        const isCurrent = event.status === order.status;
        const hasTime = event.time;

        return (
          <div key={event.status} className="relative pb-6 last:pb-0">
            <div
              className={`absolute left-[-21px] w-3 h-3 rounded-full border-2 border-white shadow-md3-level1 transition-all ${
                isCompleted
                  ? "bg-[#10b981] shadow-[0_0_0_2px_#10b981]"
                  : isCurrent
                  ? "bg-[#f59e0b] shadow-[0_0_0_2px_#f59e0b] animate-pulse"
                  : "bg-surface-variant shadow-[0_0_0_2px_#e2e8f0]"
              }`}
            />
            <div
              className={`bg-surface border rounded-lg p-4 transition-all ${
                isCurrent ? "border-[#f59e0b] shadow-md3-level1" : "border-outline-variant"
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`font-bold text-sm ${isCompleted || isCurrent ? "text-on-surface" : "text-gray-400"}`}>
                  {event.label}
                </span>
                {hasTime && (
                  <span className="text-[10px] text-on-surface-variant font-medium">
                    {formatDate(event.time)} {formatTime(event.time)}
                  </span>
                )}
              </div>
              <p className={`text-xs ${isCompleted || isCurrent ? "text-on-surface-variant" : "text-gray-300"}`}>
                {event.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Status Dropdown ──────────────────────────────────────────────────────────

function StatusDropdown({
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
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className="absolute bottom-full right-0 mb-2 bg-surface rounded-xl shadow-md3-level4 border border-outline-variant min-w-[220px] z-50 overflow-hidden animate-fadeIn"
    >
      <div className="py-1">
        {ALL_STATUSES.map((s) => (
          <button
            key={s.value}
            className={`w-full px-4 py-3 text-sm flex items-center gap-3 hover:bg-surface transition-colors text-left ${
              currentStatus === s.value ? "bg-[rgba(37,211,102,0.05)]" : ""
            }`}
            onClick={() => {
              onUpdate(s.value);
              onClose();
            }}
          >
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <div className="flex-1">
              <div className="font-semibold text-on-surface">{s.label}</div>
              <div className="text-[10px] text-on-surface-variant">{s.desc}</div>
            </div>
            {currentStatus === s.value && <i className="fas fa-check text-[#25D366] text-xs" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

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
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: string;
    title: string;
    message: string;
    confirmText: string;
    confirmColor: string;
    icon: string;
    handler: () => void;
  }>({ isOpen: false, action: "", title: "", message: "", confirmText: "", confirmColor: "", icon: "", handler: () => {} });

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setOrderNotes("");
      setShowStatusMenu(false);
      setLoadingAction(null);
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
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
        if (confirmModal.isOpen) {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, confirmModal.isOpen, onClose]);

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
      const statusConfig = ALL_STATUSES.find((s) => s.value === status);
      if (!statusConfig) return;

      setConfirmModal({
        isOpen: true,
        action: `status-${status}`,
        title: `Update to ${statusConfig.label}?`,
        message: `Are you sure you want to change the order status to "${statusConfig.label}"? The customer will be notified.`,
        confirmText: `Yes, ${statusConfig.label}`,
        confirmColor: "bg-gradient-to-r from-[#25D366] to-[#128C7E]",
        icon: statusConfig.icon,
        handler: () => handleAction("update-status", () => onUpdateStatus(status)),
      });
    },
    [handleAction, onUpdateStatus]
  );

  const handleCancel = useCallback(() => {
    setConfirmModal({
      isOpen: true,
      action: "cancel",
      title: "Cancel Order?",
      message: `Are you sure you want to cancel order #${order?.orderNumber || order?.id.substring(0, 8)}? This action cannot be undone.`,
      confirmText: "Yes, Cancel",
      confirmColor: "bg-gradient-to-r from-red-500 to-red-600",
      icon: "fa-times-circle",
      handler: () => handleAction("cancel", onCancelOrder),
    });
  }, [handleAction, onCancelOrder, order]);

  const handleAddNoteClick = useCallback(() => {
    if (!orderNotes.trim()) return;
    handleAction("add-note", () => onAddNote(orderNotes.trim()));
    setOrderNotes("");
  }, [handleAction, onAddNote, orderNotes]);

  // Helper to look up product image from productImages map
  const getProductImage = (product: { productId?: string; name?: string } | null): string | undefined => {
    if (!product) return undefined;
    if (product.productId && productImages[product.productId]) return productImages[product.productId];
    if (product.name) return productImages[`name:${product.name.toLowerCase().trim()}`];
    return undefined;
  };

  if (!isOpen || !order) return null;

  const statusStyle = getStatusBadge(order.status);
  const statusConfig = ALL_STATUSES.find((s) => s.value === order.status);
  const orderNumber = order.orderNumber || order.id.substring(0, 8);
  const isPending = order.status === "pending";
  const isDelivered = order.status === "delivered";
  const isCancelled = order.status === "cancelled";

  // Determine next action buttons based on status
  const getNextActions = () => {
    if (isCancelled || isDelivered) return [];
    const actions = [];
    if (isPending) {
      actions.push({
        label: "Confirm Order",
        icon: "fa-check-circle",
        color: "bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-md3-level3",
        status: "confirmed" as OrderStatus,
      });
    }
    if (order.status === "confirmed") {
      actions.push({
        label: "Start Processing",
        icon: "fa-cog",
        color: "bg-gradient-to-r from-purple-500 to-purple-600 hover:shadow-md3-level3",
        status: "processing" as OrderStatus,
      });
    }
    if (order.status === "processing") {
      actions.push({
        label: "Mark Shipped",
        icon: "fa-shipping-fast",
        color: "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:shadow-md3-level3",
        status: "shipped" as OrderStatus,
      });
    }
    if (order.status === "shipped") {
      actions.push({
        label: "Mark Delivered",
        icon: "fa-check-double",
        color: "bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:shadow-md3-level3",
        status: "delivered" as OrderStatus,
      });
    }
    return actions;
  };

  const nextActions = getNextActions();

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-[2500] animate-fadeIn" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-[2500] flex items-center justify-center p-3 md:p-4 lg:p-6 pointer-events-none overflow-y-auto">
        <div
          className="bg-surface w-full max-w-sm md:max-w-[1000px] max-h-[90vh] md:max-h-[calc(100vh-3rem)] rounded-2xl overflow-hidden shadow-2xl flex flex-col pointer-events-auto animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ─── Unified Header ─── */}
          <div className="flex-shrink-0 p-3 md:p-5 border-b border-outline-variant bg-gradient-to-br from-[rgba(37,211,102,0.05)] to-[rgba(18,140,126,0.05)] animate-fadeIn">
            <div className="flex items-center justify-between gap-3">
              {/* Left: Back + Icon + Info */}
              <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1 animate-slideUp">
                <button
                  className="md:hidden w-9 h-9 flex items-center justify-center text-on-surface-variant hover:bg-surface-variant rounded-xl transition-all active:scale-95 flex-shrink-0"
                  onClick={onClose}
                >
                  <i className="fas fa-arrow-left" />
                </button>

                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-xl flex items-center justify-center text-white text-lg md:text-2xl shadow-md3-level3 flex-shrink-0">
                  <i className="fas fa-shopping-bag" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base md:text-xl lg:text-2xl font-extrabold text-on-surface">
                      Order <span className="text-[#25D366]">#{orderNumber}</span>
                    </h2>
                    {/* Status Badge - Desktop inline, Mobile below */}
                    <span
                      className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-md3-level1 ${statusStyle.bg} ${statusStyle.color}`}
                    >
                      <i className={`fas ${statusConfig?.icon || "fa-circle"} text-[10px]`} />
                      {statusStyle.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm text-on-surface-variant mt-0.5">
                    <span className="flex items-center gap-1">
                      <i className="far fa-calendar text-[10px]" />
                      {formatDate(order.createdAt)}
                    </span>
                    <span className="hidden md:inline text-[#e2e8f0]">|</span>
                    <span className="hidden md:flex items-center gap-1">
                      <i className="fas fa-clock text-[10px]" />
                      {formatTime(order.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                <button
                  className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-on-surface-variant hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all active:scale-95"
                  onClick={() => handleAction("print", () => onPrintInvoice(order))}
                  title="Print Invoice"
                  disabled={loadingAction === "print"}
                >
                  {loadingAction === "print" ? (
                    <i className="fas fa-circle-notch fa-spin text-sm" />
                  ) : (
                    <i className="fas fa-print" />
                  )}
                </button>
                <button
                  className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-on-surface-variant hover:text-[#25D366] hover:bg-[rgba(37,211,102,0.1)] rounded-xl transition-all active:scale-95"
                  onClick={() => handleAction("duplicate", () => onDuplicateOrder(order))}
                  title="Duplicate Order"
                  disabled={loadingAction === "duplicate"}
                >
                  {loadingAction === "duplicate" ? (
                    <i className="fas fa-circle-notch fa-spin text-sm" />
                  ) : (
                    <i className="fas fa-copy" />
                  )}
                </button>
                <button
                  className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-on-surface-variant hover:text-[#25D366] hover:bg-[rgba(37,211,102,0.1)] rounded-xl transition-all active:scale-95"
                  onClick={() => handleAction("whatsapp", () => onSendWhatsApp(order, order.status as OrderStatus))}
                  title="Send WhatsApp"
                  disabled={loadingAction === "whatsapp"}
                >
                  {loadingAction === "whatsapp" ? (
                    <i className="fas fa-circle-notch fa-spin text-sm" />
                  ) : (
                    <i className="fab fa-whatsapp" />
                  )}
                </button>
                {!isCancelled && (
                  <button
                    className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-on-surface-variant hover:bg-red-50 hover:text-red-500 rounded-xl transition-all active:scale-95"
                    onClick={handleCancel}
                    title="Cancel Order"
                    disabled={loadingAction === "cancel"}
                  >
                    {loadingAction === "cancel" ? (
                      <i className="fas fa-circle-notch fa-spin text-sm" />
                    ) : (
                      <i className="fas fa-times" />
                    )}
                  </button>
                )}
                <button
                  className="hidden md:flex w-10 h-10 items-center justify-center text-on-surface-variant hover:bg-surface-variant rounded-xl transition-all active:scale-95"
                  onClick={onClose}
                  title="Close (Esc)"
                >
                  <i className="fas fa-times" />
                </button>
              </div>
            </div>

            {/* Mobile Status Bar */}
            <div className="md:hidden mt-2 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-md3-level1 ${statusStyle.bg} ${statusStyle.color}`}
              >
                <i className={`fas ${statusConfig?.icon || "fa-circle"} text-[10px]`} />
                {statusStyle.label}
              </span>
              <span className="text-[10px] text-on-surface-variant">{statusConfig?.desc}</span>
            </div>
          </div>

          {/* ─── Status Banner (Desktop) ─── */}
          <div
            className="hidden md:flex flex-shrink-0 p-4 items-center gap-4 border-b"
            style={{
              background: `linear-gradient(90deg, ${statusConfig?.color || "#64748b"}10, ${statusConfig?.color || "#64748b"}05)`,
              borderColor: `${statusConfig?.color || "#64748b"}20`,
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
              style={{
                backgroundColor: `${statusConfig?.color || "#64748b"}20`,
                color: statusConfig?.color || "#64748b",
              }}
            >
              <i className={`fas ${statusConfig?.icon || "fa-circle"}`} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg capitalize">{statusConfig?.label}</h3>
              <p className="text-sm text-on-surface-variant">{statusConfig?.desc}</p>
            </div>
            {/* Quick Status Update */}
            <div className="relative">
              <button
                className="px-4 py-2 bg-surface border border-outline-variant rounded-xl text-sm font-semibold hover:border-[#25D366] transition-all flex items-center gap-2 shadow-md3-level1"
                onClick={() => setShowStatusMenu(!showStatusMenu)}
              >
                <i className="fas fa-tag text-xs" />
                Update Status
                <i className={`fas fa-chevron-${showStatusMenu ? "up" : "down"} text-xs`} />
              </button>
              <StatusDropdown
                currentStatus={order.status || "pending"}
                onUpdate={handleStatusUpdate}
                isOpen={showStatusMenu}
                onClose={() => setShowStatusMenu(false)}
              />
            </div>
          </div>

          {/* ─── Body ─── */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr]">
              {/* ─── Left Column ─── */}
              <div className="p-4 md:p-6 lg:border-r border-outline-variant">
                {/* Order Items */}
                <div className="animate-fadeIn" style={{ animationDelay: '0.05s' }}>
                  <SectionHeader icon="fa-box" title={`Order Items (${order.products?.length || (order.productName ? 1 : 0)})`} />
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-3 mb-6">
                  {order.products && order.products.length > 0 ? (
                    order.products.map((product, idx) => {
                      const prodImg = getProductImage(product);
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-outline-variant hover:border-[#25D366]/30 transition-all"
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-surface-variant shadow-md3-level1">
                            {prodImg ? (
                              <img src={prodImg} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] flex items-center justify-center text-xl">📦</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm truncate">{product.name}</h4>
                            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                              <span>{formatCurrency(product.price)}</span>
                              <span>×</span>
                              <span>{product.quantity}</span>
                            </div>
                          </div>
                          <div className="font-bold text-sm text-on-surface">{formatCurrency(product.price * product.quantity)}</div>
                        </div>
                      );
                    })
                  ) : order.productName ? (
                    <div className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-outline-variant">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-surface-variant shadow-md3-level1">
                        {order.productImage ? (
                          <img src={order.productImage} alt={order.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] flex items-center justify-center text-xl">📦</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm">{order.productName}</h4>
                        <div className="text-xs text-on-surface-variant">Qty: {order.quantity || 1}</div>
                      </div>
                      <div className="font-bold text-sm">{formatCurrency((order.basePrice || 0) * (order.quantity || 1))}</div>
                    </div>
                  ) : (
                    <div className="text-center text-on-surface-variant py-8 bg-surface rounded-xl">No items</div>
                  )}
                </div>

                {/* Desktop Table */}
                <div className="hidden lg:block mb-6">
                  <div className="border border-outline-variant rounded-xl overflow-hidden">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="text-left bg-surface">
                          <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Product</th>
                          <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-right">Price</th>
                          <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-center">Qty</th>
                          <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.products && order.products.length > 0 ? (
                          order.products.map((product, idx) => {
                            const prodImg = getProductImage(product);
                            return (
                              <tr key={idx} className="border-t border-outline-variant hover:bg-surface transition-colors">
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-surface-variant shadow-md3-level1">
                                      {prodImg ? (
                                        <img src={prodImg} alt={product.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] flex items-center justify-center text-xl">📦</div>
                                      )}
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-sm text-on-surface">{product.name}</h4>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-sm font-semibold text-right">{formatCurrency(product.price)}</td>
                                <td className="py-4 px-4 text-sm text-on-surface-variant text-center">× {product.quantity}</td>
                                <td className="py-4 px-4 text-sm font-bold text-right text-on-surface">
                                  {formatCurrency(product.price * product.quantity)}
                                </td>
                              </tr>
                            );
                          })
                        ) : order.productName ? (
                          <tr className="border-t border-outline-variant">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-surface-variant shadow-md3-level1">
                                  {order.productImage ? (
                                    <img src={order.productImage} alt={order.productName} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] flex items-center justify-center text-xl">📦</div>
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm">{order.productName}</h4>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-sm font-semibold text-right">{formatCurrency(order.basePrice || 0)}</td>
                            <td className="py-4 px-4 text-sm text-on-surface-variant text-center">× {order.quantity || 1}</td>
                            <td className="py-4 px-4 text-sm font-bold text-right">
                              {formatCurrency((order.basePrice || 0) * (order.quantity || 1))}
                            </td>
                          </tr>
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-on-surface-variant text-sm">No items in this order</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Selected Specs */}
                {order.selectedSpecs && Object.keys(order.selectedSpecs).filter((k) => order.selectedSpecs![k]).length > 0 && (
                  <div className="bg-[rgba(37,211,102,0.05)] border border-[#25D366]/20 rounded-xl p-4 mb-6 animate-fadeIn">
                    <SectionHeader icon="fa-sliders-h" title="Selected Options" color="#128C7E" />
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(order.selectedSpecs)
                        .filter(([_, v]) => v)
                        .map(([key, value]) => (
                          <span
                            key={key}
                            className="bg-surface px-3 py-1.5 rounded-full text-sm font-semibold border border-outline-variant shadow-md3-level1 flex items-center gap-1.5"
                          >
                            <i className="fas fa-check text-[#10b981] text-[10px]" />
                            <span className="text-on-surface-variant text-xs">{key.replace(/_/g, " ")}:</span>
                            <span className="text-on-surface">{value}</span>
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {/* Order Summary */}
                <div className="bg-surface rounded-xl p-5 border border-outline-variant mb-6 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                  <div className="space-y-2">
                    <InfoRow label="Subtotal">{formatCurrency(order.subtotal || 0)}</InfoRow>
                    <InfoRow label="Shipping">
                      {order.deliveryMethod ? `${order.deliveryMethod} — ` : ""}
                      {formatCurrency(order.deliveryCost || 0)}
                    </InfoRow>
                    <InfoRow label="Tax (16%)">{formatCurrency(order.tax || 0)}</InfoRow>
                    {(order.discount || 0) > 0 && (
                      <InfoRow label="Discount" className="text-green-600">
                        <span className="flex items-center gap-1">
                          <i className="fas fa-tag text-xs" />
                          -{formatCurrency(order.discount || 0)}
                        </span>
                      </InfoRow>
                    )}
                    <div className="flex justify-between pt-4 mt-2 border-t-2 border-outline-variant">
                      <span className="text-lg font-extrabold text-on-surface">Total</span>
                      <span className="text-2xl font-extrabold text-[#25D366]">{formatCurrency(order.total || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="mb-6 animate-fadeIn" style={{ animationDelay: '0.15s' }}>
                  <SectionHeader icon="fa-history" title="Order Timeline" color="#3b82f6" />
                  <OrderTimeline order={order} formatDate={formatDate} formatTime={formatTime} />
                </div>
              </div>

              {/* ─── Right Column ─── */}
              <div className="p-4 md:p-6 bg-surface lg:bg-transparent animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                {/* Customer Info */}
                <div className="bg-surface rounded-xl p-5 border border-outline-variant mb-5 shadow-md3-level1 animate-fadeIn" style={{ animationDelay: '0.25s' }}>
                  <div className="flex items-center gap-3 mb-5 pb-5 border-b border-outline-variant">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center font-bold text-lg text-white shadow-md3-level2">
                      {order.customerName?.charAt(0)?.toUpperCase() || "C"}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg text-on-surface truncate">{order.customerName || "Customer"}</h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[rgba(37,211,102,0.1)] text-[#25D366] rounded-full text-[10px] font-bold">
                        <i className="fas fa-crown text-[8px]" />
                        Customer
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-phone text-on-surface-variant text-xs" />
                      </div>
                      <a href={`tel:${order.customerPhone}`} className="text-[#25D366] font-medium hover:underline">
                        {order.customerPhone || "N/A"}
                      </a>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-envelope text-on-surface-variant text-xs" />
                      </div>
                      <span className="text-on-surface truncate">{order.customerEmail || "N/A"}</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center flex-shrink-0 mt-0.5">
                        <i className="fas fa-map-marker-alt text-on-surface-variant text-xs" />
                      </div>
                      <span className="text-on-surface leading-relaxed">
                        {order.deliveryAddress || order.customerAddress || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Info */}
                <div className="bg-surface rounded-xl p-5 border border-outline-variant mb-5 shadow-md3-level1 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                  <SectionHeader icon="fa-info-circle" title="Order Information" color="#64748b" />
                  <div className="space-y-1">
                    <InfoRow label="Order Number">
                      <span className="font-mono">#{orderNumber}</span>
                    </InfoRow>
                    <InfoRow label="Date">{formatDate(order.createdAt)}</InfoRow>
                    {order.deliveryMethod && (
                      <InfoRow label="Delivery">{order.deliveryMethod}</InfoRow>
                    )}
                    <InfoRow label="Source">
                      <span className="flex items-center gap-1.5">
                        <i className="fab fa-whatsapp text-[#25D366]" />
                        WhatsApp
                      </span>
                    </InfoRow>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-surface rounded-xl p-5 border border-outline-variant mb-5 shadow-md3-level1 animate-fadeIn" style={{ animationDelay: '0.35s' }}>
                  <SectionHeader icon="fa-credit-card" title="Payment Information" color="#10b981" />
                  <div className="space-y-1">
                    <InfoRow label="Method">
                      <span className="flex items-center gap-2">
                        <i
                          className={`fas ${
                            order.paymentMethod?.toLowerCase().includes("mpesa")
                              ? "fa-mobile-alt text-[#00A650]"
                              : order.paymentMethod?.toLowerCase().includes("bank")
                              ? "fa-university text-on-surface-variant"
                              : "fa-money-bill-wave text-[#10b981]"
                          }`}
                        />
                        {order.paymentMethod || "COD"}
                      </span>
                    </InfoRow>
                    <InfoRow label="Status">
                      <span
                        className={`font-semibold ${
                          order.status === "pending"
                            ? "text-amber-500"
                            : order.status === "cancelled"
                            ? "text-red-500"
                            : "text-green-500"
                        }`}
                      >
                        {order.status === "pending" ? "Awaiting Confirmation" : order.status === "cancelled" ? "Cancelled" : "Confirmed"}
                      </span>
                    </InfoRow>
                  </div>

                  {order.paymentDetails && (
                    <div className="mt-3 p-3 bg-[#ecfdf5] border border-[#10b981] rounded-lg">
                      <div className="text-[10px] font-bold uppercase text-[#065f46] mb-1">Payment Details</div>
                      <div className="text-sm text-[#065f46] whitespace-pre-wrap font-mono text-xs">{order.paymentDetails}</div>
                    </div>
                  )}

                  {/* Payment Proof / Transaction Details */}
                  {order.paymentProof && (
                    <div className="mt-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <i className="fas fa-check-circle text-green-600" />
                        <div className="text-xs font-bold uppercase text-green-800">Payment Submitted</div>
                      </div>
                      <div className="space-y-2 text-sm">
                        {order.paymentProof.transactionId && (
                          <div className="flex justify-between items-center">
                            <span className="text-green-700 text-xs">Transaction ID:</span>
                            <span className="font-mono font-semibold text-green-900 text-xs">{order.paymentProof.transactionId}</span>
                          </div>
                        )}
                        {order.paymentProof.amount && (
                          <div className="flex justify-between items-center">
                            <span className="text-green-700 text-xs">Amount Paid:</span>
                            <span className="font-bold text-green-900">{formatCurrency(order.paymentProof.amount)}</span>
                          </div>
                        )}
                        {order.paymentProof.paidAt && (
                          <div className="flex justify-between items-center">
                            <span className="text-green-700 text-xs">Paid At:</span>
                            <span className="text-green-900 text-xs">{formatDate(order.paymentProof.paidAt)} {formatTime(order.paymentProof.paidAt)}</span>
                          </div>
                        )}
                        {order.paymentProof.confirmedBy && (
                          <div className="flex justify-between items-center">
                            <span className="text-green-700 text-xs">Confirmed By:</span>
                            <span className="font-semibold text-green-900 text-xs">{order.paymentProof.confirmedBy}</span>
                          </div>
                        )}
                        {order.paymentProof.notes && (
                          <div className="mt-2 pt-2 border-t border-green-200">
                            <div className="text-green-700 text-xs mb-1">Notes:</div>
                            <div className="text-green-900 text-xs whitespace-pre-wrap">{order.paymentProof.notes}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {order.orderNotes && (
                    <div className="mt-3 p-3 bg-[#fffbeb] border border-[#fde68a] rounded-lg">
                      <div className="text-[10px] font-bold uppercase text-[#92400e] mb-1">Customer Notes</div>
                      <div className="text-sm text-[#92400e]">{order.orderNotes}</div>
                    </div>
                  )}

                  {/* Mark as Paid Button - Only for manual payments not yet paid */}
                  {order.paymentStatus !== "paid" && order.paymentMethod !== "paystack" && !isCancelled && (
                    <button
                      className="mt-4 w-full px-4 py-3 bg-gradient-to-r from-[#10b981] to-[#059669] text-white rounded-xl font-bold text-sm hover:shadow-md3-level3 transition-all active:scale-95 flex items-center justify-center gap-2"
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          action: "mark-paid",
                          title: "Confirm Payment?",
                          message: `Mark order #${orderNumber} as paid? This will confirm the payment and notify the customer.`,
                          confirmText: "Yes, Mark as Paid",
                          confirmColor: "bg-gradient-to-r from-[#10b981] to-[#059669]",
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
                </div>

                {/* Internal Notes */}
                <div className="bg-surface rounded-xl p-5 border border-outline-variant shadow-md3-level1 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
                  <SectionHeader icon="fa-sticky-note" title="Internal Notes" color="#8b5cf6" />
                  {order.notes && (
                    <div className="flex gap-3 py-3 border-b border-outline-variant mb-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        SM
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-1">
                          <span className="font-semibold text-sm">Staff Member</span>
                          <span className="text-[10px] text-on-surface-variant">{formatTime(order.createdAt)}</span>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed">{order.notes}</p>
                      </div>
                    </div>
                  )}
                  <div className="mt-2">
                    <textarea
                      className="w-full p-3 border-2 border-outline-variant rounded-xl text-sm resize-none min-h-[80px] focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all placeholder:text-gray-400"
                      placeholder="Add an internal note..."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                    />
                    {orderNotes.trim() && (
                      <button
                        className="mt-2 w-full px-4 py-2.5 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm hover:shadow-md3-level3 transition-all active:scale-95 flex items-center justify-center gap-2"
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
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Footer ── */}
          <div className="flex-shrink-0 p-3 md:p-5 border-t border-outline-variant bg-surface animate-fadeIn" style={{ animationDelay: '0.45s' }}>
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
              {/* Left Actions */}
              <div className="flex gap-2 order-2 md:order-1">
                <ActionButton
                  icon="fa-file-invoice"
                  label="Invoice"
                  color="bg-surface border border-outline-variant text-on-surface-variant hover:border-blue-400 hover:text-blue-500"
                  onClick={() => handleAction("invoice", () => onPrintInvoice(order))}
                  loading={loadingAction === "invoice"}
                />
                <ActionButton
                  icon="fa-receipt"
                  label="Receipt"
                  color="bg-surface border border-outline-variant text-on-surface-variant hover:border-[#25D366] hover:text-[#25D366]"
                  onClick={() => handleAction("receipt", () => onPrintInvoice(order))}
                  loading={loadingAction === "receipt"}
                />
              </div>

              {/* Right Actions */}
              <div className="flex gap-2 order-1 md:order-2 flex-wrap">
                {/* Next Step Buttons */}
                {nextActions.map((action) => (
                  <button
                    key={action.status}
                    className={`flex-1 md:flex-none px-4 py-2.5 ${action.color} text-white rounded-xl font-semibold text-sm transition-all active:scale-95 touch-manipulation flex items-center justify-center gap-2 min-w-[120px]`}
                    onClick={() => handleStatusUpdate(action.status)}
                    disabled={loadingAction === "update-status"}
                  >
                    {loadingAction === "update-status" ? (
                      <i className="fas fa-circle-notch fa-spin" />
                    ) : (
                      <i className={`fas ${action.icon}`} />
                    )}
                    <span className="hidden md:inline">{action.label}</span>
                  </button>
                ))}

                {/* Mobile Status Dropdown Trigger */}
                <div className="relative md:hidden flex-1">
                  <button
                    className="w-full px-4 py-2.5 bg-surface border-2 border-outline-variant rounded-xl font-semibold text-sm hover:border-[#25D366] transition-all flex items-center justify-center gap-2"
                    onClick={() => setShowStatusMenu(!showStatusMenu)}
                  >
                    <i className="fas fa-tag" />
                    Status
                    <i className={`fas fa-chevron-${showStatusMenu ? "up" : "down"} text-xs`} />
                  </button>
                  <StatusDropdown
                    currentStatus={order.status || "pending"}
                    onUpdate={handleStatusUpdate}
                    isOpen={showStatusMenu}
                    onClose={() => setShowStatusMenu(false)}
                  />
                </div>

                {/* Mark Delivered Quick Button */}
                {!isDelivered && !isCancelled && (
                  <button
                    className="flex-1 md:flex-none px-4 py-2.5 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm hover:shadow-md3-level3 transition-all active:scale-95 touch-manipulation flex items-center justify-center gap-2"
                    onClick={() => handleStatusUpdate("delivered")}
                    disabled={loadingAction === "update-status"}
                  >
                    {loadingAction === "update-status" ? (
                      <i className="fas fa-circle-notch fa-spin" />
                    ) : (
                      <i className="fas fa-check" />
                    )}
                    <span className="hidden md:inline">Delivered</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          confirmModal.handler();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        confirmColor={confirmModal.confirmColor}
        icon={confirmModal.icon}
      />
    </>
  );
}