"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
} from "lucide-react";

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
}

export default function ProductStats({
  totalProducts,
  inventoryValue,
  lowStockCount,
  outOfStockCount,
  previousPeriod,
  onCardClick,
}: ProductStatsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Check if scrollable
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

  // Calculate trends
  const getTrend = (current: number, previous?: number) => {
    if (previous === undefined) return null;
    const diff = current - previous;
    const percent = previous === 0 ? 0 : Math.round((diff / previous) * 100);
    return { diff, percent, isUp: diff > 0, isNeutral: diff === 0 };
  };

  const stats = [
    {
      id: "all",
      label: "Total Products",
      value: totalProducts,
      previous: previousPeriod?.totalProducts,
      icon: Package,
      color: "#25D366",
      bgColor: "bg-[#f0fdf4]",
      iconBg: "bg-[rgba(37,211,102,0.1)]",
      borderColor: "border-[#25D366]/20",
      hoverBorder: "hover:border-[#25D366]",
      trendColor: "text-[#25D366]",
    },
    {
      id: "inventory",
      label: "Inventory Value",
      value: inventoryValue,
      previous: previousPeriod?.inventoryValue,
      icon: DollarSign,
      color: "#3b82f6",
      bgColor: "bg-[#eff6ff]",
      iconBg: "bg-[rgba(59,130,246,0.1)]",
      borderColor: "border-[#3b82f6]/20",
      hoverBorder: "hover:border-[#3b82f6]",
      trendColor: "text-[#3b82f6]",
      isCurrency: true,
    },
    {
      id: "low",
      label: "Low Stock",
      value: lowStockCount,
      previous: previousPeriod?.lowStockCount,
      icon: AlertTriangle,
      color: "#f59e0b",
      bgColor: "bg-[#fffbeb]",
      iconBg: "bg-[rgba(245,158,11,0.1)]",
      borderColor: "border-[#f59e0b]/20",
      hoverBorder: "hover:border-[#f59e0b]",
      trendColor: "text-[#f59e0b]",
      isWarning: true,
    },
    {
      id: "out",
      label: "Out of Stock",
      value: outOfStockCount,
      previous: previousPeriod?.outOfStockCount,
      icon: CircleX,
      color: "#ef4444",
      bgColor: "bg-[#fef2f2]",
      iconBg: "bg-[rgba(239,68,68,0.1)]",
      borderColor: "border-[#ef4444]/20",
      hoverBorder: "hover:border-[#ef4444]",
      trendColor: "text-[#ef4444]",
      isWarning: true,
    },
  ];

  return (
    <div className="relative mb-6 md:mb-8">
      {/* Right scroll hint */}
      <div
        className={`
          absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full 
          bg-white/95 backdrop-blur-sm shadow-md border border-[#e2e8f0] 
          flex items-center justify-center text-[#64748b] 
          transition-all duration-300 md:hidden
          ${canScrollRight ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 pointer-events-none"}
        `}
      >
        <ChevronRight className="w-4 h-4" />
      </div>

      {/* Gradient fade */}
      <div
        className={`
          absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-white to-transparent 
          z-[5] pointer-events-none transition-opacity duration-300 md:hidden
          ${canScrollRight ? "opacity-100" : "opacity-0"}
        `}
      />

      {/* Stats container */}
      <div
        ref={scrollRef}
        className="flex gap-3 md:gap-4 overflow-x-auto pb-2 hide-scrollbar snap-x snap-mandatory"
      >
        {stats.map((stat) => {
          const trend = getTrend(stat.value, stat.previous);
          const isHovered = hoveredCard === stat.id;
          const TrendIcon = trend?.isUp ? TrendingUp : trend?.isNeutral ? Minus : TrendingDown;
          const showTrend = trend !== null && stat.previous !== undefined;

          return (
            <button
              key={stat.id}
              onClick={() => onCardClick?.(stat.id as "all" | "inventory" | "low" | "out")}
              onMouseEnter={() => setHoveredCard(stat.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`
                group relative flex-shrink-0 snap-start
                bg-white px-4 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl 
                border-2 transition-all duration-300 ease-out text-left
                min-w-[160px] md:min-w-0 md:flex-1
                ${stat.borderColor} ${stat.hoverBorder}
                ${isHovered ? "shadow-lg -translate-y-0.5" : "shadow-sm"}
                ${onCardClick ? "cursor-pointer active:scale-[0.98]" : "cursor-default"}
              `}
            >
              {/* Top row: Icon + Value */}
              <div className="flex items-start justify-between mb-2">
                <div
                  className={`
                    w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center transition-transform duration-300
                    ${stat.iconBg} ${isHovered ? "scale-110" : ""}
                  `}
                >
                  <stat.icon
                    className="w-5 h-5 md:w-5 md:h-5"
                    style={{ color: stat.color }}
                    strokeWidth={2.5}
                  />
                </div>

                {/* Trend indicator */}
                {showTrend && (
                  <div
                    className={`
                      flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full
                      ${trend.isUp ? "bg-[#f0fdf4] text-[#25D366]" : trend.isNeutral ? "bg-[#f8fafc] text-[#94a3b8]" : "bg-[#fef2f2] text-[#ef4444]"}
                    `}
                  >
                    <TrendIcon className="w-3 h-3" />
                    <span>{trend.percent > 0 ? "+" : ""}{trend.percent}%</span>
                  </div>
                )}
              </div>

              {/* Value */}
              <div className="mb-1">
                <span
                  className={`
                    text-xl md:text-2xl font-extrabold tracking-tight transition-colors
                    ${stat.isWarning && stat.value > 0 ? "text-[#ef4444]" : "text-[#1e293b]"}
                  `}
                >
                  {stat.isCurrency ? formatCurrency(stat.value) : stat.value.toLocaleString()}
                </span>
              </div>

              {/* Label */}
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm font-medium text-[#64748b]">
                  {stat.label}
                </span>

                {/* Click hint */}
                {onCardClick && (
                  <ChevronRight
                    className={`
                      w-3.5 h-3.5 text-[#94a3b8] transition-all duration-300
                      ${isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"}
                    `}
                  />
                )}
              </div>

              {/* Progress bar for warnings */}
              {stat.isWarning && stat.value > 0 && (
                <div className="mt-2 h-1 bg-[#f1f5f9] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${Math.min((stat.value / totalProducts) * 100, 100)}%`,
                      backgroundColor: stat.color,
                    }}
                  />
                </div>
              )}

              {/* Hover glow effect */}
              <div
                className={`
                  absolute inset-0 rounded-xl md:rounded-2xl pointer-events-none transition-opacity duration-300
                  ${isHovered ? "opacity-100" : "opacity-0"}
                `}
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${stat.color}08, transparent 70%)`,
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}