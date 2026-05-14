"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { serviceService } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";

interface ServiceStats {
  id: string;
  name: string;
  bookings: number;
  revenue: number;
  emoji: string;
}

export default function TopServices() {
  const { user } = useAuth();
  const [services, setServices] = useState<ServiceStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTopServices();
    }
  }, [user]);

  const loadTopServices = async () => {
    if (!user) return;
    try {
      const allServices = await serviceService.getServices(user);
      
      // Calculate stats for each service
      const stats = allServices.map(s => ({
        id: s.id,
        name: s.name,
        bookings: s.bookings || 0,
        revenue: (s.priceMin || 0) * (s.bookings || 0),
        emoji: s.emoji || '✨',
      }));

      // Sort by bookings and get top 5
      const topServices = stats
        .filter(s => s.bookings > 0)
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);

      setServices(topServices);
    } catch (error) {
      console.error("Error loading top services:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl md:rounded-2xl border border-[#e2e8f0] p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const totalBookings = services.reduce((sum, s) => sum + s.bookings, 0);

  return (
    <div className="bg-white rounded-xl md:rounded-2xl border border-[#e2e8f0] overflow-hidden">
      <div className="p-4 md:p-5 border-b border-[#e2e8f0]">
        <h3 className="font-bold text-[#1e293b] flex items-center gap-2">
          <i className="fas fa-trophy text-[#f59e0b]"></i>
          Top Services
        </h3>
      </div>

      <div className="p-4 md:p-5">
        {services.length > 0 ? (
          <div className="space-y-4">
            {services.map((service, index) => {
              const percentage = totalBookings > 0 ? (service.bookings / totalBookings) * 100 : 0;
              
              return (
                <div key={service.id} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{service.emoji}</span>
                      <div>
                        <div className="font-semibold text-sm text-[#1e293b]">{service.name}</div>
                        <div className="text-xs text-[#64748b]">{service.bookings} bookings</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm text-[#8b5cf6]">{formatCurrency(service.revenue)}</div>
                      <div className="text-xs text-[#64748b]">{percentage.toFixed(0)}%</div>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-[#64748b]">
            <i className="fas fa-chart-bar text-4xl mb-3 opacity-30"></i>
            <p className="font-semibold">No service data yet</p>
            <p className="text-sm mt-1">Service performance will appear here as you get bookings</p>
          </div>
        )}
      </div>
    </div>
  );
}
