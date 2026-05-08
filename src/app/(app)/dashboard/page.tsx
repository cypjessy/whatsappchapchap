"use client";

import { DashboardHeader, QuickActions, StatsGrid, SalesChart, RecentActivity, RecentOrders } from "./components";

export default function DashboardPage() {
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
