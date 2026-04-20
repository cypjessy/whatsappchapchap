"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { dashboardService, ActivityItem } from "@/lib/dashboard";

interface RecentActivityProps {
  refreshTrigger?: number;
}

export function RecentActivity({ refreshTrigger }: RecentActivityProps) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data = await dashboardService.getRecentActivity(user);
        setActivities(data);
      } catch (error) {
        console.error("Error loading activities:", error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };
    loadActivities();
  }, [user, refreshTrigger]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm">
        <div className="p-4 md:p-6 border-b border-[#e2e8f0] flex items-center justify-between">
          <h3 className="font-bold text-base md:text-lg flex items-center gap-2">
            <i className="fas fa-bell text-[#f59e0b]"></i>
            Recent Activity
          </h3>
        </div>
        <div className="p-3 md:p-4">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm">
        <div className="p-4 md:p-6 border-b border-[#e2e8f0] flex items-center justify-between">
          <h3 className="font-bold text-base md:text-lg flex items-center gap-2">
            <i className="fas fa-bell text-[#f59e0b]"></i>
            Recent Activity
          </h3>
        </div>
        <div className="p-8 text-center">
          <div className="w-12 h-12 bg-[#f1f5f9] rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="fas fa-inbox text-[#64748b]"></i>
          </div>
          <p className="text-sm text-[#64748b]">No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm">
      <div className="p-4 md:p-6 border-b border-[#e2e8f0] flex items-center justify-between">
        <h3 className="font-bold text-base md:text-lg flex items-center gap-2">
          <i className="fas fa-bell text-[#f59e0b]"></i>
          Recent Activity
        </h3>
      </div>
      <div className="p-3 md:p-4">
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#f1f5f9] transition-all">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: activity.iconBg, color: activity.iconColor }}
              >
                <i className={`fas ${activity.icon} text-sm`}></i>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm truncate">{activity.message}</div>
                <div className="text-xs text-[#64748b]">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
