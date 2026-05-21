"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
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
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter?: string;
  setStatusFilter?: (value: string) => void;
  activeFilterCount: number;
  clearAllFilters: () => void;
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

// ─── Sub-Components ───────────────────────────────────────────────────────────

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
  options: readonly { value: string; label: string; icon?: string }[];
  icon?: string;
}) {
  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">{label}</label>
      {icon && (
        <div className="absolute left-3 top-[38px] -translate-y-1/2 text-gray-400 pointer-events-none">
          <i className={`fas ${icon} text-xs`} />
        </div>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-3 border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all appearance-none cursor-pointer bg-surface ${
          icon ? "pl-9" : ""
        }`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-[38px] -translate-y-1/2 text-gray-400 pointer-events-none">
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
      <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <i className={`fas ${icon} text-xs`} />
        </div>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-9 pr-3 py-3 border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all"
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
      <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">{label}</label>
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
          className="w-full pl-9 pr-3 py-3 border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all"
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FilterBottomSheet({
  isOpen,
  onClose,
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
  searchTerm,
  setSearchTerm,
  statusFilter = "all",
  setStatusFilter,
  activeFilterCount,
  clearAllFilters,
}: FilterBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [localPayment, setLocalPayment] = useState(paymentFilter);
  const [localSort, setLocalSort] = useState(sortBy);
  const [localStatus, setLocalStatus] = useState(statusFilter);
  const [localDateStart, setLocalDateStart] = useState(dateRangeStart);
  const [localDateEnd, setLocalDateEnd] = useState(dateRangeEnd);
  const [localAmountMin, setLocalAmountMin] = useState<number | "">(amountMin);
  const [localAmountMax, setLocalAmountMax] = useState<number | "">(amountMax);

  // Reset local state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setLocalSearch(searchTerm);
      setLocalPayment(paymentFilter);
      setLocalSort(sortBy);
      setLocalStatus(statusFilter);
      setLocalDateStart(dateRangeStart);
      setLocalDateEnd(dateRangeEnd);
      setLocalAmountMin(amountMin);
      setLocalAmountMax(amountMax);
    }
  }, [isOpen, searchTerm, paymentFilter, sortBy, statusFilter, dateRangeStart, dateRangeEnd, amountMin, amountMax]);

  const handleApply = useCallback(() => {
    setSearchTerm(localSearch);
    setPaymentFilter(localPayment);
    setSortBy(localSort);
    if (setStatusFilter) {
      setStatusFilter(localStatus);
    }
    setDateRangeStart(localDateStart);
    setDateRangeEnd(localDateEnd);
    setAmountMin(localAmountMin);
    setAmountMax(localAmountMax);
    onClose();
  }, [localSearch, localPayment, localSort, localDateStart, localDateEnd, localAmountMin, localAmountMax, setSearchTerm, setPaymentFilter, setSortBy, setDateRangeStart, setDateRangeEnd, setAmountMin, setAmountMax, onClose]);

  const handleClearAll = useCallback(() => {
    clearAllFilters();
    setLocalSearch("");
    setLocalPayment("all");
    setLocalSort("newest");
    setLocalDateStart("");
    setLocalDateEnd("");
    setLocalAmountMin("");
    setLocalAmountMax("");
  }, [clearAllFilters]);

  // Close on backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Filter orders"
    >
      <div
        ref={sheetRef}
        className="bg-surface rounded-t-2xl w-full max-w-lg max-h-[85vh] flex flex-col animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-outline-variant">
          <h2 className="font-bold text-lg text-on-surface">Filters</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant active:bg-surface-container-high transition-colors"
            aria-label="Close filters"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="px-4 py-3 border-b border-outline-variant">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-on-surface-variant">Active Filters</span>
              <button
                onClick={handleClearAll}
                className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {localSearch && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                  Search: "{localSearch}"
                  <button onClick={() => setLocalSearch("")} className="hover:bg-blue-100 rounded-full p-0.5">
                    <i className="fas fa-times text-[10px]" />
                  </button>
                </span>
              )}
              {localPayment !== "all" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-600 border border-green-200">
                  {PAYMENT_METHODS.find((p) => p.value === localPayment)?.label}
                  <button onClick={() => setLocalPayment("all")} className="hover:bg-green-100 rounded-full p-0.5">
                    <i className="fas fa-times text-[10px]" />
                  </button>
                </span>
              )}
              {localDateStart && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-600 border border-purple-200">
                  From: {localDateStart}
                  <button onClick={() => setLocalDateStart("")} className="hover:bg-purple-100 rounded-full p-0.5">
                    <i className="fas fa-times text-[10px]" />
                  </button>
                </span>
              )}
              {localDateEnd && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-600 border border-purple-200">
                  To: {localDateEnd}
                  <button onClick={() => setLocalDateEnd("")} className="hover:bg-purple-100 rounded-full p-0.5">
                    <i className="fas fa-times text-[10px]" />
                  </button>
                </span>
              )}
              {localAmountMin !== "" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                  Min: {localAmountMin}
                  <button onClick={() => setLocalAmountMin("")} className="hover:bg-amber-100 rounded-full p-0.5">
                    <i className="fas fa-times text-[10px]" />
                  </button>
                </span>
              )}
              {localAmountMax !== "" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                  Max: {localAmountMax}
                  <button onClick={() => setLocalAmountMax("")} className="hover:bg-amber-100 rounded-full p-0.5">
                    <i className="fas fa-times text-[10px]" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Filter Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Search */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Search</label>
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search orders..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-3 border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all"
              />
              {localSearch && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-on-surface-variant transition-colors"
                  onClick={() => setLocalSearch("")}
                >
                  <i className="fas fa-times-circle" />
                </button>
              )}
            </div>
          </div>

          {/* Payment & Sort */}
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Payment"
              value={localPayment}
              onChange={setLocalPayment}
              options={PAYMENT_METHODS}
              icon="fa-filter"
            />
            <SelectField
              label="Sort By"
              value={localSort}
              onChange={setLocalSort}
              options={SORT_OPTIONS}
              icon="fa-sort"
            />
            {setStatusFilter && (
              <SelectField
                label="Status"
                value={localStatus}
                onChange={setLocalStatus}
                options={STATUS_OPTIONS as any}
                icon="fa-tag"
              />
            )}
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-2">Date Range</label>
            <div className="grid grid-cols-2 gap-3">
              <DateField
                label="Start Date"
                value={localDateStart}
                onChange={setLocalDateStart}
                icon="fa-calendar-alt"
              />
              <DateField
                label="End Date"
                value={localDateEnd}
                onChange={setLocalDateEnd}
                icon="fa-calendar-alt"
              />
            </div>
          </div>

          {/* Amount Range */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-2">Amount Range</label>
            <div className="grid grid-cols-2 gap-3">
              <AmountField
                label="Min Amount"
                value={localAmountMin}
                onChange={setLocalAmountMin}
                placeholder="0.00"
                icon="fa-arrow-down"
              />
              <AmountField
                label="Max Amount"
                value={localAmountMax}
                onChange={setLocalAmountMax}
                placeholder="Any"
                icon="fa-arrow-up"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-2">Quick Filters</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const today = new Date().toISOString().split("T")[0];
                  setLocalDateStart(today);
                  setLocalDateEnd(today);
                }}
                className="px-3 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-medium text-on-surface-variant hover:border-[#25D366] hover:text-[#25D366] transition-all active:scale-95"
              >
                Today
              </button>
              <button
                onClick={() => {
                  const end = new Date();
                  const start = new Date();
                  start.setDate(start.getDate() - 7);
                  setLocalDateStart(start.toISOString().split("T")[0]);
                  setLocalDateEnd(end.toISOString().split("T")[0]);
                }}
                className="px-3 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-medium text-on-surface-variant hover:border-[#25D366] hover:text-[#25D366] transition-all active:scale-95"
              >
                Last 7 days
              </button>
              <button
                onClick={() => {
                  const end = new Date();
                  const start = new Date();
                  start.setDate(start.getDate() - 30);
                  setLocalDateStart(start.toISOString().split("T")[0]);
                  setLocalDateEnd(end.toISOString().split("T")[0]);
                }}
                className="px-3 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-medium text-on-surface-variant hover:border-[#25D366] hover:text-[#25D366] transition-all active:scale-95"
              >
                Last 30 days
              </button>
              <button
                onClick={() => {
                  setLocalAmountMin(100);
                  setLocalAmountMax(500);
                }}
                className="px-3 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-medium text-on-surface-variant hover:border-[#25D366] hover:text-[#25D366] transition-all active:scale-95"
              >
                100 - 500
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-4 py-3 border-t border-outline-variant bg-surface">
          <button
            onClick={handleClearAll}
            className="flex-1 py-3 border-2 border-outline-variant rounded-xl text-sm font-semibold text-on-surface-variant hover:border-red-300 hover:text-red-500 transition-all active:scale-95"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl text-sm font-semibold shadow-md3-level3 hover:shadow-md3-level4 transition-all active:scale-95"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
