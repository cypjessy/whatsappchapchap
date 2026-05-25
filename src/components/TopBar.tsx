"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AndroidTopBar({
  title = "ChapChap",
  subtitle = "WhatsApp Sales Automation",
  onMenuClick,
  onScrollChange,
}: TopBarProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const pathname = usePathname();
  const { impactLight } = useHaptics();
  const [showRipple, setShowRipple] = useState(false);

  const handleBack = useCallback(() => {
    impactLight().catch(() => {});
    setShowRipple(true);

    setTimeout(() => {
      setShowRipple(false);
    }, 600);

    if (onMenuClick) {
      onMenuClick();
    } else {
      router.push("/");
    }
  }, [onMenuClick, router, impactLight]);

  const triggerRipple = useCallback(() => {
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 600);
  }, []);

  // Scroll behavior - auto hide on scroll down
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      
      // Notify parent of scroll state change
      if (onScrollChange) {
        onScrollChange(currentY > 50);
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
  }, [onScrollChange]);

  // Purple gradient status bar to match login page
  useStatusBar({ 
    color: '#667eea',
    style: 'light'
  });

  // Reset on route change
  useEffect(() => {
    setIsVisible(true);
    lastScrollY.current = 0;
  }, [pathname]);

  // Fix: Force re-render on app resume
  useEffect(() => {
    const handleAppResume = () => {
      setIsVisible(true);
      setTimeout(() => setIsVisible(prev => prev), 50);
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

  return (
    <>
      {/* Spacer for fixed header - matches TopBar height including safe area */}
      <div 
        className="lg:hidden flex-shrink-0" 
        style={{ 
          height: 'calc(64px + env(safe-area-inset-top, 24px))'
        }} 
      />

      {/* Material 3 Top App Bar - Matches Login Page Style */}
      <header
        className={`
          fixed left-0 right-0 z-50 lg:hidden
          transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)
          ${isVisible ? "translate-y-0" : "-translate-y-full"}
        `}
        style={{
          top: 0,
          willChange: 'transform',
        }}
      >
        {/* Status Bar Spacer - Creates boundary from Android status bar */}
        <div 
          className="w-full"
          style={{
            height: 'env(safe-area-inset-top, 24px)',
            minHeight: '24px',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 50%, transparent 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        />

        {/* App Bar Container - Purple gradient to match login page */}
        <div
          className="relative w-full"
          style={{ 
            height: '64px',
            background: 'linear-gradient(180deg, rgba(102, 126, 234, 0.98) 0%, rgba(118, 75, 162, 0.95) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          }}
        >
          {/* Content Container */}
          <div className="flex items-center h-full px-2">
            {/* Leading: Menu/Back Button */}
            <button
              className="relative w-12 h-12 rounded-full flex items-center justify-center text-white/90 overflow-hidden flex-shrink-0 transition-all duration-200 hover:bg-white/10 active:scale-95"
              onClick={handleBack}
              onTouchStart={triggerRipple}
              onMouseDown={triggerRipple}
              aria-label="Open menu"
            >
              {/* Ripple */}
              {showRipple && (
                <span className="absolute inset-0 rounded-full bg-white/30 animate-md3Ripple" />
              )}
              
              {/* Menu icon */}
              <svg
                className="w-6 h-6 relative z-10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Center: App Icon + Title */}
            <div className="flex items-center gap-3 flex-1 min-w-0 ml-1">
              {/* WhatsApp Icon */}
              <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-md">
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </div>

              {/* Title */}
              <div className="flex flex-col min-w-0">
                <span className="text-white font-bold text-base leading-tight truncate">
                  {title}
                </span>
                {subtitle && (
                  <span className="text-white/70 text-xs truncate">
                    {subtitle}
                  </span>
                )}
              </div>
            </div>

            {/* Trailing: Empty spacer for symmetry */}
            <div className="w-12 flex-shrink-0" />
          </div>
        </div>
      </header>
    </>
  );
}