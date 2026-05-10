"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    // Scroll handler for navbar effects
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Intersection Observer for fade-in animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    document.querySelectorAll(".fade-up").forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Smooth scroll for nav links
    const handleNavClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href^="#"]') as HTMLAnchorElement;
      
      if (link) {
        e.preventDefault();
        const href = link.getAttribute("href");
        if (href) {
          const element = document.querySelector(href);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
            setMobileMenuOpen(false);
          }
        }
      }
    };

    document.addEventListener("click", handleNavClick);
    return () => document.removeEventListener("click", handleNavClick);
  }, []);

  return (
    <>
      <style jsx global>{`
        /* ═══════════════════════════════════════════
           DESIGN TOKENS
        ════════════════════════════════════════════ */
        :root {
          --obsidian: #0A0B0F;
          --deep: #0F1117;
          --surface: #151820;
          --elevated: #1C2030;
          --border: rgba(255,255,255,0.07);
          --border-light: rgba(255,255,255,0.12);
          --green: #25D366;
          --green-glow: rgba(37,211,102,0.15);
          --green-mid: #1DB954;
          --purple: #8B5CF6;
          --purple-glow: rgba(139,92,246,0.15);
          --gold: #C9A84C;
          --gold-light: #E8C97A;
          --gold-glow: rgba(201,168,76,0.12);
          --white: #FFFFFF;
          --text: rgba(255,255,255,0.88);
          --muted: rgba(255,255,255,0.5);
          --faint: rgba(255,255,255,0.25);
          --font-display: 'Fraunces', Georgia, serif;
          --font-body: 'DM Sans', system-ui, sans-serif;
          --r-sm: 8px;
          --r-md: 14px;
          --r-lg: 20px;
          --r-xl: 28px;
          --r-full: 9999px;
          --shadow-green: 0 0 60px rgba(37,211,102,0.18), 0 0 120px rgba(37,211,102,0.07);
          --shadow-purple: 0 0 60px rgba(139,92,246,0.18), 0 0 120px rgba(139,92,246,0.07);
          --shadow-gold: 0 0 40px rgba(201,168,76,0.15);
        }

        /* ═══════════════════════════════════════════
           RESET & BASE
        ════════════════════════════════════════════ */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; font-size: 16px; }
        body {
          background: var(--obsidian);
          color: var(--text);
          font-family: var(--font-body);
          line-height: 1.6;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }
        img { max-width: 100%; display: block; }
        a { color: inherit; text-decoration: none; }
        button { cursor: pointer; border: none; background: none; font-family: inherit; }
        ul { list-style: none; }

        /* ═══════════════════════════════════════════
           TYPOGRAPHY
        ════════════════════════════════════════════ */
        .display-xl {
          font-family: var(--font-display);
          font-size: clamp(3.2rem, 7vw, 7.5rem);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.02em;
        }
        .display-lg {
          font-family: var(--font-display);
          font-size: clamp(2.4rem, 5vw, 5rem);
          font-weight: 700;
          line-height: 1.0;
          letter-spacing: -0.02em;
        }
        .display-md {
          font-family: var(--font-display);
          font-size: clamp(1.8rem, 3vw, 3rem);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.01em;
        }
        .italic { font-style: italic; }
        .text-green { color: var(--green); }
        .text-purple { color: var(--purple); }
        .text-gold { color: var(--gold-light); }
        .text-muted { color: var(--muted); }
        .overline {
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .label-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-full);
          font-size: 0.78rem;
          font-weight: 500;
          color: var(--text);
        }
        .body-text {
          font-size: 1.05rem;
          line-height: 1.7;
          color: var(--muted);
        }
        .body-lg {
          font-size: 1.2rem;
          line-height: 1.7;
          color: var(--muted);
        }

        /* ═══════════════════════════════════════════
           LAYOUT
        ════════════════════════════════════════════ */
        .container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .section {
          padding: 100px 0;
          position: relative;
        }
        .section-tight { padding: 60px 0; }
        .grid-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 40px;
          align-items: center;
        }
        .grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .grid-4 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .flex-center {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .flex-between {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .text-center { text-align: center; }

        /* ═══════════════════════════════════════════
           BUTTONS
        ════════════════════════════════════════════ */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 28px;
          border-radius: var(--r-full);
          font-size: 0.95rem;
          font-weight: 600;
          transition: all 0.3s ease;
          white-space: nowrap;
        }
        .btn-primary {
          background: linear-gradient(135deg, var(--green) 0%, var(--green-mid) 100%);
          color: var(--white);
          box-shadow: 0 4px 20px rgba(37,211,102,0.3);
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(37,211,102,0.4);
        }
        .btn-secondary {
          background: var(--surface);
          color: var(--text);
          border: 1px solid var(--border-light);
        }
        .btn-secondary:hover {
          background: var(--elevated);
          border-color: var(--green);
        }
        .btn-ghost {
          color: var(--muted);
          padding: 10px 20px;
        }
        .btn-ghost:hover { color: var(--white); }

        /* ═══════════════════════════════════════════
           CARDS
        ════════════════════════════════════════════ */
        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-lg);
          padding: 32px;
          transition: all 0.3s ease;
        }
        .card:hover {
          border-color: var(--border-light);
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        .card-icon {
          width: 56px;
          height: 56px;
          border-radius: var(--r-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          margin-bottom: 20px;
        }
        .card-title {
          font-family: var(--font-display);
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 12px;
          color: var(--white);
        }
        .card-desc {
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--muted);
        }

        /* ═══════════════════════════════════════════
           ANIMATIONS
        ════════════════════════════════════════════ */
        .fade-up {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .fade-up.visible {
          opacity: 1;
          transform: translateY(0);
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }

        /* ═══════════════════════════════════════════
           NAVBAR
        ════════════════════════════════════════════ */
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          padding: 16px 0;
          transition: all 0.3s ease;
        }
        .navbar.scrolled {
          background: rgba(10,11,15,0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
        }
        .navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .nav-logo-icon {
          width: 38px;
          height: 38px;
          background: linear-gradient(135deg, var(--green) 0%, #1a9e50 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          box-shadow: 0 4px 16px rgba(37,211,102,0.3);
        }
        .nav-logo-text {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 700;
          line-height: 1;
        }
        .nav-logo-sub {
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          color: var(--muted);
          text-transform: uppercase;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .nav-links a {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--muted);
          transition: color 0.2s;
        }
        .nav-links a:hover { color: var(--white); }
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          padding: 8px;
          cursor: pointer;
        }
        .hamburger span {
          display: block;
          width: 22px;
          height: 2px;
          background: var(--text);
          border-radius: 2px;
          transition: all 0.3s ease;
        }
        .mobile-menu {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(10,11,15,0.98);
          backdrop-filter: blur(20px);
          z-index: 999;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 32px;
        }
        .mobile-menu.open { display: flex; }
        .mobile-menu a {
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 700;
          color: var(--text);
          transition: color 0.2s;
        }
        .mobile-menu a:hover { color: var(--green); }
        .mobile-close {
          position: absolute;
          top: 24px;
          right: 24px;
          font-size: 1.5rem;
          color: var(--muted);
          cursor: pointer;
          padding: 8px;
        }

        /* ═══════════════════════════════════════════
           HERO
        ════════════════════════════════════════════ */
        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding-top: 80px;
          overflow: hidden;
        }
        .hero-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }
        .hero-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
        }
        .hero-orb-1 {
          width: 600px;
          height: 600px;
          background: var(--green);
          top: -200px;
          right: -100px;
          animation: float 8s ease-in-out infinite;
        }
        .hero-orb-2 {
          width: 400px;
          height: 400px;
          background: var(--purple);
          bottom: -100px;
          left: -100px;
          animation: float 10s ease-in-out infinite reverse;
        }
        .hero-content {
          position: relative;
          z-index: 1;
          max-width: 800px;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-full);
          font-size: 0.85rem;
          color: var(--muted);
          margin-bottom: 32px;
        }
        .hero-title {
          margin-bottom: 24px;
        }
        .hero-subtitle {
          font-size: 1.25rem;
          line-height: 1.7;
          color: var(--muted);
          margin-bottom: 40px;
          max-width: 600px;
        }
        .hero-actions {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .hero-visual {
          position: relative;
          z-index: 1;
        }

        /* ═══════════════════════════════════════════
           FEATURES
        ════════════════════════════════════════════ */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-top: 60px;
        }
        .feature-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-lg);
          padding: 32px;
          transition: all 0.3s ease;
        }
        .feature-card:hover {
          border-color: var(--green);
          transform: translateY(-4px);
          box-shadow: var(--shadow-green);
        }
        .feature-icon {
          width: 56px;
          height: 56px;
          background: var(--green-glow);
          border-radius: var(--r-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          margin-bottom: 20px;
        }
        .feature-title {
          font-family: var(--font-display);
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 12px;
          color: var(--white);
        }
        .feature-desc {
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--muted);
        }

        /* ═══════════════════════════════════════════
           STATS
        ════════════════════════════════════════════ */
        .stats-section {
          background: var(--surface);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 40px;
          text-align: center;
        }
        .stat-number {
          font-family: var(--font-display);
          font-size: 3rem;
          font-weight: 900;
          color: var(--green);
          margin-bottom: 8px;
        }
        .stat-label {
          font-size: 0.95rem;
          color: var(--muted);
        }

        /* ═══════════════════════════════════════════
           PRICING
        ════════════════════════════════════════════ */
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-top: 60px;
        }
        .pricing-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-xl);
          padding: 40px;
          position: relative;
          transition: all 0.3s ease;
        }
        .pricing-card.featured {
          border-color: var(--green);
          box-shadow: var(--shadow-green);
        }
        .pricing-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--green);
          color: var(--white);
          padding: 6px 16px;
          border-radius: var(--r-full);
          font-size: 0.8rem;
          font-weight: 600;
        }
        .pricing-name {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 8px;
          color: var(--white);
        }
        .pricing-price {
          font-size: 3rem;
          font-weight: 900;
          color: var(--white);
          margin-bottom: 8px;
        }
        .pricing-period {
          font-size: 0.9rem;
          color: var(--muted);
          margin-bottom: 32px;
        }
        .pricing-features {
          list-style: none;
          margin-bottom: 32px;
        }
        .pricing-features li {
          padding: 8px 0;
          font-size: 0.95rem;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .pricing-features li::before {
          content: "✓";
          color: var(--green);
          font-weight: bold;
        }

        /* ═══════════════════════════════════════════
           CTA
        ════════════════════════════════════════════ */
        .cta-section {
          background: linear-gradient(135deg, var(--green-glow) 0%, var(--purple-glow) 100%);
          border-radius: var(--r-xl);
          padding: 80px 40px;
          text-align: center;
          margin: 0 24px;
        }
        .cta-title {
          font-family: var(--font-display);
          font-size: clamp(2rem, 4vw, 3.5rem);
          font-weight: 900;
          margin-bottom: 16px;
          color: var(--white);
        }
        .cta-subtitle {
          font-size: 1.1rem;
          color: var(--muted);
          margin-bottom: 32px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        /* ═══════════════════════════════════════════
           FOOTER
        ════════════════════════════════════════════ */
        .footer {
          background: var(--deep);
          border-top: 1px solid var(--border);
          padding: 60px 0 30px;
        }
        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }
        .footer-brand {
          max-width: 300px;
        }
        .footer-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        .footer-desc {
          font-size: 0.9rem;
          color: var(--muted);
          line-height: 1.6;
        }
        .footer-heading {
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 700;
          color: var(--white);
          margin-bottom: 16px;
        }
        .footer-links {
          list-style: none;
        }
        .footer-links li {
          margin-bottom: 8px;
        }
        .footer-links a {
          font-size: 0.9rem;
          color: var(--muted);
          transition: color 0.2s;
        }
        .footer-links a:hover { color: var(--green); }
        .footer-bottom {
          border-top: 1px solid var(--border);
          padding-top: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          color: var(--muted);
        }

        /* ═══════════════════════════════════════════
           RESPONSIVE
        ════════════════════════════════════════════ */
        @media (max-width: 1024px) {
          .grid-2, .grid-3, .grid-4 {
            grid-template-columns: 1fr;
          }
          .footer-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 768px) {
          .section { padding: 60px 0; }
          .nav-links { display: none; }
          .nav-actions .btn-ghost { display: none; }
          .hamburger { display: flex; }
          .hero { padding-top: 100px; }
          .hero-actions { flex-direction: column; }
          .hero-actions .btn { width: 100%; }
          .footer-grid { grid-template-columns: 1fr; }
          .footer-bottom { flex-direction: column; gap: 16px; text-align: center; }
        }
      `}</style>

      {/* Navigation */}
      <nav className={`navbar ${scrollY > 50 ? "scrolled" : ""}`}>
        <div className="container">
          <div className="navbar-inner">
            <div className="nav-logo">
              <div className="nav-logo-icon">💬</div>
              <div>
                <div className="nav-logo-text">WhatsApp Chap Chap</div>
                <div className="nav-logo-sub">AI Commerce</div>
              </div>
            </div>

            <div className="nav-links">
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#pricing">Pricing</a>
              <a href="#testimonials">Testimonials</a>
            </div>

            <div className="nav-actions">
              <Link href="/register" className="btn btn-ghost">
                Sign In
              </Link>
              <Link href="/register" className="btn btn-primary">
                Get Started Free
              </Link>
              <button
                className="hamburger"
                onClick={() => setMobileMenuOpen(true)}
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
        <button
          className="mobile-close"
          onClick={() => setMobileMenuOpen(false)}
        >
          ✕
        </button>
        <a href="#features" onClick={() => setMobileMenuOpen(false)}>
          Features
        </a>
        <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>
          How It Works
        </a>
        <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>
          Pricing
        </a>
        <a href="#testimonials" onClick={() => setMobileMenuOpen(false)}>
          Testimonials
        </a>
        <Link href="/register" className="btn btn-primary">
          Get Started
        </Link>
      </div>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1"></div>
          <div className="hero-orb hero-orb-2"></div>
        </div>
        <div className="container">
          <div className="grid-2">
            <div className="hero-content fade-up">
              <div className="hero-badge">
                <span>🚀</span>
                <span>Now Available Across Africa</span>
              </div>
              <h1 className="display-xl hero-title">
                Turn WhatsApp Into Your{" "}
                <span className="text-green italic">Business HQ</span>
              </h1>
              <p className="hero-subtitle">
                The AI-powered platform that transforms your WhatsApp into a
                full-stack commerce engine. Manage orders, customers, inventory,
                and payments—all through the app your customers already use.
              </p>
              <div className="hero-actions">
                <Link href="/register" className="btn btn-primary">
                  Start Free Trial
                  <span>→</span>
                </Link>
                <a href="#how-it-works" className="btn btn-secondary">
                  See How It Works
                </a>
              </div>
            </div>
            <div className="hero-visual fade-up">
              {/* Placeholder for hero image/illustration */}
              <div
                style={{
                  width: "100%",
                  height: "500px",
                  background: "var(--surface)",
                  borderRadius: "var(--r-xl)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "4rem",
                }}
              >
                📱
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section stats-section">
        <div className="container">
          <div className="stats-grid fade-up">
            <div>
              <div className="stat-number">10K+</div>
              <div className="stat-label">Active Businesses</div>
            </div>
            <div>
              <div className="stat-number">2M+</div>
              <div className="stat-label">Orders Processed</div>
            </div>
            <div>
              <div className="stat-number">98%</div>
              <div className="stat-label">Customer Satisfaction</div>
            </div>
            <div>
              <div className="stat-number">15+</div>
              <div className="stat-label">African Countries</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section">
        <div className="container">
          <div className="text-center fade-up">
            <div className="overline">Powerful Features</div>
            <h2 className="display-lg" style={{ marginTop: "16px" }}>
              Everything You Need to{" "}
              <span className="text-green italic">Scale on WhatsApp</span>
            </h2>
            <p className="body-lg" style={{ marginTop: "16px" }}>
              From order management to AI-powered customer service, we've got
              you covered.
            </p>
          </div>

          <div className="features-grid">
            {[
              {
                icon: "🤖",
                title: "AI Order Processing",
                desc: "Automatically capture and process orders from WhatsApp messages using advanced AI.",
              },
              {
                icon: "📦",
                title: "Inventory Management",
                desc: "Track stock levels, manage products, and get low-stock alerts in real-time.",
              },
              {
                icon: "💳",
                title: "Payment Integration",
                desc: "Accept mobile money, cards, and bank transfers seamlessly within WhatsApp.",
              },
              {
                icon: "📊",
                title: "Analytics Dashboard",
                desc: "Get deep insights into sales, customer behavior, and business performance.",
              },
              {
                icon: "🎯",
                title: "Customer Segmentation",
                desc: "Organize customers, track preferences, and send targeted campaigns.",
              },
              {
                icon: "⚡",
                title: "Instant Notifications",
                desc: "Real-time alerts for new orders, payments, and important updates.",
              },
            ].map((feature, idx) => (
              <div key={idx} className="feature-card fade-up">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="section" style={{ background: "var(--surface)" }}>
        <div className="container">
          <div className="text-center fade-up">
            <div className="overline">Simple Setup</div>
            <h2 className="display-lg" style={{ marginTop: "16px" }}>
              Get Started in{" "}
              <span className="text-purple italic">3 Easy Steps</span>
            </h2>
          </div>

          <div className="grid-3" style={{ marginTop: "60px" }}>
            {[
              {
                step: "01",
                title: "Connect WhatsApp",
                desc: "Link your WhatsApp Business account in seconds with our simple setup wizard.",
              },
              {
                step: "02",
                title: "Add Products",
                desc: "Upload your catalog or import from existing systems. AI helps categorize everything.",
              },
              {
                step: "03",
                title: "Start Selling",
                desc: "Customers message you on WhatsApp, AI processes orders, and you get paid.",
              },
            ].map((item, idx) => (
              <div key={idx} className="card fade-up">
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "4rem",
                    fontWeight: 900,
                    color: "var(--green)",
                    opacity: 0.3,
                    marginBottom: "16px",
                  }}
                >
                  {item.step}
                </div>
                <h3 className="card-title">{item.title}</h3>
                <p className="card-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="section">
        <div className="container">
          <div className="text-center fade-up">
            <div className="overline">Transparent Pricing</div>
            <h2 className="display-lg" style={{ marginTop: "16px" }}>
              Choose Your{" "}
              <span className="text-gold italic">Growth Plan</span>
            </h2>
            <p className="body-lg" style={{ marginTop: "16px" }}>
              Start free, upgrade when you're ready. No hidden fees.
            </p>
          </div>

          <div className="pricing-grid">
            {[
              {
                name: "Starter",
                price: "Free",
                period: "Forever",
                features: [
                  "Up to 100 orders/month",
                  "Basic analytics",
                  "WhatsApp integration",
                  "Email support",
                ],
                featured: false,
              },
              {
                name: "Professional",
                price: "$29",
                period: "/month",
                features: [
                  "Unlimited orders",
                  "Advanced analytics",
                  "AI order processing",
                  "Payment integration",
                  "Priority support",
                  "Custom branding",
                ],
                featured: true,
              },
              {
                name: "Enterprise",
                price: "$99",
                period: "/month",
                features: [
                  "Everything in Pro",
                  "Multiple locations",
                  "API access",
                  "Dedicated account manager",
                  "Custom integrations",
                  "SLA guarantee",
                ],
                featured: false,
              },
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`pricing-card fade-up ${
                  plan.featured ? "featured" : ""
                }`}
              >
                {plan.featured && (
                  <div className="pricing-badge">Most Popular</div>
                )}
                <h3 className="pricing-name">{plan.name}</h3>
                <div className="pricing-price">
                  {plan.price}
                  <span
                    style={{ fontSize: "1rem", color: "var(--muted)" }}
                  >
                    {plan.period}
                  </span>
                </div>
                <ul className="pricing-features">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx}>{feature}</li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`btn ${
                    plan.featured ? "btn-primary" : "btn-secondary"
                  }`}
                  style={{ width: "100%" }}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section">
        <div className="container">
          <div className="cta-section fade-up">
            <h2 className="cta-title">
              Ready to Transform Your Business?
            </h2>
            <p className="cta-subtitle">
              Join thousands of African businesses already selling smarter with
              WhatsApp Chap Chap.
            </p>
            <div
              style={{
                display: "flex",
                gap: "16px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link href="/register" className="btn btn-primary">
                Start Free Trial
              </Link>
              <a href="#features" className="btn btn-secondary">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="nav-logo-icon">💬</div>
                <div className="nav-logo-text">WhatsApp Chap Chap</div>
              </div>
              <p className="footer-desc">
                Empowering African businesses with AI-powered WhatsApp commerce
                solutions. Sell smarter, grow faster.
              </p>
            </div>

            <div>
              <h4 className="footer-heading">Product</h4>
              <ul className="footer-links">
                <li>
                  <a href="#features">Features</a>
                </li>
                <li>
                  <a href="#pricing">Pricing</a>
                </li>
                <li>
                  <a href="#">Integrations</a>
                </li>
                <li>
                  <a href="#">API Docs</a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="footer-heading">Company</h4>
              <ul className="footer-links">
                <li>
                  <a href="#">About Us</a>
                </li>
                <li>
                  <a href="#">Blog</a>
                </li>
                <li>
                  <a href="#">Careers</a>
                </li>
                <li>
                  <a href="#">Contact</a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="footer-heading">Legal</h4>
              <ul className="footer-links">
                <li>
                  <a href="#">Privacy Policy</a>
                </li>
                <li>
                  <a href="#">Terms of Service</a>
                </li>
                <li>
                  <a href="#">Cookie Policy</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <div>© 2026 WhatsApp Chap Chap. All rights reserved.</div>
            <div>Made with ❤️ for African businesses</div>
          </div>
        </div>
      </footer>
    </>
  );
}
