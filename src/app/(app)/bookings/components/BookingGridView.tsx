"use client";

import { useState, useEffect, useCallback } from "react";
import { Booking } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingGridViewProps {
  bookings: Booking[];
  onViewBooking: (booking: Booking) => void;
  isLoading?: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
  confirmed: {
    bg: "bg-[rgba(37,211,102,0.12)]",
    text: "text-[#10b981]",
    border: "border-[#10b981]/20",
    dot: "bg-[#10b981]",
    label: "Confirmed",
  },
  pending: {
    bg: "bg-[rgba(245,158,11,0.12)]",
    text: "text-[#f59e0b]",
    border: "border-[#f59e0b]/20",
    dot: "bg-[#f59e0b]",
    label: "Pending",
  },
  completed: {
    bg: "bg-[rgba(59,130,246,0.12)]",
    text: "text-[#3b82f6]",
    border: "border-[#3b82f6]/20",
    dot: "bg-[#3b82f6]",
    label: "Completed",
  },
  cancelled: {
    bg: "bg-[rgba(239,68,68,0.12)]",
    text: "text-[#ef4444]",
    border: "border-[#ef4444]/20",
    dot: "bg-[#ef4444]",
    label: "Cancelled",
  },
};

const PAYMENT_CONFIG: Record<string, { bg: string; text: string; icon: string; label: string }> = {
  paid: { bg: "bg-[#10b981]/10", text: "text-[#10b981]", icon: "fa-check-circle", label: "Paid" },
  partial: { bg: "bg-[#f59e0b]/10", text: "text-[#f59e0b]", icon: "fa-adjust", label: "Partial" },
  unpaid: { bg: "bg-[#ef4444]/10", text: "text-[#ef4444]", icon: "fa-times-circle", label: "Unpaid" },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || {
    bg: "bg-[#f1f5f9]",
    text: "text-[#64748b]",
    border: "border-[#e2e8f0]",
    dot: "bg-[#94a3b8]",
    label: status,
  };
}

function getPaymentConfig(status?: string) {
  return PAYMENT_CONFIG[status || "unpaid"] || PAYMENT_CONFIG.unpaid;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ShimmerCard() {
  return (
    <div className="bg-white rounded-xl md:rounded-2xl border border-[#e2e8f0] p-4 md:p-5 overflow-hidden relative">
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#f1f5f9] shrink-0" />
          <div className="space-y-2">
            <div className="h-4 bg-[#f1f5f9] rounded-lg w-28" />
            <div className="h-3 bg-[#f1f5f9] rounded-lg w-20" />
          </div>
        </div>
        <div className="h-6 bg-[#f1f5f9] rounded-full w-20" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-5 bg-[#f1f5f9] rounded-lg w-32" />
        <div className="h-3 bg-[#f1f5f9] rounded-lg w-full" />
        <div className="h-3 bg-[#f1f5f9] rounded-lg w-3/4" />
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-[#e2e8f0]">
        <div className="h-6 bg-[#f1f5f9] rounded-lg w-24" />
        <div className="flex gap-2">
          <div className="w-10 h-10 bg-[#f1f5f9] rounded-lg" />
          <div className="w-10 h-10 bg-[#f1f5f9] rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function BookingCard({
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
  const [imageError, setImageError] = useState(false);

  const statusConfig = getStatusConfig(booking?.status || "pending");
  const paymentConfig = getPaymentConfig(booking?.paymentStatus);

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
        group relative bg-white rounded-xl md:rounded-2xl border border-[#e2e8f0] 
        p-4 md:p-5 cursor-pointer overflow-hidden
        transition-all duration-300 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
        ${isHovered
          ? "border-[#8b5cf6]/30 shadow-xl shadow-[#8b5cf6]/5 -translate-y-1"
          : "shadow-sm hover:shadow-md"
        }
      `}
      style={{ transitionDelay: `${index * 80}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewBooking(booking)}
    >
      {/* Top accent line */}
      <div
        className={`
          absolute top-0 left-4 right-4 h-[2px] rounded-full transition-all duration-500
          ${isHovered ? "opacity-100" : "opacity-0"}
        `}
        style={{ backgroundColor: statusConfig.dot.replace("bg-", "").replace("[", "").replace("]", "") }}
      />

      {/* Header */}
      <div className="flex justify-between items-start mb-3.5 md:mb-4">
        <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
          {/* Avatar */}
          <div
            className={`
              w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center 
              font-bold text-xs md:text-sm shrink-0 transition-transform duration-300
              ${isHovered ? "scale-110" : "scale-100"}
              ${booking.verified
                ? "bg-gradient-to-br from-[#ede9fe] to-[#e0e7ff] text-[#8b5cf6]"
                : "bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0] text-[#64748b]"
              }
            `}
          >
            {booking?.clientInitials || "??"}
          </div>

          <div className="min-w-0">
            <div className="font-bold text-sm md:text-base truncate flex items-center gap-1.5">
              {booking?.client || "Unknown Client"}
              {booking.verified && (
                <i className="fas fa-badge-check text-[#10b981] text-xs md:text-sm shrink-0" title="Verified client" />
              )}
            </div>
            <div className="text-[11px] md:text-xs text-[#64748b] flex items-center gap-1">
              <i className="fab fa-whatsapp text-[#25D366] text-[10px]" />
              <span className="truncate">{booking?.phone || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Status badge */}
        <span
          className={`
            shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full 
            text-[10px] md:text-xs font-bold uppercase tracking-wide border
            ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}
          `}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
          {statusConfig.label}
        </span>
      </div>

      {/* Service info */}
      <div className="mb-3.5 md:mb-4">
        <div className="font-bold text-sm md:text-base mb-1.5 md:mb-2 truncate">{booking?.service || "N/A"}</div>
        <div className="space-y-1.5 md:space-y-2">
          <div className="flex items-center gap-2 text-[11px] md:text-xs text-[#64748b]">
            <div className="w-5 h-5 rounded-md bg-[#f8fafc] flex items-center justify-center shrink-0">
              <i className="fas fa-calendar text-[#8b5cf6] text-[9px]" />
            </div>
            <span>{formatDate(booking?.date || "")}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] md:text-xs text-[#64748b]">
            <div className="w-5 h-5 rounded-md bg-[#f8fafc] flex items-center justify-center shrink-0">
              <i className="fas fa-clock text-[#8b5cf6] text-[9px]" />
            </div>
            <span>{booking?.time || "N/A"} • {booking?.duration || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] md:text-xs text-[#64748b]">
            <div className="w-5 h-5 rounded-md bg-[#f8fafc] flex items-center justify-center shrink-0">
              <i className="fas fa-map-marker-alt text-[#8b5cf6] text-[9px]" />
            </div>
            <span className="truncate">{booking?.location || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Payment status bar */}
      <div className="mb-3 md:mb-4">
        <div
          className={`
            flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] md:text-xs font-semibold
            ${paymentConfig.bg} ${paymentConfig.text} border border-current/10
          `}
        >
          <i className={`fas ${paymentConfig.icon}`} />
          <span>Payment: {paymentConfig.label}</span>
          {booking?.paymentProof?.amount !== undefined && (booking?.price || 0) > 0 && (
            <span className="ml-auto font-bold">
              KES {booking?.paymentProof?.amount?.toLocaleString()} / {(booking?.price || 0).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-3 md:pt-4 border-t border-[#e2e8f0]">
        <div className="flex flex-col">
          <span className="text-[10px] text-[#94a3b8] font-semibold uppercase tracking-wider">Total</span>
          <span className="font-extrabold text-base md:text-lg text-[#8b5cf6]">
            KES {(booking?.price || 0).toLocaleString()}
          </span>
        </div>

        <div className="flex gap-1.5 md:gap-2">
          {/* WhatsApp button */}
          <button
            onClick={handleWhatsApp}
            className={`
              relative w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center
              transition-all duration-200 active:scale-90
              bg-[rgba(37,211,102,0.1)] text-[#25D366]
              hover:bg-[#25D366] hover:text-white hover:shadow-md hover:shadow-[#25D366]/20
            `}
            aria-label="Message on WhatsApp"
            title="Message on WhatsApp"
          >
            <i className="fab fa-whatsapp text-sm md:text-base" />
          </button>

          {/* View button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewBooking(booking);
            }}
            className={`
              relative w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center
              transition-all duration-200 active:scale-90
              bg-[#f5f3ff] text-[#8b5cf6]
              hover:bg-[#8b5cf6] hover:text-white hover:shadow-md hover:shadow-[#8b5cf6]/20
            `}
            aria-label="View booking details"
            title="View details"
          >
            <i className="fas fa-eye text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 md:py-24 text-[#64748b] animate-fadeIn">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0] flex items-center justify-center mb-4 shadow-inner">
        <i className="fas fa-th-large text-3xl md:text-4xl text-[#cbd5e1]" />
      </div>
      <p className="text-base md:text-lg font-bold text-[#475569] mb-1">No bookings found</p>
      <p className="text-xs md:text-sm text-[#94a3b8] max-w-xs text-center">
        Try adjusting your filters or search criteria to find what you're looking for.
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BookingGridView({
  bookings,
  onViewBooking,
  isLoading = false,
}: BookingGridViewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ShimmerCard key={i} />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
      {bookings.map((booking, index) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          index={index}
          onViewBooking={onViewBooking}
        />
      ))}
    </div>
  );
}