"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Booking } from "@/lib/db";

// ── Types ────────────────────────────────────────────────────────────────────

interface BookingStatsProps {
  bookings: Booking[];
  filterStatus: string;
  onStatusClick: (status: string) => void;
  isLoading?: boolean;
  previousBookings?: Booking[]; // Optional: for trend comparison
}

interface StatConfig {
  id: string;
  label: string;
  icon: string;
  color: string;
  bgGradient: string;
  ringColor: string;
  dotColor: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const STAT_CONFIGS: StatConfig[] = [
  {
    id: "confirmed",
    label: "Confirmed",
    icon: "fa-check-circle",
    color: "text-[#10b981]",
    bgGradient: "from-[#10b981]/10 via-[#10b981]/5 to-transparent",
    ringColor: "ring-[#10b981]/30",
    dotColor: "bg-[#10b981]",
  },
  {
    id: "pending",
    label: "Pending",
    icon: "fa-clock",
    color: "text-[#f59e0b]",
    bgGradient: "from-[#f59e0b]/10 via-[#f59e0b]/5 to-transparent",
    ringColor: "ring-[#f59e0b]/30",
    dotColor: "bg-[#f59e0b]",
  },
  {
    id: "completed",
    label: "Completed",
    icon: "fa-check-double",
    color: "text-[#3b82f6]",
    bgGradient: "from-[#3b82f6]/10 via-[#3b82f6]/5 to-transparent",
    ringColor: "ring-[#3b82f6]/30",
    dotColor: "bg-[#3b82f6]",
  },
  {
    id: "cancelled",
    label: "Cancelled",
    icon: "fa-times-circle",
    color: "text-[#ef4444]",
    bgGradient: "from-[#ef4444]/10 via-[#ef4444]/5 to-transparent",
    ringColor: "ring-[#ef4444]/30",
    dotColor: "bg-[#ef4444]",
  },
];

// ─── Animated Counter Hook ────────────────────────────────────────────────────

function useAnimatedCounter(target: number, duration: number = 1200, delay: number = 0) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const timer = setTimeout(() => setHasStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!hasStarted) return;

    const startTime = performance.now();
    const startValue = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + (target - startValue) * eased);

      setCount(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [hasStarted, target, duration]);

  return count;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ShimmerCard() {
  return (
    <div className="bg-white p-4 md:p-5 rounded-xl md:rounded-2xl border border-[#e2e8f0] overflow-hidden relative">
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-[#f1f5f9]" />
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-[#f1f5f9] rounded-lg w-16" />
        </div>
      </div>
      <div className="h-8 bg-[#f1f5f9] rounded-lg w-16" />
      <div className="mt-3 h-1.5 bg-[#f1f5f9] rounded-full w-full" />
    </div>
  );
}

function StatCard({
  config,
  value,
  total,
  isActive,
  delay,
  onClick,
  trend,
}: {
  config: StatConfig;
  value: number;
  total: number;
  isActive: boolean;
  delay: number;
  onClick: () => void;
  trend?: { value: number; isPositive: boolean };
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const animatedValue = useAnimatedCounter(value, 1200, delay);
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        group relative w-full text-left rounded-xl md:rounded-2xl border-2 p-4 md:p-5
        transition-all duration-300 ease-out cursor-pointer
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        ${isActive
          ? `ring-2 ${config.ringColor} border-[#8b5cf6]/40 shadow-lg shadow-[#8b5cf6]/5`
          : "border-[#e2e8f0] hover:border-[#cbd5e1]"
        }
        ${isHovered && !isActive ? "shadow-md -translate-y-0.5" : "shadow-sm"}
        bg-white bg-gradient-to-br ${config.bgGradient}
      `}
      style={{ transitionDelay: `${delay}ms` }}
      aria-pressed={isActive}
    >
      {/* Active indicator dot */}
      {isActive && (
        <div className={`
          absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full ${config.dotColor}
          flex items-center justify-center shadow-md animate-bounce
        `}>
          <i className="fas fa-check text-white text-[9px]" />
        </div>
      )}

      {/* Header: Icon + Label + Trend */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`
            w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center
            transition-all duration-300
            ${isHovered || isActive ? "scale-110 shadow-sm" : "scale-100"}
            ${config.color.replace("text-", "bg-").replace("]", "]/15")}
          `}>
            <i className={`fas ${config.icon} ${config.color} text-sm md:text-base`} />
          </div>
          <div className="text-[11px] md:text-xs font-bold text-[#64748b] uppercase tracking-wider">
            {config.label}
          </div>
        </div>

        {trend && (
          <div className={`
            flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md
            ${trend.isPositive
              ? "bg-[#10b981]/10 text-[#10b981]"
              : "bg-[#ef4444]/10 text-[#ef4444]"
            }
          `}>
            <i className={`fas fa-arrow-${trend.isPositive ? "up" : "down"} text-[8px]`} />
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      {/* Value */}
      <div className={`
        text-2xl md:text-3xl font-extrabold tracking-tight transition-transform duration-300
        ${config.color}
        ${isHovered ? "scale-[1.02]" : "scale-100"}
      `}>
        {animatedValue.toLocaleString()}
      </div>

      {/* Percentage bar */}
      <div className="mt-3 md:mt-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] text-[#94a3b8] font-semibold">
            {percentage}% of total
          </span>
          <span className={`
            text-[10px] font-bold opacity-0 transition-opacity duration-200
            ${isHovered || isActive ? "opacity-100" : "opacity-0"}
            ${config.color}
          `}>
            {value} / {total}
          </span>
        </div>
        <div className="h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
          <div
            className={`
              h-full rounded-full transition-all duration-1000 ease-out
              ${config.dotColor}
            `}
            style={{
              width: isVisible ? `${percentage}%` : "0%",
              opacity: 0.6,
            }}
          />
        </div>
      </div>

      {/* Hover hint */}
      <div className={`
        mt-2 text-[10px] font-semibold text-[#8b5cf6] transition-all duration-200
        ${isHovered && !isActive ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}
      `}>
        Click to filter
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BookingStats({
  bookings,
  filterStatus,
  onStatusClick,
  isLoading = false,
  previousBookings,
}: BookingStatsProps) {
  const totalBookings = bookings.length;

  const stats = STAT_CONFIGS.map((config) => ({
    ...config,
    value: bookings.filter((b) => b.status === config.id).length,
    previousValue: previousBookings
      ? previousBookings.filter((b) => b.status === config.id).length
      : undefined,
  }));

  const getTrend = (current: number, previous?: number) => {
    if (!previous || previous === 0) return undefined;
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(Math.round(change * 10) / 10), isPositive: change >= 0 };
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <ShimmerCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4 mb-6">
      {stats.map((stat, index) => (
        <StatCard
          key={stat.id}
          config={stat}
          value={stat.value}
          total={totalBookings}
          isActive={filterStatus === stat.id}
          delay={index * 100}
          onClick={() => onStatusClick(filterStatus === stat.id ? "all" : stat.id)}
          trend={getTrend(stat.value, stat.previousValue)}
        />
      ))}
    </div>
  );
}