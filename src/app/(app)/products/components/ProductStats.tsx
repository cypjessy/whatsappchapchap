"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { formatCurrency } from "@/lib/currency";
import {
  Package,
  DollarSign,
  AlertTriangle,
  CircleX,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductStatsProps {
  totalProducts: number;
  inventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  previousPeriod?: {
    totalProducts?: number;
    inventoryValue?: number;
    lowStockCount?: number;
    outOfStockCount?: number;
  };
  onCardClick?: (type: "all" | "inventory" | "low" | "out") => void;
  isLoading?: boolean;
}

interface StatConfig {
  id: "all" | "inventory" | "low" | "out";
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  iconBg: string;
  borderColor: string;
  hoverBorder: string;
  isCurrency?: boolean;
  isWarning?: boolean;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const STATS_CONFIG: StatConfig[] = [
  {
    id: "all",
    label: "Total Products",
    icon: Package,
    color: "#25D366",
    bgColor: "bg-[#f0fdf4]",
    iconBg: "bg-[rgba(37,211,102,0.12)]",
    borderColor: "border-[#25D366]/20",
    hoverBorder: "hover:border-[#25D366]",
  },
  {
    id: "inventory",
    label: "Inventory Value",
    icon: DollarSign,
    color: "#3b82f6",
    bgColor: "bg-[#eff6ff]",
    iconBg: "bg-[rgba(59,130,246,0.12)]",
    borderColor: "border-[#3b82f6]/20",
    hoverBorder: "hover:border-[#3b82f6]",
    isCurrency: true,
  },
  {
    id: "low",
    label: "Low Stock",
    icon: AlertTriangle,
    color: "#f59e0b",
    bgColor: "bg-[#fffbeb]",
    iconBg: "bg-[rgba(245,158,11,0.12)]",
    borderColor: "border-[#f59e0b]/20",
    hoverBorder: "hover:border-[#f59e0b]",
    isWarning: true,
  },
  {
    id: "out",
    label: "Out of Stock",
    icon: CircleX,
    color: "#ef4444",
    bgColor: "bg-[#fef2f2]",
    iconBg: "bg-[rgba(239,68,68,0.12)]",
    borderColor: "border-[#ef4444]/20",
    hoverBorder: "hover:border-[#ef4444]",
    isWarning: true,
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
    <div className="flex-shrink-0 snap-start bg-white px-4 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl border-2 border-[#e2e8f0] shadow-sm min-w-[160px] md:min-w-0 md:flex-1 overflow-hidden relative">
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <div className="flex items-start justify-between mb-2">
        <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-[#f1f5f9]" />
        <div className="h-5 bg-[#f1f5f9] rounded-full w-12" />
      </div>
      <div className="h-7 bg-[#f1f5f9] rounded-lg w-24 mb-1" />
      <div className="h-4 bg-[#f1f5f9] rounded-lg w-20" />
    </div>
  );
}

function StatCard({
  config,
  value,
  previousValue,
  totalProducts,
  index,
  onClick,
}: {
  config: StatConfig;
  value: number;
  previousValue?: number;
  totalProducts: number;
  index: number;
  onClick?: () => void;
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const animatedValue = useAnimatedCounter(value, 800, 0);

  const trend = useMemo(() => {
    if (previousValue === undefined) return null;
    const diff = value - previousValue;
    const percent = previousValue === 0 ? 0 : Math.round((diff / previousValue) * 100);
    return { diff, percent, isUp: diff > 0, isNeutral: diff === 0 };
  }, [value, previousValue]);

  const TrendIcon = trend?.isUp ? TrendingUp : trend?.isNeutral ? Minus : TrendingDown;
  const showTrend = trend !== null && previousValue !== undefined;
  const isWarningActive = config.isWarning && value > 0;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        group relative flex-shrink-0 snap-start
        px-3 md:px-5 py-2.5 md:py-4 rounded-xl md:rounded-2xl 
        border-2 transition-all duration-200 ease-out text-left
        min-w-[0] md:min-w-0
        ${config.borderColor} ${config.hoverBorder}
        ${isHovered ? "shadow-lg -translate-y-0.5" : "shadow-sm"}
        ${onClick ? "cursor-pointer active:scale-[0.98]" : "cursor-default"}
        bg-white
      `}
      disabled={!onClick}
    >
      {/* Top row: Icon + Trend */}
      <div className="flex items-start justify-between mb-2 md:mb-3">
        <div
          className={`
            w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center
            transition-all duration-300
            ${config.iconBg}
            ${isHovered ? "scale-110 shadow-sm" : "scale-100"}
          `}
        >
          <config.icon
            className="w-4 h-4 md:w-5 md:h-5"
            style={{ color: config.color }}
            strokeWidth={2.5}
          />
        </div>

        {/* Trend indicator — hidden on mobile */}
        {showTrend && (
          <div
            className={`
              hidden md:flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border
              ${trend.isUp
                ? "bg-[#f0fdf4] text-[#25D366] border-[#25D366]/20"
                : trend.isNeutral
                  ? "bg-white text-[#94a3b8] border-[#e2e8f0]"
                  : "bg-[#fef2f2] text-[#ef4444] border-[#ef4444]/20"
              }
            `}
          >
            <TrendIcon className="w-3 h-3" />
            <span>{trend.percent > 0 ? "+" : ""}{trend.percent}%</span>
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-0.5 md:mb-1">
        <span
          className={`
            text-lg md:text-2xl lg:text-3xl font-extrabold tracking-tight
            transition-all duration-300
            ${isWarningActive ? "text-[#ef4444]" : "text-[#1e293b]"}
            ${isHovered ? "scale-[1.02]" : "scale-100"}
            inline-block
          `}
        >
          {config.isCurrency ? formatCurrency(animatedValue) : animatedValue.toLocaleString()}
        </span>
      </div>

      {/* Label + Arrow */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] md:text-sm font-medium text-[#64748b]">
          {config.label}
        </span>

        {onClick && (
          <ChevronRight
            className={`
              hidden md:block w-3.5 h-3.5 text-[#94a3b8] transition-all duration-300
              ${isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"}
            `}
          />
        )}
      </div>

      {/* Previous value comparison — hidden on mobile */}
      {showTrend && !config.isWarning && (
        <div className="mt-1 md:mt-1.5 text-[10px] text-[#94a3b8] font-medium hidden md:block">
          vs {config.isCurrency ? formatCurrency(previousValue!) : previousValue!.toLocaleString()} last period
        </div>
      )}

      {/* Warning progress bar */}
      {config.isWarning && value > 0 && (
        <div className="mt-1.5 md:mt-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] md:text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">
              {Math.round((value / Math.max(totalProducts, 1)) * 100)}% of total
            </span>
          </div>
          <div className="h-1 md:h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: isVisible ? `${Math.min((value / Math.max(totalProducts, 1)) * 100, 100)}%` : "0%",
                backgroundColor: config.color,
                opacity: 0.7,
              }}
            />
          </div>
        </div>
      )}

      {/* Hover glow */}
      <div
        className={`
          absolute inset-0 rounded-xl md:rounded-2xl pointer-events-none transition-opacity duration-500
          ${isHovered ? "opacity-100" : "opacity-0"}
        `}
        style={{
          background: `radial-gradient(circle at 50% 0%, ${config.color}10, transparent 70%)`,
        }}
      />

      {/* Active indicator dot (mobile) */}
      {isHovered && (
        <div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white md:hidden"
          style={{ backgroundColor: config.color }}
        />
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductStats({
  totalProducts,
  inventoryValue,
  lowStockCount,
  outOfStockCount,
  previousPeriod,
  onCardClick,
  isLoading = false,
}: ProductStatsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const stats = useMemo(
    () => [
      { config: STATS_CONFIG[0], value: totalProducts, previous: previousPeriod?.totalProducts },
      { config: STATS_CONFIG[1], value: inventoryValue, previous: previousPeriod?.inventoryValue },
      { config: STATS_CONFIG[2], value: lowStockCount, previous: previousPeriod?.lowStockCount },
      { config: STATS_CONFIG[3], value: outOfStockCount, previous: previousPeriod?.outOfStockCount },
    ],
    [totalProducts, inventoryValue, lowStockCount, outOfStockCount, previousPeriod]
  );

  if (isLoading) {
    return (
      <div className="relative mb-3 md:mb-6 px-0">
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 hide-scrollbar snap-x snap-mandatory">
          {Array.from({ length: 4 }).map((_, i) => (
            <ShimmerCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative mb-3 md:mb-6 px-0">
      {/* Right scroll hint */}
      <button
        onClick={() => scrollRef.current?.scrollBy({ left: 200, behavior: "smooth" })}
        className={`
          absolute right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full 
          bg-white/95 backdrop-blur-md shadow-lg border border-[#e2e8f0] 
          flex items-center justify-center text-[#64748b] hover:text-[#128C7E] hover:border-[#25D366]
          transition-all duration-300 active:scale-90 md:hidden
          ${canScrollRight ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 pointer-events-none"}
        `}
        aria-label="Scroll right"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Gradient fade */}
      <div
        className={`
          absolute right-0 top-0 bottom-2 w-12 md:w-16 bg-gradient-to-l from-white via-white/80 to-transparent 
          z-[5] pointer-events-none transition-opacity duration-300
          ${canScrollRight ? "opacity-100" : "opacity-0"}
        `}
      />

      {/* Stats container */}
      <div
        ref={scrollRef}
        className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 overflow-x-auto pb-2 hide-scrollbar snap-x snap-mandatory"
      >
        {stats.map((stat, index) => (
          <StatCard
            key={stat.config.id}
            config={stat.config}
            value={stat.value}
            previousValue={stat.previous}
            totalProducts={totalProducts}
            index={index}
            onClick={onCardClick ? () => onCardClick(stat.config.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}