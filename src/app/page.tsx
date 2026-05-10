"use client";

<<<<<<< HEAD
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
=======
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
              <Link href="/login" className="btn btn-ghost">
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
>>>>>>> 6ea11bd5b5fe5b9a2b95cbfa6f15aed1021d7afe
          </div>
        </div>
      </section>

      {/* Features Section */}
<<<<<<< HEAD
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
=======
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
>>>>>>> 6ea11bd5b5fe5b9a2b95cbfa6f15aed1021d7afe
          </div>
        </div>
      </section>

<<<<<<< HEAD
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
=======
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
>>>>>>> 6ea11bd5b5fe5b9a2b95cbfa6f15aed1021d7afe
          </div>
        </div>
      </section>

      {/* CTA Section */}
<<<<<<< HEAD
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
=======
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
>>>>>>> 6ea11bd5b5fe5b9a2b95cbfa6f15aed1021d7afe
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
<<<<<<< HEAD
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
=======
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
>>>>>>> 6ea11bd5b5fe5b9a2b95cbfa6f15aed1021d7afe
  );
}
