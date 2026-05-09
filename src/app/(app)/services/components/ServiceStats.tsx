"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Layers,
  CalendarCheck,
  DollarSign,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceStatsProps {
  totalServices: number;
  totalBookings: number;
  totalRevenue: number;
  averageRating: string;
  previousPeriod?: {
    totalServices?: number;
    totalBookings?: number;
    totalRevenue?: number;
    averageRating?: string;
  };
  onCardClick?: (type: "services" | "bookings" | "revenue" | "rating") => void;
  isLoading?: boolean;
}

interface StatConfig {
  id: "services" | "bookings" | "revenue" | "rating";
  label: string;
  icon: React.ElementType;
  color: string;
  bgGradient: string;
  iconBg: string;
  ringColor: string;
  isCurrency?: boolean;
  isRating?: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATS_CONFIG: StatConfig[] = [
  {
    id: "services",
    label: "Total Services",
    icon: Layers,
    color: "#8b5cf6",
    bgGradient: "from-[#8b5cf6]/10 via-[#8b5cf6]/5 to-transparent",
    iconBg: "bg-[#8b5cf6]/12",
    ringColor: "ring-[#8b5cf6]/30",
  },
  {
    id: "bookings",
    label: "Total Bookings",
    icon: CalendarCheck,
    color: "#10b981",
    bgGradient: "from-[#10b981]/10 via-[#10b981]/5 to-transparent",
    iconBg: "bg-[#10b981]/12",
    ringColor: "ring-[#10b981]/30",
  },
  {
    id: "revenue",
    label: "Revenue",
    icon: DollarSign,
    color: "#3b82f6",
    bgGradient: "from-[#3b82f6]/10 via-[#3b82f6]/5 to-transparent",
    iconBg: "bg-[#3b82f6]/12",
    ringColor: "ring-[#3b82f6]/30",
    isCurrency: true,
  },
  {
    id: "rating",
    label: "Avg Rating",
    icon: Star,
    color: "#f59e0b",
    bgGradient: "from-[#f59e0b]/10 via-[#f59e0b]/5 to-transparent",
    iconBg: "bg-[#f59e0b]/12",
    ringColor: "ring-[#f59e0b]/30",
    isRating: true,
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
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(target * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
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
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-[#f1f5f9]" />
        <div className="h-5 bg-[#f1f5f9] rounded-full w-14" />
      </div>
      <div className="h-8 bg-[#f1f5f9] rounded-lg w-28 mb-2" />
      <div className="h-1.5 bg-[#f1f5f9] rounded-full w-full" />
    </div>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((val - min) / range) * 100;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg className="w-full h-8 mt-2" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.3"
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatCard({
  config,
  value,
  previousValue,
  index,
  onClick,
  isActive,
}: {
  config: StatConfig;
  value: number | string;
  previousValue?: number | string;
  index: number;
  onClick?: () => void;
  isActive?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const numericValue = typeof value === "number" ? value : parseFloat(String(value)) || 0;
  const animatedValue = useAnimatedCounter(numericValue, 1200, index * 100);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 80);
    return () => clearTimeout(timer);
  }, [index]);

  const trend = useMemo(() => {
    if (previousValue === undefined) return null;
    const numericPrev = typeof previousValue === "number" ? previousValue : parseFloat(String(previousValue)) || 0;
    const diff = numericValue - numericPrev;
    const percent = numericPrev === 0 ? 0 : Math.round((diff / numericPrev) * 100);
    return { diff, percent, isUp: diff > 0, isNeutral: diff === 0 };
  }, [numericValue, previousValue]);

  const TrendIcon = trend?.isUp ? TrendingUp : trend?.isNeutral ? Minus : TrendingDown;
  const showTrend = trend !== null && previousValue !== undefined;

  const displayValue = config.isCurrency
    ? `KES ${animatedValue.toLocaleString()}`
    : config.isRating
    ? animatedValue.toFixed(1)
    : animatedValue.toLocaleString();

  // Mini sparkline data (simulated trend based on current value)
  const sparkData = useMemo(() => {
    const base = numericValue * 0.8;
    return Array.from({ length: 7 }, (_, i) => base + (numericValue - base) * (i / 6) + Math.random() * numericValue * 0.1);
  }, [numericValue]);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      className={`
        group relative flex-shrink-0 snap-start
        px-4 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl 
        border-2 transition-all duration-300 ease-out text-left overflow-hidden
        min-w-[160px] md:min-w-0 md:flex-1
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        ${isActive
          ? `ring-2 ${config.ringColor} border-[${config.color}]/40 shadow-lg`
          : "border-[#e2e8f0] hover:border-[#cbd5e1]"
        }
        ${isHovered ? "shadow-lg shadow-black/5 -translate-y-0.5" : "shadow-sm"}
        ${isPressed ? "scale-[0.98]" : "scale-100"}
        ${onClick ? "cursor-pointer" : "cursor-default"}
        bg-gradient-to-br ${config.bgGradient}
      `}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {/* Top accent line */}
      <div
        className={`
          absolute top-0 left-4 right-4 h-[2px] rounded-full transition-all duration-500
          ${isHovered || isActive ? "opacity-100" : "opacity-0"}
        `}
        style={{ backgroundColor: config.color }}
      />

      {/* Icon + Trend */}
      <div className="flex items-start justify-between mb-2.5">
        <div className={`
          w-10 h-10 md:w-11 md:h-11 rounded-xl ${config.iconBg} flex items-center justify-center
          transition-all duration-300
          ${isHovered ? "scale-110 shadow-sm" : "scale-100"}
        `}>
          <config.icon className="w-5 h-5 md:w-6 md:h-6" style={{ color: config.color }} />
        </div>

        {showTrend && (
          <div className={`
            flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold
            ${trend.isNeutral
              ? "bg-[#f1f5f9] text-[#64748b]"
              : trend.isUp
                ? "bg-[#10b981]/10 text-[#10b981]"
                : "bg-[#ef4444]/10 text-[#ef4444]"
            }
          `}>
            <TrendIcon className="w-3 h-3" />
            <span>{Math.abs(trend.percent)}%</span>
          </div>
        )}

        {onClick && !showTrend && (
          <div className={`
            w-6 h-6 rounded-full flex items-center justify-center
            transition-all duration-200 opacity-0
            ${isHovered ? "opacity-100" : "opacity-0"}
          `} style={{ backgroundColor: `${config.color}15` }}>
            <ArrowUpRight className="w-3 h-3" style={{ color: config.color }} />
          </div>
        )}
      </div>

      {/* Value */}
      <div className={`
        font-extrabold text-xl md:text-2xl text-[#1e293b] mb-1 truncate
        transition-transform duration-300
        ${isHovered ? "scale-[1.02]" : "scale-100"}
      `}>
        {displayValue}
      </div>

      {/* Label */}
      <div className="text-[11px] md:text-xs text-[#64748b] font-semibold uppercase tracking-wider mb-2">
        {config.label}
      </div>

      {/* Sparkline */}
      <Sparkline data={sparkData} color={config.color} />

      {/* Progress bar (percentage of some max) */}
      <div className="mt-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[9px] text-[#94a3b8] font-medium">Performance</span>
          <span className={`
            text-[9px] font-bold opacity-0 transition-opacity duration-200
            ${isHovered ? "opacity-100" : "opacity-0"}
          `} style={{ color: config.color }}>
            {Math.min(Math.round((numericValue / (config.isRating ? 5 : Math.max(numericValue * 1.5, 100))) * 100), 100)}%
          </span>
        </div>
        <div className="h-1 bg-[#e2e8f0] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: isVisible ? `${Math.min(Math.round((numericValue / (config.isRating ? 5 : Math.max(numericValue * 1.5, 100))) * 100), 100)}%` : "0%",
              backgroundColor: config.color,
              opacity: 0.4,
            }}
          />
        </div>
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ServiceStats({
  totalServices,
  totalBookings,
  totalRevenue,
  averageRating,
  previousPeriod,
  onCardClick,
  isLoading = false,
}: ServiceStatsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeCard, setActiveCard] = useState<string | null>(null);

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
      { config: STATS_CONFIG[0], value: totalServices, previous: previousPeriod?.totalServices },
      { config: STATS_CONFIG[1], value: totalBookings, previous: previousPeriod?.totalBookings },
      { config: STATS_CONFIG[2], value: totalRevenue, previous: previousPeriod?.totalRevenue },
      { config: STATS_CONFIG[3], value: parseFloat(averageRating), previous: previousPeriod?.averageRating },
    ],
    [totalServices, totalBookings, totalRevenue, averageRating, previousPeriod]
  );

  const handleCardClick = useCallback((id: "services" | "bookings" | "revenue" | "rating") => {
    setActiveCard((prev) => prev === id ? null : id);
    onCardClick?.(id);
  }, [onCardClick]);

  if (isLoading) {
    return (
      <div className="relative mb-6 md:mb-8 px-0">
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 hide-scrollbar snap-x snap-mandatory">
          {Array.from({ length: 4 }).map((_, i) => (
            <ShimmerCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative mb-6 md:mb-8 px-0">
      {/* Right scroll hint */}
      <button
        onClick={() => scrollRef.current?.scrollBy({ left: 200, behavior: "smooth" })}
        className={`
          absolute right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full 
          bg-white/95 backdrop-blur-md shadow-lg border border-[#e2e8f0] 
          flex items-center justify-center text-[#64748b] hover:text-[#8b5cf6] hover:border-[#8b5cf6]
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
        className="flex gap-3 md:gap-4 overflow-x-auto pb-2 hide-scrollbar snap-x snap-mandatory"
      >
        {stats.map((stat, index) => (
          <StatCard
            key={stat.config.id}
            config={stat.config}
            value={stat.value}
            previousValue={stat.previous}
            index={index}
            onClick={onCardClick ? () => handleCardClick(stat.config.id) : undefined}
            isActive={activeCard === stat.config.id}
          />
        ))}
      </div>
    </div>
  );
}