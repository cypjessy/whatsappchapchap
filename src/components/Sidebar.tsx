"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMode } from "@/context/ModeContext";

interface SidebarProps {
  onClose?: () => void;
  isExpanded?: boolean;
}

type NavItem = {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge: string | null;
  isPro?: boolean;
};

export default function Sidebar({ onClose, isExpanded = false }: SidebarProps) {
  const pathname = usePathname();
  // Start collapsed on desktop, expanded only when isExpanded prop is true (mobile drawer)
  const [localCollapsed, setLocalCollapsed] = useState(true);
  const { mode, toggleMode } = useMode();
  
  // When isExpanded prop is true (mobile/tablet drawer), always show full sidebar
  // On desktop, use local state for hover collapse (starts collapsed)
  const isCollapsed = isExpanded ? false : localCollapsed;

  const productNavItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: "fa-home", href: "/dashboard", badge: null },
    { id: "orders", label: "Orders", icon: "fa-shopping-bag", href: "/orders", badge: "12" },
    { id: "products", label: "Products", icon: "fa-box", href: "/products", badge: null },
    { id: "customers", label: "Customers", icon: "fa-users", href: "/customers", badge: null },
    { id: "suppliers", label: "Suppliers", icon: "fa-truck", href: "/suppliers", badge: null },
    { id: "shipping", label: "Shipping", icon: "fa-shipping-fast", href: "/shipping", badge: null },
    { id: "campaigns", label: "Campaigns", icon: "fa-bullhorn", href: "/campaigns", badge: null },
    { id: "settings", label: "Settings", icon: "fa-cog", href: "/settings", badge: null },
    { id: "help", label: "Help Center", icon: "fa-question-circle", href: "/help", badge: null },
  ];

  const serviceNavItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: "fa-home", href: "/dashboard", badge: null },
    { id: "bookings", label: "Bookings", icon: "fa-calendar-alt", href: "/bookings", badge: "8" },
    { id: "services", label: "My Services", icon: "fa-list", href: "/services", badge: null },
    { id: "clients", label: "Clients", icon: "fa-users", href: "/clients", badge: null },
    { id: "availability", label: "Availability", icon: "fa-clock", href: "/availability", badge: null },
    { id: "portfolio", label: "Portfolio", icon: "fa-images", href: "/portfolio", badge: null },
    { id: "settings", label: "Settings", icon: "fa-cog", href: "/settings", badge: null },
  ];

  const navItems = mode === "product" ? productNavItems : serviceNavItems;

  const isActive = (href: string) => pathname === href;

  return (
    <aside 
      className={`bg-white border-r border-[#e2e8f0] flex flex-col overflow-x-hidden ${
        isCollapsed ? "w-20" : "w-[280px]"
      } transition-all duration-300`}
      onMouseEnter={() => {
        if (window.innerWidth >= 1024) setLocalCollapsed(false);
      }}
      onMouseLeave={() => {
        if (window.innerWidth >= 1024) setLocalCollapsed(true);
      }}
      style={{ height: "100vh" }}
    >
      <div className={`border-b border-[#e2e8f0] flex flex-col ${isCollapsed ? "p-2" : "p-4"} gap-2`}>
        <Link href="/dashboard" className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
          <div className="w-11 h-11 bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-xl flex items-center justify-center text-white text-xl">
            <i className="fab fa-whatsapp"></i>
          </div>
          {!isCollapsed && <div className="text-xl font-extrabold text-[#1e293b]">Chap<span className="text-[#25D366]">Chap</span></div>}
        </Link>
        
        {/* Mode Toggle Switch */}
        <button
          onClick={toggleMode}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-all ${
            isCollapsed ? "flex-col" : ""
          } ${mode === "product" ? "bg-[#f0fdf4] hover:bg-[#dcfce7]" : "bg-[#fef3c7] hover:bg-[#fde68a]"}`}
        >
          {mode === "product" ? (
            <>
              <i className="fas fa-box text-[#25D366]"></i>
              {!isCollapsed && <span className="text-xs font-bold text-[#25D366]">Product Mode</span>}
            </>
          ) : (
            <>
              <i className="fas fa-concierge-bell text-[#f59e0b]"></i>
              {!isCollapsed && <span className="text-xs font-bold text-[#f59e0b]">Service Mode</span>}
            </>
          )}
          <i className={`fas fa-exchange-alt text-xs ${mode === "product" ? "text-[#25D366]" : "text-[#f59e0b]"}`}></i>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {navItems.map((item) => (
          <Link
            key={item.id}
            href={item.href || "#"}
            onClick={onClose}
            className={`flex items-center gap-3 py-3 rounded-xl font-semibold transition-all relative ${
              isCollapsed ? "justify-start px-3" : "px-6"
            } ${
              isActive(item.href || "")
                ? "bg-gradient-to-r from-[rgba(37,211,102,0.1)] to-[rgba(18,140,126,0.1)] text-[#25D366]"
                : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b]"
            }`}
          >
            {isActive(item.href || "") && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/5 bg-[#25D366] rounded-r-full" />
            )}
            <i className={`fas ${item.icon} w-5 text-center`}></i>
            {!isCollapsed && <span>{item.label}</span>}
            {!isCollapsed && item.badge && (
              <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold ${item.isPro ? "bg-[#00C853] text-white" : "bg-[#ef4444] text-white"}`}>
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className={`border-t border-[#e2e8f0] ${isCollapsed ? "p-2" : "p-4"}`}>
        <div className={`flex items-center p-3 rounded-xl hover:bg-[#f1f5f9] cursor-pointer ${isCollapsed ? "justify-start px-2" : "gap-3"}`}>
          <div className="w-10 h-10 bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-full flex items-center justify-center text-white font-bold shrink-0">
            JD
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-[#1e293b] truncate">John Doe</div>
                <div className="text-xs text-[#64748b]">Premium Seller</div>
              </div>
              <i className="fas fa-chevron-right text-[#64748b] text-xs shrink-0"></i>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
