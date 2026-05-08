"use client";

import { useState, useEffect, useRef } from "react";
import { formatCurrency } from "@/lib/currency";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderStatsProps {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completionRate: string | number;
  previousPeriod?: {
    totalOrders?: number;
    totalRevenue?: number;
    pendingOrders?: number;
    completionRate?: string | number;
  };
  isLoading?: boolean;
}

interface StatCardProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string | number | React.ReactNode;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  delay?: number;
  isLoading?: boolean;
}

// ─── Animated Counter Hook ────────────────────────────────────────────────────

function useAnimatedCounter(target: number, duration: number = 1500, delay: number = 0) {
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
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
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

// ─── Circular Progress ────────────────────────────────────────────────────────

function CircularProgress({
  percentage,
  color,
  size = 36,
  strokeWidth = 3,
}: {
  percentage: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute text-[10px] font-bold" style={{ color }}>
        {Math.round(percentage)}%
      </span>
    </div>
  );
}

// ─── Trend Badge ──────────────────────────────────────────────────────────────

function TrendBadge({ value, label }: { value: number; label?: string }) {
  const isPositive = value >= 0;
  return (
    <div
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
        isPositive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
      }`}
    >
      <i className={`fas fa-arrow-${isPositive ? "up" : "down"} text-[8px]`} />
      {Math.abs(value)}%
      {label && <span className="font-normal opacity-70 ml-0.5">{label}</span>}
    </div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard({ delay }: { delay?: number }) {
  return (
    <div className="flex-shrink-0 bg-white px-4 py-4 rounded-xl border border-[#e2e8f0] flex items-center gap-3 min-w-[160px] animate-fadeIn" style={{ animationDelay: `${(delay || 0) * 0.1}s` }}>
      <div className="w-10 h-10 rounded-full bg-gray-200" />
      <div className="space-y-2">
        <div className="h-5 w-16 bg-gray-200 rounded" />
        <div className="h-3 w-20 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  subtitle,
  trend,
  trendLabel,
  delay = 0,
  isLoading,
}: StatCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (isLoading) return <SkeletonCard delay={delay} />;

  return (
    <div
      className="group relative flex-shrink-0 bg-white px-4 py-4 rounded-xl border border-[#e2e8f0] flex items-center gap-3 min-w-[160px] transition-all duration-300 hover:shadow-lg hover:border-[#25D366]/20 hover:-translate-y-0.5 cursor-default animate-fadeIn"
      style={{ animationDelay: `${delay * 0.1}s` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
          isHovered ? "scale-110 shadow-md" : ""
        }`}
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        <i className={`fas ${icon} text-sm`} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="font-extrabold text-lg text-[#1e293b] tracking-tight">{value}</div>
          {trend !== undefined && <TrendBadge value={trend} label={trendLabel} />}
        </div>
        <div className="text-xs text-[#64748b] font-medium">{label}</div>
        {subtitle && <div className="text-[10px] text-[#94a3b8] mt-0.5">{subtitle}</div>}
      </div>

      {/* Hover Glow */}
      <div
        className={`absolute inset-0 rounded-xl bg-gradient-to-br from-[${iconColor}]/5 to-transparent pointer-events-none transition-opacity duration-300 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OrderStats({
  totalOrders,
  totalRevenue,
  pendingOrders,
  completionRate,
  previousPeriod,
  isLoading = false,
}: OrderStatsProps) {
  // Parse completion rate
  const completionNum = typeof completionRate === "string" ? parseFloat(completionRate) : completionRate;

  // Calculate trends if previous period provided
  const orderTrend =
    previousPeriod?.totalOrders !== undefined
      ? Math.round(((totalOrders - previousPeriod.totalOrders) / Math.max(previousPeriod.totalOrders, 1)) * 100)
      : undefined;

  const revenueTrend =
    previousPeriod?.totalRevenue !== undefined
      ? Math.round(((totalRevenue - previousPeriod.totalRevenue) / Math.max(previousPeriod.totalRevenue, 1)) * 100)
      : undefined;

  const pendingTrend =
    previousPeriod?.pendingOrders !== undefined
      ? Math.round(((pendingOrders - previousPeriod.pendingOrders) / Math.max(previousPeriod.pendingOrders, 1)) * 100)
      : undefined;

  const completionTrend =
    previousPeriod?.completionRate !== undefined
      ? Math.round(
          (completionNum -
            (typeof previousPeriod.completionRate === "string"
              ? parseFloat(previousPeriod.completionRate)
              : previousPeriod.completionRate))
        )
      : undefined;

  // Animated values
  const animatedOrders = useAnimatedCounter(totalOrders, 1500, 0);
  const animatedRevenue = useAnimatedCounter(Math.floor(totalRevenue), 1500, 100);
  const animatedPending = useAnimatedCounter(pendingOrders, 1500, 200);

  const stats = [
    {
      icon: "fa-shopping-bag",
      iconColor: "#25D366",
      iconBg: "rgba(37,211,102,0.1)",
      label: "Total Orders",
      value: animatedOrders.toLocaleString(),
      rawValue: totalOrders,
      subtitle: "All time orders",
      trend: orderTrend,
      trendLabel: "vs last period",
    },
    {
      icon: "fa-dollar-sign",
      iconColor: "#3b82f6",
      iconBg: "rgba(59,130,246,0.1)",
      label: "Total Revenue",
      value: formatCurrency(animatedRevenue),
      rawValue: totalRevenue,
      subtitle: "Lifetime earnings",
      trend: revenueTrend,
      trendLabel: "vs last period",
    },
    {
      icon: "fa-clock",
      iconColor: "#f59e0b",
      iconBg: "rgba(245,158,11,0.1)",
      label: "Pending",
      value: animatedPending.toString(),
      rawValue: pendingOrders,
      subtitle: "Awaiting action",
      trend: pendingTrend,
      trendLabel: "vs last period",
    },
    {
      icon: "fa-check-circle",
      iconColor: "#10b981",
      iconBg: "rgba(16,185,129,0.1)",
      label: "Completion",
      value: (
        <div className="flex items-center gap-2">
          <span>{completionRate}%</span>
          <CircularProgress percentage={completionNum} color="#10b981" size={32} strokeWidth={3} />
        </div>
      ),
      rawValue: completionRate,
      subtitle: "Delivery success rate",
      trend: completionTrend,
      trendLabel: "vs last period",
    },
  ];

  return (
    <div className="mb-6 animate-fadeIn">
      {/* Stats Grid */}
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide -mx-1 px-1 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
        {stats.map((stat, index) => (
          <StatCard
            key={stat.label}
            icon={stat.icon}
            iconColor={stat.iconColor}
            iconBg={stat.iconBg}
            label={stat.label}
            value={stat.value}
            subtitle={stat.subtitle}
            trend={stat.trend}
            trendLabel={stat.trendLabel}
            delay={index * 100}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Mini Progress Bar (Overall Health) */}
      {!isLoading && (
        <div className="mt-2 px-1 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between text-[10px] text-[#64748b] mb-1.5">
            <span className="font-semibold">Order Processing Health</span>
            <span>{completionRate}% completion rate</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out relative"
              style={{
                width: `${completionNum}%`,
                background: "linear-gradient(90deg, #25D366, #128C7E)",
              }}
            >
              <div className="absolute inset-0 bg-white/20 animate-shimmer" />
            </div>
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-[#94a3b8]">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      )}
    </div>
  );
}