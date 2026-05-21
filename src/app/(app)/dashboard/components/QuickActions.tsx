"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useHaptics } from "@/hooks/useNativeAndroid";
import { dashboardService } from "@/lib/dashboard";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuickActionItem {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  href: string;
  gradient: string;
  shadowColor: string;
  badge?: number;
  badgeColor?: string;
}

interface QuickActionsProps {
  onActionClick?: (actionId: string) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: "add-product",
    label: "Add Product",
    sublabel: "List new items",
    icon: "fa-plus",
    href: "/products?action=add",
    gradient: "bg-[#25D366]",
    shadowColor: "shadow-[#25D366]/20",
  },
  {
    id: "orders",
    label: "Orders",
    sublabel: "pending",
    icon: "fa-shopping-bag",
    href: "/orders",
    gradient: "bg-[#3B82F6]",
    shadowColor: "shadow-[#3B82F6]/20",
    badgeColor: "bg-[#EF4444]",
  },
  {
    id: "customers",
    label: "Customers",
    sublabel: "Manage contacts",
    icon: "fa-users",
    href: "/customers",
    gradient: "bg-[#8B5CF6]",
    shadowColor: "shadow-[#8B5CF6]/20",
  },
  {
    id: "new-booking",
    label: "New Booking",
    sublabel: "Schedule now",
    icon: "fa-calendar-plus",
    href: "/bookings?action=new",
    gradient: "bg-[#F59E0B]",
    shadowColor: "shadow-[#F59E0B]/20",
  },
];

// ─── Animated Counter Hook ────────────────────────────────────────────────────

function useAnimatedCounter(target: number | undefined, duration: number = 800) {
  const actualTarget = target ?? 0;
  const [count, setCount] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(actualTarget * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current!);
  }, [actualTarget, duration]);

  return count;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function TouchRipple({
  children,
  onClick,
  className = "",
  href,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  href: string;
}) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((prev) => [...prev, { x, y, id }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
  };

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative block select-none overflow-hidden rounded-2xl ${className}`}
    >
      <span className="relative block" onPointerDown={handlePointerDown}>
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute bg-black/10 rounded-full pointer-events-none animate-materialRipple"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 1,
              height: 1,
            }}
          />
        ))}
        {children}
      </span>
    </Link>
  );
}

function ActionCard({
  action,
  index,
  badgeValue,
  onClick,
}: {
  action: QuickActionItem;
  index: number;
  badgeValue?: number;
  onClick?: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const animatedBadge = useAnimatedCounter(badgeValue || 0);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  const handlePointerDown = () => {
    setIsPressed(true);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(15);
    }
  };

  const handlePointerUp = () => setIsPressed(false);

  const displayBadge = action.id === "orders" ? badgeValue : undefined;

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={onClick}
      className={`
        transition-all duration-300 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
        ${isPressed ? "scale-[0.96]" : "scale-100"}
      `}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <TouchRipple href={action.href} className="h-full">
        <div
          className={`
            bg-surface rounded-2xl border border-outline-variant p-4 md:p-5 text-center h-full
            shadow-md3-level1 hover:shadow-md3-level2 hover:border-outline-variant
            hover:-translate-y-0.5 active:translate-y-0
            transition-all duration-200 ease-out
            flex flex-col items-center justify-center
          `}
        >
          {/* Icon container - MD3 tonal system */}
          <div className="relative inline-block mb-3">
            <div
              className={`
                w-12 h-12 md:w-14 md:h-14 mx-auto rounded-2xl
                ${action.gradient}
                flex items-center justify-center
                shadow-md3-level2 ${action.shadowColor}
                group-hover:scale-105 group-hover:shadow-md3-level3
                transition-all duration-200
              `}
            >
              <i className={`fas ${action.icon} text-white text-lg md:text-xl`} />
            </div>

            {/* Badge - MD3 chip styling */}
            {displayBadge !== undefined && displayBadge > 0 && (
              <span
                className={`
                  absolute -top-1 -right-1 md:-top-1.5 md:-right-1.5
                  min-w-[20px] h-5 px-1
                  ${action.badgeColor || "bg-[#EF4444]"} text-white
                  text-[10px] font-bold rounded-full
                  flex items-center justify-center
                  border-2 border-white shadow-md3-level1
                  animate-badgePop
                `}
              >
                {animatedBadge > 99 ? "99+" : animatedBadge}
              </span>
            )}
          </div>

          {/* Label - MD3 typography */}
          <div className="font-semibold text-sm md:text-base text-on-surface group-hover:text-[#25D366] transition-colors duration-200">
            {action.label}
          </div>

          {/* Sublabel - MD3 body style */}
          <div className="text-[11px] md:text-xs text-outline mt-0.5 font-medium">
            {action.id === "orders" && displayBadge !== undefined
              ? `${displayBadge} pending`
              : action.sublabel}
          </div>
        </div>
      </TouchRipple>
    </div>
  );
}

function ShimmerCard({ index }: { index: number }) {
  return (
    <div
      className={`
        md3-card-elevated p-4 md:p-5 overflow-hidden relative
        animate-pulse
      `}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-[var(--md-sys-color-surface)]/60 to-transparent" />
      <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 bg-[var(--md-sys-color-surface-variant)] rounded-2xl" />
      <div className="h-4 bg-[var(--md-sys-color-surface-variant)] rounded-lg w-20 mx-auto mb-2" />
      <div className="h-3 bg-[var(--md-sys-color-surface-variant)] rounded-lg w-16 mx-auto" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function QuickActions({ onActionClick }: QuickActionsProps) {
  const { user } = useAuth();
  const [pendingOrders, setPendingOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const { impactMedium } = useHaptics();

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const stats = await dashboardService.getStats(user);
        setPendingOrders(stats.pendingOrders || 0);
      } catch (error) {
        console.error("Error loading quick actions:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const handleActionClick = useCallback(
    async (actionId: string) => {
      await impactMedium();
      onActionClick?.(actionId);
    },
    [onActionClick, impactMedium]
  );

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {QUICK_ACTIONS.map((_, i) => (
          <ShimmerCard key={i} index={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6 md:mb-8">
      {/* Mobile: 2x2 Grid */}
      <div className="md:hidden grid grid-cols-2 gap-3">
        {QUICK_ACTIONS.map((action, index) => (
          <div
            key={action.id}
            onClick={() => handleActionClick(action.id)}
          >
            <ActionCard
              action={action}
              index={index}
              badgeValue={action.id === "orders" ? pendingOrders : undefined}
            />
          </div>
        ))}
      </div>

      {/* Desktop: Grid */}
      <div className="hidden md:grid grid-cols-4 gap-4">
        {QUICK_ACTIONS.map((action, index) => (
          <div
            key={action.id}
            onClick={() => handleActionClick(action.id)}
          >
            <ActionCard
              action={action}
              index={index}
              badgeValue={action.id === "orders" ? pendingOrders : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}