"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Booking } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingTimelineProps {
  bookings: Booking[];
  onViewBooking: (booking: Booking) => void;
  isLoading?: boolean;
}

interface GroupedBookings {
  date: string;
  dateLabel: string;
  isToday: boolean;
  isTomorrow: boolean;
  isYesterday: boolean;
  bookings: Booking[];
}

// ─── Constants ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string; ring: string }> = {
  confirmed: {
    bg: "bg-[rgba(37,211,102,0.12)]",
    text: "text-[#10b981]",
    border: "border-[#10b981]/20",
    dot: "bg-[#10b981]",
    ring: "ring-[#10b981]/30",
  },
  pending: {
    bg: "bg-[rgba(245,158,11,0.12)]",
    text: "text-[#f59e0b]",
    border: "border-[#f59e0b]/20",
    dot: "bg-[#f59e0b]",
    ring: "ring-[#f59e0b]/30",
  },
  completed: {
    bg: "bg-[rgba(59,130,246,0.12)]",
    text: "text-[#3b82f6]",
    border: "border-[#3b82f6]/20",
    dot: "bg-[#3b82f6]",
    ring: "ring-[#3b82f6]/30",
  },
  cancelled: {
    bg: "bg-[rgba(239,68,68,0.12)]",
    text: "text-[#ef4444]",
    border: "border-[#ef4444]/20",
    dot: "bg-[#ef4444]",
    ring: "ring-[#ef4444]/30",
  },
};

const PAYMENT_CONFIG: Record<string, { bg: string; text: string; icon: string }> = {
  paid: { bg: "bg-[#10b981]/10", text: "text-[#10b981]", icon: "fa-check-circle" },
  partial: { bg: "bg-[#f59e0b]/10", text: "text-[#f59e0b]", icon: "fa-adjust" },
  unpaid: { bg: "bg-[#ef4444]/10", text: "text-[#ef4444]", icon: "fa-times-circle" },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDayLabel(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

  if (dateOnly.getTime() === todayOnly.getTime()) return "Today";
  if (dateOnly.getTime() === tomorrowOnly.getTime()) return "Tomorrow";
  if (dateOnly.getTime() === yesterdayOnly.getTime()) return "Yesterday";

  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || {
    bg: "bg-[#f1f5f9]",
    text: "text-[#64748b]",
    border: "border-[#e2e8f0]",
    dot: "bg-[#94a3b8]",
    ring: "ring-[#94a3b8]/30",
  };
}

function getPaymentConfig(status?: string) {
  return PAYMENT_CONFIG[status || "unpaid"] || PAYMENT_CONFIG.unpaid;
}

// Safe first letter helper - handles undefined, empty, or invalid client names
function getSafeFirstLetter(booking: Booking): string {
  const clientName = booking?.client || "";
  if (!clientName) {
    return "?";
  }
  // Return first character, uppercase
  return clientName.charAt(0).toUpperCase();
}

function groupBookingsByDate(bookings: Booking[]): GroupedBookings[] {
  const groups: Record<string, Booking[]> = {};

  bookings.forEach((booking) => {
    if (!groups[booking?.date]) groups[booking?.date || ""] = [];
    groups[booking?.date || ""].push(booking);
  });

  return Object.entries(groups)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([date, dayBookings]) => {
      const d = new Date(date);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      return {
        date,
        dateLabel: formatDayLabel(date),
        isToday: dateOnly.getTime() === todayOnly.getTime(),
        isTomorrow: dateOnly.getTime() === new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()).getTime(),
        isYesterday: dateOnly.getTime() === new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).getTime(),
        bookings: dayBookings.sort((a, b) => a.time.localeCompare(b.time)),
      };
    });
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ShimmerTimelineItem() {
  return (
    <div className="relative mb-5 md:mb-6 overflow-hidden">
      <div className="absolute -left-10 md:-left-12 top-1 w-3.5 h-3.5 rounded-full bg-[var(--md-sys-color-surface-variant)] border-2 border-[var(--md-sys-color-surface)]" />
      <div className="absolute -left-14 md:-left-16 w-12 text-right">
        <div className="h-3 bg-[var(--md-sys-color-surface-variant)] rounded w-10 ml-auto" />
      </div>
      <div className="md3-card-elevated p-4 relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-[var(--md-sys-color-surface)]/70 to-transparent" />
        <div className="flex justify-between items-start mb-3">
          <div className="space-y-2">
            <div className="h-4 bg-[var(--md-sys-color-surface-variant)] rounded-lg w-32" />
            <div className="h-3 bg-[var(--md-sys-color-surface-variant)] rounded-lg w-24" />
          </div>
          <div className="h-6 bg-[var(--md-sys-color-surface-variant)] rounded-full w-20" />
        </div>
        <div className="h-4 bg-[var(--md-sys-color-surface-variant)] rounded-lg w-40 mb-3" />
        <div className="flex justify-between items-center">
          <div className="h-3 bg-[var(--md-sys-color-surface-variant)] rounded-lg w-48" />
          <div className="h-5 bg-[var(--md-sys-color-surface-variant)] rounded-lg w-20" />
        </div>
      </div>
    </div>
  );
}

function DateHeader({ group, index }: { group: GroupedBookings; index: number }) {
  return (
    <div
      className={`
        sticky top-0 z-10 mb-4 md:mb-5 -ml-12 md:-ml-16 pl-12 md:pl-16
        transition-all duration-300
      `}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold
        ${group.isToday
          ? "bg-[#8b5cf6] text-white shadow-md shadow-[#8b5cf6]/20"
          : group.isTomorrow
            ? "bg-[#ede9fe] text-[#8b5cf6] border border-[#8b5cf6]/20"
            : "bg-white text-[#64748b] border border-[#e2e8f0]"
        }
      `}>
        <i className={`fas ${group.isToday ? "fa-calendar-day" : group.isTomorrow ? "fa-calendar-plus" : "fa-calendar"} text-[10px]`} />
        {group.dateLabel}
        <span className="text-[10px] opacity-70 font-medium">
          {new Date(group.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>
    </div>
  );
}

function TimelineItem({
  booking,
  onViewBooking,
  index,
  isLast,
}: {
  booking: Booking;
  onViewBooking: (booking: Booking) => void;
  index: number;
  isLast: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const statusConfig = getStatusConfig(booking?.status || "pending");
  const paymentConfig = getPaymentConfig(booking.paymentStatus);
  const safeFirstLetter = getSafeFirstLetter(booking);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 80);
    return () => clearTimeout(timer);
  }, [index]);

  const handleWhatsApp = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://wa.me/${(booking?.phone || "").replace(/\D/g, "")}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [booking?.phone]);

  return (
    <div
      className={`
        relative mb-4 md:mb-5 transition-all duration-300
        ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"}
      `}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {/* Timeline dot */}
      <div className="absolute -left-10 md:-left-12 top-3 md:top-4 flex flex-col items-center">
        <div className={`
          w-3.5 h-3.5 md:w-4 md:h-4 rounded-full border-[2.5px] border-white shadow-sm
          transition-all duration-300 z-10
          ${statusConfig.dot}
          ${isHovered ? "scale-125 ring-4 " + statusConfig.ring : "scale-100 ring-0"}
        `} />
        {/* Connector line to next item */}
        {!isLast && (
          <div className="w-0.5 flex-1 min-h-[20px] bg-gradient-to-b from-[#e2e8f0] to-[#e2e8f0]/50 mt-1" />
        )}
      </div>

      {/* Time label */}
      <div className="absolute -left-14 md:-left-16 w-12 md:w-14 text-right top-3 md:top-4">
        <span className="text-[10px] md:text-xs font-bold text-[#94a3b8]">
          {booking?.time || "N/A"}
        </span>
      </div>

      {/* Card */}
      <div
        className={`
          bg-white rounded-xl md:rounded-2xl border border-[#e2e8f0] p-3.5 md:p-4 cursor-pointer
          transition-all duration-300 ease-out
          ${isHovered
            ? "border-[#8b5cf6]/30 shadow-lg shadow-[#8b5cf6]/5 -translate-y-0.5"
            : "shadow-sm hover:shadow-md"
          }
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onViewBooking(booking)}
      >
        {/* Top row: Client + Status + Actions */}
        <div className="flex justify-between items-start mb-2.5 md:mb-3">
          <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
            <div className={`
              w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0
              transition-transform duration-300
              ${booking.verified
                ? "bg-gradient-to-br from-[#ede9fe] to-[#e0e7ff] text-[#8b5cf6]"
                : "bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0] text-[#64748b]"
              }
              ${isHovered ? "scale-110" : "scale-100"}
            `}>
              {safeFirstLetter}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm md:text-base truncate flex items-center gap-1.5">
                {booking?.client || "Unknown Client"}
                {booking.verified && (
                  <i className="fas fa-badge-check text-[#10b981] text-xs shrink-0" title="Verified" />
                )}
              </div>
              <div className="text-[11px] md:text-xs text-[#64748b] flex items-center gap-1">
                <i className="fab fa-whatsapp text-[#25D366] text-[10px]" />
                <span className="truncate">{booking?.phone || "N/A"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Payment badge (compact) */}
            {booking.paymentStatus && booking.paymentStatus !== "paid" && (
              <span className={`
                hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold
                ${paymentConfig.bg} ${paymentConfig.text}
              `}>
                <i className={`fas ${paymentConfig.icon} text-[8px]`} />
              </span>
            )}

            {/* Status badge */}
            <span className={`
              inline-flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full 
              text-[9px] md:text-[10px] font-bold uppercase tracking-wide border
              ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}
            `}>
              <span className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${statusConfig.dot}`} />
              {booking?.status || "N/A"}
            </span>
          </div>
        </div>

        {/* Service */}
        <div className="text-sm text-[#64748b] mb-2.5 md:mb-3 flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center shrink-0">
            <i className="fas fa-cut text-[#8b5cf6] text-[9px]" />
          </div>
          <span className="font-medium text-[#475569]">{booking?.service || "N/A"}</span>
        </div>

        {/* Bottom row: Meta + Price + Actions */}
        <div className="flex items-center justify-between pt-2.5 md:pt-3 border-t border-[#f1f5f9]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] md:text-xs text-[#94a3b8]">
            <span className="flex items-center gap-1">
              <i className="fas fa-clock text-[9px]" />
              {booking?.duration || "N/A"}
            </span>
            <span className="flex items-center gap-1 hidden sm:flex">
              <i className="fas fa-map-marker-alt text-[9px]" />
              {booking?.location || "N/A"}
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <span className="font-extrabold text-sm md:text-base text-[#8b5cf6]">
              KES {(booking?.price || 0).toLocaleString()}
            </span>

            {/* WhatsApp quick action */}
            <button
              onClick={handleWhatsApp}
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 active:scale-90
                text-[#25D366] hover:bg-[#25D366] hover:text-white
                ${isHovered ? "opacity-100" : "opacity-0 md:opacity-0"}
                ${isHovered ? "bg-[rgba(37,211,102,0.1)]" : "bg-transparent"}
              `}
              aria-label="WhatsApp"
              title="Message on WhatsApp"
            >
              <i className="fab fa-whatsapp text-sm" />
            </button>

            {/* View button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewBooking(booking);
              }}
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 active:scale-90
                ${isHovered
                  ? "bg-[#8b5cf6] text-white shadow-sm"
                  : "bg-[#f1f5f9] text-[#64748b]"
                }
              `}
              aria-label="View"
            >
              <i className="fas fa-eye text-xs" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-20 text-[#64748b] animate-fadeIn">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0] flex items-center justify-center mb-4 shadow-inner">
        <i className="fas fa-stream text-3xl md:text-4xl text-[#cbd5e1]" />
      </div>
      <p className="text-base md:text-lg font-bold text-[#475569] mb-1">No bookings found</p>
      <p className="text-xs md:text-sm text-[#94a3b8] max-w-xs text-center">
        Your timeline is empty. Bookings will appear here once scheduled.
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BookingTimeline({
  bookings,
  onViewBooking,
  isLoading = false,
}: BookingTimelineProps) {
  const groupedBookings = useMemo(() => groupBookingsByDate(bookings), [bookings]);

  if (isLoading) {
    return (
      <div className="relative pl-12 md:pl-16 animate-fadeIn">
        <div className="absolute left-5 md:left-7 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#8b5cf6] to-[#ede9fe]" />
        {Array.from({ length: 4 }).map((_, i) => (
          <ShimmerTimelineItem key={i} />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="relative pl-12 md:pl-16">
        <div className="absolute left-5 md:left-7 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#8b5cf6] to-[#ede9fe]" />
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="relative pl-12 md:pl-16 animate-fadeIn">
      {/* Main timeline line */}
      <div className="absolute left-5 md:left-7 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#8b5cf6] via-[#8b5cf6]/30 to-[#ede9fe]" />

      {groupedBookings.map((group, groupIndex) => (
        <div key={group.date} className="mb-6 md:mb-8">
          <DateHeader group={group} index={groupIndex} />

          {group.bookings.filter(b => b !== null && b !== undefined).map((booking, bookingIndex) => (
            <TimelineItem
              key={booking.id}
              booking={booking}
              onViewBooking={onViewBooking}
              index={groupIndex * 10 + bookingIndex}
              isLast={bookingIndex === group.bookings.length - 1 && groupIndex === groupedBookings.length - 1}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

<style jsx global>{`
  @media (max-width: 768px) {
    /* MD3 Timeline Container */
    .relative.pl-12.md\:pl-16 { padding-left: 48px !important; }
    
    /* MD3 Timeline Line */
    .absolute.left-5.md\:left-7.top-0.bottom-0 { left: 20px !important; width: 2px !important; background: linear-gradient(to bottom, var(--md-sys-color-primary, #8b5cf6), var(--md-sys-color-primary-container, #f3e8ff)) !important; }
    
    /* MD3 Date Headers */
    .mb-6.md\:mb-8 { margin-bottom: 20px !important; }
    
    /* MD3 Timeline Cards */
    .bg-white.rounded-xl.border { border-radius: 16px !important; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important; background: var(--md-sys-color-surface, white) !important; border: none !important; margin-bottom: 12px !important; padding: 16px !important; }
    
    /* MD3 Status Badges */
    .rounded-full.px-3.py-1.text-xs { border-radius: 16px !important; font-size: 11px !important; font-weight: 500 !important; letter-spacing: 0.3px !important; text-transform: uppercase !important; }
    
    /* MD3 Payment Badges */
    .rounded-lg.px-2.py-1.text-xs { border-radius: 12px !important; font-size: 11px !important; font-weight: 500 !important; }
    
    /* MD3 Action Buttons */
    button.w-8.h-8, button.w-9.h-9 { width: 36px !important; height: 36px !important; border-radius: 18px !important; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important; }
    button.w-8.h-8:active, button.w-9.h-9:active { transform: scale(0.95) !important; opacity: 0.8 !important; }
    
    /* MD3 Typography */
    .font-semibold { font-weight: 500 !important; }
    .font-bold { font-weight: 600 !important; }
    
    /* MD3 Time Display */
    .text-sm.text-gray-500 { color: var(--md-sys-color-on-surface-variant, #64748b) !important; font-size: 13px !important; }
    
    /* MD3 Customer Name */
    .font-medium.text-gray-900 { color: var(--md-sys-color-on-surface, #1e293b) !important; font-weight: 500 !important; }
    
    /* MD3 Service Name */
    .text-sm.text-gray-600 { color: var(--md-sys-color-on-surface-variant, #64748b) !important; font-size: 13px !important; }
    
    /* MD3 Price Display */
    .font-bold.text-lg { font-weight: 600 !important; font-size: 18px !important; color: var(--md-sys-color-primary, #8b5cf6) !important; }
  }
`}</style>