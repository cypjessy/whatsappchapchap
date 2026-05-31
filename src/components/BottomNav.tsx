"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNavLiveState } from "@/hooks/useNavLiveState";
import MenuSheet from "./MenuSheet";
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

  const handlePointerDown = useCallback(() => {
    wake();
    setIsPressed(true);
    sessionStorage.setItem('lastActiveTime', Date.now().toString());
    window.dispatchEvent(new Event('focus'));
    navFallbackRef.current = false;
  }, [wake]);

  const handleNavigation = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    wake();
    sessionStorage.setItem('lastActiveTime', Date.now().toString());
    window.dispatchEvent(new Event('focus'));

    const lastActive = sessionStorage.getItem('lastActiveTime');
    if (lastActive) {
      const idleMs = Date.now() - parseInt(lastActive);
      if (idleMs > 10 * 60 * 1000 && !navFallbackRef.current) {
        navFallbackRef.current = true;
        e.preventDefault();
        window.location.href = item.href;
        return;
      }
    }

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
        relative flex-1 flex flex-col items-center justify-center h-full
        transition-all duration-200 select-none rounded-lg mx-0.5
        ${isPressed ? "scale-[0.95]" : "scale-100"}
        ${isActive ? "text-emerald-600" : "text-gray-400"}
        touch-manipulation
      `}
    >
      {/* Active indicator - premium gradient pill */}
      {isActive && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-gradient-to-r from-emerald-400 to-green-500 rounded-b-full animate-navIndicator shadow-sm shadow-emerald-300/50" />
      )}

      {/* Icon with active glow */}
      <div className="relative mt-1">
        <div className={`
          w-[22px] h-[22px] flex items-center justify-center
          transition-all duration-200
          ${isActive ? "scale-105" : "scale-100"}
        `}>
          <i className={`fas ${item.icon} text-lg transition-all duration-200`} />
        </div>
        {isActive && (
          <div className="absolute inset-0 bg-emerald-400/20 blur-lg rounded-full -z-10" />
        )}
      </div>

      {/* Label */}
      <span className={`
        text-[10px] font-semibold mt-1 tracking-tight transition-all duration-200 leading-tight
        ${isActive ? "opacity-100" : "opacity-60"}
      `}>
        {item.label}
      </span>

      {/* MD3 Badge */}
      {item.badge && item.badge > 0 && (
        <span className={`
          absolute -top-0.5 right-1/2 translate-x-3
          min-w-[16px] h-[16px] px-1
          bg-gradient-to-r from-red-500 to-rose-500 text-white text-[9px] font-bold
          rounded-full flex items-center justify-center
          border-[1.5px] border-white shadow-sm animate-badgePop
        `}>
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
    </Link>
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

  // Live state keep-alive
  useEffect(() => {
    const healthInterval = setInterval(() => {
      setNavHealth((h) => h + 1);
    }, 6_000);
    return () => clearInterval(healthInterval);
  }, []);

  // App resume handler
  useEffect(() => {
    const handleAppResume = () => {
      setFabOpen(false);
      setFabPressed(false);
      setNavHealth((h) => h + 1);
      setTimeout(() => setNavHealth((h) => h + 1), 100);
    };

    window.addEventListener('appresumed', handleAppResume);
    window.addEventListener('focus', handleAppResume);
    window.addEventListener('pageshow', handleAppResume);

    return () => {
      window.removeEventListener('appresumed', handleAppResume);
      window.removeEventListener('focus', handleAppResume);
      window.removeEventListener('pageshow', handleAppResume);
    };
  }, []);

  // Visibility change handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        document.documentElement.style.setProperty(
          '--sab',
          'env(safe-area-inset-bottom, 0px)'
        );
        setFabOpen(false);
        setNavHealth((h) => h + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Global pointer keep-alive (wake navigation, but don't close the FAB — that's handled by route change, scroll, etc.)
  useEffect(() => {
    const handlePointerActivity = () => {
      sessionStorage.setItem('lastActiveTime', Date.now().toString());
    };

    document.addEventListener('pointerdown', handlePointerActivity, { passive: true });
    return () => document.removeEventListener('pointerdown', handlePointerActivity);
  }, []);

  return (
    <>
      {/* Menu Sheet */}
      <MenuSheet isOpen={fabOpen} onClose={() => setFabOpen(false)} onLogout={handleLogout} isAdmin={isAdmin} />

      {/* Premium Bottom Navigation Bar */}
      <nav
        className={`
          fixed bottom-0 left-0 right-0 z-40 lg:hidden
          shadow-[0_-4px_20px_rgba(0,0,0,0.08)]
        `}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          backgroundColor: '#ffffff',
          transform: 'translateZ(0)',
          willChange: 'transform',
        }}
      >
        {/* Premium accent bar at top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 opacity-60" />

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

          {/* Center FAB Container */}
          <div className="relative -mt-4 flex items-center justify-center w-16">
            {/* FAB Glow effect (behind button) */}
            {fabOpen && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-20 h-20 rounded-full bg-emerald-400/20 blur-2xl animate-pulse" />
              </div>
            )}

            {/* FAB Button */}
            <RippleButton
              onClick={handleFabClick}
              active={fabOpen}
              className={`
                w-14 h-14 rounded-2xl
                bg-gradient-to-br from-emerald-400 to-green-600
                flex items-center justify-center text-white
                shadow-lg shadow-emerald-400/30
                transition-all duration-200
                relative z-10
                ${fabPressed ? "scale-90" : "scale-100"}
                ${fabOpen
                  ? "rotate-45 shadow-xl shadow-emerald-400/40"
                  : "rotate-0 hover:shadow-xl hover:shadow-emerald-400/40 hover:-translate-y-0.5"
                }
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
