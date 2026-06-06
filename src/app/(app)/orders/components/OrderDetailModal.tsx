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
  pending: { label: "Pending", icon: "fa-clock", gradient: "from-amber-500 to-yellow-500", accent: "#f59e0b", light: "#fffbeb", dot: "bg-amber-400" },
  confirmed: { label: "Confirmed", icon: "fa-check-circle", gradient: "from-blue-500 to-indigo-500", accent: "#3b82f6", light: "#eff6ff", dot: "bg-blue-400" },
  processing: { label: "Processing", icon: "fa-cog", gradient: "from-purple-500 to-fuchsia-500", accent: "#8b5cf6", light: "#f5f3ff", dot: "bg-purple-400" },
  shipped: { label: "Shipped", icon: "fa-truck", gradient: "from-indigo-500 to-blue-500", accent: "#6366f1", light: "#eef2ff", dot: "bg-indigo-400" },
  delivered: { label: "Delivered", icon: "fa-check-double", gradient: "from-emerald-500 to-teal-500", accent: "#10b981", light: "#ecfdf5", dot: "bg-emerald-400" },
  cancelled: { label: "Cancelled", icon: "fa-times-circle", gradient: "from-red-500 to-rose-500", accent: "#ef4444", light: "#fef2f2", dot: "bg-red-400" },
  refunded: { label: "Refunded", icon: "fa-undo", gradient: "from-amber-500 to-orange-500", accent: "#f59e0b", light: "#fffbeb", dot: "bg-amber-400" },
};

const ALL_STATUSES: { value: OrderStatus; label: string; color: string; icon: string; desc: string }[] = [
  { value: "pending", label: "Pending", color: "#f59e0b", icon: "fa-clock", desc: "Awaiting payment" },
  { value: "confirmed", label: "Confirmed", color: "#3b82f6", icon: "fa-check-circle", desc: "Order confirmed" },
  { value: "processing", label: "Processing", color: "#8b5cf6", icon: "fa-cog", desc: "Being prepared" },
  { value: "shipped", label: "Shipped", color: "#6366f1", icon: "fa-truck", desc: "Order is on its way" },
  { value: "delivered", label: "Delivered", color: "#10b981", icon: "fa-check-double", desc: "Order delivered" },
  { value: "cancelled", label: "Cancelled", color: "#ef4444", icon: "fa-times-circle", desc: "Order cancelled" },
  { value: "refunded", label: "Refunded", color: "#f59e0b", icon: "fa-undo", desc: "Payment refunded" },
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

// ─── Sub-Components ───────────────────────────────────────────────────────────

function StatusMenu({ currentStatus, onUpdate, isOpen, onClose }: { currentStatus: string; onUpdate: (status: OrderStatus) => void; isOpen: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(e: Event) { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); }
    if (isOpen) { document.addEventListener("mousedown", handleClickOutside); }
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 bg-surface rounded-2xl shadow-2xl border border-outline-variant min-w-[200px] z-50 overflow-hidden">
      <div className="py-1">
        {ALL_STATUSES.map((s) => (
          <button key={s.value} disabled={currentStatus === s.value || !VALID_TRANSITIONS[currentStatus]?.has(s.value)}
            className={`w-full px-4 py-2.5 text-xs font-bold flex items-center gap-3 hover:bg-surface-variant transition-all disabled:opacity-30 disabled:grayscale`}
            onClick={() => { onUpdate(s.value); onClose(); }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-2xl border border-outline-variant/60 p-4">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-outline-variant/30">
        <i className={`fas ${icon} text-[10px] text-on-surface-variant opacity-60`} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{title}</span>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${className}`}>
      <span className="text-xs text-on-surface-variant font-medium">{label}</span>
      <span className="text-xs font-bold text-on-surface text-right">{children}</span>
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
  const bodyRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const theme = STATUS_THEMES[order.status] || STATUS_THEMES.pending;
  const statusConfig = ALL_STATUSES.find((s) => s.value === order.status);
  const orderNumber = order.orderNumber || order.id.substring(0, 8);
  const statusBadge = getStatusBadge(order.status);

  // Resolve product image from the productImages map
  const getProductImage = (p: { productId?: string; name?: string; imageUrl?: string }): string | undefined => {
    if (p.imageUrl) return p.imageUrl;
    if (p.productId && productImages[p.productId]) return productImages[p.productId];
    if (p.name) {
      const nameLookup = productImages[`name:${p.name.toLowerCase().trim()}`];
      if (nameLookup) return nameLookup;
    }
    return undefined;
  };

  const handleAction = async (action: string, handler: () => any) => {
    setLoadingAction(action);
    try { await handler(); } finally { setLoadingAction(null); }
  };

  const nextActions = (() => {
    if (order.status === "cancelled" || order.status === "delivered") return [];
    const actions: { label: string; icon: string; status: OrderStatus }[] = [];
    if (order.status === "pending") actions.push({ label: "Confirm", icon: "fa-check", status: "confirmed" });
    if (order.status === "confirmed") actions.push({ label: "Process", icon: "fa-cog", status: "processing" });
    if (order.status === "processing") actions.push({ label: "Ship", icon: "fa-truck", status: "shipped" });
    if (order.status === "shipped") actions.push({ label: "Deliver", icon: "fa-check-double", status: "delivered" });
    return actions;
  })();

  return (
    <div className="modal-dialog-overlay" onClick={onClose}>
      <div className="modal-dialog modal-dialog-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`relative shrink-0 bg-gradient-to-r ${theme.gradient} px-5 py-5 text-white`}>
          <div className="flex items-center justify-between mb-3">
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all">
              <i className="fas fa-arrow-left text-sm" />
            </button>
            <div className="flex gap-2">
              <button onClick={() => handleAction("print", () => onPrintInvoice(order))} className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all">
                <i className={`fas ${loadingAction === "print" ? "fa-circle-notch fa-spin" : "fa-print"} text-sm`} />
              </button>
              <button onClick={() => handleAction("whatsapp", () => onSendWhatsApp(order, order.status as any))} className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all">
                <i className={`fab ${loadingAction === "whatsapp" ? "fa-circle-notch fa-spin" : "fa-whatsapp"} text-sm`} />
              </button>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-black">Order #{orderNumber}</h2>
            <div className="flex items-center gap-3 text-white/80 text-[10px] font-bold uppercase tracking-widest mt-1">
              <span>{formatDate(order.createdAt)}</span>
              <span className="w-1 h-1 rounded-full bg-white/40" />
              <span>{formatTime(order.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div ref={bodyRef} className="modal-dialog-body flex-1 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${statusBadge.bg} ${statusBadge.color}`}>
              <i className={`fas ${statusConfig?.icon || "fa-circle"} mr-1.5`} />
              {statusBadge.label}
            </span>
            <div className="relative">
              <button onClick={() => setShowStatusMenu(!showStatusMenu)} className="px-3 py-1.5 bg-surface border-2 border-outline-variant rounded-xl text-[10px] font-bold uppercase tracking-widest hover:border-indigo-400 transition-all flex items-center gap-2">
                Update Status <i className="fas fa-chevron-down text-[8px]" />
              </button>
              <StatusMenu currentStatus={order.status} onUpdate={(s) => onUpdateStatus(s)} isOpen={showStatusMenu} onClose={() => setShowStatusMenu(false)} />
            </div>
          </div>

          <SectionCard icon="fa-user" title="Customer">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white font-black text-lg shadow-md`}>
                {order.customerName?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-black text-sm text-on-surface truncate">{order.customerName}</h3>
                <p className="text-[10px] text-on-surface-variant font-bold">{order.customerPhone}</p>
              </div>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-relaxed bg-surface-variant/30 p-2.5 rounded-xl border border-outline-variant/30">
              <i className="fas fa-map-marker-alt mr-2 opacity-50" />
              {order.deliveryAddress || "No address provided"}
            </p>
          </SectionCard>

          <SectionCard icon="fa-box" title="Items">
            <div className="space-y-2">
              {order.products?.map((p, idx) => {
                const imgSrc = getProductImage(p);
                return (
                  <div key={idx} className="flex items-center gap-3 p-2.5 bg-surface-variant/20 rounded-xl border border-outline-variant/20">
                    {/* Product image */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-surface-variant shadow-sm border border-outline-variant/30">
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <i className="fas fa-box text-on-surface-variant opacity-30 text-sm" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-on-surface truncate">{p.name}</h4>
                      <p className="text-[10px] text-on-surface-variant">{formatCurrency(p.price)} × {p.quantity}</p>
                    </div>
                    <div className="text-right font-black text-xs text-on-surface">{formatCurrency(p.price * p.quantity)}</div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard icon="fa-receipt" title="Payment">
            <div className="space-y-1">
              <InfoRow label="Subtotal">{formatCurrency(order.subtotal || 0)}</InfoRow>
              <InfoRow label="Shipping">{formatCurrency(order.deliveryCost || 0)}</InfoRow>
              <div className="pt-2 mt-2 border-t border-outline-variant/30 flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-on-surface">Total</span>
                <span className="text-xl font-black text-indigo-600">{formatCurrency(order.total || 0)}</span>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Footer */}
        <div className="modal-dialog-footer gap-2">
          <button onClick={onClose} className="px-4 py-2.5 border-2 border-outline-variant rounded-xl text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-variant transition-all">Close</button>
          <div className="flex-1 flex gap-2 justify-end">
            {nextActions.map((a) => (
              <button key={a.status} onClick={() => onUpdateStatus(a.status)} className={`px-4 py-2.5 bg-gradient-to-r ${theme.gradient} text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all`}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
