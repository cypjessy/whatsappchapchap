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

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  stockFilter: string;
  setStockFilter: (value: string) => void;
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
          ${isFocused ? "text-[#25D366]" : "text-[#94a3b8]"}
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
          pl-10 pr-9 py-2.5 bg-[#f8fafc] border-2 rounded-xl text-sm 
          transition-all duration-200 w-full lg:w-72
          focus:outline-none focus:ring-2 focus:ring-[#25D366]/20
          ${isFocused || value
            ? "border-[#25D366] bg-white shadow-sm"
            : "border-transparent hover:border-[#e2e8f0]"
          }
        `}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      {/* Keyboard hint */}
      {!value && !isFocused && (
        <kbd className="hidden lg:inline-flex absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-[#e2e8f0] text-[10px] font-bold text-[#94a3b8]">
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
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8] pointer-events-none z-10" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className={`
          appearance-none w-full pl-9 pr-8 py-2.5 bg-[#f8fafc] border-2 rounded-xl 
          text-sm font-medium transition-all duration-200 cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-[#25D366]/20
          ${isOpen || value !== (options[0]?.value ?? "")
            ? "border-[#25D366] bg-white shadow-sm"
            : "border-[#e2e8f0] hover:border-[#cbd5e1]"
          }
          ${value !== (options[0]?.value ?? "") ? "text-[#1e293b]" : "text-[#64748b]"}
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
          absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94a3b8] pointer-events-none transition-transform duration-200
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
        flex items-center gap-1 bg-[#f8fafc] rounded-xl border-2 p-1.5
        transition-all duration-200
        ${isFocused ? "border-[#25D366] bg-white shadow-sm ring-2 ring-[#25D366]/20" : "border-[#e2e8f0] hover:border-[#cbd5e1]"}
      `}
    >
      <Tag className="w-3.5 h-3.5 text-[#94a3b8] ml-1.5 shrink-0" />
      <input
        type="number"
        placeholder="Min"
        value={min}
        onChange={(e) => onMinChange(e.target.value ? Number(e.target.value) : "")}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-14 px-1 py-1 bg-transparent text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none"
      />
      <span className="text-[#94a3b8] text-xs font-bold">-</span>
      <input
        type="number"
        placeholder="Max"
        value={max}
        onChange={(e) => onMaxChange(e.target.value ? Number(e.target.value) : "")}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-14 px-1 py-1 bg-transparent text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none"
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
        flex items-center gap-1 bg-[#f8fafc] rounded-xl border-2 p-1.5
        transition-all duration-200
        ${isFocused ? "border-[#25D366] bg-white shadow-sm ring-2 ring-[#25D366]/20" : "border-[#e2e8f0] hover:border-[#cbd5e1]"}
      `}
    >
      <Calendar className="w-3.5 h-3.5 text-[#94a3b8] ml-1.5 shrink-0" />
      <input
        type="date"
        value={start}
        onChange={(e) => onStartChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-24 px-1 py-1 bg-transparent text-sm text-[#1e293b] focus:outline-none"
      />
      <span className="text-[#94a3b8] text-xs font-bold">-</span>
      <input
        type="date"
        value={end}
        onChange={(e) => onEndChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-24 px-1 py-1 bg-transparent text-sm text-[#1e293b] focus:outline-none"
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
    <div className="flex bg-[#f8fafc] rounded-xl p-1 border-2 border-[#e2e8f0]">
      {(["grid", "list"] as const).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`
            p-2 rounded-lg transition-all duration-200
            ${view === v
              ? "bg-white shadow-sm text-[#25D366] ring-1 ring-[#25D366]/20"
              : "text-[#94a3b8] hover:text-[#64748b]"
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
    priceRangeMin,
    priceRangeMax,
    dateRangeStart,
    dateRangeEnd,
    setSearchTerm,
    setStockFilter,
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
    <div className="space-y-3 mb-4 md:mb-6 px-0">
      {/* Main toolbar */}
      <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-4 border border-[#e2e8f0] shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
          {/* Left: Search + desktop filters */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <SearchField
              value={searchTerm}
              onChange={setSearchTerm}
              isLoading={isLoading}
              inputRef={searchInputRef}
            />

            {/* Desktop filters */}
            <div className="hidden lg:flex items-center gap-2">
              <SelectField
                value={stockFilter}
                onChange={setStockFilter}
                options={STOCK_OPTIONS}
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

            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`
                lg:hidden flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                ${showMobileFilters || hasActiveFilters
                  ? "bg-[#25D366] text-white shadow-lg shadow-[#25D366]/25"
                  : "bg-[#f8fafc] border-2 border-[#e2e8f0] text-[#64748b] hover:border-[#25D366]"
                }
              `}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-white/25 text-[10px] font-bold">
                  {filterChips.length}
                </span>
              )}
            </button>
          </div>

          {/* Right: Results count + clear + view toggle */}
          <div className="flex items-center gap-3 self-end lg:self-auto">
            {totalResults !== undefined && (
              <span className="hidden md:inline-flex text-xs text-[#94a3b8] font-medium">
                {totalResults} result{totalResults !== 1 ? "s" : ""}
              </span>
            )}

            {hasActiveFilters && (
              <button
                onClick={handleClearAll}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-all active:scale-95"
              >
                <RotateCcw className="w-3 h-3" />
                Clear {filterChips.length}
              </button>
            )}

            <ViewToggle view={view} onChange={setView} />
          </div>
        </div>

        {/* Mobile filters panel */}
        <div
          className={`
            lg:hidden overflow-hidden transition-all duration-300 ease-out
            ${showMobileFilters ? "max-h-[600px] opacity-100 mt-3 pt-3" : "max-h-0 opacity-0 mt-0 pt-0"}
          `}
        >
          <div className="space-y-3 border-t border-[#e2e8f0] pt-3">
            <div className="grid grid-cols-2 gap-2">
              <SelectField
                value={stockFilter}
                onChange={setStockFilter}
                options={STOCK_OPTIONS}
                icon={Package}
              />
              <SelectField
                value={sortBy}
                onChange={setSortBy}
                options={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.short }))}
                icon={ArrowUpDown}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                <input
                  type="number"
                  placeholder="Min Price"
                  value={priceRangeMin}
                  onChange={(e) => setPriceRangeMin(e.target.value ? Number(e.target.value) : "")}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20"
                />
              </div>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                <input
                  type="number"
                  placeholder="Max Price"
                  value={priceRangeMax}
                  onChange={(e) => setPriceRangeMax(e.target.value ? Number(e.target.value) : "")}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                <input
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                  className="w-full pl-9 pr-2 py-2.5 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                <input
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                  className="w-full pl-9 pr-2 py-2.5 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleClearAll}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-all active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mr-1">
            Active:
          </span>
          {filterChips.map((chip, index) => (
            <FilterChipPill key={chip.key} chip={chip} index={index} />
          ))}
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold text-[#94a3b8] hover:text-red-500 hover:bg-red-50 transition-all active:scale-95"
          >
            <X className="w-3 h-3" />
            Clear all
          </button>
        </div>
      )}

      {/* Mobile backdrop */}
      {showMobileFilters && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden animate-fadeIn"
          onClick={() => setShowMobileFilters(false)}
        />
      )}
    </div>
  );
}