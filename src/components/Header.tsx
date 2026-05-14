"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface HeaderProps {
  onMenuClick?: () => void;
  scrolled?: boolean;
}

export default function Header({ onMenuClick, scrolled = false }: HeaderProps) {
  // Material Design 3: Green top app bar by default, white when scrolled
  const isGreen = !scrolled;
  
  return (
    <header 
      className={`
        sticky top-0 z-40 transition-all duration-300
        ${isGreen 
          ? 'bg-[#25D366] border-b border-[#128C7E]/20' 
          : 'bg-white border-b border-[#e2e8f0]'
        }
        px-3 md:px-6 py-2 md:py-3 flex items-center justify-between
        shadow-sm
      `}
    >
      {/* Left Section */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile Menu Button */}
        <button 
          className={`md:hidden w-10 h-10 flex items-center justify-center rounded-xl transition-colors active:scale-95 ${
            isGreen ? 'text-white hover:bg-white/10' : 'text-[#1e293b] hover:bg-gray-100'
          }`}
          onClick={onMenuClick}
        >
          <i className="fas fa-bars text-lg"></i>
        </button>
        
        {/* Desktop Search */}
        <div className="relative hidden md:block">
          <i className={`fas fa-search absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
            isGreen ? 'text-white/70' : 'text-[#64748b]'
          }`}></i>
          <input
            type="text"
            placeholder="Search orders, products, customers..."
            className={`w-[250px] lg:w-[400px] pl-10 pr-4 py-2.5 md:py-3 border-2 rounded-xl text-sm focus:outline-none transition-all ${
              isGreen 
                ? 'bg-white/10 border-white/20 text-white placeholder-white/60 focus:border-white/40 focus:bg-white/15' 
                : 'bg-white border-transparent focus:border-[#25D366] focus:bg-white'
            }`}
          />
        </div>
        
        {/* Mobile Search Button */}
        <button className={`md:hidden w-10 h-10 flex items-center justify-center rounded-xl transition-colors active:scale-95 ${
          isGreen ? 'text-white hover:bg-white/10' : 'bg-white text-[#64748b]'
        }`}>
          <i className="fas fa-search"></i>
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Notifications */}
        <button className={`relative w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-colors active:scale-95 ${
          isGreen ? 'text-white hover:bg-white/10' : 'text-[#64748b] hover:text-[#25D366] hover:bg-[#f1f5f9]'
        }`}>
          <i className="fas fa-bell"></i>
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[#ef4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
            3
          </span>
        </button>
        
        {/* Mobile FAB */}
        <button className={`md:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-95 shadow-sm ${
          isGreen 
            ? 'bg-white text-[#25D366] hover:bg-white/90' 
            : 'bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white shadow-lg shadow-[#25D366]/30'
        }`}>
          <i className="fas fa-plus text-sm"></i>
        </button>
        
        {/* Desktop + Button */}
        <button className="hidden md:flex w-10 h-10 items-center justify-center text-[#64748b] hover:text-[#25D366] rounded-full hover:bg-[#f1f5f9] transition-all active:scale-95">
          <i className="fas fa-plus"></i>
        </button>
      </div>
    </header>
  );
}
