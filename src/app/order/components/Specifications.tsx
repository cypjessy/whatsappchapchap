"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

import './Specifications.css';

interface Product {
  filters?: Record<string, string[]>;
}

interface SpecificationsProps {
  product: Product | null;
  selectedSpecs: Record<string, string>;
  onToggleSpec: (key: string, value: string) => void;
  errors: Record<string, boolean>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  black: "#000000",
  white: "#f5f5f5",
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#10b981",
  yellow: "#f59e0b",
  purple: "#8b5cf6",
  pink: "#ec4899",
  orange: "#f97316",
  gray: "#6b7280",
  grey: "#6b7280",
  brown: "#92400e",
  navy: "#1e3a5f",
  beige: "#f5f5dc",
  cream: "#fffdd0",
  gold: "#fbbf24",
  silver: "#c0c0c0",
  bronze: "#cd7f32",
};

const LIGHT_COLORS = ["white", "cream", "beige", "silver", "gold", "yellow"];

// ─── Helper Functions ─────────────────────────────────────────────────────────

function isColorKey(key: string): boolean {
  return key.toLowerCase().includes("color") || key.toLowerCase().includes("colour");
}

function getColorValue(option: string): string {
  return COLOR_MAP[option.toLowerCase()] || option.toLowerCase();
}

function isLightColor(option: string): boolean {
  return LIGHT_COLORS.includes(option.toLowerCase());
}

function getFilterIcon(key: string): string {
  const lower = key.toLowerCase();
  if (lower.includes("color") || lower.includes("colour")) return "fa-palette";
  if (lower.includes("size")) return "fa-ruler";
  if (lower.includes("material") || lower.includes("fabric")) return "fa-layer-group";
  if (lower.includes("style") || lower.includes("design")) return "fa-paint-brush";
  if (lower.includes("capacity") || lower.includes("storage")) return "fa-database";
  return "fa-cogs";
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ColorSwatch({
  option,
  isSelected,
  onClick,
  index,
}: {
  option: string;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const colorValue = getColorValue(option);
  const light = isLightColor(option);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 40);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      className={`
        flex flex-col items-center gap-1.5 transition-all duration-200
        ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"}
      `}
      style={{ transitionDelay: `${index * 40}ms` }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Swatch */}
      <button
        onClick={onClick}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        className={`
          relative w-11 h-11 md:w-12 md:h-12 rounded-full transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366]
          ${isPressed ? "scale-90" : "scale-100"}
          ${isSelected
            ? "ring-[3px] ring-[#25D366] shadow-lg shadow-[#25D366]/30"
            : "ring-2 ring-[#e2e8f0] hover:ring-[#cbd5e1] shadow-sm"
          }
        `}
        style={{ backgroundColor: colorValue }}
        aria-label={`Select ${option}`}
        title={option}
      >
        {isSelected && (
          <div className="absolute inset-0 flex items-center justify-center">
            <i
              className={`
                fas fa-check text-sm drop-shadow-md
                ${light ? "text-on-surface" : "text-white"}
              `}
            />
          </div>
        )}

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-[#1e293b] text-white text-[10px] font-bold whitespace-nowrap pointer-events-none z-10 animate-fadeIn">
            {option}
          </div>
        )}
      </button>

      {/* Label */}
      <span className="text-[10px] md:text-xs font-semibold text-on-surface-variant capitalize">
        {option}
      </span>
    </div>
  );
}

function SpecPill({
  option,
  isSelected,
  onClick,
  index,
}: {
  option: string;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 40);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      className={`
        inline-flex items-center gap-1.5 px-4 py-2.5 md:px-5 md:py-3 rounded-full
        text-sm md:text-[15px] font-semibold transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366]
        ${isPressed ? "scale-95" : "scale-100"}
        ${isSelected
          ? "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white shadow-lg shadow-[#25D366]/25 hover:shadow-xl hover:shadow-[#25D366]/30"
          : "bg-white text-on-surface border-2 border-outline-variant hover:border-outline-variant hover:bg-surface-container-lowest"
        }
      `}
      style={{ transitionDelay: `${index * 40}ms` }}
      aria-label={`Select ${option}`}
      aria-pressed={isSelected}
    >
      {isSelected && <i className="fas fa-check text-[10px]" />}
      <span className="capitalize">{option}</span>
    </button>
  );
}

function FilterSection({
  filterKey,
  options,
  selectedValue,
  onToggle,
  hasError,
}: {
  filterKey: string;
  options: string[];
  selectedValue?: string;
  onToggle: (value: string) => void;
  hasError: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const colorKey = isColorKey(filterKey);
  const icon = getFilterIcon(filterKey);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  return (
    <div
      className={`
        mb-5 md:mb-6 last:mb-0 transition-all duration-300
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}
      `}
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-3 md:mb-4">
        <div className="w-7 h-7 rounded-lg bg-[#25D366]/10 flex items-center justify-center">
          <i className={`fas ${icon} text-[#25D366] text-xs`} />
        </div>
        <h3 className="font-bold text-sm md:text-[15px] text-on-surface capitalize">
          {filterKey.replace(/_/g, " ")}
        </h3>
        {selectedValue && (
          <span className="ml-auto text-[10px] md:text-xs font-bold text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded-full">
            Selected
          </span>
        )}
      </div>

      {/* Options */}
      <div className={`flex flex-wrap gap-2.5 md:gap-3 ${hasError ? "animate-shake" : ""}`}>
        {options.map((option, index) =>
          colorKey ? (
            <ColorSwatch
              key={option}
              option={option}
              isSelected={selectedValue === option}
              onClick={() => onToggle(option)}
              index={index}
            />
          ) : (
            <SpecPill
              key={option}
              option={option}
              isSelected={selectedValue === option}
              onClick={() => onToggle(option)}
              index={index}
            />
          )
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Specifications({
  product,
  selectedSpecs,
  onToggleSpec,
  errors,
}: SpecificationsProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  if (!product?.filters || Object.keys(product.filters).length === 0) {
    return null;
  }

  const filters = Object.entries(product.filters).filter(
    ([, options]) => Array.isArray(options) && options.length > 0
  );

  return (
    <div
      className={`
        p-4 md:p-6 border-b border-outline-variant transition-all duration-500
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5 md:mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10 flex items-center justify-center">
            <i className="fas fa-sliders-h text-[#25D366] text-sm" />
          </div>
          <h2 className="text-base md:text-lg font-extrabold text-on-surface">
            Select Options
          </h2>
        </div>
        <span className="text-xs md:text-sm text-on-surface-variant font-medium hidden sm:inline">
          Choose your preferences
        </span>
      </div>

      {/* Filter Sections */}
      {filters.map(([key, options]) => (
        <FilterSection
          key={key}
          filterKey={key}
          options={options as string[]}
          selectedValue={selectedSpecs[key]}
          onToggle={(value) => onToggleSpec(key, value)}
          hasError={errors.specs && !selectedSpecs[key]}
        />
      ))}

      {/* Error Message */}
      {errors.specs && (
        <div className="mt-4 p-3 rounded-xl bg-[#fef2f2] border border-[#ef4444]/20 flex items-center gap-2 animate-shake">
          <i className="fas fa-exclamation-circle text-[#ef4444]" />
          <span className="text-sm font-semibold text-[#ef4444]">
            Please select all options before proceeding
          </span>
        </div>
      )}
    </div>
  );
}