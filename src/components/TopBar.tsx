"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { orderService, bookingService } from "@/lib/db";
import { useHaptics } from "@/hooks/useNativeAndroid";
import { useStatusBar } from "@/hooks/useStatusBar";
import "./topbar-styles.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopBarProps {
  title?: string;
  subtitle?: string;
  onMenuClick?: () => void;
  onSearchClick?: () => void;
  onNotificationClick?: () => void;
  notificationCount?: number;
  scrollThreshold?: number;
  onScrollChange?: (isScrolled: boolean) => void;
}

interface ActionButton {
  icon: string;
  label: string;
  onClick?: () => void;
  badge?: number;
  href?: string;
}

function getPageTitle(pathname: string): string {
  const segment = pathname.split("/")[1];
  const titles: Record<string, string> = {
    dashboard: "Dashboard",
    orders: "Orders",
    bookings: "Bookings",
    customers: "Customers",
    products: "Products",
    services: "Services",
    settings: "Settings",
    "all-tenants": "Tenants",
  };
  return titles[segment] || "ChapChap";
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ActionIcon({
  action,
  isScrolled,
}: {
  action: ActionButton;
  isScrolled: boolean;
}) {
  const [isPressed, setIsPressed] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const { impactLight } = useHaptics();

  const handlePress = () => {
    setIsPressed(true);
    setShowRipple(true);
    impactLight?.();
    setTimeout(() => {
      setShowRipple(false);
      setIsPressed(false);
    }, 600);
  };

  const content = (
    <button
      onClick={action.onClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={handlePress}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={handlePress}
      className={`
        relative w-10 h-10 rounded-2xl flex items-center justify-center
        overflow-hidden
        transition-all duration-200 ease-out
        ${isPressed ? "scale-90" : "scale-100"}
        ${isScrolled
          ? "hover:bg-gray-100 active:bg-gray-200 text-gray-600"
          : "hover:bg-white/15 active:bg-white/25 text-white"
        }
      `}
      aria-label={action.label}
    >
      {showRipple && (
        <span
          className={`
            absolute inset-0 rounded-2xl
            ${isScrolled ? 'bg-gray-300/40' : 'bg-white/30'}
            animate-md3Ripple
          `}
        />
      )}
      <i className={`fas ${action.icon} text-base relative z-10`} />
      {action.badge && action.badge > 0 && (
        <span className={`
          absolute -top-0.5 -right-0.5
          min-w-[18px] h-[18px] px-1
          bg-red-500 text-white text-[10px] font-bold
          rounded-full flex items-center justify-center
          border-2 ${isScrolled ? 'border-white' : 'border-white/40'} shadow-sm
          z-20
        `}>
          {action.badge > 99 ? "99+" : action.badge}
        </span>
      )}
    </button>
  );

  if (action.href) {
    return <Link href={action.href}>{content}</Link>;
  }

  return content;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AndroidTopBar({
  title,
  subtitle,
  onMenuClick,
  onSearchClick,
  onNotificationClick,
  notificationCount = 0,
  scrollThreshold = 50,
  onScrollChange,
}: TopBarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const pathname = usePathname();

  const displayTitle = title || getPageTitle(pathname);
  const isOnDashboard = pathname === "/dashboard";

  // Scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const scrolled = currentY > scrollThreshold;
      setIsScrolled(scrolled);

      if (onScrollChange) {
        onScrollChange(scrolled);
      }

      if (currentY > lastScrollY.current && currentY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollThreshold, onScrollChange]);

  // Dynamic status bar color
  useStatusBar({
    color: isScrolled ? '#ffffff' : '#075E54',
    style: isScrolled ? 'dark' : 'light'
  });

  // Reset on route change
  useEffect(() => {
    setIsScrolled(false);
    setIsVisible(true);
    lastScrollY.current = 0;
  }, [pathname]);

  // Force re-render on app resume
  useEffect(() => {
    const handleAppResume = () => {
      setIsScrolled(window.scrollY > scrollThreshold);
      setIsVisible(true);
    };

    window.addEventListener('appresumed', handleAppResume);
    window.addEventListener('focus', handleAppResume);
    window.addEventListener('pageshow', handleAppResume);

    return () => {
      window.removeEventListener('appresumed', handleAppResume);
      window.removeEventListener('focus', handleAppResume);
      window.removeEventListener('pageshow', handleAppResume);
    };
  }, [scrollThreshold]);

  // Force safe area re-paint on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        document.documentElement.style.setProperty(
          '--sat',
          'env(safe-area-inset-top, 0px)'
        );
        window.dispatchEvent(new Event('resize'));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const leftActions: ActionButton[] = [];

  const rightActions: ActionButton[] = [];

  return (
    <>
      {/* Spacer for fixed header */}
      <div 
        className="lg:hidden flex-shrink-0" 
        style={{ height: 'calc(52px + var(--safe-area-top))' }} 
      />

      {/* Premium TopBar */}
      <header
        className={`
          fixed left-0 right-0 z-50 lg:hidden
          transition-all duration-300
          ${isVisible ? "translate-y-0" : "-translate-y-full"}
        `}
        style={{
          top: 0,
          willChange: 'transform',
          paddingTop: 'var(--safe-area-top)',
          background: isScrolled
            ? '#ffffff'
            : 'linear-gradient(135deg, #25D366 0%, #075E54 100%)',
          boxShadow: isScrolled
            ? '0 2px 12px rgba(0,0,0,0.08)'
            : '0 2px 16px rgba(37, 211, 102, 0.2)',
        }}
      >
        <div
          className="relative transition-all duration-300 flex-shrink-0 w-full"
          style={{
            minHeight: '52px',
          }}
        >
          {/* Radial overlay for depth */}
          {!isScrolled && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.12) 0%, transparent 60%)',
              }}
            />
          )}

          {/* Content */}
          <div className="relative flex items-center justify-between h-[52px] px-3 w-full">
            {/* Left: Menu + Title */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {/* Menu button */}
              <button
                onClick={onMenuClick}
                className={`
                  w-10 h-10 rounded-2xl flex items-center justify-center
                  transition-all duration-200 active:scale-90 shrink-0
                  ${isScrolled
                    ? 'text-gray-600 hover:bg-gray-100'
                    : 'text-white/90 hover:bg-white/15'
                  }
                `}
                aria-label="Menu"
              >
                <i className="fas fa-bars text-lg" />
              </button>

              {/* Title */}
              <div className="min-w-0">
                {isOnDashboard && !isScrolled ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white text-xs">
                      <i className="fab fa-whatsapp" />
                    </div>
                    <div>
                      <h1 className="text-white font-extrabold text-base tracking-tight truncate">
                        Chap<span className="text-white/80">Chap</span>
                      </h1>
                      <p className="text-white/60 text-[10px] -mt-0.5 font-medium">
                        Business Manager
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h1 className={`
                      font-bold text-base truncate transition-colors duration-300
                      ${isScrolled ? 'text-gray-900' : 'text-white'}
                    `}>
                      {displayTitle}
                    </h1>
                    {subtitle && (
                      <p className="text-[11px] text-gray-400 -mt-0.5 font-medium truncate">
                        {subtitle}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
              {/* Search */}
              <ActionIcon
                action={{ icon: "fa-search", label: "Search", onClick: onSearchClick }}
                isScrolled={isScrolled}
              />

              {/* Notifications */}
              <ActionIcon
                action={{ icon: "fa-bell", label: "Notifications", badge: notificationCount, onClick: onNotificationClick }}
                isScrolled={isScrolled}
              />

              {/* Profile / More - only when scrolled */}
              {isScrolled && (
                <button
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 ring-2 ring-white shadow-sm"
                >
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
