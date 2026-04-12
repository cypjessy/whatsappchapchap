"use client";

import { Shipment } from "@/lib/db";
import { statusLabels } from "./types";

interface TrackingModalProps {
  isOpen: boolean;
  shipment: Shipment | null;
  onClose: () => void;
  onUpdateStatus?: (shipment: Shipment, newStatus: string) => void;
}

export function TrackingModal({ isOpen, shipment, onClose, onUpdateStatus }: TrackingModalProps) {
  if (!isOpen || !shipment) return null;

  const getDateString = (date: any) => {
    if (!date) return "N/A";
    if (date.toDate && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString();
    }
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    return String(date);
  };

  const timelineEvents = [
    { status: "created", label: "Shipment Created", completed: true, location: "Nairobi, Kenya • Seller Warehouse", time: getDateString(shipment.createdAt) },
    { status: "picked", label: "Package Picked Up", completed: shipment.status === "shipped" || shipment.status === "delivered", location: "Collected by driver", time: getDateString(shipment.createdAt) },
    { status: "sorting", label: "Arrived at Sorting Facility", completed: shipment.status === "shipped" || shipment.status === "delivered", location: "Nairobi Hub", time: getDateString(shipment.createdAt) },
    { status: "transit", label: "Out for Delivery", completed: shipment.status === "shipped", current: shipment.status === "shipped", location: "Driver en route to customer", time: "Today" },
    { status: "delivered", label: "Delivered", completed: shipment.status === "delivered", location: "Awaiting confirmation", time: "Expected today" },
  ];

  const carrier = {
    name: "Sendy",
    icon: "S",
    color: "#00d384",
    driver: "John Mwangi",
    vehicle: "KBA 123X",
  };

  const handleNotifyCustomer = () => {
    const message = encodeURIComponent(`Hello ${shipment.customerName || 'Customer'}! Your order #${shipment.orderId} is out for delivery. Track: ${shipment.trackingNumber || 'WS-2026-00000'}`);
    window.open(`https://wa.me/${shipment.customerPhone?.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <style jsx>{`
        .modal-overlay {
          display: flex;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(8px);
          z-index: 1000;
          padding: 2rem;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .modal {
          background: #ffffff;
          border-radius: 20px;
          width: 100%;
          max-width: 1100px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
        }
        @keyframes slideUp { from { transform: translateY(30px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        .modal-header {
          background: linear-gradient(135deg, #10b981 0%, #00C853 100%);
          color: white;
          padding: 1.5rem 2rem;
          position: relative;
          overflow: hidden;
        }
        .modal-header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: 300px;
          height: 300px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
        }
        .header-content {
          position: relative;
          z-index: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header-left { display: flex; align-items: center; gap: 1.5rem; }
        .shipment-icon {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
        }
        .shipment-title h2 {
          font-size: 1.5rem;
          font-weight: 800;
          margin-bottom: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .tracking-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 1rem;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          font-family: 'Courier New', monospace;
          letter-spacing: 1px;
        }
        .header-actions { display: flex; gap: 0.75rem; }
        .header-btn {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          border: none;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          cursor: pointer;
          font-size: 1.1rem;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .header-btn:hover { background: rgba(255, 255, 255, 0.3); transform: translateY(-2px); }
        .status-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 2rem;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .status-left { display: flex; align-items: center; gap: 1rem; }
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 1.25rem;
          background: rgba(16, 185, 129, 0.1);
          border: 2px solid #10b981;
          border-radius: 30px;
        }
        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #10b981;
          animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        .status-text {
          font-weight: 700;
          color: #10b981;
          text-transform: uppercase;
          font-size: 0.875rem;
        }
        .eta-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          background: white;
          border-radius: 30px;
          font-size: 0.9rem;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }
        .eta-badge strong { color: #1e293b; }
        .status-right { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .action-pill {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 30px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-pill:hover { border-color: #3b82f6; color: #3b82f6; }
        .action-pill.whatsapp { background: rgba(37, 211, 102, 0.1); border-color: #25D366; color: #25D366; }
        .action-pill.whatsapp:hover { background: #25D366; color: white; }
        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
          background: #f8fafc;
        }
        .content-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 2rem;
        }
        @media (max-width: 968px) { .content-grid { grid-template-columns: 1fr; } }
        .left-column, .right-column { display: flex; flex-direction: column; gap: 1.5rem; }
        .card {
          background: white;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .card-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .card-title { font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; gap: 0.75rem; }
        .card-title i { color: #3b82f6; }
        .live-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0.875rem;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .live-dot { width: 8px; height: 8px; border-radius: 50%; background: #ef4444; animation: blink 1s infinite; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .map-container {
          height: 200px;
          background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 1.5rem 1.5rem;
          position: relative;
        }
        .route-line { position: absolute; top: 50%; left: 10%; right: 10%; height: 4px; background: #3b82f6; border-radius: 2px; transform: translateY(-50%); }
        .route-dot {
          position: absolute;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          border: 3px solid white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          top: 50%;
          transform: translateY(-50%);
        }
        .route-dot.start { left: 10%; }
        .route-dot.end { right: 10%; background: #10b981; }
        .route-dot.current { left: 60%; background: #f59e0b; animation: pulse 2s infinite; }
        .map-placeholder {
          text-align: center;
          color: #64748b;
          position: relative;
          z-index: 1;
          background: rgba(255,255,255,0.9);
          padding: 1rem;
          border-radius: 10px;
        }
        .map-placeholder i { font-size: 3rem; margin-bottom: 0.5rem; color: #3b82f6; }
        .timeline { padding: 1.5rem; position: relative; }
        .timeline::before {
          content: '';
          position: absolute;
          left: 2rem;
          top: 1.5rem;
          bottom: 1.5rem;
          width: 3px;
          background: #e2e8f0;
          border-radius: 3px;
        }
        .timeline-item { display: flex; gap: 1.25rem; padding-bottom: 1.5rem; position: relative; }
        .timeline-item:last-child { padding-bottom: 0; }
        .timeline-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #10b981;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          position: relative;
          z-index: 1;
          flex-shrink: 0;
          border: 3px solid white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .timeline-item.current .timeline-icon { background: #3b82f6; animation: bounce 2s infinite; }
        .timeline-item.pending .timeline-icon { background: #e2e8f0; color: #64748b; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .timeline-content { flex: 1; padding-top: 0.5rem; }
        .timeline-status { font-weight: 700; font-size: 1rem; color: #1e293b; margin-bottom: 0.25rem; }
        .timeline-item.current .timeline-status { color: #3b82f6; }
        .timeline-location { font-size: 0.9rem; color: #64748b; margin-bottom: 0.25rem; }
        .timeline-time { font-size: 0.8rem; color: #64748b; font-weight: 600; }
        .timeline-item.current .timeline-time { color: #3b82f6; }
        .details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; padding: 1.5rem; }
        @media (max-width: 600px) { .details-grid { grid-template-columns: 1fr; } }
        .detail-item { display: flex; flex-direction: column; gap: 0.5rem; }
        .detail-label { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; }
        .detail-value { font-weight: 700; font-size: 1rem; color: #1e293b; display: flex; align-items: center; gap: 0.5rem; }
        .detail-value i { color: #3b82f6; }
        .activity-card { background: white; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); padding: 1.5rem; }
        .activity-list { display: flex; flex-direction: column; gap: 1rem; }
        .activity-item { display: flex; gap: 1rem; padding: 0.875rem; background: #f8fafc; border-radius: 8px; }
        .activity-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          flex-shrink: 0;
        }
        .activity-icon.whatsapp { color: #25D366; }
        .activity-icon.system { color: #3b82f6; }
        .activity-icon.user { color: #8b5cf6; }
        .activity-text { font-size: 0.9rem; color: #1e293b; line-height: 1.5; }
        .activity-time { font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; }
        .order-list-sm { padding: 0 1.5rem 1.5rem; }
        .order-item-sm { display: flex; align-items: center; gap: 1rem; padding: 1rem; border-bottom: 1px solid #e2e8f0; transition: all 0.2s; border-radius: 8px; }
        .order-item-sm:last-child { border-bottom: none; }
        .order-item-sm:hover { background: #f8fafc; }
        .order-thumb {
          width: 50px;
          height: 50px;
          border-radius: 10px;
          background: linear-gradient(135deg, #DCF8C6 0%, #e0e7ff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          flex-shrink: 0;
        }
        .order-info-sm { flex: 1; }
        .order-id-sm { font-weight: 700; color: #3b82f6; font-size: 0.95rem; }
        .order-customer-sm { font-size: 0.875rem; color: #64748b; margin-top: 0.25rem; }
        .order-action {
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
        .order-action:hover { background: #3b82f6; color: white; }
        .customer-header {
          padding: 1.5rem;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .customer-avatar-lg {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.5rem;
          font-weight: 700;
        }
        .customer-info-lg h4 { font-weight: 700; font-size: 1.1rem; margin-bottom: 0.25rem; }
        .customer-info-lg span { font-size: 0.875rem; color: #64748b; }
        .customer-body { padding: 1.5rem; }
        .contact-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.875rem;
          background: #f8fafc;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .contact-item:hover { background: rgba(37, 211, 102, 0.1); }
        .contact-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #25D366;
          font-size: 1.1rem;
        }
        .contact-details { flex: 1; }
        .contact-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; font-weight: 700; }
        .contact-value { font-weight: 600; color: #1e293b; font-size: 0.95rem; }
        .contact-arrow { color: #64748b; }
        .address-card { background: white; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); padding: 1.5rem; }
        .address-title {
          font-weight: 700;
          font-size: 0.9rem;
          text-transform: uppercase;
          color: #64748b;
          letter-spacing: 0.05em;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .address-content { display: flex; gap: 1rem; }
        .address-icon {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
        }
        .address-text { font-size: 0.95rem; line-height: 1.6; color: #1e293b; }
        .carrier-card { background: white; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); padding: 1.5rem; }
        .carrier-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; }
        .carrier-logo-sm {
          width: 50px;
          height: 50px;
          border-radius: 10px;
          background: #00d384;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
        }
        .carrier-name-sm { font-weight: 700; font-size: 1.1rem; }
        .carrier-rating { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #64748b; margin-top: 0.25rem; }
        .carrier-rating i { color: #f59e0b; }
        .carrier-details { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        .carrier-detail { display: flex; flex-direction: column; gap: 0.25rem; }
        .carrier-detail-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; font-weight: 700; }
        .carrier-detail-value { font-weight: 700; color: #1e293b; }
        .modal-footer {
          padding: 1.5rem 2rem;
          background: white;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .footer-info { display: flex; align-items: center; gap: 0.75rem; color: #64748b; font-size: 0.9rem; }
        .footer-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .btn {
          padding: 0.875rem 1.75rem;
          border-radius: 8px;
          font-family: inherit;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        .btn-secondary { background: #f8fafc; color: #1e293b; border: 2px solid #e2e8f0; }
        .btn-secondary:hover { border-color: #3b82f6; color: #3b82f6; }
        .btn-primary { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4); }
        .btn-danger { background: #ef4444; color: white; }
        .btn-whatsapp { background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: white; }
      `}</style>

      <div className="modal">
        <div className="modal-header">
          <div className="header-content">
            <div className="header-left">
              <div className="shipment-icon">
                <i className="fas fa-shipping-fast"></i>
              </div>
              <div className="shipment-title">
                <h2>
                  Shipment Details
                  <span style={{ fontSize: "0.875rem", fontWeight: 500, opacity: 0.9 }}>| {getDateString(shipment.createdAt)}</span>
                </h2>
                <div className="tracking-badge">
                  <i className="fas fa-barcode"></i>
                  {shipment.trackingNumber || "WS-2026-00000"}
                </div>
              </div>
            </div>
            <div className="header-actions">
              <button className="header-btn" onClick={() => window.print()} title="Print">
                <i className="fas fa-print"></i>
              </button>
              <button className="header-btn" onClick={onClose} title="Close">
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>

        <div className="status-bar">
          <div className="status-left">
            <div className="status-indicator">
              <div className="status-dot"></div>
              <span className="status-text">{statusLabels[shipment.status] || shipment.status}</span>
            </div>
            <div className="eta-badge">
              <i className="fas fa-clock"></i>
              Estimated delivery: <strong>Today</strong>
            </div>
          </div>
          <div className="status-right">
            <button className="action-pill" onClick={() => window.open('https://sendyit.com', '_blank')}>
              <i className="fas fa-external-link-alt"></i>
              Track on {carrier.name}
            </button>
            <button className="action-pill whatsapp" onClick={handleNotifyCustomer}>
              <i className="fab fa-whatsapp"></i>
              Notify Customer
            </button>
          </div>
        </div>

        <div className="modal-body">
          <div className="content-grid">
            <div className="left-column">
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <i className="fas fa-route"></i>
                    Tracking History
                  </div>
                  <div className="live-badge">
                    <div className="live-dot"></div>
                    Live Updates
                  </div>
                </div>
                
                <div className="map-container">
                  <div className="route-line"></div>
                  <div className="route-dot start"></div>
                  <div className="route-dot current"></div>
                  <div className="route-dot end"></div>
                  <div className="map-placeholder">
                    <i className="fas fa-map-marked-alt"></i>
                    <div style={{ fontWeight: 700, marginTop: "0.5rem" }}>Live Tracking Map</div>
                    <div style={{ fontSize: "0.875rem" }}>Driver en route</div>
                  </div>
                </div>

                <div className="timeline">
                  {timelineEvents.map((event, idx) => (
                    <div key={idx} className={`timeline-item ${event.current ? 'current' : ''} ${!event.completed ? 'pending' : ''}`}>
                      <div className="timeline-icon">
                        {event.completed ? <i className="fas fa-check"></i> : <i className="fas fa-clock"></i>}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-status">{event.label}</div>
                        <div className="timeline-location">{event.location}</div>
                        <div className="timeline-time">{event.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <i className="fas fa-info-circle"></i>
                    Shipment Details
                  </div>
                </div>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Carrier</span>
                    <span className="detail-value">
                      <i className="fas fa-truck"></i>
                      {carrier.name}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Service Type</span>
                    <span className="detail-value">
                      <i className="fas fa-shipping-fast"></i>
                      Express Delivery
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Weight</span>
                    <span className="detail-value">
                      <i className="fas fa-weight-hanging"></i>
                      2.5 kg
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Dimensions</span>
                    <span className="detail-value">
                      <i className="fas fa-ruler-combined"></i>
                      30 × 20 × 15 cm
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Packages</span>
                    <span className="detail-value">
                      <i className="fas fa-box"></i>
                      1 box
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Insurance</span>
                    <span className="detail-value">
                      <i className="fas fa-shield-alt"></i>
                      $500 covered
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Shipping Cost</span>
                    <span className="detail-value" style={{ color: "#10b981" }}>
                      <i className="fas fa-dollar-sign"></i>
                      $8.50
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Payment Status</span>
                    <span className="detail-value" style={{ color: "#10b981" }}>
                      <i className="fas fa-check-circle"></i>
                      Paid
                    </span>
                  </div>
                </div>
              </div>

              <div className="activity-card">
                <div className="card-title" style={{ marginBottom: "1rem" }}>
                  <i className="fas fa-history"></i>
                  Activity Log
                </div>
                <div className="activity-list">
                  <div className="activity-item">
                    <div className="activity-icon whatsapp">
                      <i className="fab fa-whatsapp"></i>
                    </div>
                    <div className="activity-content">
                      <div className="activity-text">
                        WhatsApp notification sent to customer: "Your order is out for delivery!"
                      </div>
                      <div className="activity-time">3:48 PM • Automated</div>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon system">
                      <i className="fas fa-robot"></i>
                    </div>
                    <div className="activity-content">
                      <div className="activity-text">
                        Status updated to "Out for Delivery" via carrier API
                      </div>
                      <div className="activity-time">3:48 PM • System</div>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon user">
                      <i className="fas fa-user"></i>
                    </div>
                    <div className="activity-content">
                      <div className="activity-text">
                        Shipment created by seller
                      </div>
                      <div className="activity-time">10:30 AM • Manual</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="right-column">
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <i className="fas fa-shopping-bag"></i>
                    Orders (1)
                  </div>
                </div>
                <div className="order-list-sm">
                  <div className="order-item-sm">
                    <div className="order-thumb">📦</div>
                    <div className="order-info-sm">
                      <div className="order-id-sm">#{shipment.orderId}</div>
                      <div className="order-customer-sm">{shipment.customerName || "Customer"} • $567.00</div>
                    </div>
                    <button className="order-action" title="View Order">
                      <i className="fas fa-eye"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="customer-header">
                  <div className="customer-avatar-lg">
                    {shipment.customerName?.split(" ").map(n => n[0]).join("").slice(0, 2) || "XX"}
                  </div>
                  <div className="customer-info-lg">
                    <h4>{shipment.customerName || "Customer"}</h4>
                    <span>Primary recipient</span>
                  </div>
                </div>
                <div className="customer-body">
                  <div className="contact-item" onClick={() => window.location.href = `tel:${shipment.customerPhone}`}>
                    <div className="contact-icon">
                      <i className="fas fa-phone"></i>
                    </div>
                    <div className="contact-details">
                      <div className="contact-label">Phone</div>
                      <div className="contact-value">{shipment.customerPhone || "+254 712 345 678"}</div>
                    </div>
                    <i className="fas fa-chevron-right contact-arrow"></i>
                  </div>
                  <div className="contact-item" onClick={() => window.open(`https://wa.me/${shipment.customerPhone?.replace(/\D/g, '')}`, '_blank')} style={{ marginTop: "0.75rem" }}>
                    <div className="contact-icon">
                      <i className="fab fa-whatsapp"></i>
                    </div>
                    <div className="contact-details">
                      <div className="contact-label">WhatsApp</div>
                      <div className="contact-value">{shipment.customerPhone || "+254 712 345 678"}</div>
                    </div>
                    <i className="fas fa-chevron-right contact-arrow"></i>
                  </div>
                  <div className="contact-item" style={{ marginTop: "0.75rem" }}>
                    <div className="contact-icon">
                      <i className="fas fa-envelope"></i>
                    </div>
                    <div className="contact-details">
                      <div className="contact-label">Email</div>
                      <div className="contact-value">customer@email.com</div>
                    </div>
                    <i className="fas fa-chevron-right contact-arrow"></i>
                  </div>
                </div>
              </div>

              <div className="address-card">
                <div className="address-title">
                  <i className="fas fa-map-marker-alt"></i>
                  Delivery Address
                </div>
                <div className="address-content">
                  <div className="address-icon">
                    <i className="fas fa-home"></i>
                  </div>
                  <div className="address-text">
                    <strong>{shipment.customerName || "Customer"}</strong><br />
                    {shipment.shippingAddress || "123 Street Address, City"}<br />
                    Kenya<br />
                    <span style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.5rem", display: "block" }}>
                      Landmark: Near landmark
                    </span>
                  </div>
                </div>
              </div>

              <div className="carrier-card">
                <div className="carrier-header">
                  <div className="carrier-logo-sm">{carrier.icon}</div>
                  <div>
                    <div className="carrier-name-sm">{carrier.name}</div>
                    <div className="carrier-rating">
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star-half-alt"></i>
                      <span>4.8</span>
                    </div>
                  </div>
                </div>
                <div className="carrier-details">
                  <div className="carrier-detail">
                    <span className="carrier-detail-label">Driver</span>
                    <span className="carrier-detail-value">{carrier.driver}</span>
                  </div>
                  <div className="carrier-detail">
                    <span className="carrier-detail-label">Vehicle</span>
                    <span className="carrier-detail-value">{carrier.vehicle}</span>
                  </div>
                  <div className="carrier-detail">
                    <span className="carrier-detail-label">Driver Phone</span>
                    <span className="carrier-detail-value" style={{ color: "#25D366", cursor: "pointer" }}>
                      <i className="fas fa-phone"></i> Call
                    </span>
                  </div>
                  <div className="carrier-detail">
                    <span className="carrier-detail-label">Support</span>
                    <span className="carrier-detail-value" style={{ color: "#3b82f6", cursor: "pointer" }}>
                      <i className="fas fa-headset"></i> Get Help
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="footer-info">
            <i className="fas fa-shield-alt" style={{ color: "#10b981" }}></i>
            <span>Fully insured • Real-time tracking • WhatsApp notifications enabled</span>
          </div>
          <div className="footer-actions">
            <button className="btn btn-secondary">
              <i className="fas fa-edit"></i>
              Edit
            </button>
            <button className="btn btn-danger">
              <i className="fas fa-times"></i>
              Cancel
            </button>
            <button className="btn btn-whatsapp" onClick={handleNotifyCustomer}>
              <i className="fab fa-whatsapp"></i>
              Notify
            </button>
            <button className="btn btn-primary" onClick={() => window.print()}>
              <i className="fas fa-print"></i>
              Reprint Label
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
