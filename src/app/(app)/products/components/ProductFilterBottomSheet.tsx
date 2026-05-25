"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductFilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
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
  activeFilterCount: number;
  onClearAll: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

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

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "stock-low", label: "Stock: Low to High" },
  { value: "stock-high", label: "Stock: High to Low" },
  { value: "name-az", label: "Name: A-Z" },
  { value: "name-za", label: "Name: Z-A" },
];

// ─── Sub-Components ───────────────────────────────────────────────────────────

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-3 border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 appearance-none bg-surface cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductFilterBottomSheet({
  isOpen,
  onClose,
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
  activeFilterCount,
  onClearAll,
}: ProductFilterBottomSheetProps) {
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [localStock, setLocalStock] = useState(stockFilter);
  const [localStatus, setLocalStatus] = useState(statusFilter);
  const [localSort, setLocalSort] = useState(sortBy);
  const [localPriceMin, setLocalPriceMin] = useState<number | "">(priceRangeMin);
  const [localPriceMax, setLocalPriceMax] = useState<number | "">(priceRangeMax);
  const [localDateStart, setLocalDateStart] = useState(dateRangeStart);
  const [localDateEnd, setLocalDateEnd] = useState(dateRangeEnd);

  // Reset local state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setLocalSearch(searchTerm);
      setLocalStock(stockFilter);
      setLocalStatus(statusFilter);
      setLocalSort(sortBy);
      setLocalPriceMin(priceRangeMin);
      setLocalPriceMax(priceRangeMax);
      setLocalDateStart(dateRangeStart);
      setLocalDateEnd(dateRangeEnd);
    }
  }, [isOpen, searchTerm, stockFilter, statusFilter, sortBy, priceRangeMin, priceRangeMax, dateRangeStart, dateRangeEnd]);

  const handleApply = useCallback(() => {
    setSearchTerm(localSearch);
    setStockFilter(localStock);
    setStatusFilter(localStatus);
    setSortBy(localSort);
    setPriceRangeMin(localPriceMin);
    setPriceRangeMax(localPriceMax);
    setDateRangeStart(localDateStart);
    setDateRangeEnd(localDateEnd);
    onClose();
  }, [localSearch, localStock, localStatus, localSort, localPriceMin, localPriceMax, localDateStart, localDateEnd, onClose, setSearchTerm, setStockFilter, setStatusFilter, setSortBy, setPriceRangeMin, setPriceRangeMax, setDateRangeStart, setDateRangeEnd]);

  const handleClearAll = useCallback(() => {
    onClearAll();
    onClose();
  }, [onClearAll, onClose]);

  const handleQuickDate = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setLocalDateStart(start.toISOString().split("T")[0]);
    setLocalDateEnd(end.toISOString().split("T")[0]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] md:hidden" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn" />

      {/* Bottom Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl shadow-2xl animate-slideUp max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#cbd5e1]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-outline-variant">
          <div>
            <h3 className="font-bold text-base text-on-surface">Filters</h3>
            {activeFilterCount > 0 && (
              <p className="text-xs text-on-surface-variant mt-0.5">{activeFilterCount} active</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors"
          >
            <i className="fas fa-times text-sm" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Search */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Search</label>
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm" />
              <input
                type="text"
                placeholder="Search products..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full pl-9 pr-9 py-3 border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20"
              />
              {localSearch && (
                <button
                  onClick={() => setLocalSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant"
                >
                  <i className="fas fa-times-circle text-sm" />
                </button>
              )}
            </div>
          </div>

          {/* Stock & Status Row */}
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Stock"
              value={localStock}
              onChange={setLocalStock}
              options={STOCK_OPTIONS}
            />
            <SelectField
              label="Status"
              value={localStatus}
              onChange={setLocalStatus}
              options={STATUS_OPTIONS}
            />
          </div>

          {/* Sort By */}
          <div>
            <SelectField
              label="Sort By"
              value={localSort}
              onChange={setLocalSort}
              options={SORT_OPTIONS}
            />
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Price Range</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <i className="fas fa-tag absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xs" />
                <input
                  type="number"
                  placeholder="Min"
                  value={localPriceMin}
                  onChange={(e) => setLocalPriceMin(e.target.value ? Number(e.target.value) : "")}
                  className="w-full pl-9 pr-3 py-3 border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20"
                />
              </div>
              <div className="relative">
                <i className="fas fa-tag absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xs" />
                <input
                  type="number"
                  placeholder="Max"
                  value={localPriceMax}
                  onChange={(e) => setLocalPriceMax(e.target.value ? Number(e.target.value) : "")}
                  className="w-full pl-9 pr-3 py-3 border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20"
                />
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Date Range</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <i className="fas fa-calendar absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xs" />
                <input
                  type="date"
                  value={localDateStart}
                  onChange={(e) => setLocalDateStart(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20"
                />
              </div>
              <div className="relative">
                <i className="fas fa-calendar absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xs" />
                <input
                  type="date"
                  value={localDateEnd}
                  onChange={(e) => setLocalDateEnd(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20"
                />
              </div>
            </div>
          </div>

          {/* Quick Date Presets */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Quick Filters</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleQuickDate(0)}
                className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-medium text-on-surface-variant hover:border-[#25D366] hover:text-[#25D366] transition-all"
              >
                Today
              </button>
              <button
                onClick={() => handleQuickDate(7)}
                className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-medium text-on-surface-variant hover:border-[#25D366] hover:text-[#25D366] transition-all"
              >
                Last 7 days
              </button>
              <button
                onClick={() => handleQuickDate(30)}
                className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-medium text-on-surface-variant hover:border-[#25D366] hover:text-[#25D366] transition-all"
              >
                Last 30 days
              </button>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-outline-variant bg-surface">
          <button
            onClick={handleClearAll}
            className="flex-1 py-3 rounded-xl border-2 border-outline-variant text-sm font-semibold text-on-surface-variant hover:border-red-300 hover:text-red-500 transition-all active:scale-95"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-3 rounded-xl bg-[#25D366] text-white text-sm font-semibold shadow-md3-level3 shadow-[#25D366]/25 hover:opacity-90 transition-all active:scale-95"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
