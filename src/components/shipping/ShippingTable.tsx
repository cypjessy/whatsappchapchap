"use client";

import { Shipment } from "@/lib/db";
import { statusLabels } from "./types";

interface ShippingTableProps {
  shipments: Shipment[];
  onView: (shipment: Shipment) => void;
  onPrint: (shipment: Shipment) => void;
  onWhatsApp: (shipment: Shipment) => void;
  onAssign: (shipment: Shipment) => void;
  bulkMode?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
}

export function ShippingTable({ 
  shipments, 
  onView, 
  onPrint, 
  onWhatsApp, 
  onAssign,
  bulkMode = false,
  selectedIds = [],
  onToggleSelect
}: ShippingTableProps) {
  const getStatusClass = (status: string) => {
    const classes: Record<string, string> = {
      pending: "status-badge status-pending",
      shipped: "status-badge status-shipped",
      delivered: "status-badge status-delivered",
      returned: "status-badge status-cancelled",
    };
    return classes[status] || "status-badge";
  };

  const getDateString = (date: any) => {
    if (!date) return "N/A";
    if (date.toDate && typeof date.toDate === 'function') {
      return date.toDate().toLocaleString();
    }
    if (date instanceof Date) {
      return date.toLocaleString();
    }
    return String(date);
  };

  const getEtaDisplay = (shipment: Shipment) => {
    if (shipment.status === "delivered") {
      return (
        <span style={{ color: "#10b981" }}>
          <i className="fas fa-check-circle"></i> Delivered
        </span>
      );
    }
    const createdDate = getDateString(shipment.createdAt);
    return (
      <div>
        <div>{shipment.status === "pending" ? "Pending" : "In Progress"}</div>
        <div className="eta-date">{createdDate}</div>
      </div>
    );
  };

  if (shipments.length === 0) {
    return (
      <div className="shipping-container">
        <style jsx>{`
          .shipping-container { background: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; overflow: hidden; }
          .empty-state { text-align: center; padding: 3rem 1.5rem; }
        `}</style>
        <div className="empty-state">
          <i className="fas fa-shipping-fast" style={{ fontSize: "3rem", color: "#64748b", marginBottom: "1rem", display: "block" }}></i>
          <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>No shipments found</h3>
          <p style={{ color: "#64748b" }}>Create your first shipment to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shipping-container">
      <style jsx>{`
        .shipping-container {
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }
        @media (max-width: 768px) { .shipping-container { border-radius: 12px; } }
        .table-header { padding: 1rem 1.25rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .table-title { font-weight: 700; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; }
        .desktop-table { display: table; width: 100%; border-collapse: collapse; }
        @media (max-width: 768px) { .desktop-table { display: none; } }
        .mobile-cards { display: none; }
        @media (max-width: 768px) { .mobile-cards { display: block; padding: 0.5rem; } }
        .shipping-table th { background: #f8fafc; padding: 0.75rem 1rem; text-align: left; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; white-space: nowrap; }
        .shipping-table td { padding: 1rem; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; }
        .shipping-table tr:hover td { background: rgba(37, 211, 102, 0.02); }
        .order-cell { display: flex; align-items: center; gap: 1rem; }
        .order-icon { width: 40px; height: 40px; border-radius: 8px; background: linear-gradient(135deg, #DCF8C6 0%, #e0e7ff 100%); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0; }
        .order-info h4 { font-weight: 700; font-size: 0.9rem; margin-bottom: 0.25rem; }
        .order-meta { font-size: 0.75rem; color: #64748b; }
        .customer-cell { display: flex; align-items: center; gap: 0.75rem; }
        .customer-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.75rem; flex-shrink: 0; }
        .customer-info h4 { font-weight: 700; font-size: 0.85rem; margin-bottom: 0.25rem; }
        .customer-info span { font-size: 0.75rem; color: #64748b; display: flex; align-items: center; gap: 0.25rem; }
        .address-cell { max-width: 180px; }
        .address-text { font-size: 0.85rem; color: #1e293b; line-height: 1.4; }
        .delivery-type { display: inline-flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; font-size: 0.75rem; color: #64748b; }
        .status-badge { padding: 0.375rem 0.75rem; border-radius: 20px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; display: inline-flex; align-items: center; gap: 0.375rem; }
        .status-badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; }
        .status-pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .status-pending::before { background: #f59e0b; }
        .status-shipped { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .status-shipped::before { background: #3b82f6; }
        .status-delivered { background: rgba(37, 211, 102, 0.1); color: #10b981; }
        .status-delivered::before { background: #10b981; }
        .status-cancelled { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .status-cancelled::before { background: #ef4444; }
        .tracking-number { font-weight: 700; color: #25D366; font-family: monospace; font-size: 0.8rem; cursor: pointer; }
        .carrier-info { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; font-size: 0.75rem; color: #64748b; }
        .carrier-logo { width: 20px; height: 20px; border-radius: 4px; background: #f8fafc; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; font-weight: 700; }
        .eta-cell { font-weight: 700; font-size: 0.85rem; }
        .eta-date { font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; }
        .actions-cell { display: flex; gap: 0.375rem; }
        .action-btn { width: 32px; height: 32px; border-radius: 6px; border: none; background: #f8fafc; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .action-btn:hover { background: #25D366; color: white; }
        .action-btn.whatsapp { background: rgba(37, 211, 102, 0.1); color: #25D366; }
        .action-btn.whatsapp:hover { background: #25D366; color: white; }
        .btn { padding: 0.375rem 0.75rem; border-radius: 6px; font-family: inherit; font-weight: 700; font-size: 0.75rem; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 0.375rem; }
        .btn-primary { background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: white; }
        /* Mobile Card Styles */
        .shipment-card { background: white; border-radius: 12px; padding: 1rem; margin-bottom: 0.75rem; border: 1px solid #e2e8f0; }
        .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
        .card-order { display: flex; align-items: center; gap: 0.75rem; }
        .card-customer { display: flex; align-items: center; gap: 0.625rem; margin-bottom: 0.75rem; }
        .card-row { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.85rem; }
        .card-row-label { color: #64748b; }
        .card-row-value { font-weight: 600; font-size: 0.85rem; }
        .card-actions { display: flex; gap: 0.5rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #e2e8f0; }
        .card-actions .action-btn { flex: 1; justify-content: center; width: auto; height: 36px; }
      `}</style>
      <div className="table-header">
        <div className="table-title">
          <i className="fas fa-list" style={{ color: "#3b82f6" }}></i>
          Shipments
          <span style={{ color: "#64748b", fontWeight: 500, marginLeft: "0.5rem" }}>({shipments.length} orders)</span>
        </div>
      </div>
      <table className="desktop-table shipping-table">
        <thead>
          <tr>
            {bulkMode && <th style={{ width: '50px' }}><input type="checkbox" disabled /></th>}
            <th>Order</th>
            <th>Customer</th>
            <th>Delivery Address</th>
            <th>Status</th>
            <th>Tracking</th>
            <th>ETA</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((shipment) => (
            <tr key={shipment.id} style={bulkMode && selectedIds.includes(shipment.id) ? { backgroundColor: '#dcfce7' } : {}}>
              {bulkMode && (
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(shipment.id)}
                    onChange={() => onToggleSelect?.(shipment.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-5 h-5 rounded border-[#e2e8f0] text-[#25D366] focus:ring-[#25D366]"
                  />
                </td>
              )}
              <td>
                <div className="order-cell">
                  <div className="order-icon">📦</div>
                  <div className="order-info">
                    <h4>{shipment.orderId}</h4>
                    <div className="order-meta">{getDateString(shipment.createdAt)}</div>
                  </div>
                </div>
              </td>
              <td>
                <div className="customer-cell">
                  <div className="customer-avatar">
                    {shipment.customerName?.split(" ").map(n => n[0]).join("").slice(0, 2) || "XX"}
                  </div>
                  <div className="customer-info">
                    <h4>{shipment.customerName || "N/A"}</h4>
                    <span><i className="fab fa-whatsapp" style={{ color: "#25D366" }}></i> {shipment.customerPhone || "N/A"}</span>
                  </div>
                </div>
              </td>
              <td className="address-cell">
                <div className="address-text">{shipment.shippingMethod || "Standard Delivery"}</div>
                <div className="delivery-type">
                  <i className="fas fa-truck"></i>
                  Via {shipment.shippingMethod || " courier"}
                </div>
              </td>
              <td>
                <span className={getStatusClass(shipment.status)}>{statusLabels[shipment.status] || shipment.status}</span>
              </td>
              <td className="tracking-cell">
                {shipment.trackingNumber ? (
                  <>
                    <div className="tracking-number">{shipment.trackingNumber}</div>
                    <div className="carrier-info">
                      <div className="carrier-logo">XX</div>
                      <span>Pending</span>
                    </div>
                  </>
                ) : (
                  <button className="btn btn-primary" onClick={() => onAssign(shipment)}>
                    <i className="fas fa-user-plus"></i> Assign
                  </button>
                )}
              </td>
              <td className="eta-cell">{getEtaDisplay(shipment)}</td>
              <td>
                <div className="actions-cell">
                  <button className="action-btn" onClick={() => onView(shipment)} title="View"><i className="fas fa-eye"></i></button>
                  <button className="action-btn" onClick={() => onPrint(shipment)} title="Print Label"><i className="fas fa-print"></i></button>
                  <button className="action-btn whatsapp" onClick={() => onWhatsApp(shipment)} title="WhatsApp"><i className="fab fa-whatsapp"></i></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mobile-cards">
        {shipments.map((shipment) => (
          <div key={shipment.id} className="shipment-card" style={bulkMode && selectedIds.includes(shipment.id) ? { border: '2px solid #25D366', backgroundColor: '#dcfce7' } : {}}>
            {bulkMode && (
              <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(shipment.id)}
                  onChange={() => onToggleSelect?.(shipment.id)}
                  className="w-5 h-5 rounded border-[#e2e8f0] text-[#25D366] focus:ring-[#25D366]"
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Select</span>
              </div>
            )}
            <div className="card-header">
              <div className="card-order">
                <div className="order-icon">📦</div>
                <div className="order-info">
                  <h4 style={{ fontWeight: 700, fontSize: "0.9rem" }}>{shipment.orderId}</h4>
                  <div className="order-meta">{getDateString(shipment.createdAt)}</div>
                </div>
              </div>
              <span className={getStatusClass(shipment.status)}>{statusLabels[shipment.status] || shipment.status}</span>
            </div>
            <div className="card-customer">
              <div className="customer-avatar">
                {shipment.customerName?.split(" ").map(n => n[0]).join("").slice(0, 2) || "XX"}
              </div>
              <div className="customer-info">
                <h4>{shipment.customerName || "N/A"}</h4>
                <span><i className="fab fa-whatsapp" style={{ color: "#25D366" }}></i> {shipment.customerPhone || "N/A"}</span>
              </div>
            </div>
            <div className="card-row">
              <span className="card-row-label">Delivery:</span>
              <span className="card-row-value">{shipment.shippingMethod || "Standard"}</span>
            </div>
            <div className="card-row">
              <span className="card-row-label">Tracking:</span>
              <span className="card-row-value" style={{ color: "#25D366" }}>{shipment.trackingNumber || "—"}</span>
            </div>
            <div className="card-row">
              <span className="card-row-label">ETA:</span>
              <span className="card-row-value">{getDateString(shipment.createdAt)}</span>
            </div>
            <div className="card-actions">
              <button className="action-btn" onClick={() => onView(shipment)}><i className="fas fa-eye"></i> View</button>
              <button className="action-btn" onClick={() => onPrint(shipment)}><i className="fas fa-print"></i> Print</button>
              <button className="action-btn whatsapp" onClick={() => onWhatsApp(shipment)}><i className="fab fa-whatsapp"></i> WhatsApp</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
