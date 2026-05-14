"use client";

import { useState, useEffect, useRef } from "react";
import {
  Box,
  Download,
  Upload,
  CheckSquare,
  Plus,
  Layers,
  TrendingUp,
  Package,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductsHeaderProps {
  productsCount: number;
  totalInventoryValue: number;
  bulkMode: boolean;
  setBulkMode: (mode: boolean) => void;
  setAddProductModalOpen: (open: boolean) => void;
  exportProducts: () => void;
  importProducts: (event: React.ChangeEvent<HTMLInputElement>) => void;
  lowStockCount?: number;
  outOfStockCount?: number;
}

// ─── Animated Counter Hook ────────────────────────────────────────────────────

function useAnimatedCounter(target: number, duration: number = 800) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const timer = setTimeout(() => setHasStarted(true), 100);
    return () => clearTimeout(timer);
  }, []);

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

function StatPill({
  icon: Icon,
  value,
  label,
  color,
  delay = 0,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  color: "green" | "amber" | "red" | "blue";
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const animatedValue = useAnimatedCounter(value);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const colorMap = {
    green: "text-[#10b981] bg-[#10b981]/10 border-[#10b981]/20",
    amber: "text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20",
    red: "text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20",
    blue: "text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/20",
  };

  return (
    <div
      className={`
        flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold
        transition-all duration-300
        ${colorMap[color]}
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <Icon className="w-3 h-3" />
      <span>{animatedValue.toLocaleString()}</span>
      <span className="opacity-70 font-medium">{label}</span>
    </div>
  );
}

function HeaderButton({
  onClick,
  icon: Icon,
  label,
  variant = "default",
  isActive = false,
  asLabel = false,
  children,
}: {
  onClick?: () => void;
  icon: React.ElementType;
  label: string;
  variant?: "default" | "primary" | "danger";
  isActive?: boolean;
  asLabel?: boolean;
  children?: React.ReactNode;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const variants = {
    default: isActive
      ? "bg-[#25D366] text-white shadow-lg shadow-[#25D366]/25 border-transparent"
      : "bg-white border-2 border-[#e2e8f0] text-[#64748b] hover:border-[#25D366] hover:text-[#128C7E] hover:shadow-md hover:-translate-y-0.5",
    primary: "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white shadow-lg shadow-[#25D366]/25 hover:shadow-[#25D366]/40 hover:-translate-y-0.5 border-transparent",
    danger: "bg-white border-2 border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444] hover:text-white hover:border-[#ef4444]",
  };

  const Component = asLabel ? "label" : "button";

  return (
    <Component
      onClick={!asLabel ? onClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      className={`
        flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-xl font-semibold text-sm
        transition-all duration-200 active:scale-95 shrink-0 cursor-pointer
        ${variants[variant]}
        ${isPressed ? "scale-95" : "scale-100"}
      `}
    >
      <Icon
        className={`
          w-4 h-4 transition-transform duration-200
          ${isHovered && !isActive ? "scale-110" : "scale-100"}
        `}
      />
      <span>{label}</span>
      {children}
    </Component>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductsHeader({
  productsCount,
  totalInventoryValue,
  bulkMode,
  setBulkMode,
  setAddProductModalOpen,
  exportProducts,
  importProducts,
  lowStockCount = 0,
  outOfStockCount = 0,
}: ProductsHeaderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const animatedCount = useAnimatedCounter(productsCount);
  const animatedValue = useAnimatedCounter(Math.round(totalInventoryValue));

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <header
      className={`
        sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-[#e2e8f0]
        transition-all duration-500
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}
      `}
    >
      {/* FIXED: Removed mx-auto - now full width with proper padding */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-3 md:py-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 md:gap-4">
          {/* Left: Title + Stats - NOW LEFT ALIGNED */}
          <div className="flex items-center gap-3 md:gap-4 w-full lg:w-auto">
            {/* Icon container with pulse */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center shadow-lg shadow-[#25D366]/20">
                <Box className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              {/* Pulse ring */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] animate-ping opacity-20" />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-lg md:text-xl font-extrabold text-[#1e293b] tracking-tight">
                Products
              </h1>

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs text-[#94a3b8]">
                  {animatedCount.toLocaleString()} items
                </span>
                <span className="text-[#e2e8f0]">·</span>
                <span
                  className="text-xs text-[#94a3b8] font-medium"
                  title={`KES ${totalInventoryValue.toLocaleString()}`}
                >
                  KES {animatedValue.toLocaleString()} value
                </span>

                {/* Stock alerts */}
                {lowStockCount > 0 && (
                  <StatPill
                    icon={Package}
                    value={lowStockCount}
                    label="low"
                    color="amber"
                    delay={200}
                  />
                )}
                {outOfStockCount > 0 && (
                  <StatPill
                    icon={Package}
                    value={outOfStockCount}
                    label="out"
                    color="red"
                    delay={300}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions - NOW RIGHT ALIGNED */}
          <div
            className={`
              flex items-center gap-2 w-full lg:w-auto overflow-x-auto hide-scrollbar pb-1 lg:pb-0 snap-x snap-mandatory
              transition-all duration-500 justify-start lg:justify-end
              ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"}
            `}
            style={{ transitionDelay: "200ms" }}
          >
            {/* Export */}
            <div className="snap-start">
              <HeaderButton
                onClick={exportProducts}
                icon={Download}
                label="Export"
              />
            </div>

            {/* Import */}
            <div className="snap-start">
              <label
                className={`
                  flex items-center gap-2 px-3 md:px-4 py-2.5 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm text-[#64748b] hover:border-[#25D366] hover:text-[#128C7E] hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-95 shrink-0 cursor-pointer
                `}
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Import</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={importProducts}
                  className="hidden"
                />
              </label>
            </div>

            {/* Bulk toggle */}
            <div className="snap-start">
              <HeaderButton
                onClick={() => setBulkMode(!bulkMode)}
                icon={CheckSquare}
                label={bulkMode ? "Done" : "Bulk"}
                isActive={bulkMode}
              />
            </div>

            {/* Add product */}
            <div className="snap-start">
              <HeaderButton
                onClick={() => setAddProductModalOpen(true)}
                icon={Plus}
                label="Add Product"
                variant="primary"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}