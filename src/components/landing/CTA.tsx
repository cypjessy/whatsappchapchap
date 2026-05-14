"use client";

interface CTAProps {
  onNavigate: (path: string) => void;
}

export default function CTA({ onNavigate }: CTAProps) {
  return (
    <section className="cta-section">
      <div className="cta-content">
        <h2 className="cta-title">
          Ready to <span>Chap Chap</span><br />Your Sales?
        </h2>
        <p className="cta-desc">
          Join 10,000+ sellers who are already using WhatsApp Chap Chap to automate their business and delight customers.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary" style={{ fontSize: '1.1rem', padding: '1.25rem 2.5rem' }} onClick={() => onNavigate('/login')}>
            Get Started Free
            <i className="fas fa-arrow-right"></i>
          </button>
          <button className="btn-secondary" style={{ fontSize: '1.1rem', padding: '1.25rem 2.5rem' }} onClick={() => onNavigate('/login')}>
            <i className="fas fa-phone"></i>
            Talk to Sales
          </button>
        </div>
      </div>
    </section>
  );
}
