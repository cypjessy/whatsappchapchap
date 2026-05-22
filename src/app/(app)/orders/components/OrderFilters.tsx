"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  paymentFilter: string;
  setPaymentFilter: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  dateRangeStart: string;
  setDateRangeStart: (value: string) => void;
  dateRangeEnd: string;
  setDateRangeEnd: (value: string) => void;
  amountMin: number | "";
  setAmountMin: (value: number | "") => void;
  amountMax: number | "";
  setAmountMax: (value: number | "") => void;
  statusFilter?: string;
  setStatusFilter?: (value: string) => void;
  resultCount?: number;
  totalCount?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  { value: "all", label: "All Payments", icon: "fa-credit-card" },
  { value: "Cash on Delivery", label: "Cash on Delivery", icon: "fa-money-bill-wave" },
  { value: "M-Pesa", label: "M-Pesa", icon: "fa-mobile-alt" },
  { value: "Bank Transfer", label: "Bank Transfer", icon: "fa-university" },
] as const;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First", icon: "fa-arrow-down" },
  { value: "oldest", label: "Oldest First", icon: "fa-arrow-up" },
  { value: "amount-high", label: "Highest Amount", icon: "fa-sort-amount-down" },
  { value: "amount-low", label: "Lowest Amount", icon: "fa-sort-amount-up" },
] as const;

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses", color: "#64748b" },
  { value: "pending", label: "Pending", color: "#f59e0b" },
  { value: "confirmed", label: "Confirmed", color: "#3b82f6" },
  { value: "processing", label: "Processing", color: "#8b5cf6" },
  { value: "shipped", label: "Shipped", color: "#6366f1" },
  { value: "delivered", label: "Delivered", color: "#10b981" },
  { value: "cancelled", label: "Cancelled", color: "#ef4444" },
  { value: "refunded", label: "Refunded", color: "#f59e0b" },
] as const;

// ─── Debounce Hook ────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function FilterChip({
  label,
  onRemove,
  color = "#ef4444",
}: {
  label: string;
  onRemove: () => void;
  color?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold animate-fadeIn"
      style={{ backgroundColor: `${color}15`, color: color, border: `1px solid ${color}30` }}
    >
      {label}
      <button
        onClick={onRemove}
        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-white/50 transition-colors"
      >
        <i className="fas fa-times text-[10px]" />
      </button>
    </span>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string; icon?: string; color?: string }[];
  icon?: string;
}) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <i className={`fas ${icon} text-xs`} />
        </div>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2.5 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all appearance-none cursor-pointer bg-white hover:border-gray-300 ${
          icon ? "pl-9" : ""
        }`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
        <i className="fas fa-chevron-down text-xs" />
      </div>
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#64748b] mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <i className={`fas ${icon} text-xs`} />
        </div>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all hover:border-gray-300"
        />
      </div>
    </div>
  );
}

function AmountField({
  label,
  value,
  onChange,
  placeholder,
  icon,
}: {
  label: string;
  value: number | "";
  onChange: (value: number | "") => void;
  placeholder: string;
  icon: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#64748b] mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <i className={`fas ${icon} text-xs`} />
        </div>
        <input
          type="number"
          min={0}
          step={0.01}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
          className="w-full pl-9 pr-3 py-2.5 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all hover:border-gray-300"
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OrderFilters({
  searchTerm,
  setSearchTerm,
  paymentFilter,
  setPaymentFilter,
  sortBy,
  setSortBy,
  dateRangeStart,
  setDateRangeStart,
  dateRangeEnd,
  setDateRangeEnd,
  amountMin,
  setAmountMin,
  amountMax,
  setAmountMax,
  statusFilter = "all",
  setStatusFilter,
  resultCount,
  totalCount,
}: OrderFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const debouncedSearch = useDebounce(localSearch, 300);
  const advancedRef = useRef<HTMLDivElement>(null);

  // Sync debounced search with parent
  useEffect(() => {
    setSearchTerm(debouncedSearch);
  }, [debouncedSearch, setSearchTerm]);

  // Sync local search when prop changes externally
  useEffect(() => {
    if (searchTerm !== localSearch) {
      setLocalSearch(searchTerm);
    }
  }, [searchTerm]);

  const hasActiveFilters = useCallback(() => {
    return (
      dateRangeStart !== "" ||
      dateRangeEnd !== "" ||
      amountMin !== "" ||
      amountMax !== "" ||
      paymentFilter !== "all" ||
      statusFilter !== "all"
    );
  }, [dateRangeStart, dateRangeEnd, amountMin, amountMax, paymentFilter, statusFilter]);

  const activeFilterCount = [
    dateRangeStart,
    dateRangeEnd,
    amountMin !== "" ? "min" : "",
    amountMax !== "" ? "max" : "",
    paymentFilter !== "all" ? paymentFilter : "",
    statusFilter !== "all" ? statusFilter : "",
  ].filter(Boolean).length;

  const clearAllFilters = useCallback(() => {
    setDateRangeStart("");
    setDateRangeEnd("");
    setAmountMin("");
    setAmountMax("");
    setPaymentFilter("all");
    setStatusFilter?.("all");
    setLocalSearch("");
    setSearchTerm("");
  }, [setDateRangeStart, setDateRangeEnd, setAmountMin, setAmountMax, setPaymentFilter, setStatusFilter, setSearchTerm]);

  const clearFilter = useCallback(
    (type: string) => {
      switch (type) {
        case "dateStart":
          setDateRangeStart("");
          break;
        case "dateEnd":
          setDateRangeEnd("");
          break;
        case "amountMin":
          setAmountMin("");
          break;
        case "amountMax":
          setAmountMax("");
          break;
        case "payment":
          setPaymentFilter("all");
          break;
        case "status":
          setStatusFilter?.("all");
          break;
        case "search":
          setLocalSearch("");
          setSearchTerm("");
          break;
      }
    },
    [setDateRangeStart, setDateRangeEnd, setAmountMin, setAmountMax, setPaymentFilter, setStatusFilter, setSearchTerm]
  );

  return (
    <div className="bg-white border-b border-[#e2e8f0]">
      {/* ─── Primary Bar ─── */}
      <div className="p-3 md:p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 animate-fadeIn">
        {/* Left: Title & Count */}
        <div className="flex items-center gap-3 min-w-0 animate-slideUp">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <i className="fas fa-list text-blue-500 text-sm" />
          </div>
          <div>
            <h3 className="font-bold text-[#1e293b] text-sm md:text-base">Orders</h3>
            {resultCount !== undefined && (
              <p className="text-xs text-[#64748b]">
                Showing <span className="font-semibold text-[#1e293b]">{resultCount}</span>
                {totalCount !== undefined && (
                  <span>
                    {" "}
                    of <span className="font-semibold text-[#1e293b]">{totalCount}</span>
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Right: Search & Controls */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          {/* Search */}
          <div className="relative flex-1 md:w-56 lg:w-64 animate-fadeIn" style={{ animationDelay: '0.15s' }}>
            <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search orders..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all hover:border-gray-300"
            />
            {localSearch && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => {
                  setLocalSearch("");
                  setSearchTerm("");
                }}
              >
                <i className="fas fa-times-circle" />
              </button>
            )}
          </div>

          {/* Payment Filter */}
          <div className="w-[140px] animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            <SelectField
              label=""
              value={paymentFilter}
              onChange={setPaymentFilter}
              options={PAYMENT_METHODS}
              icon="fa-filter"
            />
          </div>

          {/* Status Filter (Optional) */}
          {setStatusFilter && (
            <div className="w-[140px] animate-fadeIn" style={{ animationDelay: '0.25s' }}>
              <SelectField
                label=""
                value={statusFilter}
                onChange={setStatusFilter}
                options={STATUS_OPTIONS}
                icon="fa-tag"
              />
            </div>
          )}

          {/* Sort */}
          <div className="w-[150px] animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            <SelectField
              label=""
              value={sortBy}
              onChange={setSortBy}
              options={SORT_OPTIONS}
              icon="fa-sort"
            />
          </div>

          {/* Advanced Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 flex items-center gap-2 border-2 ${
              showAdvanced
                ? "border-[#25D366] bg-[rgba(37,211,102,0.05)] text-[#25D366]"
                : "border-[#e2e8f0] text-[#64748b] hover:border-gray-300"
            } animate-fadeIn`}
            style={{ animationDelay: '0.35s' }}
          >
            <i className={`fas fa-sliders-h text-xs`} />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#25D366] text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ─── Active Filter Chips ─── */}
      {hasActiveFilters() && (
        <div className="px-3 md:px-4 pb-3 flex flex-wrap items-center gap-2 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          {localSearch && (
            <FilterChip
              label={`Search: "${localSearch}"`}
              onRemove={() => clearFilter("search")}
              color="#3b82f6"
            />
          )}
          {paymentFilter !== "all" && (
            <FilterChip
              label={PAYMENT_METHODS.find((p) => p.value === paymentFilter)?.label || paymentFilter}
              onRemove={() => clearFilter("payment")}
              color="#25D366"
            />
          )}
          {statusFilter !== "all" && (
            <FilterChip
              label={STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label || statusFilter}
              onRemove={() => clearFilter("status")}
              color={STATUS_OPTIONS.find((s) => s.value === statusFilter)?.color || "#64748b"}
            />
          )}
          {dateRangeStart && (
            <FilterChip
              label={`From: ${dateRangeStart}`}
              onRemove={() => clearFilter("dateStart")}
              color="#8b5cf6"
            />
          )}
          {dateRangeEnd && (
            <FilterChip
              label={`To: ${dateRangeEnd}`}
              onRemove={() => clearFilter("dateEnd")}
              color="#8b5cf6"
            />
          )}
          {amountMin !== "" && (
            <FilterChip
              label={`Min: ${amountMin}`}
              onRemove={() => clearFilter("amountMin")}
              color="#f59e0b"
            />
          )}
          {amountMax !== "" && (
            <FilterChip
              label={`Max: ${amountMax}`}
              onRemove={() => clearFilter("amountMax")}
              color="#f59e0b"
            />
          )}
          <button
            onClick={clearAllFilters}
            className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
          >
            <i className="fas fa-times-circle mr-1" />
            Clear all
          </button>
        </div>
      )}

      {/* ─── Advanced Filters ─── */}
      <div
        ref={advancedRef}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          showAdvanced ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        } animate-fadeIn`}
        style={{ animationDelay: '0.15s' }}
      >
        <div className="p-3 md:p-4 bg-[#f8fafc] border-t border-[#e2e8f0]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <DateField
              label="Start Date"
              value={dateRangeStart}
              onChange={setDateRangeStart}
              icon="fa-calendar-alt"
            />
            <DateField
              label="End Date"
              value={dateRangeEnd}
              onChange={setDateRangeEnd}
              icon="fa-calendar-alt"
            />
            <AmountField
              label="Min Amount"
              value={amountMin}
              onChange={setAmountMin}
              placeholder="0.00"
              icon="fa-arrow-down"
            />
            <AmountField
              label="Max Amount"
              value={amountMax}
              onChange={setAmountMax}
              placeholder="Any"
              icon="fa-arrow-up"
            />
          </div>

          {/* Quick Presets */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-[#64748b] font-medium mr-1">Quick filters:</span>
            <button
              onClick={() => {
                const today = new Date().toISOString().split("T")[0];
                setDateRangeStart(today);
                setDateRangeEnd(today);
              }}
              className="px-2.5 py-1 bg-white border border-[#e2e8f0] rounded-lg text-xs font-medium text-[#64748b] hover:border-[#25D366] hover:text-[#25D366] transition-all"
            >
              Today
            </button>
            <button
              onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 7);
                setDateRangeStart(start.toISOString().split("T")[0]);
                setDateRangeEnd(end.toISOString().split("T")[0]);
              }}
              className="px-2.5 py-1 bg-white border border-[#e2e8f0] rounded-lg text-xs font-medium text-[#64748b] hover:border-[#25D366] hover:text-[#25D366] transition-all"
            >
              Last 7 days
            </button>
            <button
              onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 30);
                setDateRangeStart(start.toISOString().split("T")[0]);
                setDateRangeEnd(end.toISOString().split("T")[0]);
              }}
              className="px-2.5 py-1 bg-white border border-[#e2e8f0] rounded-lg text-xs font-medium text-[#64748b] hover:border-[#25D366] hover:text-[#25D366] transition-all"
            >
              Last 30 days
            </button>
            <button
              onClick={() => {
                setAmountMin(100);
                setAmountMax(500);
              }}
              className="px-2.5 py-1 bg-white border border-[#e2e8f0] rounded-lg text-xs font-medium text-[#64748b] hover:border-[#25D366] hover:text-[#25D366] transition-all"
            >
              $100 - $500
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}