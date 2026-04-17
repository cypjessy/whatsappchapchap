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
        setPendingOrders(stats.pendingOrders);
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="android-card p-4 md:p-6">
            <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 bg-gray-200 rounded-2xl animate-pulse"></div>
            <div className="h-3 md:h-4 bg-gray-200 rounded w-16 md:w-20 mx-auto"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
      <Link href="/products?action=add" className="android-card p-4 md:p-6 text-center touch-ripple">
        <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-2xl flex items-center justify-center">
          <i className="fas fa-plus text-white text-xl"></i>
        </div>
        <div className="font-bold text-sm">Add Product</div>
        <div className="text-xs text-[#64748b] hidden md:block">List new items</div>
      </Link>
      
      <Link href="/orders" className="android-card p-4 md:p-6 text-center touch-ripple">
        <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] rounded-2xl flex items-center justify-center">
          <i className="fas fa-shopping-bag text-white text-xl"></i>
        </div>
        <div className="font-bold text-sm">Orders</div>
        <div className="text-xs text-[#64748b] hidden md:block">{pendingOrders} pending</div>
      </Link>
      
      <Link href="/customers?action=broadcast" className="android-card p-4 md:p-6 text-center touch-ripple">
        <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] rounded-2xl flex items-center justify-center">
          <i className="fas fa-broadcast-tower text-white text-xl"></i>
        </div>
        <div className="font-bold text-sm">Broadcast</div>
        <div className="text-xs text-[#64748b] hidden md:block">Bulk message</div>
      </Link>
      
      <Link href="/suppliers" className="android-card p-4 md:p-6 text-center touch-ripple">
        <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 bg-gradient-to-r from-[#f59e0b] to-[#d97706] rounded-2xl flex items-center justify-center">
          <i className="fas fa-truck text-white text-xl"></i>
        </div>
        <div className="font-bold text-sm">Suppliers</div>
        <div className="text-xs text-[#64748b] hidden md:block">Manage</div>
      </Link>
    </div>
  );
}
