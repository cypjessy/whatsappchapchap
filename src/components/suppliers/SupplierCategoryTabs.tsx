"use client";

import { SupplierCategoryTabsProps } from "./types";

export function SupplierCategoryTabs({ activeCategory, onFilter, count }: SupplierCategoryTabsProps) {
  return (
    <div className="category-tabs">
      <style jsx>{`
        .category-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; overflow-x: auto; }
        .category-tab {
          padding: 0.75rem 1.5rem;
          background: #ffffff;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          color: #64748b;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .category-tab:hover { border-color: #25D366; color: #25D366; }
        .category-tab.active {
          background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
          color: white;
          border-color: #25D366;
        }
      `}</style>
      <div className={`category-tab ${activeCategory === "all" ? "active" : ""}`} onClick={() => onFilter("all")}>
        <i className="fas fa-th-large"></i>
        All Suppliers
        <span style={{ background: "rgba(255,255,255,0.3)", padding: "0.25rem 0.75rem", borderRadius: 20, marginLeft: "0.5rem" }}>{count}</span>
      </div>
      <div className={`category-tab ${activeCategory === "fashion" ? "active" : ""}`} onClick={() => onFilter("fashion")}><i className="fas fa-tshirt"></i> Fashion</div>
      <div className={`category-tab ${activeCategory === "electronics" ? "active" : ""}`} onClick={() => onFilter("electronics")}><i className="fas fa-laptop"></i> Electronics</div>
      <div className={`category-tab ${activeCategory === "home" ? "active" : ""}`} onClick={() => onFilter("home")}><i className="fas fa-home"></i> Home & Garden</div>
      <div className={`category-tab ${activeCategory === "beauty" ? "active" : ""}`} onClick={() => onFilter("beauty")}><i className="fas fa-spa"></i> Beauty</div>
      <div className={`category-tab ${activeCategory === "sports" ? "active" : ""}`} onClick={() => onFilter("sports")}><i className="fas fa-basketball-ball"></i> Sports</div>
    </div>
  );
}
