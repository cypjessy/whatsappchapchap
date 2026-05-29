"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { dashboardService } from "@/lib/dashboard";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts";
import { MobileSalesChart } from "./MobileSalesChart";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SalesData {
  date: string;
  sales: number;
  orders?: number;
  fullDate?: string;
}

type Period = "7d" | "30d" | "90d" | "1y";

interface PeriodConfig {
  label: string;
  days: number;
}

interface SalesChartProps {
  refreshTrigger?: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PERIODS: Record<Period, PeriodConfig> = {
  "7d": { label: "7 Days", days: 7 },
  "30d": { label: "30 Days", days: 30 },
  "90d": { label: "3 Months", days: 90 },
  "1y": { label: "1 Year", days: 365 },
};

const CHART_COLORS = {
  primary: "#25D366",
  primaryLight: "rgba(37, 211, 102, 0.1)",
  grid: "#E2E8F0",
  text: "#64748B",
  tooltipBg: "#FFFFFF",
  tooltipBorder: "#E2E8F0",
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  if (value >= 1000) return `KES ${(value / 1000).toFixed(1)}k`;
  return `KES ${value}`;
}

function generateMockData(period: Period): SalesData[] {
  const configs = {
    "7d": [
      { date: "Mon", sales: 12000, orders: 8 },
      { date: "Tue", sales: 19000, orders: 12 },
      { date: "Wed", sales: 15000, orders: 10 },
      { date: "Thu", sales: 22000, orders: 15 },
      { date: "Fri", sales: 28000, orders: 18 },
      { date: "Sat", sales: 35000, orders: 22 },
      { date: "Sun", sales: 31000, orders: 20 },
    ],
    "30d": [
      { date: "W1", sales: 85000, orders: 55 },
      { date: "W2", sales: 92000, orders: 60 },
      { date: "W3", sales: 78000, orders: 50 },
      { date: "W4", sales: 105000, orders: 68 },
    ],
    "90d": [
      { date: "Jan", sales: 280000, orders: 180 },
      { date: "Feb", sales: 320000, orders: 210 },
      { date: "Mar", sales: 290000, orders: 195 },
    ],
    "1y": [
      { date: "Q1", sales: 890000, orders: 585 },
      { date: "Q2", sales: 1050000, orders: 680 },
      { date: "Q3", sales: 980000, orders: 640 },
      { date: "Q4", sales: 1200000, orders: 780 },
    ],
  };
  return configs[period];
}

// ─── Animated Counter Hook ───────────────────────────────────────────────────

function useAnimatedCounter(target: number, duration: number = 1500) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHasStarted(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hasStarted) return;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(target * eased));

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [hasStarted, target, duration]);

  return count;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ShimmerChart() {
  return (
    <div className="relative overflow-hidden h-[220px] md:h-[320px] w-full bg-gradient-to-b from-[var(--md-sys-color-surface)] to-[var(--md-sys-color-surface-variant)] rounded-2xl">
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-[var(--md-sys-color-surface)]/60 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4 h-32 bg-[var(--md-sys-color-surface-variant)]/50 rounded-lg" />
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2 h-32">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex-1 bg-[var(--md-sys-color-surface-variant)]/70 rounded-t-lg animate-pulse"
            style={{ height: `${30 + Math.random() * 60}%`, animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  prefix = "",
  suffix = "",
  icon,
  color,
  delay = 0,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: string;
  color: string;
  delay?: number;
}) {
  const animatedValue = useAnimatedCounter(value);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`
        bg-surface rounded-2xl p-3 md:p-4 border-2 border-outline
        transition-all duration-200
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <i className={`fas ${icon} ${color} text-xs`} />
        <span className="text-[10px] font-semibold text-outline uppercase tracking-wide">{label}</span>
      </div>
      <div className={`font-bold text-lg md:text-xl ${color}`}>
        {prefix}{animatedValue.toLocaleString()}{suffix}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-surface rounded-xl border border-outline-variant shadow-md shadow-black/5 p-3 min-w-[140px]">
      <div className="text-[11px] font-semibold text-outline uppercase tracking-wide mb-2">
        {label}
      </div>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs font-medium text-on-surface-variant">
              {entry.name === "sales" ? "Sales" : "Orders"}
            </span>
          </div>
          <span className="text-sm font-bold text-on-surface">
            {entry.name === "sales" ? formatCurrency(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SalesChart({ refreshTrigger }: SalesChartProps) {
  const { user } = useAuth();
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("7d");
  const [isVisible, setIsVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [chartReady, setChartReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => setChartReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Resize observer to handle container size changes
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && !chartReady) {
          setChartReady(true);
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [chartReady]);

  useEffect(() => {
    const loadSalesData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Simulate API call with period
        await new Promise((resolve) => setTimeout(resolve, 600));
        const data = generateMockData(period);
        setSalesData(data);
      } catch (error) {
        console.error("Error loading sales data:", error);
        setSalesData([]);
      } finally {
        setLoading(false);
      }
    };
    loadSalesData();
  }, [user, period, refreshTrigger]);

  const totalSales = salesData.reduce((sum, d) => sum + d.sales, 0);
  const totalOrders = salesData.reduce((sum, d) => sum + (d.orders || 0), 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;
  const maxSales = Math.max(...salesData.map((d) => d.sales), 0);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const csvContent = [
        ["Date", "Sales", "Orders"],
        ...salesData.map((d) => [d.date, d.sales, d.orders || 0]),
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `sales_${period}_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
    } finally {
      setTimeout(() => setIsExporting(false), 500);
    }
  }, [salesData, period]);

  return (
    <div
      className={`        bg-surface rounded-2xl border-2 border-outline shadow-md overflow-hidden
      transition-all duration-300
      ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
    `}
  >
      {/* Header - Physical card styling */}
      <div className="p-4 md:p-5 border-b-2 border-outline bg-surface-container-low">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E8F5E9] flex items-center justify-center">
              <i className="fas fa-chart-line text-[#25D366] text-sm" />
            </div>
            <div>
              <h3 className="font-semibold text-sm md:text-base text-on-surface">Sales Analytics</h3>
              <span className="text-[10px] text-outline font-medium">
                {PERIODS[period].label} overview
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Period selector - MD3 segmented buttons */}
            <div className="flex bg-surface-variant rounded-xl p-1">
              {(Object.keys(PERIODS) as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`
                    px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200
                    ${period === p
                      ? "bg-surface text-on-surface shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                    }
                  `}
                >
                  {PERIODS[p].label}
                </button>
              ))}
            </div>

            {/* Actions */}
            <button
              onClick={handleExport}
              disabled={isExporting || loading || salesData.length === 0}
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200
                ${isExporting
                  ? "bg-surface-variant text-[#8b5cf6]"
                  : "text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
                }
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
              title="Export CSV"
              aria-label="Export CSV"
            >
              {isExporting ? (
                <i className="fas fa-circle-notch fa-spin text-xs" />
              ) : (
                <i className="fas fa-download text-xs" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      {!loading && salesData.length > 0 && (
        <div className="grid grid-cols-3 gap-2 md:gap-3 p-3 md:p-4 border-b-2 border-outline">
          <StatCard
            label="Total Sales"
            value={totalSales}
            prefix="KES "
            icon="fa-wallet"
            color="text-[#25D366]"
            delay={0}
          />
          <StatCard
            label="Orders"
            value={totalOrders}
            icon="fa-shopping-bag"
            color="text-[#3b82f6]"
            delay={100}
          />
          <StatCard
            label="Avg Order"
            value={avgOrderValue}
            prefix="KES "
            icon="fa-chart-line"
            color="text-[#8b5cf6]"
            delay={200}
          />
        </div>
      )}

      {/* Chart Area */}
      <div className="p-2 md:p-4">
        {loading ? (
          <ShimmerChart />
        ) : salesData.length === 0 ? (
          <div className="h-[220px] md:h-[320px] flex flex-col items-center justify-center text-on-surface-variant animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0] flex items-center justify-center mb-3 shadow-inner">
              <i className="fas fa-chart-bar text-xl text-[#cbd5e1]" />
            </div>
            <p className="font-semibold text-sm">No sales data</p>
            <p className="text-xs text-outline mt-1">Start making sales to see analytics</p>
          </div>
        ) : (
          <>
            {/* Mobile Chart (Canvas-based) - shown on screens < 768px */}
            <div className="block md:hidden">
              <MobileSalesChart data={salesData} height={200} />
            </div>
            {/* Desktop Chart (Recharts) - shown on screens >= 768px */}
            <div className="hidden md:block">
              <div
                ref={containerRef}
                className="h-[320px] w-full relative min-h-[320px] min-w-[300px]"
              >
                {chartReady && (
                  <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={320}>
                    <AreaChart
                      data={salesData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={CHART_COLORS.grid}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        stroke={CHART_COLORS.text}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis
                        stroke={CHART_COLORS.text}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => formatCurrency(value)}
                        dx={-5}
                        width={60}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: CHART_COLORS.primary, strokeWidth: 1, strokeDasharray: "4 4" }} />
                      <ReferenceLine
                        y={maxSales}
                        stroke={CHART_COLORS.primary}
                        strokeDasharray="6 6"
                        strokeOpacity={0.3}
                        label={{
                          value: "Peak",
                          position: "right",
                          fill: CHART_COLORS.primary,
                          fontSize: 10,
                          fontWeight: "bold",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke={CHART_COLORS.primary}
                        strokeWidth={2.5}
                        fill="url(#salesGradient)"
                        activeDot={{
                          r: 6,
                          stroke: "#fff",
                          strokeWidth: 3,
                          fill: CHART_COLORS.primary,
                        }}
                        dot={{
                          fill: CHART_COLORS.primary,
                          stroke: "#fff",
                          strokeWidth: 2,
                          r: 4,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}