"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Booking } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingCalendarProps {
  bookings: Booking[];
  selectedDate: Date | null;
  onDateSelect: (date: Date | null) => void;
  onViewBooking: (booking: Booking) => void;
  isLoading?: boolean;
}

interface DayItem {
  day: number | null;
  isOther: boolean;
  isToday?: boolean;
  bookings?: Booking[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_OF_WEEK_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getStatusClass(status: string) {
  switch (status) {
    case "confirmed": return "bg-[#D1FAE5] text-[#059669] border-[#059669]/20";
    case "pending": return "bg-[#FEF3C7] text-[#D97706] border-[#D97706]/20";
    case "completed": return "bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/20";
    case "cancelled": return "bg-[#FEE2E2] text-[#DC2626] border-[#DC2626]/20";
    default: return "bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]";
  }
}

function getStatusDot(status: string) {
  switch (status) {
    case "confirmed": return "bg-[#059669]";
    case "pending": return "bg-[#D97706]";
    case "completed": return "bg-[#2563EB]";
    case "cancelled": return "bg-[#DC2626]";
    default: return "bg-[#94A3B8]";
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getBookingsForDate(bookings: Booking[], date: Date): Booking[] {
  const dateStr = date.toISOString().split('T')[0];
  return bookings.filter(b => b.date === dateStr);
}

function getDaysInMonth(year: number, month: number): DayItem[] {
  const days: DayItem[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const today = new Date();

  for (let i = 0; i < firstDay; i++) {
    days.push({ day: null, isOther: true });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    days.push({
      day,
      isOther: false,
      isToday: date.toDateString() === today.toDateString(),
    });
  }

  const remainingCells = 42 - days.length;
  for (let i = 0; i < remainingCells; i++) {
    days.push({ day: null, isOther: true });
  }

  return days;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ShimmerBox({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-[var(--md-sys-color-surface)]/70 to-transparent" />
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="md3-card-elevated p-4 md:p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <ShimmerBox className="h-8 bg-[var(--md-sys-color-surface-variant)] rounded-lg w-48" />
        <div className="flex gap-2">
          <ShimmerBox className="w-9 h-9 bg-[var(--md-sys-color-surface-variant)] rounded-xl" />
          <ShimmerBox className="w-9 h-9 bg-[var(--md-sys-color-surface-variant)] rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_OF_WEEK_SHORT.map((d) => (
          <ShimmerBox key={d} className="h-8 bg-[var(--md-sys-color-surface-variant)] rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <ShimmerBox key={i} className="aspect-square bg-[var(--md-sys-color-surface)] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function CalendarHeader({ currentDate, onNavigate, onToday }: {
  currentDate: Date;
  onNavigate: (direction: number) => void;
  onToday: () => void;
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleNavigate = (direction: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    onNavigate(direction);
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <div className="flex justify-between items-center mb-4 md:mb-6">
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={() => handleNavigate(-1)}
          className="w-9 h-9 md:w-10 md:h-10 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:border-[#8B5CF6] hover:text-[#8B5CF6] hover:bg-[#F3E8FF] active:scale-95 transition-all duration-200"
          aria-label="Previous month"
        >
          <i className="fas fa-chevron-left text-xs md:text-sm" />
        </button>
        <span className="text-base md:text-lg font-bold min-w-[140px] md:min-w-[180px] text-center select-none">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={() => handleNavigate(1)}
          className="w-9 h-9 md:w-10 md:h-10 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:border-[#8B5CF6] hover:text-[#8B5CF6] hover:bg-[#F3E8FF] active:scale-95 transition-all duration-200"
          aria-label="Next month"
        >
          <i className="fas fa-chevron-right text-xs md:text-sm" />
        </button>
      </div>
      <button
        onClick={onToday}
        className="w-9 h-9 md:w-10 md:h-10 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:border-[#8B5CF6] hover:text-[#8B5CF6] hover:bg-[#F3E8FF] active:scale-95 transition-all duration-200"
        aria-label="Go to today"
      >
        <i className="fas fa-calendar-day text-xs md:text-sm" />
      </button>
    </div>
  );
}

function CalendarDay({
  item,
  year,
  month,
  selectedDate,
  onDayClick,
  bookingCount,
}: {
  item: DayItem;
  year: number;
  month: number;
  selectedDate: Date | null;
  onDayClick: (date: Date | null) => void;
  bookingCount: number;
}) {
  const [isPressed, setIsPressed] = useState(false);

  if (!item.day || item.isOther) {
    return (
      <div className="aspect-square flex items-center justify-center text-sm font-medium text-[#94a3b8] opacity-40 select-none">
        {item.day}
      </div>
    );
  }

  const date = new Date(year, month, item.day);
  const isSelected = selectedDate?.toDateString() === date.toDateString();
  const hasBookings = bookingCount > 0;

  return (
    <button
      onClick={() => onDayClick(isSelected ? null : date)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      className={`
        relative aspect-square flex flex-col items-center justify-center rounded-xl
        text-sm md:text-base font-semibold transition-all duration-200 select-none
        active:scale-90 md:active:scale-95
        ${item.isToday
          ? "bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/25"
          : isSelected
            ? "bg-[#F3E8FF] text-[#8B5CF6] border-2 border-[#8B5CF6] shadow-sm"
            : "text-[#64748B] hover:bg-[#F3E8FF] hover:text-[#8B5CF6]"
        }
        ${isPressed && !item.isToday ? "scale-90" : "scale-100"}
      `}
    >
      <span className="relative z-10">{item.day}</span>

      {/* Booking count badge - MD3 styling */}
      {hasBookings && !item.isToday && (
        <div className={`
          absolute -top-1 -right-1 md:top-0.5 md:right-0.5
          min-w-[18px] h-[18px] md:min-w-[20px] md:h-[20px]
          rounded-full flex items-center justify-center
          text-[9px] md:text-[10px] font-bold
          ${isSelected ? "bg-[#8B5CF6] text-white" : "bg-[#8B5CF6] text-white"}
          shadow-sm z-20
        `}>
          {bookingCount > 9 ? "9+" : bookingCount}
        </div>
      )}

      {/* Today indicator dot */}
      {item.isToday && !isSelected && (
        <div className="absolute bottom-1 md:bottom-1.5 w-1 h-1 bg-white/80 rounded-full" />
      )}

      {/* Booking dots for non-selected days */}
      {hasBookings && !item.isToday && !isSelected && bookingCount <= 3 && (
        <div className="flex gap-[3px] mt-0.5 md:mt-1">
          {Array.from({ length: Math.min(bookingCount, 3) }).map((_, idx) => (
            <span key={idx} className="w-1 h-1 md:w-1.5 md:h-1.5 bg-[#8B5CF6]/40 rounded-full" />
          ))}
        </div>
      )}
    </button>
  );
}

function CalendarGrid({
  currentDate,
  bookings,
  selectedDate,
  onDayClick,
}: {
  currentDate: Date;
  bookings: Booking[];
  selectedDate: Date | null;
  onDayClick: (date: Date | null) => void;
}) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getDaysInMonth(year, month);

  return (
    <>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2 md:mb-3">
        {DAYS_OF_WEEK.map((day, i) => (
          <div
            key={day}
            className="text-center text-[10px] md:text-xs font-semibold text-[#64748B] uppercase tracking-wide py-1.5 md:py-2"
          >
            <span className="hidden md:inline">{day}</span>
            <span className="md:hidden">{DAYS_OF_WEEK_SHORT[i]}</span>
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1 md:gap-1.5">
        {days.map((item, i) => (
          <CalendarDay
            key={i}
            item={item}
            year={year}
            month={month}
            selectedDate={selectedDate}
            onDayClick={onDayClick}
            bookingCount={item.day && !item.isOther ? getBookingsForDate(bookings, new Date(year, month, item.day)).length : 0}
          />
        ))}
      </div>
    </>
  );
}

function BookingCard({ booking, index, onViewBooking }: {
  booking: Booking;
  index: number;
  onViewBooking: (booking: Booking) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 60);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      className={`
        group bg-white rounded-2xl p-3.5 md:p-4 border border-[#E2E8F0] 
        hover:border-[#8B5CF6]/40 hover:shadow-md hover:shadow-[#8B5CF6]/5 
        hover:-translate-y-0.5 transition-all duration-200 cursor-pointer
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
      style={{ transitionDelay: `${index * 60}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewBooking(booking)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2.5 md:gap-3">
          {/* Avatar - MD3 shape system */}
          <div className={`
            w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center 
            font-semibold text-xs md:text-sm shrink-0 transition-transform duration-200
            ${booking.verified
              ? "bg-[#F3E8FF] text-[#8B5CF6]"
              : "bg-[#F1F5F9] text-[#64748B]"
            }
            ${isHovered ? "scale-105" : "scale-100"}
          `}>
            {booking.clientInitials}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm md:text-base truncate">{booking.client}</div>
            <div className="text-xs text-[#64748B] flex items-center gap-1">
              <i className="fab fa-whatsapp text-[#25D366] text-[10px]" />
              <span className="truncate">{booking.phone}</span>
            </div>
          </div>
        </div>
        <span className={`
          px-2.5 py-1 rounded-full text-[10px] md:text-xs font-semibold uppercase tracking-wide border
          ${getStatusClass(booking.status)}
        `}>
          {booking.status}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3">
        <span className="text-[11px] md:text-xs bg-[#F8FAFC] px-2 py-1 rounded-lg text-[#64748B] border border-[#E2E8F0]/60 flex items-center gap-1">
          <i className="fas fa-cut text-[#8B5CF6] text-[10px]" />
          {booking?.service || "N/A"}
        </span>
        <span className="text-[11px] md:text-xs bg-[#F8FAFC] px-2 py-1 rounded-lg text-[#64748B] border border-[#E2E8F0]/60 flex items-center gap-1">
          <i className="fas fa-clock text-[#8B5CF6] text-[10px]" />
          {booking?.time || "N/A"}
        </span>
        <span className="text-[11px] md:text-xs bg-[#F8FAFC] px-2 py-1 rounded-lg text-[#64748B] border border-[#E2E8F0]/60 flex items-center gap-1 hidden sm:flex">
          <i className="fas fa-map-marker-alt text-[#8B5CF6] text-[10px]" />
          {booking.location}
        </span>
      </div>

      <div className="flex justify-between items-center pt-2.5 md:pt-3 border-t border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <span className="font-bold text-base md:text-lg text-[#8B5CF6]">
            KES {booking.price.toLocaleString()}
          </span>
          {booking.verified && (
            <i className="fas fa-badge-check text-[#10B981] text-sm" title="Verified" />
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewBooking(booking);
          }}
          className={`
            w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center
            transition-all duration-200 active:scale-90
            ${isHovered
              ? "bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/25"
              : "bg-[#F3E8FF] text-[#8B5CF6]"
            }
          `}
          aria-label="View booking details"
        >
          <i className="fas fa-eye text-sm" />
        </button>
      </div>
    </div>
  );
}

function DayBookingsList({ currentDate, bookings, onViewBooking }: {
  currentDate: Date;
  bookings: Booking[];
  onViewBooking: (booking: Booking) => void;
}) {
  const dayBookings = getBookingsForDate(bookings, currentDate);
  const totalRevenue = dayBookings.reduce((sum, b) => sum + b.price, 0);

  if (dayBookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 md:py-16 text-[#64748B] animate-fadeIn">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-[#F1F5F9] flex items-center justify-center mb-4">
          <i className="fas fa-calendar-times text-2xl md:text-3xl text-[#CBD5E1]" />
        </div>
        <p className="text-sm md:text-base font-medium">No bookings for this day</p>
        <p className="text-xs text-[#94A3B8] mt-1">Select another date to view bookings</p>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-5 space-y-3 md:space-y-4">
      {dayBookings.map((booking, idx) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          index={idx}
          onViewBooking={onViewBooking}
        />
      ))}

      {/* Day summary footer - MD3 styling */}
      <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex justify-between items-center text-xs md:text-sm text-[#64748B]">
        <span>{dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''}</span>
        <span className="font-bold text-[#8B5CF6]">
          Total: KES {totalRevenue.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BookingCalendar({
  bookings,
  selectedDate,
  onDateSelect,
  onViewBooking,
  isLoading = false,
}: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  const navigateMonth = useCallback((direction: number) => {
    setSlideDirection(direction > 0 ? "right" : "left");
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
    setTimeout(() => setSlideDirection(null), 300);
  }, []);

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    onDateSelect(today);
  }, [onDateSelect]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") navigateMonth(-1);
      if (e.key === "ArrowRight") navigateMonth(1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigateMonth]);

  // Swipe gestures for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      navigateMonth(diff > 0 ? 1 : -1);
    }
  };

  if (isLoading) {
    return (
      <div className="mb-6">
        <CalendarSkeleton />
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          <div className="p-4 md:p-5 border-b border-[#E2E8F0] bg-[#F3E8FF]">
            <ShimmerBox className="h-6 bg-[#E2E8F0] rounded-lg w-40" />
          </div>
          <div className="p-4 md:p-5 space-y-3">
            {[0, 1, 2].map((i) => (
              <ShimmerBox key={i} className="h-24 bg-[#F1F5F9] rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const dayBookings = getBookingsForDate(bookings, currentDate);

  return (
    <div ref={containerRef}>
      {/* Calendar Grid - MD3 styling */}
      <div
        className="bg-white rounded-2xl border border-[#E2E8F0] p-3 md:p-6 mb-4 md:mb-6 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <CalendarHeader
          currentDate={currentDate}
          onNavigate={navigateMonth}
          onToday={goToToday}
        />
        <div className={`
          transition-transform duration-300 ease-out
          ${slideDirection === "left" ? "-translate-x-4 opacity-50" : ""}
          ${slideDirection === "right" ? "translate-x-4 opacity-50" : ""}
        `}>
          <CalendarGrid
            currentDate={currentDate}
            bookings={bookings}
            selectedDate={selectedDate}
            onDayClick={onDateSelect}
          />
        </div>
      </div>

      {/* Selected Day Bookings - MD3 styling */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        <div className="p-3.5 md:p-5 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F3E8FF]">
          <div className="font-semibold flex items-center gap-2 text-sm md:text-base">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center">
              <i className="fas fa-calendar-check text-[#8B5CF6] text-xs md:text-sm" />
            </div>
            <span>{formatShortDate(currentDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] md:text-xs text-[#64748B] bg-white/80 px-2 py-1 rounded-full border border-[#E2E8F0]/50">
              {dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <DayBookingsList
          currentDate={currentDate}
          bookings={bookings}
          onViewBooking={onViewBooking}
        />
      </div>
    </div>
  );
}

<style jsx global>{`
  @media (max-width: 768px) {
    /* MD3 Calendar Container */
    .bg-white.rounded-2xl.border { border-radius: 16px !important; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important; background: var(--md-sys-color-surface, white) !important; border: none !important; }
    
    /* MD3 Calendar Header */
    .p-3.5.md\:p-5.border-b { padding: 16px !important; background: linear-gradient(135deg, var(--md-sys-color-primary-container, #f3e8ff) 0%, var(--md-sys-color-secondary-container, #fef3c7) 100%) !important; border-radius: 16px 16px 0 0 !important; }
    
    /* MD3 Month Navigation Buttons */
    button.w-9.h-9.md\:w-10.md\:h-10 { width: 40px !important; height: 40px !important; border-radius: 20px !important; background: var(--md-sys-color-surface-variant, #f1f5f9) !important; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important; }
    button.w-9.h-9.md\:w-10.md\:h-10:active { transform: scale(0.95) !important; background: var(--md-sys-color-surface-variant, #e2e8f0) !important; }
    
    /* MD3 Calendar Grid */
    .grid.grid-cols-7.gap-1.md\:gap-2 { gap: 4px !important; }
    
    /* MD3 Day Cells */
    .aspect-square.flex.items-center.justify-center { aspect-ratio: 1 !important; border-radius: 12px !important; font-weight: 500 !important; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important; }
    .aspect-square.flex.items-center.justify-center:hover { background: var(--md-sys-color-primary-container, #f3e8ff) !important; }
    .aspect-square.flex.items-center.justify-center:active { transform: scale(0.95) !important; }
    
    /* MD3 Selected Date */
    .bg-\[\#8B5CF6\].text-white { background: var(--md-sys-color-primary, #8b5cf6) !important; color: var(--md-sys-color-on-primary, white) !important; border-radius: 12px !important; box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3) !important; }
    
    /* MD3 Today Indicator */
    .border-2.border-\[\#8B5CF6\] { border-color: var(--md-sys-color-primary, #8b5cf6) !important; border-width: 2px !important; }
    
    /* MD3 Booking Cards in Calendar */
    .bg-white.rounded-xl.border { border-radius: 12px !important; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06) !important; margin-bottom: 8px !important; border: none !important; }
    
    /* MD3 Status Badges */
    .rounded-full.px-2.py-0.5.text-xs { border-radius: 16px !important; font-size: 11px !important; font-weight: 500 !important; letter-spacing: 0.3px !important; }
    
    /* MD3 Action Buttons */
    button.bg-\[\#F3E8FF\], button.bg-white { border-radius: 20px !important; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important; }
    button.bg-\[\#F3E8FF\]:active, button.bg-white:active { transform: scale(0.95) !important; opacity: 0.8 !important; }
  }
`}</style>