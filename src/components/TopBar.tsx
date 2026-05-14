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
  const [showRipple, setShowRipple] = useState(false);
  const rippleRef = useRef<HTMLSpanElement>(null);
  const { impactLight } = useHaptics();

  const handlePress = () => {
    setIsPressed(true);
    setShowRipple(true);
    impactLight();
    
    // Remove ripple after animation
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
        relative w-11 h-11 rounded-full flex items-center justify-center
        overflow-hidden
        transition-all duration-200 ease-out
        ${isPressed ? "scale-90" : "scale-100"}
        ${isScrolled 
          ? "hover:bg-gray-100 active:bg-gray-200 text-gray-700" 
          : "hover:bg-white/20 active:bg-white/30 text-white"
        }
      `}
      aria-label={action.label}
    >
      {/* Ripple effect */}
      {showRipple && (
        <span
          ref={rippleRef}
          className={`
            absolute inset-0 rounded-full
            ${isScrolled ? 'bg-gray-400/30' : 'bg-white/30'}
            animate-md3Ripple
          `}
        />
      )}
      
      <i className={`fas ${action.icon} text-lg relative z-10`} />
      
      {action.badge && action.badge > 0 && (
        <span className={`
          absolute -top-0.5 -right-0.5
          min-w-[20px] h-[20px] px-1
          bg-red-500 text-white text-[11px] font-bold
          rounded-full flex items-center justify-center
          border-2 ${isScrolled ? 'border-white' : 'border-[#25D366]'} shadow-sm animate-badgePop
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
  transparent = false,
  scrollThreshold = 50,
  onScrollChange,
}: TopBarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const pathname = usePathname();

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

  // Dynamic status bar color - matches TopBar background
  useStatusBar({ 
    color: isScrolled ? '#ffffff' : '#25D366',
    style: isScrolled ? 'dark' : 'light'
  });

  // Reset on route change
  useEffect(() => {
    setIsScrolled(false);
    setIsVisible(true);
    lastScrollY.current = 0;
  }, [pathname]);

  // Fix: Force re-render on app resume to prevent black/invisible state
  useEffect(() => {
    const handleAppResume = () => {
      console.log('[TopBar] App resumed - forcing re-render');
      // Force immediate state reset to ensure correct rendering
      setIsScrolled(window.scrollY > scrollThreshold);
      setIsVisible(true);
      
      // Force React to re-render by triggering a micro-state change
      setTimeout(() => {
        setIsVisible(prev => prev);
      }, 50);
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
  }, [scrollThreshold]);

  const leftActions: ActionButton[] = [];

  const rightActions: ActionButton[] = [];

  return (
    <>
      {/* Spacer for fixed header - matches TopBar height including safe area */}
      <div 
        className="lg:hidden flex-shrink-0" 
        style={{ 
          height: 'calc(64px + env(safe-area-inset-top, 0px))'
        }} 
      />

      {/* Minimal TopBar - Just background with safe area support */}
      <header
        className={`
          fixed left-0 right-0 z-50 lg:hidden
          transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)
          ${isVisible ? "translate-y-0" : "-translate-y-full"}
        `}
        style={{
          top: 0,
          minHeight: 'calc(64px + env(safe-area-inset-top, 0px))',
          willChange: 'transform',
          backgroundColor: isScrolled ? '#ffffff' : '#25D366',
          boxShadow: isScrolled ? '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)' : 'none',
        }}
      >
        {/* App Bar Container */}
        <div
          className="relative transition-all duration-300 flex-shrink-0 w-full"
          style={{ 
            minHeight: '64px',
            paddingTop: 'env(safe-area-inset-top, 0px)'
          }}
        >
          {/* Content Container - Empty, just provides safe area padding */}
          <div className="flex items-center justify-between px-3 h-16 min-h-[64px] w-full">
          </div>
        </div>
      </header>
    </>
  );
}