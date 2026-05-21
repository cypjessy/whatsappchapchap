"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Customer } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomerStatsProps {
  customers: Customer[];
  formatCurrency: (amount: number) => string;
  isLoading?: boolean;
  previousPeriodStats?: {
    totalCustomers: number;
    activeCustomers: number;
    vipCustomers: number;
    totalRevenue: number;
  };
}

interface StatConfig {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  valueColor: string;
  getValue: (customers: Customer[]) => number;
  format?: (val: number) => string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATS_CONFIG: StatConfig[] = [
  {
    id: "total",
    label: "Total",
    sublabel: "All Customers",
    icon: "fa-users",
    iconColor: "text-[#25D366]",
    iconBg: "bg-[#DCF8C6]",
    valueColor: "text-on-surface",
    getValue: (c) => c.length,
  },
  {
    id: "active",
    label: "Active",
    sublabel: "Active Status",
    icon: "fa-check-circle",
    iconColor: "text-[#10b981]",
    iconBg: "bg-[#dcfce7]",
    valueColor: "text-on-surface",
    getValue: (c) => c.filter((x) => x.status === "active").length,
  },
  {
    id: "vip",
    label: "VIP",
    sublabel: "VIP Customers",
    icon: "fa-crown",
    iconColor: "text-[#f59e0b]",
    iconBg: "bg-[#fef3c7]",
    valueColor: "text-on-surface",
    getValue: (c) => c.filter((x) => x.status === "vip").length,
  },
  {
    id: "revenue",
    label: "Revenue",
    sublabel: "Total Revenue",
    icon: "fa-coins",
    iconColor: "text-[#3b82f6]",
    iconBg: "bg-[#dbeafe]",
    valueColor: "text-on-surface",
    getValue: (c) => c.reduce((sum, x) => sum + (x.totalSpent || 0), 0),
    format: (val) => `KES ${val.toLocaleString()}`, // Will be overridden by prop
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

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getTrend(current: number, previous?: number): { value: number; isPositive: boolean } | null {
  if (!previous || previous === 0) return null;
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(Math.round(change * 10) / 10),
    isPositive: change >= 0,
  };
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ShimmerCard() {
  return (
    <div className="bg-surface rounded-xl md:rounded-2xl px-3 md:px-5 py-2.5 md:py-4 border border-outline-variant overflow-hidden relative shadow-md3-level1">
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <div className="w-9 h-9 md:w-11 md:h-11 bg-surface-variant rounded-xl" />
        <div className="h-4 bg-surface-variant rounded-lg w-14" />
      </div>
      <div className="h-6 md:h-8 bg-surface-variant rounded-lg w-20 mb-1.5 md:mb-2" />
      <div className="h-3 bg-surface-variant rounded-lg w-24" />
    </div>
  );
}

function StatCard({
  config,
  customers,
  index,
  formatCurrency,
  previousValue,
}: {
  config: StatConfig;
  customers: Customer[];
  index: number;
  formatCurrency: (amount: number) => string;
  previousValue?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const rawValue = config.getValue(customers);
  const animatedValue = useAnimatedCounter(rawValue, 1200, index * 150);
  const trend = getTrend(rawValue, previousValue);

  // Calculate percentage for progress bar
  const maxValue = Math.max(
    ...STATS_CONFIG.map((c) => c.getValue(customers))
  );
  const progressPercent = maxValue > 0 ? (rawValue / maxValue) * 100 : 0;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  const displayValue = config.id === "revenue"
    ? formatCurrency(rawValue)
    : animatedValue.toLocaleString();

  return (
    <div
      className={`
        group relative bg-surface rounded-xl md:rounded-2xl px-3 md:px-5 py-2.5 md:py-4 
        border border-outline-variant overflow-hidden cursor-default min-w-[0]
        transition-all duration-300 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        ${isHovered
          ? "border-outline-variant shadow-md3-level3 shadow-[#e2e8f0]/40 -translate-y-1"
          : "shadow-md3-level1 hover:shadow-md3-level2"
        }
      `}
      style={{ transitionDelay: `${index * 100}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top accent line on hover */}
      <div
        className={`
          absolute top-0 left-4 right-4 h-[2px] rounded-full transition-all duration-500
          ${isHovered ? "opacity-100" : "opacity-0"}
        `}
        style={{
          backgroundColor: config.iconColor
            .replace("text-[", "")
            .replace("]", ""),
        }}
      />

      <div className="flex items-center justify-between mb-2 md:mb-3">
        <div
          className={`
            w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center
            transition-transform duration-300
            ${config.iconBg} ${config.iconColor}
            ${isHovered ? "scale-110 rotate-3" : "scale-100 rotate-0"}
          `}
        >
          <i className={`fas ${config.icon} text-base md:text-xl`} />
        </div>

        <div className="flex items-center gap-2">
          {trend && (
            <span
              className={`
                hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold
                ${trend.isPositive
                  ? "bg-[#10b981]/10 text-[#10b981]"
                  : "bg-[#ef4444]/10 text-[#ef4444]"
                }
              `}
            >
              <i className={`fas fa-arrow-${trend.isPositive ? "up" : "down"} text-[8px]`} />
              {trend.value}%
            </span>
          )}
          <span className="text-[10px] md:text-xs text-outline font-bold uppercase tracking-wider">
            {config.label}
          </span>
        </div>
      </div>

      <div
        className={`
          font-extrabold text-lg md:text-2xl lg:text-3xl tracking-tight
          ${config.valueColor} transition-transform duration-300
          ${isHovered ? "scale-[1.02]" : "scale-100"}
        `}
      >
        {config.id === "revenue" && !isVisible ? "KES 0" : displayValue}
      </div>

      <div className="flex items-center justify-between mt-1.5 md:mt-2">
        <span className="text-[10px] md:text-xs text-on-surface-variant font-medium">
          {config.sublabel}
        </span>
        {config.id !== "revenue" && rawValue > 0 && customers.length > 0 && (
          <span className="hidden md:block text-[10px] text-outline font-semibold">
            {Math.round((rawValue / customers.length) * 100)}%
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-2 md:mt-3 h-1 bg-surface-variant rounded-full overflow-hidden">
        <div
          className={`
            h-full rounded-full transition-all duration-1000 ease-out
            ${config.iconBg.replace("bg-[", "bg-[").replace("]", "]").replace("bg-", "bg-")}
          `}
          style={{
            width: isVisible ? `${Math.max(progressPercent, 8)}%` : "0%",
            opacity: 0.6,
            backgroundColor: config.iconColor
              .replace("text-[", "")
              .replace("]", ""),
          }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CustomerStats({
  customers,
  formatCurrency,
  isLoading = false,
  previousPeriodStats,
}: CustomerStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        {[0, 1, 2, 3].map((i) => (
          <ShimmerCard key={i} />
        ))}
      </div>
    );
  }

  const previousValues = previousPeriodStats
    ? {
        total: previousPeriodStats.totalCustomers,
        active: previousPeriodStats.activeCustomers,
        vip: previousPeriodStats.vipCustomers,
        revenue: previousPeriodStats.totalRevenue,
      }
    : undefined;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-3 md:mb-6">
      {STATS_CONFIG.map((config, index) => (
        <StatCard
          key={config.id}
          config={config}
          customers={customers}
          index={index}
          formatCurrency={formatCurrency}
          previousValue={previousValues?.[config.id as keyof typeof previousValues]}
        />
      ))}
    </div>
  );
}