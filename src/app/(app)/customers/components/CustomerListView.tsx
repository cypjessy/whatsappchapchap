"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Customer } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomerListViewProps {
  customers: Customer[];
  bulkMode: boolean;
  bulkSelected: string[];
  onToggleSelection: (customerId: string) => void;
  onSelectCustomer: (customer: Customer) => void;
  onShareWhatsApp: (customer: Customer) => void;
  onPrintProfile: (customer: Customer) => void;
  getColorFromString: (str: string) => string;
  getInitials: (name: string) => string;
  formatCurrency: (amount: number) => string;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getCustomerTier(totalSpent: number = 0): { label: string; icon: string; color: string } {
  if (totalSpent >= 50000) return { label: "VIP", icon: "fa-crown", color: "text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20" };
  if (totalSpent >= 20000) return { label: "Gold", icon: "fa-star", color: "text-[#fbbf24] bg-[#fbbf24]/10 border-[#fbbf24]/20" };
  if (totalSpent >= 5000) return { label: "Silver", icon: "fa-medal", color: "text-[#94a3b8] bg-[#94a3b8]/10 border-[#94a3b8]/20" };
  return { label: "Regular", icon: "fa-user", color: "text-[#64748b] bg-[#64748b]/10 border-[#64748b]/20" };
}

function getDaysSince(date?: string): string {
  if (!date) return "Never";
  const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ShimmerCard() {
  return (
    <div className="bg-white rounded-xl p-3.5 border border-[#e2e8f0] overflow-hidden relative">
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-[#f1f5f9] shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <div className="h-4 bg-[#f1f5f9] rounded-lg w-32" />
            <div className="h-4 bg-[#f1f5f9] rounded-lg w-20" />
          </div>
          <div className="h-3 bg-[#f1f5f9] rounded-lg w-24" />
        </div>
      </div>
    </div>
  );
}

function CustomerCard({
  customer,
  index,
  bulkMode,
  isSelected,
  onToggleSelection,
  onSelectCustomer,
  onShareWhatsApp,
  onPrintProfile,
  getColorFromString,
  getInitials,
  formatCurrency,
}: {
  customer: Customer;
  index: number;
  bulkMode: boolean;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onSelectCustomer: (c: Customer) => void;
  onShareWhatsApp: (c: Customer) => void;
  onPrintProfile: (c: Customer) => void;
  getColorFromString: (str: string) => string;
  getInitials: (name: string) => string;
  formatCurrency: (amount: number) => string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartX = useRef(0);
  const tier = getCustomerTier(customer.totalSpent);
  const lastVisit = getDaysSince(customer.lastVisit || customer.updatedAt);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 60);
    return () => clearTimeout(timer);
  }, [index]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const diff = touchStartX.current - e.touches[0].clientX;
    if (diff > 0 && diff < 120) {
      setSwipeOffset(diff);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (swipeOffset > 60) {
      setSwipeOffset(100);
    } else {
      setSwipeOffset(0);
    }
  }, [swipeOffset]);

  const handleCardClick = useCallback(() => {
    if (bulkMode) {
      onToggleSelection(customer.id);
    } else {
      onSelectCustomer(customer);
    }
  }, [bulkMode, customer.id, onToggleSelection, onSelectCustomer]);

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border transition-all duration-300
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        ${isSelected
          ? "border-[#8b5cf6] bg-[#ede9fe]/30 shadow-md shadow-[#8b5cf6]/10"
          : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
        }
        ${isHovered && !bulkMode ? "shadow-lg shadow-[#e2e8f0]/40 -translate-y-0.5" : "shadow-sm"}
      `}
      style={{ transitionDelay: `${index * 60}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe reveal actions */}
      <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-3 z-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShareWhatsApp(customer);
            setSwipeOffset(0);
          }}
          className="w-12 h-12 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          <i className="fab fa-whatsapp text-lg" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrintProfile(customer);
            setSwipeOffset(0);
          }}
          className="w-12 h-12 rounded-xl bg-[#3b82f6] text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          <i className="fas fa-print text-lg" />
        </button>
      </div>

      {/* Main card content */}
      <div
        className="relative z-10 bg-white transition-transform duration-200 ease-out"
        style={{ transform: `translateX(-${swipeOffset}px)` }}
        onClick={handleCardClick}
      >
        <div className="p-3.5">
          <div className="flex items-center gap-3">
            {/* Checkbox in bulk mode */}
            {bulkMode && (
              <div
                className={`
                  w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all duration-200
                  ${isSelected
                    ? "bg-[#8b5cf6] border-[#8b5cf6]"
                    : "border-[#e2e8f0] bg-white"
                  }
                `}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelection(customer.id);
                }}
              >
                {isSelected && <i className="fas fa-check text-white text-[10px]" />}
              </div>
            )}

            {/* Avatar */}
            <div
              className={`
                w-11 h-11 rounded-full bg-gradient-to-br ${getColorFromString(customer.name)} 
                flex items-center justify-center font-bold text-sm text-white shrink-0
                transition-transform duration-300
                ${isHovered && !bulkMode ? "scale-110" : "scale-100"}
              `}
            >
              {getInitials(customer.name)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="font-bold text-sm truncate">{customer.name}</div>
                  <span className={`
                    shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md 
                    text-[9px] font-bold uppercase border
                    ${tier.color}
                  `}>
                    <i className={`fas ${tier.icon} text-[8px]`} />
                    {tier.label}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-extrabold text-sm text-[#25D366]">
                    {formatCurrency(customer.totalSpent || 0)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-1.5">
                <div className="flex items-center gap-2 text-[11px] text-[#64748b]">
                  <span className="flex items-center gap-1">
                    <i className="fab fa-whatsapp text-[#25D366] text-[10px]" />
                    {customer.phone}
                  </span>
                  <span className="text-[#e2e8f0]">•</span>
                  <span className="flex items-center gap-1">
                    <i className="fas fa-clock text-[10px] text-[#94a3b8]" />
                    {lastVisit}
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop/tablet action buttons (hidden on small mobile, shown on larger) */}
            {!bulkMode && (
              <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShareWhatsApp(customer);
                  }}
                  className={`
                    w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 active:scale-90
                    text-[#25D366] bg-[rgba(37,211,102,0.1)]
                    hover:bg-[#25D366] hover:text-white hover:shadow-md hover:shadow-[#25D366]/20
                  `}
                  title="Share via WhatsApp"
                  aria-label="Share via WhatsApp"
                >
                  <i className="fab fa-whatsapp text-sm" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPrintProfile(customer);
                  }}
                  className={`
                    w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 active:scale-90
                    text-[#3b82f6] bg-[#eff6ff]
                    hover:bg-[#3b82f6] hover:text-white hover:shadow-md hover:shadow-[#3b82f6]/20
                  `}
                  title="Print Profile"
                  aria-label="Print Profile"
                >
                  <i className="fas fa-print text-sm" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Selection indicator bar */}
        {isSelected && (
          <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#8b5cf6] rounded-r-full" />
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CustomerListView({
  customers,
  bulkMode,
  bulkSelected,
  onToggleSelection,
  onSelectCustomer,
  onShareWhatsApp,
  onPrintProfile,
  getColorFromString,
  getInitials,
  formatCurrency,
}: CustomerListViewProps) {
  const selectedCount = bulkSelected.length;

  if (customers.length === 0) {
    return (
      <div className="md:hidden flex flex-col items-center justify-center py-16 text-[#64748b] animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0] flex items-center justify-center mb-4 shadow-inner">
          <i className="fas fa-users text-2xl text-[#cbd5e1]" />
        </div>
        <p className="text-sm font-bold text-[#475569]">No customers found</p>
        <p className="text-xs text-[#94a3b8] mt-1">Try adjusting your search</p>
      </div>
    );
  }

  return (
    <div className="md:hidden space-y-2.5 mb-4">
      {/* Bulk mode header */}
      {bulkMode && selectedCount > 0 && (
        <div className="flex items-center justify-between px-1 py-2 animate-fadeIn">
          <span className="text-xs font-bold text-[#8b5cf6]">
            {selectedCount} selected
          </span>
          <button
            onClick={() => {
              // Clear all selection - you'd need to expose this from parent
              // For now, just visual indicator
            }}
            className="text-xs font-semibold text-[#ef4444] hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {customers.map((customer, index) => (
        <CustomerCard
          key={customer.id}
          customer={customer}
          index={index}
          bulkMode={bulkMode}
          isSelected={bulkSelected.includes(customer.id)}
          onToggleSelection={onToggleSelection}
          onSelectCustomer={onSelectCustomer}
          onShareWhatsApp={onShareWhatsApp}
          onPrintProfile={onPrintProfile}
          getColorFromString={getColorFromString}
          getInitials={getInitials}
          formatCurrency={formatCurrency}
        />
      ))}
    </div>
  );
}