"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { dashboardService, DashboardStats } from "@/lib/dashboard";

interface StatsGridProps {
  refreshTrigger?: number;
}

export function StatsGrid({ refreshTrigger }: StatsGridProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data = await dashboardService.getStats(user);
        setStats(data);
      } catch (error) {
        console.error("Error loading stats:", error);
        setStats({
          totalSales: 0,
          totalOrders: 0,
          pendingOrders: 0,
          activeCustomers: 0,
          aiResponseRate: 0,
          salesChange: 0,
          ordersChange: 0,
          newCustomersToday: 0,
        });
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [user, refreshTrigger]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-40"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2">Total Sales</div>
            <div className="text-3xl font-extrabold text-[#1e293b] mb-2">{formatCurrency(stats?.totalSales || 0)}</div>
            <div className="flex items-center gap-1 text-sm">
              <i className="fas fa-arrow-up text-[#00C853]"></i>
              <span className="text-[#00C853] font-semibold">+{stats?.salesChange || 0}%</span>
              <span className="text-[#64748b] font-normal">vs last month</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-[rgba(37,211,102,0.1)] rounded-xl flex items-center justify-center text-[#25D366]">
            <i className="fas fa-dollar-sign text-xl"></i>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2">Total Orders</div>
            <div className="text-3xl font-extrabold text-[#1e293b] mb-2">{stats?.totalOrders || 0}</div>
            <div className="flex items-center gap-1 text-sm">
              <i className="fas fa-arrow-up text-[#00C853]"></i>
              <span className="text-[#00C853] font-semibold">+{stats?.ordersChange || 0}%</span>
              <span className="text-[#64748b] font-normal">vs last month</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-[rgba(59,130,246,0.1)] rounded-xl flex items-center justify-center text-[#3b82f6]">
            <i className="fas fa-shopping-cart text-xl"></i>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2">Active Customers</div>
            <div className="text-3xl font-extrabold text-[#1e293b] mb-2">{stats?.activeCustomers || 0}</div>
            <div className="flex items-center gap-1 text-sm">
              <i className="fas fa-arrow-up text-[#00C853]"></i>
              <span className="text-[#00C853] font-semibold">+{stats?.newCustomersToday || 0}</span>
              <span className="text-[#64748b] font-normal">new today</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-[rgba(245,158,11,0.1)] rounded-xl flex items-center justify-center text-[#f59e0b]">
            <i className="fas fa-users text-xl"></i>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2">AI Response Rate</div>
            <div className="text-3xl font-extrabold text-[#1e293b] mb-2">{stats?.aiResponseRate || 0}%</div>
            <div className="flex items-center gap-1 text-sm">
              <i className="fas fa-check text-[#00C853]"></i>
              <span className="text-[#00C853] font-semibold">{(stats?.aiResponseRate || 0) >= 90 ? "Excellent" : "Good"}</span>
              <span className="text-[#64748b] font-normal">performance</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-[rgba(139,92,246,0.1)] rounded-xl flex items-center justify-center text-[#8b5cf6]">
            <i className="fas fa-robot text-xl"></i>
          </div>
        </div>
      </div>
    </div>
  );
}
