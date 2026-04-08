"use client";

import Link from "next/link";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#e2e8f0] px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-xl text-[#1e293b]" onClick={onMenuClick}>
          <i className="fas fa-bars"></i>
        </button>
        <div className="relative hidden md:block">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]"></i>
          <input
            type="text"
            placeholder="Search orders, products, customers..."
            className="w-[300px] lg:w-[400px] pl-10 pr-4 py-3 bg-[#f8fafc] border-2 border-transparent rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:bg-white transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="relative w-10 h-10 flex items-center justify-center text-[#64748b] hover:text-[#25D366] rounded-full hover:bg-[#f1f5f9] transition-all">
          <i className="fas fa-bell"></i>
          <span className="absolute top-1 right-1 w-4 h-4 bg-[#ef4444] text-white text-[0.6rem] font-bold rounded-full flex items-center justify-center">3</span>
        </button>
        <button className="w-10 h-10 flex items-center justify-center text-[#64748b] hover:text-[#25D366] rounded-full hover:bg-[#f1f5f9] transition-all">
          <i className="fas fa-envelope"></i>
        </button>
        <button className="w-10 h-10 flex items-center justify-center text-[#64748b] hover:text-[#25D366] rounded-full hover:bg-[#f1f5f9] transition-all">
          <i className="fas fa-plus"></i>
        </button>
      </div>
    </header>
  );
}
