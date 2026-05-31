"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import CustomerFilterBottomSheet from "./CustomerFilterBottomSheet";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomerFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  spendingMin: number | "";
  onSpendingMinChange: (value: number | "") => void;
  spendingMax: number | "";
  onSpendingMaxChange: (value: number | "") => void;
  dateRangeStart: string;
  onDateRangeStartChange: (value: string) => void;
  dateRangeEnd: string;
  onDateRangeEndChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;

  totalCustomers?: number;
  filteredCount?: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "all", label: "All Status", icon: "fa-users", color: "text-on-surface-variant" },
  { value: "active", label: "Active", icon: "fa-check-circle", color: "text-[#10b981]" },
  { value: "new", label: "New", icon: "fa-star", color: "text-[#3b82f6]" },
  { value: "vip", label: "VIP", icon: "fa-crown", color: "text-[#f59e0b]" },
  { value: "inactive", label: "Inactive", icon: "fa-moon", color: "text-on-surface-variant" },
] as const;

const SORT_OPTIONS = [
  { value: "recent", label: "Most Recent", icon: "fa-clock" },
  { value: "oldest", label: "Oldest", icon: "fa-history" },
  { value: "highestLTV", label: "Highest LTV", icon: "fa-arrow-trend-up" },
  { value: "mostOrders", label: "Most Orders", icon: "fa-shopping-bag" },
  { value: "name", label: "Name A-Z", icon: "fa-font" },
  { value: "rating", label: "Rating", icon: "fa-star" },
  { value: "visits", label: "Visits", icon: "fa-calendar-check" },
] as const;

// ─── Sub-Components ───────────────────────────────────────────────────────────

function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsSearching(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current as any);
    }
    timeoutRef.current = setTimeout(() => setIsSearching(false), 400);
  };

  return (
    <div className="relative flex-1 min-w-0">
      <div
        className={`
          relative flex items-center rounded-xl border-2 transition-all duration-200
          ${isFocused
            ? "border-[#25D366] shadow-md shadow-[#25D366]/10 bg-surface"
            : "border-outline-variant bg-surface hover:border-outline-variant"
          }
        `}
      >
        <i className={`
          fas fa-search absolute left-3.5 text-sm transition-colors duration-200
          ${isFocused ? "text-[#25D366]" : "text-outline"}
        `} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search customers..."
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full pl-10 pr-9 py-2.5 md:py-3 bg-transparent text-sm font-medium placeholder:text-outline focus:outline-none rounded-xl"
        />
        {value && (
          <button
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 w-5 h-5 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all duration-150"
          >
            <i className="fas fa-times text-[9px]" />
          </button>
        )}
        {isSearching && !value && (
          <div className="absolute right-3 w-4 h-4 border-2 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin" />
        )}
      </div>
    </div>
  );
}

function CustomSelect({
  value,
  onChange,
  options,
  icon,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  options: readonly { value: string; label: string; icon?: string; color?: string }[];
  icon: string;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div ref={containerRef} className="relative min-w-[140px]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          w-full flex items-center gap-2 px-3 py-2.5 md:py-3 rounded-xl border-2 text-sm font-medium
          transition-all duration-200 text-left
          ${isFocused || isOpen
            ? "border-[#25D366] shadow-md shadow-[#25D366]/10 bg-surface"
            : "border-outline-variant bg-surface hover:border-outline-variant"
          }
        `}
      >
        <i className={`fas ${icon} ${isFocused || isOpen ? "text-[#25D366]" : "text-outline"} text-xs`} />
        <span className={value ? "text-on-surface" : "text-outline"}>
          {selectedOption?.label || placeholder}
        </span>
        <i className={`
          fas fa-chevron-down ml-auto text-[10px] transition-transform duration-200
          ${isOpen ? "rotate-180 text-[#25D366]" : "text-outline"}
        `} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface rounded-xl border border-outline-variant shadow-xl z-50 overflow-hidden animate-fadeIn">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`
                w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium
                transition-colors hover:bg-surface-container-highest
                ${value === option.value ? "bg-[#DCF8C6]/30 text-[#25D366] font-bold" : "text-on-surface-variant"}
              `}
            >
              {option.icon && (
                <i className={`fas ${option.icon} ${option.color || "text-outline"} text-xs w-4 text-center`} />
              )}
              {option.label}
              {value === option.value && (
                <i className="fas fa-check ml-auto text-[#25D366] text-[10px]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DateRangePicker({
  start,
  end,
  onStartChange,
  onEndChange,
}: {
  start: string;
  end: string;
  onStartChange: (val: string) => void;
  onEndChange: (val: string) => void;
}) {
  const [startFocused, setStartFocused] = useState(false);
  const [endFocused, setEndFocused] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <div className={`
        relative flex items-center rounded-xl border-2 transition-all duration-200
        ${startFocused
          ? "border-[#25D366] shadow-md shadow-[#25D366]/10 bg-surface"
          : "border-outline-variant bg-surface hover:border-outline-variant"
        }
      `}>
        <i className={`
          fas fa-calendar-alt absolute left-3 text-xs transition-colors
          ${startFocused ? "text-[#25D366]" : "text-outline"}
        `} />
        <input
          type="date"
          value={start}
          onChange={(e) => onStartChange(e.target.value)}
          onFocus={() => setStartFocused(true)}
          onBlur={() => setStartFocused(false)}
          className="w-full pl-8 pr-3 py-2.5 md:py-3 bg-transparent text-sm font-medium focus:outline-none rounded-xl text-on-surface"
        />
      </div>

      <div className="flex items-center justify-center w-6 shrink-0">
        <div className="w-3 h-[2px] bg-[#cbd5e1] rounded-full" />
      </div>

      <div className={`
        relative flex items-center rounded-xl border-2 transition-all duration-200
        ${endFocused
          ? "border-[#25D366] shadow-md shadow-[#25D366]/10 bg-surface"
          : "border-outline-variant bg-surface hover:border-outline-variant"
        }
      `}>
        <i className={`
          fas fa-calendar-alt absolute left-3 text-xs transition-colors
          ${endFocused ? "text-[#25D366]" : "text-outline"}
        `} />
        <input
          type="date"
          value={end}
          onChange={(e) => onEndChange(e.target.value)}
          onFocus={() => setEndFocused(true)}
          onBlur={() => setEndFocused(false)}
          className="w-full pl-8 pr-3 py-2.5 md:py-3 bg-transparent text-sm font-medium focus:outline-none rounded-xl text-on-surface"
        />
      </div>
    </div>
  );
}

function PriceRange({
  min,
  max,
  onMinChange,
  onMaxChange,
}: {
  min: number | "";
  max: number | "";
  onMinChange: (val: number | "") => void;
  onMaxChange: (val: number | "") => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xs font-bold">KES</span>
        <input
          type="number"
          placeholder="Min"
          value={min}
          onChange={(e) => onMinChange(e.target.value ? Number(e.target.value) : "")}
          className="w-24 pl-9 pr-3 py-2.5 md:py-3 rounded-xl border-2 border-outline-variant bg-surface text-sm font-medium focus:border-[#25D366] focus:outline-none focus:bg-surface transition-all"
        />
      </div>
      <div className="flex items-center justify-center w-4 shrink-0">
        <div className="w-2 h-[2px] bg-[#cbd5e1] rounded-full" />
      </div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xs font-bold">KES</span>
        <input
          type="number"
          placeholder="Max"
          value={max}
          onChange={(e) => onMaxChange(e.target.value ? Number(e.target.value) : "")}
          className="w-24 pl-9 pr-3 py-2.5 md:py-3 rounded-xl border-2 border-outline-variant bg-surface text-sm font-medium focus:border-[#25D366] focus:outline-none focus:bg-surface transition-all"
        />
      </div>
    </div>
  );
}

function ActiveFilterPill({
  label,
  onRemove,
  color = "bg-[#25D366]",
}: {
  label: string;
  onRemove: () => void;
  color?: string;
}) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => onRemove(), 200);
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold
        bg-[#DCF8C6] text-[#128C7E] border border-[#25D366]/20
        transition-all duration-200
        ${isRemoving ? "opacity-0 scale-75 -translate-x-2" : "opacity-100 scale-100 translate-x-0"}
      `}
    >
      {label}
      <button
        onClick={handleRemove}
        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-colors"
      >
        <i className="fas fa-times text-[9px]" />
      </button>
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CustomerFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  spendingMin,
  onSpendingMinChange,
  spendingMax,
  onSpendingMaxChange,
  dateRangeStart,
  onDateRangeStartChange,
  dateRangeEnd,
  onDateRangeEndChange,
  sortBy,
  onSortByChange,
  totalCustomers = 0,
  filteredCount,
}: CustomerFiltersProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const hasActiveFilters = searchTerm || statusFilter !== "all" || spendingMin !== "" || spendingMax !== "" || dateRangeStart || dateRangeEnd;

  const activeFilterCount = [
    searchTerm,
    statusFilter !== "all" ? statusFilter : "",
    spendingMin !== "",
    spendingMax !== "",
    dateRangeStart,
    dateRangeEnd,
  ].filter(Boolean).length;

  const getActiveFilters = () => {
    const filters: { label: string; onRemove: () => void }[] = [];
    if (searchTerm) filters.push({ label: `Search: "${searchTerm}"`, onRemove: () => onSearchChange("") });
    if (statusFilter !== "all") {
      const status = STATUS_OPTIONS.find((s) => s.value === statusFilter);
      filters.push({ label: status?.label || statusFilter, onRemove: () => onStatusFilterChange("all") });
    }
    if (spendingMin !== "") filters.push({ label: `Min: KES ${spendingMin}`, onRemove: () => onSpendingMinChange("") });
    if (spendingMax !== "") filters.push({ label: `Max: KES ${spendingMax}`, onRemove: () => onSpendingMaxChange("") });
    if (dateRangeStart) filters.push({ label: `From ${new Date(dateRangeStart).toLocaleDateString()}`, onRemove: () => onDateRangeStartChange("") });
    if (dateRangeEnd) filters.push({ label: `To ${new Date(dateRangeEnd).toLocaleDateString()}`, onRemove: () => onDateRangeEndChange("") });
    return filters;
  };

  const clearAllFilters = () => {
    onSearchChange("");
    onStatusFilterChange("all");
    onSpendingMinChange("");
    onSpendingMaxChange("");
    onDateRangeStartChange("");
    onDateRangeEndChange("");
  };

  return (
    <>
      <div className="bg-surface rounded-xl md:rounded-2xl border border-outline-variant overflow-hidden mb-3 md:mb-6 shadow-sm">
        {/* Main bar */}
        <div className="p-3 md:p-4">
          {/* Mobile: Compact toolbar */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* Search input */}
            <div className="relative flex-1 min-w-0">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-sm text-outline" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-surface border-2 border-outline-variant rounded-xl text-sm font-medium placeholder:text-outline focus:border-[#25D366] focus:outline-none"
              />
            </div>

            {/* Filter button with badge */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className={`
                relative flex items-center justify-center w-10 h-10 rounded-xl border-2 shrink-0 transition-all active:scale-95
                ${hasActiveFilters
                  ? "border-[#25D366] bg-[#DCF8C6] text-[#25D366]"
                  : "border-outline-variant bg-surface text-on-surface-variant hover:border-[#25D366]"
                }
              `}
              aria-label="Open filters"
            >
              <i className="fas fa-sliders-h text-sm" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ef4444] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>


          </div>

          {/* Desktop: Full inline filters */}
          <div className="hidden lg:flex items-center gap-2 md:gap-3">
            <SearchInput value={searchTerm} onChange={onSearchChange} />

            <CustomSelect
              value={statusFilter}
              onChange={onStatusFilterChange}
              options={STATUS_OPTIONS}
              icon="fa-filter"
              placeholder="Status"
            />
            <PriceRange
              min={spendingMin}
              max={spendingMax}
              onMinChange={onSpendingMinChange}
              onMaxChange={onSpendingMaxChange}
            />
            <DateRangePicker
              start={dateRangeStart}
              end={dateRangeEnd}
              onStartChange={onDateRangeStartChange}
              onEndChange={onDateRangeEndChange}
            />
            <CustomSelect
              value={sortBy}
              onChange={onSortByChange}
              options={SORT_OPTIONS}
              icon="fa-sort"
              placeholder="Sort"
            />


          </div>
        </div>

        {/* Active filter pills - show max 3 on mobile, all on desktop */}
        {hasActiveFilters && (
          <div className="px-3 md:px-4 pb-3 md:pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] md:text-xs font-bold text-outline uppercase tracking-wider mr-1">
                Active:
              </span>
              {getActiveFilters().slice(0, 3).map((filter, idx) => (
                <ActiveFilterPill key={idx} label={filter.label} onRemove={filter.onRemove} />
              ))}
              {getActiveFilters().length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-surface-variant text-on-surface-variant">
                  +{getActiveFilters().length - 3} more
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="text-[10px] md:text-xs font-bold text-[#ef4444] hover:text-[#dc2626] hover:underline transition-all ml-1"
              >
                Clear all
              </button>
            </div>
          </div>
        )}

        {/* Results count */}
        {filteredCount !== undefined && (
          <div className="px-3 md:px-4 pb-3 md:pb-4 pt-0 -mt-1">
            <span className="text-xs text-outline font-medium">
              Showing {filteredCount} of {totalCustomers} customers
            </span>
          </div>
        )}
      </div>

      {/* Mobile Filter Bottom Sheet */}
      <CustomerFilterBottomSheet
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        spendingMin={spendingMin}
        onSpendingMinChange={onSpendingMinChange}
        spendingMax={spendingMax}
        onSpendingMaxChange={onSpendingMaxChange}
        dateRangeStart={dateRangeStart}
        onDateRangeStartChange={onDateRangeStartChange}
        dateRangeEnd={dateRangeEnd}
        onDateRangeEndChange={onDateRangeEndChange}
        sortBy={sortBy}
        onSortByChange={onSortByChange}
      />
    </>
  );
}