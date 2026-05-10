"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
}

interface ActionButton {
  icon: string;
  label: string;
  onClick?: () => void;
  badge?: number;
  href?: string;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function NotchCenter({
  title,
  subtitle,
  isScrolled,
}: {
  title?: string;
  subtitle?: string;
  isScrolled: boolean;
}) {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 -bottom-5 z-20">
      <div className={`
        relative flex flex-col items-center justify-center
        transition-all duration-500 ease-out
        ${isScrolled ? "scale-90 -translate-y-1" : "scale-100 translate-y-0"}
      `}>
        {/* The inward curve pill */}
        <div className={`
          relative px-6 py-2.5 rounded-full
          bg-gradient-to-b from-[#25D366] to-[#128C7E]
          shadow-lg shadow-[#25D366]/30
          border border-white/20
          backdrop-blur-xl
          min-w-[140px] text-center
          transition-all duration-300
          ${isScrolled ? "shadow-md" : "shadow-xl"}
        `}>
          {/* Gloss effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
          
          <h1 className="relative text-white font-extrabold text-sm tracking-tight truncate max-w-[160px]">
            {title || "ChapChap"}
          </h1>
          {subtitle && !isScrolled && (
            <p className="relative text-white/70 text-[10px] font-medium truncate max-w-[160px]">
              {subtitle}
            </p>
          )}
        </div>

        {/* Curved connectors */}
        <svg
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-20 h-4 text-[#25D366] opacity-30"
          viewBox="0 0 80 16"
          fill="none"
        >
          <path
            d="M0 16 Q20 0 40 0 Q60 0 80 16"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
}

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
      className={`
        relative w-10 h-10 rounded-full flex items-center justify-center
        transition-all duration-200
        ${isPressed ? "scale-85 bg-white/20" : "scale-100 bg-white/10"}
        ${isScrolled ? "bg-black/5" : "bg-white/10 hover:bg-white/20"}
      `}
      aria-label={action.label}
    >
      <i className={`fas ${action.icon} text-sm ${isScrolled ? "text-[#1e293b]" : "text-white"}`} />
      
      {action.badge && action.badge > 0 && (
        <span className={`
          absolute -top-0.5 -right-0.5
          min-w-[18px] h-[18px] px-1
          bg-[#ef4444] text-white text-[9px] font-extrabold
          rounded-full flex items-center justify-center
          border-2 border-[#25D366] animate-badgePop
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
}: TopBarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const pathname = usePathname();

  // Scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      
      // Background transition
      setIsScrolled(currentY > scrollThreshold);
      
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
  }, [scrollThreshold]);

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
      onClick: onSearchClick,
    },
    {
      icon: "fa-bell",
      label: "Notifications",
      onClick: onNotificationClick,
      badge: notificationCount,
    },
  ];

  return (
    <>
      {/* Spacer for fixed header */}
      <div className="h-[60px] lg:hidden" />

      {/* Main Top Bar */}
      <header
        className={`
          fixed top-0 left-0 right-0 z-50 lg:hidden
          transition-all duration-500 ease-out
          ${isVisible ? "translate-y-0" : "-translate-y-full"}
          pt-[env(safe-area-inset-top)]
        `}
      >
        {/* App Bar - Full height, no separate status bar */}
        <div
          className={`
            relative transition-all duration-500
            ${isScrolled 
              ? "bg-white/90 backdrop-blur-xl shadow-sm border-b border-[#e2e8f0]/50" 
              : "bg-[#25D366]"
            }
          `}
        >
          {/* Content */}
          <div className="flex items-center justify-between px-4 py-3">
            {/* Left Actions */}
            <div className="flex items-center gap-2 z-10">
              {leftActions.map((action) => (
                <ActionIcon key={action.label} action={action} isScrolled={isScrolled} />
              ))}
            </div>

            {/* Center Notch (visible when not scrolled) */}
            {!isScrolled && (
              <NotchCenter
                title={title}
                subtitle={subtitle}
                isScrolled={isScrolled}
              />
            )}

            {/* Scrolled Title (centered text) */}
            {isScrolled && (
              <div className="absolute left-1/2 -translate-x-1/2 text-center">
                <h1 className="font-bold text-[15px] text-[#1e293b] truncate max-w-[180px]">
                  {title || "ChapChap"}
                </h1>
              </div>
            )}

            {/* Right Actions */}
            <div className="flex items-center gap-2 z-10">
              {rightActions.map((action) => (
                <ActionIcon key={action.label} action={action} isScrolled={isScrolled} />
              ))}
            </div>
          </div>

          {/* Inward Curve SVG (concave) */}
          {!isScrolled && (
            <div className="absolute -bottom-[1px] left-0 right-0 h-6 overflow-hidden pointer-events-none">
              <svg
                viewBox="0 0 375 24"
                preserveAspectRatio="none"
                className="absolute bottom-0 w-full h-full"
              >
                <defs>
                  <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#25D366" />
                    <stop offset="100%" stopColor="#128C7E" />
                  </linearGradient>
                </defs>
                {/* Main concave curve */}
                <path
                  d="M0 0 L140 0 Q187.5 24 235 0 L375 0 L375 24 L0 24 Z"
                  fill="url(#curveGradient)"
                />
                {/* Shadow line */}
                <path
                  d="M0 23 L140 23 Q187.5 24 235 23 L375 23"
                  fill="none"
                  stroke="rgba(0,0,0,0.05)"
                  strokeWidth="1"
                />
              </svg>
            </div>
          )}
        </div>
      </header>
    </>
  );
}