"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface NavbarProps {
  scrolled: boolean;
  onNavigate: (path: string) => void;
  onScroll: (id: string) => void;
}

export default function Navbar({ scrolled, onNavigate, onScroll }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when clicking a link
  const handleNavClick = (action: () => void) => {
    action();
    setMobileMenuOpen(false);
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <div className="nav-logo">
          <i className="fab fa-whatsapp"></i>
        </div>
        Chap<span>Chap</span>
      </div>
      
      {/* Mobile Menu Button */}
      <div 
        className="mobile-menu-btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        style={{ display: 'none' }}
      >
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
        <div className="nav-link" onClick={() => handleNavClick(() => onScroll('features'))}>Features</div>
        <div className="nav-link" onClick={() => handleNavClick(() => onScroll('how-it-works'))}>How It Works</div>
        <div className="nav-link" onClick={() => handleNavClick(() => onScroll('pricing'))}>Pricing</div>
        <div className="nav-link" onClick={() => handleNavClick(() => onScroll('testimonials'))}>Testimonials</div>
        <button className="nav-cta" onClick={() => handleNavClick(() => onNavigate('/login'))}>
          Start Selling Free
          <i className="fas fa-arrow-right"></i>
        </button>
        <div className="nav-link" onClick={() => handleNavClick(() => onNavigate('/admin/upgrade'))} style={{ color: '#64748b', fontSize: '12px', marginLeft: '8px' }}>
          Admin Tools
        </div>
      </div>
    </nav>
  );
}
