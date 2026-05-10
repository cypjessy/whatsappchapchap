"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DashboardHeader,
  QuickActions,
  StatsGrid,
  SalesChart,
  RecentActivity,
  RecentOrders,
} from "./components";

// ─── Sub-Components ───────────────────────────────────────────────────────────

function RefreshButton({ onRefresh, isRefreshing }: {
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  return (
    <button
      onClick={onRefresh}
      disabled={isRefreshing}
      className={`
        fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full
        bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white
        shadow-lg shadow-[#25D366]/30 hover:shadow-xl hover:shadow-[#25D366]/40
        hover:-translate-y-0.5 active:scale-95
        flex items-center justify-center
        transition-all duration-300
        ${isRefreshing ? "animate-pulse" : ""}
      `}
      aria-label="Refresh dashboard"
    >
      <i className={`
        fas fa-sync-alt text-sm
        transition-transform duration-500
        ${isRefreshing ? "animate-spin" : ""}
      `} />
    </button>
  );
}

function SectionWrapper({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`
        transition-all duration-500 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
        ${className}
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
    // Allow components to reload
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Header Section */}
      <SectionWrapper delay={0}>
        <DashboardHeader />
      </SectionWrapper>

      {/* Quick Actions */}
      <SectionWrapper delay={100}>
        <QuickActions />
      </SectionWrapper>

      {/* Stats Grid */}
      <SectionWrapper delay={200}>
        <StatsGrid refreshTrigger={refreshTrigger} />
      </SectionWrapper>

      {/* Main Content Grid */}
      <SectionWrapper delay={300} className="mb-6 md:mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 min-w-0">
          {/* Sales Chart - Takes 2/3 on large screens */}
          <div className="lg:col-span-2 min-w-0">
            <SalesChart refreshTrigger={refreshTrigger} />
          </div>

          {/* Recent Activity - Takes 1/3 */}
          <div className="min-w-0">
            <RecentActivity refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </SectionWrapper>

      {/* Recent Orders - Full Width */}
      <SectionWrapper delay={400}>
        <RecentOrders refreshTrigger={refreshTrigger} />
      </SectionWrapper>

      {/* Floating Refresh Button */}
      <RefreshButton onRefresh={handleRefresh} isRefreshing={isRefreshing} />
    </div>
  );
}