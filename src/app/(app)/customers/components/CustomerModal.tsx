"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Customer, Client, Order, Booking, orderService, bookingService, customerService } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomerModalProps {
  customer: Customer;
  onClose: () => void;
  onDelete: () => void;
  onSendWhatsApp: (phone: string, message?: string) => void;
  formatCurrency: (amount: number) => string;
  getColorFromString: (str: string) => string;
  getInitials: (name: string) => string;
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  active:   { label: "Active",   bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  vip:      { label: "VIP",      bg: "bg-amber-100",    text: "text-amber-700",    dot: "bg-amber-500" },
  new:      { label: "New",      bg: "bg-blue-100",      text: "text-blue-700",      dot: "bg-blue-500" },
  inactive: { label: "Inactive", bg: "bg-slate-100",    text: "text-slate-500",     dot: "bg-slate-400" },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CustomerModal({
  customer,
  onClose,
  onDelete,
  onSendWhatsApp,
  formatCurrency,
  getColorFromString,
  getInitials,
}: CustomerModalProps) {
  const { user } = useAuth();
  const [isClosing, setIsClosing] = useState(false);
  const [status, setStatus] = useState(customer.status || "new");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  }, [onClose]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [allOrders, allBookings] = await Promise.all([
          orderService.getOrders(user),
          bookingService.getBookings(user),
        ]);
        const customerOrders = allOrders.filter(o => o.customerId === customer.id || o.customerPhone === customer.phone);
        const phoneClean = customer.phone.replace(/[^0-9]/g, "");
        const customerBookings = allBookings.filter(b => {
          const bPhone = b.phone?.replace(/[^0-9]/g, "") || "";
          return bPhone.includes(phoneClean) || phoneClean.includes(bPhone);
        });
        setOrders(customerOrders);
        setBookings(customerBookings);
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, [user, customer.id, customer.phone]);

  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;

  return (
    <div className={`modal-dialog-overlay ${isClosing ? "opacity-0" : "opacity-100 animate-fadeIn"}`} onClick={handleClose}>
      <div className="modal-dialog modal-dialog-lg" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`relative shrink-0 bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 px-6 py-6 text-white`}>
          <div className="flex items-center justify-between mb-4">
            <button onClick={handleClose} className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all">
              <i className="fas fa-arrow-left text-sm" />
            </button>
            <button onClick={onDelete} className="text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-rose-200 transition-all">
              Delete Customer
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getColorFromString(customer.name)} flex items-center justify-center text-2xl font-black text-white shadow-xl ring-4 ring-white/20 shrink-0`}>
              {getInitials(customer.name)}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black truncate">{customer.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusCfg.bg} ${statusCfg.text}`}>
                  {status}
                </span>
                <span className="text-[10px] font-bold text-white/70">{customer.phone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="modal-dialog-body flex-1 p-5 space-y-4">
          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
              <div className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1">Total Spent</div>
              <div className="text-lg font-black text-indigo-600">{formatCurrency(customer.totalSpent || 0)}</div>
            </div>
            <div className="p-3 bg-violet-50 rounded-2xl border border-violet-100">
              <div className="text-[9px] font-black uppercase tracking-widest text-violet-400 mb-1">Orders</div>
              <div className="text-lg font-black text-violet-600">{orders.length}</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-surface rounded-2xl border border-outline-variant/60 p-4">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-outline-variant/30">
                <i className="fas fa-address-book text-[10px] text-on-surface-variant opacity-60" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Contact Details</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface-variant">Phone</span>
                  <span className="text-xs font-black text-indigo-600">{customer.phone}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface-variant">Email</span>
                    <span className="text-xs font-black text-on-surface">{customer.email}</span>
                  </div>
                )}
                {customer.location && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface-variant">Location</span>
                    <span className="text-xs font-black text-on-surface">{customer.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Section */}
          <div className="bg-surface rounded-2xl border border-outline-variant/60 p-4">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-outline-variant/30">
              <i className="fas fa-history text-[10px] text-on-surface-variant opacity-60" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Recent Activity</span>
            </div>
            {loadingData ? (
              <div className="py-4 text-center text-xs font-bold text-on-surface-variant animate-pulse">Loading activity...</div>
            ) : orders.length === 0 && bookings.length === 0 ? (
              <div className="py-4 text-center text-xs font-bold text-on-surface-variant opacity-40 italic">No activity yet</div>
            ) : (
              <div className="space-y-2">
                {orders.slice(0, 3).map(o => (
                  <div key={o.id} className="flex items-center justify-between p-2 bg-surface-variant/20 rounded-xl">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-receipt text-[10px] text-on-surface-variant opacity-40" />
                      <span className="text-[10px] font-bold text-on-surface">Order #{o.orderNumber || o.id.substring(0, 6)}</span>
                    </div>
                    <span className="text-[10px] font-black text-on-surface">{formatCurrency(o.total || 0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-dialog-footer">
          <div className="flex gap-2 w-full">
            <button onClick={() => onSendWhatsApp(customer.phone)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
              <i className="fab fa-whatsapp text-sm" /> WhatsApp
            </button>
            <button onClick={handleClose} className="px-6 py-3 bg-surface border-2 border-outline-variant rounded-xl font-black text-xs uppercase tracking-widest text-on-surface-variant active:scale-95 transition-all">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
