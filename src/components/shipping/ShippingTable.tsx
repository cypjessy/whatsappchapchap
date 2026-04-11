"use client";

import { Shipment } from "@/lib/db";
import { statusLabels } from "./types";

interface ShippingTableProps {
  shipments: Shipment[];
  onView: (shipment: Shipment) => void;
  onPrint: (shipment: Shipment) => void;
  onWhatsApp: (shipment: Shipment) => void;
  onAssign: (shipment: Shipment) => void;
}

export function ShippingTable({ shipments, onView, onPrint, onWhatsApp, onAssign }: ShippingTableProps) {
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
        .table-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .table-title {
          font-weight: 700;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .table-container { overflow-x: auto; }
        .shipping-table { width: 100%; border-collapse: collapse; }
        .shipping-table th {
          background: #f8fafc;
          padding: 1rem 1.25rem;
          text-align: left;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          border-bottom: 2px solid #e2e8f0;
          white-space: nowrap;
        }
        .shipping-table td { padding: 1.25rem; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; }
        .shipping-table tr:hover td { background: rgba(37, 211, 102, 0.02); }
        .order-cell { display: flex; align-items: center; gap: 1rem; }
        .order-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          background: linear-gradient(135deg, #DCF8C6 0%, #e0e7ff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          flex-shrink: 0;
        }
        .order-info h4 { font-weight: 700; font-size: 0.95rem; margin-bottom: 0.25rem; }
        .order-meta { font-size: 0.8rem; color: #64748b; }
        .customer-cell { display: flex; align-items: center; gap: 0.75rem; }
        .customer-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 0.9rem;
        }
        .customer-info h4 { font-weight: 700; font-size: 0.9rem; margin-bottom: 0.25rem; }
        .customer-info span { font-size: 0.8rem; color: #64748b; display: flex; align-items: center; gap: 0.25rem; }
        .address-cell { max-width: 200px; }
        .address-text { font-size: 0.9rem; color: #1e293b; line-height: 1.5; }
        .delivery-type {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
          font-size: 0.8rem;
          color: #64748b;
        }
        .status-badge {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        .status-badge::before { content: ''; width: 8px; height: 8px; border-radius: 50%; }
        .status-pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .status-pending::before { background: #f59e0b; }
        .status-shipped { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .status-shipped::before { background: #3b82f6; }
        .status-delivered { background: rgba(37, 211, 102, 0.1); color: #10b981; }
        .status-delivered::before { background: #10b981; }
        .status-cancelled { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .status-cancelled::before { background: #ef4444; }
        .tracking-cell { min-width: 150px; }
        .tracking-number { font-weight: 700; color: #25D366; font-family: monospace; font-size: 0.9rem; cursor: pointer; }
        .carrier-info { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; font-size: 0.8rem; color: #64748b; }
        .carrier-logo { width: 24px; height: 24px; border-radius: 4px; background: #f8fafc; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; }
        .eta-cell { font-weight: 700; }
        .eta-urgent { color: #ef4444; }
        .eta-date { font-size: 0.8rem; color: #64748b; margin-top: 0.25rem; }
        .actions-cell { display: flex; gap: 0.5rem; }
        .action-btn {
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
          transition: all 0.2s;
        }
        .action-btn:hover { background: #25D366; color: white; }
        .action-btn.whatsapp { background: rgba(37, 211, 102, 0.1); color: #25D366; }
        .action-btn.whatsapp:hover { background: #25D366; color: white; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .btn { padding: 0.5rem 1rem; border-radius: 8px; font-family: inherit; font-weight: 700; font-size: 0.875rem; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 0.5rem; }
        .btn-primary { background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: white; }
      `}</style>
      <div className="table-header">
        <div className="table-title">
          <i className="fas fa-list" style={{ color: "#3b82f6" }}></i>
          Shipments
          <span style={{ color: "#64748b", fontWeight: 500, marginLeft: "0.5rem" }}>({shipments.length} orders)</span>
        </div>
      </div>
      <div className="table-container">
        <table className="shipping-table">
          <thead>
            <tr>
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
            {shipments.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "3rem" }}>
                  <i className="fas fa-shipping-fast" style={{ fontSize: "3rem", color: "#64748b", marginBottom: "1rem" }}></i>
                  <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>No shipments found</h3>
                  <p style={{ color: "#64748b" }}>Create your first shipment to get started.</p>
                </td>
              </tr>
            ) : (
              shipments.map((shipment) => (
                <tr key={shipment.id}>
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
