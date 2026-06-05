"use client";

import { useState, useEffect } from "react";
import { X, SlidersHorizontal, RotateCcw, ChevronDown } from "lucide-react";

interface ServiceFilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBusinessType: string;
  setSelectedBusinessType: (type: string) => void;
  priceRangeMin: number | "";
  setPriceRangeMin: (value: number | "") => void;
  priceRangeMax: number | "";
  setPriceRangeMax: (value: number | "") => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  businessTypes: string[];
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "name", label: "Name A-Z" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "bookings", label: "Most Booked" },
  { value: "rating", label: "Highest Rated" },
];

export default function ServiceFilterBottomSheet({
  isOpen,
  onClose,
  selectedBusinessType,
  setSelectedBusinessType,
  priceRangeMin,
  setPriceRangeMin,
  priceRangeMax,
  setPriceRangeMax,
  sortBy,
  setSortBy,
  businessTypes,
}: ServiceFilterBottomSheetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      setIsAnimating(true);
      setTimeout(() => {
        setIsVisible(false);
        setIsAnimating(false);
        document.body.style.overflow = "";
      }, 300);
    }
  }, [isOpen]);

  const handleClearAll = () => {
    setSelectedBusinessType("");
    setPriceRangeMin("");
    setPriceRangeMax("");
    setSortBy("newest");
  };

  const hasActiveFilters = Boolean(
    selectedBusinessType || priceRangeMin !== "" || priceRangeMax !== "" || sortBy !== "newest"
  );

  if (!isVisible && !isAnimating) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black/50 z-[3000] transition-opacity duration-300
          md:hidden
          ${isOpen ? "opacity-100" : "opacity-0"}
        `}
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 bg-surface rounded-t-2xl z-[3001] max-h-[85vh] overflow-y-auto
          shadow-2xl transform transition-transform duration-300 ease-out
          md:hidden
          ${isOpen ? "translate-y-0" : "translate-y-full"}
        `}
      >
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-outline-variant px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-[#25D366]" />
            <h3 className="text-lg font-bold text-on-surface">Filters</h3>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 bg-[#25D366]/10 text-[#25D366] text-xs font-bold rounded-full">
                {[selectedBusinessType, priceRangeMin !== "", priceRangeMax !== "", sortBy !== "newest"].filter(Boolean).length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center hover:bg-surface-variant transition-colors"
          >
            <X className="w-4 h-4 text-on-surface-variant" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Business Type */}
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              Business Type
            </label>
            <div className="relative">
              <select
                value={selectedBusinessType}
                onChange={(e) => setSelectedBusinessType(e.target.value)}
                className="w-full px-3 py-3 bg-surface border-2 border-outline-variant rounded-xl text-sm font-medium focus:outline-none focus:border-[#25D366] appearance-none"
              >
                <option value="">All Business Types</option>
                {businessTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none" />
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              Sort By
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={`
                    px-3 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95
                    ${sortBy === option.value
                      ? "bg-[#25D366] text-white shadow-md shadow-[#25D366]/20"
                      : "bg-surface border-2 border-outline-variant text-on-surface-variant hover:border-[#25D366]/50"
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              Price Range (KES)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={priceRangeMin}
                onChange={(e) => setPriceRangeMin(e.target.value ? Number(e.target.value) : "")}
                placeholder="Min"
                className="flex-1 px-3 py-3 bg-surface border-2 border-outline-variant rounded-xl text-sm font-medium focus:outline-none focus:border-[#25D366]"
              />
              <span className="text-outline font-bold">-</span>
              <input
                type="number"
                value={priceRangeMax}
                onChange={(e) => setPriceRangeMax(e.target.value ? Number(e.target.value) : "")}
                placeholder="Max"
                className="flex-1 px-3 py-3 bg-surface border-2 border-outline-variant rounded-xl text-sm font-medium focus:outline-none focus:border-[#25D366]"
              />
            </div>
          </div>

          {/* Clear All */}
          {hasActiveFilters && (
            <button
              onClick={handleClearAll}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#ef4444]/10 text-[#ef4444] rounded-xl font-bold hover:bg-[#ef4444]/20 transition-colors active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              Clear All Filters
            </button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-surface border-t border-outline-variant p-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-bold shadow-lg shadow-[#25D366]/25 hover:shadow-xl active:scale-95 transition-all"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
