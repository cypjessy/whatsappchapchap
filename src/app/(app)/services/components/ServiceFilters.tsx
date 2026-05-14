"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, SlidersHorizontal, ChevronDown, RotateCcw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedBusinessType: string;
  setSelectedBusinessType: (type: string) => void;
  priceRangeMin: number | "";
  setPriceRangeMin: (value: number | "") => void;
  priceRangeMax: number | "";
  setPriceRangeMax: (value: number | "") => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  businessTypes: string[];
  isLoading?: boolean;
  onOpenFilterSheet?: () => void;
}

interface ActiveFilter {
  key: string;
  label: string;
  onRemove: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First", icon: "fa-clock" },
  { value: "name", label: "Name A-Z", icon: "fa-font" },
  { value: "price-low", label: "Price: Low to High", icon: "fa-arrow-up" },
  { value: "price-high", label: "Price: High to Low", icon: "fa-arrow-down" },
  { value: "bookings", label: "Most Booked", icon: "fa-fire" },
  { value: "rating", label: "Highest Rated", icon: "fa-star" },
];

// ─── Sub-Components ───────────────────────────────────────────────────────────

function FilterPill({ filter, index }: { filter: ActiveFilter; index: number }) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => filter.onRemove(), 200);
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
        bg-[#ede9fe] text-[#8b5cf6] border border-[#8b5cf6]/20
        transition-all duration-200
        ${isRemoving ? "opacity-0 scale-75 -translate-x-2" : "opacity-100 scale-100 translate-x-0"}
      `}
      style={{ transitionDelay: `${index * 30}ms` }}
    >
      <span className="max-w-[120px] truncate">{filter.label}</span>
      <button
        onClick={handleRemove}
        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[#8b5cf6] hover:text-white transition-colors duration-150"
        aria-label={`Remove ${filter.label} filter`}
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsSearching(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsSearching(false), 400);
  };

  return (
    <div className="relative flex-1 min-w-0">
      <div
        className={`
          relative flex items-center rounded-xl border-2 transition-all duration-200
          ${isFocused
            ? "border-[#8b5cf6] shadow-md shadow-[#8b5cf6]/10 bg-white"
            : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
          }
        `}
      >
        <Search className={`
          absolute left-3.5 w-5 h-5 transition-colors duration-200
          ${isFocused ? "text-[#8b5cf6]" : "text-[#94a3b8]"}
        `} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search services by name, description, or tags..."
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full pl-11 pr-10 py-3 bg-transparent text-sm font-medium placeholder:text-[#94a3b8] focus:outline-none rounded-xl text-[#1e293b]"
        />
        {value ? (
          <button
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 w-6 h-6 rounded-full bg-[#e2e8f0] text-[#64748b] flex items-center justify-center hover:bg-[#8b5cf6] hover:text-white transition-all duration-150"
          >
            <X className="w-3 h-3" />
          </button>
        ) : isSearching ? (
          <div className="absolute right-3 w-5 h-5 border-2 border-[#8b5cf6]/30 border-t-[#8b5cf6] rounded-full animate-spin" />
        ) : null}
      </div>
    </div>
  );
}

function PriceRangeInput({
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
  const [minFocused, setMinFocused] = useState(false);
  const [maxFocused, setMaxFocused] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <div className={`
        relative flex items-center rounded-xl border-2 transition-all duration-200 flex-1
        ${minFocused
          ? "border-[#8b5cf6] shadow-md shadow-[#8b5cf6]/10 bg-white"
          : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
        }
      `}>
        <span className={`
          absolute left-3 text-sm font-bold transition-colors
          ${minFocused ? "text-[#8b5cf6]" : "text-[#94a3b8]"}
        `}>KES</span>
        <input
          type="number"
          value={min}
          onChange={(e) => onMinChange(e.target.value ? Number(e.target.value) : "")}
          onFocus={() => setMinFocused(true)}
          onBlur={() => setMinFocused(false)}
          placeholder="Min"
          className="w-full pl-10 pr-3 py-2.5 bg-transparent text-sm font-medium focus:outline-none rounded-xl"
        />
      </div>

      <div className="flex items-center justify-center w-6 shrink-0">
        <div className="w-3 h-[2px] bg-[#cbd5e1] rounded-full" />
      </div>

      <div className={`
        relative flex items-center rounded-xl border-2 transition-all duration-200 flex-1
        ${maxFocused
          ? "border-[#8b5cf6] shadow-md shadow-[#8b5cf6]/10 bg-white"
          : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
        }
      `}>
        <span className={`
          absolute left-3 text-sm font-bold transition-colors
          ${maxFocused ? "text-[#8b5cf6]" : "text-[#94a3b8]"}
        `}>KES</span>
        <input
          type="number"
          value={max}
          onChange={(e) => onMaxChange(e.target.value ? Number(e.target.value) : "")}
          onFocus={() => setMaxFocused(true)}
          onBlur={() => setMaxFocused(false)}
          placeholder="Max"
          className="w-full pl-10 pr-3 py-2.5 bg-transparent text-sm font-medium focus:outline-none rounded-xl"
        />
      </div>
    </div>
  );
}

function SortDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedOption = SORT_OPTIONS.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 text-sm font-medium
          transition-all duration-200
          ${isOpen || isFocused
            ? "border-[#8b5cf6] shadow-md shadow-[#8b5cf6]/10 bg-white"
            : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
          }
        `}
      >
        <div className="flex items-center gap-2">
          <i className={`fas ${selectedOption?.icon || "fa-sort"} text-[#8b5cf6] text-xs`} />
          <span className={value ? "text-[#1e293b]" : "text-[#94a3b8]"}>
            {selectedOption?.label || "Sort By"}
          </span>
        </div>
        <ChevronDown className={`
          w-4 h-4 transition-transform duration-200
          ${isOpen ? "rotate-180 text-[#8b5cf6]" : "text-[#94a3b8]"}
        `} />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border-2 border-[#e2e8f0] shadow-xl shadow-black/5 overflow-hidden animate-fadeIn">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`
                w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-all duration-150
                ${value === option.value
                  ? "bg-[#ede9fe] text-[#8b5cf6]"
                  : "text-[#64748b] hover:bg-white hover:text-[#1e293b]"
                }
              `}
            >
              <i className={`fas ${option.icon} text-xs w-4 text-center`} />
              {option.label}
              {value === option.value && (
                <i className="fas fa-check ml-auto text-[#8b5cf6] text-xs" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ShimmerFilters() {
  return (
    <div className="space-y-3 mb-6 animate-pulse">
      <div className="h-12 bg-[#f1f5f9] rounded-xl" />
      <div className="flex gap-2">
        <div className="h-10 bg-[#f1f5f9] rounded-xl w-32" />
        <div className="h-10 bg-[#f1f5f9] rounded-xl w-24" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ServiceFilters({
  searchQuery,
  setSearchQuery,
  selectedBusinessType,
  setSelectedBusinessType,
  priceRangeMin,
  setPriceRangeMin,
  priceRangeMax,
  setPriceRangeMax,
  sortBy,
  setSortBy,
  businessTypes,
  isLoading = false,
  onOpenFilterSheet,
}: ServiceFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const hasActiveFilters = Boolean(
    searchQuery ||
    selectedBusinessType ||
    priceRangeMin !== "" ||
    priceRangeMax !== ""
  );

  const activeFilterCount = [
    searchQuery,
    selectedBusinessType,
    priceRangeMin !== "",
    priceRangeMax !== "",
  ].filter(Boolean).length;

  const toggleAdvanced = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setShowAdvanced((prev) => !prev);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleClearAll = useCallback(() => {
    setSearchQuery("");
    setSelectedBusinessType("");
    setPriceRangeMin("");
    setPriceRangeMax("");
  }, [setSearchQuery, setSelectedBusinessType, setPriceRangeMin, setPriceRangeMax]);

  const getActiveFilters = useCallback((): ActiveFilter[] => {
    const filters: ActiveFilter[] = [];

    if (searchQuery) {
      filters.push({
        key: "search",
        label: `Search: "${searchQuery}"`,
        onRemove: () => setSearchQuery(""),
      });
    }

    if (selectedBusinessType) {
      filters.push({
        key: "business",
        label: selectedBusinessType,
        onRemove: () => setSelectedBusinessType(""),
      });
    }

    if (priceRangeMin !== "") {
      filters.push({
        key: "min",
        label: `Min: KES ${priceRangeMin.toLocaleString()}`,
        onRemove: () => setPriceRangeMin(""),
      });
    }

    if (priceRangeMax !== "") {
      filters.push({
        key: "max",
        label: `Max: KES ${priceRangeMax.toLocaleString()}`,
        onRemove: () => setPriceRangeMax(""),
      });
    }

    return filters;
  }, [searchQuery, selectedBusinessType, priceRangeMin, priceRangeMax, setSearchQuery, setSelectedBusinessType, setPriceRangeMin, setPriceRangeMax]);

  const activeFilters = getActiveFilters();

  if (isLoading) {
    return <ShimmerFilters />;
  }

  return (
    <div className="space-y-3 mb-4 md:mb-6">
      {/* Search + Toggle Row */}
      <div className="flex items-center gap-2 md:gap-3">
        <SearchInput value={searchQuery} onChange={setSearchQuery} />

        {/* Mobile: Open bottom sheet */}
        <button
          onClick={onOpenFilterSheet}
          className={`
            md:hidden flex items-center gap-2 px-3 py-3 rounded-xl font-semibold text-sm shrink-0
            transition-all duration-200 active:scale-95
            ${hasActiveFilters
              ? "bg-[#25D366] text-white shadow-md shadow-[#25D366]/25"
              : "bg-white border-2 border-[#e2e8f0] text-[#64748b] hover:border-[#25D366] hover:text-[#25D366]"
            }
          `}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {activeFilterCount > 0 && (
            <span className={`
              px-1.5 py-0.5 rounded-full text-[10px] font-bold
              ${hasActiveFilters ? "bg-white/20" : "bg-[#25D366]/10 text-[#25D366]"}
            `}>
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Desktop/Tablet: Advanced toggle */}
        <button
          onClick={toggleAdvanced}
          className={`
            hidden md:flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm shrink-0
            transition-all duration-200 active:scale-95
            ${showAdvanced || hasActiveFilters
              ? "bg-[#8b5cf6] text-white shadow-md shadow-[#8b5cf6]/25"
              : "bg-white border-2 border-[#e2e8f0] text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6]"
            }
          `}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className={`
              px-1.5 py-0.5 rounded-full text-[10px] font-bold
              ${showAdvanced || hasActiveFilters ? "bg-white/20" : "bg-[#8b5cf6]/10 text-[#8b5cf6]"}
            `}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Active Filter Pills */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 animate-fadeIn">
          <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">
            Active:
          </span>
          {activeFilters.map((filter, idx) => (
            <FilterPill key={filter.key} filter={filter} index={idx} />
          ))}
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1 text-[10px] font-bold text-[#ef4444] hover:text-[#dc2626] hover:underline transition-all ml-1"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      )}

      {/* Advanced Filters Panel */}
      <div className={`
        overflow-hidden transition-all duration-300 ease-out
        ${showAdvanced ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}
      `}>
        <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-[#e2e8f0] shadow-sm space-y-3 md:space-y-4">
          {/* Top row: Business Type + Sort */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] md:text-xs font-bold text-[#64748b] uppercase tracking-wider mb-1.5">
                Business Type
              </label>
              <div className={`
                relative flex items-center rounded-xl border-2 transition-all duration-200
                ${selectedBusinessType
                  ? "border-[#8b5cf6] bg-[#ede9fe]"
                  : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
                }
              `}>
                <i className={`
                  fas fa-store absolute left-3 text-sm transition-colors
                  ${selectedBusinessType ? "text-[#8b5cf6]" : "text-[#94a3b8]"}
                `} />
                <select
                  value={selectedBusinessType}
                  onChange={(e) => setSelectedBusinessType(e.target.value)}
                  className={`
                    w-full pl-9 pr-8 py-2.5 bg-transparent text-sm font-medium focus:outline-none rounded-xl appearance-none cursor-pointer
                    ${selectedBusinessType ? "text-[#1e293b]" : "text-[#94a3b8]"}
                  `}
                >
                  <option value="">All Business Types</option>
                  {businessTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 w-4 h-4 text-[#94a3b8] pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] md:text-xs font-bold text-[#64748b] uppercase tracking-wider mb-1.5">
                Sort By
              </label>
              <SortDropdown value={sortBy} onChange={setSortBy} />
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-[#64748b] uppercase tracking-wider mb-1.5">
              Price Range
            </label>
            <PriceRangeInput
              min={priceRangeMin}
              max={priceRangeMax}
              onMinChange={setPriceRangeMin}
              onMaxChange={setPriceRangeMax}
            />
          </div>

          {/* Results count hint */}
          <div className="flex items-center justify-between pt-2 border-t border-[#f1f5f9]">
            <span className="text-[11px] text-[#94a3b8]">
              {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active
            </span>
            {hasActiveFilters && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 text-xs font-bold text-[#ef4444] hover:text-[#dc2626] transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}