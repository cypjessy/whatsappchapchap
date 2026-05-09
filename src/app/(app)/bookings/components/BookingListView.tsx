"use client";

import { useState, useEffect, useCallback } from "react";
import { Booking } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingListViewProps {
  bookings: Booking[];
  onViewBooking: (booking: Booking) => void;
  isLoading?: boolean;
}

type SortField = "client" | "date" | "price" | "status";
type SortDirection = "asc" | "desc";

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  confirmed: {
    bg: "bg-[rgba(37,211,102,0.12)]",
    text: "text-[#10b981]",
    border: "border-[#10b981]/20",
    dot: "bg-[#10b981]",
  },
  pending: {
    bg: "bg-[rgba(245,158,11,0.12)]",
    text: "text-[#f59e0b]",
    border: "border-[#f59e0b]/20",
    dot: "bg-[#f59e0b]",
  },
  completed: {
    bg: "bg-[rgba(59,130,246,0.12)]",
    text: "text-[#3b82f6]",
    border: "border-[#3b82f6]/20",
    dot: "bg-[#3b82f6]",
  },
  cancelled: {
    bg: "bg-[rgba(239,68,68,0.12)]",
    text: "text-[#ef4444]",
    border: "border-[#ef4444]/20",
    dot: "bg-[#ef4444]",
  },
};

const PAYMENT_CONFIG: Record<string, { bg: string; text: string; icon: string; dot: string }> = {
  paid: { bg: "bg-[#10b981]/10", text: "text-[#10b981]", icon: "fa-check-circle", dot: "bg-[#10b981]" },
  partial: { bg: "bg-[#f59e0b]/10", text: "text-[#f59e0b]", icon: "fa-adjust", dot: "bg-[#f59e0b]" },
  unpaid: { bg: "bg-[#ef4444]/10", text: "text-[#ef4444]", icon: "fa-times-circle", dot: "bg-[#ef4444]" },
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
    bg: "bg-[#f1f5f9]",
    text: "text-[#64748b]",
    border: "border-[#e2e8f0]",
    dot: "bg-[#94a3b8]",
  };
}

function getPaymentConfig(status?: string) {
  return PAYMENT_CONFIG[status || "unpaid"] || PAYMENT_CONFIG.unpaid;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ShimmerRow() {
  return (
    <div className="relative overflow-hidden px-4 md:px-6 py-4 border-b border-[#f1f5f9]">
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#f1f5f9] shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-[#f1f5f9] rounded-lg w-32" />
            <div className="h-3 bg-[#f1f5f9] rounded-lg w-24" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-[#f1f5f9] rounded-lg w-28" />
          <div className="h-3 bg-[#f1f5f9] rounded-lg w-16" />
        </div>
        <div className="h-4 bg-[#f1f5f9] rounded-lg w-20" />
        <div className="h-6 bg-[#f1f5f9] rounded-full w-20" />
        <div className="h-5 bg-[#f1f5f9] rounded-lg w-24" />
        <div className="w-8 h-8 bg-[#f1f5f9] rounded-lg" />
      </div>
      <div className="md:hidden space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#f1f5f9] shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-[#f1f5f9] rounded-lg w-3/4" />
            <div className="h-3 bg-[#f1f5f9] rounded-lg w-1/2" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-6 bg-[#f1f5f9] rounded-full w-20" />
          <div className="h-6 bg-[#f1f5f9] rounded-full w-16" />
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
        flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider
        transition-colors duration-200 hover:text-[#8b5cf6]
        ${isActive ? "text-[#8b5cf6]" : "text-[#64748b]"}
        ${className}
      `}
    >
      {label}
      <span className="flex flex-col -space-y-0.5">
        <i className={`
          fas fa-chevron-up text-[7px] transition-colors
          ${isActive && direction === "asc" ? "text-[#8b5cf6]" : "text-[#cbd5e1]"}
        `} />
        <i className={`
          fas fa-chevron-down text-[7px] transition-colors
          ${isActive && direction === "desc" ? "text-[#8b5cf6]" : "text-[#cbd5e1]"}
        `} />
      </span>
    </button>
  );
}

function DesktopRow({
  booking,
  index,
  onViewBooking,
}: {
  booking: Booking;
  index: number;
  onViewBooking: (booking: Booking) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const statusConfig = getStatusConfig(booking.status);
  const paymentConfig = getPaymentConfig(booking.paymentStatus);

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
        ${isHovered ? "bg-[#f8fafc]" : "bg-white"}
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

      {/* Client & Service */}
      <div className="flex items-center gap-3 min-w-0">
        <div className={`
          w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0
          transition-transform duration-200
          ${booking.verified
            ? "bg-gradient-to-br from-[#ede9fe] to-[#e0e7ff] text-[#8b5cf6]"
            : "bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0] text-[#64748b]"
          }
          ${isHovered ? "scale-110" : "scale-100"}
        `}>
          {booking.clientInitials}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-sm truncate flex items-center gap-1.5">
            {booking?.client || "Unknown"}
            {booking?.verified && (
              <i className="fas fa-badge-check text-[#10b981] text-xs shrink-0" title="Verified" />
            )}
          </div>
          <div className="text-xs text-[#64748b] truncate">{booking?.service || "N/A"}</div>
        </div>
      </div>

      {/* Date & Time */}
      <div className="text-sm">
        <div className="font-medium text-[#1e293b]">{formatDate(booking?.date || "")}</div>
        <div className="text-xs text-[#64748b] flex items-center gap-1 mt-0.5">
          <i className="fas fa-clock text-[10px] text-[#8b5cf6]" />
          {booking?.time || "N/A"}
        </div>
      </div>

      {/* Location */}
      <div className="text-sm text-[#64748b] flex items-center gap-1.5 min-w-0">
        <i className="fas fa-map-marker-alt text-[#8b5cf6] text-xs shrink-0" />
        <span className="truncate">{booking?.location || "N/A"}</span>
      </div>

      {/* Status */}
      <div>
        <span className={`
          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full 
          text-[10px] font-bold uppercase tracking-wide border
          ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}
        `}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
          {booking.status}
        </span>
      </div>

      {/* Amount */}
      <div className="flex flex-col justify-center">
        <span className="font-extrabold text-sm text-[#8b5cf6]">
          KES {booking.price.toLocaleString()}
        </span>
        {booking.paymentStatus && booking.paymentStatus !== "paid" && (
          <div className="flex items-center gap-1 mt-1">
            <div className="w-12 h-1 bg-[#e2e8f0] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${paymentConfig.dot || "bg-[#8b5cf6]"}`}
                style={{ width: `${paymentPercent}%` }}
              />
            </div>
            <span className={`text-[9px] font-bold ${paymentConfig.text}`}>
              {Math.round(paymentPercent)}%
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
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
              ? "bg-[#8b5cf6] text-white shadow-sm"
              : "bg-[#f1f5f9] text-[#64748b]"
            }
            active:scale-90
          `}
          aria-label="View"
        >
          <i className="fas fa-eye text-xs" />
        </button>
      </div>
    </div>
  );
}

function MobileRow({
  booking,
  index,
  onViewBooking,
}: {
  booking: Booking;
  index: number;
  onViewBooking: (booking: Booking) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const statusConfig = getStatusConfig(booking.status);
  const paymentConfig = getPaymentConfig(booking.paymentStatus);

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
        md:hidden px-4 py-3.5 border-b border-[#f1f5f9] cursor-pointer
        transition-all duration-200
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}
        ${isExpanded ? "bg-[#f8fafc]" : "bg-white hover:bg-[#f8fafc]"}
      `}
      style={{ transitionDelay: `${index * 60}ms` }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Main row */}
      <div className="flex items-center gap-3">
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0
          ${booking.verified
            ? "bg-gradient-to-br from-[#ede9fe] to-[#e0e7ff] text-[#8b5cf6]"
            : "bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0] text-[#64748b]"
          }
        `}>
          {booking.clientInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="font-bold text-sm truncate">{booking.client}</div>
            <span className={`
              shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full 
              text-[9px] font-bold uppercase border
              ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}
            `}>
              <span className={`w-1 h-1 rounded-full ${statusConfig.dot}`} />
              {booking.status}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#64748b]">
            <span className="truncate">{booking.service}</span>
            <span className="text-[#e2e8f0]">•</span>
            <span>{formatShortDate(booking.date)}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-extrabold text-sm text-[#8b5cf6]">
            KES {booking.price.toLocaleString()}
          </div>
          <i className={`
            fas fa-chevron-down text-[10px] text-[#94a3b8] transition-transform duration-200
            ${isExpanded ? "rotate-180" : "rotate-0"}
          `} />
        </div>
      </div>

      {/* Expanded details */}
      <div className={`
        overflow-hidden transition-all duration-300 ease-out
        ${isExpanded ? "max-h-40 opacity-100 mt-3 pt-3 border-t border-[#e2e8f0]" : "max-h-0 opacity-0 mt-0 pt-0"}
      `}>
        <div className="space-y-2 text-xs text-[#64748b]">
          <div className="flex items-center gap-2">
            <i className="fas fa-clock text-[#8b5cf6] w-4 text-center" />
            <span>{booking.time} • {booking.duration}</span>
          </div>
          <div className="flex items-center gap-2">
            <i className="fas fa-map-marker-alt text-[#8b5cf6] w-4 text-center" />
            <span>{booking.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <i className="fas fa-phone text-[#8b5cf6] w-4 text-center" />
            <span>{booking.phone}</span>
          </div>
          {booking.paymentStatus && (
            <div className={`
              flex items-center gap-2 px-2 py-1.5 rounded-lg mt-1
              ${paymentConfig.bg} ${paymentConfig.text}
            `}>
              <i className={`fas ${paymentConfig.icon}`} />
              <span className="font-bold">Payment: {booking.paymentStatus}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleWhatsApp();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[rgba(37,211,102,0.1)] text-[#25D366] text-xs font-bold hover:bg-[#25D366] hover:text-white transition-all active:scale-95"
          >
            <i className="fab fa-whatsapp" />
            WhatsApp
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewBooking(booking);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#f5f3ff] text-[#8b5cf6] text-xs font-bold hover:bg-[#8b5cf6] hover:text-white transition-all active:scale-95"
          >
            <i className="fas fa-eye" />
            View
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-20 text-[#64748b] animate-fadeIn">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0] flex items-center justify-center mb-4 shadow-inner">
        <i className="fas fa-list text-3xl md:text-4xl text-[#cbd5e1]" />
      </div>
      <p className="text-base md:text-lg font-bold text-[#475569] mb-1">No bookings found</p>
      <p className="text-xs md:text-sm text-[#94a3b8] max-w-xs text-center">
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
      <div className="bg-white rounded-xl md:rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">
        <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-[#f8fafc] border-b border-[#e2e8f0]">
          {["Client & Service", "Date & Time", "Location", "Status", "Amount", ""].map((label) => (
            <div key={label} className="h-3 bg-[#e2e8f0] rounded-lg w-20" />
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
      <div className="bg-white rounded-xl md:rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl md:rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">
      {/* Desktop Header */}
      <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-[#f8fafc] border-b border-[#e2e8f0] sticky top-0 z-10">
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
        <div key={booking.id}>
          <DesktopRow
            booking={booking}
            index={index}
            onViewBooking={onViewBooking}
          />
          <MobileRow
            booking={booking}
            index={index}
            onViewBooking={onViewBooking}
          />
        </div>
      ))}
    </div>
  );
}