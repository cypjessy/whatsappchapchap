"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { bookingService } from "@/lib/db";

interface Booking {
  id: string;
  time: string;
  service: string;
  client: string;
  location: string;
  status: string;
  date: string;
}

export default function ServiceSchedule() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (user) {
      loadTodayBookings();
    }
  }, [user, selectedDate]);

  const loadTodayBookings = async () => {
    if (!user) return;
    try {
      const allBookings = await bookingService.getBookings(user);
      
      // Filter bookings for selected date and sort by time
      const todayBookings = allBookings
        .filter(b => b.date === selectedDate)
        .sort((a, b) => a.time.localeCompare(b.time))
        .map(b => ({
          id: b.id,
          time: b.time,
          service: b.service,
          client: b.client,
          location: b.location || 'In-Studio',
          status: b.status,
          date: b.date,
        }));
      
      setBookings(todayBookings);
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
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (dateStr === today.toISOString().split('T')[0]) {
      return "Today";
    } else if (dateStr === tomorrow.toISOString().split('T')[0]) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }
  };

  const changeDate = (days: number) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + days);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
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
      <div className="p-4 md:p-5 border-b border-[#e2e8f0] flex justify-between items-center flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-[#1e293b] flex items-center gap-2">
            <i className="fas fa-calendar-day text-[#8b5cf6]"></i>
            {formatDate(selectedDate)}
          </h3>
          <p className="text-xs text-[#64748b] mt-1">
            {bookings.length} booking{bookings.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => changeDate(-1)}
            className="w-8 h-8 rounded-lg bg-[#f1f5f9] hover:bg-[#8b5cf6] hover:text-white transition-all flex items-center justify-center"
          >
            <i className="fas fa-chevron-left text-sm"></i>
          </button>
          <button 
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-3 py-1.5 text-xs font-semibold text-[#8b5cf6] hover:bg-[#f1f5f9] rounded-lg transition-all"
          >
            Today
          </button>
          <button 
            onClick={() => changeDate(1)}
            className="w-8 h-8 rounded-lg bg-[#f1f5f9] hover:bg-[#8b5cf6] hover:text-white transition-all flex items-center justify-center"
          >
            <i className="fas fa-chevron-right text-sm"></i>
          </button>
          <a href="/bookings" className="ml-2 text-xs md:text-sm font-semibold text-[#8b5cf6] hover:underline">
            View All
          </a>
        </div>
      </div>
      
      <div className="divide-y divide-[#e2e8f0]">
        {bookings.length > 0 ? (
          bookings.map((booking) => (
            <div key={booking.id} className="p-3 md:p-4 flex items-center gap-3 md:gap-4 hover:bg-[#f8fafc] transition-colors group cursor-pointer">
              <div className="text-center min-w-[50px] md:min-w-[60px]">
                <div className="font-bold text-base md:text-lg text-[#8b5cf6]">{booking.time}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm md:text-base text-[#1e293b]">{booking.service}</div>
                <div className="text-xs md:text-sm text-[#64748b] flex items-center gap-2 flex-wrap">
                  <span><i className="fas fa-user mr-1"></i>{booking.client}</span>
                  <span className="hidden md:inline">•</span>
                  <span>
                    <i className={`fas ${
                      booking.location.includes("Video") ? "fa-video" : 
                      booking.location.includes("Home") ? "fa-home" : 
                      "fa-store"
                    } mr-1`}></i>
                    <span className="hidden md:inline">{booking.location}</span>
                  </span>
                </div>
              </div>
              <div className={`px-2 md:px-3 py-1 rounded-full text-xs font-bold uppercase whitespace-nowrap ${getStatusClass(booking.status)}`}>
                {booking.status}
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-[#64748b]">
            <i className="fas fa-calendar-check text-4xl mb-3 opacity-30"></i>
            <p className="font-semibold">No bookings for {formatDate(selectedDate)}</p>
            <p className="text-sm mt-1">Use the calendar to view other dates or add new bookings</p>
            <a 
              href="/bookings?new=true" 
              className="inline-block mt-3 px-4 py-2 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
            >
              <i className="fas fa-plus mr-2"></i>Add Booking
            </a>
          </div>
        )}
      </div>
    </div>
  );
}