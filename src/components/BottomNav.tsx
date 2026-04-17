"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: number;
}

interface BottomNavProps {
  onFABClick?: () => void;
}

export default function BottomNav({ onFABClick }: BottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const mainNavItems: NavItem[] = [
    { id: "home", label: "Home", icon: "fa-home", href: "/dashboard" },
    { id: "orders", label: "Orders", icon: "fa-shopping-bag", href: "/orders", badge: 23 },
    { id: "products", label: "Products", icon: "fa-box", href: "/products" },
  ];

  const moreNavItems: NavItem[] = [
    { id: "analytics", label: "Analytics", icon: "fa-chart-line", href: "/reports" },
    { id: "customers", label: "Customers", icon: "fa-users", href: "/customers" },
    { id: "reviews", label: "Reviews", icon: "fa-star", href: "/reviews" },
    { id: "ai", label: "AI Assistant", icon: "fa-robot", href: "/ai-assistant" },
    { id: "settings", label: "Settings", icon: "fa-cog", href: "/settings" },
    { id: "help", label: "Help", icon: "fa-question-circle", href: "/help" },
  ];

  const isActive = (href: string) => pathname === href;
  const isMoreActive = () => moreOpen || ["/reports", "/reviews", "/ai-assistant", "/settings", "/help"].includes(pathname);

  return (
    <>
      {/* Overlay */}
      {moreOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More Menu Sheet */}
      {moreOpen && (
        <div className="fixed bottom-[calc(80px+env(safe-area-inset-bottom,0)+10px)] left-4 right-4 max-w-[400px] mx-auto bg-white rounded-[24px] shadow-2xl z-50 md:hidden animate-slideUp">
          <div className="p-4 border-b border-[#e2e8f0]">
            <h3 className="font-bold flex items-center gap-2">
              <i className="fas fa-th-large text-[#25D366]"></i>
              More Options
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-2 p-4">
            {moreNavItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-[#f8fafc] transition-colors"
              >
                <div className="w-12 h-12 bg-[#f1f5f9] rounded-2xl flex items-center justify-center text-lg text-[#64748b]">
                  <i className={`fas ${item.icon}`}></i>
                </div>
                <span className="text-xs font-semibold text-[#64748b]">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-[#e2e8f0] z-40 md:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-20 max-w-[600px] mx-auto relative">
          {mainNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center h-full transition-all ${
                  active ? "text-[#25D366]" : "text-[#64748b]"
                }`}
              >
                {/* Active Indicator */}
                <div className={`w-14 h-8 bg-[#25D366]/10 rounded-2xl absolute top-3 transition-transform ${
                  active ? "scale-100 opacity-100" : "scale-0 opacity-0"
                }`} />
                
                <div className="relative">
                  <i className={`fas ${item.icon} text-xl`}></i>
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white text-[0.65rem] font-bold rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold mt-1">{item.label}</span>
              </Link>
            );
          })}

          {/* FAB Button */}
          <button
            onClick={onFABClick}
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-full flex items-center justify-center text-white text-xl shadow-lg shadow-[#25D366]/30 active:scale-90 transition-transform"
          >
            <i className="fas fa-plus"></i>
          </button>

          {/* Products (after FAB) */}
          <Link
            href="/products"
            className={`flex-1 flex flex-col items-center justify-center h-full transition-all ${
              isActive("/products") ? "text-[#25D366]" : "text-[#64748b]"
            }`}
          >
            <div className={`w-14 h-8 bg-[#25D366]/10 rounded-2xl absolute top-3 transition-transform ${
              isActive("/products") ? "scale-100 opacity-100" : "scale-0 opacity-0"
            }`} />
            <i className="fas fa-box text-xl relative"></i>
            <span className="text-[10px] font-semibold mt-1">Products</span>
          </Link>

          {/* More Button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex-1 flex flex-col items-center justify-center h-full transition-all ${
              isMoreActive() ? "text-[#25D366]" : "text-[#64748b]"
            }`}
          >
            <div className={`w-14 h-8 bg-[#25D366]/10 rounded-2xl absolute top-3 transition-transform ${
              isMoreActive() ? "scale-100 opacity-100" : "scale-0 opacity-0"
            }`} />
            <i className="fas fa-th-large text-xl"></i>
            <span className="text-[10px] font-semibold mt-1">More</span>
          </button>
        </div>
      </nav>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(100%); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </>
  );
}