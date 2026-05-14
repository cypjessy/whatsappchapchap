"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import "./bottomnav-styles.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: number;
  section?: string;
}

interface BottomNavProps {
  onFABClick?: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MAIN_NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Home", icon: "fa-home", href: "/dashboard" },
  { id: "orders", label: "Orders", icon: "fa-shopping-bag", href: "/orders", badge: 12 },
  { id: "bookings", label: "Bookings", icon: "fa-calendar-alt", href: "/bookings", badge: 8 },
  { id: "customers", label: "People", icon: "fa-users", href: "/customers" },
];

const FAB_MENU_SECTIONS = [
  {
    title: "Create New",
    items: [
      { id: "new-order", label: "New Order", icon: "fa-shopping-cart", href: "/orders?new=true" },
      { id: "new-booking", label: "New Booking", icon: "fa-calendar-plus", href: "/bookings?new=true" },
      { id: "add-product", label: "Add Product", icon: "fa-plus-square", href: "/products?new=true" },
      { id: "add-customer", label: "Add Customer", icon: "fa-user-plus", href: "/customers?new=true" },
    ],
  },
  {
    title: "Navigate",
    items: [
      { id: "products", label: "Products", icon: "fa-box", href: "/products" },
      { id: "services", label: "My Services", icon: "fa-concierge-bell", href: "/services" },
      { id: "settings", label: "Settings", icon: "fa-cog", href: "/settings" },
    ],
  },
  {
    title: "Support",
    items: [
      { id: "help", label: "Help Center", icon: "fa-question-circle", href: "/help" },
    ],
  },
];

// ─── Sub-Components ───────────────────────────────────────────────────────────

function RippleButton({
  children,
  onClick,
  className = "",
  active = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  active?: boolean;
}) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    
    setRipples((prev) => [...prev, { x, y, id }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
    
    onClick?.();
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      className={`relative overflow-hidden ${className}`}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full animate-ripple pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 10,
            height: 10,
            marginLeft: -5,
            marginTop: -5,
          }}
        />
      ))}
      {children}
    </button>
  );
}

function BottomNavItem({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
}) {
  const [isPressed, setIsPressed] = useState(false);

  const handleNavigation = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Ensure app is awake and responsive
    sessionStorage.setItem('lastActiveTime', Date.now().toString());
    
    // Dispatch focus event to wake up any suspended listeners
    window.dispatchEvent(new Event('focus'));
    
    // Call parent onClick if provided
    onClick?.();
  }, [onClick]);

  return (
    <Link
      href={item.href}
      onClick={handleNavigation}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      className={`
        relative flex-1 flex flex-col items-center justify-center h-full py-2 px-1
        transition-all duration-200 select-none rounded-xl mx-1
        ${isPressed ? "scale-95" : "scale-100"}
        ${isActive 
          ? "bg-[#E8F5E9] text-[#25D366]" 
          : "text-[#64748b] hover:bg-gray-50"
        }
      `}
    >
      {/* MD3 Active Indicator - Pill shape */}
      {isActive && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#25D366] rounded-b-full" />
      )}
      
      <div className="relative mt-1">
        <i className={`fas ${item.icon} text-[20px] transition-transform duration-200 ${isActive ? "scale-105" : "scale-100"}`} />
      </div>
      
      <span className={`
        text-[11px] font-semibold mt-1.5 transition-all duration-200
        ${isActive ? "opacity-100" : "opacity-80"}
      `}>
        {item.label}
      </span>

      {/* Badge */}
      {item.badge && item.badge > 0 && (
        <span className={`
          absolute top-1 right-1/2 translate-x-3
          min-w-[18px] h-[18px] px-1
          bg-[#ef4444] text-white text-[10px] font-bold
          rounded-full flex items-center justify-center
          border-2 border-white shadow-sm animate-badgePop
        `}>
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
    </Link>
  );
}

function MenuSheet({
  isOpen,
  onClose,
  onLogout,
}: {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      requestAnimationFrame(() => setIsVisible(true));
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  }, [onClose]);

  // Swipe to dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${diff}px)`;
      sheetRef.current.style.transition = "none";
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientY - startY.current;
    if (sheetRef.current) {
      sheetRef.current.style.transition = "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
      if (diff > 100) {
        sheetRef.current.style.transform = `translateY(100%)`;
        handleClose();
      } else {
        sheetRef.current.style.transform = `translateY(0)`;
      }
    }
  };

  if (!isOpen && !isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black/40 z-40 lg:hidden
          transition-opacity duration-300
          ${isVisible && !isClosing ? "opacity-100" : "opacity-0"}
        `}
        onClick={handleClose}
      />

      {/* Sheet - MD3 Style */}
      <div
        ref={sheetRef}
        className={`
          fixed bottom-0 left-0 right-0 bg-white z-50 lg:hidden
          shadow-[0_-4px_24px_rgba(0,0,0,0.12)]
          transition-all duration-300
          ${isVisible && !isClosing ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}
        `}
        style={{
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          borderTopLeftRadius: '28px',
          borderTopRightRadius: '28px',
          backgroundColor: '#ffffff'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle - MD3 style */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4 flex items-center justify-between border-b border-gray-100">
          <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#E8F5E9] flex items-center justify-center">
              <i className="fas fa-plus text-[#25D366] text-base" />
            </div>
            Quick Actions
          </h3>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full hover:bg-gray-100 active:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
          >
            <i className="fas fa-times text-sm" />
          </button>
        </div>

        {/* Sections */}
        <div className="px-4 pb-8 max-h-[70vh] overflow-y-auto">
          {FAB_MENU_SECTIONS.map((section, sectionIdx) => (
            <div key={section.title} className={sectionIdx > 0 ? "mt-6" : "mt-2"}>
              <div className="px-2 mb-3">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  {section.title}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {section.items.map((item, idx) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={handleClose}
                    className={`
                      flex flex-col items-center gap-2 p-3 rounded-2xl
                      hover:bg-gray-50 active:bg-gray-100 active:scale-95
                      transition-all duration-150
                      animate-menuItem
                    `}
                    style={{ animationDelay: `${sectionIdx * 80 + idx * 40}ms` }}
                  >
                    <div className={`
                      w-14 h-14 rounded-2xl flex items-center justify-center
                      bg-[#E8F5E9]
                      text-[#25D366] text-lg
                      shadow-sm
                    `}>
                      <i className={`fas ${item.icon}`} />
                    </div>
                    <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* Logout Section */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="px-2 mb-3">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                Account
              </span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <button
                onClick={() => {
                  handleClose();
                  onLogout();
                }}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-red-50 active:bg-red-100 active:scale-95 transition-all duration-150"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-red-50 text-red-500 text-lg shadow-sm">
                  <i className="fas fa-sign-out-alt" />
                </div>
                <span className="text-[11px] font-medium text-red-600 text-center leading-tight">
                  Logout
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BottomNav({ onFABClick }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [fabOpen, setFabOpen] = useState(false);
  const [fabPressed, setFabPressed] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const isActive = useCallback((href: string) => {
    const cleanHref = href.split("?")[0];
    return pathname === cleanHref;
  }, [pathname]);

  const handleFabClick = useCallback(() => {
    setFabPressed(true);
    setTimeout(() => setFabPressed(false), 150);
    setFabOpen((prev) => !prev);
    onFABClick?.();
  }, [onFABClick]);

  // Close FAB on route change
  useEffect(() => {
    setFabOpen(false);
  }, [pathname]);

  // Close FAB on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (fabOpen) setFabOpen(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [fabOpen]);

  return (
    <>
      {/* Menu Sheet */}
      <MenuSheet isOpen={fabOpen} onClose={() => setFabOpen(false)} onLogout={handleLogout} />

      {/* Bottom Navigation Bar - Material Design 3 */}
      <nav
        className={`
          fixed bottom-0 left-0 right-0 bg-white z-40 lg:hidden
          shadow-[0_-2px_16px_rgba(0,0,0,0.08)]
        `}
        style={{ 
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          backgroundColor: '#ffffff'
        }}
      >
        <div className="flex items-end justify-between h-16 max-w-lg mx-auto px-1 relative">
          
          {/* Left nav items (first 2) */}
          {MAIN_NAV_ITEMS.slice(0, 2).map((item) => (
            <div key={item.id} className="flex-1">
              <BottomNavItem
                item={item}
                isActive={isActive(item.href)}
              />
            </div>
          ))}

          {/* Center FAB Container - MD3 Style */}
          <div className="relative -mt-6 flex items-center justify-center w-16">
            {/* FAB Background cutout effect */}
            <div className="absolute inset-0 -top-3 pointer-events-none">
              <svg width="64" height="48" viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -top-2 left-1/2 -translate-x-1/2">
                <path 
                  d="M0 0 L64 0 L64 48 C48 48 40 32 32 32 C24 32 16 48 0 48 Z" 
                  fill="#ffffff"
                />
              </svg>
            </div>
            
            {/* FAB Button - MD3 Primary Container */}
            <RippleButton
              onClick={handleFabClick}
              active={fabOpen}
              className={`
                w-14 h-14 rounded-2xl
                bg-[#25D366]
                flex items-center justify-center text-white
                shadow-md shadow-[#25D366]/30
                transition-all duration-200
                relative z-10
                ${fabPressed ? "scale-90" : "scale-100"}
                ${fabOpen ? "rotate-45 shadow-lg shadow-[#25D366]/40" : "rotate-0"}
              `}
            >
              <i className="fas fa-plus text-xl" />
            </RippleButton>
          </div>

          {/* Right nav items (last 2) */}
          {MAIN_NAV_ITEMS.slice(2).map((item) => (
            <div key={item.id} className="flex-1">
              <BottomNavItem
                item={item}
                isActive={isActive(item.href)}
              />
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}