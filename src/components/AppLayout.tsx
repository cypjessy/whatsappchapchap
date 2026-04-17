"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import BottomNav from "./BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleFabClick = () => {
    setShowFabMenu(!showFabMenu);
  };

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block sticky top-0 h-screen z-50">
        <div 
          className="h-full"
          onMouseEnter={() => setSidebarExpanded(true)}
          onMouseLeave={() => setSidebarExpanded(false)}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} isExpanded={sidebarExpanded} />
        </div>
      </aside>

      {/* Tablet Sidebar */}
      <aside className={`hidden md:block lg:hidden fixed left-0 top-0 h-screen z-50 transform transition-all duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-full bg-white shadow-xl">
          <Sidebar onClose={() => setSidebarOpen(false)} isExpanded={true} />
        </div>
      </aside>

      {/* Tablet Toggle */}
      <button
        className="hidden md:block lg:hidden fixed top-4 left-4 z-40 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-[#25D366]"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <i className={`fas ${sidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
      </button>

      {/* Mobile Drawer */}
      <aside className={`md:hidden fixed inset-0 z-50 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-3 md:p-6 bg-[#f8fafc] overflow-y-auto pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* Premium Mobile Bottom Navigation */}
      <BottomNav onFABClick={handleFabClick} />
    </div>
  );
}
