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
      className={`flex-1 min-w-0 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed ${color} hover:shadow-sm`}
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
      className="absolute right-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-md z-20 w-48 overflow-hidden animate-fadeIn"
    >
      {children}
    </div>
  );
}

function DropdownItem({
  icon,
  label,
  color = "text-[#64748B]",
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
          : "hover:bg-[#F8FAFC] active:bg-[#F1F5F9]"
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

  const handleCopyOrderId = useCallback(async () => {
    await impactLight();
    const orderId = order.orderNumber || order.id.substring(0, 8);
    const success = await copy(orderId);
    if (success) {
      await showToast({ text: 'Order ID copied!', duration: 'short' });
    }
    setShowDropdown(false);
  }, [order, impactLight, copy, showToast]);

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
  const progressPercent = getProgressPercent(order.status);

  return (
    <div
      ref={cardRef}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 animate-fadeIn"
      onClick={() => onOpenModal(order)}
    >
      {/* Left accent border - MD3 style */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusStyle.color.replace('text', 'bg').split(' ')[0]}`} />
      
      <div className="pl-4 pr-3 py-3">
        {/* Header: Order Number + Date + Status */}
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm text-[#25D366]">
                #{order.orderNumber || order.id.substring(0, 8)}
              </span>
              {itemCount > 0 && (
                <span className="text-[11px] px-2 py-0.5 bg-[#F1F5F9] text-[#64748B] rounded-full font-medium">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
              <i className="far fa-calendar-alt text-[10px]" />
              <span>{formatDate(order.createdAt)}</span>
            </div>
          </div>
          
          {/* Status Badge - MD3 chip styling */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusStyle.bg} ${statusStyle.color}`}
          >
            <i className={`fas ${statusIcon} text-[9px]`} />
            <span className="hidden sm:inline">{statusStyle.label}</span>
          </span>
        </div>

        {/* Customer Section - MD3 avatar */}
        <div className="flex items-center gap-3 mb-3">
          {/* Customer Avatar */}
          <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] flex items-center justify-center font-semibold text-sm text-[#2E7D32] flex-shrink-0">
            {order.customerName?.charAt(0)?.toUpperCase() || "C"}
          </div>
          
          {/* Customer Details */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-[#1E293B] truncate">
              {order.customerName || "Customer"}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
              <i className="fab fa-whatsapp text-[#25D366] text-[10px]" />
              <span className="truncate">{order.customerPhone || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Payment Method + Total - MD3 styling */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {/* Payment Method */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F8FAFC] rounded-lg">
              <i className="fas fa-wallet text-[#94A3B8] text-[11px]" />
              <span className="text-[11px] text-[#64748B] font-medium truncate max-w-[100px]">
                {order.paymentMethod || "N/A"}
              </span>
            </div>
            
            {/* Payment Status - MD3 tonal badges */}
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                order.status === "delivered"
                  ? "bg-[#D1FAE5] text-[#059669]"
                  : order.status === "cancelled"
                  ? "bg-[#FEE2E2] text-[#DC2626]"
                  : "bg-[#FEF3C7] text-[#D97706]"
              }`}
            >
              {order.status === "delivered" ? "Paid" : order.status === "cancelled" ? "Cancelled" : "Pending"}
            </span>
          </div>
          
          {/* Total Amount - MD3 typography */}
          <span className="text-lg font-bold text-[#1E293B]">
            {formatCurrency(order.total || 0)}
          </span>
        </div>

        {/* Progress Indicator - MD3 styling */}
        {!isCancelled && !isDelivered && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#25D366]" />
            <span className="text-[11px] text-[#64748B] font-medium">{progressPercent}% complete</span>
          </div>
        )}

        {/* Action Buttons - MD3 tonal buttons */}
        <div className="flex gap-2 pt-3 border-t border-[#E2E8F0]">
          {/* Print Button */}
          <button
            onClick={handlePrint}
            disabled={loadingAction === "print"}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] rounded-xl font-semibold text-[11px] transition-all duration-200 active:scale-95 disabled:opacity-50"
          >
            <i className="fas fa-print text-xs" />
            <span className="hidden sm:inline">Print</span>
          </button>
          
          {/* Duplicate Button */}
          <button
            onClick={handleDuplicate}
            disabled={loadingAction === "duplicate"}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#2E7D32] rounded-xl font-semibold text-[11px] transition-all duration-200 active:scale-95 disabled:opacity-50"
          >
            <i className="fas fa-copy text-xs" />
            <span className="hidden sm:inline">Duplicate</span>
          </button>
          
          {/* WhatsApp Button */}
          <button
            onClick={handleWhatsApp}
            disabled={loadingAction === "whatsapp"}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#128C7E] rounded-xl font-semibold text-[11px] transition-all duration-200 active:scale-95 disabled:opacity-50"
          >
            <i className="fab fa-whatsapp text-xs" />
            <span className="hidden sm:inline">Notify</span>
          </button>
        </div>
      </div>

      {/* Three-dot Menu - MD3 styling */}
      <div className="hidden md:block absolute top-3 right-3">
        <div className="relative">
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] transition-colors duration-200"
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
          >
            <i className="fas fa-ellipsis-v text-xs" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-md z-20 w-48 overflow-hidden animate-fadeIn">
              {onEditOrder && (
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#2563EB] hover:bg-[#F8FAFC]"
                  onClick={() => { handleEdit(); setShowDropdown(false); }}
                >
                  <i className="fas fa-edit w-4 text-center" />
                  Edit Order
                </button>
              )}
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC]"
                onClick={() => { handleCopyOrderId(); setShowDropdown(false); }}
              >
                <i className="fas fa-copy w-4 text-center" />
                Copy Order ID
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC]"
                onClick={() => { handleShareOrder(); setShowDropdown(false); }}
              >
                <i className="fas fa-share-alt w-4 text-center" />
                Share Order
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC]"
                onClick={() => { handleAction("print", () => onPrintInvoice(order)); setShowDropdown(false); }}
                disabled={loadingAction === "print"}
              >
                <i className="fas fa-print w-4 text-center" />
                Print Invoice
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC]"
                onClick={() => { handleAction("duplicate", () => onDuplicateOrder(order)); setShowDropdown(false); }}
                disabled={loadingAction === "duplicate"}
              >
                <i className="fas fa-copy w-4 text-center" />
                Duplicate
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#25D366] hover:bg-[#F8FAFC]"
                onClick={() => { handleAction("whatsapp", () => onSendWhatsApp(order, order.status as OrderStatus)); setShowDropdown(false); }}
                disabled={loadingAction === "whatsapp"}
              >
                <i className="fab fa-whatsapp w-4 text-center" />
                Send WhatsApp
              </button>
              <div className="border-t border-[#E2E8F0]" />
              {onCancelOrder && !isCancelled && (
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#EF4444] hover:bg-[#F8FAFC]"
                  onClick={() => { handleCancel(); setShowDropdown(false); }}
                  disabled={loadingAction === "cancel" || isDelivered}
                >
                  <i className="fas fa-times-circle w-4 text-center" />
                  Cancel Order
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}