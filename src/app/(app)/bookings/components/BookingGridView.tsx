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
    bg: "bg-[#D1FAE5]",
    text: "text-[#059669]",
    border: "border-[#059669]/20",
    dot: "bg-[#059669]",
    label: "Confirmed",
  },
  pending: {
    bg: "bg-[#FEF3C7]",
    text: "text-[#D97706]",
    border: "border-[#D97706]/20",
    dot: "bg-[#D97706]",
    label: "Pending",
  },
  completed: {
    bg: "bg-[#EFF6FF]",
    text: "text-[#2563EB]",
    border: "border-[#2563EB]/20",
    dot: "bg-[#2563EB]",
    label: "Completed",
  },
  cancelled: {
    bg: "bg-[#FEE2E2]",
    text: "text-[#DC2626]",
    border: "border-[#DC2626]/20",
    dot: "bg-[#DC2626]",
    label: "Cancelled",
  },
};

const PAYMENT_CONFIG: Record<string, { bg: string; text: string; icon: string; label: string }> = {
  paid: { bg: "bg-[#D1FAE5]", text: "text-[#059669]", icon: "fa-check-circle", label: "Paid" },
  partial: { bg: "bg-[#FEF3C7]", text: "text-[#D97706]", icon: "fa-adjust", label: "Partial" },
  unpaid: { bg: "bg-[#FEE2E2]", text: "text-[#DC2626]", icon: "fa-times-circle", label: "Unpaid" },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || {
    bg: "bg-[#F1F5F9]",
    text: "text-[#64748B]",
    border: "border-[#E2E8F0]",
    dot: "bg-[#94A3B8]",
    label: status,
  };
}

function getPaymentConfig(status?: string) {
  return PAYMENT_CONFIG[status || "unpaid"] || PAYMENT_CONFIG.unpaid;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ShimmerCard() {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 md:p-5 overflow-hidden relative">
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#F1F5F9] shrink-0" />
          <div className="space-y-2">
            <div className="h-4 bg-[#F1F5F9] rounded-lg w-28" />
            <div className="h-3 bg-[#F1F5F9] rounded-lg w-20" />
          </div>
        </div>
        <div className="h-6 bg-[#F1F5F9] rounded-full w-20" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-5 bg-[#F1F5F9] rounded-lg w-32" />
        <div className="h-3 bg-[#F1F5F9] rounded-lg w-full" />
        <div className="h-3 bg-[#F1F5F9] rounded-lg w-3/4" />
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-[#E2E8F0]">
        <div className="h-6 bg-[#F1F5F9] rounded-lg w-24" />
        <div className="flex gap-2">
          <div className="w-10 h-10 bg-[#F1F5F9] rounded-xl" />
          <div className="w-10 h-10 bg-[#F1F5F9] rounded-xl" />
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
        group relative md3-card-elevated 
        p-4 md:p-5 cursor-pointer overflow-hidden
        transition-all duration-200 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
        ${isHovered ? "shadow-md -translate-y-0.5" : "shadow-sm hover:shadow-md"}
      `}
      style={{ transitionDelay: `${index * 80}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewBooking(booking)}
    >
      {/* Top accent line - MD3 style */}
      <div
        className={`
          absolute top-0 left-4 right-4 h-[2px] rounded-full transition-all duration-300
          ${isHovered ? "opacity-100" : "opacity-0"}
        `}
        style={{ backgroundColor: statusConfig.dot.replace("bg-", "").replace("[", "").replace("]", "") }}
      />

      {/* Header - MD3 styling */}
      <div className="flex justify-between items-start mb-3.5 md:mb-4">
        <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
          {/* Avatar - MD3 shape system */}
          <div
            className={`
              w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center 
              font-medium text-xs md:text-sm shrink-0 transition-transform duration-200
              ${isHovered ? "scale-105" : "scale-100"}
              ${booking.verified
                ? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]"
                : "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]"
              }
            `}
          >
            {booking?.clientInitials || "??"}
          </div>

          <div className="min-w-0">
            <div className="font-medium text-sm md:text-base truncate flex items-center gap-1.5 text-[var(--md-sys-color-on-surface)]">
              {booking?.client || "Unknown Client"}
              {booking.verified && (
                <i className="fas fa-badge-check text-[var(--md-sys-color-success)] text-xs md:text-sm shrink-0" title="Verified client" />
              )}
            </div>
            <div className="text-[11px] md:text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1">
              <i className="fab fa-whatsapp text-[#25D366] text-[10px]" />
              <span className="truncate">{booking?.phone || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Status badge - MD3 chip styling */}
        <span
          className={`
            shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full 
            text-[10px] md:text-xs font-medium uppercase tracking-wide
            ${statusConfig.bg} ${statusConfig.text}
          `}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
          {statusConfig.label}
        </span>
      </div>

      {/* Service info - MD3 styling */}
      <div className="mb-3.5 md:mb-4">
        <div className="font-medium text-sm md:text-base mb-1.5 md:mb-2 truncate text-[var(--md-sys-color-on-surface)]">{booking?.service || "N/A"}</div>
        <div className="space-y-1.5 md:space-y-2">
          <div className="flex items-center gap-2 text-[11px] md:text-xs text-[var(--md-sys-color-on-surface-variant)]">
            <div className="w-5 h-5 rounded-lg bg-[var(--md-sys-color-surface-variant)] flex items-center justify-center shrink-0">
              <i className="fas fa-calendar text-[var(--md-sys-color-primary)] text-[9px]" />
            </div>
            <span>{formatDate(booking?.date || "")}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] md:text-xs text-[var(--md-sys-color-on-surface-variant)]">
            <div className="w-5 h-5 rounded-lg bg-[var(--md-sys-color-surface-variant)] flex items-center justify-center shrink-0">
              <i className="fas fa-clock text-[var(--md-sys-color-primary)] text-[9px]" />
            </div>
            <span>{booking?.time || "N/A"} • {booking?.duration || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] md:text-xs text-[var(--md-sys-color-on-surface-variant)]">
            <div className="w-5 h-5 rounded-lg bg-[var(--md-sys-color-surface-variant)] flex items-center justify-center shrink-0">
              <i className="fas fa-map-marker-alt text-[var(--md-sys-color-primary)] text-[9px]" />
            </div>
            <span className="truncate">{booking?.location || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Payment status bar - MD3 tonal */}
      <div className="mb-3 md:mb-4">
        <div
          className={`
            flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] md:text-xs font-medium
            ${paymentConfig.bg} ${paymentConfig.text}
          `}
        >
          <i className={`fas ${paymentConfig.icon}`} />
          <span>Payment: {paymentConfig.label}</span>
          {booking?.paymentProof?.amount !== undefined && (booking?.price || 0) > 0 && (
            <span className="ml-auto font-semibold">
              KES {booking?.paymentProof?.amount?.toLocaleString()} / {(booking?.price || 0).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Footer - MD3 styling */}
      <div className="flex justify-between items-center pt-3 md:pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
        <div className="flex flex-col">
          <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-medium uppercase tracking-wide">Total</span>
          <span className="font-semibold text-base md:text-lg text-[var(--md-sys-color-primary)]">
            KES {(booking?.price || 0).toLocaleString()}
          </span>
        </div>

        <div className="flex gap-1.5 md:gap-2">
          {/* WhatsApp button - MD3 tonal */}
          <button
            onClick={handleWhatsApp}
            className={`
              relative w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center
              transition-all duration-200 active:scale-90
              bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]
              hover:bg-[var(--md-sys-color-success)] hover:text-[var(--md-sys-color-on-success)] hover:shadow-md
            `}
            aria-label="Message on WhatsApp"
            title="Message on WhatsApp"
          >
            <i className="fab fa-whatsapp text-sm md:text-base" />
          </button>

          {/* View button - MD3 tonal */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewBooking(booking);
            }}
            className={`
              relative w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center
              transition-all duration-200 active:scale-90
              bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]
              hover:bg-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-on-primary)] hover:shadow-md
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
    <div className="col-span-full flex flex-col items-center justify-center py-16 md:py-24 text-[#64748B] animate-fadeIn">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-[#F1F5F9] flex items-center justify-center mb-4">
        <i className="fas fa-th-large text-3xl md:text-4xl text-[#CBD5E1]" />
      </div>
      <p className="text-base md:text-lg font-semibold text-[#475569] mb-1">No bookings found</p>
      <p className="text-xs md:text-sm text-[#94A3B8] max-w-xs text-center">
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