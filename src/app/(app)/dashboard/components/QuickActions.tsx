"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { dashboardService } from "@/lib/dashboard";
import Link from "next/link";

export function QuickActions() {
  const { user } = useAuth();
  const [pendingOrders, setPendingOrders] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const stats = await dashboardService.getStats(user);
        setPendingOrders(stats.totalOrders);
      } catch (error) {
        console.error("Error loading quick actions:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-[#e2e8f0]">
            <div className="w-14 h-14 mx-auto mb-4 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-20 mx-auto mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-28 mx-auto"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <Link href="/products?action=add" className="bg-white p-6 rounded-2xl border border-[#e2e8f0] hover:border-[#25D366] hover:-translate-y-1 transition-all text-center cursor-pointer">
        <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-full flex items-center justify-center text-white text-xl">
          <i className="fas fa-plus"></i>
        </div>
        <div className="font-bold">Add Product</div>
        <div className="text-xs text-[#64748b]">List new items quickly</div>
      </Link>
      
      <Link href="/orders" className="bg-white p-6 rounded-2xl border border-[#e2e8f0] hover:border-[#25D366] hover:-translate-y-1 transition-all text-center cursor-pointer">
        <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] rounded-full flex items-center justify-center text-white text-xl">
          <i className="fas fa-shopping-bag"></i>
        </div>
        <div className="font-bold">New Orders</div>
        <div className="text-xs text-[#64748b]">{pendingOrders} orders total</div>
      </Link>
      
      <Link href="/ai-assistant" className="bg-white p-6 rounded-2xl border border-[#e2e8f0] hover:border-[#25D366] hover:-translate-y-1 transition-all text-center cursor-pointer">
        <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] rounded-full flex items-center justify-center text-white text-xl">
          <i className="fas fa-robot"></i>
        </div>
        <div className="font-bold">AI Assistant</div>
        <div className="text-xs text-[#64748b]">Automate responses</div>
      </Link>
      
      <Link href="/analytics" className="bg-white p-6 rounded-2xl border border-[#e2e8f0] hover:border-[#25D366] hover:-translate-y-1 transition-all text-center cursor-pointer">
        <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-r from-[#f59e0b] to-[#d97706] rounded-full flex items-center justify-center text-white text-xl">
          <i className="fas fa-chart-pie"></i>
        </div>
        <div className="font-bold">Reports</div>
        <div className="text-xs text-[#64748b]">View insights</div>
      </Link>
    </div>
  );
}
