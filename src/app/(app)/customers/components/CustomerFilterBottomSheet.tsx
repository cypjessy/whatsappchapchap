"use client";

import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomerFilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
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
}

// ─── Constants ─────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "new", label: "New" },
  { value: "vip", label: "VIP" },
  { value: "inactive", label: "Inactive" },
] as const;

const SORT_OPTIONS = [
  { value: "recent", label: "Most Recent" },
  { value: "oldest", label: "Oldest" },
  { value: "highestLTV", label: "Highest LTV" },
  { value: "mostOrders", label: "Most Orders" },
  { value: "name", label: "Name A-Z" },
  { value: "rating", label: "Rating" },
  { value: "visits", label: "Visits" },
] as const;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CustomerFilterBottomSheet({
  isOpen,
  onClose,
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
}: CustomerFilterBottomSheetProps) {
  // Local state for batch updates
  const [localStatus, setLocalStatus] = useState(statusFilter);
  const [localSpendingMin, setLocalSpendingMin] = useState<number | "">(spendingMin);
  const [localSpendingMax, setLocalSpendingMax] = useState<number | "">(spendingMax);
  const [localDateStart, setLocalDateStart] = useState(dateRangeStart);
  const [localDateEnd, setLocalDateEnd] = useState(dateRangeEnd);
  const [localSortBy, setLocalSortBy] = useState(sortBy);

  // Sync local state when bottom sheet opens
  useEffect(() => {
    if (isOpen) {
      setLocalStatus(statusFilter);
      setLocalSpendingMin(spendingMin);
      setLocalSpendingMax(spendingMax);
      setLocalDateStart(dateRangeStart);
      setLocalDateEnd(dateRangeEnd);
      setLocalSortBy(sortBy);
    }
  }, [isOpen, statusFilter, spendingMin, spendingMax, dateRangeStart, dateRangeEnd, sortBy]);

  const handleApply = () => {
    onStatusFilterChange(localStatus);
    onSpendingMinChange(localSpendingMin);
    onSpendingMaxChange(localSpendingMax);
    onDateRangeStartChange(localDateStart);
    onDateRangeEndChange(localDateEnd);
    onSortByChange(localSortBy);
    onClose();
  };

  const handleClearAll = () => {
    setLocalStatus("all");
    setLocalSpendingMin("");
    setLocalSpendingMax("");
    setLocalDateStart("");
    setLocalDateEnd("");
    setLocalSortBy("recent");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[60] animate-fadeIn lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-3xl z-[70] max-h-[85vh] overflow-y-auto animate-slideUp lg:hidden shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Customer filters"
      >
        {/* Handle bar */}
        <div className="sticky top-0 bg-surface pt-3 pb-2 px-4 border-b border-outline-variant z-10">
          <div className="w-10 h-1 bg-[#cbd5e1] rounded-full mx-auto mb-3" />
          <h2 className="text-lg font-bold text-on-surface text-center">Filters</h2>
        </div>

        {/* Content */}
        <div className="p-4 space-y-5">
          {/* Status Filter */}
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setLocalStatus(option.value)}
                  className={`
                    px-3 py-2.5 rounded-xl text-xs font-semibold transition-all
                    ${localStatus === option.value
                      ? "bg-[#25D366] text-white shadow-md"
                      : "bg-surface-container-lowest text-on-surface-variant border-2 border-outline-variant hover:border-[#25D366]"
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              Sort By
            </label>
            <select
              value={localSortBy}
              onChange={(e) => setLocalSortBy(e.target.value)}
              className="w-full px-3 py-3 rounded-xl border-2 border-outline-variant bg-surface text-sm font-medium focus:border-[#25D366] focus:outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Spending Range */}
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              Spending Range (KES)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={localSpendingMin}
                onChange={(e) => setLocalSpendingMin(e.target.value ? Number(e.target.value) : "")}
                className="flex-1 px-3 py-3 rounded-xl border-2 border-outline-variant bg-surface text-sm font-medium focus:border-[#25D366] focus:outline-none"
              />
              <span className="text-outline font-bold">-</span>
              <input
                type="number"
                placeholder="Max"
                value={localSpendingMax}
                onChange={(e) => setLocalSpendingMax(e.target.value ? Number(e.target.value) : "")}
                className="flex-1 px-3 py-3 rounded-xl border-2 border-outline-variant bg-surface text-sm font-medium focus:border-[#25D366] focus:outline-none"
              />
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              Date Range
            </label>
            <div className="space-y-2">
              <input
                type="date"
                value={localDateStart}
                onChange={(e) => setLocalDateStart(e.target.value)}
                className="w-full px-3 py-3 rounded-xl border-2 border-outline-variant bg-surface text-sm font-medium focus:border-[#25D366] focus:outline-none text-on-surface"
              />
              <input
                type="date"
                value={localDateEnd}
                onChange={(e) => setLocalDateEnd(e.target.value)}
                className="w-full px-3 py-3 rounded-xl border-2 border-outline-variant bg-surface text-sm font-medium focus:border-[#25D366] focus:outline-none text-on-surface"
              />
            </div>
          </div>
        </div>

        {/* Sticky footer with action buttons */}
        <div className="sticky bottom-0 bg-surface border-t border-outline-variant p-4 flex gap-3">
          <button
            onClick={handleClearAll}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-outline-variant text-on-surface-variant font-bold text-sm hover:border-[#ef4444] hover:text-[#ef4444] transition-all active:scale-95"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-bold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
