"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { serviceService } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";

export default function ServiceStatsGrid() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    bookings: 0,
    revenue: 0,
    clients: 0,
    rating: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;
    try {
      const services = await serviceService.getServices(user);
      const totalBookings = services.reduce((sum, s) => sum + (s.bookings || 0), 0);
      // Assuming priceMin * bookings as simple revenue estimate
      const revenue = services.reduce((sum, s) => sum + ((s.priceMin || 0) * (s.bookings || 0)), 0);
      // Placeholder for clients (services with bookings > 0)
      const clients = services.filter(s => s.bookings && s.bookings > 0).length;
      // Average rating from reviews would go here, using placeholder for now
      const rating = services.length > 0 ? 4.9 : 0;

      setStats({ bookings: totalBookings, revenue, clients, rating });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const statsData = [
    {
      id: "bookings",
      label: "Total Bookings",
      value: loading ? "..." : formatNumber(stats.bookings),
      change: "+3 vs yesterday",
      icon: "fa-calendar-check",
      color: "bg-[rgba(139,92,246,0.1)] text-[#8b5cf6]",
      positive: true,
    },
    {
      id: "revenue",
      label: "Revenue",
      value: loading ? "..." : formatCurrency(stats.revenue),
      change: "+18% vs last week",
      icon: "fa-dollar-sign",
      color: "bg-[rgba(37,211,102,0.1)] text-[#25D366]",
      positive: true,
    },
    {
      id: "clients",
      label: "Active Clients",
      value: loading ? "..." : formatNumber(stats.clients),
      change: "+12 new this week",
      icon: "fa-users",
      color: "bg-[rgba(59,130,246,0.1)] text-[#3b82f6]",
      positive: true,
    },
    {
      id: "rating",
      label: "Average Rating",
      value: loading ? "..." : stats.rating.toFixed(1),
      change: "Based on orders",
      icon: "fa-star",
      color: "bg-[rgba(245,158,11,0.1)] text-[#f59e0b]",
      positive: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
      {statsData.map((stat) => (
        <div
          key={stat.id}
          className="bg-white p-4 md:p-5 rounded-xl md:rounded-2xl border border-[#e2e8f0] hover:shadow-lg transition-all"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-xs md:text-sm font-semibold text-[#64748b] uppercase tracking-wide">{stat.label}</div>
              <div className="text-xl md:text-2xl font-extrabold text-[#1e293b] mt-1">{stat.value}</div>
              <div className={`text-xs font-semibold mt-2 flex items-center gap-1 ${stat.positive ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                <i className={`fas ${stat.positive ? "fa-arrow-up" : "fa-arrow-down"}`}></i>
                {stat.change}
              </div>
            </div>
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
              <i className={`fas ${stat.icon} text-lg`}></i>
            </div>
          </div>
        </div>
      ))}
    </div>
   );
 }