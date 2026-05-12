"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_ICONS: Record<string, string> = {
  pending: "fa-clock",
  confirmed: "fa-check",
  processing: "fa-cog",
  shipped: "fa-shipping-fast",
  delivered: "fa-check-double",
  cancelled: "fa-times",
  refunded: "fa-undo",
};

function getProgressPercent(status?: string): number {
  const progressMap: Record<string, number> = {
    pending: 15,
    confirmed: 30,
    processing: 50,
    shipped: 75,
    delivered: 100,
    cancelled: 0,
    refunded: 0,
  };
  return progressMap[status || "pending"] || 15;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ActionButton({
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
      className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed ${color} hover:shadow-sm`}
      onClick={onClick}
      disabled={loading}
    >
      {loading ? (
        <i className="fas fa-circle-notch fa-spin text-xs" />
      ) : (
        <i className={`fas ${icon} text-xs`} />
      )}
      <span className="hidden sm:inline">{label}</span>
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
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
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
      className="absolute right-0 top-full mt-1 bg-white border border-[#e2e8f0] rounded-xl shadow-xl z-20 w-48 overflow-hidden animate-fadeIn"
    >
      {children}
    </div>
  );
}

function DropdownItem({
  icon,
  label,
  color = "text-[#64748b]",
  onClick,
  disabled,
}: {
  icon: string;
  label: string;
  color?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left ${
        disabled
          ? "opacity-40 cursor-not-allowed"
          : "hover:bg-[#f8fafc] active:bg-gray-100"
      } ${color}`}
      onClick={onClick}
      disabled={disabled}
    >
      <i className={`fas ${icon} w-4 text-center`} />
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
}: OrderCardProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const { impactLight } = useHaptics();
  const { copy } = useClipboard();
  const { share } = useShare();
  const { show: showToast } = useToast();

  const statusStyle = getStatusBadge(order.status);
  const statusIcon = STATUS_ICONS[order.status || "pending"] || "fa-circle";

  const handleAction = useCallback(
    async (action: string, handler: () => Promise<void> | void) => {
      setLoadingAction(action);
      try {
        await handler();
      } finally {
        setLoadingAction(null);
        setShowDropdown(false);
      }
    },
    []
  );

  const handlePrint = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleAction("print", () => onPrintInvoice(order));
    },
    [handleAction, onPrintInvoice, order]
  );

  const handleDuplicate = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleAction("duplicate", () => onDuplicateOrder(order));
    },
    [handleAction, onDuplicateOrder, order]
  );

  const handleWhatsApp = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleAction("whatsapp", () => onSendWhatsApp(order, order.status as OrderStatus));
    },
    [handleAction, onSendWhatsApp, order]
  );

  const handleCancel = useCallback(() => {
    if (!onCancelOrder) return;
    handleAction("cancel", () => onCancelOrder(order));
  }, [handleAction, onCancelOrder, order]);

  const handleEdit = useCallback(() => {
    onEditOrder?.(order);
    setShowDropdown(false);
  }, [onEditOrder, order]);

  // Copy Order ID to clipboard
  const handleCopyOrderId = useCallback(async () => {
    await impactLight();
    
    const orderId = order.orderNumber || order.id.substring(0, 8);
    const success = await copy(orderId);
    
    if (success) {
      await showToast({ text: 'Order ID copied!', duration: 'short' });
    }
    setShowDropdown(false);
  }, [order, impactLight, copy, showToast]);

  // Share Order
  const handleShareOrder = useCallback(async () => {
    await impactLight();
    
    const orderId = order.orderNumber || order.id.substring(0, 8);
    const success = await share({
      title: `Order ${orderId}`,
      text: `Check out order ${orderId} for ${formatCurrency(order.total || 0)}`,
      url: `${window.location.origin}/orders`
    });
    
    if (success) {
      await showToast({ text: 'Shared successfully', duration: 'short' });
    }
    setShowDropdown(false);
  }, [order, impactLight, share, showToast]);

  const itemCount = order.products?.length || 0;
  const isPending = order.status === "pending";
  const isDelivered = order.status === "delivered";
  const isCancelled = order.status === "cancelled";

  return (
    <div
      ref={cardRef}
      className="group relative bg-white border border-[#e2e8f0] rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:border-[#25D366]/30 hover:-translate-y-0.5 cursor-pointer animate-fadeIn"
      onClick={() => onOpenModal(order)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hover Glow Effect */}
      <div
        className={`absolute inset-0 rounded-xl bg-gradient-to-br from-[#25D366]/5 to-transparent pointer-events-none transition-opacity duration-300 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Card Content */}
      <div className="relative">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-bold text-[#25D366] text-sm sm:text-base tracking-tight">
                #{order.orderNumber || order.id.substring(0, 8)}
              </span>
              {itemCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-md font-medium">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
              <i className="far fa-calendar-alt text-[10px]" />
              <span>{formatDate(order.createdAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-sm ${statusStyle.bg} ${statusStyle.color}`}
            >
              <i className={`fas ${statusIcon} text-[10px]`} />
              <span className="hidden sm:inline">{statusStyle.label}</span>
            </span>

            {/* More Actions Dropdown */}
            <div className="relative">
              <button
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#64748b] hover:bg-gray-100 transition-colors active:scale-95"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(!showDropdown);
                }}
              >
                <i className="fas fa-ellipsis-v text-xs" />
              </button>

              <DropdownMenu isOpen={showDropdown} onClose={() => setShowDropdown(false)}>
                {onEditOrder && (
                  <DropdownItem
                    icon="fa-edit"
                    label="Edit Order"
                    color="text-blue-600"
                    onClick={handleEdit}
                  />
                )}
                <DropdownItem
                  icon="fa-copy"
                  label="Copy Order ID"
                  onClick={handleCopyOrderId}
                />
                <DropdownItem
                  icon="fa-share-alt"
                  label="Share Order"
                  onClick={handleShareOrder}
                />
                <DropdownItem
                  icon="fa-print"
                  label="Print Invoice"
                  onClick={() => handleAction("print", () => onPrintInvoice(order))}
                  disabled={loadingAction === "print"}
                />
                <DropdownItem
                  icon="fa-copy"
                  label="Duplicate"
                  onClick={() => handleAction("duplicate", () => onDuplicateOrder(order))}
                  disabled={loadingAction === "duplicate"}
                />
                <DropdownItem
                  icon="fa-whatsapp"
                  label="Send WhatsApp"
                  color="text-[#25D366]"
                  onClick={() => handleAction("whatsapp", () => onSendWhatsApp(order, order.status as OrderStatus))}
                  disabled={loadingAction === "whatsapp"}
                />
                <div className="border-t border-[#e2e8f0]" />
                {onCancelOrder && !isCancelled && (
                  <DropdownItem
                    icon="fa-times-circle"
                    label="Cancel Order"
                    color="text-red-500"
                    onClick={handleCancel}
                    disabled={loadingAction === "cancel" || isDelivered}
                  />
                )}
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] flex items-center justify-center font-bold text-sm text-[#1e293b] shadow-sm flex-shrink-0">
            {order.customerName?.charAt(0)?.toUpperCase() || "C"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm text-[#1e293b] truncate">
              {order.customerName || "Customer"}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
              <i className="fab fa-whatsapp text-[#25D366] text-[10px]" />
              <span className="truncate">{order.customerPhone || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Payment & Total */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-[#64748b] bg-gray-50 px-2 py-1 rounded-md">
              <i className="fas fa-credit-card text-[10px]" />
              <span className="capitalize">{order.paymentMethod || "N/A"}</span>
            </div>
            {order.paymentMethod && (
              <div
                className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                  order.status === "delivered"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {order.status === "delivered" ? "paid" : "pending"}
              </div>
            )}
          </div>
          <span className="text-lg sm:text-xl font-extrabold text-[#1e293b]">
            {formatCurrency(order.total || 0)}
          </span>
        </div>

        {/* Progress Bar (for non-finalized orders) */}
        {!isCancelled && !isDelivered && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] text-[#64748b] mb-1">
              <span>Progress</span>
              <span>{getProgressPercent(order.status)}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-full transition-all duration-500"
                style={{ width: `${getProgressPercent(order.status)}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t border-[#e2e8f0]">
          <ActionButton
            icon="fa-print"
            label="Print"
            color="bg-blue-50 text-blue-600 hover:bg-blue-100"
            onClick={handlePrint}
            loading={loadingAction === "print"}
          />
          <ActionButton
            icon="fa-copy"
            label="Duplicate"
            color="bg-[rgba(37,211,102,0.1)] text-[#25D366] hover:bg-[rgba(37,211,102,0.2)]"
            onClick={handleDuplicate}
            loading={loadingAction === "duplicate"}
          />
          <ActionButton
            icon="fa-whatsapp"
            label="Notify"
            color="bg-[rgba(37,211,102,0.1)] text-[#128C7E] hover:bg-[rgba(18,140,126,0.15)]"
            onClick={handleWhatsApp}
            loading={loadingAction === "whatsapp"}
          />
        </div>
      </div>
    </div>
  );
}
