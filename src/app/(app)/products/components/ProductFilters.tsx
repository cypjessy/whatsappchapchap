"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  List,
  ChevronDown,
  X,
  ArrowUpDown,
  Package,
  Calendar,
  Tag,
  Loader2,
} from "lucide-react";

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
}

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
  activeFiltersCount = 0,
  onClearAll,
}: ProductFiltersProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Active filter chips
  const filters = [
    searchTerm && { key: "search", label: `Search: "${searchTerm}"`, clear: () => setSearchTerm("") },
    stockFilter !== "all" && {
      key: "stock",
      label: stockFilter === "in" ? "In Stock" : stockFilter === "low" ? "Low Stock" : "Out of Stock",
      clear: () => setStockFilter("all"),
    },
    priceRangeMin !== "" && {
      key: "min",
      label: `Min: $${priceRangeMin}`,
      clear: () => setPriceRangeMin(""),
    },
    priceRangeMax !== "" && {
      key: "max",
      label: `Max: $${priceRangeMax}`,
      clear: () => setPriceRangeMax(""),
    },
    dateRangeStart && {
      key: "start",
      label: `From: ${new Date(dateRangeStart).toLocaleDateString()}`,
      clear: () => setDateRangeStart(""),
    },
    dateRangeEnd && {
      key: "end",
      label: `To: ${new Date(dateRangeEnd).toLocaleDateString()}`,
      clear: () => setDateRangeEnd(""),
    },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  const hasActiveFilters = filters.length > 0;

  // Keyboard shortcut: / to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Clear all helper
  const handleClearAll = useCallback(() => {
    onClearAll?.();
  }, [onClearAll]);

  return (
    <div className="space-y-3 mb-4 md:mb-6">
      {/* Main toolbar */}
      <div className="bg-white rounded-2xl p-3 md:p-4 border border-[#e2e8f0] shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
          {/* Search + quick filters row */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Search with icon and loading */}
            <div className="relative flex-1 lg:flex-none min-w-[200px]">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#25D366]" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products... (press /)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setFocusedField("search")}
                onBlur={() => setFocusedField(null)}
                className={`
                  pl-10 pr-9 py-2.5 bg-[#f8fafc] border-2 rounded-xl text-sm 
                  transition-all duration-200 w-full lg:w-64
                  focus:outline-none focus:ring-2 focus:ring-[#25D366]/20
                  ${focusedField === "search" || searchTerm
                    ? "border-[#25D366] bg-white shadow-sm"
                    : "border-transparent hover:border-[#e2e8f0]"
                  }
                `}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Desktop: Inline filters */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Stock filter */}
              <div className="relative">
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2.5 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm font-medium text-[#64748b] hover:border-[#25D366] focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20 transition-all cursor-pointer"
                >
                  <option value="all">All Stock</option>
                  <option value="in">In Stock</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out of Stock</option>
                </select>
                <Package className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94a3b8] pointer-events-none" />
              </div>

              {/* Price range */}
              <div className="flex items-center gap-1.5 bg-[#f8fafc] rounded-xl border-2 border-[#e2e8f0] p-1 hover:border-[#25D366] transition-all focus-within:border-[#25D366] focus-within:ring-2 focus-within:ring-[#25D366]/20">
                <Tag className="w-3.5 h-3.5 text-[#94a3b8] ml-2" />
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRangeMin}
                  onChange={(e) => setPriceRangeMin(e.target.value ? Number(e.target.value) : "")}
                  className="w-16 px-1 py-1.5 bg-transparent text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none"
                />
                <span className="text-[#94a3b8] text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRangeMax}
                  onChange={(e) => setPriceRangeMax(e.target.value ? Number(e.target.value) : "")}
                  className="w-16 px-1 py-1.5 bg-transparent text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none"
                />
              </div>

              {/* Date range */}
              <div className="flex items-center gap-1.5 bg-[#f8fafc] rounded-xl border-2 border-[#e2e8f0] p-1 hover:border-[#25D366] transition-all focus-within:border-[#25D366] focus-within:ring-2 focus-within:ring-[#25D366]/20">
                <Calendar className="w-3.5 h-3.5 text-[#94a3b8] ml-2" />
                <input
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                  className="px-1 py-1.5 bg-transparent text-sm text-[#1e293b] focus:outline-none w-28"
                />
                <span className="text-[#94a3b8] text-xs">-</span>
                <input
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                  className="px-1 py-1.5 bg-transparent text-sm text-[#1e293b] focus:outline-none w-28"
                />
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2.5 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm font-medium text-[#64748b] hover:border-[#25D366] focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20 transition-all cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="stock-low">Stock: Low to High</option>
                  <option value="stock-high">Stock: High to Low</option>
                  <option value="name-az">Name: A-Z</option>
                  <option value="name-za">Name: Z-A</option>
                </select>
                <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94a3b8] pointer-events-none" />
              </div>
            </div>

            {/* Mobile: Filter toggle */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`
                lg:hidden flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all
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
                  {filters.length}
                </span>
              )}
            </button>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-3 self-end lg:self-auto">
            {/* Active count badge */}
            {hasActiveFilters && (
              <button
                onClick={handleClearAll}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
              >
                <X className="w-3 h-3" />
                Clear {filters.length} filters
              </button>
            )}

            <div className="flex bg-[#f8fafc] rounded-xl p-1 border-2 border-[#e2e8f0]">
              <button
                onClick={() => setView("grid")}
                className={`
                  p-2 rounded-lg transition-all duration-200
                  ${view === "grid"
                    ? "bg-white shadow-sm text-[#25D366] ring-1 ring-[#25D366]/20"
                    : "text-[#94a3b8] hover:text-[#64748b]"
                  }
                `}
                aria-label="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={`
                  p-2 rounded-lg transition-all duration-200
                  ${view === "list"
                    ? "bg-white shadow-sm text-[#25D366] ring-1 ring-[#25D366]/20"
                    : "text-[#94a3b8] hover:text-[#64748b]"
                  }
                `}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile filters panel */}
        {showMobileFilters && (
          <div className="lg:hidden mt-3 pt-3 border-t border-[#e2e8f0] space-y-3 animate-fadeIn">
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="w-full appearance-none pl-9 pr-3 py-2.5 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm font-medium text-[#64748b] focus:border-[#25D366] focus:outline-none"
                >
                  <option value="all">All Stock</option>
                  <option value="in">In Stock</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out of Stock</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94a3b8] pointer-events-none" />
              </div>

              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full appearance-none pl-9 pr-3 py-2.5 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm font-medium text-[#64748b] focus:border-[#25D366] focus:outline-none"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="price-low">Price ↑</option>
                  <option value="price-high">Price ↓</option>
                  <option value="stock-low">Stock ↑</option>
                  <option value="stock-high">Stock ↓</option>
                  <option value="name-az">A-Z</option>
                  <option value="name-za">Z-A</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94a3b8] pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                <input
                  type="number"
                  placeholder="Min Price"
                  value={priceRangeMin}
                  onChange={(e) => setPriceRangeMin(e.target.value ? Number(e.target.value) : "")}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm focus:border-[#25D366] focus:outline-none"
                />
              </div>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                <input
                  type="number"
                  placeholder="Max Price"
                  value={priceRangeMax}
                  onChange={(e) => setPriceRangeMax(e.target.value ? Number(e.target.value) : "")}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm focus:border-[#25D366] focus:outline-none"
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
                  className="w-full pl-9 pr-2 py-2.5 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm focus:border-[#25D366] focus:outline-none"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                <input
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                  className="w-full pl-9 pr-2 py-2.5 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm focus:border-[#25D366] focus:outline-none"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleClearAll}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 animate-fadeIn">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={filter.clear}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f0fdf4] border border-[#25D366]/30 text-xs font-semibold text-[#128C7E] hover:bg-[#25D366] hover:text-white transition-all active:scale-95"
            >
              <span>{filter.label}</span>
              <X className="w-3 h-3 opacity-60 group-hover:opacity-100" />
            </button>
          ))}
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#94a3b8] hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <X className="w-3 h-3" />
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}