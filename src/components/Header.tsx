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
          ? 'bg-primary border-b border-primary/20' 
          : 'bg-white border-b border-outline-variant'
        }
        px-3 md:px-6 py-2 md:py-3 flex items-center justify-between
        shadow-level1
      `}
    >
      {/* Left Section */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile Menu Button */}
        <button 
          className={`md:hidden w-11 h-11 flex items-center justify-center rounded-xl transition-all active:scale-95 ${
            isGreen ? 'text-white hover:bg-white/10' : 'text-on-surface hover:bg-surface-dim'
          }`}
          onClick={onMenuClick}
        >
          <i className="fas fa-bars text-lg"></i>
        </button>
        
        {/* Desktop Search - MD3 Search Bar */}
        <div className={`relative hidden md:block md3-search-bar ${isGreen ? 'bg-white/10' : ''}`}
          style={!isGreen ? { background: 'var(--md-sys-color-surface-variant)' } : {}}>
          <i className={`fas fa-search md3-search-bar-icon transition-colors ${
            isGreen ? 'text-white/70' : ''
          }`}></i>
          <input
            type="text"
            placeholder="Search orders, products, customers..."
            className={`${isGreen ? 'text-white placeholder-white/60' : 'text-on-surface placeholder-on-surface-variant'}`}
          />
        </div>
        
        {/* Mobile Search Button */}
        <button className={`md:hidden w-11 h-11 flex items-center justify-center rounded-xl transition-all active:scale-95 ${
          isGreen ? 'text-white hover:bg-white/10' : 'text-on-surface-variant hover:bg-surface-dim'
        }`}>
          <i className="fas fa-search"></i>
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Notifications */}
        <button className={`relative w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-95 ${
          isGreen ? 'text-white hover:bg-white/10' : 'text-on-surface-variant hover:text-primary hover:bg-primary-container/50'
        }`}>
          <i className="fas fa-bell text-lg"></i>
          <span className="absolute top-0.5 right-0.5 min-w-[20px] h-[20px] px-1 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-level1 ring-2 ring-white">
            3
          </span>
        </button>
        
        {/* Mobile FAB */}
        <button className={`md:hidden w-11 h-11 flex items-center justify-center rounded-xl transition-all active:scale-95 shadow-level1 ${
          isGreen 
            ? 'bg-white text-primary hover:bg-white/90' 
            : 'bg-primary text-white shadow-level2'
        }`}>
          <i className="fas fa-plus"></i>
        </button>
        
        {/* Desktop + Button */}
        <button className="hidden md:flex w-11 h-11 items-center justify-center text-on-surface-variant hover:text-primary rounded-full hover:bg-primary-container/50 transition-all active:scale-95">
          <i className="fas fa-plus"></i>
        </button>
      </div>
    </header>
  );
}
