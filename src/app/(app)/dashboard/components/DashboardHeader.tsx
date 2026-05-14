"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { tenantService } from "@/lib/db";
import "./dashboard-header-styles.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tenant {
  id: string;
  name: string;
  businessName: string;
  email: string;
  avatar?: string;
}

interface DashboardHeaderProps {
  showBreadcrumb?: boolean;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getGreeting(hour: number): string {
  if (hour < 6) return "Night";
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  if (hour < 21) return "Evening";
  return "Night";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ShimmerHeader() {
  return (
    <div className="mb-4 md:mb-6 animate-pulse">
      <div className="hidden md:flex items-center gap-2 mb-2">
        <div className="h-4 bg-[var(--md-sys-color-surface-variant)] rounded w-12" />
        <div className="h-4 bg-[var(--md-sys-color-surface-variant)] rounded w-4" />
        <div className="h-4 bg-[var(--md-sys-color-surface-variant)] rounded w-16" />
      </div>
      <div className="md:hidden bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-2xl p-4">
        <div className="h-6 bg-white/20 rounded w-32 mb-2" />
        <div className="h-4 bg-white/20 rounded w-24 mb-1" />
        <div className="h-3 bg-white/20 rounded w-40" />
      </div>
      <div className="hidden md:block">
        <div className="h-8 bg-[var(--md-sys-color-surface-variant)] rounded w-64 mb-2" />
        <div className="h-4 bg-[var(--md-sys-color-surface-variant)] rounded w-96" />
      </div>
    </div>
  );
}

function MobileHeader({
  greeting,
  tenantName,
  currentTime,
}: {
  greeting: string;
  tenantName: string;
  currentTime: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  return (
    <div
      className={`
        md:hidden relative overflow-hidden
        bg-[#25D366]
        rounded-2xl p-4 text-white
        shadow-md shadow-[#25D366]/20
        transition-all duration-500
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
    >
      {/* Background pattern - MD3 style */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-white/80 bg-white/15 px-2.5 py-1 rounded-full">
              {currentTime}
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Good {greeting}!
          </h1>
          <p className="text-white/90 text-sm font-medium truncate mt-0.5">{tenantName}</p>
          <p className="text-white/70 text-xs mt-1 font-medium">
            {formatDate(new Date())}
          </p>
        </div>

        {/* Avatar - MD3 styling */}
        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center font-semibold text-lg shrink-0 border-2 border-white/30">
          {getInitials(tenantName)}
        </div>
      </div>
    </div>
  );
}

function DesktopHeader({
  greeting,
  tenantName,
  showBreadcrumb = true,
}: {
  greeting: string;
  tenantName: string;
  showBreadcrumb?: boolean;
}) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className={`
        hidden md:block
        transition-all duration-500
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
    >
      {/* Breadcrumb - MD3 styling */}
      {showBreadcrumb && (
        <nav className="flex items-center gap-2 text-sm text-[#94A3B8] mb-3">
          <span className="hover:text-[#64748B] cursor-pointer transition-colors font-medium">Home</span>
          <i className="fas fa-chevron-right text-[10px]" />
          <span className="text-[#64748B] font-semibold">Dashboard</span>
        </nav>
      )}

      {/* Main header - MD3 typography */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl lg:text-[1.875rem] font-bold text-[#1e293b] tracking-tight">
            Good {greeting},{" "}
            <span className="text-[#25D366]">{tenantName}</span>!
          </h1>
          <p className="text-[#64748B] text-sm mt-1.5 font-medium">
            Welcome back! Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>

        {/* Time display - MD3 styling */}
        <div className="text-right shrink-0 ml-4">
          <div className="text-2xl font-bold text-[#1e293b] tabular-nums">
            {formatTime(currentTime)}
          </div>
          <div className="text-xs text-[#94A3B8] font-medium mt-0.5">
            {formatDate(currentTime)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DashboardHeader({ showBreadcrumb = true }: DashboardHeaderProps) {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState(getGreeting(new Date().getHours()));

  // Load tenant
  useEffect(() => {
    const loadTenant = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const tenantData = await tenantService.getTenant(user);
        setTenant(tenantData);
      } catch (error) {
        console.error("Error loading tenant:", error);
      } finally {
        setLoading(false);
      }
    };
    loadTenant();
  }, [user]);

  // Update greeting every minute
  useEffect(() => {
    const updateGreeting = () => {
      setGreeting(getGreeting(new Date().getHours()));
    };
    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <ShimmerHeader />;
  }

  const tenantName = tenant?.businessName || tenant?.name || "there";

  return (
    <div className="mb-4 md:mb-6">
      <MobileHeader
        greeting={greeting}
        tenantName={tenantName}
        currentTime={formatTime(new Date())}
      />
      <DesktopHeader
        greeting={greeting}
        tenantName={tenantName}
        showBreadcrumb={showBreadcrumb}
      />
    </div>
  );
}