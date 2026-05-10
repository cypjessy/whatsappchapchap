"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { dashboardService, ActivityItem } from "@/lib/dashboard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecentActivityProps {
  refreshTrigger?: number;
  maxItems?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ACTIVITY_TYPE_CONFIG: Record<string, { 
  icon: string; 
  iconBg: string; 
  iconColor: string;
  borderColor: string;
}> = {
  order: {
    icon: "fa-shopping-bag",
    iconBg: "bg-[rgba(37,211,102,0.1)]",
    iconColor: "text-[#25D366]",
    borderColor: "border-[#25D366]/20",
  },
  booking: {
    icon: "fa-calendar-check",
    iconBg: "bg-[rgba(139,92,246,0.1)]",
    iconColor: "text-[#8b5cf6]",
    borderColor: "border-[#8b5cf6]/20",
  },
  customer: {
    icon: "fa-user-plus",
    iconBg: "bg-[rgba(59,130,246,0.1)]",
    iconColor: "text-[#3b82f6]",
    borderColor: "border-[#3b82f6]/20",
  },
  payment: {
    icon: "fa-coins",
    iconBg: "bg-[rgba(245,158,11,0.1)]",
    iconColor: "text-[#f59e0b]",
    borderColor: "border-[#f59e0b]/20",
  },
  message: {
    icon: "fa-comment",
    iconBg: "bg-[rgba(16,185,129,0.1)]",
    iconColor: "text-[#10b981]",
    borderColor: "border-[#10b981]/20",
  },
  alert: {
    icon: "fa-exclamation-circle",
    iconBg: "bg-[rgba(239,68,68,0.1)]",
    iconColor: "text-[#ef4444]",
    borderColor: "border-[#ef4444]/20",
  },
  default: {
    icon: "fa-bell",
    iconBg: "bg-[rgba(100,116,139,0.1)]",
    iconColor: "text-[#64748b]",
    borderColor: "border-[#64748b]/20",
  },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getActivityConfig(type?: string) {
  return ACTIVITY_TYPE_CONFIG[type || "default"] || ACTIVITY_TYPE_CONFIG.default;
}

function getRelativeTime(timeStr: string): string {
  const date = new Date(timeStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 10) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ShimmerRow({ index }: { index: number }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl overflow-hidden relative">
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      <div className="w-10 h-10 rounded-full bg-[#f1f5f9] shrink-0 animate-pulse" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-4 bg-[#f1f5f9] rounded-lg w-3/4 animate-pulse" />
        <div className="h-3 bg-[#f1f5f9] rounded-lg w-20 animate-pulse" />
      </div>
    </div>
  );
}

function ActivityRow({
  activity,
  index,
}: {
  activity: ActivityItem;
  index: number;
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const config = getActivityConfig(activity.type);
  const relativeTime = getRelativeTime(activity.time);

  return (
    <div
      className={`
        group flex items-start gap-3 p-3 rounded-xl cursor-pointer
        transition-all duration-200
        ${isHovered ? "bg-[#f8fafc] shadow-sm" : "bg-transparent"}
        ${activity.isUnread ? "border-l-2 " + config.borderColor : ""}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Icon container */}
      <div
        className={`
          w-10 h-10 rounded-full flex items-center justify-center shrink-0
          transition-transform duration-300
          ${config.iconBg} ${config.iconColor}
          ${isHovered ? "scale-110" : "scale-100"}
        `}
      >
        <i className={`fas ${activity.icon || config.icon} text-sm`} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-semibold text-sm text-[#1e293b] leading-snug">
              {activity.message}
              {activity.isUnread && (
                <span className="inline-block w-2 h-2 rounded-full bg-[#8b5cf6] ml-2 animate-pulse" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-[#94a3b8] font-medium">
                {relativeTime}
              </span>
              {activity.type && (
                <span className={`
                  text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md
                  ${config.iconBg} ${config.iconColor}
                `}>
                  {activity.type}
                </span>
              )}
            </div>
          </div>

          {/* Expand chevron */}
          {activity.details && (
            <i className={`
              fas fa-chevron-down text-[10px] text-[#94a3b8] mt-1 transition-transform duration-200 shrink-0
              ${isExpanded ? "rotate-180" : "rotate-0"}
            `} />
          )}
        </div>

        {/* Expanded details */}
        {activity.details && (
          <div className={`
            overflow-hidden transition-all duration-300 ease-out
            ${isExpanded ? "max-h-40 opacity-100 mt-2 pt-2 border-t border-[#e2e8f0]" : "max-h-0 opacity-0 mt-0 pt-0"}
          `}>
            <p className="text-xs text-[#64748b] leading-relaxed">
              {activity.details}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 md:py-12 text-[#64748b] animate-fadeIn">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0] flex items-center justify-center mb-3 shadow-inner">
        <i className="fas fa-inbox text-xl text-[#cbd5e1]" />
      </div>
      <p className="text-sm font-semibold text-[#475569]">No recent activity</p>
      <p className="text-xs text-[#94a3b8] mt-1">Check back later for updates</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function RecentActivity({
  refreshTrigger,
  maxItems = 10,
  showViewAll = false,
  onViewAll,
}: RecentActivityProps) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const loadActivities = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data = await dashboardService.getRecentActivity(user);
        setActivities(data.slice(0, maxItems));
      } catch (error) {
        console.error("Error loading activities:", error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };
    loadActivities();
  }, [user, refreshTrigger, maxItems]);

  const unreadCount = activities.filter((a) => a.isUnread).length;

  return (
    <div className={`
      bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden
      transition-all duration-500
      ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
    `}>
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-[#e2e8f0] flex items-center justify-between bg-gradient-to-r from-white to-[#f8fafc]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#fef3c7] flex items-center justify-center">
            <i className="fas fa-bell text-[#f59e0b] text-sm" />
          </div>
          <div>
            <h3 className="font-bold text-sm md:text-base text-[#1e293b]">Recent Activity</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold text-[#f59e0b]">
                {unreadCount} unread
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showViewAll && onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs font-semibold text-[#8b5cf6] hover:text-[#7c3aed] hover:underline transition-colors"
            >
              View all
            </button>
          )}
          <span className="text-[10px] font-bold text-[#94a3b8] bg-[#f1f5f9] px-2 py-1 rounded-full">
            {activities.length}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-2 md:p-3">
        {loading ? (
          <div className="space-y-1">
            {[0, 1, 2, 3].map((i) => (
              <ShimmerRow key={i} index={i} />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-0.5">
            {activities.map((activity, index) => (
              <ActivityRow
                key={activity.id || index}
                activity={activity}
                index={index}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {!loading && activities.length > 0 && showViewAll && onViewAll && (
        <div className="p-3 border-t border-[#e2e8f0] text-center">
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-[#64748b] hover:text-[#8b5cf6] transition-colors flex items-center justify-center gap-1.5 w-full py-1"
          >
            View all activity
            <i className="fas fa-arrow-right text-[10px]" />
          </button>
        </div>
      )}
    </div>
  );
}