"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import "./bottomnav-styles.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  isAdmin?: boolean;
  onQuickAction?: (actionId: string) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const QUICK_ACTION_ITEMS = [
  { id: "new-order", label: "New Order", icon: "fa-shopping-cart" },
  { id: "new-booking", label: "New Booking", icon: "fa-calendar-plus" },
  { id: "add-product", label: "Add Product", icon: "fa-plus-square" },
  { id: "add-customer", label: "Add Customer", icon: "fa-user-plus" },
];

const NAVIGATE_ITEMS = [
  { id: "products", label: "Products", icon: "fa-box", href: "/products" },
  { id: "services", label: "My Services", icon: "fa-concierge-bell", href: "/services" },
  { id: "settings", label: "Settings", icon: "fa-cog", href: "/settings" },
  { id: "paystack", label: "Paystack", icon: "fa-credit-card", href: "/settings/paystack" },
];

// ─── MenuSheet Component ───────────────────────────────────────────────────────

export default function MenuSheet({ isOpen, onClose, onLogout, isAdmin, onQuickAction }: MenuSheetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // ── Close handler (defined first since effects reference it) ────────────

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  }, [onClose]);

  // ── Touch-to-dismiss handlers ───────────────────────────────────────────

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

  // ── Open/Close animation logic ───────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      setIsClosing(false);
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Restore focus to the element that opened the sheet
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
          previousActiveElement.current = null;
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // ── Keyboard: Escape to close ────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // ── Focus trap ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen || !isVisible || isClosing) return;

    const sheet = sheetRef.current;
    if (!sheet) return;

    const focusableSelector =
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements = sheet.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusableElements.length === 0) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleTabKey);

    // Focus the first focusable element
    const firstFocusable = sheet.querySelector<HTMLElement>(focusableSelector);
    if (firstFocusable) {
      setTimeout(() => firstFocusable.focus(), 100);
    }

    return () => document.removeEventListener("keydown", handleTabKey);
  }, [isOpen, isVisible, isClosing]);

  if (!isOpen && !isVisible) return null;

  return (
    <>
      {/* Premium Backdrop */}
      <div
        role="presentation"
        className={`
          fixed inset-0 z-40 lg:hidden
          transition-all duration-300
          ${isVisible && !isClosing ? "opacity-100" : "opacity-0"}
        `}
        style={{
          background: isVisible && !isClosing
            ? 'rgba(0, 0, 0, 0.5)'
            : 'rgba(0, 0, 0, 0)',
          
          WebkitBackdropFilter: isVisible && !isClosing ? 'blur(8px)' : 'blur(0px)',
        }}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Premium Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Quick actions menu"
        className={`
          fixed bottom-0 left-0 right-0 z-50 lg:hidden
          bg-white
          shadow-[0_-8px_32px_rgba(0,0,0,0.15)]
          transition-all duration-300
          ${isVisible && !isClosing ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}
        `}
        style={{
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          borderTopLeftRadius: '28px',
          borderTopRightRadius: '28px',
          backgroundColor: '#ffffff',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Premium Gradient Header */}
        <div className="relative px-6 py-4 overflow-hidden">
          {/* Background gradient decoration */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.06) 0%, rgba(7, 94, 84, 0.04) 100%)',
            }}
            aria-hidden="true"
          />
          <div className="flex items-center justify-between relative">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-md shadow-emerald-200/50">
                <i className="fas fa-plus text-white text-sm" aria-hidden="true" />
              </div>
              <span>Quick Actions</span>
            </h3>
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-full hover:bg-gray-100 active:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all active:scale-90"
              aria-label="Close menu"
            >
              <i className="fas fa-times text-sm" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Premium Sections */}
        <div className="px-4 pb-6 max-h-[70vh] overflow-y-auto hide-scrollbar">
          {/* Create New Section (Quick Actions) */}
          <div className="mt-1">
            <div className="px-2 mb-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.08em]">
                Create New
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {QUICK_ACTION_ITEMS.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => { 
                    handleClose();
                    setTimeout(() => onQuickAction?.(item.id), 300);
                  }}
                  className={`
                    flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl
                    hover:bg-gray-50 active:bg-gray-100 active:scale-95
                    transition-all duration-150
                    animate-menuItem
                  `}
                  style={{ animationDelay: `${idx * 40}ms` }}
                  aria-label={`Open ${item.label} modal`}
                >
                  <div className={`
                    w-14 h-14 rounded-2xl flex items-center justify-center
                    bg-gradient-to-br from-gray-50 to-gray-100
                    text-emerald-600 text-lg
                    shadow-sm border border-gray-100
                    transition-all duration-200
                  `}>
                    <i className={`fas ${item.icon}`} aria-hidden="true" />
                  </div>
                  <span className="text-[10px] font-semibold text-gray-700 text-center leading-tight">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Navigate Section */}
          <div className="mt-5">
            <div className="px-2 mb-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.08em]">
                Navigate
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {NAVIGATE_ITEMS.map((item, idx) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => { handleClose(); }}
                  className={`
                    flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl
                    hover:bg-gray-50 active:bg-gray-100 active:scale-95
                    transition-all duration-150
                    animate-menuItem
                  `}
                  style={{ animationDelay: `${80 + idx * 40}ms` }}
                  aria-label={`Navigate to ${item.label}`}
                >
                  <div className={`
                    w-14 h-14 rounded-2xl flex items-center justify-center
                    bg-gradient-to-br from-gray-50 to-gray-100
                    text-emerald-600 text-lg
                    shadow-sm border border-gray-100
                    transition-all duration-200
                  `}>
                    <i className={`fas ${item.icon}`} aria-hidden="true" />
                  </div>
                  <span className="text-[10px] font-semibold text-gray-700 text-center leading-tight">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Admin Section */}
          {isAdmin && (
            <div className="mt-5">
              <div className="px-2 mb-3">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.08em]">
                  <i className="fas fa-shield-alt mr-1 text-[9px]" aria-hidden="true"></i> Admin
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                <Link
                  href="/all-tenants"
                  onClick={() => { onClose(); }}
                  className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl hover:bg-emerald-50 active:bg-emerald-100 active:scale-95 transition-all duration-150"
                  aria-label="Go to All Tenants"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 text-lg shadow-sm border border-emerald-100">
                    <i className="fas fa-building" aria-hidden="true" />
                  </div>
                  <span className="text-[10px] font-semibold text-gray-700 text-center leading-tight">
                    All Tenants
                  </span>
                </Link>
              </div>
            </div>
          )}

          {/* Logout Section */}
          <div className="mt-5 pt-5 border-t border-gray-100">
            <div className="px-2 mb-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.08em]">
                Account
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              <button
                onClick={() => {
                  onClose();
                  setTimeout(() => onLogout(), 100);
                }}
                className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl hover:bg-red-50 active:bg-red-100 active:scale-95 transition-all duration-150"
                aria-label="Log out of your account"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 text-red-500 text-lg shadow-sm border border-red-100">
                  <i className="fas fa-sign-out-alt" aria-hidden="true" />
                </div>
                <span className="text-[10px] font-semibold text-red-600 text-center leading-tight">
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
