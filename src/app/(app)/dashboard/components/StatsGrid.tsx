"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { dashboardService, DashboardStats } from "@/lib/dashboard";
import { formatCurrency } from "@/lib/currency";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatsGridProps {
  refreshTrigger?: number;
  previousStats?: DashboardStats;
}

interface StatConfig {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  valueKey: keyof DashboardStats;
  format?: (val: number) => string;
  showTrend?: boolean;
  trendKey?: keyof DashboardStats;
  trendLabel?: string;
  isPercentage?: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATS_CONFIG: StatConfig[] = [
  {
    id: "sales",
    label: "Total Sales",
    sublabel: "vs last month",
    icon: "fa-wallet",
    iconColor: "text-[#25D366]",
    iconBg: "bg-[#E8F5E9]",
    valueKey: "totalSales",
    format: (val) => formatCurrency(val),
    showTrend: true,
    trendKey: "salesChange",
    trendLabel: "%",
  },
  {
    id: "orders",
    label: "Total Orders",
    sublabel: "vs last month",
    icon: "fa-shopping-bag",
    iconColor: "text-[#3B82F6]",
    iconBg: "bg-[#EFF6FF]",
    valueKey: "totalOrders",
    format: (val) => val.toLocaleString(),
    showTrend: true,
    trendKey: "ordersChange",
    trendLabel: "%",
  },
  {
    id: "customers",
    label: "Active Customers",
    sublabel: "new today",
    icon: "fa-users",
    iconColor: "text-[#F59E0B]",
    iconBg: "bg-[#FEF3C7]",
    valueKey: "activeCustomers",
    format: (val) => val.toLocaleString(),
    showTrend: true,
    trendKey: "newCustomersToday",
    trendLabel: "",
  },
  {
    id: "ai",
    label: "AI Response Rate",
    sublabel: "performance",
    icon: "fa-robot",
    iconColor: "text-[#8B5CF6]",
    iconBg: "bg-[#F3E8FF]",
    valueKey: "aiResponseRate",
    format: (val) => `${val}%`,
    isPercentage: true,
  },
];

// ─── Animated Counter Hook ───────────────────────────────────────────────────

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

function getTrendColor(value: number, isPositiveGood: boolean = true): string {
  if (value === 0) return "text-[#64748B]";
  const isPositive = value > 0;
  if (isPositiveGood) {
    return isPositive ? "text-[#10B981]" : "text-[#EF4444]";
  }
  return isPositive ? "text-[#EF4444]" : "text-[#10B981]";
}

function getTrendIcon(value: number): string {
  if (value === 0) return "fa-minus";
  return value > 0 ? "fa-arrow-up" : "fa-arrow-down";
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ShimmerCard({ isMobile = false }: { isMobile?: boolean }) {
  return (
    <div className={`
      relative overflow-hidden md3-card-elevated
      ${isMobile ? "p-3 min-w-[140px] flex-shrink-0" : "p-4 md:p-6"}
    `}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-[var(--md-sys-color-surface)]/70 to-transparent" />
      <div className={isMobile ? "space-y-2" : "flex justify-between items-start"}>
        {!isMobile && (
          <div className="space-y-3 flex-1">
            <div className="h-3 bg-[#F1F5F9] rounded-lg w-24" />
            <div className="h-8 bg-[#F1F5F9] rounded-lg w-32" />
            <div className="h-3 bg-[#F1F5F9] rounded-lg w-20" />
          </div>
        )}
        {isMobile && (
          <>
            <div className="flex justify-between mb-2">
              <div className="w-8 h-8 bg-[#F1F5F9] rounded-xl" />
            </div>
            <div className="h-3 bg-[#F1F5F9] rounded w-16" />
            <div className="h-6 bg-[#F1F5F9] rounded w-24" />
            <div className="h-3 bg-[#F1F5F9] rounded w-20" />
          </>
        )}
        {!isMobile && <div className="w-12 h-12 bg-[#F1F5F9] rounded-xl shrink-0 ml-4" />}
      </div>
    </div>
  );
}

function CircularProgress({ percentage, color }: { percentage: number; color: string }) {
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-12 h-12 md:w-14 md:h-14">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="3"
        />
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke={color.replace("text-[", "").replace("]", "")}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] md:text-xs font-semibold text-[#1E293B]">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
}

function StatCard({
  config,
  stats,
  index,
  isMobile = false,
}: {
  config: StatConfig;
  stats: DashboardStats;
  index: number;
  isMobile?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const rawValue = (stats[config.valueKey] as number) || 0;
  const animatedValue = useAnimatedCounter(rawValue, 1200, index * 150);
  const trendValue = config.trendKey ? (stats[config.trendKey] as number) || 0 : 0;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  const displayValue = config.format
    ? config.format(config.id === "sales" || config.id === "orders" || config.id === "customers" ? animatedValue : rawValue)
    : animatedValue.toLocaleString();

  if (isMobile) {
    return (
      <div
        className={`
          md3-card-elevated p-3
          transition-all duration-300
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}
        `}
        style={{ transitionDelay: `${index * 100}ms` }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className={`
            w-8 h-8 rounded-xl flex items-center justify-center
            ${config.iconBg} ${config.iconColor}
          `}>
            <i className={`fas ${config.icon} text-xs`} />
          </div>
          {config.isPercentage && (
            <CircularProgress percentage={rawValue} color={config.iconColor} />
          )}
        </div>
        <div className="text-[10px] font-medium text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wide">{config.label}</div>
        <div className="text-lg font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">{displayValue}</div>
        {config.showTrend && (
          <div className={`text-[10px] font-medium mt-1 ${getTrendColor(trendValue)}`}>
            <i className={`fas ${getTrendIcon(trendValue)} text-[8px] mr-0.5`} />
            {trendValue > 0 ? "+" : ""}{trendValue}{config.trendLabel}
          </div>
        )}
        {!config.showTrend && !config.isPercentage && (
          <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-1">{config.sublabel}</div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`
        group relative md3-card-elevated p-4 md:p-6 
        overflow-hidden cursor-default
        transition-all duration-200 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        ${isHovered
          ? "shadow-md -translate-y-0.5"
          : "shadow-sm hover:shadow-md"
        }
      `}
      style={{ transitionDelay: `${index * 100}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top accent line - MD3 style */}
      <div
        className={`
          absolute top-0 left-4 right-4 h-[2px] rounded-full transition-all duration-300
          ${isHovered ? "opacity-100" : "opacity-0"}
        `}
        style={{
          backgroundColor: config.iconColor.replace("text-[", "").replace("]", ""),
        }}
      />

      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] md:text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wide mb-1.5 md:mb-2">
            {config.label}
          </div>
          <div
            className={`
              text-2xl md:text-3xl font-semibold text-[var(--md-sys-color-on-surface)] tracking-tight
              transition-transform duration-200
              ${isHovered ? "scale-[1.02]" : "scale-100"}
            `}
          >
            {displayValue}
          </div>

          {/* Trend or sublabel - MD3 chip styling */}
          {config.showTrend ? (
            <div className="flex items-center gap-1.5 mt-1.5 md:mt-2">
              <span className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium
                ${getTrendColor(trendValue)}
                ${trendValue !== 0 ? "bg-current/10" : "bg-[var(--md-sys-color-surface-variant)]"}
              `}>
                <i className={`fas ${getTrendIcon(trendValue)} text-[8px]`} />
                {trendValue > 0 ? "+" : ""}{trendValue}{config.trendLabel}
              </span>
              <span className="text-[10px] md:text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium">{config.sublabel}</span>
            </div>
          ) : config.isPercentage ? (
            <div className="flex items-center gap-1.5 mt-1.5 md:mt-2">
              <span className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium
                ${rawValue >= 90 ? "text-[var(--md-sys-color-success)] bg-[var(--md-sys-color-success-container)]" : "text-[var(--md-sys-color-warning)] bg-[var(--md-sys-color-warning-container)]"}
              `}>
                <i className={`fas ${rawValue >= 90 ? "fa-check" : "fa-exclamation"} text-[8px]`} />
                {rawValue >= 90 ? "Excellent" : "Good"}
              </span>
              <span className="text-[10px] md:text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium">{config.sublabel}</span>
            </div>
          ) : (
            <div className="text-[10px] md:text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1.5 md:mt-2 font-medium">
              {config.sublabel}
            </div>
          )}
        </div>

        {/* Icon or progress ring - MD3 tonal system */}
        <div className="shrink-0 ml-3 md:ml-4">
          {config.isPercentage ? (
            <div className={`
              transition-transform duration-200
              ${isHovered ? "scale-105" : "scale-100"}
            `}>
              <CircularProgress percentage={rawValue} color={config.iconColor} />
            </div>
          ) : (
            <div className={`
              w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center
              ${config.iconBg} ${config.iconColor}
              transition-all duration-200
              ${isHovered ? "scale-105 shadow-sm" : "scale-100"}
            `}>
              <i className={`fas ${config.icon} text-sm md:text-xl`} />
            </div>
          )}
        </div>
      </div>

      {/* Mini progress bar - MD3 styling */}
      {!config.isPercentage && (
        <div className="mt-3 md:mt-4 h-1 bg-[#F1F5F9] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: isVisible ? "65%" : "0%",
              opacity: 0.4,
              backgroundColor: config.iconColor
                .replace("text-[", "")
                .replace("]", ""),
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StatsGrid({ refreshTrigger, previousStats }: StatsGridProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data = await dashboardService.getStats(user);
        setStats(data);
      } catch (error) {
        console.error("Error loading stats:", error);
        setStats({
          totalSales: 0,
          totalOrders: 0,
          pendingOrders: 0,
          activeCustomers: 0,
          aiResponseRate: 0,
          salesChange: 0,
          ordersChange: 0,
          newCustomersToday: 0,
        });
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [user, refreshTrigger]);

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 gap-3 md:gap-6 mb-6 md:mb-8">
        {[0, 1, 2, 3].map((i) => (
          <ShimmerCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={`
      transition-all duration-500
      ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
    `}>
      {/* Mobile: 2x2 Grid */}
      <div className="md:hidden grid grid-cols-2 gap-3 mb-6">
        {STATS_CONFIG.map((config, index) => (
          <StatCard
            key={config.id}
            config={config}
            stats={stats}
            index={index}
            isMobile
          />
        ))}
      </div>

      {/* Desktop: Grid layout */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {STATS_CONFIG.map((config, index) => (
          <StatCard
            key={config.id}
            config={config}
            stats={stats}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}