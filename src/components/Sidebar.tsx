"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { tenantService } from "@/lib/db";
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
    title: "Payments",
    items: [
      { id: "pricing-plans", label: "Pricing Plans", icon: "fa-tags", href: "/all-tenants?tab=plans" },
    ],
  },
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
    title: "System",
    items: [
      { id: "settings", label: "Settings", icon: "fa-cog", href: "/settings" },
      { id: "paystack", label: "Paystack Settings", icon: "fa-credit-card", href: "/settings/paystack" },
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
          whitespace-nowrap z-50 shadow-md3-level3
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
        sidebar-nav-link group relative flex items-center gap-3 py-2.5 rounded-xl font-medium text-sm
        transition-all duration-200 mx-2
        ${isCollapsed ? "justify-center px-2" : "px-4"}
        ${isActive
          ? "bg-primary-container text-primary"
          : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
        }
        ${isPressed ? "scale-[0.97]" : "scale-100"}
      `}
    >
      {/* MD3 Active indicator - pill-shaped bar */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-primary rounded-r-full animate-indicatorSlide" />
      )}

      {/* Icon container - MD3 tonal system */}
      <div className={`
        w-10 h-10 rounded-xl flex items-center justify-center shrink-0
        transition-all duration-200
        ${isActive
          ? "bg-primary/10"
          : isHovered
            ? "bg-surface-container"
            : "bg-transparent"
        }
      `}>
        <i className={`fas ${item.icon} text-base ${isActive ? "text-primary" : "text-on-surface-variant"}`} />
      </div>

      {/* Label */}
      {!isCollapsed && (
        <span className="truncate transition-all duration-200 font-medium">{item.label}</span>
      )}

      {/* Badge - MD3 chip styling */}
      {!isCollapsed && item.badge && (
        <span className={`
          ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0
          ${isActive ? "bg-primary text-white" : "bg-error text-white"}
          shadow-level1
        `}>
          {item.badge}
        </span>
      )}

      {/* Collapsed badge dot */}
      {isCollapsed && item.badge && (
        <span className={`
          absolute top-2 right-2 w-2.5 h-2.5 rounded-full ring-2 ring-white
          ${isActive ? "bg-primary" : "bg-error"}
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
  const router = useRouter();
  const { user, logout, isAdmin } = useAuth();
  const [localCollapsed, setLocalCollapsed] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [businessName, setBusinessName] = useState("User");
  const hoverTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Admin section definition
  const ADMIN_SECTION: NavSection = {
    title: "Admin",
    items: [
      { id: "all-tenants", label: "All Tenants", icon: "fa-building", href: "/all-tenants" },
    ],
  };

  // Fetch business name from database
  useEffect(() => {
    if (!user) return;
    
    const fetchBusinessName = async () => {
      try {
        const tenant = await tenantService.getTenant(user);
        if (tenant?.businessName) {
          setBusinessName(tenant.businessName);
        } else if (tenant?.name) {
          setBusinessName(tenant.name);
        }
      } catch (error) {
        console.error("Error fetching business name:", error);
      }
    };
    
    fetchBusinessName();
  }, [user]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

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
        bg-white border-r border-surface-container-high flex flex-col overflow-hidden
        transition-all duration-300 ease-out
        shadow-level1
        ${isCollapsed ? "w-20" : "w-[260px]"}
        ${isExpanded ? "shadow-level3" : ""}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ height: "100vh" }}
    >
      {/* Logo - MD3 styling */}
      <div className={`
        border-b border-surface-container-high flex items-center shrink-0
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
            bg-primary rounded-xl
            transition-all duration-300 shadow-level1
            ${isCollapsed ? "w-10 h-10 text-lg" : "w-11 h-11 text-xl"}
          `}>
            <i className="fab fa-whatsapp" />
          </div>

          {!isCollapsed && (
            <div className="overflow-hidden">
              <div className="text-xl font-extrabold text-on-surface whitespace-nowrap animate-fadeIn">
                Chap<span className="text-primary">Chap</span>
              </div>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-thin">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-1">
            {/* Section label (only when expanded) - MD3 typography */}
            {!isCollapsed && (
              <div className="sidebar-section-label px-6 py-2">
                <span className="md3-label-small text-on-surface-variant uppercase tracking-widest">
                  {section.title}
                </span>
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

        {/* Admin Section - only visible to admin */}
        {isAdmin && (
          <div className="mt-4 pt-4 border-t border-surface-container-high">
            {NAV_SECTIONS[NAV_SECTIONS.length - 1]?.title === "System" && !isCollapsed && (
              <div className="sidebar-section-label px-6 py-2">
                <span className="md3-label-small text-primary uppercase tracking-widest">
                  {ADMIN_SECTION.title}
                </span>
              </div>
            )}
            {ADMIN_SECTION.items.map((item) => (
              <NavLink
                key={item.id}
                item={item}
                isCollapsed={isCollapsed}
                isActive={pathname === item.href}
                onClick={onClose}
              />
            ))}
          </div>
        )}
      </nav>

      {/* Profile Card */}
      <div className={`
        border-t border-surface-container-high shrink-0
        transition-all duration-300
        ${isCollapsed ? "p-3" : "p-4"}
      `}>
        <div className={`
          group flex items-center rounded-xl cursor-pointer
          transition-all duration-200 hover:bg-surface-dim
          ${isCollapsed ? "justify-center p-2" : "gap-3 p-3"}
        `}>
          <div className={`
            shrink-0 rounded-full bg-primary
            flex items-center justify-center text-white font-semibold
            transition-all duration-300 shadow-level1
            ${isCollapsed ? "w-9 h-9 text-xs" : "w-10 h-10 text-sm"}
          `}>
            JD
          </div>

          {!isCollapsed && (
            <div className="flex-1 min-w-0 animate-fadeIn">
              <div className="md3-body-medium font-semibold text-on-surface truncate">{businessName}</div>
              <div className="md3-label-small text-on-surface-variant flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Online</span>
              </div>
            </div>
          )}

          {!isCollapsed && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl hover:bg-error-container hover:text-error active:bg-error-container transition-colors shrink-0 group"
              title="Logout"
            >
              <i className="fas fa-sign-out-alt text-outline group-hover:text-error transition-colors" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}