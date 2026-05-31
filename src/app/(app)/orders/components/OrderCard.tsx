"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Order, OrderStatus } from "@/lib/db";
import { useHaptics, useClipboard, useShare, useToast } from "@/hooks/useNativeAndroid";
import { formatCurrency } from "@/lib/currency";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: Order;
  getStatusBadge: (status?: string) => { bg: string; color: string; label: string; icon?: string };
  formatDate: (createdAt: any) => string;
  onOpenModal: (order: Order) => void;
  onPrintInvoice: (order: Order) => Promise<void> | void;
  onDuplicateOrder: (order: Order) => Promise<void> | void;
  onSendWhatsApp: (order: Order, status: OrderStatus) => Promise<void> | void;
  onCancelOrder?: (order: Order) => Promise<void> | void;
  onEditOrder?: (order: Order) => void;
  productImages?: Record<string, string>;
  compact?: boolean;
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { dot: string; glow: string; label: string; gradient: string }> = {
  pending:    { dot: "#f59e0b", glow: "rgba(245,158,11,0.2)", label: "Pending",    gradient: "from-amber-500/10 to-amber-500/5" },
  confirmed:  { dot: "#3b82f6", glow: "rgba(59,130,246,0.2)", label: "Confirmed",  gradient: "from-blue-500/10 to-blue-500/5" },
  processing: { dot: "#8b5cf6", glow: "rgba(139,92,246,0.2)", label: "Processing", gradient: "from-purple-500/10 to-purple-500/5" },
  shipped:    { dot: "#06b6d4", glow: "rgba(6,182,212,0.2)",  label: "Shipped",    gradient: "from-cyan-500/10 to-cyan-500/5" },
  delivered:  { dot: "#10b981", glow: "rgba(16,185,129,0.2)", label: "Delivered",  gradient: "from-emerald-500/10 to-emerald-500/5" },
  cancelled:  { dot: "#ef4444", glow: "rgba(239,68,68,0.2)",  label: "Cancelled",  gradient: "from-red-500/10 to-red-500/5" },
  refunded:   { dot: "#14b8a6", glow: "rgba(20,184,166,0.2)", label: "Refunded",   gradient: "from-teal-500/10 to-teal-500/5" },
};

const STATUS_GRADIENTS: Record<string, string> = {
  pending:    "from-[#f59e0b] to-[#d97706]",
  confirmed:  "from-[#3b82f6] to-[#2563eb]",
  processing: "from-[#8b5cf6] to-[#7c3aed]",
  shipped:    "from-[#06b6d4] to-[#0891b2]",
  delivered:  "from-[#10b981] to-[#059669]",
  cancelled:  "from-[#ef4444] to-[#dc2626]",
  refunded:   "from-[#14b8a6] to-[#0d9488]",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
}

function getAvatarColor(name: string): string {
  const colors = [
    "from-[#25D366] to-[#128C7E]", "from-[#3b82f6] to-[#2563eb]",
    "from-[#8b5cf6] to-[#7c3aed]", "from-[#f59e0b] to-[#d97706]",
    "from-[#ef4444] to-[#dc2626]", "from-[#ec4899] to-[#db2777]",
    "from-[#06b6d4] to-[#0891b2]", "from-[#14b8a6] to-[#0d9488]",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: string }) {
  const config = STATUS_COLORS[status || "pending"] || STATUS_COLORS.pending;
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex w-2 h-2">
        <span
          className="absolute inset-0 rounded-full animate-ping opacity-40"
          style={{ backgroundColor: config.dot }}
        />
        <span
          className="relative inline-block w-2 h-2 rounded-full"
          style={{ backgroundColor: config.dot }}
        />
      </span>
      <span className="text-[11px] font-semibold text-on-surface-variant">{config.label}</span>
    </div>
  );
}

function ProductThumbnail({ image, name, fallback }: { image?: string; name: string; fallback: string }) {
  const [error, setError] = useState(false);
  if (image && !error) {
    return (
      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-surface-variant ring-1 ring-outline/20">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setError(true)}
          loading="lazy"
        />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f0fdf4] to-[#e0e7ff] flex items-center justify-center text-base flex-shrink-0 ring-1 ring-outline/20">
      {fallback}
    </div>
  );
}

function ActionChip({
  icon,
  label,
  color,
  onClick,
  loading,
}: {
  icon: string;
  label: string;
  color: string;
  onClick: (e: React.MouseEvent) => void;
  loading?: boolean;
}) {
  return (
    <button
      className={`flex-1 min-w-0 py-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed ${color} hover:shadow-sm`}
      onClick={onClick}
      disabled={loading}
    >
      {loading ? (
        <i className="fas fa-circle-notch fa-spin text-[10px]" />
      ) : (
        <i className={`fas ${icon} text-[10px]`} />
      )}
      <span className="hidden xs:inline">{label}</span>
    </button>
  );
}

function DropdownMenu({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1.5 bg-surface border border-outline rounded-xl shadow-xl z-30 w-52 overflow-hidden animate-scaleIn origin-top-right backdrop-blur-xl"
    >
      {children}
    </div>
  );
}

function DropdownItem({
  icon,
  label,
  color = "text-on-surface-variant",
  onClick,
  disabled,
  divider,
}: {
  icon?: string;
  label?: string;
  color?: string;
  onClick?: () => void;
  disabled?: boolean;
  divider?: boolean;
}) {
  if (divider) {
    return <div className="border-t border-outline-variant mx-2 my-1" />;
  }
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left ${
        disabled
          ? "opacity-40 cursor-not-allowed"
          : "hover:bg-surface-container-lowest active:bg-surface-variant"
      } ${color}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <i className={`fas ${icon} w-4 text-center text-xs`} />}
      {label}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OrderCard({
  order,
  getStatusBadge,
  formatDate,
  onOpenModal,
  onPrintInvoice,
  onDuplicateOrder,
  onSendWhatsApp,
  onCancelOrder,
  onEditOrder,
  productImages = {},
  compact = false,
}: OrderCardProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const { impactLight } = useHaptics();
  const { copy } = useClipboard();
  const { show: showToast } = useToast();

  const statusConfig = STATUS_COLORS[order.status || "pending"] || STATUS_COLORS.pending;
  const statusStyle = getStatusBadge(order.status);

  const handleAction = useCallback(
    async (action: string, handler: () => Promise<void> | void) => {
      setLoadingAction(action);
      try { await handler(); }
      finally { setLoadingAction(null); setShowDropdown(false); }
    },
    []
  );

  const handlePrint = useCallback(
    (e: React.MouseEvent) => { e.stopPropagation(); handleAction("print", () => onPrintInvoice(order)); },
    [handleAction, onPrintInvoice, order]
  );

  const handleDuplicate = useCallback(
    (e: React.MouseEvent) => { e.stopPropagation(); handleAction("duplicate", () => onDuplicateOrder(order)); },
    [handleAction, onDuplicateOrder, order]
  );

  const handleWhatsApp = useCallback(
    (e: React.MouseEvent) => { e.stopPropagation(); handleAction("whatsapp", () => onSendWhatsApp(order, order.status as OrderStatus)); },
    [handleAction, onSendWhatsApp, order]
  );

  const handleCancel = useCallback(
    () => { if (onCancelOrder) handleAction("cancel", () => onCancelOrder(order)); },
    [handleAction, onCancelOrder, order]
  );

  const handleEdit = useCallback(
    () => { onEditOrder?.(order); setShowDropdown(false); },
    [onEditOrder, order]
  );

  const handleCopyOrderId = useCallback(async () => {
    await impactLight();
    const orderId = order.orderNumber || order.id.substring(0, 8);
    const success = await copy(orderId);
    if (success) await showToast({ text: 'Order ID copied!', duration: 'short' });
    setShowDropdown(false);
  }, [order, impactLight, copy, showToast]);

  // Resolve product images
  const productImg = useMemo(() => {
    if (order.productImage) return order.productImage;
    if (order.products?.[0]?.productId && productImages[order.products[0].productId])
      return productImages[order.products[0].productId];
    if (order.products?.[0]?.name) {
      const lookup = productImages[`name:${order.products[0].name.toLowerCase().trim()}`];
      if (lookup) return lookup;
    }
    if (order.productName) return productImages[`name:${order.productName.toLowerCase().trim()}`];
    return undefined;
  }, [order, productImages]);

  // Parse date
  const orderDate = useMemo(() => {
    try {
      const d = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      return { relative: getRelativeTime(d), formatted: formatDate(order.createdAt), date: d };
    } catch { return { relative: "N/A", formatted: "N/A", date: new Date() }; }
  }, [order.createdAt, formatDate]);

  const itemCount = order.products?.length || 0;
  const isActive = !["cancelled", "refunded", "delivered"].includes(order.status);
  const canModify = !["delivered", "cancelled", "refunded"].includes(order.status);

  return (
    <div
      ref={cardRef}
      className={`group relative bg-surface rounded-2xl border border-outline/80 shadow-sm transition-all duration-300 overflow-hidden cursor-pointer animate-fadeIn ${
        isHovered ? "shadow-lg -translate-y-0.5 border-outline" : ""
      }`}
      onClick={() => onOpenModal(order)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ animationDelay: "0.05s" }}
    >
      {/* ── Premium Top Glow ── */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl transition-all duration-500"
        style={{
          background: `linear-gradient(90deg, ${statusConfig.dot}, transparent)`,
          boxShadow: isHovered ? `0 0 20px ${statusConfig.glow}` : "none",
        }}
      />

      {/* ── Subtle Pattern Overlay ── */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.04]">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-current to-transparent translate-x-16 -translate-y-16" style={{ color: statusConfig.dot }} />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-gradient-to-tr from-current to-transparent -translate-x-12 translate-y-12" style={{ color: statusConfig.dot }} />
      </div>

      <div className="relative p-4">
        {/* ── Row 1: Status + Order Number + Dropdown ── */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <StatusBadge status={order.status} />
            <span className="text-[13px] font-bold text-on-surface tracking-tight">
              #{order.orderNumber || order.id.substring(0, 8)}
            </span>
            {itemCount > 0 && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            )}
          </div>

          {/* Three-dot menu */}
          <div className="relative z-10">
            <button
              className="w-8 h-8 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors duration-200 opacity-0 group-hover:opacity-100 md:opacity-60 md:group-hover:opacity-100"
              onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
              aria-label="More actions"
            >
              <i className="fas fa-ellipsis text-xs" />
            </button>

            <DropdownMenu isOpen={showDropdown} onClose={() => setShowDropdown(false)}>
              {canModify && onEditOrder && (
                <DropdownItem icon="fa-edit" label="Edit Order" color="text-primary" onClick={handleEdit} />
              )}
              <DropdownItem icon="fa-copy" label="Copy Order ID" onClick={handleCopyOrderId} />
              <DropdownItem icon="fa-print" label="Print Invoice" onClick={() => { handleAction("print", () => onPrintInvoice(order)); setShowDropdown(false); }} disabled={loadingAction === "print"} />
              {canModify && (
                <DropdownItem icon="fa-copy" label="Duplicate" onClick={() => { handleAction("duplicate", () => onDuplicateOrder(order)); setShowDropdown(false); }} disabled={loadingAction === "duplicate"} />
              )}
              {isActive && (
                <DropdownItem icon="fa-whatsapp" label="Send WhatsApp" color="text-[#25D366]" onClick={() => { handleAction("whatsapp", () => onSendWhatsApp(order, order.status as OrderStatus)); setShowDropdown(false); }} disabled={loadingAction === "whatsapp"} />
              )}
              {onCancelOrder && !["cancelled", "delivered", "refunded"].includes(order.status) && (
                <>
                  <DropdownItem divider />
                  <DropdownItem icon="fa-times-circle" label="Cancel Order" color="text-red-500" onClick={() => { handleCancel(); setShowDropdown(false); }} disabled={loadingAction === "cancel"} />
                </>
              )}
            </DropdownMenu>
          </div>
        </div>

        {/* ── Row 2: Customer Avatar + Info + Amount ── */}
        <div className="flex items-center gap-3 mb-3.5">
          {/* Customer Avatar */}
          <div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getAvatarColor(order.customerName || "Customer")} flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0 transition-transform duration-300 ${
              isHovered ? "scale-105" : ""
            }`}
          >
            {getInitials(order.customerName || "C")}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-on-surface truncate">
              {order.customerName || "Customer"}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-on-surface-variant truncate flex items-center gap-1">
                <i className="fab fa-whatsapp text-[10px] text-[#25D366]" />
                {order.customerPhone || "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <i className="far fa-calendar text-[9px] text-outline" />
              <span className="text-[10px] text-outline">{orderDate.relative} &middot; {orderDate.formatted}</span>
            </div>
          </div>

          {/* Amount */}
          <div className="text-right flex-shrink-0">
            <div className="text-xl font-extrabold text-on-surface tracking-tight">
              {formatCurrency(order.total || 0)}
            </div>
            <div className="text-[10px] font-medium text-on-surface-variant mt-0.5 capitalize">
              {order.paymentMethod || "N/A"}
            </div>
          </div>
        </div>

        {/* ── Row 3: Products + Payment Status ── */}
        <div className="flex items-center justify-between mb-3.5">
          {/* Product thumbnails */}
          <div className="flex items-center gap-2.5">
            <ProductThumbnail
              image={productImg}
              name={order.products?.[0]?.name || order.productName || "Product"}
              fallback="📦"
            />
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-on-surface truncate max-w-[140px]">
                {order.products?.[0]?.name || order.productName || "Product"}
              </div>
              {itemCount > 0 && (
                <div className="text-[10px] text-outline mt-0.5">
                  {itemCount > 1
                    ? `+${itemCount - 1} more item${itemCount > 2 ? "s" : ""}`
                    : `Qty: ${order.products?.[0]?.quantity || order.quantity || 1}`}
                </div>
              )}
            </div>
          </div>

          {/* Payment status chip */}
          <div className="flex items-center gap-1.5">
            {order.paymentStatus && order.paymentStatus !== "unpaid" && (
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                order.paymentStatus === "paid"
                  ? "bg-emerald-50 text-emerald-600"
                  : order.paymentStatus === "pending"
                  ? "bg-amber-50 text-amber-600"
                  : order.paymentStatus === "refunded"
                  ? "bg-teal-50 text-teal-600"
                  : "bg-red-50 text-red-600"
              }`}>
                <i className={`fas ${
                  order.paymentStatus === "paid" ? "fa-check-circle" :
                  order.paymentStatus === "pending" ? "fa-clock" :
                  order.paymentStatus === "refunded" ? "fa-undo" : "fa-times-circle"
                } mr-1 text-[8px]`} />
                {order.paymentStatus === "paid" ? "Paid" :
                 order.paymentStatus === "pending" ? "Pending" :
                 order.paymentStatus === "refunded" ? "Refunded" : "Failed"}
              </span>
            )}
          </div>
        </div>

        {/* ── Row 4: Delivery Info ── */}
        {(order.deliveryMethod || order.deliveryAddress) && (
          <div className="flex items-center gap-2 mb-3.5 text-[10px] text-on-surface-variant bg-surface-variant/50 rounded-xl px-3 py-2">
            <i className="fas fa-truck text-[10px]" />
            <span className="truncate">
              {order.deliveryMethod || "Delivery"} {order.deliveryAddress ? `• ${order.deliveryAddress}` : ""}
            </span>
          </div>
        )}

        {/* ── Row 5: Progress bar (if active) ── */}
        {isActive && (
          <div className="mb-3.5">
            <div className="flex items-center justify-between text-[10px] text-outline mb-1.5">
              <span>Progress</span>
              <span className="font-semibold" style={{ color: statusConfig.dot }}>
                {order.status === "pending" ? "Order placed" :
                 order.status === "confirmed" ? "Confirmed" :
                 order.status === "processing" ? "Processing" :
                 order.status === "shipped" ? "In transit" : ""}
              </span>
            </div>
            <div className="h-1.5 bg-outline/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out relative"
                style={{
                  width: order.status === "pending" ? "20%" :
                         order.status === "confirmed" ? "40%" :
                         order.status === "processing" ? "60%" :
                         order.status === "shipped" ? "80%" : "0%",
                  background: `linear-gradient(90deg, ${statusConfig.dot}, transparent)`,
                }}
              >
                <div className="absolute inset-0 bg-white/20 animate-shimmer" />
              </div>
            </div>
          </div>
        )}

        {/* ── Row 6: Action Buttons ── */}
        <div className="flex gap-2 pt-3 border-t border-outline/50">
          {/* Print */}
          <ActionChip
            icon="fa-print"
            label="Invoice"
            color="bg-surface-variant/70 text-on-surface-variant hover:bg-surface-variant"
            onClick={handlePrint}
            loading={loadingAction === "print"}
          />

          {/* Duplicate — only for non-finalized */}
          {canModify && (
            <ActionChip
              icon="fa-copy"
              label="Duplicate"
              color="bg-surface-variant/70 text-on-surface-variant hover:bg-surface-variant"
              onClick={handleDuplicate}
              loading={loadingAction === "duplicate"}
            />
          )}

          {/* WhatsApp — only for active orders */}
          {isActive && (
            <ActionChip
              icon="fa-whatsapp"
              label="Notify"
              color="bg-[#f0fdf4] text-[#128C7E] hover:bg-[#dcfce7]"
              onClick={handleWhatsApp}
              loading={loadingAction === "whatsapp"}
            />
          )}

          {/* Cancel — only for non-finalized */}
          {onCancelOrder && canModify && (
            <ActionChip
              icon="fa-ban"
              label="Cancel"
              color="bg-red-50 text-red-500 hover:bg-red-100"
              onClick={(e) => { e.stopPropagation(); handleCancel(); }}
              loading={loadingAction === "cancel"}
            />
          )}
        </div>
      </div>

      {/* ── Bottom Status Glow ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 opacity-30 transition-opacity duration-300"
        style={{
          background: `linear-gradient(90deg, transparent, ${statusConfig.dot}, transparent)`,
          opacity: isHovered ? 0.5 : 0.2,
        }}
      />
    </div>
  );
}
