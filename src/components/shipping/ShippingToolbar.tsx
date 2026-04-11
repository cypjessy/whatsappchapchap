"use client";

import { ShippingToolbarProps } from "./types";

export function ShippingToolbar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  carrierFilter,
  onCarrierFilterChange,
  onRefresh,
  onExport,
}: ShippingToolbarProps) {
  return (
    <div className="toolbar">
      <style jsx>{`
        .toolbar {
          background: #ffffff;
          border-radius: 16px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
          justify-content: space-between;
        }
        .toolbar-left { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
        .search-box { position: relative; width: 320px; }
        .search-box input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-family: inherit;
          font-size: 0.9rem;
          background: #f8fafc;
        }
        .search-box input:focus { outline: none; border-color: #25D366; background: white; }
        .search-box i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #64748b; }
        .filter-select {
          padding: 0.75rem 2.5rem 0.75rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-family: inherit;
          font-size: 0.9rem;
          background: #f8fafc;
          cursor: pointer;
        }
        .toolbar-right { display: flex; gap: 0.5rem; }
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
        .btn-secondary { background: #ffffff; color: #1e293b; border: 2px solid #e2e8f0; }
        .btn-secondary:hover { border-color: #25D366; color: #25D366; }
        @media (max-width: 768px) { .search-box { width: 100%; } }
      `}</style>
      <div className="toolbar-left">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by order, tracking, or customer..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <select className="filter-select" value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">In Transit</option>
          <option value="delivered">Delivered</option>
        </select>
        <select className="filter-select" value={carrierFilter} onChange={(e) => onCarrierFilterChange(e.target.value)}>
          <option value="">All Carriers</option>
          <option value="g4s">G4S Kenya</option>
          <option value="sendy">Sendy</option>
          <option value="bolt">Bolt Delivery</option>
          <option value="inhouse">In-House</option>
        </select>
      </div>
      <div className="toolbar-right">
        <button className="btn btn-secondary" onClick={onRefresh}><i className="fas fa-sync-alt"></i></button>
        <button className="btn btn-secondary" onClick={onExport}><i className="fas fa-download"></i></button>
      </div>
    </div>
  );
}
