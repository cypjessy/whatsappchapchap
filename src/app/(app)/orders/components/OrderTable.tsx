"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Order, OrderStatus } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderTableProps {
  orders: Order[];
  selectedOrders: Set<string>;
  toggleSelect: (orderId: string) => void;
  toggleSelectAll: () => void;
  getStatusBadge: (status?: string) => { bg: string; color: string; label: string; icon?: string };
  formatDate: (createdAt: any) => string;
  formatTime: (createdAt: any) => string;
  onOpenModal: (order: Order) => void;
  onOpenEditModal: (order: Order) => void;
  onPrintInvoice: (order: Order) => Promise<void> | void;
  onDuplicateOrder: (order: Order) => Promise<void> | void;
  onSendWhatsApp: (order: Order, status: OrderStatus) => Promise<void> | void;
  onDeleteOrder?: (orderId: string) => Promise<void> | void;
  onBulkDelete?: (orderIds: string[]) => Promise<void> | void;
  onBulkStatusUpdate?: (orderIds: string[], status: OrderStatus) => Promise<void> | void;
  isLoading?: boolean;
  productImages?: Record<string, string>; // Map of productId to image URL
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_ICONS: Record<string, string> = {
  pending: "fa-clock",
  confirmed: "fa-check",
  processing: "fa-cog",
  shipped: "fa-shipping-fast",
  delivered: "fa-check-double",
  cancelled: "fa-times",
  refunded: "fa-undo",
};

const BULK_ACTIONS = [
  { label: "Mark Delivered", status: "delivered" as OrderStatus, icon: "fa-check-double", color: "text-green-600" },
  { label: "Mark Shipped", status: "shipped" as OrderStatus, icon: "fa-shipping-fast", color: "text-indigo-600" },
  { label: "Mark Processing", status: "processing" as OrderStatus, icon: "fa-cog", color: "text-purple-600" },
  { label: "Cancel", status: "cancelled" as OrderStatus, icon: "fa-times", color: "text-red-500" },
] as const;

// ─── Sub-Components ───────────────────────────────────────────────────────────

function Checkbox({
  checked,
  onChange,
  indeterminate = false,
}: {
  checked: boolean;
  onChange?: () => void;
  indeterminate?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all active:scale-90 ${
        checked || indeterminate
          ? "bg-[#25D366] border-[#25D366] shadow-sm"
          : "border-outline-variant hover:border-[#25D366] bg-surface"
      }`}
    >
      {checked && <i className="fas fa-check text-white text-[10px]" />}
      {indeterminate && <div className="w-2 h-0.5 bg-surface rounded-full" />}
    </button>
  );
}

function ActionButton({
  icon,
  color,
  bgColor,
  hoverColor,
  onClick,
  title,
  loading,
}: {
  icon: string;
  color: string;
  bgColor: string;
  hoverColor: string;
  onClick: (e: React.MouseEvent) => void;
  title: string;
  loading?: boolean;
}) {
  return (
    <button
      className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all active:scale-90 shadow-sm ${color} ${bgColor} ${hoverColor}`}
      onClick={onClick}
      title={title}
      disabled={loading}
    >
      {loading ? <i className="fas fa-circle-notch fa-spin text-xs" /> : <i className={`fas ${icon} text-sm`} />}
    </button>
  );
}

function SkeletonRow({ delay }: { delay?: number }) {
  return (
    <tr className="border-t border-outline animate-fadeIn" style={{ animationDelay: `${(delay || 0) * 0.05}s` }}>
      {[...Array(8)].map((_, i) => (
        <td key={i} className="p-4">
          <div className={`h-4 bg-surface-container-high rounded ${i === 0 ? "w-5" : i === 1 ? "w-20" : i === 2 ? "w-32" : i === 3 ? "w-28" : i === 4 ? "w-16" : i === 5 ? "w-20" : i === 6 ? "w-24" : "w-40"} ${i === 2 || i === 3 ? "flex items-center gap-3" : ""}`}>
            {(i === 2 || i === 3) && <div className="w-10 h-10 rounded-full bg-surface-container-high flex-shrink-0" />}
          </div>
        </td>
      ))}
    </tr>
  );
}

function EmptyState({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-16 text-center">
        <div className="animate-fadeIn">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-inbox text-2xl text-gray-300" />
          </div>
          <h4 className="text-lg font-bold text-on-surface mb-1">No Orders Found</h4>
          <p className="text-sm text-on-surface-variant">Try adjusting your filters or search criteria</p>
        </div>
      </td>
    </tr>
  );
}

function BulkActionBar({
  selectedCount,
  totalCount,
  onClear,
  onDelete,
  onStatusUpdate,
  loading,
}: {
  selectedCount: number;
  totalCount: number;
  onClear: () => void;
  onDelete: () => void;
  onStatusUpdate: (status: OrderStatus) => void;
  loading?: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  return (
    <div className="bg-[#1e293b] text-white px-4 py-3 rounded-xl mb-4 flex items-center justify-between animate-slideDown shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-surface/10 flex items-center justify-center">
          <i className="fas fa-check-square text-sm" />
        </div>
        <div>
          <span className="font-bold">{selectedCount}</span>{" "}
          <span className="text-white/70">of {totalCount} selected</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative" ref={menuRef}>
          <button
            className="px-3 py-2 bg-surface/10 rounded-lg text-sm font-semibold hover:bg-surface/20 transition-all flex items-center gap-2"
            onClick={() => setShowMenu(!showMenu)}
          >
            <i className="fas fa-tag text-xs" />
            Update Status
            <i className={`fas fa-chevron-${showMenu ? "up" : "down"} text-xs`} />
          </button>
          {showMenu && (
            <div className="absolute top-full right-0 mt-1 bg-surface rounded-xl shadow-xl border-2 border-outline min-w-[180px] overflow-hidden z-50 animate-fadeIn">
              {BULK_ACTIONS.map((action) => (
                <button
                  key={action.status}
                  className="w-full px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-surface transition-colors text-left text-on-surface"
                  onClick={() => {
                    onStatusUpdate(action.status);
                    setShowMenu(false);
                  }}
                >
                  <i className={`fas ${action.icon} ${action.color}`} />
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-semibold hover:bg-red-500/30 transition-all flex items-center gap-2"
          onClick={onDelete}
          disabled={loading}
        >
          {loading ? <i className="fas fa-circle-notch fa-spin text-xs" /> : <i className="fas fa-trash text-xs" />}
          Delete
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white hover:bg-surface/10 rounded-lg transition-all"
          onClick={onClear}
        >
          <i className="fas fa-times" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OrderTable({
  orders,
  selectedOrders,
  toggleSelect,
  toggleSelectAll,
  getStatusBadge,
  formatDate,
  formatTime,
  onOpenModal,
  onOpenEditModal,
  onPrintInvoice,
  onDuplicateOrder,
  onSendWhatsApp,
  onDeleteOrder,
  onBulkDelete,
  onBulkStatusUpdate,
  isLoading = false,
  productImages = {},
}: OrderTableProps) {
  const [loadingActions, setLoadingActions] = useState<Record<string, string>>({});
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const isAllSelected = orders.length > 0 && selectedOrders.size === orders.length;
  const isIndeterminate = selectedOrders.size > 0 && selectedOrders.size < orders.length;

  const handleAction = useCallback(
    async (orderId: string, action: string, handler: () => Promise<void> | void) => {
      setLoadingActions((prev) => ({ ...prev, [`${orderId}-${action}`]: "loading" }));
      try {
        await handler();
      } finally {
        setLoadingActions((prev) => {
          const next = { ...prev };
          delete next[`${orderId}-${action}`];
          return next;
        });
      }
    },
    []
  );

  const handleBulkDelete = useCallback(async () => {
    if (!onBulkDelete) return;
    const ids = Array.from(selectedOrders);
    if (confirm(`Delete ${ids.length} orders? This cannot be undone.`)) {
      await onBulkDelete(ids);
    }
  }, [onBulkDelete, selectedOrders]);

  const handleBulkStatus = useCallback(
    async (status: OrderStatus) => {
      if (!onBulkStatusUpdate) return;
      const ids = Array.from(selectedOrders);
      await onBulkStatusUpdate(ids, status);
    },
    [onBulkStatusUpdate, selectedOrders]
  );

  if (isLoading) {
    return (
      <div className="hidden md:block overflow-x-auto max-w-full rounded-xl border-2 border-outline animate-fadeIn">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-surface">
              {[...Array(8)].map((_, i) => (
                <th key={i} className="text-left p-4">
                  <div className="h-3 bg-surface-container-high rounded w-16 animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <SkeletonRow key={i} delay={i} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="hidden md:block animate-fadeIn">
      {/* Bulk Action Bar */}
      {selectedOrders.size > 0 && (
        <BulkActionBar
          selectedCount={selectedOrders.size}
          totalCount={orders.length}
          onClear={() => {
            // Clear selection by toggling all off
            orders.forEach((o) => {
              if (selectedOrders.has(o.id)) toggleSelect(o.id);
            });
          }}
          onDelete={handleBulkDelete}
          onStatusUpdate={handleBulkStatus}
        />
      )}

      {/* Table */}
      <div className="overflow-x-auto max-w-full rounded-xl border-2 border-outline shadow-md animate-slideDown">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-surface sticky top-0 z-10 animate-fadeIn">
              <th className="text-left p-4 w-12">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Order ID
              </th>
              <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Customer
              </th>
              <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Products
              </th>
              <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Amount
              </th>
              <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Status
              </th>
              <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Date
              </th>
              <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant w-48">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <EmptyState colSpan={8} />
            ) : (
              orders.map((order, index) => {
                const statusStyle = getStatusBadge(order.status);
                const statusIcon = STATUS_ICONS[order.status || "pending"] || "fa-circle";
                const isSelected = selectedOrders.has(order.id);
                const isHovered = hoveredRow === order.id;

                return (
                  <tr
                    key={order.id}
                    className={`border-t border-outline-variant transition-all duration-200 cursor-pointer animate-fadeIn ${
                      isSelected
                        ? "bg-[rgba(37,211,102,0.05)]"
                        : isHovered
                        ? "bg-[rgba(37,211,102,0.02)]"
                        : ""
                    }`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onMouseEnter={() => setHoveredRow(order.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => onOpenModal(order)}
                  >
                    {/* Checkbox */}
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={isSelected} onChange={() => toggleSelect(order.id)} />
                    </td>

                    {/* Order ID */}
                    <td className="p-4">
                      <span className="font-mono font-bold text-[#25D366] text-sm hover:underline">
                        #{order.orderNumber || order.id.substring(0, 8)}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] flex items-center justify-center font-bold text-sm text-on-surface shadow-sm">
                          {order.customerName?.charAt(0)?.toUpperCase() || "C"}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-on-surface truncate max-w-[140px]">
                            {order.customerName || "Customer"}
                          </div>
                          <div className="text-xs text-on-surface-variant flex items-center gap-1">
                            <i className="fab fa-whatsapp text-[#25D366] text-[10px]" />
                            <span className="truncate">{order.customerPhone || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Products */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {(function() {
                          // Resolve product image: direct field, productId map, or name-based lookup
                          const imgSrc = order.productImage ||
                            (order.products?.[0]?.productId && productImages[order.products[0].productId]) ||
                            (order.products?.[0]?.name && productImages[`name:${order.products[0].name.toLowerCase().trim()}`]) ||
                            (order.productName && productImages[`name:${order.productName.toLowerCase().trim()}`]) ||
                            null;
                          
                          if (imgSrc) {
                            return (
                              <img
                                src={imgSrc}
                                alt={order.products?.[0]?.name || order.productName || "Product"}
                                className="w-11 h-11 rounded-lg object-cover flex-shrink-0 bg-surface-variant shadow-sm"
                                onError={(e) => {
                                  const img = e.target as HTMLImageElement;
                                  img.style.display = 'none';
                                  const fallback = img.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            );
                          }
                          return (
                            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
                              📦
                            </div>
                          );
                        })()}
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-on-surface truncate max-w-[120px]">
                            {order.products?.[0]?.name || order.productName || "Product"}
                          </div>
                          <div className="text-xs text-on-surface-variant">
                            {order.products && order.products.length > 1
                              ? `+${order.products.length - 1} more`
                              : `Qty: ${order.products?.[0]?.quantity || order.quantity || 1}`}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="p-4">
                      <div className="font-bold text-base text-on-surface">{formatCurrency(order.total || 0)}</div>
                      <div className="text-[11px] text-on-surface-variant font-medium capitalize">{order.paymentMethod || "N/A"}</div>
                    </td>

                    {/* Status */}
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusStyle.bg} ${statusStyle.color} shadow-sm`}
                      >
                        <i className={`fas ${statusIcon} text-[8px]`} />
                        {statusStyle.label}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="p-4">
                      <div className="font-semibold text-sm text-on-surface">{formatDate(order.createdAt)}</div>
                      <div className="text-[11px] text-on-surface-variant">{formatTime(order.createdAt)}</div>
                    </td>

                    {/* Actions */}
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        {/* Print - Always available */}
                        <ActionButton
                          icon="fa-print"
                          color="text-blue-500"
                          bgColor="bg-blue-50"
                          hoverColor="hover:bg-blue-500 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(order.id, "print", () => onPrintInvoice(order));
                          }}
                          title="Print Invoice"
                          loading={loadingActions[`${order.id}-print`] === "loading"}
                        />
                        
                        {/* Duplicate - Hide for delivered/cancelled/refunded orders */}
                        {!["delivered", "cancelled", "refunded"].includes(order.status) && (
                          <ActionButton
                            icon="fa-copy"
                            color="text-purple-500"
                            bgColor="bg-purple-50"
                            hoverColor="hover:bg-purple-500 hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(order.id, "duplicate", () => onDuplicateOrder(order));
                            }}
                            title="Duplicate"
                            loading={loadingActions[`${order.id}-duplicate`] === "loading"}
                          />
                        )}
                        
                        {/* WhatsApp - Only for active orders (not cancelled/refunded) */}
                        {!["cancelled", "refunded"].includes(order.status) && (
                          <ActionButton
                            icon="fa-whatsapp"
                            color="text-[#25D366]"
                            bgColor="bg-[rgba(37,211,102,0.1)]"
                            hoverColor="hover:bg-[#25D366] hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(order.id, "whatsapp", () => onSendWhatsApp(order, order.status as OrderStatus));
                            }}
                            title="Send WhatsApp"
                            loading={loadingActions[`${order.id}-whatsapp`] === "loading"}
                          />
                        )}
                        
                        {/* View Details - Always available */}
                        <ActionButton
                          icon="fa-eye"
                          color="text-emerald-500"
                          bgColor="bg-emerald-50"
                          hoverColor="hover:bg-emerald-500 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenModal(order);
                          }}
                          title="View Details"
                        />
                        
                        {/* Edit - Only for non-finalized orders */}
                        {!["delivered", "cancelled", "refunded"].includes(order.status) && (
                          <ActionButton
                            icon="fa-edit"
                            color="text-amber-500"
                            bgColor="bg-amber-50"
                            hoverColor="hover:bg-amber-500 hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenEditModal(order);
                            }}
                            title="Edit Order"
                          />
                        )}
                        
                        {/* Delete - Only for pending orders */}
                        {onDeleteOrder && order.status === "pending" && (
                          <ActionButton
                            icon="fa-trash"
                            color="text-red-400"
                            bgColor="bg-red-50"
                            hoverColor="hover:bg-red-500 hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Delete this order?")) {
                                handleAction(order.id, "delete", () => onDeleteOrder(order.id));
                              }
                            }}
                            title="Delete"
                            loading={loadingActions[`${order.id}-delete`] === "loading"}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Selection Summary */}
      {selectedOrders.size > 0 && (
        <div className="mt-3 text-xs text-on-surface-variant text-right animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <span className="font-semibold text-on-surface">{selectedOrders.size}</span> orders selected
        </div>
      )}
    </div>
  );
}