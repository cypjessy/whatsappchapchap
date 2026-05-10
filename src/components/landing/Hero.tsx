"use client";

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

export default function Hero({ typedText, particles, onNavigate }: HeroProps) {
  return (
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
            <button className="btn-primary" onClick={() => onNavigate('/login')}>
              Start Free Trial
              <i className="fas fa-rocket"></i>
            </button>
            <button className="btn-secondary" onClick={() => onNavigate('/login')}>
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
                    <div className="app-product-thumb" style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)' }}>📱</div>
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
  );
}
