"use client";

import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalyticsStat {
  label: string;
  value: string;
  icon: string;
  color: string;
  trend?: { value: number; isPositive: boolean };
}

interface BookingAnalyticsProps {
  totalRevenue: number;
  averageBookingValue: number;
  completedRevenue: number;
  pendingRevenue: number;
  isLoading?: boolean;
  previousPeriodRevenue?: number; // Optional: for trend comparison
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ShimmerSkeleton() {
  return (
    <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] overflow-hidden relative">
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent z-10" />
      <div className="h-3.5 bg-[#e2e8f0] rounded-full mb-3 w-20" />
      <div className="h-8 bg-[#f1f5f9] rounded-lg w-28" />
    </div>
  );
}

function AnalyticsCard({ label, value, icon, color, trend, delay = 0 }: AnalyticsStat & { delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`
        group relative bg-gradient-to-br from-white to-[#f8fafc] 
        p-3 sm:p-4 md:p-5 rounded-xl border border-[#e2e8f0] 
        transition-all duration-300 ease-out cursor-default
        hover:shadow-lg hover:shadow-[#e2e8f0]/60 hover:border-[#cbd5e1] hover:-translate-y-0.5
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}
      `}
      style={{ transitionDelay: `${delay}s` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Subtle top accent line */}
      <div 
        className={`absolute top-0 left-4 right-4 h-[2px] rounded-full transition-all duration-500 ${color.replace("text-", "bg-")} opacity-0 group-hover:opacity-100`}
      />

      <div className="flex items-start justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300
            ${isHovered ? "scale-110" : "scale-100"}
            ${color.replace("text-", "bg-").replace("]", "]/10")}
          `}>
            <i className={`fas ${icon} ${color} text-sm`} />
          </div>
          <div className="text-[11px] sm:text-xs font-semibold text-[#64748b] uppercase tracking-wider">
            {label}
          </div>
        </div>
        
        {/* Trend indicator */}
        {trend && (
          <div className={`
            flex items-center gap-0.5 text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md
            ${trend.isPositive 
              ? "bg-[#10b981]/10 text-[#10b981]" 
              : "bg-[#ef4444]/10 text-[#ef4444]"
            }
          `}>
            <i className={`fas fa-arrow-${trend.isPositive ? "up" : "down"} text-[9px]`} />
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      <div className={`text-base sm:text-lg md:text-xl lg:text-2xl font-extrabold tracking-tight ${color} transition-transform duration-300 ${isHovered ? "scale-[1.02]" : "scale-100"}`}>
        {value}
      </div>

      {/* Bottom progress hint bar */}
      <div className="mt-3 h-1 bg-[#e2e8f0] rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${color.replace("text-", "bg-")} transition-all duration-700 ease-out`}
          style={{ 
            width: isVisible ? "65%" : "0%",
            opacity: 0.3
          }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function BookingAnalytics({
  totalRevenue,
  averageBookingValue,
  completedRevenue,
  pendingRevenue,
  isLoading = false,
  previousPeriodRevenue,
}: BookingAnalyticsProps) {
  // Calculate trends if previous data available
  const getTrend = (current: number, previous?: number) => {
    if (!previous || previous === 0) return undefined;
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(Math.round(change * 10) / 10), isPositive: change >= 0 };
  };

  const analyticsStats: AnalyticsStat[] = [
    { 
      label: "Total Revenue", 
      value: `KES ${totalRevenue.toLocaleString()}`, 
      icon: "fa-dollar-sign", 
      color: "text-[#10b981]",
      trend: getTrend(totalRevenue, previousPeriodRevenue)
    },
    { 
      label: "Avg. Booking", 
      value: `KES ${Math.round(averageBookingValue).toLocaleString()}`, 
      icon: "fa-chart-line", 
      color: "text-[#3b82f6]" 
    },
    { 
      label: "Completed Rev.", 
      value: `KES ${completedRevenue.toLocaleString()}`, 
      icon: "fa-check-circle", 
      color: "text-[#8b5cf6]" 
    },
    { 
      label: "Pending Rev.", 
      value: `KES ${pendingRevenue.toLocaleString()}`, 
      icon: "fa-clock", 
      color: "text-[#f59e0b]" 
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <ShimmerSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4 mb-6">
      {analyticsStats.map((stat, idx) => (
        <AnalyticsCard key={idx} {...stat} delay={idx * 0.08} />
      ))}
    </div>
  );
}