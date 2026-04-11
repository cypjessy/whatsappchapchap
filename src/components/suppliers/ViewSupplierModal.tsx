"use client";

import { useState, useEffect } from "react";
import { Supplier } from "@/lib/db";
import { ViewSupplierModalProps, categoryLogos, getPaymentTermsLabel } from "./types";

export function ViewSupplierModal({ isOpen, supplier, onClose, onEdit, onDelete }: ViewSupplierModalProps) {
  const [viewTab, setViewTab] = useState("overview");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setViewTab("overview");
    }
  }, [isOpen]);

  if (!supplier) return null;

  return (
    <div className={`modal-overlay ${isOpen ? "active" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <style jsx>{`
        .modal-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(12px);
          z-index: 1000;
          padding: 2rem;
          align-items: center;
          justify-content: center;
        }
        .modal-overlay.active { display: flex; }
        .view-modal-container {
          background: #ffffff;
          border-radius: 20px;
          width: 100%;
          max-width: 1000px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from { transform: translateY(40px) scale(0.96); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .supplier-header {
          background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
          color: white;
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }
        .supplier-header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: 400px;
          height: 400px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 50%;
        }
        .supplier-header::after {
          content: '';
          position: absolute;
          bottom: -30%;
          left: -5%;
          width: 300px;
          height: 300px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 50%;
        }
        .header-content { position: relative; z-index: 1; }
        .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
        .supplier-identity { display: flex; align-items: center; gap: 1.5rem; }
        .supplier-logo-large {
          width: 90px;
          height: 90px;
          border-radius: 12px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        .supplier-title h2 { font-size: 1.875rem; font-weight: 800; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.75rem; }
        .verified-badge-large {
          width: 28px;
          height: 28px;
          background: #00C853;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          box-shadow: 0 4px 12px rgba(0, 200, 83, 0.3);
        }
        .supplier-meta { display: flex; gap: 1.5rem; flex-wrap: wrap; }
        .meta-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; opacity: 0.95; }
        .status-badge-large {
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 700;
          text-transform: uppercase;
          backdrop-filter: blur(10px);
        }
        .header-actions { display: flex; gap: 0.75rem; }
        .header-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.125rem;
          transition: all 0.2s;
          backdrop-filter: blur(10px);
        }
        .header-btn:hover { background: rgba(255, 255, 255, 0.3); transform: scale(1.1); }
        .header-btn.close { background: rgba(239, 68, 68, 0.3); }
        .header-btn.close:hover { background: #ef4444; }
        .rating-display { display: flex; align-items: center; gap: 0.75rem; }
        .stars-large { color: #f59e0b; font-size: 1.25rem; }
        .rating-score { font-size: 1.5rem; font-weight: 800; color: #1e293b; }
        .rating-count { font-size: 0.875rem; color: #64748b; }
        .quick-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; padding: 1.5rem 2rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .quick-stat { text-align: center; padding: 1rem; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; }
        .quick-stat-value { font-size: 1.75rem; font-weight: 800; color: #1e293b; margin-bottom: 0.25rem; }
        .quick-stat-value.success { color: #10b981; }
        .quick-stat-value.warning { color: #f59e0b; }
        .quick-stat-value.info { color: #3b82f6; }
        .quick-stat-value.purple { color: #8b5cf6; }
        .quick-stat-label { font-size: 0.8rem; color: #64748b; font-weight: 600; text-transform: uppercase; }
        .view-modal-body { flex: 1; overflow-y: auto; padding: 2rem; }
        .tabs-nav { display: flex; gap: 0.5rem; border-bottom: 2px solid #e2e8f0; margin-bottom: 1.5rem; }
        .view-tab-btn {
          padding: 1rem 1.5rem;
          background: none;
          border: none;
          font-family: inherit;
          font-weight: 700;
          font-size: 0.95rem;
          color: #64748b;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .view-tab-btn:hover { color: #25D366; }
        .view-tab-btn.active { color: #25D366; }
        .view-tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 3px;
          background: #25D366;
          border-radius: 3px 3px 0 0;
        }
        .tab-badge { padding: 0.25rem 0.625rem; background: #f8fafc; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
        .view-tab-btn.active .tab-badge { background: #25D366; color: white; }
        .view-tab-content { display: none; animation: fadeIn 0.3s ease; }
        .view-tab-content.active { display: block; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
        .info-card { background: #f8fafc; border-radius: 12px; padding: 1.5rem; border: 1px solid #e2e8f0; }
        .info-card-title { font-size: 0.875rem; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
        .info-card-title i { color: #25D366; }
        .info-row { display: flex; justify-content: space-between; padding: 0.875rem 0; border-bottom: 1px solid #e2e8f0; }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #64748b; font-size: 0.9rem; }
        .info-value { font-weight: 700; color: #1e293b; font-size: 0.9rem; }
        .info-value.highlight { color: #25D366; }
        .contact-item { display: flex; align-items: center; gap: 1rem; padding: 0.875rem 0; border-bottom: 1px solid #e2e8f0; }
        .contact-item:last-child { border-bottom: none; }
        .contact-icon { width: 44px; height: 44px; border-radius: 10px; background: white; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; color: #25D366; border: 1px solid #e2e8f0; }
        .contact-details h4 { font-weight: 700; font-size: 0.95rem; margin-bottom: 0.25rem; }
        .contact-details p { font-size: 0.875rem; color: #64748b; }
        .whatsapp-btn {
          margin-left: auto;
          padding: 0.5rem 1rem;
          background: rgba(37, 211, 102, 0.1);
          color: #25D366;
          border: none;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.8rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }
        .whatsapp-btn:hover { background: #25D366; color: white; }
        .view-modal-footer { padding: 1.5rem 2rem; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .footer-actions-left { display: flex; gap: 0.75rem; }
        .footer-actions-right { display: flex; gap: 0.75rem; }
        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-family: inherit;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        .btn-danger { background: #ef4444; color: white; }
        .btn-danger:hover { background: #dc2626; }
        .btn-success { background: #10b981; color: white; }
        .btn-success:hover { background: #059669; }
        .btn-primary {
          background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
          color: white;
        }
        .btn-secondary { background: #ffffff; color: #1e293b; border: 2px solid #e2e8f0; }
        @media (max-width: 768px) {
          .view-modal-container { max-height: 95vh; border-radius: 12px; }
          .supplier-header { padding: 1.5rem; }
          .supplier-identity { flex-direction: column; text-align: center; }
          .quick-stats { grid-template-columns: repeat(2, 1fr); padding: 1rem; gap: 1rem; }
          .info-grid { grid-template-columns: 1fr; }
          .view-modal-footer { flex-direction: column; gap: 1rem; }
        }
      `}</style>
      <div className="view-modal-container">
        <div className="supplier-header">
          <div className="header-content">
            <div className="header-top">
              <div className="supplier-identity">
                <div className="supplier-logo-large">{categoryLogos.general}</div>
                <div className="supplier-title">
                  <h2>
                    {supplier.name}
                    <span className="verified-badge-large"><i className="fas fa-check"></i></span>
                  </h2>
                  <div className="supplier-meta">
                    <span className="meta-item"><i className="fas fa-box"></i> General</span>
                    <span className="meta-item"><i className="fas fa-map-marker-alt"></i> {supplier.address || "No address"}</span>
                    <span className="meta-item"><i className="fas fa-calendar"></i> Supplier since {supplier.createdAt?.toDate ? supplier.createdAt.toDate().toLocaleDateString() : "Recently"}</span>
                  </div>
                </div>
              </div>
              <div className="header-actions">
                <button className="header-btn" onClick={() => { onClose(); onEdit(supplier); }} title="Edit"><i className="fas fa-edit"></i></button>
                <button className="header-btn" onClick={() => window.open(`https://wa.me/${supplier.phone?.replace(/\D/g, '')}`, '_blank')} title="WhatsApp"><i className="fab fa-whatsapp"></i></button>
                <button className="header-btn close" onClick={onClose} title="Close"><i className="fas fa-times"></i></button>
              </div>
            </div>
            <div className="rating-display">
              <span className="stars-large"><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i></span>
              <span className="rating-score">New</span>
              <span className="rating-count">No reviews yet</span>
              <span className="status-badge-large" style={{ marginLeft: "auto" }}>Active Supplier</span>
            </div>
          </div>
        </div>

        <div className="quick-stats">
          <div className="quick-stat">
            <div className="quick-stat-value success">$0</div>
            <div className="quick-stat-label">Total Spent</div>
          </div>
          <div className="quick-stat">
            <div className="quick-stat-value info">{supplier.products?.length || 0}</div>
            <div className="quick-stat-label">Products</div>
          </div>
          <div className="quick-stat">
            <div className="quick-stat-value purple">0</div>
            <div className="quick-stat-label">Orders</div>
          </div>
          <div className="quick-stat">
            <div className="quick-stat-value warning">-</div>
            <div className="quick-stat-label">On-Time Rate</div>
          </div>
        </div>

        <div className="view-modal-body">
          <div className="tabs-nav">
            <button className={`view-tab-btn ${viewTab === 'overview' ? 'active' : ''}`} onClick={() => setViewTab('overview')}><i className="fas fa-chart-pie"></i> Overview</button>
            <button className={`view-tab-btn ${viewTab === 'products' ? 'active' : ''}`} onClick={() => setViewTab('products')}><i className="fas fa-box"></i> Products <span className="tab-badge">{supplier.products?.length || 0}</span></button>
            <button className={`view-tab-btn ${viewTab === 'orders' ? 'active' : ''}`} onClick={() => setViewTab('orders')}><i className="fas fa-shopping-bag"></i> Orders <span className="tab-badge">0</span></button>
          </div>

          <div className={`view-tab-content ${viewTab === 'overview' ? 'active' : ''}`}>
            <div className="info-grid">
              <div className="info-card">
                <div className="info-card-title"><i className="fas fa-building"></i> Business Information</div>
                <div className="info-row"><span className="info-label">Company Name</span><span className="info-value">{supplier.name}</span></div>
                <div className="info-row"><span className="info-label">Business Type</span><span className="info-value">Wholesale Distributor</span></div>
                <div className="info-row"><span className="info-label">Payment Terms</span><span className="info-value highlight">{getPaymentTermsLabel(supplier.paymentTerms)}</span></div>
              </div>
              <div className="info-card">
                <div className="info-card-title"><i className="fas fa-address-card"></i> Contact Information</div>
                <div className="contact-item">
                  <div className="contact-icon"><i className="fas fa-user"></i></div>
                  <div className="contact-details"><h4>{supplier.contactPerson || "No contact"}</h4><p>Primary Contact</p></div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon"><i className="fas fa-phone"></i></div>
                  <div className="contact-details"><h4>{supplier.phone || "No phone"}</h4><p>Phone</p></div>
                  <button className="whatsapp-btn" onClick={() => window.open(`tel:${supplier.phone}`, '_blank')}><i className="fas fa-phone"></i> Call</button>
                </div>
                <div className="contact-item">
                  <div className="contact-icon" style={{ color: "#25D366" }}><i className="fab fa-whatsapp"></i></div>
                  <div className="contact-details"><h4>{supplier.phone || "No WhatsApp"}</h4><p>WhatsApp Business</p></div>
                  <button className="whatsapp-btn" onClick={() => window.open(`https://wa.me/${supplier.phone?.replace(/\D/g, '')}`, '_blank')}><i className="fab fa-whatsapp"></i> Chat</button>
                </div>
                <div className="contact-item">
                  <div className="contact-icon"><i className="fas fa-envelope"></i></div>
                  <div className="contact-details"><h4>{supplier.email || "No email"}</h4><p>Email Address</p></div>
                </div>
              </div>
              <div className="info-card">
                <div className="info-card-title"><i className="fas fa-map-marked-alt"></i> Address</div>
                <div className="info-row"><span className="info-label">Full Address</span><span className="info-value">{supplier.address || "No address"}</span></div>
              </div>
              <div className="info-card">
                <div className="info-card-title"><i className="fas fa-handshake"></i> Trading Terms</div>
                <div className="info-row"><span className="info-label">Payment Terms</span><span className="info-value">{getPaymentTermsLabel(supplier.paymentTerms)}</span></div>
                <div className="info-row"><span className="info-label">Lead Time</span><span className="info-value">Standard</span></div>
                <div className="info-row"><span className="info-label">Min Order Value</span><span className="info-value">To be discussed</span></div>
              </div>
            </div>
          </div>

          <div className={`view-tab-content ${viewTab === 'products' ? 'active' : ''}`}>
            {supplier.products && supplier.products.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                {supplier.products.map((product, idx) => (
                  <div key={idx} style={{ padding: "0.75rem 1.25rem", background: "white", border: "1px solid #e2e8f0", borderRadius: "8px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <i className="fas fa-box" style={{ color: "#25D366" }}></i>
                    <span style={{ fontWeight: 600 }}>{product}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "3rem", textAlign: "center", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <i className="fas fa-box" style={{ fontSize: "3rem", color: "#64748b", marginBottom: "1rem" }}></i>
                <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>No Products</h3>
                <p style={{ color: "#64748b" }}>No products have been added yet.</p>
              </div>
            )}
          </div>

          <div className={`view-tab-content ${viewTab === 'orders' ? 'active' : ''}`}>
            <div style={{ padding: "3rem", textAlign: "center", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <i className="fas fa-shopping-bag" style={{ fontSize: "3rem", color: "#64748b", marginBottom: "1rem" }}></i>
              <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>No Orders</h3>
              <p style={{ color: "#64748b" }}>No purchase orders with this supplier yet.</p>
              <button className="btn btn-primary" style={{ marginTop: "1rem" }}><i className="fas fa-plus"></i> Create PO</button>
            </div>
          </div>
        </div>

        <div className="view-modal-footer">
          <div className="footer-actions-left">
            <button className="btn btn-secondary" onClick={() => { if(confirm("Are you sure you want to delete this supplier?")) { onDelete(supplier.id); onClose(); } }}>
              <i className="fas fa-trash"></i> Delete
            </button>
          </div>
          <div className="footer-actions-right">
            <button className="btn btn-success" onClick={() => window.open(`https://wa.me/${supplier.phone?.replace(/\D/g, '')}`, '_blank')}>
              <i className="fab fa-whatsapp"></i> WhatsApp
            </button>
            <button className="btn btn-primary" onClick={() => { onClose(); onEdit(supplier); }}>
              <i className="fas fa-edit"></i> Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
