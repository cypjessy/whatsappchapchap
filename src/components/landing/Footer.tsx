"use client";

interface FooterProps {}

export default function Footer({}: FooterProps) {
  return (
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
        <p>© 2026 WhatsApp Chap Chap. All rights reserved. Made with ❤️ for sellers worldwide.</p>
      </div>
    </footer>
  );
}
