"use client";

import { useMode } from "@/context/ModeContext";
import { DashboardHeader, QuickActions, StatsGrid, SalesChart, RecentActivity, RecentOrders } from "./components";
import { 
  ServiceDashboardHeader, 
  ServiceQuickActions, 
  ServiceStatsGrid, 
  ServiceSchedule, 
  ServiceCalendar,
  RecentBookings,
  TopServices,
  RevenueChart
} from "./components/services";

export default function DashboardPage() {
  const { mode } = useMode();

  if (mode === "service") {
    return (
      <div className="animate-fadeIn overflow-x-hidden">
        {/* Header */}
        <ServiceDashboardHeader />
        
        {/* Quick Actions */}
        <ServiceQuickActions />
        
        {/* Stats Grid */}
        <ServiceStatsGrid />
        
        {/* Revenue Chart - Full Width */}
        <div className="mb-6">
          <RevenueChart />
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
          {/* Left Column - Schedule & Bookings */}
          <div className="lg:col-span-2 space-y-6">
            <ServiceSchedule />
            <RecentBookings />
          </div>
          
          {/* Right Column - Calendar & Top Services */}
          <div className="space-y-6">
            <ServiceCalendar />
            <TopServices />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn overflow-x-hidden">
      <DashboardHeader />
      <QuickActions />
      <StatsGrid />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 min-w-0">
        <div className="md:col-span-2 lg:col-span-2 min-w-0">
          <SalesChart />
        </div>
        <div className="min-w-0">
          <RecentActivity />
        </div>
      </div>
      <RecentOrders />
    </div>
  );
}
