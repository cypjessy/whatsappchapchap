"use client";

import { SupplierStatsProps } from "./types";

export function SuppliersStats({ total, active, pending, rating }: SupplierStatsProps) {
  return (
    <div className="overview-grid">
      <style jsx>{`
        .overview-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        @media (max-width: 1200px) { .overview-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) { .overview-grid { grid-template-columns: 1fr; } }
        .overview-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .overview-icon {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }
        .overview-icon.total { background: rgba(37, 211, 102, 0.1); color: #25D366; }
        .overview-icon.active { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .overview-icon.pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .overview-icon.rating { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
        .overview-content h3 { font-size: 0.875rem; color: #64748b; font-weight: 600; text-transform: uppercase; }
        .overview-value { font-size: 1.75rem; font-weight: 800; color: #1e293b; }
        .overview-change { font-size: 0.875rem; color: #10b981; font-weight: 600; }
      `}</style>
      <div className="overview-card">
        <div className="overview-icon total"><i className="fas fa-users"></i></div>
        <div className="overview-content">
          <h3>Total Suppliers</h3>
          <div className="overview-value">{total}</div>
          <div className="overview-change"><i className="fas fa-arrow-up"></i> +0 this month</div>
        </div>
      </div>
      <div className="overview-card">
        <div className="overview-icon active"><i className="fas fa-check-circle"></i></div>
        <div className="overview-content">
          <h3>Active Suppliers</h3>
          <div className="overview-value">{active}</div>
          <div className="overview-change"><i className="fas fa-arrow-up"></i> {total > 0 ? Math.round((active / total) * 100) : 0}% active rate</div>
        </div>
      </div>
      <div className="overview-card">
        <div className="overview-icon pending"><i className="fas fa-clock"></i></div>
        <div className="overview-content">
          <h3>Pending Approval</h3>
          <div className="overview-value">{pending}</div>
          <div className="overview-change" style={{ color: "#f59e0b" }}><i className="fas fa-exclamation-circle"></i> Needs review</div>
        </div>
      </div>
      <div className="overview-card">
        <div className="overview-icon rating"><i className="fas fa-star"></i></div>
        <div className="overview-content">
          <h3>Avg Rating</h3>
          <div className="overview-value">{rating}</div>
          <div className="overview-change"><i className="fas fa-arrow-up"></i> +0.0 this quarter</div>
        </div>
      </div>
    </div>
  );
}
