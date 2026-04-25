"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { serviceService } from "@/lib/db";

export default function ServiceDashboardHeader() {
  const { user } = useAuth();
  const [serviceCount, setServiceCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadServiceCount();
    }
  }, [user]);

  const loadServiceCount = async () => {
    if (!user) return;
    try {
      const services = await serviceService.getServices(user);
      setServiceCount(services.length);
    } catch (error) {
      console.error("Error loading service count:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[rgba(139,92,246,0.08)] to-[rgba(124,58,237,0.03)] rounded-xl md:rounded-2xl p-4 md:p-6 mb-4 md:mb-6 border border-[rgba(139,92,246,0.1)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#1e293b] flex items-center gap-2">
            <i className="fas fa-hand-sparkles text-[#8b5cf6]"></i>
            Service Dashboard
          </h1>
          <p className="text-[#64748b] text-sm md:text-base mt-1">
            {loading ? "Loading..." : `${serviceCount} service${serviceCount !== 1 ? 's' : ''} managed`}
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#8b5cf6] transition-colors">
            <i className="fas fa-bell mr-2"></i>
            <span className="hidden md:inline">Notifications</span>
            <span className="md:hidden">Alert</span>
            <span className="ml-2 px-1.5 py-0.5 bg-[#ef4444] text-white text-xs rounded-full">5</span>
          </button>
          <button className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all">
            <i className="fas fa-plus mr-2"></i>
            <span className="hidden md:inline">New Service</span>
            <span className="md:hidden">+ Add</span>
          </button>
        </div>
      </div>
    </div>
   );
 }