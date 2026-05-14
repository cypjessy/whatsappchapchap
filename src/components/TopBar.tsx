"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { orderService, bookingService } from "@/lib/db";
import "./topbar-styles.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopBarProps {
  title?: string;
  subtitle?: string;
  onMenuClick?: () => void;
  onSearchClick?: () => void;
  onNotificationClick?: () => void;
  notificationCount?: number;
  transparent?: boolean;
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

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ActionIcon({
  action,
  isScrolled,
}: {
  action: ActionButton;
  isScrolled: boolean;
}) {
  const [isPressed, setIsPressed] = useState(false);

  const content = (
    <button
      onClick={action.onClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      className={`
        relative w-10 h-10 rounded-xl flex items-center justify-center
        transition-all duration-200 ease-out
        ${isPressed ? "scale-90" : "scale-100"}
        ${isScrolled 
          ? "hover:bg-gray-100 active:bg-gray-200 text-gray-700" 
          : "hover:bg-white/15 active:bg-white/25 text-white"
        }
      `}
      aria-label={action.label}
    >
      <i className={`fas ${action.icon} text-lg`} />
      
      {action.badge && action.badge > 0 && (
        <span className={`
          absolute top-0.5 right-0.5
          min-w-[18px] h-[18px] px-1
          bg-red-500 text-white text-[10px] font-bold
          rounded-full flex items-center justify-center
          border-2 ${isScrolled ? 'border-white' : 'border-[#25D366]'} shadow-sm animate-badgePop
        `}>
          {action.badge > 9 ? "9+" : action.badge}
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
  transparent = false,
  scrollThreshold = 50,
  onScrollChange,
}: TopBarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [dynamicNotificationCount, setDynamicNotificationCount] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const lastScrollY = useRef(0);
  const pathname = usePathname();

  // Fetch notification count dynamically
  useEffect(() => {
    if (!user) return;
    
    const fetchNotifications = async () => {
      try {
        const orders = await orderService.getOrders(user, "pending");
        const bookings = await bookingService.getBookings(user, "pending");
        setDynamicNotificationCount(orders.length + bookings.length);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    
    fetchNotifications();
  }, [user]);

  // Handle search
  const handleSearchClick = () => {
    if (onSearchClick) {
      onSearchClick();
    } else {
      setShowSearch(!showSearch);
    }
  };

  // Handle notification click
  const handleNotificationClick = () => {
    if (onNotificationClick) {
      onNotificationClick();
    } else {
      // Navigate to orders page with pending filter
      router.push("/orders?status=pending");
    }
  };

  // Handle logout from top bar
  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      
      // Background transition
      const scrolled = currentY > scrollThreshold;
      setIsScrolled(scrolled);
      
      // Notify parent of scroll state change
      if (onScrollChange) {
        onScrollChange(scrolled);
      }
      
      // Auto-hide on scroll down, show on scroll up
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

  // Reset on route change
  useEffect(() => {
    setIsScrolled(false);
    setIsVisible(true);
    lastScrollY.current = 0;
  }, [pathname]);

  const leftActions: ActionButton[] = [
    {
      icon: "fa-bars",
      label: "Menu",
      onClick: onMenuClick,
    },
  ];

  const rightActions: ActionButton[] = [
    {
      icon: "fa-search",
      label: "Search",
      onClick: handleSearchClick,
    },
    {
      icon: "fa-bell",
      label: "Notifications",
      onClick: handleNotificationClick,
      badge: notificationCount || dynamicNotificationCount,
    },
    {
      icon: "fa-sign-out-alt",
      label: "Logout",
      onClick: handleLogout,
    },
  ];

  return (
    <>
      {/* Spacer for fixed header */}
      <div className="h-[64px] lg:hidden" />

      {/* Premium Android Top Bar - Material Design 3 */}
      <header
        className={`
          fixed top-0 left-0 right-0 z-50 lg:hidden
          transition-all duration-300 ease-in-out
          ${isVisible ? "translate-y-0" : "-translate-y-full"}
          pt-[env(safe-area-inset-top)]
        `}
      >
        {/* App Bar Container - MD3 Style */}
        <div
          className={`
            relative transition-all duration-300 shadow-sm
            ${isScrolled 
              ? "bg-white shadow-md border-b border-gray-200/50" 
              : "bg-[#25D366] shadow-sm"
            }
          `}
        >
          {/* Content Container */}
          <div className="flex items-center justify-between px-4 py-3 h-16">
            {/* Left Actions */}
            <div className="flex items-center gap-1 z-10 min-w-[48px]">
              {leftActions.map((action) => (
                <ActionIcon key={action.label} action={action} isScrolled={isScrolled} />
              ))}
            </div>

            {/* Search Bar (when active) */}
            {showSearch && (
              <div className="absolute inset-0 bg-white flex items-center px-3 animate-fadeIn">
                <button
                  onClick={() => setShowSearch(false)}
                  className="mr-2 p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors text-gray-600"
                  aria-label="Go back"
                >
                  <i className="fas fa-arrow-left text-lg"></i>
                </button>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search orders, products..."
                  className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 transition-all"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="ml-2 p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors text-gray-600"
                    aria-label="Clear search"
                  >
                    <i className="fas fa-times text-lg"></i>
                  </button>
                )}
              </div>
            )}

            {/* Center Title Area */}
            {!showSearch && (
              <div className="absolute left-1/2 -translate-x-1/2 text-center max-w-[60%]">
                <h1 className={`font-semibold text-base truncate transition-colors duration-300 ${
                  isScrolled ? "text-gray-900" : "text-white"
                }`}>
                  {title || "ChapChap"}
                </h1>
                {subtitle && !isScrolled && (
                  <p className="text-white/80 text-xs font-medium truncate mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
            )}

            {/* Right Actions */}
            <div className="flex items-center gap-1 z-10 min-w-[48px] justify-end">
              {rightActions.map((action) => (
                <ActionIcon key={action.label} action={action} isScrolled={isScrolled} />
              ))}
            </div>
          </div>

          {/* Subtle bottom divider line */}
          {!isScrolled && (
            <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />
          )}
        </div>
      </header>
    </>
  );
}