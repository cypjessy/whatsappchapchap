"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { tenantService, adminService } from "@/lib/db";
import PageHeaderCard from "@/components/PageHeaderCard";
import "./dashboard-header-styles.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tenant {
  id: string;
  name: string;
  businessName: string;
  email: string;
  avatar?: string;
  plan?: "free" | "starter" | "pro" | "enterprise";
  createdAt?: any;
  planStartedAt?: any;
  trialEndsAt?: any;
  trialDays?: number;
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

function getGreetingEmoji(hour: number): string {
  if (hour < 6) return "🌙";
  if (hour < 12) return "🌅";
  if (hour < 17) return "☀️";
  if (hour < 21) return "🌆";
  return "🌙";
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

function formatPlanDate(timestamp: any): string {
  if (!timestamp) return "N/A";
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
}

function getTrialDaysRemaining(trialEndsAt: any): number | null {
  if (!trialEndsAt) return null;
  try {
    const endDate = trialEndsAt.toDate ? trialEndsAt.toDate() : new Date(trialEndsAt);
    const now = new Date();
    const diffMs = endDate.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

const planConfig: Record<string, { label: string; icon: string; color: string; bg: string; price?: string }> = {
  free: { label: "Free", icon: "fa-seedling", color: "text-gray-600", bg: "bg-gray-100" },
  starter: { label: "Starter", icon: "fa-rocket", color: "text-amber-700", bg: "bg-amber-100", price: "KSh 999/mo" },
  pro: { label: "Pro", icon: "fa-star", color: "text-blue-700", bg: "bg-blue-100", price: "KSh 2,999/mo" },
  enterprise: { label: "Enterprise", icon: "fa-crown", color: "text-purple-700", bg: "bg-purple-100", price: "KSh 9,999/mo" },
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ShimmerHeader() {
  return (
    <div className="mb-4 md:mb-6 animate-pulse">
      <div className="hidden md:flex items-center gap-2 mb-2">
        <div className="h-4 bg-[var(--md-sys-color-surface-variant)] rounded w-12" />
        <div className="h-4 bg-[var(--md-sys-color-surface-variant)] rounded w-4" />
        <div className="h-4 bg-[var(--md-sys-color-surface-variant)] rounded w-16" />
      </div>
      <div className="md:hidden bg-gradient-to-br from-[#25D366] via-[#20bd5a] to-[#128C7E] rounded-2xl p-4">
        <div className="h-6 bg-surface/20 rounded w-32 mb-2" />
        <div className="h-4 bg-surface/20 rounded w-24 mb-1" />
        <div className="h-3 bg-surface/20 rounded w-40" />
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
  greetingEmoji,
  tenantName,
}: {
  greeting: string;
  greetingEmoji: string;
  tenantName: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [avatarVisible, setAvatarVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setAvatarVisible(true), 250);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return (
    <div
      className={`
        md:hidden relative overflow-hidden
        bg-gradient-to-br from-[#25D366] via-[#20bd5a] to-[#128C7E]
        rounded-2xl p-4 text-white
        shadow-lg shadow-[#25D366]/30
        transition-all duration-500 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        dashboard-header-mobile
      `}
    >
      {/* Animated background orbs */}
      <div className="absolute inset-0 opacity-[0.12]">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white rounded-full animate-float-slow" />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-white rounded-full animate-float-delayed" />
        <div className="absolute top-1/2 -right-4 w-16 h-16 bg-white/60 rounded-full animate-float" />
      </div>

      {/* Subtle gradient sheen overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Time badge & greeting emoji row */}
          <div
            className={`flex items-center gap-2 mb-2 transition-all duration-500 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-white/90 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <span className="text-[13px]">{greetingEmoji}</span>
              {formatTime(currentTime)}
            </span>
            <span className="text-[11px] font-medium text-white/70">
              {currentTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </span>
          </div>

          {/* Greeting heading */}
          <h1
            className={`text-xl font-bold tracking-tight transition-all duration-500 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            Good {greeting}!
          </h1>

          {/* Business name */}
          <p
            className={`text-white/90 text-sm font-medium truncate mt-0.5 transition-all duration-500 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            {tenantName}
          </p>

          {/* Date & subtitle */}
          <p
            className={`text-white/70 text-xs mt-1.5 font-medium transition-all duration-500 delay-[350ms] ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            {formatDate(currentTime)}
          </p>
        </div>

        {/* Avatar with staggered entrance */}
        <div
          className={`transition-all duration-500 ease-out ${
            avatarVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-base shrink-0 border-2 border-white/40 shadow-lg">
            <span className="text-white drop-shadow-sm">
              {getInitials(tenantName)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopHeader({
  greeting,
  greetingEmoji,
  tenantName,
  showBreadcrumb = true,
}: {
  greeting: string;
  greetingEmoji: string;
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
        <nav className="flex items-center gap-2 text-sm text-outline mb-3">
          <span className="hover:text-on-surface-variant cursor-pointer transition-colors font-medium">Home</span>
          <i className="fas fa-chevron-right text-[10px]" />
          <span className="text-on-surface-variant font-semibold">Dashboard</span>
        </nav>
      )}

      {/* Main header - MD3 typography */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl lg:text-[1.875rem] font-bold text-on-surface tracking-tight">
            <span className="mr-2">{greetingEmoji}</span>
            Good {greeting},{" "}
            <span className="text-[#25D366]">{tenantName}</span>!
          </h1>
          <p className="text-on-surface-variant text-sm mt-1.5 font-medium flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse" />
            Welcome back! Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>

        {/* Time display - MD3 styling */}
        <div className="text-right shrink-0 ml-4">
          <div className="text-2xl font-bold text-on-surface tabular-nums flex items-center gap-2 justify-end">
            <span className="text-[#25D366]">{greetingEmoji}</span>
            {formatTime(currentTime)}
          </div>
          <div className="text-xs text-outline font-medium mt-0.5">
            {formatDate(currentTime)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Trial Status Component ─────────────────────────────────────────────────

function TrialStatus({ trialEndsAt }: { trialEndsAt: any }) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  
  useEffect(() => {
    setDaysLeft(getTrialDaysRemaining(trialEndsAt));
  }, [trialEndsAt]);
  
  if (daysLeft === null) return null;
  
  if (daysLeft <= 0) {
    return (
      <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-red-50 border border-red-200">
        <i className="fas fa-exclamation-circle text-red-500 text-xs"></i>
        <span className="text-xs font-semibold text-red-700">Trial expired — account will be suspended</span>
      </div>
    );
  }
  
  if (daysLeft <= 3) {
    return (
      <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-amber-50 border border-amber-200">
        <i className="fas fa-hourglass-half text-amber-500 text-xs"></i>
        <span className="text-xs font-semibold text-amber-700">Trial ends in {daysLeft} {daysLeft === 1 ? "day" : "days"}</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-emerald-50 border border-emerald-200">
      <i className="fas fa-seedling text-emerald-500 text-xs"></i>
      <span className="text-xs font-semibold text-emerald-700">Trial: {daysLeft} {daysLeft === 1 ? "day" : "days"} remaining</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DashboardHeader({ showBreadcrumb = true }: DashboardHeaderProps) {
  const { user, isAdmin } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState(getGreeting(new Date().getHours()));
  const greetingEmoji = useMemo(() => getGreetingEmoji(new Date().getHours()), []);

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

  // Check for expired trials and subscriptions when dashboard loads — skip for admin accounts
  useEffect(() => {
    if (isAdmin) return;
    const checkAll = async () => {
      try {
        // Check expired free trials
        await adminService.checkAndAutoSuspendExpiredTrials();
        // Check expired paid subscriptions (billing cycle passed)
        await adminService.checkAndAutoSuspendExpiredSubscriptions();
      } catch (error) {
        console.error("Error checking expired accounts:", error);
      }
    };
    checkAll();
  }, [isAdmin]);

  // Update greeting every minute
  useEffect(() => {
    const updateGreeting = () => {
      setGreeting(getGreeting(new Date().getHours()));
    };
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <ShimmerHeader />;
  }

  const tenantName = tenant?.businessName || tenant?.name || "there";
  const plan = tenant?.plan || "free";
  const planInfo = planConfig[plan] || planConfig.free;
  // Use planStartedAt as the billing cycle anchor, fall back to createdAt
  const cycleDate = formatPlanDate(tenant?.planStartedAt || tenant?.createdAt);
  const planPrice = planInfo.price ? planInfo.price : null;

  return (
    <div className="mb-4 md:mb-6">
      <MobileHeader
        greeting={greeting}
        greetingEmoji={greetingEmoji}
        tenantName={tenantName}
      />

      {/* Mobile: Pricing & Billing Cycle Banner — hidden for admin accounts */}
      {!isAdmin && (
        <div className="md:hidden mt-3">
          <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl ${planInfo.bg} flex items-center justify-center`}>
                  <i className={`fas ${planInfo.icon} text-sm ${planInfo.color}`}></i>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Current Plan</div>
                  <div className={`text-sm font-bold ${planInfo.color}`}>{planInfo.label}</div>
                  {planPrice && (
                    <div className="text-[10px] font-semibold text-emerald-600 mt-px">{planPrice}</div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Billing Cycle</div>
                <div className="text-sm font-bold text-gray-800">{cycleDate}</div>
              </div>
            </div>
            {/* Trial status for free plan */}
            {plan === "free" && tenant?.trialEndsAt && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <TrialStatus trialEndsAt={tenant.trialEndsAt} />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="hidden md:block">
        <PageHeaderCard>
          <DesktopHeader
            greeting={greeting}
            greetingEmoji={greetingEmoji}
            tenantName={tenantName}
            showBreadcrumb={showBreadcrumb}
          />
          {/* Desktop: Pricing & Billing Cycle Row — hidden for admin accounts */}
          {!isAdmin && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl ${planInfo.bg} flex items-center justify-center`}>
                    <i className={`fas ${planInfo.icon} text-sm ${planInfo.color}`}></i>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Current Plan</div>
                    <div className={`text-sm font-bold ${planInfo.color}`}>{planInfo.label}</div>
                  </div>
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <i className="fas fa-calendar-alt text-sm text-indigo-600"></i>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Billing Cycle</div>
                    <div className="text-sm font-bold text-gray-800">{cycleDate}</div>
                    {planPrice && (
                      <div className="text-[11px] font-semibold text-emerald-600 mt-px">{planPrice}</div>
                    )}
                  </div>
                </div>
              </div>
              {/* Trial status for free plan */}
              {plan === "free" && tenant?.trialEndsAt && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <TrialStatus trialEndsAt={tenant.trialEndsAt} />
                </div>
              )}
            </div>
          )}
        </PageHeaderCard>
      </div>
    </div>
  );
}