"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  List,
  X,
  ArrowUpDown,
  Package,
  Calendar,
  Tag,
  Loader2,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import ProductFilterBottomSheet from "./ProductFilterBottomSheet";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  stockFilter: string;
  setStockFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  priceRangeMin: number | "";
  setPriceRangeMin: (value: number | "") => void;
  priceRangeMax: number | "";
  setPriceRangeMax: (value: number | "") => void;
  dateRangeStart: string;
  setDateRangeStart: (value: string) => void;
  dateRangeEnd: string;
  setDateRangeEnd: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  view: "grid" | "list";
  setView: (view: "grid" | "list") => void;
  isLoading?: boolean;
  activeFiltersCount?: number;
  onClearAll?: () => void;
  totalResults?: number;
}

interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First", short: "Newest" },
  { value: "oldest", label: "Oldest First", short: "Oldest" },
  { value: "price-low", label: "Price: Low to High", short: "Price ↑" },
  { value: "price-high", label: "Price: High to Low", short: "Price ↓" },
  { value: "stock-low", label: "Stock: Low to High", short: "Stock ↑" },
  { value: "stock-high", label: "Stock: High to Low", short: "Stock ↓" },
  { value: "name-az", label: "Name: A-Z", short: "A-Z" },
  { value: "name-za", label: "Name: Z-A", short: "Z-A" },
];

const STOCK_OPTIONS = [
  { value: "all", label: "All Stock" },
  { value: "in", label: "In Stock" },
  { value: "low", label: "Low Stock" },
  { value: "out", label: "Out of Stock" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "draft", label: "Draft" },
];

// ─── Sub-Components ───────────────────────────────────────────────────────────

function FilterChipPill({
  chip,
  index,
}: {
  chip: FilterChip;
  index: number;
}) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => chip.onRemove(), 200);
  };

  return (
    <button
      onClick={handleRemove}
      className={`
        group flex items-center gap-1.5 px-3 py-1.5 rounded-full 
        bg-[#f0fdf4] border border-[#25D366]/30 
        text-xs font-semibold text-[#128C7E] 
        hover:bg-[#25D366] hover:text-white hover:border-[#25D366]
        transition-all duration-200 active:scale-95
        ${isRemoving ? "opacity-0 scale-75 -translate-x-2" : "opacity-100 scale-100 translate-x-0"}
      `}
    >
      <span className="max-w-[140px] truncate">{chip.label}</span>
      <X className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

function SearchField({
  value,
  onChange,
  isLoading,
  inputRef,
}: {
  value: string;
  onChange: (val: string) => void;
  isLoading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsSearching(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setIsSearching(false), 400);
  };

  return (
    <div className="relative flex-1 lg:flex-none min-w-[200px]">
      <div
        className={`
          absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200
          ${isFocused ? "text-[#25D366]" : "text-outline"}
        `}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-[#25D366]" />
        ) : isSearching && !value ? (
          <Loader2 className="w-4 h-4 animate-spin text-[#25D366]" />
        ) : (
          <Search className="w-4 h-4" />
        )}
      </div>
      <input
        ref={inputRef}
        type="text"
        placeholder="Search products... (press /)"
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          pl-10 pr-9 py-2.5 bg-surface border-2 rounded-xl text-sm 
          transition-all duration-200 w-full lg:w-72
          focus:outline-none focus:ring-2 focus:ring-[#25D366]/20
          ${isFocused || value
            ? "border-[#25D366] bg-surface shadow-md3-level1"
            : "border-transparent hover:border-outline-variant"
          }
        `}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      {/* Keyboard hint */}
      {!value && !isFocused && (
        <kbd className="hidden lg:inline-flex absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-surface-variant text-[10px] font-bold text-outline">
          /
        </kbd>
      )}
    </div>
  );
}

function SelectField({
  value,
  onChange,
  options,
  icon: Icon,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  icon: React.ElementType;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative md3-input-outlined">
      <Icon className="absolute left-4 top-[18px] w-4 h-4 text-[var(--md-sys-color-on-surface-variant)] pointer-events-none z-10" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className={`
          appearance-none w-full pl-10 pr-8 py-4 bg-transparent border-1 rounded-lg 
          text-sm font-medium transition-all duration-200 cursor-pointer
          focus:outline-none
          ${value !== (options[0]?.value ?? "") ? "text-[var(--md-sys-color-on-surface)]" : "text-[var(--md-sys-color-on-surface-variant)]"}
        `}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className={`
          absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-outline pointer-events-none transition-transform duration-200
          ${isOpen ? "rotate-180" : "rotate-0"}
        `}
      />
    </div>
  );
}

function PriceRangeField({
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
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div
      className={`
        flex items-center gap-1 bg-surface rounded-xl border-2 p-1.5
        transition-all duration-200
        ${isFocused ? "border-[#25D366] bg-surface shadow-md3-level1 ring-2 ring-[#25D366]/20" : "border-outline-variant hover:border-outline-variant"}
      `}
    >
      <Tag className="w-3.5 h-3.5 text-outline ml-1.5 shrink-0" />
      <input
        type="number"
        placeholder="Min"
        value={min}
        onChange={(e) => onMinChange(e.target.value ? Number(e.target.value) : "")}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-14 px-1 py-1 bg-transparent text-sm text-on-surface placeholder:text-outline focus:outline-none"
      />
      <span className="text-outline text-xs font-bold">-</span>
      <input
        type="number"
        placeholder="Max"
        value={max}
        onChange={(e) => onMaxChange(e.target.value ? Number(e.target.value) : "")}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-14 px-1 py-1 bg-transparent text-sm text-on-surface placeholder:text-outline focus:outline-none"
      />
    </div>
  );
}

function DateRangeField({
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
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div
      className={`
        flex items-center gap-1 bg-surface rounded-xl border-2 p-1.5
        transition-all duration-200
        ${isFocused ? "border-[#25D366] bg-surface shadow-md3-level1 ring-2 ring-[#25D366]/20" : "border-outline-variant hover:border-outline-variant"}
      `}
    >
      <Calendar className="w-3.5 h-3.5 text-outline ml-1.5 shrink-0" />
      <input
        type="date"
        value={start}
        onChange={(e) => onStartChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-24 px-1 py-1 bg-transparent text-sm text-on-surface focus:outline-none"
      />
      <span className="text-outline text-xs font-bold">-</span>
      <input
        type="date"
        value={end}
        onChange={(e) => onEndChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-24 px-1 py-1 bg-transparent text-sm text-on-surface focus:outline-none"
      />
    </div>
  );
}

function ViewToggle({
  view,
  onChange,
}: {
  view: "grid" | "list";
  onChange: (v: "grid" | "list") => void;
}) {
  return (
    <div className="flex bg-surface rounded-xl p-1 border-2 border-outline-variant">
      {(["grid", "list"] as const).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`
            p-2 rounded-lg transition-all duration-200
            ${view === v
              ? "bg-surface shadow-md3-level1 text-[#25D366] ring-1 ring-[#25D366]/20"
              : "text-outline hover:text-on-surface-variant"
            }
          `}
          aria-label={`${v} view`}
          aria-pressed={view === v}
        >
          {v === "grid" ? <Grid3X3 className="w-4 h-4" /> : <List className="w-4 h-4" />}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductFilters({
  searchTerm,
  setSearchTerm,
  stockFilter,
  setStockFilter,
  statusFilter,
  setStatusFilter,
  priceRangeMin,
  setPriceRangeMin,
  priceRangeMax,
  setPriceRangeMax,
  dateRangeStart,
  setDateRangeStart,
  dateRangeEnd,
  setDateRangeEnd,
  sortBy,
  setSortBy,
  view,
  setView,
  isLoading = false,
  onClearAll,
  totalResults,
}: ProductFiltersProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [mobileAnimating, setMobileAnimating] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: / to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && showMobileFilters) {
        setShowMobileFilters(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showMobileFilters]);

  // Mobile panel animation
  useEffect(() => {
    if (showMobileFilters) {
      setMobileAnimating(true);
    } else {
      const timer = setTimeout(() => setMobileAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [showMobileFilters]);

  // Build filter chips
  const filterChips = useMemo((): FilterChip[] => {
    const chips: FilterChip[] = [];

    if (searchTerm) {
      chips.push({
        key: "search",
        label: `Search: "${searchTerm}"`,
        onRemove: () => setSearchTerm(""),
      });
    }

    if (stockFilter !== "all") {
      const option = STOCK_OPTIONS.find((o) => o.value === stockFilter);
      chips.push({
        key: "stock",
        label: option?.label || stockFilter,
        onRemove: () => setStockFilter("all"),
      });
    }

    if (statusFilter !== "all") {
      const option = STATUS_OPTIONS.find((o) => o.value === statusFilter);
      chips.push({
        key: "status",
        label: option?.label || statusFilter,
        onRemove: () => setStatusFilter("all"),
      });
    }

    if (priceRangeMin !== "") {
      chips.push({
        key: "min",
        label: `Min: $${priceRangeMin}`,
        onRemove: () => setPriceRangeMin(""),
      });
    }

    if (priceRangeMax !== "") {
      chips.push({
        key: "max",
        label: `Max: $${priceRangeMax}`,
        onRemove: () => setPriceRangeMax(""),
      });
    }

    if (dateRangeStart) {
      chips.push({
        key: "start",
        label: `From: ${new Date(dateRangeStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        onRemove: () => setDateRangeStart(""),
      });
    }

    if (dateRangeEnd) {
      chips.push({
        key: "end",
        label: `To: ${new Date(dateRangeEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        onRemove: () => setDateRangeEnd(""),
      });
    }

    return chips;
  }, [
    searchTerm,
    stockFilter,
    statusFilter,
    priceRangeMin,
    priceRangeMax,
    dateRangeStart,
    dateRangeEnd,
    setSearchTerm,
    setStockFilter,
    setStatusFilter,
    setPriceRangeMin,
    setPriceRangeMax,
    setDateRangeStart,
    setDateRangeEnd,
  ]);

  const hasActiveFilters = filterChips.length > 0;

  const handleClearAll = useCallback(() => {
    onClearAll?.();
  }, [onClearAll]);

  const activeSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label || "Sort";

  return (
    <div className="space-y-2 mb-3 md:mb-4 px-0">
      {/* Main toolbar — compact on mobile, full on desktop */}
      <div className="bg-surface rounded-xl md:rounded-2xl p-2.5 md:p-4 border border-outline-variant shadow-md3-level1">
        {/* Mobile: compact toolbar */}
        <div className="flex items-center gap-2 lg:hidden">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <div className={`
              absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200
            `}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#25D366]" />
              ) : (
                <Search className="w-4 h-4 text-outline" />
              )}
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters button */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className={`
              flex items-center justify-center w-10 h-10 rounded-xl shrink-0 transition-all duration-200 active:scale-95
              ${hasActiveFilters
                ? "bg-[#25D366] text-white shadow-md3-level2"
                : "bg-surface border-2 border-outline-variant text-on-surface-variant hover:border-[#25D366]"
              }
            `}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {filterChips.length}
              </span>
            )}
          </button>

          {/* View toggle */}
          <div className="flex items-center border-2 border-outline-variant rounded-xl overflow-hidden shrink-0">
            <button
              onClick={() => setView("grid")}
              className={`flex items-center justify-center w-9 h-9 transition-colors ${
                view === "grid" ? "bg-[#25D366] text-white" : "bg-surface text-outline hover:text-on-surface-variant"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center justify-center w-9 h-9 transition-colors ${
                view === "list" ? "bg-[#25D366] text-white" : "bg-surface text-outline hover:text-on-surface-variant"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desktop: full toolbar */}
        <div className="hidden lg:flex items-center gap-3 justify-between">
          <div className="flex items-center gap-2 flex-1">
            <SearchField
              value={searchTerm}
              onChange={setSearchTerm}
              isLoading={isLoading}
              inputRef={searchInputRef}
            />
            <SelectField
              value={stockFilter}
              onChange={setStockFilter}
              options={STOCK_OPTIONS}
              icon={Package}
            />
            <SelectField
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_OPTIONS}
              icon={Package}
            />
            <PriceRangeField
              min={priceRangeMin}
              max={priceRangeMax}
              onMinChange={setPriceRangeMin}
              onMaxChange={setPriceRangeMax}
            />
            <DateRangeField
              start={dateRangeStart}
              end={dateRangeEnd}
              onStartChange={setDateRangeStart}
              onEndChange={setDateRangeEnd}
            />
            <SelectField
              value={sortBy}
              onChange={setSortBy}
              options={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              icon={ArrowUpDown}
            />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {totalResults !== undefined && (
              <span className="text-xs text-outline font-medium">
                {totalResults} result{totalResults !== 1 ? "s" : ""}
              </span>
            )}
            {hasActiveFilters && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-all active:scale-95"
              >
                <RotateCcw className="w-3 h-3" />
                Clear {filterChips.length}
              </button>
            )}
            <ViewToggle view={view} onChange={setView} />
          </div>
        </div>
      </div>

      {/* Active filter chips — mobile only */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 lg:hidden">
          {filterChips.slice(0, 3).map((chip, index) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/20"
            >
              {chip.label}
              <button onClick={chip.onRemove} className="hover:bg-[#25D366] hover:text-white rounded-full p-0.5 transition-colors">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          {filterChips.length > 3 && (
            <span className="text-[10px] text-on-surface-variant font-medium">+{filterChips.length - 3} more</span>
          )}
          <button
            onClick={handleClearAll}
            className="text-[10px] font-semibold text-red-500 hover:text-red-600 px-1.5 py-0.5"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Mobile Filter Bottom Sheet */}          <ProductFilterBottomSheet
            isOpen={showMobileFilters}
            onClose={() => setShowMobileFilters(false)}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            stockFilter={stockFilter}
            setStockFilter={setStockFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            priceRangeMin={priceRangeMin}
            setPriceRangeMin={setPriceRangeMin}
            priceRangeMax={priceRangeMax}
            setPriceRangeMax={setPriceRangeMax}
            dateRangeStart={dateRangeStart}
            setDateRangeStart={setDateRangeStart}
            dateRangeEnd={dateRangeEnd}
            setDateRangeEnd={setDateRangeEnd}
            sortBy={sortBy}
            setSortBy={setSortBy}
            activeFilterCount={filterChips.length}
            onClearAll={handleClearAll}
          />
    </div>
  );
}