"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { dashboardService, DashboardStats } from "@/lib/dashboard";
import { formatCurrency } from "@/lib/currency";

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

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2 mb-6 hide-scrollbar">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="android-card p-4 min-w-[140px] flex-shrink-0">
            <div className="animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-16 mb-3"></div>
              <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Mobile: Horizontal scrollable stats */}
      <div className="md:hidden flex gap-3 overflow-x-auto pb-2 mb-6 hide-scrollbar">
        <div className="android-card p-3 min-w-[130px] flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-[rgba(37,211,102,0.1)] rounded-lg flex items-center justify-center text-[#25D366]">
              <i className="fas fa-dollar-sign"></i>
            </div>
          </div>
          <div className="text-xs text-[#64748b]">Sales</div>
          <div className="text-lg font-bold">{formatCurrency(stats?.totalSales || 0)}</div>
          <div className="text-[10px] text-[#00C853]">+{stats?.salesChange || 0}%</div>
        </div>
        
        <div className="android-card p-3 min-w-[130px] flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-[rgba(59,130,246,0.1)] rounded-lg flex items-center justify-center text-[#3b82f6]">
              <i className="fas fa-shopping-bag"></i>
            </div>
          </div>
          <div className="text-xs text-[#64748b]">Orders</div>
          <div className="text-lg font-bold">{stats?.totalOrders || 0}</div>
          <div className="text-[10px] text-[#00C853]">+{stats?.ordersChange || 0}%</div>
        </div>
        
        <div className="android-card p-3 min-w-[130px] flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-[rgba(245,158,11,0.1)] rounded-lg flex items-center justify-center text-[#f59e0b]">
              <i className="fas fa-users"></i>
            </div>
          </div>
          <div className="text-xs text-[#64748b]">Customers</div>
          <div className="text-lg font-bold">{stats?.activeCustomers || 0}</div>
          <div className="text-[10px] text-[#00C853]">+{stats?.newCustomersToday || 0} today</div>
        </div>
        
        <div className="android-card p-3 min-w-[130px] flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-[rgba(139,92,246,0.1)] rounded-lg flex items-center justify-center text-[#8b5cf6]">
              <i className="fas fa-robot"></i>
            </div>
          </div>
          <div className="text-xs text-[#64748b]">AI Rate</div>
          <div className="text-lg font-bold">{stats?.aiResponseRate || 0}%</div>
          <div className="text-[10px] text-[#00C853]">{(stats?.aiResponseRate || 0) >= 90 ? "Excellent" : "Good"}</div>
        </div>
      </div>
      
      {/* Desktop: Grid layout */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="android-card p-6 hover:shadow-md hover:-translate-y-1 transition-all">
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

        <div className="android-card p-6 hover:shadow-md hover:-translate-y-1 transition-all">
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

        <div className="android-card p-6 hover:shadow-md hover:-translate-y-1 transition-all">
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

        <div className="android-card p-6 hover:shadow-md hover:-translate-y-1 transition-all">
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
    </>
  );
}
