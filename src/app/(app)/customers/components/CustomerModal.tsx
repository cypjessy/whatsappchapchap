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

interface TimelineEvent {
  id: string;
  type: "created" | "order" | "booking" | "visit";
  title: string;
  subtitle: string;
  timestamp: Date;
  icon: string;
  iconColor: string;
  iconBg: string;
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  active:   { label: "Active",   bg: "bg-emerald-100 dark:bg-emerald-900/60", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  vip:      { label: "VIP",      bg: "bg-amber-100 dark:bg-amber-900/60",    text: "text-amber-700 dark:text-amber-400",    dot: "bg-amber-500" },
  new:      { label: "New",      bg: "bg-blue-100 dark:bg-blue-900/60",      text: "text-blue-700 dark:text-blue-400",      dot: "bg-blue-500" },
  inactive: { label: "Inactive", bg: "bg-slate-100 dark:bg-slate-800/60",    text: "text-slate-500 dark:text-slate-400",     dot: "bg-slate-400" },
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending:    "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-400",
  confirmed:  "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-400",
  processing: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-400",
  shipped:    "bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-400",
  delivered:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-400",
  cancelled:  "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-400",
  refunded:   "bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400",
};

const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending:    "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-400",
  confirmed:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-400",
  completed:  "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-400",
  cancelled:  "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-400",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeAgo(date?: Date | string | any): string {
  if (!date) return "";
  const d = date?.toDate ? date.toDate() : new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatDate(date?: Date | string | any): string {
  if (!date) return "N/A";
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getOrderStatusColor(status: string): string {
  return ORDER_STATUS_COLORS[status] || "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400";
}

function getBookingStatusColor(status: string): string {
  return BOOKING_STATUS_COLORS[status] || "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400";
}

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedCounter({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const duration = 600;
    const start = performance.now();
    const from = 0;
    const to = value;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  return <>{prefix}{display.toLocaleString()}{suffix}</>;
}

// ─── Collapsible Section ──────────────────────────────────────────────────────

function CollapsibleSection({
  title, icon, iconColor, count, children, defaultOpen = true,
}: {
  title: string; icon: string; iconColor: string; count?: number; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white dark:bg-[var(--md-sys-color-surface)] rounded-2xl border border-slate-200 dark:border-[var(--md-sys-color-outline-variant)] overflow-hidden shadow-sm transition-shadow duration-200 hover:shadow-md">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 md:px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-[var(--md-sys-color-surface-variant)]/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconColor.replace("text-", "bg-").replace("]", "]/15")}`}>
            <i className={`fas ${icon} ${iconColor} text-xs`} />
          </div>
          <span className="font-bold text-sm text-slate-800 dark:text-[var(--md-sys-color-on-surface)]">{title}</span>
          {count !== undefined && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-[var(--md-sys-color-surface-variant)]/80 text-slate-500 dark:text-[var(--md-sys-color-on-surface-variant)]">
              {count}
            </span>
          )}
        </div>
        <i className={`fas fa-chevron-down text-xs text-slate-400 dark:text-[var(--md-sys-color-outline)] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`transition-all duration-300 ease-in-out ${open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
        <div className="px-4 md:px-5 pb-4 md:pb-5">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Timeline Event Card ──────────────────────────────────────────────────────

function TimelineEventCard({ event, index }: { event: TimelineEvent; index: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 60);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-[var(--md-sys-color-surface-variant)]/30 transition-all duration-300 ${
        visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
      }`}
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${event.iconBg} ${event.iconColor}`}>
        <i className={`fas ${event.icon} text-xs`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-slate-800 dark:text-[var(--md-sys-color-on-surface)]">{event.title}</div>
        <div className="text-xs text-slate-500 dark:text-[var(--md-sys-color-on-surface-variant)] mt-0.5">{event.subtitle}</div>
      </div>
      <div className="text-[10px] font-medium text-slate-400 dark:text-[var(--md-sys-color-outline)] shrink-0">{formatTimeAgo(event.timestamp)}</div>
    </div>
  );
}

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

  // ─── State ──────────────────────────────────────────────────────────────
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [status, setStatus] = useState(customer.status || "new");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  // Dynamic data
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Notes
  const [notes, setNotes] = useState(customer.notes || "");
  const [notesStatus, setNotesStatus] = useState<"idle" | "saving" | "saved">("idle");
  const notesTimer = useRef<ReturnType<typeof setTimeout>>(undefined as unknown as ReturnType<typeof setTimeout>);

  // Tags
  const [tags, setTags] = useState<string[]>(customer.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [savingTags, setSavingTags] = useState(false);
  const tagsTimer = useRef<ReturnType<typeof setTimeout>>(undefined as unknown as ReturnType<typeof setTimeout>);

  // ─── Animate in ─────────────────────────────────────────────────────────
  useEffect(() => { requestAnimationFrame(() => setIsVisible(true)); }, []);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  }, [onClose]);

  // ─── Load dynamic data ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    setLoadingData(true);

    const load = async () => {
      try {
        const [allOrders, allBookings] = await Promise.all([
          orderService.getOrders(user),
          bookingService.getBookings(user),
        ]);

        if (!mounted) return;

        const customerOrders = allOrders.filter(o => o.customerId === customer.id || o.customerPhone === customer.phone);
        const phoneClean = customer.phone.replace(/[^0-9]/g, "");
        const customerBookings = allBookings.filter(b => {
          const bPhone = b.phone?.replace(/[^0-9]/g, "") || "";
          return bPhone.includes(phoneClean) || phoneClean.includes(bPhone);
        });

        setOrders(customerOrders);
        setBookings(customerBookings);
      } catch (err) {
        console.error("Error loading customer data:", err);
      } finally {
        if (mounted) setLoadingData(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [user, customer.id, customer.phone]);

  // ─── Build timeline ─────────────────────────────────────────────────────
  const timeline = useMemo((): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Customer created
    const createdDate = customer.createdAt?.toDate ? customer.createdAt.toDate() : new Date(customer.createdAt);
    events.push({
      id: "created",
      type: "created",
      title: "Customer registered",
      subtitle: "Added to the system",
      timestamp: createdDate,
      icon: "fa-user-plus",
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
    });

    // Orders
    orders.forEach(o => {
      const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      events.push({
        id: `order-${o.id}`,
        type: "order",
        title: `Order placed — ${o.orderNumber || "#" + o.id?.substring(0, 7)}`,
        subtitle: `${formatCurrency(o.total || 0)} • ${o.status}`,
        timestamp: d,
        icon: "fa-shopping-bag",
        iconColor: "text-violet-600",
        iconBg: "bg-violet-100 dark:bg-violet-900/30",
      });
    });

    // Bookings
    bookings.forEach(b => {
      const d = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      events.push({
        id: `booking-${b.id}`,
        type: "booking",
        title: `Booking for ${b.service}`,
        subtitle: `${formatDate(b.date)} at ${b.time} • ${b.status}`,
        timestamp: d,
        icon: "fa-calendar-check",
        iconColor: "text-emerald-600",
        iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      });
    });

    // Last visit
    if (customer.lastVisit) {
      events.push({
        id: "last-visit",
        type: "visit",
        title: "Last visit",
        subtitle: `Visited on ${formatDate(customer.lastVisit)}`,
        timestamp: new Date(customer.lastVisit),
        icon: "fa-clock",
        iconColor: "text-amber-600",
        iconBg: "bg-amber-100 dark:bg-amber-900/30",
      });
    }

    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return events;
  }, [customer, orders, bookings, formatCurrency]);

  // ─── Status change ──────────────────────────────────────────────────────
  const changeStatus = async (newStatus: string) => {
    if (!user || newStatus === status) return;
    setSavingStatus(true);
    try {
      await customerService.updateClient(user, customer.id, { status: newStatus as Client["status"] });
      setStatus(newStatus as typeof status);
      setShowStatusMenu(false);
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setSavingStatus(false);
    }
  };

  // ─── Notes auto-save ────────────────────────────────────────────────────
  const handleNotesChange = (val: string) => {
    setNotes(val);
    setNotesStatus("saving");
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(async () => {
      if (!user) return;
      try {
        await customerService.updateClient(user, customer.id, { notes: val });
        setNotesStatus("saved");
        setTimeout(() => setNotesStatus("idle"), 2000);
      } catch { setNotesStatus("idle"); }
    }, 800);
  };

  // ─── Tags ───────────────────────────────────────────────────────────────
  const addTag = () => {
    const t = tagInput.trim();
    if (!t || tags.includes(t)) return;
    const next = [...tags, t];
    setTags(next);
    setTagInput("");
    persistTags(next);
  };

  const removeTag = (tag: string) => {
    const next = tags.filter(t => t !== tag);
    setTags(next);
    persistTags(next);
  };

  const persistTags = async (newTags: string[]) => {
    if (!user) return;
    setSavingTags(true);
    try {
      await customerService.updateClient(user, customer.id, { tags: newTags } as any);
    } catch (err) {
      console.error("Error saving tags:", err);
    } finally {
      setTimeout(() => setSavingTags(false), 500);
    }
  };

  // ─── Delete handler ─────────────────────────────────────────────────────
  const handleDelete = () => {
    if (window.confirm("Delete this customer? This action cannot be undone.")) {
      onDelete();
    }
  };

  // ─── Stats ──────────────────────────────────────────────────────────────
  const stats = [
    { label: "Total Spent", value: customer.totalSpent || 0, icon: "fa-wallet", color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/60", prefix: "KES " },
    { label: "Orders",      value: orders.length,            icon: "fa-shopping-bag", color: "text-violet-500",  bg: "bg-violet-50 dark:bg-violet-900/60",  prefix: "" },
    { label: "Bookings",    value: bookings.length,          icon: "fa-calendar-check", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/60", prefix: "" },
    { label: "Visits",      value: customer.visits || 0,     icon: "fa-repeat",       color: "text-amber-500",  bg: "bg-amber-50 dark:bg-amber-900/60",   prefix: "" },
  ];

  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6 overflow-y-auto transition-opacity duration-200 ${
        isVisible && !isClosing ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Modal */}
      <div
        className={`relative w-full max-w-2xl my-4 md:my-8 transition-all duration-300 ease-out ${
          isVisible && !isClosing ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-6"
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-white dark:bg-[var(--md-sys-color-surface-container)] rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
          {/* ═══ HEADER ═══ */}            <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 px-5 md:px-6 pt-6 pb-16">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-violet-300/20 rounded-full blur-2xl" />

            <div className="relative flex items-start justify-between">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative group">
                  <div className="absolute -inset-2 rounded-full bg-white/20 blur-md animate-pulse" />
                  <div
                    className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br ${getColorFromString(customer.name)} flex items-center justify-center text-2xl md:text-3xl font-bold text-white shadow-xl ring-2 ring-white/30`}
                  >
                    {getInitials(customer.name)}
                  </div>
                </div>

                <div className="text-white">
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight drop-shadow-sm">{customer.name}</h2>
                  <div className="flex items-center gap-2 mt-1.5">
                    {/* Status badge — clickable to change */}
                    <div className="relative">
                      <button
                        onClick={() => setShowStatusMenu(!showStatusMenu)}
                        disabled={savingStatus}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.text} hover:brightness-110 transition-all active:scale-95`}
                      >
                        {savingStatus ? (
                          <i className="fas fa-circle-notch fa-spin text-[9px]" />
                        ) : (
                          <><span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />{status}</>
                        )}
                      </button>

                      {showStatusMenu && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
                          <div className="absolute top-full left-0 mt-1 z-20 bg-white dark:bg-[var(--md-sys-color-surface-container)] rounded-xl shadow-xl border border-slate-200 dark:border-[var(--md-sys-color-outline-variant)] p-1 min-w-[140px]">
                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                              <button
                                key={key}
                                onClick={() => changeStatus(key)}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                                  key === status
                                    ? `${cfg.bg} ${cfg.text}`
                                    : "text-slate-600 dark:text-[var(--md-sys-color-on-surface-variant)] hover:bg-slate-50 dark:hover:bg-[var(--md-sys-color-surface-variant)]/50"
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                {cfg.label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {customer.verified && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-200">
                        <i className="fas fa-check-circle text-[10px]" />
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-90 shrink-0 backdrop-blur-sm"
              >
                <i className="fas fa-times text-sm" />
              </button>
            </div>
          </div>

          {/* ═══ CONTENT ═══ */}
          <div className="px-4 md:px-5 -mt-10 relative z-10 space-y-3 pb-20">
            {/* Stats bar */}
            <div className="grid grid-cols-4 gap-2 md:gap-3">
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className={`${s.bg} rounded-xl p-2.5 md:p-3 transition-all duration-300`}
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <div className={`flex items-center gap-1.5 mb-1 ${s.color}`}>
                    <i className={`fas ${s.icon} text-[10px]`} />
                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">{s.label}</span>
                  </div>
                  <div className={`text-sm md:text-base font-extrabold ${s.color} tabular-nums`}>
                    <AnimatedCounter value={s.value} prefix={s.prefix} />
                  </div>
                </div>
              ))}
            </div>

            {/* Contact quick info */}
            <div className="flex flex-wrap items-center gap-2 px-1">                {[
                { icon: "fab fa-whatsapp", value: customer.phone, color: "text-emerald-500", onClick: () => onSendWhatsApp(customer.phone) },
                { icon: "fas fa-envelope", value: customer.email || "—", color: "text-blue-500", onClick: customer.email ? () => window.open(`mailto:${customer.email}`) : undefined },
                { icon: "fas fa-map-marker-alt", value: customer.location || "—", color: "text-amber-500", onClick: customer.location ? () => window.open(`https://maps.google.com/?q=${encodeURIComponent(customer.location || "")}`) : undefined },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.onClick}
                  disabled={!item.onClick ? true : undefined}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    item.onClick
                      ? "bg-slate-50 dark:bg-[var(--md-sys-color-surface-variant)] text-slate-700 dark:text-[var(--md-sys-color-on-surface)] hover:bg-slate-100 dark:hover:bg-[var(--md-sys-color-surface-variant)]/80 active:scale-95"
                      : "bg-slate-50 dark:bg-[var(--md-sys-color-surface-variant)] text-slate-400 dark:text-[var(--md-sys-color-outline)] cursor-not-allowed"
                  }`}
                >
                  <i className={`${item.icon} ${item.onClick ? item.color : ""} text-[10px]`} />
                  <span className="max-w-[120px] truncate">{item.value}</span>
                </button>
              ))}
              {customer.favoriteService && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-[var(--md-sys-color-surface-variant)] text-slate-700 dark:text-[var(--md-sys-color-on-surface)]">
                  <i className="fas fa-star text-amber-400 text-[10px]" />
                  {customer.favoriteService}
                </span>
              )}
            </div>

            {/* Loading state */}
            {loadingData ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
                  <span className="text-xs font-medium text-slate-400 dark:text-[var(--md-sys-color-on-surface-variant)]">Loading customer data...</span>
                </div>
              </div>
            ) : (
              <>
                {/* ── Timeline ── */}
                <CollapsibleSection title="Activity" icon="fa-chart-line" iconColor="text-indigo-500" count={timeline.length}>
                  {timeline.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 dark:text-[var(--md-sys-color-outline)]">
                      <i className="fas fa-history text-2xl mb-2 opacity-50" />
                      <p className="text-xs font-medium">No activity recorded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {timeline.slice(0, 20).map((event, idx) => (
                        <TimelineEventCard key={event.id} event={event} index={idx} />
                      ))}
                    </div>
                  )}
                </CollapsibleSection>

                {/* ── Orders ── */}
                <CollapsibleSection title="Orders" icon="fa-shopping-bag" iconColor="text-violet-500" count={orders.length} defaultOpen={orders.length > 0}>
                  {orders.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 dark:text-[var(--md-sys-color-outline)]">
                      <i className="fas fa-box-open text-2xl mb-2 opacity-50" />
                      <p className="text-xs font-medium">No orders yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {orders.map((o) => (
                        <div key={o.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[var(--md-sys-color-surface-variant)]/60 hover:bg-slate-100 dark:hover:bg-[var(--md-sys-color-surface-variant)] transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-white dark:bg-[var(--md-sys-color-surface)] flex items-center justify-center text-slate-400 dark:text-[var(--md-sys-color-on-surface-variant)] shadow-sm">
                              <i className="fas fa-receipt text-xs" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-sm text-slate-800 dark:text-[var(--md-sys-color-on-surface)] truncate">
                                {o.orderNumber || `#${o.id?.substring(0, 7)}`}
                              </div>
                              <div className="text-[10px] text-slate-400 dark:text-[var(--md-sys-color-outline)] mt-0.5">
                                {formatDate(o.createdAt)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <div className="font-bold text-sm text-slate-800 dark:text-[var(--md-sys-color-on-surface)]">{formatCurrency(o.total || 0)}</div>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold mt-0.5 uppercase ${getOrderStatusColor(o.status || "pending")}`}>
                              {o.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsibleSection>

                {/* ── Bookings ── */}
                <CollapsibleSection title="Bookings" icon="fa-calendar-check" iconColor="text-emerald-500" count={bookings.length} defaultOpen={bookings.length > 0}>
                  {bookings.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 dark:text-[var(--md-sys-color-outline)]">
                      <i className="fas fa-calendar-day text-2xl mb-2 opacity-50" />
                      <p className="text-xs font-medium">No bookings yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {bookings.map((b) => (
                        <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[var(--md-sys-color-surface-variant)]/60 hover:bg-slate-100 dark:hover:bg-[var(--md-sys-color-surface-variant)] transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-white dark:bg-[var(--md-sys-color-surface)] flex items-center justify-center text-slate-400 dark:text-[var(--md-sys-color-on-surface-variant)] shadow-sm">
                              <i className="fas fa-spa text-xs" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-sm text-slate-800 dark:text-[var(--md-sys-color-on-surface)] truncate">{b.service}</div>
                              <div className="text-[10px] text-slate-400 dark:text-[var(--md-sys-color-outline)] mt-0.5">
                                {formatDate(b.date)} at {b.time}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <div className="font-bold text-sm text-slate-800 dark:text-[var(--md-sys-color-on-surface)]">{formatCurrency(b.price || 0)}</div>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold mt-0.5 uppercase ${getBookingStatusColor(b.status || "pending")}`}>
                              {b.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsibleSection>

                {/* ── Notes ── */}
                <CollapsibleSection title="Notes" icon="fa-pen" iconColor="text-amber-500">
                  <div>
                    <div className="flex items-center justify-end mb-2">
                      <span className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${
                        notesStatus === "saving" ? "text-amber-500" : notesStatus === "saved" ? "text-emerald-500" : "text-slate-300 dark:text-[var(--md-sys-color-outline)]"
                      }`}>
                        {notesStatus === "saving" && <><i className="fas fa-circle-notch fa-spin mr-1" />Saving...</>}
                        {notesStatus === "saved" && <><i className="fas fa-check mr-1" />Saved</>}
                        {notesStatus === "idle" && "Auto-save"}
                      </span>
                    </div>
                    <textarea
                      value={notes}
                      onChange={e => handleNotesChange(e.target.value)}
                      placeholder="Add notes about this customer..."
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-[var(--md-sys-color-surface-variant)] rounded-xl text-sm text-slate-800 dark:text-[var(--md-sys-color-on-surface)] placeholder:text-slate-300 dark:placeholder:text-[var(--md-sys-color-outline)] resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-500/40 transition-all border border-slate-200 dark:border-[var(--md-sys-color-outline-variant)]"
                    />
                  </div>
                </CollapsibleSection>

                {/* ── Tags ── */}
                <CollapsibleSection title="Tags" icon="fa-tags" iconColor="text-rose-500">
                  <div>
                    <div className="flex flex-wrap gap-1.5 mb-3 min-h-[30px]">
                      {tags.map((tag, i) => {
                        const colors = [
                          "bg-indigo-100 text-indigo-700 border-indigo-200/50 dark:bg-indigo-900/30 dark:text-indigo-400",
                          "bg-violet-100 text-violet-700 border-violet-200/50 dark:bg-violet-900/30 dark:text-violet-400",
                          "bg-emerald-100 text-emerald-700 border-emerald-200/50 dark:bg-emerald-900/30 dark:text-emerald-400",
                          "bg-amber-100 text-amber-700 border-amber-200/50 dark:bg-amber-900/30 dark:text-amber-400",
                          "bg-rose-100 text-rose-700 border-rose-200/50 dark:bg-rose-900/30 dark:text-rose-400",
                          "bg-cyan-100 text-cyan-700 border-cyan-200/50 dark:bg-cyan-900/30 dark:text-cyan-400",
                        ];
                        return (
                          <span key={tag} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${colors[i % colors.length]} animate-fadeIn`}>
                            <i className="fas fa-hashtag text-[8px] opacity-50" />
                            {tag}
                            <button onClick={() => removeTag(tag)} className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                              <i className="fas fa-times text-[7px]" />
                            </button>
                          </span>
                        );
                      })}
                      {tags.length === 0 && (
                        <span className="text-xs text-slate-400 dark:text-[var(--md-sys-color-outline)] italic">No tags yet</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                        placeholder="Add a tag..."
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-[var(--md-sys-color-surface-variant)] rounded-xl text-sm text-slate-800 dark:text-[var(--md-sys-color-on-surface)] placeholder:text-slate-300 dark:placeholder:text-[var(--md-sys-color-outline)] focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-500/40 transition-all border border-slate-200 dark:border-[var(--md-sys-color-outline-variant)]"
                      />
                      <button
                        onClick={addTag}
                        disabled={!tagInput.trim()}
                        className="px-3 py-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/80 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-semibold transition-all active:scale-90"
                      >
                        <i className="fas fa-plus text-xs" />
                      </button>
                    </div>
                  </div>
                </CollapsibleSection>
              </>
            )}
          </div>

          {/* ═══ FLOATING ACTION BAR ═══ */}
          <div className="absolute bottom-0 left-0 right-0 px-4 md:px-5 py-3 bg-white dark:bg-[var(--md-sys-color-surface-container)] border-t border-slate-100 dark:border-[var(--md-sys-color-outline-variant)]/50">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSendWhatsApp(customer.phone)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all active:scale-95"
                >
                  <i className="fab fa-whatsapp text-sm" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>
                {customer.email && (
                  <button
                    onClick={() => window.open(`mailto:${customer.email}`)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[var(--md-sys-color-surface)] border border-slate-200 dark:border-[var(--md-sys-color-outline-variant)] text-slate-700 dark:text-[var(--md-sys-color-on-surface)] rounded-xl font-bold text-xs hover:border-blue-300 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
                  >
                    <i className="fas fa-envelope text-sm text-blue-500" />
                    <span className="hidden sm:inline">Email</span>
                  </button>
                )}
              </div>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all active:scale-95"
              >
                <i className="fas fa-trash text-sm" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
