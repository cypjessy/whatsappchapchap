"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { bookingService } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";

interface RevenueData {
  label: string;
  revenue: number;
  bookings: number;
}

export default function RevenueChart() {
  const { user } = useAuth();
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month">("week");

  useEffect(() => {
    if (user) {
      loadRevenueData();
    }
  }, [user, period]);

  const loadRevenueData = async () => {
    if (!user) return;
    try {
      const allBookings = await bookingService.getBookings(user);
      
      // Group bookings by day/week
      const grouped: Record<string, { revenue: number; bookings: number }> = {};
      
      const now = new Date();
      const daysToShow = period === "week" ? 7 : 30;
      
      // Initialize data structure
      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const key = date.toISOString().split('T')[0];
        grouped[key] = { revenue: 0, bookings: 0 };
      }

      // Aggregate booking data
      allBookings.forEach(booking => {
        if (booking.status === 'completed' || booking.status === 'confirmed') {
          const bookingDate = booking.date;
          if (grouped[bookingDate]) {
            grouped[bookingDate].revenue += booking.price || 0;
            grouped[bookingDate].bookings += 1;
          }
        }
      });

      // Convert to array with labels
      const data: RevenueData[] = Object.entries(grouped).map(([date, stats]) => {
        const d = new Date(date);
        const label = period === "week" 
          ? d.toLocaleDateString('en-US', { weekday: 'short' })
          : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        return {
          label,
          revenue: stats.revenue,
          bookings: stats.bookings,
        };
      });

      setRevenueData(data);
    } catch (error) {
      console.error("Error loading revenue data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl md:rounded-2xl border border-[#e2e8f0] p-6">
        <div className="animate-pulse h-64 bg-gray-100 rounded-lg"></div>
      </div>
    );
  }

  const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1);
  const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
  const totalBookings = revenueData.reduce((sum, d) => sum + d.bookings, 0);

  return (
    <div className="bg-white rounded-xl md:rounded-2xl border border-[#e2e8f0] overflow-hidden">
      <div className="p-4 md:p-5 border-b border-[#e2e8f0] flex justify-between items-center flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-[#1e293b] flex items-center gap-2">
            <i className="fas fa-chart-line text-[#10b981]"></i>
            Revenue Overview
          </h3>
          <p className="text-xs text-[#64748b] mt-1">
            {formatCurrency(totalRevenue)} • {totalBookings} bookings
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod("week")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              period === "week"
                ? "bg-[#8b5cf6] text-white"
                : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setPeriod("month")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              period === "month"
                ? "bg-[#8b5cf6] text-white"
                : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {revenueData.length > 0 && revenueData.some(d => d.revenue > 0) ? (
          <div className="space-y-3">
            {/* Chart */}
            <div className="h-48 flex items-end gap-2">
              {revenueData.map((data, index) => {
                const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="relative w-full">
                      <div 
                        className="w-full bg-gradient-to-t from-[#8b5cf6] to-[#a78bfa] rounded-t-md transition-all duration-300 hover:from-[#7c3aed] hover:to-[#8b5cf6] cursor-pointer relative"
                        style={{ height: `${Math.max(height, 4)}px` }}
                      >
                        {/* Tooltip */}
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#1e293b] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                          {formatCurrency(data.revenue)}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#64748b] font-medium">{data.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 pt-3 border-t border-[#e2e8f0]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa]"></div>
                <span className="text-xs text-[#64748b]">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-[#10b981]"></div>
                <span className="text-xs text-[#64748b]">Bookings</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-[#64748b]">
            <i className="fas fa-chart-area text-5xl mb-3 opacity-30"></i>
            <p className="font-semibold">No revenue data yet</p>
            <p className="text-sm mt-1">Revenue chart will appear as you complete bookings</p>
          </div>
        )}
      </div>
    </div>
  );
}
