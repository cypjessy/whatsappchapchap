"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar, Hero, Features, HowItWorks, CTA, Footer } from "@/components/landing";

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);

  const phrases = [
    "Automate your sales with AI...",
    "Manage orders in real-time...",
    "Connect with customers instantly...",
    "Grow your business 10x faster..."
  ];

  // Navbar scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Typing animation
  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    const typeSpeed = isDeleting ? 50 : 100;

    const timer = setTimeout(() => {
      if (!isDeleting && typedText === currentPhrase) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && typedText === "") {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      } else {
        setTypedText(
          isDeleting
            ? currentPhrase.substring(0, typedText.length - 1)
            : currentPhrase.substring(0, typedText.length + 1)
        );
      }
    }, isDeleting && typedText === currentPhrase ? 500 : typedText === currentPhrase ? 2000 : typeSpeed);

    return () => clearTimeout(timer);
  }, [typedText, isDeleting, phraseIndex, phrases]);

  // Generate particles
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    animationDelay: Math.random() * 15,
    animationDuration: 10 + Math.random() * 10,
    size: 4 + Math.random() * 4
  }));

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#f8fafc", color: "#1e293b", overflowX: "hidden" }}>
      <style>{`
        :root {
          --primary: #25D366;
          --primary-dark: #128C7E;
          --primary-light: #DCF8C6;
          --accent: #00C853;
          --dark: #0f172a;
          --darker: #020617;
          --bg: #f8fafc;
          --card: #ffffff;
          --text-primary: #1e293b;
          --text-secondary: #64748b;
          --border: #e2e8f0;
          --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          --shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          --radius: 16px;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .navbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
          padding: 1rem 2rem; display: flex; justify-content: space-between;
          align-items: center; background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s;
        }
        .navbar.scrolled { background: rgba(255, 255, 255, 0.95); box-shadow: var(--shadow); }

        .nav-brand {
          display: flex; align-items: center; gap: 0.75rem;
          font-weight: 800; font-size: 1.5rem; color: var(--text-primary);
          text-decoration: none; cursor: pointer;
        }
        .nav-brand span { color: var(--primary); }
        .nav-logo {
          width: 40px; height: 40px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          border-radius: 10px; display: flex; align-items: center;
          justify-content: center; color: white; font-size: 1.25rem;
        }
        .nav-links { display: flex; gap: 2.5rem; align-items: center; }
        .nav-link {
          text-decoration: none; color: var(--text-secondary);
          font-weight: 600; font-size: 0.95rem; transition: color 0.2s;
          position: relative; cursor: pointer;
        }
        .nav-link:hover { color: var(--primary); }
        .nav-link::after {
          content: ''; position: absolute; bottom: -4px; left: 0;
          width: 0; height: 2px; background: var(--primary); transition: width 0.3s;
        }
        .nav-link:hover::after { width: 100%; }
        .nav-cta {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          color: white; border: none; border-radius: 50px; font-family: inherit;
          font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.3s;
          box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);
        }
        .nav-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(37, 211, 102, 0.4); }
        .features-container { max-width: 1200px; margin: 0 auto; }
        .section-header { text-align: center; margin-bottom: 4rem; }
        .section-badge {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.5rem 1rem; background: rgba(37, 211, 102, 0.1);
          color: var(--primary); border-radius: 50px; font-size: 0.875rem;
          font-weight: 700; margin-bottom: 1rem;
        }
        .section-title { font-size: 3rem; font-weight: 800; margin-bottom: 1rem; color: var(--text-primary); }
        .section-subtitle { font-size: 1.125rem; color: var(--text-secondary); max-width: 600px; margin: 0 auto; }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
        .feature-card {
          padding: 2.5rem; background: var(--bg); border-radius: var(--radius);
          border: 1px solid var(--border); transition: all 0.3s;
          position: relative; overflow: hidden;
        }
        .feature-card::before {
          content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 4px;
          background: linear-gradient(90deg, var(--primary), var(--primary-dark));
          transform: scaleX(0); transition: transform 0.3s;
        }
        .feature-card:hover { transform: translateY(-8px); box-shadow: var(--shadow-lg); }
        .feature-card:hover::before { transform: scaleX(1); }
        .feature-icon {
          width: 60px; height: 60px; border-radius: 16px;
          background: linear-gradient(135deg, rgba(37, 211, 102, 0.1) 0%, rgba(18, 140, 126, 0.1) 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; color: var(--primary); margin-bottom: 1.5rem;
        }
        .feature-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem; }
        .feature-desc { color: var(--text-secondary); line-height: 1.6; }

        .how-it-works { padding: 6rem 2rem; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); }
        .steps-container {
          max-width: 1000px; margin: 0 auto; display: grid;
          grid-template-columns: repeat(4, 1fr); gap: 2rem; position: relative;
        }
        .step-card { text-align: center; position: relative; }
        .step-number {
          width: 60px; height: 60px; border-radius: 50%;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          color: white; display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; font-weight: 800; margin: 0 auto 1.5rem;
          position: relative; z-index: 2; box-shadow: 0 8px 25px rgba(37, 211, 102, 0.3);
        }
        .step-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem; }
        .step-desc { color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; }

        .cta-section {
          padding: 6rem 2rem; background: linear-gradient(135deg, var(--dark) 0%, #1e293b 100%);
          text-align: center; position: relative; overflow: hidden;
        }
        .cta-section::before {
          content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
          background: radial-gradient(circle, rgba(37, 211, 102, 0.1) 0%, transparent 70%);
          animation: rotate 20s linear infinite;
        }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .cta-content { position: relative; z-index: 2; max-width: 700px; margin: 0 auto; }
        .cta-title { font-size: 3.5rem; font-weight: 900; color: white; margin-bottom: 1.5rem; }
        .cta-title span { color: var(--primary); }
        .cta-desc {
          font-size: 1.25rem; color: rgba(255, 255, 255, 0.7); margin-bottom: 2.5rem; line-height: 1.6;
        }

        .footer { padding: 4rem 2rem 2rem; background: var(--darker); color: white; }
        .footer-container {
          max-width: 1200px; margin: 0 auto; display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr; gap: 3rem; margin-bottom: 3rem;
        }
        .footer-brand { font-size: 1.5rem; font-weight: 800; margin-bottom: 1rem; }
        .footer-brand span { color: var(--primary); }
        .footer-desc { color: rgba(255, 255, 255, 0.6); line-height: 1.6; margin-bottom: 1.5rem; }
        .footer-social { display: flex; gap: 1rem; }
        .social-link {
          width: 40px; height: 40px; border-radius: 10px; background: rgba(255, 255, 255, 0.1);
          display: flex; align-items: center; justify-content: center;
          color: white; text-decoration: none; transition: all 0.2s;
        }
        .social-link:hover { background: var(--primary); transform: translateY(-3px); }
        .footer-title { font-weight: 700; font-size: 1.1rem; margin-bottom: 1.5rem; }
        .footer-links { list-style: none; }
        .footer-links li { margin-bottom: 0.75rem; }
        .footer-links a {
          color: rgba(255, 255, 255, 0.6); text-decoration: none;
          transition: color 0.2s; font-size: 0.95rem;
        }
        .footer-links a:hover { color: var(--primary); }
        .footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 2rem;
          text-align: center; color: rgba(255, 255, 255, 0.5); font-size: 0.875rem;
        }

        @media (max-width: 1024px) {
          .hero-content { grid-template-columns: 1fr; text-align: center; }
          .hero-title { font-size: 3rem; }
          .hero-stats { justify-content: center; }
          .phone-mockup { display: none; }
          .features-grid { grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
          .steps-container { grid-template-columns: repeat(2, 1fr); gap: 2rem; }
          .footer-container { grid-template-columns: repeat(2, 1fr); gap: 2rem; }
          .section-title { font-size: 2.5rem; }
          .cta-title { font-size: 3rem; }
        }
        @media (max-width: 768px) {
          .navbar { padding: 0.75rem 1rem; }
          .nav-brand { font-size: 1.25rem; }
          .nav-logo { width: 35px; height: 35px; font-size: 1.1rem; }
          .mobile-menu-btn { display: flex !important; }
          .nav-links { 
            position: fixed;
            top: 60px;
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(20px);
            flex-direction: column;
            padding: 2rem;
            gap: 1.5rem;
            box-shadow: var(--shadow-lg);
            transform: translateY(-150%);
            opacity: 0;
            transition: all 0.3s ease;
            z-index: 999;
          }
          .nav-links.active {
            transform: translateY(0);
            opacity: 1;
          }
          .nav-link { font-size: 1.1rem; width: 100%; text-align: center; }
          .nav-cta { width: 100%; justify-content: center; }
          .mobile-menu-btn {
            display: flex;
            flex-direction: column;
            gap: 4px;
            cursor: pointer;
            padding: 8px;
            z-index: 1001;
          }
          .mobile-menu-btn span {
            width: 24px;
            height: 2px;
            background: var(--text-primary);
            transition: all 0.3s;
          }
          .features { padding: 4rem 1rem; }
          .features-grid { grid-template-columns: 1fr; gap: 1.5rem; }
          .feature-card { padding: 2rem; }
          .how-it-works { padding: 4rem 1rem; }
          .steps-container { grid-template-columns: 1fr; gap: 2.5rem; }
          .step-card { max-width: 400px; margin: 0 auto; }
          .cta-section { padding: 4rem 1rem; }
          .cta-title { font-size: 2.5rem; }
          .cta-desc { font-size: 1.1rem; }
          .footer { padding: 3rem 1rem 1.5rem; }
          .footer-container { grid-template-columns: 1fr; gap: 2rem; text-align: center; }
          .footer-social { justify-content: center; }
          .section-header { margin-bottom: 3rem; }
          .section-title { font-size: 2.25rem; }
          .section-subtitle { font-size: 1rem; }
        }
        @media (max-width: 640px) {
          .hero { padding: 5rem 1rem 3rem; }
          .hero-title { font-size: 2.25rem; }
          .hero-description { font-size: 1rem; }
          .hero-buttons { flex-direction: column; gap: 0.75rem; }
          .btn-primary, .btn-secondary { width: 100%; justify-content: center; }
          .hero-stats { flex-direction: column; gap: 1.5rem; align-items: center; }
          .stat-item { text-align: center; }
          .typing-container { font-size: 1.1rem; }
          .slide-indicators { bottom: 1rem; gap: 0.5rem; }
          .indicator { width: 30px; }
          .features-grid { grid-template-columns: 1fr; }
          .steps-container { grid-template-columns: 1fr; }
          .section-title { font-size: 2rem; }
          .cta-title { font-size: 2rem; }
          .cta-desc { font-size: 1rem; }
          .footer-container { grid-template-columns: 1fr; }
          .footer-bottom { font-size: 0.8rem; }
        }
      `}</style>

      {/* Navigation */}
      <Navbar scrolled={scrolled} onNavigate={handleNavigate} onScroll={handleScroll} />

      {/* Hero Section */}
      <Hero typedText={typedText} particles={particles} onNavigate={handleNavigate} />

      {/* Features Section */}
      <Features />

      {/* How It Works Section */}
      <HowItWorks />

      {/* CTA Section */}
      <CTA onNavigate={handleNavigate} />

      {/* Footer */}
      <Footer />
    </div>
  );
}
