"use client";

import { useState, useEffect, useRef } from "react";
import { Customer } from "@/lib/db";
import CustomerCard from "./CustomerCard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomerGridViewProps {
  customers: Customer[];
  bulkMode: boolean;
  bulkSelected: string[];
  onToggleSelection: (customerId: string) => void;
  onSelectCustomer: (customer: Customer) => void;
  onSendWhatsApp: (phone: string) => void;
  onShareWhatsApp: (customer: Customer) => void;
  onDuplicate: (customer: Customer) => void;
  onPrintProfile: (customer: Customer) => void;
  onBulkActivate: (customerId: string) => void;
  onBulkSetVIP: (customerId: string) => void;
  onBulkDelete: (customerId: string) => void;
  getColorFromString: (str: string) => string;
  getInitials: (name: string) => string;
  formatCurrency: (amount: number) => string;
  isLoading?: boolean;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ShimmerCard() {
  return (
    <div className="bg-surface rounded-xl md:rounded-2xl border border-outline-variant p-4 md:p-5 overflow-hidden relative animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-surface-variant shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-surface-variant rounded-lg w-3/4" />
          <div className="h-3 bg-surface-variant rounded-lg w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 bg-surface rounded-lg" />
        ))}
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-surface-variant rounded-lg w-full" />
        <div className="h-4 bg-surface-variant rounded-lg w-3/4" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-9 bg-surface-variant rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function EmptyState({
  hasFilters,
  onClearFilters,
}: {
  hasFilters: boolean;
  onClearFilters?: () => void;
}) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 md:py-24 text-on-surface-variant animate-fadeIn">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-[#ede9fe] to-[#f5f3ff] flex items-center justify-center mb-6 shadow-md3-level1">
        <i className="fas fa-users text-3xl md:text-4xl text-[#8b5cf6]/40" />
      </div>
      <h3 className="text-xl md:text-2xl font-extrabold text-on-surface mb-2">No Customers Found</h3>
      <p className="text-sm md:text-base text-outline max-w-md text-center mb-6">
        {hasFilters
          ? "Try adjusting your filters or search criteria to find what you're looking for."
          : "Your customer list is empty. Add your first customer to get started."}
      </p>
      {hasFilters && onClearFilters && (
        <button
          onClick={onClearFilters}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl font-bold shadow-md3-level3 shadow-[#8b5cf6]/25 hover:shadow-md3-level4 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
        >
          <i className="fas fa-times-circle" />
          Clear Filters
        </button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CustomerGridView({
  customers,
  bulkMode,
  bulkSelected,
  onToggleSelection,
  onSelectCustomer,
  onSendWhatsApp,
  onShareWhatsApp,
  onDuplicate,
  onPrintProfile,
  onBulkActivate,
  onBulkSetVIP,
  onBulkDelete,
  getColorFromString,
  getInitials,
  formatCurrency,
  isLoading = false,
}: CustomerGridViewProps) {
  const [visibleCount, setVisibleCount] = useState(12);
  const containerRef = useRef<HTMLDivElement>(null);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        setVisibleCount((prev) => Math.min(prev + 6, customers.length));
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [customers.length]);

  // Reset visible count when customers change
  useEffect(() => {
    setVisibleCount(12);
  }, [customers.length]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <ShimmerCard key={i} />
        ))}
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="grid grid-cols-1 mb-6">
        <EmptyState hasFilters={false} />
      </div>
    );
  }

  const visibleCustomers = customers.slice(0, visibleCount);
  const hasMore = visibleCount < customers.length;

  return (
    <div ref={containerRef} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6">
        {visibleCustomers.map((customer, index) => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            bulkMode={bulkMode}
            isSelected={bulkSelected.includes(customer.id)}
            onToggleSelection={onToggleSelection}
            onSelectCustomer={onSelectCustomer}
            onSendWhatsApp={onSendWhatsApp}
            onShareWhatsApp={onShareWhatsApp}
            onDuplicate={onDuplicate}
            onPrintProfile={onPrintProfile}
            onBulkActivate={onBulkActivate}
            onBulkSetVIP={onBulkSetVIP}
            onBulkDelete={onBulkDelete}
            getColorFromString={getColorFromString}
            getInitials={getInitials}
            formatCurrency={formatCurrency}
            index={index}
          />
        ))}

        {customers.length === 0 && (
          <EmptyState
            hasFilters={true}
            onClearFilters={() => {
              // This should be passed from parent or handled via context
              window.dispatchEvent(new CustomEvent("clearCustomerFilters"));
            }}
          />
        )}
      </div>

      {/* Load more indicator */}
      {hasMore && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2 text-sm text-outline font-medium">
            <div className="w-4 h-4 border-2 border-outline-variant border-t-[#8b5cf6] rounded-full animate-spin" />
            Loading more...
          </div>
        </div>
      )}

      {/* End of list */}
      {!hasMore && customers.length > 12 && (
        <div className="text-center py-4 text-xs text-outline font-medium">
          <i className="fas fa-check-circle text-[#10b981] mr-1" />
          All {customers.length} customers loaded
        </div>
      )}
    </div>
  );
}