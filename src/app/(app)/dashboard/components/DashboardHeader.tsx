"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { tenantService } from "@/lib/db";

interface Tenant {
  id: string;
  name: string;
  businessName: string;
  email: string;
}

export function DashboardHeader() {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("Today");

  useEffect(() => {
    const loadTenant = async () => {
      if (user) {
        const tenantData = await tenantService.getTenant(user);
        setTenant(tenantData);
      }
    };
    loadTenant();
  }, [user]);

  useEffect(() => {
    const updateTime = () => {
      const hour = new Date().getHours();
      if (hour < 12) setCurrentTime("Morning");
      else if (hour < 17) setCurrentTime("Afternoon");
      else setCurrentTime("Evening");
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const greeting = tenant?.businessName || tenant?.name || "there";

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 text-sm text-[#64748b] mb-2">
        <span>Home</span>
        <i className="fas fa-chevron-right text-xs"></i>
        <span>Dashboard</span>
      </div>
      <h1 className="text-2xl lg:text-[1.875rem] font-extrabold text-[#1e293b]">
        Good {currentTime}, {greeting}!
        <span className="text-base font-medium text-[#64748b] ml-2">| {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
      </h1>
      <p className="text-[#64748b]">Welcome back! Here&apos;s what&apos;s happening with your store today.</p>
    </div>
  );
}
