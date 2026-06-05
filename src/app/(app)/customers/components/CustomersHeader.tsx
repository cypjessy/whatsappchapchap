"use client";

import { useState, useEffect } from "react";
import PageHeaderCard from "@/components/PageHeaderCard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomersHeaderProps {
  bulkMode: boolean;
  onToggleBulkMode: () => void;
  onExportCSV: () => void;
  onAddCustomer: () => void;
  customerCount?: number;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(value * eased));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{count.toLocaleString()}</span>;
}

function ActionButton({
  onClick,
  icon,
  label,
  variant = "default",
  isActive = false,
  isLoading = false,
  disabled = false,
  mobileLabel,
}: {
  onClick: () => void;
  icon: string;
  label: string;
  variant?: "default" | "primary" | "danger" | "ghost";
  isActive?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  mobileLabel?: string;
}) {
  const [isPressed, setIsPressed] = useState(false);

  const variants = {
    default: `
      bg-surface border-2 border-outline-variant text-on-surface-variant
      hover:border-[#25D366] hover:text-[#128C7E] hover:shadow-md hover:-translate-y-0.5
      active:scale-95
    `,
    primary: `
      bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white border-0
      shadow-lg shadow-[#25D366]/20 hover:shadow-xl hover:shadow-[#25D366]/30
      hover:-translate-y-0.5 active:scale-95
    `,
    danger: `
      bg-[#ef4444] text-white border-0
      shadow-lg shadow-[#ef4444]/20 hover:shadow-xl hover:shadow-[#ef4444]/30
      hover:-translate-y-0.5 active:scale-95
    `,
    ghost: `
      bg-transparent border-2 border-outline-variant text-on-surface-variant
      hover:border-[#64748b] hover:text-on-surface
    `,
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      className={`
        relative flex-1 md:flex-none flex items-center justify-center gap-2 
        px-3 md:px-4 py-2.5 rounded-xl font-semibold text-xs md:text-sm
        transition-all duration-200 overflow-hidden snap-start shrink-0
        ${isPressed ? "scale-95" : "scale-100"}
        ${isActive ? "ring-2 ring-offset-2 ring-[#25D366]" : ""}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${variants[variant]}
      `}
      aria-label={label}
    >
      <span className="relative z-10 flex items-center gap-2">
        {isLoading ? (
          <i className="fas fa-circle-notch fa-spin text-xs" />
        ) : (
          <i className={`fas ${icon} text-xs`} />
        )}
        <span className="hidden sm:inline">{label}</span>
        {mobileLabel && <span className="sm:hidden">{mobileLabel}</span>}
        {!mobileLabel && <span className="sm:hidden">{label}</span>}
      </span>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CustomersHeader({
  bulkMode,
  onToggleBulkMode,
  onExportCSV,
  onAddCustomer,
  customerCount,
}: CustomersHeaderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExportCSV();
    } finally {
      setTimeout(() => setIsExporting(false), 500);
    }
  };

  return (
    <PageHeaderCard className="mb-4 md:mb-6">
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 transition-all duration-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        {/* Left: Title + Stats */}
        <div className="flex items-center gap-3 md:gap-4 min-w-0 w-full md:w-auto">
          {/* Premium gradient icon with glow */}
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] blur-md opacity-30 animate-pulse" />
            <div className="relative w-11 h-11 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white shadow-lg shadow-[#25D366]/20">
              <i className="fas fa-users text-base md:text-lg" />
            </div>
          </div>

          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl lg:text-[1.625rem] font-extrabold text-on-surface tracking-tight flex items-center gap-2.5">
              <span>Customers</span>
              {customerCount !== undefined && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-variant text-on-surface-variant text-xs font-bold ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"} transition-all duration-500 delay-200`}>
                  <AnimatedCounter value={customerCount} />
                </span>
              )}
            </h1>
            <p className="text-xs md:text-sm text-outline font-medium mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse mr-1.5 align-middle" />
              Build relationships and grow your business
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto hide-scrollbar pb-0.5 md:pb-0 snap-x">
          <ActionButton
            onClick={handleExport}
            icon="fa-download"
            label="Export CSV"
            mobileLabel=""
            isLoading={isExporting}
          />

          <ActionButton
            onClick={onToggleBulkMode}
            icon={bulkMode ? "fa-times" : "fa-check-square"}
            label={bulkMode ? "Done" : "Bulk"}
            variant={bulkMode ? "danger" : "default"}
            isActive={bulkMode}
            mobileLabel={bulkMode ? "Done" : "Bulk"}
          />

          <ActionButton
            onClick={onAddCustomer}
            icon="fa-user-plus"
            label="Add Customer"
            variant="primary"
            mobileLabel="Add"
          />
        </div>
      </div>
    </PageHeaderCard>
  );
}
