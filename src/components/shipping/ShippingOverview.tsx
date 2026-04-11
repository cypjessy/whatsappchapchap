"use client";

import { ShippingStatsProps } from "./types";

export function ShippingOverview({ stats }: { stats: ShippingStatsProps }) {
  return (
    <div className="shipping-overview">
      <style jsx>{`
        .shipping-overview {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        @media (max-width: 1200px) { .shipping-overview { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) { .shipping-overview { grid-template-columns: 1fr; } }
        .shipping-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }
        .shipping-icon {
          width: 64px;
          height: 64px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
        }
        .shipping-icon.pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .shipping-icon.transit { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .shipping-icon.delivered { background: rgba(37, 211, 102, 0.1); color: #10b981; }
        .shipping-icon.returns { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .shipping-content { flex: 1; }
        .shipping-label {
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 0.25rem;
        }
        .shipping-value { font-size: 2rem; font-weight: 800; color: #1e293b; }
        .shipping-change {
          font-size: 0.875rem;
          color: #10b981;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin-top: 0.25rem;
        }
      `}</style>
      <div className="shipping-card">
        <div className="shipping-icon pending"><i className="fas fa-clock"></i></div>
        <div className="shipping-content">
          <div className="shipping-label">Pending</div>
          <div className="shipping-value">{stats.pending}</div>
          <div className="shipping-change"><i className="fas fa-arrow-up"></i> +{Math.floor(stats.pending * 0.2)} today</div>
        </div>
      </div>
      <div className="shipping-card">
        <div className="shipping-icon transit"><i className="fas fa-shipping-fast"></i></div>
        <div className="shipping-content">
          <div className="shipping-label">In Transit</div>
          <div className="shipping-value">{stats.inTransit}</div>
          <div className="shipping-change"><i className="fas fa-arrow-up"></i> {Math.floor(stats.inTransit * 0.3)} arriving today</div>
        </div>
      </div>
      <div className="shipping-card">
        <div className="shipping-icon delivered"><i className="fas fa-check-circle"></i></div>
        <div className="shipping-content">
          <div className="shipping-label">Delivered</div>
          <div className="shipping-value">{stats.delivered}</div>
          <div className="shipping-change"><i className="fas fa-arrow-up"></i> +{Math.floor(stats.delivered * 0.1)} today</div>
        </div>
      </div>
      <div className="shipping-card">
        <div className="shipping-icon returns"><i className="fas fa-undo"></i></div>
        <div className="shipping-content">
          <div className="shipping-label">Returns</div>
          <div className="shipping-value">{stats.returns}</div>
          <div className="shipping-change" style={{ color: "#ef4444" }}><i className="fas fa-arrow-down"></i> -{Math.floor(stats.returns * 0.2)} this week</div>
        </div>
      </div>
    </div>
  );
}
