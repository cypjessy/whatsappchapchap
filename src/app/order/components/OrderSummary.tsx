"use client";

import { useState, useEffect, useRef } from "react";
import { CURRENCY_SYMBOL } from "@/lib/currency";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderSummaryProps {
  basePrice: number;
  quantity: number;
  deliveryCost: number;
}

// ─── Animated Number Hook ─────────────────────────────────────────────────────

function useAnimatedNumber(target: number, duration: number = 800, delay: number = 0) {
  const [value, setValue] = useState(target);
  const [previousValue, setPreviousValue] = useState(target);
  const [hasStarted, setHasStarted] = useState(false);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setHasStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!hasStarted) return;

    // Only animate if value actually changed
    if (target === previousValue) return;

    setPreviousValue(target);
    const startTime = performance.now();
    const startValue = previousValue;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + (target - startValue) * eased);

      setValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setValue(target); // Ensure final value is exact
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [hasStarted, target, duration, previousValue]);

  return value;
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function SummaryLine({
  label,
  value,
  isFree,
  delay,
  highlight = false,
}: {
  label: string;
  value: string;
  isFree?: boolean;
  delay: number;
  highlight?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`
        flex justify-between items-center transition-all duration-300
        ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"}
      `}
    >
      <span className="text-sm text-on-surface-variant">{label}</span>
      <span
        className={`
          font-semibold text-sm md:text-base
          ${isFree ? "text-[#10b981]" : highlight ? "text-on-surface" : "text-on-surface"}
          ${isFree ? "flex items-center gap-1.5" : ""}
        `}
      >
        {isFree && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#10b981]/10 text-[10px] font-bold uppercase tracking-wider">
            Saved
          </span>
        )}
        {value}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OrderSummary({
  basePrice,
  quantity,
  deliveryCost,
}: OrderSummaryProps) {
  const [isVisible, setIsVisible] = useState(false);
  const subtotal = basePrice * quantity;
  const total = subtotal + deliveryCost;
  const isFreeShipping = deliveryCost === 0;

  const animatedSubtotal = useAnimatedNumber(subtotal, 800, 200);
  const animatedTotal = useAnimatedNumber(total, 1000, 500);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  return (
    <div
      className={`
        p-4 md:p-6 border-b border-outline-variant relative overflow-hidden
        transition-all duration-500
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(37,211,102,0.05)] to-[rgba(118,75,162,0.05)] pointer-events-none" />
      
      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#25D366]/5 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-24 h-24 rounded-full bg-[#8b5cf6]/5 blur-2xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-gradient-to-br from-[#25D366]/10 to-[#8b5cf6]/10 flex items-center justify-center">
              <i className="fas fa-receipt text-[#25D366] text-sm" />
            </div>
            <h2 className="text-base md:text-lg font-extrabold text-on-surface">
              Order Summary
            </h2>
          </div>
          <span className="text-xs text-outline font-medium">
            {quantity} {quantity === 1 ? "item" : "items"}
          </span>
        </div>

        {/* Line Items */}
        <div className="space-y-3 md:space-y-3.5">
          <SummaryLine
            label={`Subtotal (${quantity} × ${CURRENCY_SYMBOL}${basePrice.toLocaleString()})`}
            value={`${CURRENCY_SYMBOL}${animatedSubtotal.toLocaleString()}`}
            delay={100}
          />

          <SummaryLine
            label="Shipping"
            value={isFreeShipping ? "FREE" : `${CURRENCY_SYMBOL}${deliveryCost.toLocaleString()}`}
            isFree={isFreeShipping}
            delay={200}
          />

          {/* Divider */}
          <div className="relative py-1">
            <div className="border-t-2 border-dashed border-outline-variant" />
            {isFreeShipping && (
              <div className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-white px-2">
                <span className="text-[10px] font-bold text-[#10b981] uppercase tracking-wider">
                  Free Shipping
                </span>
              </div>
            )}
          </div>

          {/* Total */}
          <div
            className={`
              flex justify-between items-end pt-1 transition-all duration-500 delay-300
              ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
            `}
          >
            <span className="font-bold text-base md:text-lg text-on-surface">Total</span>
            <div className="text-right">
              <span className="font-extrabold text-xl md:text-2xl lg:text-3xl text-[#25D366] tracking-tight">
                {CURRENCY_SYMBOL}
                {animatedTotal.toLocaleString()}
              </span>
              <p className="text-[10px] text-outline font-medium mt-0.5">
                All prices include taxes
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}