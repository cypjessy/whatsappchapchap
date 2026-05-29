"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNavLiveState } from "@/hooks/useNavLiveState";
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
      { id: "paystack", label: "Paystack", icon: "fa-credit-card", href: "/settings/paystack" },
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
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { healthTick, wake } = useNavLiveState();

  // ── Immediate pointer wake ──────────────────────────────────────────
  const handlePointerDown = useCallback(() => {
    wake();
    setIsPressed(true);
    sessionStorage.setItem('lastActiveTime', Date.now().toString());
    window.dispatchEvent(new Event('focus'));
  }, [wake]);

  const handlePointerUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    wake();
    sessionStorage.setItem('lastActiveTime', Date.now().toString());
    window.dispatchEvent(new Event('focus'));
    
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
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      data-live={healthTick}
      className={`relative overflow-hidden touch-manipulation ${className}`}
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
  const { healthTick, wake } = useNavLiveState();
  const navFallbackRef = useRef(false);

  // ── Immediate pointer wake ──────────────────────────────────────────
  // onPointerDown fires BEFORE onTouchStart/onMouseDown and always works
  // even after long idle because it's a native browser event
  const handlePointerDown = useCallback(() => {
    wake();
    setIsPressed(true);
    
    // Update session storage so app-lifecycle knows we're active
    sessionStorage.setItem('lastActiveTime', Date.now().toString());
    
    // Dispatch wake events for any suspended listeners
    window.dispatchEvent(new Event('focus'));
    
    // Reset fallback flag — next navigation will try React router first
    navFallbackRef.current = false;
  }, [wake]);

  // ── Primary navigation handler ───────────────────────────────────────
  const handleNavigation = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Wake up immediately
    wake();
    sessionStorage.setItem('lastActiveTime', Date.now().toString());
    window.dispatchEvent(new Event('focus'));
    
    // If the app was idle for a very long time (>10 min), React Router's
    // Link may be unresponsive — fall back to direct navigation
    const lastActive = sessionStorage.getItem('lastActiveTime');
    if (lastActive) {
      const idleMs = Date.now() - parseInt(lastActive);
      if (idleMs > 10 * 60 * 1000 && !navFallbackRef.current) {
        console.log('[BottomNav] Long idle detected — using direct navigation fallback:', item.href);
        navFallbackRef.current = true;
        e.preventDefault();
        window.location.href = item.href;
        return;
      }
    }
    
    // Call parent onClick if provided
    onClick?.();
  }, [onClick, wake, item.href]);

  const handlePointerUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  return (
    <Link
      href={item.href}
      onClick={handleNavigation}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      data-live={healthTick}
      className={`
        bottom-nav-item relative flex-1 flex flex-col items-center justify-center h-full py-2 px-1
        transition-all duration-200 select-none rounded-xl mx-1
        ${isPressed ? "scale-[0.95]" : "scale-100"}
        ${isActive 
          ? "text-primary" 
          : "text-on-surface-variant"
        }
        touch-manipulation
      `}
    >
      {/* MD3 Active Indicator - Pill shape */}
      {isActive && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] bg-primary rounded-b-full animate-navIndicator" />
      )}
      
      <div className="relative mt-1">
        <i className={`fas ${item.icon} text-xl transition-all duration-200 ${isActive ? "scale-105" : "scale-100"}`} />
      </div>
      
      <span className={`
        md3-label-small mt-1.5 transition-all duration-200
        ${isActive ? "opacity-100 font-semibold" : "opacity-70"}
      `}>
        {item.label}
      </span>

      {/* MD3 Badge */}
      {item.badge && item.badge > 0 && (
        <span className={`
          absolute top-1 right-1/2 translate-x-3
          min-w-[18px] h-[18px] px-1
          bg-error text-white text-[10px] font-bold
          rounded-full flex items-center justify-center
          border-2 border-white shadow-level1 animate-badgePop
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
  isAdmin,
}: {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  isAdmin?: boolean;
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
        <div className="px-6 pb-4 flex items-center justify-between border-b border-outline-variant">
          <h3 className="font-semibold text-lg text-on-surface flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#E8F5E9] flex items-center justify-center">
              <i className="fas fa-plus text-[#25D366] text-base" />
            </div>
            Quick Actions
          </h3>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full hover:bg-surface-variant active:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors"
          >
            <i className="fas fa-times text-sm" />
          </button>
        </div>

        {/* Sections */}
        <div className="px-4 pb-8 max-h-[70vh] overflow-y-auto">
          {FAB_MENU_SECTIONS.map((section, sectionIdx) => (
            <div key={section.title} className={sectionIdx > 0 ? "mt-6" : "mt-2"}>
              <div className="px-2 mb-3">
                <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wide">
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
                      hover:bg-surface-container-lowest active:bg-surface-variant active:scale-95
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
                    <span className="text-[11px] font-medium text-on-surface text-center leading-tight">
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* Admin Section - only visible to admin users */}
          {isAdmin && (
            <div className="mt-6">
              <div className="px-2 mb-3">
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">
                  <i className="fas fa-shield-alt mr-1"></i> Admin
                </span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <Link
                  href="/all-tenants"
                  onClick={onClose}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-primary-container active:bg-primary-container active:scale-95 transition-all duration-150"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary-container text-primary text-lg shadow-sm">
                    <i className="fas fa-building" />
                  </div>
                  <span className="text-[11px] font-medium text-on-surface text-center leading-tight">
                    All Tenants
                  </span>
                </Link>
              </div>
            </div>
          )}

          {/* Logout Section */}
          <div className="mt-6 pt-6 border-t border-outline-variant">
            <div className="px-2 mb-3">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wide">
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
  const { logout, isAdmin } = useAuth();
  const [fabOpen, setFabOpen] = useState(false);
  const [fabPressed, setFabPressed] = useState(false);
  const [navHealth, setNavHealth] = useState(0);

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

  // ── Live State Manager ───────────────────────────────────────────────
  // Periodically forces React re-render of the entire nav bar to prevent
  // stale fibers. This is critical for preventing "unpressable button"
  // after the app has been idle for a long time.
  useEffect(() => {
    // Force a state bump every 6 seconds to keep the React fiber alive
    const healthInterval = setInterval(() => {
      setNavHealth((h) => h + 1);
    }, 6_000);

    return () => clearInterval(healthInterval);
  }, []);

  // ── App Resume / Wake-Up Handler ─────────────────────────────────────
  // Resets all interactive state and forces a full re-render so every
  // button is guaranteed to have fresh event listeners.
  useEffect(() => {
    const handleAppResume = () => {
      console.log('[BottomNav] App resumed - resetting interactive state');
      
      // Reset ALL interactive state immediately
      setFabOpen(false);
      setFabPressed(false);
      
      // Force a full re-render of the nav bar — this gives every
      // BottomNavItem and RippleButton fresh event listeners
      setNavHealth((h) => h + 1);
      
      // Second pulse after a tick to catch any lingering stale state
      setTimeout(() => {
        setNavHealth((h) => h + 1);
      }, 100);
    };

    // Listen for app resume event
    window.addEventListener('appresumed', handleAppResume);
    window.addEventListener('focus', handleAppResume);
    window.addEventListener('pageshow', handleAppResume);

    return () => {
      window.removeEventListener('appresumed', handleAppResume);
      window.removeEventListener('focus', handleAppResume);
      window.removeEventListener('pageshow', handleAppResume);
    };
  }, []);

  // ── Visibility Change Handler ────────────────────────────────────────
  // Forces bottom nav safe area re-paint on resume and re-triggers
  // all live state listeners so buttons remain pressable.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[BottomNav] Visibility changed to visible - re-painting nav bar');
        
        // Force safe area re-paint
        document.documentElement.style.setProperty(
          '--sab',
          'env(safe-area-inset-bottom, 0px)'
        );
        
        // Force state refresh to wake up all nav item live listeners
        setFabOpen(false);
        setNavHealth((h) => h + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // ── Global Pointer Wake (capture phase) ──────────────────────────────
  // Ensures ANY touch/click on the page wakes up BottomNav state
  // before the event reaches individual components
  useEffect(() => {
    const wakeNav = () => {
      setFabOpen(false);
      sessionStorage.setItem('lastActiveTime', Date.now().toString());
    };

    document.addEventListener('pointerdown', wakeNav, { capture: true, passive: true });
    return () => document.removeEventListener('pointerdown', wakeNav, { capture: true } as any);
  }, []);

  return (
    <>
      {/* Menu Sheet */}
      <MenuSheet isOpen={fabOpen} onClose={() => setFabOpen(false)} onLogout={handleLogout} isAdmin={isAdmin} />

      {/* Bottom Navigation Bar - Material Design 3 */}
      <nav
        className={`
          fixed bottom-0 left-0 right-0 bg-white z-40 lg:hidden
          shadow-[0_-2px_16px_rgba(0,0,0,0.08)]
        `}
        style={{ 
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          backgroundColor: '#ffffff',
          // Force GPU compositing layer — prevents black flash on resume
          transform: 'translateZ(0)',
          willChange: 'transform',
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