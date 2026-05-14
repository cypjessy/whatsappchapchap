"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { dashboardService, OrderData } from "@/lib/dashboard";
import { formatCurrency } from "@/lib/currency";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecentOrdersProps {
  refreshTrigger?: number;
  maxItems?: number;
  showViewAll?: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, {
  bg: string;
  text: string;
  border: string;
  dot: string;
  label: string;
  icon: string;
}> = {
  pending: {
    bg: "bg-[#FEF3C7]",
    text: "text-[#F59E0B]",
    border: "border-[#F59E0B]/20",
    dot: "bg-[#F59E0B]",
    label: "Pending",
    icon: "fa-clock",
  },
  processing: {
    bg: "bg-[#EFF6FF]",
    text: "text-[#3B82F6]",
    border: "border-[#3B82F6]/20",
    dot: "bg-[#3B82F6]",
    label: "Processing",
    icon: "fa-cog fa-spin",
  },
  shipped: {
    bg: "bg-[#F3E8FF]",
    text: "text-[#8B5CF6]",
    border: "border-[#8B5CF6]/20",
    dot: "bg-[#8B5CF6]",
    label: "Shipped",
    icon: "fa-truck",
  },
  delivered: {
    bg: "bg-[#E8F5E9]",
    text: "text-[#25D366]",
    border: "border-[#25D366]/20",
    dot: "bg-[#25D366]",
    label: "Delivered",
    icon: "fa-check-circle",
  },
  cancelled: {
    bg: "bg-[#FEE2E2]",
    text: "text-[#EF4444]",
    border: "border-[#EF4444]/20",
    dot: "bg-[#EF4444]",
    label: "Cancelled",
    icon: "fa-times-circle",
  },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
}

function formatRelativeTime(createdAt: any): string {
  if (!createdAt) return "Just now";
  try {
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return "Just now";
  }
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ShimmerRow() {
  return (
    <div className="relative overflow-hidden p-4 border-b border-[#F1F5F9]">
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-[#F1F5F9] rounded-xl shrink-0 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <div className="h-4 bg-[#F1F5F9] rounded-lg w-24 animate-pulse" />
            <div className="h-4 bg-[#F1F5F9] rounded-lg w-20 animate-pulse" />
          </div>
          <div className="h-3 bg-[#F1F5F9] rounded-lg w-3/4 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function ShimmerTableRow() {
  return (
    <tr className="border-t border-[#E2E8F0]">
      <td className="p-4"><div className="h-4 bg-[#F1F5F9] rounded w-16 animate-pulse" /></td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#F1F5F9] rounded-xl animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 bg-[#F1F5F9] rounded w-32 animate-pulse" />
            <div className="h-3 bg-[#F1F5F9] rounded w-24 animate-pulse" />
          </div>
        </div>
      </td>
      <td className="p-4"><div className="h-4 bg-[#F1F5F9] rounded w-24 animate-pulse" /></td>
      <td className="p-4"><div className="h-4 bg-[#F1F5F9] rounded w-20 animate-pulse" /></td>
      <td className="p-4"><div className="h-6 bg-[#F1F5F9] rounded-full w-20 animate-pulse" /></td>
      <td className="p-4"><div className="h-4 bg-[#F1F5F9] rounded w-16 animate-pulse" /></td>
    </tr>
  );
}

function MobileOrderCard({
  order,
  index,
}: {
  order: OrderData;
  index: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const status = getStatusConfig(order.status);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 80);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <Link
      href="/orders"
      className={`
        block p-4 border-b border-[#E2E8F0] relative overflow-hidden
        transition-all duration-200 hover:bg-[#F8FAFC]
        ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}
      `}
      style={{ transitionDelay: `${index * 80}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left accent on hover */}
      <div className={`
        absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full transition-all duration-200
        ${isHovered ? "opacity-100" : "opacity-0"}
      `} style={{ backgroundColor: status.dot.replace("bg-[", "").replace("]", "") }} />

      <div className="flex items-center gap-3">
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0
          bg-[#F1F5F9]
          transition-transform duration-200
          ${isHovered ? "scale-105" : "scale-100"}
        `}>
          {order.productEmoji || "📦"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-sm text-[#25D366]">#{order.id}</span>
            <span className="font-bold text-sm">{formatCurrency(order.amount || 0)}</span>
          </div>
          <div className="flex items-center justify-between mt-1.5 gap-2">
            <span className="text-sm text-[#1E293B] truncate">{order.productName}</span>
            <span className={`
              shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full 
              text-[10px] font-semibold uppercase border
              ${status.bg} ${status.text} ${status.border}
            `}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#94A3B8]">
            <i className="fas fa-user text-[10px]" />
            <span className="truncate">{order.customerName}</span>
            <span>•</span>
            <span>{formatRelativeTime(order.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function DesktopTableRow({
  order,
  index,
}: {
  order: OrderData;
  index: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const status = getStatusConfig(order.status);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 60);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <tr
      className={`
        border-t border-[#E2E8F0] relative cursor-pointer
        transition-all duration-200 hover:bg-[#F8FAFC]
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}
      style={{ transitionDelay: `${index * 60}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left accent */}
      <td className="relative p-4">
        <div className={`
          absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full transition-all duration-200
          ${isHovered ? "opacity-100" : "opacity-0"}
        `} style={{ backgroundColor: status.dot.replace("bg-[", "").replace("]", "") }} />
        <span className="font-semibold text-sm text-[#25D366]">#{order.id}</span>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0
            bg-[#F1F5F9]
            transition-transform duration-200
            ${isHovered ? "scale-105" : "scale-100"}
          `}>
            {order.productEmoji || "📦"}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm truncate">{order.productName}</div>
            <div className="text-xs text-[#64748B] truncate">{order.details}</div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#F3E8FF] flex items-center justify-center text-[10px] font-semibold text-[#8B5CF6]">
            {order.customerName?.charAt(0).toUpperCase() || "?"}
          </div>
          <span className="text-sm truncate">{order.customerName}</span>
        </div>
      </td>
      <td className="p-4">
        <span className="font-bold text-sm">{formatCurrency(order.amount || 0)}</span>
      </td>
      <td className="p-4">
        <span className={`
          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full 
          text-[10px] font-semibold uppercase border
          ${status.bg} ${status.text} ${status.border}
        `}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
      </td>
      <td className="p-4 text-sm text-[#64748B]">
        {formatRelativeTime(order.createdAt)}
      </td>
    </tr>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-16 text-[#64748B] animate-fadeIn">
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[#F1F5F9] flex items-center justify-center mb-4">
        <i className="fas fa-shopping-bag text-2xl md:text-3xl text-[#CBD5E1]" />
      </div>
      <h4 className="font-semibold text-base md:text-lg text-[#475569] mb-1">No orders yet</h4>
      <p className="text-sm text-[#94A3B8] max-w-xs text-center">
        When customers order from you, they will appear here automatically.
      </p>
      <Link
        href="/orders"
        className={`
          mt-4 px-4 py-2 rounded-xl text-sm font-semibold
          bg-[#F3E8FF] text-[#8B5CF6] border-2 border-[#EDE9FE]
          hover:bg-[#8B5CF6] hover:text-white hover:border-[#8B5CF6]
          transition-all duration-200 active:scale-95
        `}
      >
        Go to Orders
      </Link>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function RecentOrders({
  refreshTrigger,
  maxItems = 5,
  showViewAll = true,
}: RecentOrdersProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const loadOrders = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data = await dashboardService.getRecentOrders(user, maxItems);
        setOrders(data);
      } catch (error) {
        console.error("Error loading orders:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, [user, refreshTrigger, maxItems]);

  return (
    <div className={`
      bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden
      transition-all duration-300
      ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
    `}>
      {/* Header - MD3 styling */}
      <div className="p-4 md:p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
            <i className="fas fa-list text-[#3B82F6] text-sm" />
          </div>
          <div>
            <h3 className="font-semibold text-sm md:text-base text-[#1E293B]">Recent Orders</h3>
            <span className="text-[10px] text-[#94A3B8] font-medium">
              {orders.length > 0 ? `Last ${orders.length} orders` : "No orders"}
            </span>
          </div>
        </div>

        {showViewAll && (
          <Link
            href="/orders"
            className={`
              px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-semibold
              bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]
              hover:bg-[#8B5CF6] hover:text-white hover:border-[#8B5CF6]
              hover:shadow-md hover:shadow-[#8B5CF6]/20
              transition-all duration-200 active:scale-95
            `}
          >
            View All
          </Link>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <>
          <div className="md:hidden divide-y divide-[#F1F5F9]">
            {[0, 1, 2].map((i) => (
              <ShimmerRow key={i} />
            ))}
          </div>
          <div className="hidden md:block">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="bg-white border-b border-[#E2E8F0]">
                  {["Order ID", "Product", "Customer", "Amount", "Status", "Date"].map((h) => (
                    <th key={h} className="text-left p-4 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2].map((i) => (
                  <ShimmerTableRow key={i} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : orders.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Mobile */}
          <div className="md:hidden divide-y divide-[#E2E8F0]">
            {orders.map((order, index) => (
              <MobileOrderCard key={order.id || index} order={order} index={index} />
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden md:block">
            <div className="overflow-x-auto rounded-b-2xl">
              <table className="w-full min-w-[800px]">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-white border-b border-[#E2E8F0]">
                    {[
                      { label: "Order ID", width: "w-24" },
                      { label: "Product", width: "w-auto" },
                      { label: "Customer", width: "w-40" },
                      { label: "Amount", width: "w-28" },
                      { label: "Status", width: "w-32" },
                      { label: "Date", width: "w-28" },
                    ].map((h) => (
                      <th
                        key={h.label}
                        className={`text-left p-4 text-[11px] font-semibold uppercase tracking-wide text-[#64748B] ${h.width}`}
                      >
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => (
                    <DesktopTableRow key={order.id || index} order={order} index={index} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}