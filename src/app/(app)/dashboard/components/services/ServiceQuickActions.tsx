"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { bookingService } from "@/lib/db";

export default function ServiceQuickActions() {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPendingCount();
    }
  }, [user]);

  const loadPendingCount = async () => {
    if (!user) return;
    try {
      const bookings = await bookingService.getBookings(user, "pending");
      setPendingCount(bookings.length);
    } catch (error) {
      console.error("Error loading pending count:", error);
    } finally {
      setLoading(false);
    }
  };

  const actions = [
    { id: "add-service", icon: "fa-plus", label: "Add Service", desc: "Create new service", color: "from-[#8b5cf6] to-[#7c3aed]", href: "/services?new=true" },
    { id: "availability", icon: "fa-clock", label: "Availability", desc: "Manage schedule", color: "from-[#3b82f6] to-[#2563eb]", href: "/availability" },
    { id: "portfolio", icon: "fa-images", label: "Portfolio", desc: "Showcase work", color: "from-[#f59e0b] to-[#d97706]", href: "/portfolio" },
    { 
      id: "bookings", 
      icon: "fa-calendar-alt", 
      label: "Bookings", 
      desc: loading ? "Loading..." : `${pendingCount} pending`,
      color: "from-[#10b981] to-[#059669]",
      href: "/bookings?status=pending" 
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
      {actions.map((action) => (
        <a
          key={action.id}
          href={action.href}
          className="bg-white p-4 md:p-5 rounded-xl border-2 border-[#e2e8f0] hover:border-[#8b5cf6] transition-all cursor-pointer group"
        >
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
            <i className={`fas ${action.icon} text-lg`}></i>
          </div>
          <div className="font-bold text-sm md:text-base text-[#1e293b]">{action.label}</div>
          <div className="text-xs text-[#64748b]">{action.desc}</div>
        </a>
      ))}
    </div>
   );
 }