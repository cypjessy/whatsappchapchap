"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

        .hero {
          min-height: 100vh; display: flex; align-items: center;
          position: relative; overflow: hidden; padding: 6rem 2rem 4rem;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
        }
        .hero-bg-images { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; }
        .bg-image {
          position: absolute; width: 300px; height: 400px; border-radius: 20px;
          overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
          opacity: 0; animation: floatImage 20s infinite;
          border: 3px solid rgba(255, 255, 255, 0.1);
        }
        .bg-image img { width: 100%; height: 100%; object-fit: cover; }
        .bg-image:nth-child(1) { top: 10%; left: 5%; animation-delay: 0s; transform: rotate(-8deg); }
        .bg-image:nth-child(2) { top: 60%; left: 8%; animation-delay: 4s; transform: rotate(5deg); width: 250px; height: 350px; }
        .bg-image:nth-child(3) { top: 15%; right: 8%; animation-delay: 8s; transform: rotate(6deg); }
        .bg-image:nth-child(4) { top: 55%; right: 5%; animation-delay: 12s; transform: rotate(-5deg); width: 280px; height: 380px; }
        .bg-image:nth-child(5) { top: 30%; left: 25%; animation-delay: 16s; transform: rotate(3deg); width: 220px; height: 300px; }

        @keyframes floatImage {
          0%, 100% { opacity: 0; transform: translateY(20px) rotate(var(--rotation, 0deg)); }
          10% { opacity: 0.6; }
          50% { opacity: 0.8; transform: translateY(-20px) rotate(var(--rotation, 0deg)); }
          90% { opacity: 0.6; }
        }

        .particles { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 2; pointer-events: none; }
        .particle {
          position: absolute; background: var(--primary); border-radius: 50%;
          opacity: 0.3; animation: particleFloat 15s infinite;
        }
        @keyframes particleFloat {
          0%, 100% { transform: translateY(100vh) scale(0); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-100vh) scale(1); }
        }

        .hero-content {
          position: relative; z-index: 10; max-width: 1400px; margin: 0 auto;
          display: grid; grid-template-columns: 1fr 1fr; gap: 4rem;
          align-items: center; width: 100%;
        }
        .hero-text { color: white; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.5rem 1rem; background: rgba(37, 211, 102, 0.15);
          border: 1px solid rgba(37, 211, 102, 0.3); border-radius: 50px;
          font-size: 0.875rem; font-weight: 600; color: var(--primary-light);
          margin-bottom: 1.5rem; animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        .hero-title {
          font-size: 4rem; font-weight: 900; line-height: 1.1;
          margin-bottom: 1.5rem; letter-spacing: -0.02em;
        }
        .hero-title .highlight {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .typing-container {
          font-size: 1.5rem; font-weight: 600; color: rgba(255, 255, 255, 0.8);
          margin-bottom: 2rem; min-height: 2rem;
        }
        .typing-cursor {
          display: inline-block; width: 3px; height: 1.5rem;
          background: var(--primary); margin-left: 4px;
          animation: blink 1s infinite; vertical-align: middle;
        }
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
        .hero-description {
          font-size: 1.125rem; color: rgba(255, 255, 255, 0.7);
          line-height: 1.7; margin-bottom: 2.5rem; max-width: 500px;
        }
        .hero-buttons { display: flex; gap: 1rem; margin-bottom: 3rem; }
        .btn-primary {
          padding: 1rem 2rem;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          color: white; border: none; border-radius: 50px; font-family: inherit;
          font-weight: 700; font-size: 1rem; cursor: pointer; transition: all 0.3s;
          box-shadow: 0 8px 30px rgba(37, 211, 102, 0.4);
          display: inline-flex; align-items: center; gap: 0.5rem;
        }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(37, 211, 102, 0.5); }
        .btn-secondary {
          padding: 1rem 2rem; background: transparent; color: white;
          border: 2px solid rgba(255, 255, 255, 0.3); border-radius: 50px;
          font-family: inherit; font-weight: 700; font-size: 1rem;
          cursor: pointer; transition: all 0.3s; display: inline-flex;
          align-items: center; gap: 0.5rem;
        }
        .btn-secondary:hover { background: rgba(255, 255, 255, 0.1); border-color: white; }
        .hero-stats { display: flex; gap: 3rem; }
        .stat-item { text-align: left; }
        .stat-number { font-size: 2.5rem; font-weight: 800; color: white; line-height: 1; }
        .stat-number span { color: var(--primary); }
        .stat-label {
          font-size: 0.875rem; color: rgba(255, 255, 255, 0.6);
          margin-top: 0.5rem; font-weight: 500;
        }

        .phone-mockup { position: relative; display: flex; justify-content: center; align-items: center; }
        .iphone {
          width: 340px; height: 700px; background: #1a1a2e; border-radius: 50px;
          padding: 12px;
          box-shadow: 0 0 0 2px #333, 0 0 0 4px #1a1a2e, 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 100px rgba(37, 211, 102, 0.1);
          position: relative; animation: phoneFloat 6s ease-in-out infinite;
        }
        @keyframes phoneFloat {
          0%, 100% { transform: translateY(0) rotateY(-5deg); }
          50% { transform: translateY(-20px) rotateY(5deg); }
        }
        .iphone-notch {
          position: absolute; top: 20px; left: 50%; transform: translateX(-50%);
          width: 120px; height: 30px; background: #1a1a2e; border-radius: 20px; z-index: 10;
        }
        .iphone-screen {
          width: 100%; height: 100%; background: white; border-radius: 40px;
          overflow: hidden; position: relative;
        }
        .app-header {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          padding: 3rem 1.5rem 2rem; color: white;
        }
        .app-status-bar {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 0.75rem; margin-bottom: 1rem; padding: 0 0.5rem;
        }
        .app-brand { display: flex; align-items: center; gap: 0.5rem; font-weight: 700; font-size: 1.1rem; }
        .app-search {
          margin-top: 1rem; padding: 0.75rem 1rem; background: rgba(255, 255, 255, 0.2);
          border-radius: 12px; display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.875rem; color: rgba(255, 255, 255, 0.8);
        }
        .app-stats { display: flex; gap: 1rem; margin-top: 1rem; }
        .app-stat { flex: 1; background: rgba(255, 255, 255, 0.15); padding: 0.75rem; border-radius: 12px; text-align: center; }
        .app-stat-value { font-size: 1.25rem; font-weight: 800; }
        .app-stat-label { font-size: 0.7rem; opacity: 0.8; }
        .app-body { padding: 1rem; background: #f8fafc; height: calc(100% - 200px); overflow-y: auto; }
        .app-section-title {
          font-size: 0.875rem; font-weight: 700; color: var(--text-secondary);
          margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;
        }
        .app-order-card {
          background: white; border-radius: 16px; padding: 1rem; margin-bottom: 0.75rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); border: 1px solid var(--border);
        }
        .app-order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
        .app-order-id { font-weight: 700; font-size: 0.9rem; color: var(--primary); }
        .app-order-status {
          padding: 0.25rem 0.75rem; background: rgba(37, 211, 102, 0.1);
          color: #10b981; border-radius: 20px; font-size: 0.75rem; font-weight: 700;
        }
        .app-order-customer { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
        .app-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 0.75rem; font-weight: 700;
        }
        .app-customer-name { font-weight: 600; font-size: 0.9rem; }
        .app-order-product {
          display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem;
          background: var(--bg); border-radius: 12px;
        }
        .app-product-thumb {
          width: 40px; height: 40px; border-radius: 10px;
          background: linear-gradient(135deg, var(--primary-light) 0%, #e0e7ff 100%);
          display: flex; align-items: center; justify-content: center; font-size: 1.25rem;
        }
        .app-product-info h5 { font-weight: 700; font-size: 0.85rem; }
        .app-product-info span { font-size: 0.75rem; color: var(--text-secondary); }
        .app-order-amount { text-align: right; margin-top: 0.5rem; font-weight: 800; color: var(--text-primary); }
        .phone-reflection {
          position: absolute; bottom: -30px; left: 50%; transform: translateX(-50%);
          width: 280px; height: 40px; background: linear-gradient(to bottom, rgba(0,0,0,0.2), transparent);
          border-radius: 50%; filter: blur(10px);
        }

        .features { padding: 6rem 2rem; background: white; }
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
          .features-grid { grid-template-columns: repeat(2, 1fr); }
          .steps-container { grid-template-columns: repeat(2, 1fr); }
          .footer-container { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .navbar { padding: 1rem; }
          .nav-links { display: none; }
          .hero { padding: 5rem 1rem 3rem; }
          .hero-title { font-size: 2.5rem; }
          .hero-buttons { flex-direction: column; }
          .features-grid { grid-template-columns: 1fr; }
          .steps-container { grid-template-columns: 1fr; }
          .section-title { font-size: 2rem; }
          .cta-title { font-size: 2.5rem; }
          .footer-container { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Navigation */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="nav-logo">
            <i className="fab fa-whatsapp"></i>
          </div>
          Chap<span>Chap</span>
        </div>
        <div className="nav-links">
          <div className="nav-link" onClick={() => handleScroll('features')}>Features</div>
          <div className="nav-link" onClick={() => handleScroll('how-it-works')}>How It Works</div>
          <div className="nav-link" onClick={() => handleScroll('pricing')}>Pricing</div>
          <div className="nav-link" onClick={() => handleScroll('testimonials')}>Testimonials</div>
          <button className="nav-cta" onClick={() => handleNavigate('/login')}>
            Start Selling Free
            <i className="fas fa-arrow-right"></i>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        {/* Animated Background Images */}
        <div className="hero-bg-images">
          <div className="bg-image" style={{ '--rotation': '-8deg' } as any}>
            <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=500&fit=crop" alt="Seller" />
          </div>
          <div className="bg-image" style={{ '--rotation': '5deg' } as any}>
            <img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=500&fit=crop" alt="Products" />
          </div>
          <div className="bg-image" style={{ '--rotation': '6deg' } as any}>
            <img src="https://images.unsplash.com/photo-1556740758-90de374c12ad?w=400&h=500&fit=crop" alt="Happy Customer" />
          </div>
          <div className="bg-image" style={{ '--rotation': '-5deg' } as any}>
            <img src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=500&fit=crop" alt="WhatsApp Business" />
          </div>
          <div className="bg-image" style={{ '--rotation': '3deg' } as any}>
            <img src="https://images.unsplash.com/photo-1556742111-a301076d9d18?w=400&h=500&fit=crop" alt="Delivery" />
          </div>
        </div>

        {/* Floating Particles */}
        <div className="particles">
          {particles.map(p => (
            <div
              key={p.id}
              className="particle"
              style={{
                left: `${p.left}%`,
                animationDelay: `${p.animationDelay}s`,
                animationDuration: `${p.animationDuration}s`,
                width: `${p.size}px`,
                height: `${p.size}px`
              }}
            />
          ))}
        </div>

        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <i className="fas fa-bolt"></i>
              AI-Powered WhatsApp Commerce
            </div>
            <h1 className="hero-title">
              Sell on WhatsApp<br />
              <span className="highlight">Like a Pro</span>
            </h1>
            <div className="typing-container">
              <span className="typing-text">{typedText}</span>
              <span className="typing-cursor"></span>
            </div>
            <p className="hero-description">
              The all-in-one platform for WhatsApp sellers. Manage products, automate sales with AI, track orders, and grow your business — all from one dashboard.
            </p>
            <div className="hero-buttons">
              <button className="btn-primary" onClick={() => handleNavigate('/login')}>
                Start Free Trial
                <i className="fas fa-rocket"></i>
              </button>
              <button className="btn-secondary" onClick={() => handleNavigate('/login')}>
                <i className="fas fa-play-circle"></i>
                Watch Demo
              </button>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">10K<span>+</span></div>
                <div className="stat-label">Active Sellers</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">500K<span>+</span></div>
                <div className="stat-label">Orders Processed</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">98<span>%</span></div>
                <div className="stat-label">Satisfaction Rate</div>
              </div>
            </div>
          </div>

          {/* iPhone 17 Mockup */}
          <div className="phone-mockup">
            <div className="iphone">
              <div className="iphone-notch"></div>
              <div className="iphone-screen">
                <div className="app-header">
                  <div className="app-status-bar">
                    <span>9:41</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <i className="fas fa-signal"></i>
                      <i className="fas fa-wifi"></i>
                      <i className="fas fa-battery-full"></i>
                    </div>
                  </div>
                  <div className="app-brand">
                    <i className="fab fa-whatsapp" style={{ fontSize: '1.25rem' }}></i>
                    ChapChap Dashboard
                  </div>
                  <div className="app-search">
                    <i className="fas fa-search"></i>
                    Search orders, products...
                  </div>
                  <div className="app-stats">
                    <div className="app-stat">
                      <div className="app-stat-value">156</div>
                      <div className="app-stat-label">Today's Orders</div>
                    </div>
                    <div className="app-stat">
                      <div className="app-stat-value">$12.4k</div>
                      <div className="app-stat-label">Revenue</div>
                    </div>
                    <div className="app-stat">
                      <div className="app-stat-value">94%</div>
                      <div className="app-stat-label">AI Response</div>
                    </div>
                  </div>
                </div>
                <div className="app-body">
                  <div className="app-section-title">Recent Orders</div>
                  
                  <div className="app-order-card">
                    <div className="app-order-header">
                      <span className="app-order-id">#1234</span>
                      <span className="app-order-status">New</span>
                    </div>
                    <div className="app-order-customer">
                      <div className="app-avatar">AJ</div>
                      <span className="app-customer-name">Alice Johnson</span>
                    </div>
                    <div className="app-order-product">
                      <div className="app-product-thumb">👟</div>
                      <div className="app-product-info">
                        <h5>Nike Air Max</h5>
                        <span>Size 42 • Qty: 1</span>
                      </div>
                    </div>
                    <div className="app-order-amount">$189.00</div>
                  </div>

                  <div className="app-order-card">
                    <div className="app-order-header">
                      <span className="app-order-id">#1233</span>
                      <span className="app-order-status" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>Processing</span>
                    </div>
                    <div className="app-order-customer">
                      <div className="app-avatar" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>BS</div>
                      <span className="app-customer-name">Bob Smith</span>
                    </div>
                    <div className="app-order-product">
                      <div className="app-product-thumb" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}>👜</div>
                      <div className="app-product-info">
                        <h5>Leather Handbag</h5>
                        <span>Brown • Qty: 2</span>
                      </div>
                    </div>
                    <div className="app-order-amount">$340.00</div>
                  </div>

                  <div className="app-order-card">
                    <div className="app-order-header">
                      <span className="app-order-id">#1232</span>
                      <span className="app-order-status" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>Completed</span>
                    </div>
                    <div className="app-order-customer">
                      <div className="app-avatar" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>CW</div>
                      <span className="app-customer-name">Carol White</span>
                    </div>
                    <div className="app-order-product">
                      <div className="app-product-thumb" style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)' }}>⌚</div>
                      <div className="app-product-info">
                        <h5>Smart Watch Pro</h5>
                        <span>Black • Qty: 1</span>
                      </div>
                    </div>
                    <div className="app-order-amount">$299.00</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="phone-reflection"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="features-container">
          <div className="section-header">
            <div className="section-badge">
              <i className="fas fa-magic"></i>
              Powerful Features
            </div>
            <h2 className="section-title">Everything You Need to Sell</h2>
            <p className="section-subtitle">
              From inventory management to AI-powered automation, we've built the complete toolkit for modern WhatsApp sellers.
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-robot"></i>
              </div>
              <h3 className="feature-title">AI Sales Assistant</h3>
              <p className="feature-desc">
                Let AI handle customer queries, send order updates, and upsell products automatically 24/7.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-boxes"></i>
              </div>
              <h3 className="feature-title">Smart Inventory</h3>
              <p className="feature-desc">
                Track stock levels, get low-stock alerts, and manage variants with our visual product builder.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3 className="feature-title">Real-time Analytics</h3>
              <p className="feature-desc">
                Monitor sales, track customer behavior, and make data-driven decisions with detailed insights.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-shopping-bag"></i>
              </div>
              <h3 className="feature-title">Order Management</h3>
              <p className="feature-desc">
                Process orders, track deliveries, and handle returns — all from one unified dashboard.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-users"></i>
              </div>
              <h3 className="feature-title">Customer CRM</h3>
              <p className="feature-desc">
                Build customer profiles, track purchase history, and send personalized offers via WhatsApp.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-mobile-alt"></i>
              </div>
              <h3 className="feature-title">Mobile First</h3>
              <p className="feature-desc">
                Manage your entire business from your phone. Responsive design that works perfectly on any device.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" id="how-it-works">
        <div className="features-container">
          <div className="section-header">
            <div className="section-badge">
              <i className="fas fa-route"></i>
              Simple Process
            </div>
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              Get started in minutes and start selling smarter today.
            </p>
          </div>
          <div className="steps-container">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3 className="step-title">Connect WhatsApp</h3>
              <p className="step-desc">
                Link your WhatsApp Business account with one click. No complex setup required.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3 className="step-title">Add Products</h3>
              <p className="step-desc">
                Upload your catalog with our visual builder. Add specs, prices, and images easily.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3 className="step-title">AI Takes Over</h3>
              <p className="step-desc">
                Our AI handles customer queries, processes orders, and sends updates automatically.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <h3 className="step-title">Watch Sales Grow</h3>
              <p className="step-desc">
                Track performance, optimize with insights, and scale your business effortlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">
            Ready to <span>Chap Chap</span><br />Your Sales?
          </h2>
          <p className="cta-desc">
            Join 10,000+ sellers who are already using WhatsApp Chap Chap to automate their business and delight customers.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" style={{ fontSize: '1.1rem', padding: '1.25rem 2.5rem' }} onClick={() => handleNavigate('/login')}>
              Get Started Free
              <i className="fas fa-arrow-right"></i>
            </button>
            <button className="btn-secondary" style={{ fontSize: '1.1rem', padding: '1.25rem 2.5rem' }} onClick={() => handleNavigate('/login')}>
              <i className="fas fa-phone"></i>
              Talk to Sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div>
            <div className="footer-brand">
              Chap<span>Chap</span>
            </div>
            <p className="footer-desc">
              The complete AI-powered platform for WhatsApp sellers. Built for entrepreneurs who want to sell smarter and grow faster.
            </p>
            <div className="footer-social">
              <div className="social-link"><i className="fab fa-whatsapp"></i></div>
              <div className="social-link"><i className="fab fa-instagram"></i></div>
              <div className="social-link"><i className="fab fa-twitter"></i></div>
              <div className="social-link"><i className="fab fa-linkedin"></i></div>
            </div>
          </div>
          <div>
            <h4 className="footer-title">Product</h4>
            <ul className="footer-links">
              <li><div>Features</div></li>
              <li><div>Pricing</div></li>
              <li><div>Integrations</div></li>
              <li><div>API</div></li>
            </ul>
          </div>
          <div>
            <h4 className="footer-title">Resources</h4>
            <ul className="footer-links">
              <li><div>Documentation</div></li>
              <li><div>Blog</div></li>
              <li><div>Tutorials</div></li>
              <li><div>Community</div></li>
            </ul>
          </div>
          <div>
            <h4 className="footer-title">Company</h4>
            <ul className="footer-links">
              <li><div>About</div></li>
              <li><div>Careers</div></li>
              <li><div>Contact</div></li>
              <li><div>Legal</div></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 WhatsApp Chap Chap. All rights reserved. Made with 💚 for sellers worldwide.</p>
        </div>
      </footer>
    </div>
  );
}
