"use client";

import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
  context?: "customers" | "orders" | "bookings" | "services" | "products";
  searchQuery?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const CONTEXT_CONFIG = {
  customers: {
    icon: "fa-users",
    title: "No customers found",
    subtitle: "Add your first customer to start building your CRM.",
    filterSubtitle: "Try adjusting your filters or search criteria.",
    emptySubtitle: "Get started by adding a new customer to your database.",
  },
  orders: {
    icon: "fa-shopping-bag",
    title: "No orders found",
    subtitle: "Orders will appear here once customers start booking.",
    filterSubtitle: "No orders match your current filters.",
    emptySubtitle: "New orders will be displayed here automatically.",
  },
  bookings: {
    icon: "fa-calendar-alt",
    title: "No bookings found",
    subtitle: "Bookings will appear here once scheduled.",
    filterSubtitle: "Try different dates or filter criteria.",
    emptySubtitle: "Use the calendar to create your first booking.",
  },
  services: {
    icon: "fa-cut",
    title: "No services found",
    subtitle: "Add services to offer to your customers.",
    filterSubtitle: "No services match your search.",
    emptySubtitle: "Create your first service to get started.",
  },
  products: {
    icon: "fa-box",
    title: "No products found",
    subtitle: "Add products to your inventory.",
    filterSubtitle: "Try adjusting your product filters.",
    emptySubtitle: "Start building your product catalog today.",
  },
};

// ─── Main Component ─────────────────────────────────────────────────────────

export default function EmptyState({
  hasFilters,
  onClearFilters,
  context = "customers",
  searchQuery,
}: EmptyStateProps) {
  const [isVisible, setIsVisible] = useState(false);
  const config = CONTEXT_CONFIG[context];

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const subtitle = hasFilters
    ? config.filterSubtitle
    : searchQuery
      ? `No results for "${searchQuery}". Try a different search term.`
      : config.emptySubtitle;

  return (
    <div
      className={`
        relative overflow-hidden bg-white rounded-2xl border border-[#e2e8f0] 
        shadow-sm transition-all duration-500 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
      `}
    >
      {/* Subtle background decoration */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#8b5cf6] to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#25D366] to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative p-8 md:p-12 lg:p-16 text-center">
        {/* Animated icon container */}
        <div
          className={`
            relative mx-auto mb-5 md:mb-6 w-16 h-16 md:w-20 md:h-20
            transition-all duration-500 delay-100
            ${isVisible ? "scale-100 rotate-0" : "scale-50 -rotate-12"}
          `}
        >
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#8b5cf6]/10 to-[#25D366]/10 animate-pulse" />
          
          <div className="relative w-full h-full bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] rounded-2xl flex items-center justify-center border border-[#e2e8f0] shadow-inner">
            <i className={`fas ${config.icon} text-2xl md:text-3xl text-[#94a3b8]`} />
          </div>
        </div>

        {/* Title */}
        <h3
          className={`
            font-extrabold text-lg md:text-xl text-[#1e293b] mb-2
            transition-all duration-500 delay-200
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}
          `}
        >
          {config.title}
        </h3>

        {/* Subtitle */}
        <p
          className={`
            text-sm text-[#64748b] max-w-sm mx-auto leading-relaxed mb-5
            transition-all duration-500 delay-300
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}
          `}
        >
          {subtitle}
        </p>

        {/* Action button */}
        <div
          className={`
            transition-all duration-500 delay-400
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}
          `}
        >
          {hasFilters ? (
            <button
              onClick={onClearFilters}
              className={`
                inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                bg-[#f5f3ff] text-[#8b5cf6] font-semibold text-sm
                border-2 border-[#ede9fe]
                hover:bg-[#8b5cf6] hover:text-white hover:border-[#8b5cf6]
                hover:shadow-lg hover:shadow-[#8b5cf6]/20 hover:-translate-y-0.5
                transition-all duration-200 active:scale-95
              `}
            >
              <i className="fas fa-undo text-xs" />
              Clear all filters
            </button>
          ) : searchQuery ? (
            <button
              onClick={onClearFilters}
              className={`
                inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                bg-[#f1f5f9] text-[#64748b] font-semibold text-sm
                border-2 border-[#e2e8f0]
                hover:border-[#64748b] hover:text-[#1e293b]
                transition-all duration-200 active:scale-95
              `}
            >
              <i className="fas fa-times text-xs" />
              Clear search
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 text-xs text-[#94a3b8]">
              <i className="fas fa-lightbulb text-[#f59e0b]" />
              <span>Tip: Use the button above to add your first item</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}