"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { dashboardService } from "@/lib/dashboard";
import Link from "next/link";
import "./quickactions-styles.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuickActionItem {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  href: string;
  gradient: string;
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
    gradient: "from-[#25D366] to-[#128C7E]",
  },
  {
    id: "orders",
    label: "Orders",
    sublabel: "pending",
    icon: "fa-shopping-bag",
    href: "/orders",
    gradient: "from-[#3b82f6] to-[#2563eb]",
    badgeColor: "bg-[#ef4444]",
  },
  {
    id: "broadcast",
    label: "Broadcast",
    sublabel: "Bulk message",
    icon: "fa-broadcast-tower",
    href: "/customers?action=broadcast",
    gradient: "from-[#8b5cf6] to-[#7c3aed]",
  },
  {
    id: "new-booking",
    label: "New Booking",
    sublabel: "Schedule now",
    icon: "fa-calendar-plus",
    href: "/bookings?action=new",
    gradient: "from-[#f59e0b] to-[#d97706]",
  },
];

// ─── Sub-Components ───────────────────────────────────────────────────────────

interface TouchRippleProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  href: string;
  style?: React.CSSProperties;
}

function TouchRipple({
  children,
  onClick,
  className = "",
  href,
  style,
}: TouchRippleProps) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = (e.target as HTMLElement).closest("a")?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
  };

  const content = (
    <span className="relative overflow-hidden block" onPointerDown={handlePointerDown}>
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
  );

  return (
    <Link
      href={href}
      onClick={onClick}
      style={style}
      className={`group relative block select-none active:scale-[0.97] transition-transform duration-100 ${className}`}
    >
      {content}
    </Link>
  );
}

function ActionCard({
  action,
  index,
  badgeValue,
}: {
  action: QuickActionItem;
  index: number;
  badgeValue?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 80);
    return () => clearTimeout(timer);
  }, [index]);

  const displayBadge = action.id === "orders" ? badgeValue : undefined;

  return (
    <TouchRipple
      href={action.href}
      className={`
        bg-white rounded-2xl border border-[#e2e8f0] p-4 md:p-5 text-center
        shadow-sm hover:shadow-md hover:border-[#cbd5e1]
        transition-all duration-300 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {/* Icon container */}
      <div className="relative inline-block mb-3">
        <div
          className={`
            w-12 h-12 md:w-14 md:h-14 mx-auto rounded-2xl
            bg-gradient-to-r ${action.gradient}
            flex items-center justify-center
            shadow-lg shadow-current/20
            group-hover:scale-110 group-hover:shadow-xl
            transition-all duration-300
          `}
        >
          <i className={`fas ${action.icon} text-white text-lg md:text-xl`} />
        </div>

        {/* Badge */}
        {displayBadge !== undefined && displayBadge > 0 && (
          <span
            className={`
              absolute -top-1 -right-1 md:-top-1.5 md:-right-1.5
              min-w-[20px] h-5 px-1
              ${action.badgeColor || "bg-[#ef4444]"} text-white
              text-[10px] font-extrabold rounded-full
              flex items-center justify-center
              border-2 border-white shadow-sm
              animate-badgePop
            `}
          >
            {displayBadge > 99 ? "99+" : displayBadge}
          </span>
        )}
      </div>

      {/* Label */}
      <div className="font-bold text-sm md:text-base text-[#1e293b] group-hover:text-[#25D366] transition-colors duration-200">
        {action.label}
      </div>

      {/* Sublabel */}
      <div className="text-[11px] md:text-xs text-[#94a3b8] mt-0.5 font-medium">
        {action.id === "orders" && displayBadge !== undefined
          ? `${displayBadge} pending`
          : action.sublabel}
      </div>
    </TouchRipple>
  );
}

function ShimmerCard({ index }: { index: number }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 md:p-5 overflow-hidden relative">
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 bg-[#f1f5f9] rounded-2xl" />
      <div className="h-4 bg-[#f1f5f9] rounded-lg w-20 mx-auto mb-2" />
      <div className="h-3 bg-[#f1f5f9] rounded-lg w-16 mx-auto" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function QuickActions({ onActionClick }: QuickActionsProps) {
  const { user } = useAuth();
  const [pendingOrders, setPendingOrders] = useState(0);
  const [loading, setLoading] = useState(true);

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
    (actionId: string) => {
      onActionClick?.(actionId);
    },
    [onActionClick]
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
      {QUICK_ACTIONS.map((action, index) => (
        <div key={action.id} onClick={() => handleActionClick(action.id)}>
          <ActionCard
            action={action}
            index={index}
            badgeValue={action.id === "orders" ? pendingOrders : undefined}
          />
        </div>
      ))}
    </div>
  );
}