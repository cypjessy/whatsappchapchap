"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Service } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedServiceFilter: string;
  setSelectedServiceFilter: (value: string) => void;
  filterPaymentStatus: string;
  setFilterPaymentStatus: (value: string) => void;
  dateRangeStart: string;
  setDateRangeStart: (value: string) => void;
  dateRangeEnd: string;
  setDateRangeEnd: (value: string) => void;
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  services: Service[];
}

interface ActiveFilter {
  key: string;
  label: string;
  value: string;
  onRemove: () => void;
}

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
        bg-[#F3E8FF] text-[#8B5CF6] border border-[#8B5CF6]/20
        transition-all duration-200
        ${isRemoving ? "opacity-0 scale-75 -translate-x-2" : "opacity-100 scale-100 translate-x-0"}
      `}
      style={{ transitionDelay: `${index * 30}ms` }}
    >
      <span className="max-w-[120px] truncate">{filter.label}</span>
      <button
        onClick={handleRemove}
        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[#8B5CF6] hover:text-white transition-colors duration-150"
        aria-label={`Remove ${filter.label} filter`}
      >
        <i className="fas fa-times text-[9px]" />
      </button>
    </span>
  );
}

function SearchInput({
  value,
  onChange,
  isFocused,
  setIsFocused,
}: {
  value: string;
  onChange: (val: string) => void;
  isFocused: boolean;
  setIsFocused: (v: boolean) => void;
}) {
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsSearching(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsSearching(false), 400);
  };

  return (
    <div className="relative flex-1 min-w-0">
      <div
        className={`
          relative flex items-center rounded-xl border transition-all duration-200
          ${isFocused
            ? "border-[#8B5CF6] shadow-md shadow-[#8B5CF6]/10 bg-white"
            : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
          }
        `}
      >
        <i className={`
          fas fa-search absolute left-3.5 text-sm transition-colors duration-200
          ${isFocused ? "text-[#8B5CF6]" : "text-[#94A3B8]"}
        `} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search clients, phone, or service..."
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full pl-10 pr-9 py-2.5 md:py-3 bg-transparent text-sm font-medium placeholder:text-[#94A3B8] focus:outline-none rounded-xl"
        />
        {value && (
          <button
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 w-5 h-5 rounded-full bg-[#E2E8F0] text-[#64748B] flex items-center justify-center hover:bg-[#8B5CF6] hover:text-white transition-all duration-150"
          >
            <i className="fas fa-times text-[9px]" />
          </button>
        )}
        {isSearching && !value && (
          <div className="absolute right-3 w-4 h-4 border-2 border-[#8B5CF6]/30 border-t-[#8B5CF6] rounded-full animate-spin" />
        )}
      </div>
    </div>
  );
}

function SelectDropdown({
  value,
  onChange,
  options,
  icon,
  placeholder,
  isFocused,
  setIsFocused,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  icon: string;
  placeholder: string;
  isFocused: boolean;
  setIsFocused: (v: boolean) => void;
}) {
  return (
    <div className="relative min-w-[140px]">
      <div
        className={`
          relative flex items-center rounded-xl border transition-all duration-200
          ${isFocused
            ? "border-[var(--md-sys-color-primary)] shadow-md shadow-[var(--md-sys-color-primary)]/10 bg-[var(--md-sys-color-surface)]"
            : "border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:border-[var(--md-sys-color-outline)]"
          }
        `}
      >
        <i className={`
          ${icon} absolute left-4 text-sm transition-colors duration-200
          ${isFocused ? "text-[var(--md-sys-color-primary)]" : "text-[var(--md-sys-color-on-surface-variant)]"}
        `} />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full pl-10 pr-8 py-3 md:py-4 bg-transparent text-sm font-medium
            focus:outline-none rounded-lg appearance-none cursor-pointer
            ${value ? "text-[var(--md-sys-color-on-surface)]" : "text-[var(--md-sys-color-on-surface-variant)]"}
          `}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <i className="fas fa-chevron-down absolute right-4 text-[10px] text-[var(--md-sys-color-on-surface-variant)] pointer-events-none" />
      </div>
    </div>
  );
}

function DateRangePicker({
  start,
  end,
  onStartChange,
  onEndChange,
  isStartFocused,
  setIsStartFocused,
  isEndFocused,
  setIsEndFocused,
}: {
  start: string;
  end: string;
  onStartChange: (val: string) => void;
  onEndChange: (val: string) => void;
  isStartFocused: boolean;
  setIsStartFocused: (v: boolean) => void;
  isEndFocused: boolean;
  setIsEndFocused: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`
        relative flex items-center rounded-xl border transition-all duration-200
        ${isStartFocused
          ? "border-[#8B5CF6] shadow-md shadow-[#8B5CF6]/10 bg-white"
          : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
        }
      `}>
        <i className={`
          fas fa-calendar-alt absolute left-3 text-sm transition-colors duration-200
          ${isStartFocused ? "text-[#8B5CF6]" : "text-[#94A3B8]"}
        `} />
        <input
          type="date"
          value={start}
          onChange={(e) => onStartChange(e.target.value)}
          onFocus={() => setIsStartFocused(true)}
          onBlur={() => setIsStartFocused(false)}
          className="w-full pl-9 pr-3 py-2.5 md:py-3 bg-transparent text-sm font-medium focus:outline-none rounded-xl text-[#1E293B]"
        />
      </div>

      <div className="flex items-center justify-center w-6 shrink-0">
        <div className="w-3 h-[2px] bg-[#CBD5E1] rounded-full" />
      </div>

      <div className={`
        relative flex items-center rounded-xl border transition-all duration-200
        ${isEndFocused
          ? "border-[#8B5CF6] shadow-md shadow-[#8B5CF6]/10 bg-white"
          : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
        }
      `}>
        <i className={`
          fas fa-calendar-alt absolute left-3 text-sm transition-colors duration-200
          ${isEndFocused ? "text-[#8B5CF6]" : "text-[#94A3B8]"}
        `} />
        <input
          type="date"
          value={end}
          onChange={(e) => onEndChange(e.target.value)}
          onFocus={() => setIsEndFocused(true)}
          onBlur={() => setIsEndFocused(false)}
          className="w-full pl-9 pr-3 py-2.5 md:py-3 bg-transparent text-sm font-medium focus:outline-none rounded-xl text-[#1E293B]"
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BookingFilters({
  searchQuery,
  setSearchQuery,
  selectedServiceFilter,
  setSelectedServiceFilter,
  filterPaymentStatus,
  setFilterPaymentStatus,
  dateRangeStart,
  setDateRangeStart,
  dateRangeEnd,
  setDateRangeEnd,
  selectedDate,
  setSelectedDate,
  services,
}: BookingFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [serviceFocused, setServiceFocused] = useState(false);
  const [paymentFocused, setPaymentFocused] = useState(false);
  const [startFocused, setStartFocused] = useState(false);
  const [endFocused, setEndFocused] = useState(false);

  const hasActiveFilters = Boolean(
    searchQuery ||
    selectedServiceFilter ||
    filterPaymentStatus !== "all" ||
    dateRangeStart ||
    dateRangeEnd ||
    selectedDate
  );

  const activeFilterCount = [
    searchQuery,
    selectedServiceFilter,
    filterPaymentStatus !== "all" ? filterPaymentStatus : "",
    dateRangeStart,
    dateRangeEnd,
    selectedDate ? "date" : "",
  ].filter(Boolean).length;

  const getActiveFilters = useCallback((): ActiveFilter[] => {
    const filters: ActiveFilter[] = [];

    if (searchQuery) {
      filters.push({
        key: "search",
        label: `Search: "${searchQuery}"`,
        value: searchQuery,
        onRemove: () => setSearchQuery(""),
      });
    }

    if (selectedServiceFilter) {
      const service = services.find((s) => s.id === selectedServiceFilter);
      filters.push({
        key: "service",
        label: service?.name || "Service",
        value: selectedServiceFilter,
        onRemove: () => setSelectedServiceFilter(""),
      });
    }

    if (filterPaymentStatus !== "all") {
      const labels: Record<string, string> = { unpaid: "Unpaid", partial: "Partial", paid: "Paid" };
      filters.push({
        key: "payment",
        label: labels[filterPaymentStatus] || filterPaymentStatus,
        value: filterPaymentStatus,
        onRemove: () => setFilterPaymentStatus("all"),
      });
    }

    if (dateRangeStart) {
      filters.push({
        key: "start",
        label: `From ${new Date(dateRangeStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        value: dateRangeStart,
        onRemove: () => setDateRangeStart(""),
      });
    }

    if (dateRangeEnd) {
      filters.push({
        key: "end",
        label: `To ${new Date(dateRangeEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        value: dateRangeEnd,
        onRemove: () => setDateRangeEnd(""),
      });
    }

    if (selectedDate) {
      filters.push({
        key: "calendar",
        label: selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: "date",
        onRemove: () => setSelectedDate(null),
      });
    }

    return filters;
  }, [searchQuery, selectedServiceFilter, filterPaymentStatus, dateRangeStart, dateRangeEnd, selectedDate, services]);

  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedServiceFilter("");
    setFilterPaymentStatus("all");
    setDateRangeStart("");
    setDateRangeEnd("");
    setSelectedDate(null);
  }, [setSearchQuery, setSelectedServiceFilter, setFilterPaymentStatus, setDateRangeStart, setDateRangeEnd, setSelectedDate]);

  const activeFilters = getActiveFilters();

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden mb-6 shadow-sm">
      {/* Header with search + expand toggle on mobile */}
      <div className="p-3 md:p-4">
        <div className="flex items-center gap-2 md:gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            isFocused={searchFocused}
            setIsFocused={setSearchFocused}
          />

          {/* Mobile expand toggle - MD3 styling */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`
              md:hidden flex items-center justify-center w-10 h-10 rounded-xl border shrink-0
              transition-all duration-200 active:scale-95
              ${isExpanded
                ? "border-[#8B5CF6] bg-[#8B5CF6] text-white"
                : "border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#8B5CF6] hover:text-[#8B5CF6]"
              }
            `}
            aria-label={isExpanded ? "Collapse filters" : "Expand filters"}
          >
            <div className="relative">
              <i className={`fas fa-sliders-h text-sm transition-transform duration-200 ${isExpanded ? "rotate-90" : "rotate-0"}`} />
              {activeFilterCount > 0 && !isExpanded && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#EF4444] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </div>
          </button>

          {/* Desktop: inline filters */}
          <div className="hidden md:flex items-center gap-2">
            <SelectDropdown
              value={selectedServiceFilter}
              onChange={setSelectedServiceFilter}
              options={services.map((s) => ({ value: s.id, label: s.name }))}
              icon="fas fa-cut"
              placeholder="All Services"
              isFocused={serviceFocused}
              setIsFocused={setServiceFocused}
            />

            <SelectDropdown
              value={filterPaymentStatus}
              onChange={setFilterPaymentStatus}
              options={[
                { value: "unpaid", label: "Unpaid" },
                { value: "partial", label: "Partial" },
                { value: "paid", label: "Paid" },
              ]}
              icon="fas fa-credit-card"
              placeholder="All Payments"
              isFocused={paymentFocused}
              setIsFocused={setPaymentFocused}
            />

            <DateRangePicker
              start={dateRangeStart}
              end={dateRangeEnd}
              onStartChange={setDateRangeStart}
              onEndChange={setDateRangeEnd}
              isStartFocused={startFocused}
              setIsStartFocused={setStartFocused}
              isEndFocused={endFocused}
              setIsEndFocused={setEndFocused}
            />

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444] hover:text-white hover:border-[#EF4444] transition-all duration-200 active:scale-95 text-sm font-semibold shrink-0"
              >
                <i className="fas fa-times text-xs" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Mobile expanded filters - MD3 styling */}
        <div className={`
          md:hidden overflow-hidden transition-all duration-300 ease-out
          ${isExpanded ? "max-h-[500px] opacity-100 mt-3" : "max-h-0 opacity-0 mt-0"}
        `}>
          <div className="space-y-2.5 pt-2 border-t border-[#E2E8F0]">
            <SelectDropdown
              value={selectedServiceFilter}
              onChange={setSelectedServiceFilter}
              options={services.map((s) => ({ value: s.id, label: s.name }))}
              icon="fas fa-cut"
              placeholder="All Services"
              isFocused={serviceFocused}
              setIsFocused={setServiceFocused}
            />

            <SelectDropdown
              value={filterPaymentStatus}
              onChange={setFilterPaymentStatus}
              options={[
                { value: "unpaid", label: "Unpaid" },
                { value: "partial", label: "Partial" },
                { value: "paid", label: "Paid" },
              ]}
              icon="fas fa-credit-card"
              placeholder="All Payments"
              isFocused={paymentFocused}
              setIsFocused={setPaymentFocused}
            />

            <DateRangePicker
              start={dateRangeStart}
              end={dateRangeEnd}
              onStartChange={setDateRangeStart}
              onEndChange={setDateRangeEnd}
              isStartFocused={startFocused}
              setIsStartFocused={setStartFocused}
              isEndFocused={endFocused}
              setIsEndFocused={setEndFocused}
            />

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444] hover:text-white hover:border-[#EF4444] transition-all duration-200 active:scale-95 text-sm font-semibold"
              >
                <i className="fas fa-times text-xs" />
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active filter pills - MD3 styling */}
      {activeFilters.length > 0 && (
        <div className="px-3 md:px-4 pb-3 md:pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] md:text-xs font-semibold text-[#94A3B8] uppercase tracking-wide mr-1">
              Active:
            </span>
            {activeFilters.map((filter, idx) => (
              <FilterPill key={filter.key} filter={filter} index={idx} />
            ))}
            <button
              onClick={clearAllFilters}
              className="text-[10px] md:text-xs font-semibold text-[#EF4444] hover:text-[#DC2626] hover:underline transition-all ml-1"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}