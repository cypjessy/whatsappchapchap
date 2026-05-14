"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useOtaUpdate } from "@/hooks/useOtaUpdate";
import WhatsAppConnectionManager from "@/components/WhatsAppConnectionManager";
import {
  DashboardHeader,
  QuickActions,
  StatsGrid,
  SalesChart,
  RecentActivity,
  RecentOrders,
} from "./components";

// ─── Sub-Components ───────────────────────────────────────────────────────────

function UpdatesButton({ onCheckUpdate, hasUpdate }: {
  onCheckUpdate: () => void;
  hasUpdate: boolean;
}) {
  if (!hasUpdate) return null;

  return (
    <button
      onClick={onCheckUpdate}
      className="
        fixed bottom-6 left-6 z-40 w-12 h-12 rounded-full
        bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white
        shadow-lg shadow-[#F59E0B]/30 hover:shadow-xl hover:shadow-[#F59E0B]/40
        hover:-translate-y-0.5 active:scale-95
        flex items-center justify-center
        transition-all duration-300
        animate-pulse
      "
      aria-label="Check for updates"
    >
      <i className="fas fa-cloud-download-alt text-sm" />
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
  const { user } = useAuth();
  const { hasUpdate, checkForUpdate } = useOtaUpdate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [instanceName, setInstanceName] = useState<string | null>(null);

  // Fetch tenant instance name from Firestore
  useEffect(() => {
    if (!user) return;
    
    const fetchInstanceName = async () => {
      try {
        const tenantId = `tenant_${user.uid}`;
        const { doc, getDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        
        const tenantDoc = await getDoc(doc(db, "tenants", tenantId));
        if (tenantDoc.exists()) {
          const data = tenantDoc.data();
          const instance = data.evolutionInstanceId || data.whatsappInstanceId || null;
          setInstanceName(instance);
          console.log('[Dashboard] Instance name:', instance);
        }
      } catch (err) {
        console.error('[Dashboard] Error fetching instance name:', err);
      }
    };
    
    fetchInstanceName();
  }, [user]);

  return (
    <div className="overflow-x-hidden px-3 md:px-6 py-3 md:py-4 pb-2 bg-white">
      {/* Header Section */}
      <SectionWrapper delay={0}>
        <DashboardHeader />
      </SectionWrapper>

      {/* Quick Actions */}
      <SectionWrapper delay={100}>
        <QuickActions />
      </SectionWrapper>

      {/* WhatsApp Connection Manager */}
      {instanceName && (
        <SectionWrapper delay={150}>
          <WhatsAppConnectionManager 
            instanceName={instanceName}
            onConnectionChange={(connected) => {
              console.log('[Dashboard] Connection changed:', connected);
            }}
          />
        </SectionWrapper>
      )}

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

      {/* Updates Button - Only shows when update is available */}
      <UpdatesButton onCheckUpdate={checkForUpdate} hasUpdate={hasUpdate} />
    </div>
  );
}