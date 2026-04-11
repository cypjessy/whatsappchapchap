"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supplierService, Supplier } from "@/lib/db";
import {
  SupplierCard,
  AddSupplierModal,
  ViewSupplierModal,
  SuppliersStats,
  SuppliersToolbar,
  SupplierCategoryTabs,
  SupplierFormData,
} from "@/components/suppliers";

export default function SuppliersPage() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewSupplier, setViewSupplier] = useState<Supplier | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [formData, setFormData] = useState<SupplierFormData>({
    companyName: "",
    category: "",
    regNumber: "",
    taxId: "",
    contactPerson: "",
    position: "",
    phone: "",
    whatsapp: "",
    email: "",
    altPhone: "",
    address: "",
    city: "",
    country: "Kenya",
    products: "",
    paymentTerms: "cod",
    leadTime: "",
    minOrder: "",
    currency: "KES",
    deliveryMethod: "supplier",
    notes: "",
  });

  useEffect(() => {
    if (!user) return;
    loadSuppliers();
  }, [user]);

  const loadSuppliers = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await supplierService.getSuppliers(user);
      setSuppliers(data);
    } catch (error) {
      console.error("Error loading suppliers:", error);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const updateFormField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const createSupplier = async () => {
    if (!user) return;
    
    try {
      await supplierService.createSupplier(user, {
        name: formData.companyName,
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        email: formData.email,
        address: `${formData.address}, ${formData.city}, ${formData.country}`,
        paymentTerms: formData.paymentTerms,
        products: formData.products ? formData.products.split(",").map(p => p.trim()) : [],
        notes: formData.notes,
      });
      loadSuppliers();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Error creating supplier:", error);
      alert("Error creating supplier");
    }
  };

  const deleteSupplier = async (supplierId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this supplier?")) return;

    try {
      await supplierService.deleteSupplier(user, supplierId);
      loadSuppliers();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      alert("Error deleting supplier");
    }
  };

  const openEditModal = (supplier: Supplier) => {
    const addressParts = supplier.address?.split(", ") || [];
    setFormData({
      companyName: supplier.name,
      category: "fashion",
      regNumber: "",
      taxId: "",
      contactPerson: supplier.contactPerson || "",
      position: "",
      phone: supplier.phone,
      whatsapp: "",
      email: supplier.email || "",
      altPhone: "",
      address: addressParts[0] || "",
      city: addressParts[1] || "",
      country: addressParts[2] || "Kenya",
      products: supplier.products?.join(", ") || "",
      paymentTerms: supplier.paymentTerms || "cod",
      leadTime: "",
      minOrder: "",
      currency: "KES",
      deliveryMethod: "supplier",
      notes: supplier.notes || "",
    });
    setShowModal(true);
  };

  const openViewModal = (supplier: Supplier) => {
    setViewSupplier(supplier);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewSupplier(null);
  };

  const resetForm = () => {
    setFormData({
      companyName: "",
      category: "",
      regNumber: "",
      taxId: "",
      contactPerson: "",
      position: "",
      phone: "",
      whatsapp: "",
      email: "",
      altPhone: "",
      address: "",
      city: "",
      country: "Kenya",
      products: "",
      paymentTerms: "cod",
      leadTime: "",
      minOrder: "",
      currency: "KES",
      deliveryMethod: "supplier",
      notes: "",
    });
    setCurrentStep(1);
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      !searchTerm ||
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filterByCategory = (category: string) => {
    setActiveCategory(category);
  };

  const stats = {
    total: suppliers.length,
    active: Math.floor(suppliers.length * 0.875),
    pending: Math.max(0, suppliers.length - Math.floor(suppliers.length * 0.875)),
    rating: 4.8,
  };

  return (
    <div className="suppliers-page">
      <style jsx>{`
        .suppliers-page {
          max-width: 1600px;
          margin: 0 auto;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1.5rem;
        }
        .header-content h1 {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .header-content p { color: #64748b; font-size: 1rem; }
        .header-stats { display: flex; gap: 1rem; }
        .stat-card-mini {
          background: #ffffff;
          border-radius: 12px;
          padding: 1rem 1.5rem;
          border: 1px solid #e2e8f0;
          text-align: center;
          min-width: 120px;
        }
        .stat-value-mini { font-size: 1.5rem; font-weight: 800; color: #25D366; }
        .stat-label-mini { font-size: 0.8rem; color: #64748b; font-weight: 600; text-transform: uppercase; }
        .header-actions { display: flex; gap: 0.75rem; }
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
        .btn-primary {
          background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4); }
        .btn-secondary { background: #ffffff; color: #1e293b; border: 2px solid #e2e8f0; }
        .btn-secondary:hover { border-color: #25D366; color: #25D366; }
        .suppliers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .performance-section {
          background: #ffffff;
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .section-title { font-size: 1.25rem; font-weight: 800; display: flex; align-items: center; gap: 0.75rem; }
        .chart-container {
          height: 300px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .chart-placeholder { text-align: center; color: #64748b; }
        .chart-placeholder i { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; color: #25D366; }
        .po-section {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .po-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .po-title { font-size: 1.125rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
        .table-container { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th {
          background: #f8fafc;
          padding: 1rem 1.5rem;
          text-align: left;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          border-bottom: 2px solid #e2e8f0;
        }
        .data-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; }
        .po-id { font-weight: 800; color: #25D366; cursor: pointer; }
        .supplier-cell-sm { display: flex; align-items: center; gap: 0.75rem; }
        .supplier-avatar-sm {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: linear-gradient(135deg, #DCF8C6 0%, #e0e7ff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .amount { font-weight: 800; font-size: 1rem; }
        .po-status { padding: 0.375rem 0.875rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
        .po-status.draft { background: rgba(148, 163, 184, 0.1); color: #64748b; }
        .table-actions { display: flex; gap: 0.5rem; }
        .action-btn-sm {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: none;
          background: #f8fafc;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .action-btn-sm:hover { background: #25D366; color: white; }
        @media (max-width: 768px) {
          .suppliers-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="page-header">
        <div className="header-content">
          <h1>
            <i className="fas fa-truck-loading" style={{ color: "#25D366" }}></i>
            Supplier Management
          </h1>
          <p>Manage your supply chain, track performance, and streamline procurement</p>
        </div>
        <div className="header-stats">
          <div className="stat-card-mini">
            <div className="stat-value-mini">{stats.total}</div>
            <div className="stat-label-mini">Suppliers</div>
          </div>
          <div className="stat-card-mini">
            <div className="stat-value-mini" style={{ color: "#f59e0b" }}>{stats.pending}</div>
            <div className="stat-label-mini">Pending</div>
          </div>
          <div className="stat-card-mini">
            <div className="stat-value-mini" style={{ color: "#8b5cf6" }}>$0</div>
            <div className="stat-label-mini">Monthly Spend</div>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary">
            <i className="fas fa-download"></i>
            Export
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <i className="fas fa-plus"></i>
            Add Supplier
          </button>
        </div>
      </div>

      <SuppliersStats
        total={stats.total}
        active={stats.active}
        pending={stats.pending}
        rating={stats.rating}
      />

      <SuppliersToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={loadSuppliers}
      />

      <SupplierCategoryTabs
        activeCategory={activeCategory}
        onFilter={filterByCategory}
        count={suppliers.length}
      />

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center" }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: "2rem", color: "#25D366" }}></i>
          <p style={{ marginTop: "1rem", color: "#64748b" }}>Loading suppliers...</p>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <i className="fas fa-truck" style={{ fontSize: "3rem", color: "#64748b", marginBottom: "1rem" }}></i>
          <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>No suppliers found</h3>
          <p style={{ color: "#64748b" }}>Add your first supplier to get started.</p>
          <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={() => setShowModal(true)}><i className="fas fa-plus"></i> Add Supplier</button>
        </div>
      ) : (
        <div className="suppliers-grid">
          {filteredSuppliers.map((supplier) => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              onView={openViewModal}
              onEdit={openEditModal}
              onDelete={deleteSupplier}
            />
          ))}
        </div>
      )}

      <div className="performance-section">
        <div className="section-header">
          <h2 className="section-title"><i className="fas fa-chart-line" style={{ color: "#25D366" }}></i> Supplier Performance Analytics</h2>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <select className="filter-select">
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
            </select>
            <button className="btn btn-secondary"><i className="fas fa-download"></i> Report</button>
          </div>
        </div>
        <div className="chart-container">
          <div className="chart-placeholder">
            <i className="fas fa-chart-area"></i>
            <p>Supplier Performance Chart</p>
            <small>Monthly spend, delivery times, and quality metrics by supplier</small>
          </div>
        </div>
      </div>

      <div className="po-section">
        <div className="po-header">
          <h3 className="po-title"><i className="fas fa-file-invoice" style={{ color: "#3b82f6" }}></i> Recent Purchase Orders</h3>
          <button className="btn btn-primary btn-sm"><i className="fas fa-plus"></i> New PO</button>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="po-id">PO-2026-001</span></td>
                <td><div className="supplier-cell-sm"><div className="supplier-avatar-sm">👔</div><span style={{ fontWeight: 600 }}>Sample Supplier</span></div></td>
                <td>0 items</td>
                <td className="amount">$0.00</td>
                <td><span className="po-status draft">Draft</span></td>
                <td>Apr 10, 2026</td>
                <td><div className="table-actions"><button className="action-btn-sm" title="View"><i className="fas fa-eye"></i></button><button className="action-btn-sm" title="Edit"><i className="fas fa-edit"></i></button></div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <AddSupplierModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        onSubmit={createSupplier}
        formData={formData}
        onUpdateField={updateFormField}
        currentStep={currentStep}
        onNextStep={() => setCurrentStep(prev => prev + 1)}
        onPrevStep={() => setCurrentStep(prev => prev - 1)}
        onGoToStep={setCurrentStep}
      />

      <ViewSupplierModal
        isOpen={showViewModal}
        supplier={viewSupplier}
        onClose={closeViewModal}
        onEdit={openEditModal}
        onDelete={deleteSupplier}
      />
    </div>
  );
}
