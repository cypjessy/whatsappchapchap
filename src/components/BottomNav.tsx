"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
      { id: "shipping", label: "Shipping", icon: "fa-shipping-fast", href: "/shipping" },
      { id: "settings", label: "Settings", icon: "fa-cog", href: "/settings" },
    ],
  },
  {
    title: "Support",
    items: [
      { id: "campaigns", label: "Campaigns", icon: "fa-bullhorn", href: "/campaigns" },
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

  return (
    <Link
      href={item.href}
      onClick={onClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      className={`
        relative flex-1 flex flex-col items-center justify-center h-full
        transition-all duration-200 select-none
        ${isPressed ? "scale-90" : "scale-100"}
        ${isActive ? "text-[#25D366]" : "text-[#64748b]"}
      `}
    >
      <div className="relative">
        <i className={`fas ${item.icon} text-[22px] transition-transform duration-200 ${isActive ? "scale-110" : "scale-100"}`} />
        
        {/* Active dot indicator */}
        {isActive && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#25D366] rounded-full" />
        )}
      </div>
      
      <span className={`
        text-[10px] font-bold mt-1 transition-all duration-200
        ${isActive ? "opacity-100 translate-y-0" : "opacity-70"}
      `}>
        {item.label}
      </span>

      {/* Badge */}
      {item.badge && item.badge > 0 && (
        <span className={`
          absolute -top-0.5 right-1/2 translate-x-3
          min-w-[18px] h-[18px] px-1
          bg-[#ef4444] text-white text-[10px] font-extrabold
          rounded-full flex items-center justify-center
          border-2 border-white shadow-sm
          animate-badgePop
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
}: {
  isOpen: boolean;
  onClose: () => void;
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
          fixed inset-0 bg-black/50 z-40 lg:hidden
          transition-opacity duration-300
          ${isVisible && !isClosing ? "opacity-100" : "opacity-0"}
        `}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`
          fixed bottom-0 left-0 right-0 bg-white rounded-t-[28px] z-50 lg:hidden
          shadow-[0_-8px_40px_rgba(0,0,0,0.15)]
          transition-all duration-300
          ${isVisible && !isClosing ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}
        `}
        style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-[#e2e8f0] rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pb-3 flex items-center justify-between">
          <h3 className="font-extrabold text-lg text-[#1e293b] flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10 flex items-center justify-center">
              <i className="fas fa-bolt text-[#25D366] text-sm" />
            </div>
            Quick Actions
          </h3>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[#64748b] active:bg-[#e2e8f0] transition-colors"
          >
            <i className="fas fa-times text-xs" />
          </button>
        </div>

        {/* Sections */}
        <div className="px-4 pb-8 max-h-[70vh] overflow-y-auto">
          {FAB_MENU_SECTIONS.map((section, sectionIdx) => (
            <div key={section.title} className={sectionIdx > 0 ? "mt-5" : ""}>
              <div className="px-1 mb-2">
                <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">
                  {section.title}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {section.items.map((item, idx) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={handleClose}
                    className={`
                      flex flex-col items-center gap-2 p-3 rounded-2xl
                      active:bg-[#f1f5f9] active:scale-95
                      transition-all duration-150
                      animate-menuItem
                    `}
                    style={{ animationDelay: `${sectionIdx * 80 + idx * 40}ms` }}
                  >
                    <div className={`
                      w-12 h-12 rounded-2xl flex items-center justify-center
                      bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/5
                      text-[#25D366] text-lg
                    `}>
                      <i className={`fas ${item.icon}`} />
                    </div>
                    <span className="text-[11px] font-bold text-[#475569] text-center leading-tight">
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BottomNav({ onFABClick }: BottomNavProps) {
  const pathname = usePathname();
  const [fabOpen, setFabOpen] = useState(false);
  const [fabPressed, setFabPressed] = useState(false);

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
      <MenuSheet isOpen={fabOpen} onClose={() => setFabOpen(false)} />

      {/* Bottom Navigation Bar */}
      <nav className={`
        fixed bottom-0 left-0 right-0 bg-white z-40 lg:hidden
        border-t border-[#e2e8f0]/80
        shadow-[0_-4px_20px_rgba(0,0,0,0.05)]
        safe-area-bottom
      `}>
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2 relative">
          {MAIN_NAV_ITEMS.map((item, index) => (
            <BottomNavItem
              key={item.id}
              item={item}
              isActive={isActive(item.href)}
            />
          ))}

          {/* Center FAB */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-5">
            <RippleButton
              onClick={handleFabClick}
              active={fabOpen}
              className={`
                w-14 h-14 rounded-full
                bg-gradient-to-r from-[#25D366] to-[#128C7E]
                flex items-center justify-center text-white
                shadow-lg shadow-[#25D366]/40
                transition-all duration-300
                ${fabPressed ? "scale-85" : "scale-100"}
                ${fabOpen ? "rotate-45 shadow-xl shadow-[#25D366]/50" : "rotate-0"}
                ${fabOpen ? "ring-4 ring-[#25D366]/20" : "ring-0"}
              `}
            >
              <i className="fas fa-plus text-xl" />
            </RippleButton>
          </div>
        </div>

        {/* Home indicator spacing */}
        <div className="h-1 bg-transparent" />
      </nav>
    </>
  );
}