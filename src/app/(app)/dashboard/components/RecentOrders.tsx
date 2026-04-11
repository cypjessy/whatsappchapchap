"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { dashboardService, OrderData } from "@/lib/dashboard";
import { formatCurrency } from "@/lib/currency";
import Link from "next/link";

interface RecentOrdersProps {
  refreshTrigger?: number;
}

export function RecentOrders({ refreshTrigger }: RecentOrdersProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data = await dashboardService.getRecentOrders(user, 5);
        setOrders(data);
      } catch (error) {
        console.error("Error loading orders:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, [user, refreshTrigger]);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "pending":
        return { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", label: "Pending" };
      case "processing":
        return { bg: "rgba(59,130,246,0.1)", color: "#3b82f6", label: "Processing" };
      case "shipped":
        return { bg: "rgba(139,92,246,0.1)", color: "#8b5cf6", label: "Shipped" };
      case "delivered":
        return { bg: "rgba(37,211,102,0.1)", color: "#25D366", label: "Delivered" };
      case "cancelled":
        return { bg: "rgba(239,68,68,0.1)", color: "#ef4444", label: "Cancelled" };
      default:
        return { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", label: "Pending" };
    }
  };

  const formatTime = (createdAt: any) => {
    if (!createdAt) return "Just now";
    try {
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays === 1) return "Yesterday";
      return `${diffDays} days ago`;
    } catch {
      return "Just now";
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm">
        <div className="p-6 border-b border-[#e2e8f0] flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <i className="fas fa-list text-[#3b82f6]"></i>
            Recent Orders
          </h3>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm">
        <div className="p-6 border-b border-[#e2e8f0] flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <i className="fas fa-list text-[#3b82f6]"></i>
            Recent Orders
          </h3>
          <Link href="/orders" className="px-4 py-2 bg-[#f1f5f9] text-sm font-semibold rounded-lg hover:bg-[#e2e8f0] transition-all">
            View All
          </Link>
        </div>
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-[#f1f5f9] rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-shopping-bag text-2xl text-[#64748b]"></i>
          </div>
          <h4 className="font-bold text-[#1e293b] mb-2">No orders yet</h4>
          <p className="text-sm text-[#64748b]">When customers order from you, they will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm">
      <div className="p-6 border-b border-[#e2e8f0] flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <i className="fas fa-list text-[#3b82f6]"></i>
          Recent Orders
        </h3>
        <Link href="/orders" className="px-4 py-2 bg-[#f1f5f9] text-sm font-semibold rounded-lg hover:bg-[#e2e8f0] transition-all">
          View All
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#f1f5f9]">
              <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-[#64748b]">Order ID</th>
              <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-[#64748b]">Product</th>
              <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-[#64748b]">Customer</th>
              <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-[#64748b]">Amount</th>
              <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-[#64748b]">Status</th>
              <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-[#64748b]">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => {
              const statusStyle = getStatusStyles(order.status);
              return (
                <tr key={index} className="border-t border-[#e2e8f0] hover:bg-[#f1f5f9]">
                  <td className="p-4 font-bold text-[#25D366]">#{order.id}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 bg-gradient-to-b ${order.productEmojiBg} rounded-lg flex items-center justify-center text-2xl`}>
                        {order.productEmoji}
                      </div>
                      <div>
                        <div className="font-bold">{order.productName}</div>
                        <div className="text-xs text-[#64748b]">{order.details}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">{order.customerName}</td>
                  <td className="p-4 font-bold">{formatCurrency(order.amount)}</td>
                  <td className="p-4">
                    <span
                      className="px-3 py-1 text-xs font-bold rounded-full"
                      style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                    >
                      {statusStyle.label}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-[#64748b]">{formatTime(order.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
