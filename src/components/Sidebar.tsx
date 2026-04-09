"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  onClose?: () => void;
}

type NavItem = {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge: string | null;
  isPro?: boolean;
};

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);

  const navItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: "fa-home", href: "/dashboard", badge: null },
    { id: "orders", label: "Orders", icon: "fa-shopping-bag", href: "/orders", badge: "12" },
    { id: "products", label: "Products", icon: "fa-box", href: "/products", badge: null },
    { id: "customers", label: "Customers", icon: "fa-users", href: "/customers", badge: null },
    { id: "suppliers", label: "Suppliers", icon: "fa-truck", href: "/suppliers", badge: null },
    { id: "inventory", label: "Inventory", icon: "fa-warehouse", href: "/inventory", badge: null },
    { id: "shipping", label: "Shipping", icon: "fa-shipping-fast", href: "/shipping", badge: null },
    { id: "campaigns", label: "Campaigns", icon: "fa-bullhorn", href: "/campaigns", badge: null },
    { id: "reviews", label: "Reviews", icon: "fa-star", href: "/reviews", badge: null },
    { id: "reports", label: "Reports", icon: "fa-chart-bar", href: "/reports", badge: null },
    { id: "settings", label: "Settings", icon: "fa-cog", href: "/settings", badge: null },
    { id: "help", label: "Help Center", icon: "fa-question-circle", href: "/help", badge: null },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <aside 
      className={`bg-white border-r border-[#e2e8f0] flex flex-col transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-[280px]"
      }`}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
      style={{ height: "100vh", position: "sticky", top: 0 }}
    >
      <div className={`border-b border-[#e2e8f0] flex items-center ${isCollapsed ? "justify-center p-4" : "justify-start p-6 gap-3"}`}>
        <Link href="/dashboard" className={`flex items-center ${isCollapsed ? "" : "gap-3"}`}>
          <div className="w-11 h-11 bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-xl flex items-center justify-center text-white text-xl">
            <i className="fab fa-whatsapp"></i>
          </div>
          {!isCollapsed && <div className="text-xl font-extrabold text-[#1e293b]">Chap<span className="text-[#25D366]">Chap</span></div>}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <div className={`mb-2 text-xs font-bold uppercase tracking-wider text-[#64748b] ${isCollapsed ? "text-center" : "px-6"} ${isCollapsed ? "hidden" : ""}`}>Main</div>
        {navItems.slice(0, 4).map((item) => (
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

        <div className={`mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-[#64748b] ${isCollapsed ? "text-center" : "px-6"} ${isCollapsed ? "hidden" : ""}`}>Operations</div>
        {navItems.slice(4, 8).map((item) => (
          <Link
            key={item.id}
            href={item.href || "#"}
            onClick={onClose}
            className={`flex items-center gap-3 py-3 rounded-xl font-semibold transition-all relative ${
              isCollapsed ? "justify-start px-3" : "px-6"
            } ${
              isActive(item.href || "") ? "bg-gradient-to-r from-[rgba(37,211,102,0.1)] to-[rgba(18,140,126,0.1)] text-[#25D366]" : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b]"
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

        <div className={`mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-[#64748b] ${isCollapsed ? "text-center" : "px-6"} ${isCollapsed ? "hidden" : ""}`}>Marketing</div>
        {navItems.slice(8, 10).map((item) => (
          <Link
            key={item.id}
            href={item.href || "#"}
            onClick={onClose}
            className={`flex items-center gap-3 py-3 rounded-xl font-semibold transition-all relative ${
              isCollapsed ? "justify-start px-3" : "px-6"
            } ${
              isActive(item.href || "") ? "bg-gradient-to-r from-[rgba(37,211,102,0.1)] to-[rgba(18,140,126,0.1)] text-[#25D366]" : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b]"
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

        <div className={`mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-[#64748b] ${isCollapsed ? "text-center" : "px-6"} ${isCollapsed ? "hidden" : ""}`}>System</div>
        {navItems.slice(10).map((item) => (
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
