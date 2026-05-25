"use client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderTabSwitcherProps {
  tabs: Array<{ id: string; label: string; count: number; icon?: string }>;
  activeTab: string;
  viewMode: "orders" | "cancellations";
  onTabClick: (tabId: string) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function OrderTabSwitcher({
  tabs,
  activeTab,
  viewMode,
  onTabClick,
}: OrderTabSwitcherProps) {
  return (
    <div className="px-3 pt-2 pb-1 border-b border-outline-variant">
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((tab) => {
          const isActive =
            (tab.id === "cancellation_requests" && viewMode === "cancellations") ||
            (tab.id !== "cancellation_requests" && activeTab === tab.id);

          return (
            <button
              key={tab.id}
              onClick={() => onTabClick(tab.id)}
              className={`
                relative inline-flex items-center gap-1.5 px-3 py-2 rounded-xl
                text-[11px] font-semibold leading-none whitespace-nowrap
                transition-all duration-200 active:scale-95 select-none
                ${
                  isActive
                    ? "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white shadow-md3-level2"
                    : "bg-surface border border-outline-variant text-on-surface-variant hover:border-[#25D366]/40 hover:text-[#25D366]"
                }
              `}
            >
              {tab.icon && (
                <i className={`fas ${tab.icon} text-[10px] ${isActive ? "text-white/90" : ""}`} />
              )}
              <span>{tab.label}</span>
              <span
                className={`
                  inline-flex items-center justify-center min-w-[18px] h-[16px] px-1
                  rounded-md text-[9px] font-bold leading-none
                  ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-surface-variant text-on-surface-variant"
                  }
                `}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
