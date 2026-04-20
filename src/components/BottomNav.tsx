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
  const [fabOpen, setFabOpen] = useState(false);

  const mainNavItems: NavItem[] = [
    { id: "home", label: "Home", icon: "fa-home", href: "/dashboard" },
    { id: "orders", label: "Orders", icon: "fa-shopping-bag", href: "/orders", badge: 23 },
    { id: "products", label: "Products", icon: "fa-box", href: "/products" },
    { id: "customers", label: "Customers", icon: "fa-users", href: "/customers" },
  ];

  const fabMenuItems: NavItem[] = [
    { id: "new-order", label: "New Order", icon: "fa-shopping-cart", href: "/orders?new=true" },
    { id: "add-product", label: "Add Product", icon: "fa-plus-square", href: "/products?new=true" },
    { id: "add-customer", label: "Add Customer", icon: "fa-user-plus", href: "/customers?new=true" },
    { id: "analytics", label: "Analytics", icon: "fa-chart-line", href: "/reports" },
    { id: "settings", label: "Settings", icon: "fa-cog", href: "/settings" },
    { id: "help", label: "Help", icon: "fa-question-circle", href: "/help" },
  ];

  const isActive = (href: string) => {
    if (href.includes("?")) {
      return pathname === href.split("?")[0];
    }
    return pathname === href;
  };

  const handleFabClick = () => {
    setFabOpen(!fabOpen);
  };

  const handleMenuItemClick = () => {
    setFabOpen(false);
  };

  return (
    <>
      {/* Overlay - Only on mobile */}
      {fabOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden md:hidden"
          onClick={() => setFabOpen(false)}
        />
      )}

      {/* FAB Menu - Bottom Sheet - Only on mobile */}
      {fabOpen && (
        <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[24px] shadow-2xl z-50 animate-slideUp pb-6 lg:hidden md:hidden">
          <div className="w-12 h-1.5 bg-[#e2e8f0] rounded-full mx-auto mt-3 mb-4"></div>
          <div className="px-4 pb-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <i className="fas fa-bolt text-[#25D366]"></i>
              Quick Actions
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-3 px-4">
            {fabMenuItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={handleMenuItemClick}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-[#f8fafc] transition-all active:scale-95"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10 rounded-2xl flex items-center justify-center text-xl text-[#25D366]">
                  <i className={`fas ${item.icon}`}></i>
                </div>
                <span className="text-xs font-semibold text-[#475569]">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Navigation - Only visible on mobile (< 768px) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e2e8f0] z-40 safe-area-bottom pb-2 lg:hidden md:hidden">
        <div className="flex items-center justify-around h-16 max-w-[500px] mx-auto">
          {/* Home */}
          <Link
            href="/dashboard"
            className={`flex-1 flex flex-col items-center justify-center h-full transition-all ${
              isActive("/dashboard") ? "text-[#25D366]" : "text-[#64748b]"
            }`}
          >
            <i className={`fas fa-home text-xl`}></i>
            <span className="text-[10px] font-semibold mt-1">Home</span>
          </Link>

          {/* Orders */}
          <Link
            href="/orders"
            className={`flex-1 flex flex-col items-center justify-center h-full transition-all relative ${
              isActive("/orders") ? "text-[#25D366]" : "text-[#64748b]"
            }`}
          >
            <i className={`fas fa-shopping-bag text-xl`}></i>
            <span className="text-[10px] font-semibold mt-1">Orders</span>
            {23 > 0 && (
              <span className="absolute top-1 right-3 min-w-[16px] h-[16px] bg-[#ef4444] text-white text-[0.6rem] font-bold rounded-full flex items-center justify-center">
                23
              </span>
            )}
          </Link>

          {/* FAB - Centered */}
          <button
            onClick={handleFabClick}
            className={`w-14 h-14 -mt-6 bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-full flex items-center justify-center text-white text-2xl shadow-lg shadow-[#25D366]/40 active:scale-90 transition-transform ${
              fabOpen ? "rotate-45" : ""
            }`}
          >
            <i className="fas fa-plus"></i>
          </button>

          {/* Products */}
          <Link
            href="/products"
            className={`flex-1 flex flex-col items-center justify-center h-full transition-all ${
              isActive("/products") ? "text-[#25D366]" : "text-[#64748b]"
            }`}
          >
            <i className={`fas fa-box text-xl`}></i>
            <span className="text-[10px] font-semibold mt-1">Products</span>
          </Link>

          {/* Customers */}
          <Link
            href="/customers"
            className={`flex-1 flex flex-col items-center justify-center h-full transition-all ${
              isActive("/customers") ? "text-[#25D366]" : "text-[#64748b]"
            }`}
          >
            <i className={`fas fa-users text-xl`}></i>
            <span className="text-[10px] font-semibold mt-1">Customers</span>
          </Link>
        </div>
      </nav>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </>
  );
}