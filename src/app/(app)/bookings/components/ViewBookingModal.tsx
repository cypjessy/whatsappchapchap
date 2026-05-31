"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Booking } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";

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

type TabKey = "info" | "payment" | "timeline";

// ─── Status Themes ────────────────────────────────────────────────────────────

const STATUS_THEME: Record<string, { ring: string; light: string; icon: string; label: string }> = {
  confirmed:  { ring: "#059669", light: "#D1FAE5", icon: "fa-check-circle", label: "Confirmed" },
  pending:    { ring: "#D97706", light: "#FEF3C7", icon: "fa-clock",        label: "Pending" },
  completed:  { ring: "#2563EB", light: "#DBEAFE", icon: "fa-check-double", label: "Completed" },
  cancelled:  { ring: "#DC2626", light: "#FEE2E2", icon: "fa-times-circle", label: "Cancelled" },
};

const PAYMENT_THEME: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  paid:    { bg: "bg-emerald-50",   text: "text-emerald-700",   border: "border-emerald-200", icon: "fa-check-circle" },
  partial: { bg: "bg-amber-50",     text: "text-amber-700",     border: "border-amber-200",   icon: "fa-adjust" },
  unpaid:  { bg: "bg-rose-50",      text: "text-rose-700",      border: "border-rose-200",    icon: "fa-times-circle" },
};

function getStatus(s?: string) {
  return STATUS_THEME[s || ""] || { ring: "#94A3B8", light: "#F1F5F9", icon: "fa-question", label: s || "Unknown" };
}

function getPayment(s?: string) {
  return PAYMENT_THEME[s || "unpaid"] || PAYMENT_THEME.unpaid;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function AvatarRing({ name, status, size = 56 }: { name: string; status: string; size?: number }) {
  const st = getStatus(status);
  const initial = name?.charAt(0)?.toUpperCase() || "?";
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" className="shrink-0">
      <circle cx="30" cy="30" r="27" fill="none" stroke="#E2E8F0" strokeWidth="2.5" />
      <circle
        cx="30" cy="30" r="27" fill="none" stroke={st.ring} strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={`${(2 * Math.PI * 27 * 0.85).toFixed(1)} ${(2 * Math.PI * 27 * 0.15).toFixed(1)}`}
        strokeDashoffset="0"
        transform="rotate(-90 30 30)"
        className="transition-all duration-700"
      />
      <circle cx="30" cy="30" r="24" fill={st.light} />
      <text x="30" y="30" textAnchor="middle" dominantBaseline="central" fontSize="20" fontWeight="800" fill={st.ring} fontFamily="system-ui">
        {initial}
      </text>
    </svg>
  );
}

function InfoPill({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="shrink-0 flex items-center gap-2 px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
        <i className={`fas ${icon} text-[10px]`} />
      </div>
      <div className="min-w-0">
        <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
        <div className="text-xs font-bold text-slate-800 truncate max-w-[100px]">{value}</div>
      </div>
    </div>
  );
}

function TabButton({ active, icon, label, onClick }: { active: boolean; icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
        active
          ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
          : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
      }`}
    >
      <i className={`fas ${icon} text-[10px]`} />
      {label}
    </button>
  );
}

function TimelineDot({ active, color }: { active: boolean; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-2.5 h-2.5 rounded-full ${active ? "" : "bg-slate-200"}`} style={{ backgroundColor: active ? color : undefined }} />
      <div className="w-px h-8 bg-slate-200" />
    </div>
  );
}

function ImagePreview({ src, onOpen }: { src: string; onOpen: () => void }) {
  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 cursor-pointer group" onClick={onOpen}>
      <img src={src} alt="Proof" className="w-full h-28 object-cover transition-transform duration-300 group-hover:scale-105" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <i className="fas fa-expand text-xs text-slate-700" />
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({ open, title, message, confirmText, onConfirm, onCancel }: {
  open: boolean; title: string; message: string; confirmText: string; onConfirm: () => void; onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl w-full max-w-xs p-5 shadow-2xl animate-fadeIn" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <i className="fas fa-exclamation-triangle text-sm" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 text-center mb-1">{title}</h3>
        <p className="text-xs text-slate-500 text-center mb-4">{message}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 active:scale-95 transition-all">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-3 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold active:scale-95 transition-all shadow-md shadow-rose-600/20">{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ViewBookingModal(props: ViewBookingModalProps) {
  const { booking, open, onClose, onUpdateStatus, onDelete, onEdit, onOpenPaymentModal, onSendReminder } = props;

  const sheetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("info");
  const [isVisible, setIsVisible] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: "success" | "error" }[]>([]);
  const toastId = useRef(0);

  const addToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    const id = ++toastId.current;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 2500);
  }, []);

  // Entrance animation
  useEffect(() => {
    if (open) { requestAnimationFrame(() => setIsVisible(true)); setActiveTab("info"); setDragY(0); }
    else { setIsVisible(false); }
  }, [open]);

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close animation
  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 250);
  }, [onClose]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, handleClose]);

  // Drag-to-dismiss on mobile
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (contentRef.current && contentRef.current.scrollTop <= 0) {
      dragStartY.current = e.touches[0].clientY;
      setIsDragging(true);
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const dy = e.touches[0].clientY - dragStartY.current;
    if (dy > 0) setDragY(dy);
  }, [isDragging]);

  const onTouchEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      if (dragY > 120) handleClose();
      else setDragY(0);
    }
  }, [isDragging, dragY, handleClose]);

  // Hooks before early return
  const st = booking ? getStatus(booking.status) : null;
  const pt = booking ? getPayment(booking.paymentStatus) : null;
  const isPaid = booking?.paymentStatus === "paid";
  const isCancelled = booking?.status === "cancelled";
  const isCompleted = booking?.status === "completed";
  const balanceDue = booking ? Math.max(0, (booking.balance ?? booking.price) - (booking.deposit || 0)) : 0;

  if (!open || !booking || !st) return null;

  const timeline = [
    { label: "Booked", date: booking.createdAt?.toDate ? booking.createdAt.toDate().toISOString() : booking.createdAt, done: true },
    { label: "Confirmed", done: booking.status === "confirmed" || booking.status === "completed" || booking.status === "cancelled" },
    { label: "Completed", done: booking.status === "completed" },
  ];

  return (
    <>
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[4000] space-y-1.5 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto px-3.5 py-2.5 rounded-xl shadow-lg text-xs font-bold animate-slideInRight ${t.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>
            <i className={`fas ${t.type === "success" ? "fa-check-circle" : "fa-exclamation-circle"} mr-1.5`} />
            {t.msg}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxImg && (
        <div className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="Proof" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightboxImg(null)} className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 hover:rotate-90 transition-all" aria-label="Close image">
            <i className="fas fa-times" />
          </button>
        </div>
      )}

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={confirmCancel}
        title="Cancel Booking?"
        message="This will mark the booking as cancelled and notify the customer."
        confirmText="Cancel Booking"
        onConfirm={() => { onUpdateStatus?.(booking.id, "cancelled"); setConfirmCancel(false); handleClose(); }}
        onCancel={() => setConfirmCancel(false)}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete Booking?"
        message="This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => { onDelete?.(booking.id); setConfirmDelete(false); handleClose(); }}
        onCancel={() => setConfirmDelete(false)}
      />

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[2000] flex items-end md:items-center justify-center p-0 md:p-6"
        role="dialog"
        aria-modal="true"
        aria-label={`Booking details: ${booking.service}`}
        onClick={handleClose}
      >
        <div className={`absolute inset-0 transition-all duration-300 ${isVisible ? "bg-black/50 backdrop-blur-sm" : "bg-black/0 backdrop-blur-0"}`} />

        {/* Sheet */}
        <div
          ref={sheetRef}
          className={`relative w-full max-w-[560px] max-h-[92vh] md:max-h-[84vh] bg-white rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-out ${
            isVisible ? "opacity-100 translate-y-0 md:translate-y-0 md:scale-100" : "opacity-0 translate-y-8 md:translate-y-0 md:scale-[0.96]"
          }`}
          style={{ transform: isDragging ? `translateY(${dragY}px)` : undefined }}
          onClick={e => e.stopPropagation()}
        >
          {/* Drag handle (mobile) */}
          <div ref={dragRef} className="md:hidden flex justify-center pt-2 pb-1" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
            <div className="w-10 h-1 rounded-full bg-slate-300" />
          </div>

          {/* ─── HEADER ─── */}
          <div className="shrink-0 flex items-center justify-between px-5 pt-2 md:pt-4 pb-3">
            <div className="flex items-center gap-3 min-w-0">
              <AvatarRing name={booking.client} status={booking.status} />
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-slate-800 truncate">{booking.service}</h2>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{formatDate(booking.date)}</span>
                  <span>·</span>
                  <span>{booking.time}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: st.light, color: st.ring }}>
                <i className={`fas ${st.icon} text-[8px]`} />
                {st.label}
              </span>
              <button onClick={handleClose} className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-slate-200 hover:text-slate-600 transition-all hover:rotate-90" aria-label="Close">
                <i className="fas fa-times text-xs" />
              </button>
            </div>
          </div>

          {/* ─── TAB BAR ─── */}
          <div className="shrink-0 px-5 pb-3">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
              <TabButton active={activeTab === "info"} icon="fa-info-circle" label="Info" onClick={() => setActiveTab("info")} />
              <TabButton active={activeTab === "payment"} icon="fa-credit-card" label="Payment" onClick={() => setActiveTab("payment")} />
              <TabButton active={activeTab === "timeline"} icon="fa-clock" label="Timeline" onClick={() => setActiveTab("timeline")} />
            </div>
          </div>

          {/* ─── DIVIDER ─── */}
          <div className="shrink-0 mx-5 h-px bg-slate-100" />

          {/* ─── SCROLLABLE CONTENT ─── */}
          <div ref={contentRef} className="flex-1 overflow-y-auto scroll-smooth px-5 py-4" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>

            {/* === INFO TAB === */}
            {activeTab === "info" && (
              <div className="space-y-4 animate-fadeIn">
                {/* Client Card */}
                <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-4 border border-slate-200">
                  <div className="flex items-center gap-3 mb-3">
                    <AvatarRing name={booking.client} status={booking.status} size={44} />
                    <div>
                      <div className="font-bold text-sm text-slate-800">{booking.client}</div>
                      <div className="text-xs text-slate-500">{booking.phone}</div>
                      {booking.email && <div className="text-xs text-slate-400">{booking.email}</div>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={`https://wa.me/${booking.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 active:scale-95 transition-all shadow-sm shadow-emerald-600/20">
                      <i className="fab fa-whatsapp text-sm" /> WhatsApp
                    </a>
                    <a href={`tel:${booking.phone}`}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:border-slate-300 active:scale-95 transition-all">
                      <i className="fas fa-phone text-sm" /> Call
                    </a>
                  </div>
                </div>

                {/* Info Pills — horizontal scroll */}
                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                  <InfoPill icon="fa-calendar" label="Date" value={formatDate(booking.date)} />
                  <InfoPill icon="fa-clock" label="Time" value={booking.time} />
                  <InfoPill icon="fa-map-marker-alt" label="Location" value={booking.location} />
                  <InfoPill icon="fa-tag" label="Price" value={formatCurrency(booking.price)} />
                  {booking.duration && <InfoPill icon="fa-hourglass-half" label="Duration" value={booking.duration} />}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {booking.bookingNumber && (
                    <div className="bg-white rounded-xl p-3 border border-slate-100">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Booking #</div>
                      <div className="text-xs font-bold text-slate-700 font-mono truncate">{booking.bookingNumber}</div>
                    </div>
                  )}
                  {booking.packageTier && (
                    <div className="bg-white rounded-xl p-3 border border-slate-100">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Package</div>
                      <div className="text-xs font-bold text-slate-700 capitalize">{booking.packageTier}</div>
                    </div>
                  )}
                  {booking.source && (
                    <div className="bg-white rounded-xl p-3 border border-slate-100">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Source</div>
                      <div className="text-xs font-bold text-slate-700 capitalize">{booking.source}</div>
                    </div>
                  )}
                  {booking.assignedTo && (
                    <div className="bg-white rounded-xl p-3 border border-slate-100">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Assigned To</div>
                      <div className="text-xs font-bold text-slate-700 truncate">{booking.assignedTo}</div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {booking.notes && (
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <i className="fas fa-sticky-note text-[10px] text-amber-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Notes</span>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">{booking.notes}</p>
                  </div>
                )}
                {booking.cancellationReason && isCancelled && (
                  <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <i className="fas fa-exclamation-triangle text-[10px] text-rose-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Cancellation Reason</span>
                    </div>
                    <p className="text-xs text-rose-800 leading-relaxed">{booking.cancellationReason}</p>
                  </div>
                )}

                {/* Reference */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reference</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(booking.id); addToast("ID copied!"); }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 text-[10px] font-bold hover:border-slate-300 active:scale-95 transition-all"
                    >
                      <i className="fas fa-copy text-[8px]" /> Copy ID
                    </button>
                  </div>
                  <code className="text-[11px] font-mono text-violet-600 bg-violet-50 px-2 py-1 rounded-lg block truncate">{booking.id}</code>
                </div>

                {/* Reschedule info */}
                {booking.rescheduleCount && booking.rescheduleCount > 0 && (
                  <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <i className="fas fa-calendar-week text-[10px] text-sky-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600">Rescheduled</span>
                    </div>
                    <p className="text-xs text-sky-700">Rescheduled {booking.rescheduleCount} time{booking.rescheduleCount > 1 ? "s" : ""}</p>
                  </div>
                )}
              </div>
            )}

            {/* === PAYMENT TAB === */}
            {activeTab === "payment" && (
              <div className="space-y-4 animate-fadeIn">
                {/* Summary Card */}
                <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</span>
                    <span className="text-2xl font-extrabold text-slate-800">{formatCurrency(booking.price)}</span>
                  </div>

                  {/* Deposit & Balance */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white rounded-xl p-3 border border-slate-100">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Deposit</div>
                      <div className="font-bold text-sm text-emerald-600">{formatCurrency(booking.deposit || 0)}</div>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-slate-100">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Balance</div>
                      <div className={`font-bold text-sm ${balanceDue > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                        {formatCurrency(balanceDue)}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all duration-700"
                      style={{ width: `${Math.min(((booking.deposit || 0) / Math.max(booking.price, 1)) * 100, 100)}%` }}
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Status</span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${pt!.bg} ${pt!.text} ${pt!.border} border`}>
                        <i className={`fas ${pt!.icon} text-[8px]`} />
                        {(booking.paymentStatus || "unpaid").charAt(0).toUpperCase() + (booking.paymentStatus || "unpaid").slice(1)}
                      </span>
                    </div>
                    {booking.paymentMethod && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Method</span>
                        <span className="text-xs font-bold text-slate-700 capitalize">{booking.paymentMethod}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Proof */}
                {booking.paymentProof && (
                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 space-y-3">
                    <div className="flex items-center gap-1.5">
                      <i className="fas fa-check-circle text-emerald-500 text-xs" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Payment Confirmed</span>
                    </div>
                    {booking.paymentProof.transactionId && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Transaction</span>
                        <span className="text-xs font-bold font-mono text-slate-700">{booking.paymentProof.transactionId}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Amount</span>
                      <span className="font-bold text-sm text-emerald-600">{formatCurrency(booking.paymentProof.amount)}</span>
                    </div>
                    {booking.paymentProof.confirmedBy && (
                      <div className="flex items-center justify-between pt-2 border-t border-emerald-200/50">
                        <span className="text-xs text-slate-500">Confirmed By</span>
                        <span className="text-xs font-bold text-slate-700">{booking.paymentProof.confirmedBy}</span>
                      </div>
                    )}
                    {booking.paymentProof?.proofImage && (
                      <div className="pt-2 border-t border-emerald-200/50">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">Proof Screenshot</span>
                        <ImagePreview src={booking.paymentProof.proofImage} onOpen={() => setLightboxImg(booking.paymentProof!.proofImage!)} />
                      </div>
                    )}
                  </div>
                )}

                {/* Mark as Paid button */}
                {!isPaid && onOpenPaymentModal && (
                  <button
                    onClick={onOpenPaymentModal}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                  >
                    <i className="fas fa-check-circle" />
                    Confirm Payment
                  </button>
                )}
              </div>
            )}

            {/* === TIMELINE TAB === */}
            {activeTab === "timeline" && (
              <div className="space-y-5 animate-fadeIn">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <div className="flex items-center gap-1.5 mb-4">
                    <i className="fas fa-history text-[10px] text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Activity</span>
                  </div>
                  <div className="space-y-0">
                    {/* Created */}
                    <div className="flex gap-3">
                      <TimelineDot active={true} color="#8B5CF6" />
                      <div className="pb-4">
                        <div className="text-xs font-bold text-slate-700">Booking Created</div>
                        <div className="text-[10px] text-slate-400">
                          {booking.createdAt?.toDate ? formatDate(booking.createdAt.toDate().toISOString()) : "Recently"}
                        </div>
                      </div>
                    </div>
                    {/* Status events */}
                    {booking.status === "confirmed" && (
                      <div className="flex gap-3">
                        <TimelineDot active={true} color="#059669" />
                        <div className="pb-4">
                          <div className="text-xs font-bold text-slate-700">Confirmed</div>
                          <div className="text-[10px] text-slate-400">Booking was confirmed</div>
                        </div>
                      </div>
                    )}
                    {booking.status === "completed" && (
                      <>
                        <div className="flex gap-3">
                          <TimelineDot active={true} color="#059669" />
                          <div className="pb-4">
                            <div className="text-xs font-bold text-slate-700">Confirmed</div>
                            <div className="text-[10px] text-slate-400">Booking was confirmed</div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <TimelineDot active={true} color="#2563EB" />
                          <div className="pb-4">
                            <div className="text-xs font-bold text-slate-700">Completed</div>
                            <div className="text-[10px] text-slate-400">Service completed</div>
                          </div>
                        </div>
                      </>
                    )}
                    {booking.status === "cancelled" && (
                      <div className="flex gap-3">
                        <TimelineDot active={true} color="#DC2626" />
                        <div>
                          <div className="text-xs font-bold text-slate-700">Cancelled</div>
                          <div className="text-[10px] text-slate-400">{booking.cancellationReason || "No reason provided"}</div>
                        </div>
                      </div>
                    )}
                    {/* Upcoming states */}
                    {booking.status === "pending" && (
                      <div className="flex gap-3">
                        <TimelineDot active={false} color="#94A3B8" />
                        <div>
                          <div className="text-xs font-bold text-slate-400">Awaiting Confirmation</div>
                          <div className="text-[10px] text-slate-300">Booking needs to be confirmed</div>
                        </div>
                      </div>
                    )}
                    {booking.status === "confirmed" && (
                      <div className="flex gap-3">
                        <TimelineDot active={false} color="#94A3B8" />
                        <div>
                          <div className="text-xs font-bold text-slate-400">Pending Completion</div>
                          <div className="text-[10px] text-slate-300">Service not yet completed</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reminder status */}
                {booking.reminderSent && (
                  <div className="bg-sky-50 rounded-2xl p-4 border border-sky-200">
                    <div className="flex items-center gap-1.5 mb-1">
                      <i className="fas fa-bell text-sky-500 text-[10px]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600">Reminder Sent</span>
                    </div>
                    <p className="text-xs text-sky-700">Customer was notified about their upcoming booking.</p>
                  </div>
                )}

                {/* Send Reminder */}
                {onSendReminder && !isCancelled && !isCompleted && (
                  <button
                    onClick={async () => {
                      setSendingReminder(true);
                      try { await onSendReminder(booking.id); addToast("Reminder sent!", "success"); }
                      catch { addToast("Failed to send reminder", "error"); }
                      finally { setSendingReminder(false); }
                    }}
                    disabled={sendingReminder}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:border-slate-300 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {sendingReminder ? (
                      <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                    ) : (
                      <i className="fas fa-bell text-xs" />
                    )}
                    Send Reminder
                  </button>
                )}
              </div>
            )}

            {/* Bottom spacing for FABs */}
            <div className="h-20" />
          </div>

          {/* ─── FLOATING ACTION BAR ─── */}
          <div className="shrink-0 px-5 py-3 border-t border-slate-100 bg-gradient-to-t from-white via-white to-white/95">
            <div className="flex gap-2">
              {/* Edit */}
              {onEdit && (
                <button
                  onClick={() => onEdit(booking)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:border-slate-300 hover:bg-slate-50 active:scale-95 transition-all flex-1"
                >
                  <i className="fas fa-edit text-xs" /> Edit
                </button>
              )}
              {/* Status actions */}
              {!isCancelled && !isCompleted && (
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 active:scale-95 transition-all shadow-sm shadow-rose-600/20 flex-1"
                >
                  <i className="fas fa-times text-xs" /> Cancel
                </button>
              )}
              {/* Complete / Confirm */}
              {!isCancelled && !isCompleted && (
                <button
                  onClick={() => {
                    if (booking.status === "pending" || booking.status === "confirmed") {
                      onUpdateStatus?.(booking.id, "completed");
                    }
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 active:scale-95 transition-all shadow-sm shadow-emerald-600/20 flex-1"
                >
                  <i className="fas fa-check text-xs" /> {booking.status === "completed" ? "Complete" : "Complete"}
                </button>
              )}
              {/* Delete */}
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center justify-center px-4 py-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl text-xs font-bold hover:border-rose-300 hover:bg-rose-50 active:scale-95 transition-all"
                aria-label="Delete booking"
                title="Delete booking"
              >
                <i className="fas fa-trash-alt text-xs" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
