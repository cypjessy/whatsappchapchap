"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface NavbarProps {
  scrolled: boolean;
  onNavigate: (path: string) => void;
  onScroll: (id: string) => void;
}

export default function Navbar({ scrolled, onNavigate, onScroll }: NavbarProps) {
  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <div className="nav-logo">
          <i className="fab fa-whatsapp"></i>
        </div>
        Chap<span>Chap</span>
      </div>
      <div className="nav-links">
        <div className="nav-link" onClick={() => onScroll('features')}>Features</div>
        <div className="nav-link" onClick={() => onScroll('how-it-works')}>How It Works</div>
        <div className="nav-link" onClick={() => onScroll('pricing')}>Pricing</div>
        <div className="nav-link" onClick={() => onScroll('testimonials')}>Testimonials</div>
        <button className="nav-cta" onClick={() => onNavigate('/login')}>
          Start Selling Free
          <i className="fas fa-arrow-right"></i>
        </button>
      </div>
    </nav>
  );
}
