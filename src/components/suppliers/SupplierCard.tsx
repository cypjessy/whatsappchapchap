"use client";

import { Supplier } from "@/lib/db";
import { SupplierCardProps, categoryLogos, getPaymentTermsLabel } from "./types";

export function SupplierCard({ supplier, onView, onEdit, onDelete }: SupplierCardProps) {
  return (
    <div className="supplier-card">
      <span className="supplier-status status-active">Active</span>
      <div className="supplier-header">
        <div className="supplier-logo">{categoryLogos.general}</div>
        <div className="supplier-info">
          <div className="supplier-name">
            {supplier.name}
            <span className="verified-badge"><i className="fas fa-check"></i></span>
          </div>
          <span className="supplier-category"><i className="fas fa-box"></i> General</span>
          <div className="supplier-location">
            <i className="fas fa-map-marker-alt"></i>
            {supplier.address || "No address"}
          </div>
        </div>
        <div className="supplier-actions-top">
          <button className="action-icon-btn" onClick={() => onView(supplier)} title="View"><i className="fas fa-eye"></i></button>
          <button className="action-icon-btn" onClick={() => onEdit(supplier)} title="Edit"><i className="fas fa-edit"></i></button>
          <button className="action-icon-btn" onClick={() => onDelete(supplier.id)} title="Delete" style={{ color: "#ef4444" }}><i className="fas fa-trash"></i></button>
        </div>
      </div>
      <div className="supplier-body">
        <div className="supplier-stats">
          <div className="supplier-stat">
            <div className="supplier-stat-value">{supplier.products?.length || 0}</div>
            <div className="supplier-stat-label">Products</div>
          </div>
          <div className="supplier-stat">
            <div className="supplier-stat-value">$0</div>
            <div className="supplier-stat-label">Monthly</div>
          </div>
          <div className="supplier-stat">
            <div className="supplier-stat-value">-</div>
            <div className="supplier-stat-label">On Time</div>
          </div>
        </div>
        <div className="supplier-products">
          <div className="section-label">Contact</div>
          <div className="product-tags">
            <span className="product-tag">{supplier.contactPerson || "No contact"}</span>
            <span className="product-tag">{supplier.phone || "No phone"}</span>
            <span className="product-tag">{getPaymentTermsLabel(supplier.paymentTerms)}</span>
          </div>
        </div>
      </div>
      <div className="supplier-footer">
        <div className="supplier-rating">
          <span className="stars"><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i></span>
          <span className="rating-value">New</span>
        </div>
        <div className="last-order">{supplier.createdAt?.toDate ? supplier.createdAt.toDate().toLocaleDateString() : "Recently added"}</div>
      </div>
      <style jsx>{`
        .supplier-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          position: relative;
        }
        .supplier-header {
          padding: 1.5rem;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          border-bottom: 1px solid #e2e8f0;
        }
        .supplier-logo {
          width: 70px;
          height: 70px;
          border-radius: 8px;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          border: 2px solid #e2e8f0;
        }
        .supplier-info { flex: 1; }
        .supplier-name {
          font-size: 1.25rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .verified-badge {
          width: 20px;
          height: 20px;
          background: #25D366;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
        }
        .supplier-category {
          display: inline-flex;
          padding: 0.375rem 0.875rem;
          background: rgba(37, 211, 102, 0.1);
          color: #128C7E;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }
        .supplier-location {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #64748b;
          font-size: 0.9rem;
        }
        .supplier-actions-top { display: flex; gap: 0.5rem; }
        .action-icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: none;
          background: #f8fafc;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .action-icon-btn:hover { background: #25D366; color: white; }
        .supplier-body { padding: 1.5rem; }
        .supplier-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .supplier-stat {
          text-align: center;
          padding: 0.75rem;
          background: #f8fafc;
          border-radius: 8px;
        }
        .supplier-stat-value { font-size: 1.25rem; font-weight: 800; color: #1e293b; }
        .supplier-stat-label { font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; }
        .section-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 0.75rem; }
        .product-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .product-tag {
          padding: 0.375rem 0.75rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #64748b;
        }
        .supplier-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(248, 250, 252, 0.5);
        }
        .supplier-rating { display: flex; align-items: center; gap: 0.5rem; }
        .stars { color: #f59e0b; font-size: 0.9rem; }
        .rating-value { font-weight: 700; color: #1e293b; }
        .last-order { font-size: 0.875rem; color: #64748b; }
        .supplier-status {
          position: absolute;
          top: 1rem;
          right: 1rem;
          padding: 0.375rem 0.875rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .status-active { background: rgba(37, 211, 102, 0.1); color: #10b981; }
      `}</style>
    </div>
  );
}
