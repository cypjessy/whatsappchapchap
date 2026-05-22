"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { bookingService, serviceService } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";

interface Booking {
  id: string;
  client: string;
  service: string;
  date: string;
  time: string;
  price: number;
  status: string;
}

export default function RecentBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user]);

  const loadBookings = async () => {
    if (!user) return;
    try {
      const allBookings = await bookingService.getBookings(user);
      // Get only recent 5 bookings
      const recent = allBookings.slice(0, 5).map(b => ({
        id: b.id,
        client: b.client,
        service: b.service,
        date: b.date,
        time: b.time,
        price: b.price,
        status: b.status,
      }));
      setBookings(recent);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-[rgba(37,211,102,0.1)] text-[#10b981]";
      case "pending": return "bg-[rgba(245,158,11,0.1)] text-[#f59e0b]";
      case "completed": return "bg-[rgba(59,130,246,0.1)] text-[#3b82f6]";
      case "cancelled": return "bg-[rgba(239,68,68,0.1)] text-[#ef4444]";
      default: return "bg-[rgba(100,116,139,0.1)] text-[#64748b]";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl md:rounded-2xl border border-[#e2e8f0] p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl md:rounded-2xl border border-[#e2e8f0] overflow-hidden">
      <div className="p-4 md:p-5 border-b border-[#e2e8f0] flex justify-between items-center">
        <h3 className="font-bold text-[#1e293b] flex items-center gap-2">
          <i className="fas fa-calendar-check text-[#8b5cf6]"></i>
          Recent Bookings
        </h3>
        <a href="/bookings" className="text-xs md:text-sm font-semibold text-[#8b5cf6] hover:underline">
          View All
        </a>
      </div>
      
      <div className="divide-y divide-[#e2e8f0]">
        {bookings.length > 0 ? (
          bookings.map((booking) => (
            <div key={booking.id} className="p-4 hover:bg-[#f8fafc] transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm md:text-base text-[#1e293b] mb-1">
                    {booking.service}
                  </div>
                  <div className="text-xs md:text-sm text-[#64748b] flex flex-wrap items-center gap-2">
                    <span><i className="fas fa-user mr-1"></i>{booking.client}</span>
                    <span className="hidden md:inline">•</span>
                    <span><i className="fas fa-calendar mr-1"></i>{formatDate(booking.date)}</span>
                    <span className="hidden md:inline">•</span>
                    <span><i className="fas fa-clock mr-1"></i>{booking.time}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-[#8b5cf6]">{formatCurrency(booking.price)}</div>
                  <div className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase mt-1 ${getStatusClass(booking.status)}`}>
                    {booking.status}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-[#64748b]">
            <i className="fas fa-calendar-times text-4xl mb-3 opacity-30"></i>
            <p className="font-semibold">No bookings yet</p>
            <p className="text-sm mt-1">Bookings will appear here when clients schedule appointments</p>
          </div>
        )}
      </div>
    </div>
  );
}
