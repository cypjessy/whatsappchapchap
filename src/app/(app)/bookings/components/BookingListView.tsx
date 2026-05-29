"use client";

import { useState, useEffect, useCallback } from "react";
import { Booking } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingListViewProps {
  bookings: Booking[];
  onViewBooking: (booking: Booking) => void;
  isLoading?: boolean;
  onUpdateStatus?: (bookingId: string, status: Booking["status"]) => void;
  onDelete?: (bookingId: string) => void;
}

type SortField = "client" | "date" | "price" | "status";
type SortDirection = "asc" | "desc";

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  confirmed: {
    bg: "bg-[#D1FAE5]",
    text: "text-[#059669]",
    border: "border-[#059669]/20",
    dot: "bg-[#059669]",
  },
  pending: {
    bg: "bg-[#FEF3C7]",
    text: "text-[#D97706]",
    border: "border-[#D97706]/20",
    dot: "bg-[#D97706]",
  },
  completed: {
    bg: "bg-[#EFF6FF]",
    text: "text-[#2563EB]",
    border: "border-[#2563EB]/20",
    dot: "bg-[#2563EB]",
  },
  cancelled: {
    bg: "bg-[#FEE2E2]",
    text: "text-[#DC2626]",
    border: "border-[#DC2626]/20",
    dot: "bg-[#DC2626]",
  },
};

const PAYMENT_CONFIG: Record<string, { bg: string; text: string; icon: string; dot: string }> = {
  paid: { bg: "bg-[#D1FAE5]", text: "text-[#059669]", icon: "fa-check-circle", dot: "bg-[#059669]" },
  partial: { bg: "bg-[#FEF3C7]", text: "text-[#D97706]", icon: "fa-adjust", dot: "bg-[#D97706]" },
  unpaid: { bg: "bg-[#FEE2E2]", text: "text-[#DC2626]", icon: "fa-times-circle", dot: "bg-[#DC2626]" },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatShortDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || {
    bg: "bg-surface-variant",
    text: "text-on-surface-variant",
    border: "border-outline-variant",
    dot: "bg-[#94A3B8]",
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

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ShimmerRow() {
  return (
    <div className="relative overflow-hidden px-4 md:px-6 py-4 border-b border-[var(--md-sys-color-outline-variant)]">
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-[var(--md-sys-color-surface)]/70 to-transparent" />
      <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-surface-variant)] shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-[var(--md-sys-color-surface-variant)] rounded-lg w-32" />
            <div className="h-3 bg-[var(--md-sys-color-surface-variant)] rounded-lg w-24" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-[var(--md-sys-color-surface-variant)] rounded-lg w-28" />
          <div className="h-3 bg-[var(--md-sys-color-surface-variant)] rounded-lg w-16" />
        </div>
        <div className="h-4 bg-[var(--md-sys-color-surface-variant)] rounded-lg w-20" />
        <div className="h-6 bg-[var(--md-sys-color-surface-variant)] rounded-full w-20" />
        <div className="h-5 bg-[var(--md-sys-color-surface-variant)] rounded-lg w-24" />
        <div className="w-8 h-8 bg-[var(--md-sys-color-surface-variant)] rounded-lg" />
      </div>
      <div className="md:hidden space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-variant shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-surface-variant rounded-lg w-3/4" />
            <div className="h-3 bg-surface-variant rounded-lg w-1/2" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-6 bg-surface-variant rounded-full w-20" />
          <div className="h-6 bg-surface-variant rounded-full w-16" />
        </div>
      </div>
    </div>
  );
}

function SortHeader({
  label,
  field,
  currentField,
  direction,
  onSort,
  className = "",
}: {
  label: string;
  field: SortField;
  currentField: SortField | null;
  direction: SortDirection;
  onSort: (field: SortField) => void;
  className?: string;
}) {
  const isActive = currentField === field;

  return (
    <button
      onClick={() => onSort(field)}
      className={`
        flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide
        transition-colors duration-200 hover:text-[#8B5CF6]
        ${isActive ? "text-[#8B5CF6]" : "text-on-surface-variant"}
        ${className}
      `}
    >
      {label}
      <span className="flex flex-col -space-y-0.5">
        <i className={`
          fas fa-chevron-up text-[7px] transition-colors
          ${isActive && direction === "asc" ? "text-[#8B5CF6]" : "text-[#CBD5E1]"}
        `} />
        <i className={`
          fas fa-chevron-down text-[7px] transition-colors
          ${isActive && direction === "desc" ? "text-[#8B5CF6]" : "text-[#CBD5E1]"}
        `} />
      </span>
    </button>
  );
}

function DesktopRow({
  booking,
  index,
  onViewBooking,
  onUpdateStatus,
  onDelete,
}: {
  booking: Booking;
  index: number;
  onViewBooking: (booking: Booking) => void;
  onUpdateStatus?: (bookingId: string, status: Booking["status"]) => void;
  onDelete?: (bookingId: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const statusConfig = getStatusConfig(booking.status);
  const paymentConfig = getPaymentConfig(booking.paymentStatus);
  const safeFirstLetter = getSafeFirstLetter(booking);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 50);
    return () => clearTimeout(timer);
  }, [index]);

  const handleWhatsApp = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://wa.me/${(booking?.phone || "").replace(/\D/g, "")}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [booking?.phone]);

  const paymentPercent = booking?.paymentProof?.amount && (booking?.price || 0) > 0
    ? Math.min((booking.paymentProof.amount / (booking?.price || 1)) * 100, 100)
    : 0;

  return (
    <div
      className={`
        hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 
        border-b border-[#f1f5f9] cursor-pointer relative group
        transition-all duration-200
        ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"}
        ${isHovered ? "bg-surface" : "bg-surface"}
      `}
      style={{ transitionDelay: `${index * 50}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewBooking(booking)}
    >
      {/* Left accent bar */}
      <div className={`
        absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full transition-all duration-300
        ${isHovered ? "opacity-100" : "opacity-0"}
      `} style={{ backgroundColor: statusConfig.dot.replace("bg-[", "").replace("]", "") }} />

      {/* Client & Service - MD3 avatar */}
      <div className="flex items-center gap-3 min-w-0">
        <div className={`
          w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base shrink-0
          transition-transform duration-200
          ${booking.verified
            ? "bg-[#F3E8FF] text-[#8B5CF6]"
            : "bg-surface-variant text-on-surface-variant"
          }
          ${isHovered ? "scale-105" : "scale-100"}
        `}>
          {safeFirstLetter}
        </div>
        <div className="min-w-0">
          <div className="font-medium text-sm truncate flex items-center gap-1.5">
            {booking?.client || "Unknown"}
            {booking?.verified && (
              <i className="fas fa-badge-check text-[#10B981] text-xs shrink-0" title="Verified" />
            )}
          </div>
          <div className="text-xs text-on-surface-variant truncate">{booking?.service || "N/A"}</div>
        </div>
      </div>

      {/* Date & Time - MD3 styling */}
      <div className="text-sm">
        <div className="font-medium text-on-surface">{formatDate(booking?.date || "")}</div>
        <div className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
          <i className="fas fa-clock text-[10px] text-[#8B5CF6]" />
          {booking?.time || "N/A"}
        </div>
      </div>

      {/* Location - MD3 styling */}
      <div className="text-sm text-on-surface-variant flex items-center gap-1.5 min-w-0">
        <i className="fas fa-map-marker-alt text-[#8B5CF6] text-xs shrink-0" />
        <span className="truncate">{booking?.location || "N/A"}</span>
      </div>

      {/* Status - MD3 chip styling */}
      <div>
        <span className={`
          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full 
          text-[10px] font-semibold uppercase tracking-wide border
          ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}
        `}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
          {booking.status}
        </span>
      </div>

      {/* Amount - MD3 typography */}
      <div className="flex flex-col justify-center">
        <span className="font-bold text-sm text-[#8B5CF6]">
          KES {booking.price.toLocaleString()}
        </span>
        {booking.paymentStatus && booking.paymentStatus !== "paid" && (
          <div className="flex items-center gap-1 mt-1">
            <div className="w-12 h-1 bg-surface-variant rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${paymentConfig.dot || "bg-[#8B5CF6]"}`}
                style={{ width: `${paymentPercent}%` }}
              />
            </div>
            <span className={`text-[9px] font-semibold ${paymentConfig.text}`}>
              {Math.round(paymentPercent)}%
            </span>
          </div>
        )}
      </div>

      {/* Actions - MD3 styling */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleWhatsApp}
          className={`
            w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200
            text-[#25D366] hover:bg-[#25D366] hover:text-white active:scale-90
            ${isHovered ? "opacity-100" : "opacity-0"}
          `}
          aria-label="WhatsApp"
          title="Message on WhatsApp"
        >
          <i className="fab fa-whatsapp text-sm" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewBooking(booking);
          }}
          className={`
            w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200
            ${isHovered
              ? "bg-[#8B5CF6] text-white shadow-md"
              : "bg-surface-variant text-on-surface-variant"
            }
            active:scale-90
          `}
          aria-label="View"
        >
          <i className="fas fa-eye text-xs" />
        </button>

        {/* Quick status actions */}
        {onUpdateStatus && booking.status !== "completed" && booking.status !== "cancelled" && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateStatus(booking.id, "completed");
              }}
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 active:scale-90
                ${isHovered
                  ? "bg-[#10B981] text-white shadow-md"
                  : "bg-surface-variant text-[#10B981] opacity-50"
                }
              `}
              aria-label="Complete"
              title="Mark as completed"
            >
              <i className="fas fa-check-double text-xs" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateStatus(booking.id, "cancelled");
              }}
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 active:scale-90
                ${isHovered
                  ? "bg-[#EF4444] text-white shadow-md"
                  : "bg-surface-variant text-[#EF4444] opacity-50"
                }
              `}
              aria-label="Cancel"
              title="Cancel booking"
            >
              <i className="fas fa-times text-xs" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function MobileRow({
  booking,
  index,
  onViewBooking,
  onUpdateStatus,
  onDelete,
}: {
  booking: Booking;
  index: number;
  onViewBooking: (booking: Booking) => void;
  onUpdateStatus?: (bookingId: string, status: Booking["status"]) => void;
  onDelete?: (bookingId: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const statusConfig = getStatusConfig(booking.status);
  const paymentConfig = getPaymentConfig(booking.paymentStatus);
  const safeFirstLetter = getSafeFirstLetter(booking);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 60);
    return () => clearTimeout(timer);
  }, [index]);

  const handleWhatsApp = useCallback(() => {
    const url = `https://wa.me/${booking.phone.replace(/\D/g, "")}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [booking.phone]);

  return (
    <div
      className={`
        md:hidden px-4 py-3.5 border-b border-[#F1F5F9] cursor-pointer
        transition-all duration-200 hover:bg-surface-container-lowest
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}
      `}
      style={{ transitionDelay: `${index * 60}ms` }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Main row - MD3 styling */}
      <div className="flex items-center gap-3">
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0
          ${booking.verified
            ? "bg-[#F3E8FF] text-[#8B5CF6]"
            : "bg-surface-variant text-on-surface-variant"
          }
        `}>
          {safeFirstLetter}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="font-medium text-sm truncate">{booking.client}</div>
            <span className={`
              shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full 
              text-[9px] font-semibold uppercase border
              ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}
            `}>
              <span className={`w-1 h-1 rounded-full ${statusConfig.dot}`} />
              {booking.status}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-on-surface-variant">
            <span className="truncate">{booking.service || 'N/A'}</span>
            <span className="text-[#E2E8F0]">•</span>
            <span>{formatShortDate(booking.date)}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-bold text-sm text-[#8B5CF6]">
            KES {booking.price.toLocaleString()}
          </div>
          <i className={`
            fas fa-chevron-down text-[10px] text-outline transition-transform duration-200
            ${isExpanded ? "rotate-180" : "rotate-0"}
          `} />
        </div>
      </div>

      {/* Expanded details - MD3 styling */}
      <div className={`
        overflow-hidden transition-all duration-200 ease-out
        ${isExpanded ? "max-h-40 opacity-100 mt-3 pt-3 border-t border-outline-variant" : "max-h-0 opacity-0 mt-0 pt-0"}
      `}>
        <div className="space-y-2 text-xs text-on-surface-variant">
          <div className="flex items-center gap-2">
            <i className="fas fa-clock text-[#8B5CF6] w-4 text-center" />
            <span>{booking.time} • {booking.duration}</span>
          </div>
          <div className="flex items-center gap-2">
            <i className="fas fa-map-marker-alt text-[#8B5CF6] w-4 text-center" />
            <span>{booking.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <i className="fas fa-phone text-[#8B5CF6] w-4 text-center" />
            <span>{booking.phone}</span>
          </div>
          {booking.paymentStatus && (
            <div className={`
              flex items-center gap-2 px-2 py-1.5 rounded-lg mt-1
              ${paymentConfig.bg} ${paymentConfig.text}
            `}>
              <i className={`fas ${paymentConfig.icon}`} />
              <span className="font-semibold">Payment: {booking.paymentStatus}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleWhatsApp();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#E8F5E9] text-[#25D366] text-xs font-semibold hover:bg-[#25D366] hover:text-white transition-all duration-200 active:scale-95"
          >
            <i className="fab fa-whatsapp" />
            WhatsApp
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewBooking(booking);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#F3E8FF] text-[#8B5CF6] text-xs font-semibold hover:bg-[#8B5CF6] hover:text-white transition-all duration-200 active:scale-95"
          >
            <i className="fas fa-eye" />
            View
          </button>
        </div>

        {/* Quick status actions */}
        {onUpdateStatus && booking.status !== "completed" && booking.status !== "cancelled" && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateStatus(booking.id, "completed");
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#D1FAE5] text-[#059669] text-xs font-semibold hover:bg-[#059669] hover:text-white transition-all duration-200 active:scale-95"
            >
              <i className="fas fa-check-double" />
              Complete
            </button>
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm("Delete this booking?")) onDelete(booking.id);
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#FEE2E2] text-[#DC2626] text-xs font-semibold hover:bg-[#DC2626] hover:text-white transition-all duration-200 active:scale-95"
              >
                <i className="fas fa-trash-alt" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-20 text-on-surface-variant animate-fadeIn">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-surface-variant flex items-center justify-center mb-4">
        <i className="fas fa-list text-3xl md:text-4xl text-[#CBD5E1]" />
      </div>
      <p className="text-base md:text-lg font-bold text-on-surface-variant mb-1">No bookings found</p>
      <p className="text-xs md:text-sm text-outline max-w-xs text-center">
        Try adjusting your filters or search criteria to find what you're looking for.
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BookingListView({
  bookings,
  onViewBooking,
  isLoading = false,
  onUpdateStatus,
  onDelete,
}: BookingListViewProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        return field;
      }
      setSortDirection("asc");
      return field;
    });
  }, []);

  if (isLoading) {
    return (
      <div className="bg-surface rounded-xl md:rounded-2xl border-2 border-outline overflow-hidden shadow-md">
        <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-surface border-b border-outline-variant">
          {["Client & Service", "Date & Time", "Location", "Status", "Amount", ""].map((label) => (
            <div key={label} className="h-3 bg-surface-variant rounded-lg w-20" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <ShimmerRow key={i} />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-surface rounded-xl md:rounded-2xl border-2 border-outline overflow-hidden shadow-md">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl md:rounded-2xl border-2 border-outline overflow-hidden shadow-md">
      {/* Desktop Header */}
      <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-surface border-b border-outline-variant sticky top-0 z-10">
        <SortHeader
          label="Client & Service"
          field="client"
          currentField={sortField}
          direction={sortDirection}
          onSort={handleSort}
        />
        <SortHeader
          label="Date & Time"
          field="date"
          currentField={sortField}
          direction={sortDirection}
          onSort={handleSort}
        />
        <SortHeader
          label="Location"
          field="client"
          currentField={sortField}
          direction={sortDirection}
          onSort={handleSort}
          className="pointer-events-none"
        />
        <SortHeader
          label="Status"
          field="status"
          currentField={sortField}
          direction={sortDirection}
          onSort={handleSort}
        />
        <SortHeader
          label="Amount"
          field="price"
          currentField={sortField}
          direction={sortDirection}
          onSort={handleSort}
        />
        <span />
      </div>

      {/* Rows */}
      {bookings.map((booking, index) => (
        <div key={booking.id}>            <DesktopRow
              booking={booking}
              index={index}
              onViewBooking={onViewBooking}
              onUpdateStatus={onUpdateStatus}
              onDelete={onDelete}
            />
          <MobileRow
            booking={booking}
            index={index}
            onViewBooking={onViewBooking}
            onUpdateStatus={onUpdateStatus}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  );
}

<style jsx global>{`
  @media (max-width: 768px) {
    /* MD3 List Container */
    .divide-y.divide-gray-100 { border: none !important; }
    
    /* MD3 Sort Header */
    .hidden.md\:grid.grid-cols-\[2fr_1\.5fr_1fr_1fr_1fr_auto\] { display: none !important; }
    
    /* MD3 Mobile Row Cards */
    .md\:hidden.space-y-3 { background: var(--md-sys-color-surface, white) !important; border-radius: 16px !important; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important; padding: 16px !important; margin-bottom: 12px !important; border: none !important; }
    
    /* MD3 Status Badges */
    .rounded-full.px-2.py-1.text-xs { border-radius: 16px !important; font-size: 11px !important; font-weight: 500 !important; letter-spacing: 0.3px !important; text-transform: uppercase !important; }
    
    /* MD3 Payment Badges */
    .rounded-lg.px-2.py-1.text-xs.inline-flex.items-center.gap-1 { border-radius: 12px !important; font-size: 11px !important; font-weight: 500 !important; }
    
    /* MD3 Action Buttons */
    button.w-8.h-8, button.w-9.h-9 { width: 40px !important; height: 40px !important; border-radius: 20px !important; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important; }
    button.w-8.h-8:active, button.w-9.h-9:active { transform: scale(0.95) !important; opacity: 0.8 !important; }
    
    /* MD3 Typography */
    .font-medium { font-weight: 500 !important; }
    .font-semibold { font-weight: 500 !important; }
    .font-bold { font-weight: 600 !important; }
    
    /* MD3 Customer Name */
    .text-sm.font-medium.text-on-surface { color: var(--md-sys-color-on-surface, #1e293b) !important; font-size: 15px !important; }
    
    /* MD3 Phone Number */
    .text-xs.text-on-surface-variant { color: var(--md-sys-color-on-surface-variant, #64748b) !important; font-size: 13px !important; }
    
    /* MD3 Date Display */
    .text-sm.text-on-surface-variant { color: var(--md-sys-color-on-surface-variant, #64748b) !important; font-size: 13px !important; }
    
    /* MD3 Time Display */
    .text-xs.text-on-surface-variant { color: var(--md-sys-color-on-surface-variant, #64748b) !important; font-size: 12px !important; }
    
    /* MD3 Price Display */
    .font-bold.text-on-surface { color: var(--md-sys-color-primary, #8b5cf6) !important; font-weight: 600 !important; font-size: 16px !important; }
    
    /* MD3 Avatar/Icon Circle */
    .w-9.h-9.rounded-xl { border-radius: 20px !important; background: var(--md-sys-color-primary-container, #f3e8ff) !important; }
    .w-9.h-9.rounded-xl i { color: var(--md-sys-color-primary, #8b5cf6) !important; font-size: 16px !important; }
  }
`}</style>