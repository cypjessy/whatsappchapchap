"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./sidebar-styles.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SidebarProps {
  onClose?: () => void;
  isExpanded?: boolean;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: string | null;
  section?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "fa-home", href: "/dashboard" },
    ],
  },
  {
    title: "Transactions",
    items: [
      { id: "orders", label: "Orders", icon: "fa-shopping-bag", href: "/orders", badge: "12" },
      { id: "bookings", label: "Bookings", icon: "fa-calendar-alt", href: "/bookings", badge: "8" },
    ],
  },
  {
    title: "Catalog",
    items: [
      { id: "products", label: "Products", icon: "fa-box", href: "/products" },
      { id: "services", label: "My Services", icon: "fa-concierge-bell", href: "/services" },
    ],
  },
  {
    title: "People",
    items: [
      { id: "customers", label: "Customers", icon: "fa-users", href: "/customers" },
    ],
  },
  {
    title: "Operations",
    items: [
      { id: "shipping", label: "Shipping", icon: "fa-shipping-fast", href: "/shipping" },
    ],
  },
  {
    title: "System",
    items: [
      { id: "settings", label: "Settings", icon: "fa-cog", href: "/settings" },
      { id: "help", label: "Help Center", icon: "fa-question-circle", href: "/help" },
    ],
  },
];

// ─── Sub-Components ───────────────────────────────────────────────────────────

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className={`
          absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5
          bg-[#1e293b] text-white text-xs font-semibold rounded-lg
          whitespace-nowrap z-50 shadow-lg
          animate-fadeIn
        `}>
          {label}
          <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-[#1e293b] rotate-45" />
        </div>
      )}
    </div>
  );
}

function NavLink({
  item,
  isCollapsed,
  isActive,
  onClick,
}: {
  item: NavItem;
  isCollapsed: boolean;
  isActive: boolean;
  onClick?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const content = (
    <Link
      href={item.href}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      className={`
        group relative flex items-center gap-3 py-2.5 rounded-xl font-semibold text-sm
        transition-all duration-200 mx-2
        ${isCollapsed ? "justify-center px-2" : "px-4"}
        ${isActive
          ? "bg-gradient-to-r from-[rgba(37,211,102,0.12)] to-[rgba(18,140,126,0.08)] text-[#25D366]"
          : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b]"
        }
        ${isPressed ? "scale-95" : "scale-100"}
      `}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#25D366] rounded-r-full transition-all duration-300" />
      )}

      {/* Icon container */}
      <div className={`
        w-9 h-9 rounded-lg flex items-center justify-center shrink-0
        transition-all duration-200
        ${isActive
          ? "bg-[#25D366]/10"
          : isHovered
            ? "bg-[#f1f5f9]"
            : "bg-transparent"
        }
      `}>
        <i className={`fas ${item.icon} text-sm ${isActive ? "text-[#25D366]" : ""}`} />
      </div>

      {/* Label */}
      {!isCollapsed && (
        <span className="truncate transition-opacity duration-200">{item.label}</span>
      )}

      {/* Badge */}
      {!isCollapsed && item.badge && (
        <span className={`
          ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0
          ${isActive ? "bg-[#25D366] text-white" : "bg-[#ef4444] text-white"}
        `}>
          {item.badge}
        </span>
      )}

      {/* Collapsed badge dot */}
      {isCollapsed && item.badge && (
        <span className={`
          absolute top-2 right-2 w-2 h-2 rounded-full
          ${isActive ? "bg-[#25D366]" : "bg-[#ef4444]"}
        `} />
      )}
    </Link>
  );

  if (isCollapsed) {
    return <Tooltip label={item.label}>{content}</Tooltip>;
  }

  return content;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Sidebar({ onClose, isExpanded = false }: SidebarProps) {
  const pathname = usePathname();
  const [localCollapsed, setLocalCollapsed] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Mobile drawer: always expanded. Desktop: hover to expand
  const isCollapsed = isExpanded ? false : localCollapsed;

  // Debounced hover handlers to prevent flickering
  const handleMouseEnter = useCallback(() => {
    if (window.innerWidth < 1024) return;
    clearTimeout(hoverTimeoutRef.current);
    setIsHovering(true);
    hoverTimeoutRef.current = setTimeout(() => setLocalCollapsed(false), 50);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (window.innerWidth < 1024) return;
    clearTimeout(hoverTimeoutRef.current);
    setIsHovering(false);
    hoverTimeoutRef.current = setTimeout(() => setLocalCollapsed(true), 200);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded, onClose]);

  // Cleanup timeout
  useEffect(() => {
    return () => clearTimeout(hoverTimeoutRef.current);
  }, []);

  return (
    <aside
      className={`
        bg-white border-r border-[#e2e8f0] flex flex-col overflow-hidden
        transition-all duration-300 ease-out
        ${isCollapsed ? "w-20" : "w-[260px]"}
        ${isExpanded ? "shadow-2xl" : ""}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ height: "100vh" }}
    >
      {/* Logo */}
      <div className={`
        border-b border-[#e2e8f0] flex items-center shrink-0
        transition-all duration-300
        ${isCollapsed ? "p-3 justify-center" : "p-4 gap-3"}
      `}>
        <Link
          href="/dashboard"
          onClick={onClose}
          className={`
            flex items-center transition-all duration-300
            ${isCollapsed ? "justify-center" : "gap-3"}
          `}
        >
          <div className={`
            shrink-0 flex items-center justify-center text-white
            bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-xl
            transition-all duration-300
            ${isCollapsed ? "w-10 h-10 text-lg" : "w-11 h-11 text-xl"}
          `}>
            <i className="fab fa-whatsapp" />
          </div>

          {!isCollapsed && (
            <div className="overflow-hidden">
              <div className="text-xl font-extrabold text-[#1e293b] whitespace-nowrap animate-fadeIn">
                Chap<span className="text-[#25D366]">Chap</span>
              </div>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-thin">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-1">
            {/* Section label (only when expanded) */}
            {!isCollapsed && (
              <div className="px-6 py-2 text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">
                {section.title}
              </div>
            )}

            {section.items.map((item) => (
              <NavLink
                key={item.id}
                item={item}
                isCollapsed={isCollapsed}
                isActive={pathname === item.href}
                onClick={onClose}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Profile Card */}
      <div className={`
        border-t border-[#e2e8f0] shrink-0
        transition-all duration-300
        ${isCollapsed ? "p-3" : "p-4"}
      `}>
        <div className={`
          group flex items-center rounded-xl cursor-pointer
          transition-all duration-200 hover:bg-[#f1f5f9]
          ${isCollapsed ? "justify-center p-2" : "gap-3 p-3"}
        `}>
          <div className={`
            shrink-0 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E]
            flex items-center justify-center text-white font-bold
            transition-all duration-300
            ${isCollapsed ? "w-9 h-9 text-xs" : "w-10 h-10 text-sm"}
          `}>
            JD
          </div>

          {!isCollapsed && (
            <div className="flex-1 min-w-0 animate-fadeIn">
              <div className="font-bold text-sm text-[#1e293b] truncate">John Doe</div>
              <div className="text-[11px] text-[#64748b] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                Premium Seller
              </div>
            </div>
          )}

          {!isCollapsed && (
            <i className="fas fa-chevron-right text-[10px] text-[#94a3b8] group-hover:text-[#64748b] transition-colors shrink-0" />
          )}
        </div>
      </div>
    </aside>
  );
}