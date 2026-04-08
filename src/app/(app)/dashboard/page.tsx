"use client";

import { DashboardHeader, QuickActions, StatsGrid, SalesChart, RecentActivity, RecentOrders } from "./components";

export default function DashboardPage() {
  return (
    <div className="animate-fadeIn">
      <DashboardHeader />
      <QuickActions />
      <StatsGrid />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <SalesChart />
        <RecentActivity />
      </div>
      <RecentOrders />
    </div>
  );
}
