"use client";

import { useState, useEffect } from "react";
import { CURRENCY_SYMBOL } from "@/lib/currency";
import './FooterActions.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FooterActionsProps {
  ordering: boolean;
  currentStock: number;
  total: number;
  onContactSeller: () => void;
  onAddToCart: () => void;
  onPlaceOrder: () => void;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ContactButton({ onClick, isExpanded }: { onClick: () => void; isExpanded: boolean }) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      className={`
        flex items-center justify-center gap-2 rounded-xl border-2 border-[#e2e8f0] bg-white
        text-[#1e293b] font-bold text-sm md:text-base
        transition-all duration-150 active:scale-95
        ${isPressed ? "scale-95 bg-[#f8fafc]" : "scale-100"}
        ${isExpanded ? "flex-1 py-3 md:py-3.5" : "w-12 h-12 md:w-auto md:flex-1 md:py-3"}
      `}
      aria-label="Contact seller on WhatsApp"
      title="Ask Seller"
    >
      <i className="fab fa-whatsapp text-[#25D366] text-lg" />
      {isExpanded && <span className="hidden sm:inline">Ask Seller</span>}
    </button>
  );
}

function AddToCartButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => !disabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => !disabled && setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      className={`
        flex-1 flex items-center justify-center gap-2 rounded-xl font-bold text-sm md:text-base
        transition-all duration-150
        ${disabled
          ? "bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed"
          : "bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white shadow-lg shadow-[#3b82f6]/25 hover:shadow-xl hover:shadow-[#3b82f6]/30 hover:-translate-y-0.5 active:scale-95 active:translate-y-0"
        }
        ${isPressed && !disabled ? "scale-95" : "scale-100"}
        py-3 md:py-3.5
      `}
      aria-label="Add to cart"
    >
      <i className="fas fa-cart-plus" />
      <span className="hidden sm:inline">Add to Cart</span>
      <span className="sm:hidden">Add</span>
    </button>
  );
}

function PlaceOrderButton({
  ordering,
  disabled,
  total,
  onClick,
}: {
  ordering: boolean;
  disabled: boolean;
  total: number;
  onClick: () => void;
}) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled || ordering}
      onMouseDown={() => !disabled && !ordering && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => !disabled && !ordering && setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      className={`
        flex-[2] flex items-center justify-center gap-2 rounded-xl font-bold
        transition-all duration-150 min-w-0
        ${disabled || ordering
          ? "bg-[#94a3b8] text-white/80 cursor-not-allowed"
          : "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white shadow-lg shadow-[#25D366]/25 hover:shadow-xl hover:shadow-[#25D366]/30 hover:-translate-y-0.5 active:scale-95 active:translate-y-0"
        }
        ${isPressed && !disabled && !ordering ? "scale-95" : "scale-100"}
        py-3 md:py-3.5 px-3 md:px-4
      `}
      aria-label={ordering ? "Processing order" : `Place order for ${CURRENCY_SYMBOL}${total.toLocaleString()}`}
    >
      {ordering ? (
        <>
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
          <span className="text-sm md:text-base truncate">Processing...</span>
        </>
      ) : (
        <>
          <i className="fas fa-lock text-sm shrink-0" />
          <span className="flex items-center gap-1.5 min-w-0">
            <span className="hidden md:inline truncate">Place Order</span>
            <span className="md:hidden truncate">Order</span>
            <span className="font-extrabold shrink-0">
              {CURRENCY_SYMBOL}{total.toLocaleString()}
            </span>
          </span>
        </>
      )}
    </button>
  );
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#ef4444]/10 text-[#ef4444] text-[10px] font-bold uppercase tracking-wider border border-[#ef4444]/20">
        <i className="fas fa-times-circle text-[8px]" />
        Out of Stock
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#f59e0b]/10 text-[#f59e0b] text-[10px] font-bold uppercase tracking-wider border border-[#f59e0b]/20">
        <i className="fas fa-exclamation-triangle text-[8px]" />
        Only {stock} left
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#10b981]/10 text-[#10b981] text-[10px] font-bold uppercase tracking-wider border border-[#10b981]/20">
      <i className="fas fa-check-circle text-[8px]" />
      In Stock
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FooterActions({
  ordering,
  currentStock,
  total,
  onContactSeller,
  onAddToCart,
  onPlaceOrder,
}: FooterActionsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const isOutOfStock = currentStock === 0;
  const isLowStock = currentStock > 0 && currentStock <= 5;

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  return (
    <div
      className={`
        sticky bottom-0 z-40 bg-white border-t border-[#e2e8f0]
        shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-sm
        transition-all duration-300
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full"}
      `}
    >
      {/* Stock & Total Info Bar */}
      <div className="px-4 md:px-6 pt-3 pb-1 flex items-center justify-between">
        <StockBadge stock={currentStock} />
        <div className="flex items-center gap-2 text-sm text-[#64748b]">
          <span className="hidden sm:inline">Total:</span>
          <span className="font-extrabold text-[#1e293b] text-base">
            {CURRENCY_SYMBOL}{total.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
        {/* Contact - collapses to icon on small mobile */}
        <ContactButton
          onClick={onContactSeller}
          isExpanded={!isOutOfStock}
        />

        {/* Add to Cart - hidden when out of stock, icon-only on very small screens */}
        {!isOutOfStock && (
          <AddToCartButton
            onClick={onAddToCart}
            disabled={isOutOfStock}
          />
        )}

        {/* Place Order - always visible but disabled when out of stock */}
        <PlaceOrderButton
          ordering={ordering}
          disabled={isOutOfStock}
          total={total}
          onClick={onPlaceOrder}
        />
      </div>

      {/* Safe area padding for mobile */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </div>
  );
}