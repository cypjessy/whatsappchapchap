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
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleFabClick = () => {
    setShowFabMenu(!showFabMenu);
  };

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-hidden">
      {/* Desktop Sidebar - Fixed position, always visible on desktop */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen z-50" style={{ width: sidebarExpanded ? "280px" : "80px" }}>
        <div 
          className="h-full transition-all duration-300"
          onMouseEnter={() => setSidebarExpanded(true)}
          onMouseLeave={() => setSidebarExpanded(false)}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} isExpanded={sidebarExpanded} />
        </div>
      </div>

      {/* Spacer to prevent content from going under fixed sidebar */}
      <div className="hidden lg:block flex-shrink-0" style={{ width: sidebarExpanded ? "280px" : "80px" }} />

      {/* Tablet/Mobile Drawer - Full sidebar when opened */}
      <aside className={`lg:hidden fixed inset-0 z-50 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300`}>
        <Sidebar onClose={() => setSidebarOpen(false)} isExpanded={true} />
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content - Full width on mobile */}
      <div className="flex-1 flex flex-col min-h-screen w-full max-w-full lg:pl-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 w-full p-3 md:p-6 bg-[#f8fafc] overflow-y-auto pb-24">
          {children}
        </main>
      </div>

      {/* Premium Mobile Bottom Navigation - Only on mobile (< 768px) */}
      {isMobile && <BottomNav onFABClick={handleFabClick} />}
    </div>
  );
}
