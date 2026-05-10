"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface HeroProps {
  typedText: string;
  particles: Array<{
    id: number;
    left: number;
    animationDelay: number;
    animationDuration: number;
    size: number;
  }>;
  onNavigate: (path: string) => void;
}

const heroImages = [
  {
    src: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&h=1080&fit=crop",
    alt: "Seller managing orders"
  },
  {
    src: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920&h=1080&fit=crop",
    alt: "Products showcase"
  },
  {
    src: "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=1920&h=1080&fit=crop",
    alt: "Happy customer receiving package"
  },
  {
    src: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1920&h=1080&fit=crop",
    alt: "WhatsApp business chat"
  },
  {
    src: "https://images.unsplash.com/photo-1556742111-a301076d9d18?w=1920&h=1080&fit=crop",
    alt: "Fast delivery service"
  }
];

export default function Hero({ typedText, particles, onNavigate }: HeroProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextImage = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
      setIsTransitioning(false);
    }, 800);
  }, []);

  useEffect(() => {
    const interval = setInterval(nextImage, 5000);
    return () => clearInterval(interval);
  }, [nextImage]);

  return (
    <section className="hero">
      {/* Full-Screen Auto-Playing Background Images */}
      <div className="hero-slideshow">
        {heroImages.map((image, index) => (
          <div
            key={image.src}
            className={`slide ${index === currentImage ? "active" : ""} ${
              isTransitioning && index === currentImage ? "transitioning" : ""
            }`}
          >
            <img src={image.src} alt={image.alt} />
            <div className="slide-overlay" />
          </div>
        ))}
        
        {/* Slide Indicators */}
        <div className="slide-indicators">
          {heroImages.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentImage ? "active" : ""}`}
              onClick={() => {
                if (index !== currentImage) {
                  setIsTransitioning(true);
                  setTimeout(() => {
                    setCurrentImage(index);
                    setIsTransitioning(false);
                  }, 800);
                }
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Floating Particles */}
      <div className="particles">
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.animationDelay}s`,
              animationDuration: `${p.animationDuration}s`,
              width: `${p.size}px`,
              height: `${p.size}px`,
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
            Sell on WhatsApp
            <br />
            <span className="highlight">Like a Pro</span>
          </h1>
          <div className="typing-container">
            <span className="typing-text">{typedText}</span>
            <span className="typing-cursor"></span>
          </div>
          <p className="hero-description">
            The all-in-one platform for WhatsApp sellers. Manage products,
            automate sales with AI, track orders, and grow your business — all
            from one dashboard.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => onNavigate("/login")}>
              Start Free Trial
              <i className="fas fa-rocket"></i>
            </button>
            <button className="btn-secondary" onClick={() => onNavigate("/login")}>
              <i className="fas fa-play-circle"></i>
              Watch Demo
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">
                10K<span>+</span>
              </div>
              <div className="stat-label">Active Sellers</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">
                500K<span>+</span>
              </div>
              <div className="stat-label">Orders Processed</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">
                98<span>%</span>
              </div>
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
                  <div style={{ display: "flex", gap: "4px" }}>
                    <i className="fas fa-signal"></i>
                    <i className="fas fa-wifi"></i>
                    <i className="fas fa-battery-full"></i>
                  </div>
                </div>
                <div className="app-brand">
                  <i
                    className="fab fa-whatsapp"
                    style={{ fontSize: "1.25rem" }}
                  ></i>
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
                    <span
                      className="app-order-status"
                      style={{
                        background: "rgba(59, 130, 246, 0.1)",
                        color: "#3b82f6",
                      }}
                    >
                      Processing
                    </span>
                  </div>
                  <div className="app-order-customer">
                    <div
                      className="app-avatar"
                      style={{
                        background:
                          "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      }}
                    >
                      BS
                    </div>
                    <span className="app-customer-name">Bob Smith</span>
                  </div>
                  <div className="app-order-product">
                    <div
                      className="app-product-thumb"
                      style={{
                        background:
                          "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                      }}
                    >
                      👜
                    </div>
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
                    <span
                      className="app-order-status"
                      style={{
                        background: "rgba(16, 185, 129, 0.1)",
                        color: "#10b981",
                      }}
                    >
                      Completed
                    </span>
                  </div>
                  <div className="app-order-customer">
                    <div
                      className="app-avatar"
                      style={{
                        background:
                          "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                      }}
                    >
                      CW
                    </div>
                    <span className="app-customer-name">Carol White</span>
                  </div>
                  <div className="app-order-product">
                    <div
                      className="app-product-thumb"
                      style={{
                        background:
                          "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
                      }}
                    >
                      📱
                    </div>
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

      {/* CSS Styles */}
      <style jsx>{`
        .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          position: relative;
          overflow: hidden;
          padding: 6rem 2rem 4rem;
        }

        /* Full-Screen Slideshow */
        .hero-slideshow {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        .slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          transform: scale(1.1);
          transition: opacity 1.2s ease-in-out, transform 8s ease-out;
        }

        .slide.active {
          opacity: 1;
          transform: scale(1);
        }

        .slide.transitioning {
          transform: scale(1.05);
        }

        .slide img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }

        .slide-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            135deg,
            rgba(15, 23, 42, 0.92) 0%,
            rgba(15, 23, 42, 0.85) 40%,
            rgba(30, 41, 59, 0.75) 100%
          );
        }

        /* Slide Indicators */
        .slide-indicators {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 0.75rem;
          z-index: 10;
        }

        .indicator {
          width: 40px;
          height: 4px;
          border-radius: 2px;
          background: rgba(255, 255, 255, 0.3);
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .indicator::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 0;
          background: var(--primary);
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .indicator.active {
          background: rgba(255, 255, 255, 0.5);
        }

        .indicator.active::after {
          width: 100%;
          animation: progress 5s linear;
        }

        @keyframes progress {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }

        .indicator:hover {
          background: rgba(255, 255, 255, 0.6);
        }

        /* Floating Particles */
        .particles {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 2;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          background: var(--primary);
          border-radius: 50%;
          opacity: 0.3;
          animation: particleFloat 15s infinite;
        }

        @keyframes particleFloat {
          0%,
          100% {
            transform: translateY(100vh) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-100vh) scale(1);
          }
        }

        /* Hero Content */
        .hero-content {
          position: relative;
          z-index: 10;
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
          width: 100%;
        }

        .hero-text {
          color: white;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(37, 211, 102, 0.15);
          border: 1px solid rgba(37, 211, 102, 0.3);
          border-radius: 50px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #dcf8c6;
          margin-bottom: 1.5rem;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        .hero-title {
          font-size: 4rem;
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          letter-spacing: -0.02em;
        }

        .hero-title .highlight {
          background: linear-gradient(135deg, #25d366 0%, #dcf8c6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .typing-container {
          font-size: 1.5rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 2rem;
          min-height: 2rem;
        }

        .typing-text {
          display: inline;
        }

        .typing-cursor {
          display: inline-block;
          width: 3px;
          height: 1.5rem;
          background: #25d366;
          margin-left: 4px;
          animation: blink 1s infinite;
          vertical-align: middle;
        }

        @keyframes blink {
          0%,
          50% {
            opacity: 1;
          }
          51%,
          100% {
            opacity: 0;
          }
        }

        .hero-description {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.7;
          margin-bottom: 2.5rem;
          max-width: 500px;
        }

        .hero-buttons {
          display: flex;
          gap: 1rem;
          margin-bottom: 3rem;
        }

        .btn-primary {
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
          color: white;
          border: none;
          border-radius: 50px;
          font-family: inherit;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 8px 30px rgba(37, 211, 102, 0.4);
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(37, 211, 102, 0.5);
        }

        .btn-secondary {
          padding: 1rem 2rem;
          background: transparent;
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50px;
          font-family: inherit;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: white;
        }

        .hero-stats {
          display: flex;
          gap: 3rem;
        }

        .stat-item {
          text-align: left;
        }

        .stat-number {
          font-size: 2.5rem;
          font-weight: 800;
          color: white;
          line-height: 1;
        }

        .stat-number span {
          color: #25d366;
        }

        .stat-label {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 0.5rem;
          font-weight: 500;
        }

        /* iPhone Mockup */
        .phone-mockup {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .iphone {
          width: 340px;
          height: 700px;
          background: #1a1a2e;
          border-radius: 50px;
          padding: 12px;
          box-shadow: 0 0 0 2px #333, 0 0 0 4px #1a1a2e,
            0 20px 60px rgba(0, 0, 0, 0.5),
            0 0 100px rgba(37, 211, 102, 0.1);
          position: relative;
          animation: phoneFloat 6s ease-in-out infinite;
        }

        @keyframes phoneFloat {
          0%,
          100% {
            transform: translateY(0) rotateY(-5deg);
          }
          50% {
            transform: translateY(-20px) rotateY(5deg);
          }
        }

        .iphone-notch {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 120px;
          height: 30px;
          background: #1a1a2e;
          border-radius: 20px;
          z-index: 10;
        }

        .iphone-screen {
          width: 100%;
          height: 100%;
          background: white;
          border-radius: 40px;
          overflow: hidden;
          position: relative;
        }

        .app-header {
          background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
          padding: 3rem 1.5rem 2rem;
          color: white;
        }

        .app-status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          margin-bottom: 1rem;
          padding: 0 0.5rem;
        }

        .app-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .app-search {
          margin-top: 1rem;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .app-stats {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .app-stat {
          flex: 1;
          background: rgba(255, 255, 255, 0.15);
          padding: 0.75rem;
          border-radius: 12px;
          text-align: center;
        }

        .app-stat-value {
          font-size: 1.25rem;
          font-weight: 800;
        }

        .app-stat-label {
          font-size: 0.7rem;
          opacity: 0.8;
        }

        .app-body {
          padding: 1rem;
          background: #f8fafc;
          height: calc(100% - 200px);
          overflow-y: auto;
        }

        .app-section-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .app-order-card {
          background: white;
          border-radius: 16px;
          padding: 1rem;
          margin-bottom: 0.75rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          border: 1px solid #e2e8f0;
        }

        .app-order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .app-order-id {
          font-weight: 700;
          font-size: 0.9rem;
          color: #25d366;
        }

        .app-order-status {
          padding: 0.25rem 0.75rem;
          background: rgba(37, 211, 102, 0.1);
          color: #10b981;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .app-order-customer {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .app-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .app-customer-name {
          font-weight: 600;
          font-size: 0.9rem;
        }

        .app-order-product {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          background: #f8fafc;
          border-radius: 12px;
        }

        .app-product-thumb {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #dcf8c6 0%, #e0e7ff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
        }

        .app-product-info h5 {
          font-weight: 700;
          font-size: 0.85rem;
        }

        .app-product-info span {
          font-size: 0.75rem;
          color: #64748b;
        }

        .app-order-amount {
          text-align: right;
          margin-top: 0.5rem;
          font-weight: 800;
          color: #1e293b;
        }

        .phone-reflection {
          position: absolute;
          bottom: -30px;
          left: 50%;
          transform: translateX(-50%);
          width: 280px;
          height: 40px;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.2),
            transparent
          );
          border-radius: 50%;
          filter: blur(10px);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .hero-content {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 3rem;
          }

          .hero-title {
            font-size: 3rem;
          }

          .hero-description {
            margin-left: auto;
            margin-right: auto;
          }

          .hero-buttons {
            justify-content: center;
          }

          .hero-stats {
            justify-content: center;
          }

          .phone-mockup {
            display: none;
          }

          .slide-indicators {
            bottom: 1rem;
          }
        }

        @media (max-width: 768px) {
          .hero {
            padding: 5rem 1.5rem 4rem;
          }

          .hero-badge {
            font-size: 0.8rem;
            padding: 0.4rem 0.8rem;
          }

          .hero-title {
            font-size: 2.5rem;
          }

          .typing-container {
            font-size: 1.25rem;
          }

          .hero-description {
            font-size: 1rem;
          }

          .hero-buttons {
            flex-direction: column;
            align-items: center;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
            max-width: 300px;
            justify-content: center;
          }

          .hero-stats {
            flex-direction: column;
            gap: 1.5rem;
            align-items: center;
          }

          .stat-item {
            text-align: center;
          }

          .stat-number {
            font-size: 2rem;
          }

          .slide-indicators {
            bottom: 0.75rem;
            gap: 0.5rem;
          }

          .indicator {
            width: 30px;
            height: 3px;
          }
        }

        @media (max-width: 640px) {
          .hero {
            padding: 4.5rem 1rem 3.5rem;
          }

          .hero-title {
            font-size: 2rem;
          }

          .typing-container {
            font-size: 1.1rem;
            min-height: 1.5rem;
          }

          .typing-cursor {
            height: 1.2rem;
          }

          .hero-description {
            font-size: 0.95rem;
            margin-bottom: 2rem;
          }

          .hero-buttons {
            margin-bottom: 2rem;
          }

          .btn-primary,
          .btn-secondary {
            padding: 0.9rem 1.5rem;
            font-size: 0.95rem;
          }

          .stat-number {
            font-size: 1.75rem;
          }

          .stat-label {
            font-size: 0.8rem;
          }

          .slide-indicators {
            bottom: 0.5rem;
          }

          .indicator {
            width: 25px;
            height: 3px;
          }
        }
      `}</style>
    </section>
  );
}
