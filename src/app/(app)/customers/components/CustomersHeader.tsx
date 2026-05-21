"use client";

import { useState, useEffect } from "react";

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
  mobileLabel,
  variant = "default",
  isActive = false,
  isLoading = false,
  disabled = false,
}: {
  onClick: () => void;
  icon: string;
  label: string;
  mobileLabel?: string;
  variant?: "default" | "primary" | "danger" | "ghost";
  isActive?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
}) {
  const [isPressed, setIsPressed] = useState(false);

  const variants = {
    default: `
      bg-surface border-2 border-outline-variant text-on-surface-variant
      hover:border-[#8b5cf6] hover:text-[#8b5cf6] hover:bg-[#f5f3ff]
      active:bg-[#ede9fe]
    `,
    primary: `
      bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white border-0
      shadow-md3-level3 shadow-[#25D366]/20 hover:shadow-md3-level4 hover:shadow-[#25D366]/30
      hover:-translate-y-0.5 active:translate-y-0
    `,
    danger: `
      bg-[#ef4444] text-white border-0
      shadow-md3-level3 shadow-[#ef4444]/20 hover:shadow-md3-level4 hover:shadow-[#ef4444]/30
      hover:-translate-y-0.5 active:translate-y-0
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
        px-3 md:px-4 py-2.5 rounded-xl font-semibold text-sm
        transition-all duration-200 overflow-hidden
        ${isPressed ? "scale-95" : "scale-100"}
        ${isActive ? "ring-2 ring-offset-2 ring-[#8b5cf6]" : ""}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${variants[variant]}
      `}
      aria-label={label}
    >
      {/* Ripple effect container */}
      <span className="absolute inset-0 overflow-hidden rounded-xl">
        {isPressed && (
          <span className="absolute inset-0 bg-black/5 animate-pulse" />
        )}
      </span>

      <span className="relative z-10 flex items-center gap-2">
        {isLoading ? (
          <i className="fas fa-circle-notch fa-spin text-sm" />
        ) : (
          <i className={`fas ${icon} text-xs md:text-sm`} />
        )}
        <span className="hidden md:inline">{label}</span>
        {mobileLabel && <span className="md:hidden">{mobileLabel}</span>}
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
    <div className={`
      flex flex-col md:flex-row justify-between items-start md:items-center 
      mb-4 md:mb-6 gap-3 md:gap-4
      transition-all duration-500 ease-out
      ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}
    `}>
      {/* Title Section */}
      <div className="min-w-0">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-on-surface flex items-center gap-2.5 md:gap-3">
          <div className={`
            w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10 
            flex items-center justify-center shrink-0
            ${isVisible ? "scale-100 rotate-0" : "scale-0 -rotate-180"}
            transition-all duration-500 delay-100
          `}>
            <i className="fas fa-users text-[#25D366] text-sm md:text-base" />
          </div>
          <span className="truncate">Customers</span>
          {customerCount !== undefined && (
            <span className={`
              hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full 
              bg-surface-variant text-on-surface-variant text-xs font-bold
              ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"}
              transition-all duration-500 delay-200
            `}>
              <AnimatedCounter value={customerCount} />
            </span>
          )}
        </h1>
        <p className={`
          text-on-surface-variant text-sm mt-1 hidden md:block
          ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}
          transition-all duration-500 delay-200
        `}>
          Build relationships and grow your business
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 w-full md:w-auto">
        <ActionButton
          onClick={handleExport}
          icon="fa-download"
          label="Export CSV"
          mobileLabel="Export"
          isLoading={isExporting}
        />

        <ActionButton
          onClick={onToggleBulkMode}
          icon={bulkMode ? "fa-times" : "fa-check-square"}
          label={bulkMode ? "Cancel" : "Select"}
          mobileLabel={bulkMode ? "Cancel" : "Select"}
          variant={bulkMode ? "danger" : "default"}
          isActive={bulkMode}
        />

        <ActionButton
          onClick={onAddCustomer}
          icon="fa-user-plus"
          label="Add Customer"
          mobileLabel="+"
          variant="primary"
        />
      </div>
    </div>
  );
}