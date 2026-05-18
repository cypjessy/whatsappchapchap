"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import './SearchBar.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock?: number;
  image?: string;
  images?: string[];
  category?: string;
  brand?: string;
}

interface SearchBarProps {
  tenantId: string;
  customerPhone: string;
  onProductSelect: (product: Product) => void;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function SearchSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="w-12 h-12 rounded-lg bg-[#f1f5f9] shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[#f1f5f9] rounded-lg w-3/4" />
            <div className="h-3 bg-[#f1f5f9] rounded-lg w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-[#64748b] animate-fadeIn">
      <div className="w-14 h-14 rounded-2xl bg-[#f1f5f9] flex items-center justify-center mb-3">
        <i className="fas fa-search text-xl text-[#cbd5e1]" />
      </div>
      <p className="text-sm font-semibold">No products found</p>
      <p className="text-xs text-[#94a3b8] mt-1 max-w-[200px] text-center">
        No results for &quot;{query}&quot;. Try a different search term.
      </p>
    </div>
  );
}

function SearchResultItem({
  product,
  index,
  query,
  onSelect,
}: {
  product: Product;
  index: number;
  query: string;
  onSelect: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 60);
    return () => clearTimeout(timer);
  }, [index]);

  const thumb = product.image || product.images?.[0];

  // Highlight matching text
  const highlightMatch = (text: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="bg-[#25D366]/20 text-[#1e293b] font-bold rounded px-0.5">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div
      className={`
        flex items-center gap-3 p-3 md:p-3.5 cursor-pointer border-b border-[#f1f5f9] last:border-b-0
        transition-all duration-200
        ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"}
        ${isHovered ? "bg-[#f8fafc]" : "bg-white"}
      `}
      style={{ transitionDelay: `${index * 60}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      {/* Thumbnail */}
      {thumb ? (
        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-[#f8fafc]">
          <img
            src={thumb}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-lg bg-[#f1f5f9] flex items-center justify-center text-xl shrink-0">
          📦
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-[#1e293b] truncate">
          {highlightMatch(product.name)}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#64748b]">
          {product.category && (
            <span className="truncate">{product.category}</span>
          )}
          {product.brand && (
            <>
              <span className="text-[#e2e8f0]">•</span>
              <span className="truncate">{product.brand}</span>
            </>
          )}
          {product.price && (
            <>
              <span className="text-[#e2e8f0]">•</span>
              <span className="font-bold text-[#25D366]">KES {product.price.toLocaleString()}</span>
            </>
          )}
        </div>
      </div>

      {/* Arrow */}
      <i className="fas fa-chevron-right text-[10px] text-[#cbd5e1] shrink-0 transition-colors duration-200" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SearchBar({
  tenantId,
  customerPhone,
  onProductSelect,
}: SearchBarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const searchRequestIdRef = useRef<number>(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback((searchTerm: string) => {
    setSearchQuery(searchTerm);
    setSelectedIndex(-1);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const currentRequestId = ++searchRequestIdRef.current;
      setIsSearching(true);

      try {
        const response = await fetch("/api/ai-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            searchQuery: searchTerm,
            tenantId: tenantId,
          }),
        });

        if (!response.ok) throw new Error("Search failed");

        const data = await response.json();

        if (data.success && currentRequestId === searchRequestIdRef.current) {
          setSearchResults(data.results.slice(0, 10));
          setShowSearchResults(true);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        if (currentRequestId === searchRequestIdRef.current) {
          setIsSearching(false);
        }
      }
    }, 400);
  }, [tenantId]);

  const selectSearchResult = useCallback((product: Product) => {
    onProductSelect(product);
    const phoneParam = customerPhone
      ? `&phone=${encodeURIComponent(customerPhone)}`
      : "";
    router.push(`/order?tenant=${tenantId}&product=${product.id}${phoneParam}`);
  }, [customerPhone, onProductSelect, router, tenantId]);

  const closeSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSearchResults) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          selectSearchResult(searchResults[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowSearchResults(false);
        break;
    }
  }, [showSearchResults, searchResults, selectedIndex, selectSearchResult]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const hasResults = searchResults.length > 0;

  return (
    <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#e2e8f0]">
      <div className="max-w-2xl mx-auto px-4 py-3 md:py-4">
        <div ref={searchContainerRef} className="relative">
          {/* Search Input */}
          <div
            className={`
              relative flex items-center rounded-xl md:rounded-2xl border-2 transition-all duration-200 bg-white
              ${isFocused
                ? "border-[#3b82f6] shadow-lg shadow-[#3b82f6]/10"
                : "border-[#e2e8f0] hover:border-[#cbd5e1]"
              }
            `}
          >
            <div className="pl-3.5 md:pl-4 pr-2">
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-[#3b82f6]/30 border-t-[#3b82f6] rounded-full animate-spin" />
              ) : (
                <i
                  className={`
                    fas fa-search text-sm transition-colors duration-200
                    ${isFocused ? "text-[#3b82f6]" : "text-[#94a3b8]"}
                  `}
                />
              )}
            </div>

            <input
              ref={inputRef}
              type="text"
              placeholder="Search products by name, category, brand..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              className="w-full py-2.5 md:py-3 pr-10 bg-transparent text-sm md:text-[15px] outline-none placeholder:text-[#94a3b8] rounded-xl"
              autoComplete="off"
            />

            {/* Clear button */}
            {searchQuery && (
              <button
                onClick={closeSearch}
                className={`
                  absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full
                  flex items-center justify-center
                  transition-all duration-150 active:scale-90
                  bg-[#f1f5f9] text-[#64748b] hover:bg-[#ef4444] hover:text-white
                `}
                aria-label="Clear search"
              >
                <i className="fas fa-times text-[10px]" />
              </button>
            )}
          </div>

          {/* Dropdown Results */}
          {showSearchResults && (
            <div
              className={`
                absolute top-full left-0 right-0 mt-2 rounded-xl md:rounded-2xl
                bg-white border-2 border-[#e2e8f0] shadow-2xl shadow-black/10
                max-h-[60vh] md:max-h-[400px] overflow-y-auto overflow-x-hidden
                animate-fadeIn
              `}
            >
              {/* Header */}
              {!isSearching && hasResults && (
                <div className="sticky top-0 z-10 px-4 py-2.5 bg-white/95 backdrop-blur-sm border-b border-[#f1f5f9] flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
                    Found {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={() => setShowSearchResults(false)}
                    className="text-[10px] font-bold text-[#64748b] hover:text-[#ef4444] transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}

              {/* Content */}
              {isSearching ? (
                <SearchSkeleton />
              ) : !hasResults ? (
                <EmptyState query={searchQuery} />
              ) : (
                <div className="py-1">
                  {searchResults.map((result, index) => (
                    <SearchResultItem
                      key={result.id}
                      product={result}
                      index={index}
                      query={searchQuery}
                      onSelect={() => selectSearchResult(result)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}