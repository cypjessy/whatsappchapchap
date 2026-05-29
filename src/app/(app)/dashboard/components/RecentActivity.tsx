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
    iconBg: "bg-[#E8F5E9]",
    iconColor: "text-[#25D366]",
    borderColor: "border-[#25D366]/20",
  },
  booking: {
    icon: "fa-calendar-check",
    iconBg: "bg-[#F3E8FF]",
    iconColor: "text-[#8B5CF6]",
    borderColor: "border-[#8B5CF6]/20",
  },
  customer: {
    icon: "fa-user-plus",
    iconBg: "bg-[#EFF6FF]",
    iconColor: "text-[#3B82F6]",
    borderColor: "border-[#3B82F6]/20",
  },
  payment: {
    icon: "fa-coins",
    iconBg: "bg-[#FEF3C7]",
    iconColor: "text-[#F59E0B]",
    borderColor: "border-[#F59E0B]/20",
  },
  message: {
    icon: "fa-comment",
    iconBg: "bg-[#D1FAE5]",
    iconColor: "text-[#10B981]",
    borderColor: "border-[#10B981]/20",
  },
  alert: {
    icon: "fa-exclamation-circle",
    iconBg: "bg-[#FEE2E2]",
    iconColor: "text-[#EF4444]",
    borderColor: "border-[#EF4444]/20",
  },
  default: {
    icon: "fa-bell",
    iconBg: "bg-surface-variant",
    iconColor: "text-on-surface-variant",
    borderColor: "border-[#64748B]/20",
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
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-[var(--md-sys-color-surface)]/60 to-transparent" />
      <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-surface-variant)] shrink-0 animate-pulse" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-4 bg-[var(--md-sys-color-surface-variant)] rounded-lg w-3/4 animate-pulse" />
        <div className="h-3 bg-[var(--md-sys-color-surface-variant)] rounded-lg w-20 animate-pulse" />
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
        transition-all duration-200 hover:bg-surface-container-low border-b border-outline-variant last:border-b-0
        ${activity.isUnread ? "border-l-4 " + config.borderColor.replace("border-", "border-").replace("/20", "/40") : ""}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Icon container - MD3 tonal system */}
      <div
        className={`
          w-10 h-10 rounded-xl flex items-center justify-center shrink-0
          transition-transform duration-200
          ${config.iconBg} ${config.iconColor}
          ${isHovered ? "scale-105" : "scale-100"}
        `}
      >
        <i className={`fas ${activity.icon || config.icon} text-sm`} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-medium text-sm text-on-surface leading-snug">
              {activity.message}
              {activity.isUnread && (
                <span className="inline-block w-2 h-2 rounded-full bg-[#8B5CF6] ml-2 animate-pulse" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-outline font-medium">
                {relativeTime}
              </span>
              {activity.type && (
                <span className={`
                  text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full
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
              fas fa-chevron-down text-[10px] text-outline mt-1 transition-transform duration-200 shrink-0
              ${isExpanded ? "rotate-180" : "rotate-0"}
            `} />
          )}
        </div>

        {/* Expanded details - MD3 styling */}
        {activity.details && (
          <div className={`
            overflow-hidden transition-all duration-200 ease-out
            ${isExpanded ? "max-h-40 opacity-100 mt-2 pt-2 border-t border-outline-variant" : "max-h-0 opacity-0 mt-0 pt-0"}
          `}>
            <p className="text-xs text-on-surface-variant leading-relaxed">
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
    <div className="flex flex-col items-center justify-center py-10 md:py-12 text-on-surface-variant animate-fadeIn">
      <div className="w-14 h-14 rounded-2xl bg-surface-variant flex items-center justify-center mb-3">
        <i className="fas fa-inbox text-xl text-[#CBD5E1]" />
      </div>
      <p className="text-sm font-semibold text-on-surface-variant">No recent activity</p>
      <p className="text-xs text-outline mt-1">Check back later for updates</p>
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
      bg-surface rounded-2xl border-2 border-outline shadow-md overflow-hidden
      transition-all duration-300
      ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
    `}>
      {/* Header - Physical card styling */}
      <div className="p-4 md:p-5 border-b-2 border-outline flex items-center justify-between bg-surface-container-low">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] flex items-center justify-center">
            <i className="fas fa-bell text-[#F59E0B] text-sm" />
          </div>
          <div>
            <h3 className="font-semibold text-sm md:text-base text-on-surface">Recent Activity</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-semibold text-[#F59E0B]">
                {unreadCount} unread
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showViewAll && onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs font-semibold text-[#8B5CF6] hover:text-[#7C3AED] hover:underline transition-colors"
            >
              View all
            </button>
          )}
          <span className="text-[10px] font-semibold text-outline bg-surface-variant px-2.5 py-1 rounded-full">
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
        <div className="p-3 border-t-2 border-outline text-center">
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-on-surface-variant hover:text-[#8B5CF6] transition-colors flex items-center justify-center gap-1.5 w-full py-1"
          >
            View all activity
            <i className="fas fa-arrow-right text-[10px]" />
          </button>
        </div>
      )}
    </div>
  );
}