"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supplierService, Supplier } from "@/lib/db";
import {
  SupplierCard,
  AddSupplierModal,
  ViewSupplierModal,
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
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
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

  // Analytics calculations
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.status === 'active').length;
  const pendingSuppliers = suppliers.filter(s => s.status === 'pending').length;
  const avgRating = suppliers.length > 0 ? (suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / suppliers.length).toFixed(1) : "0";
  const totalSpentAll = suppliers.reduce((sum, s) => sum + (s.totalSpent || 0), 0);

  // Bulk selection handlers
  const selectAllSuppliers = () => {
    if (bulkSelected.length === filteredSuppliers.length) {
      setBulkSelected([]);
    } else {
      setBulkSelected(filteredSuppliers.map(s => s.id));
    }
  };

  const toggleSupplierSelection = (supplierId: string) => {
    setBulkSelected(prev => 
      prev.includes(supplierId) 
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  // Bulk status update
  const handleBulkStatusUpdate = async (newStatus: 'active' | 'inactive' | 'pending') => {
    if (!user || bulkSelected.length === 0) return;
    try {
      await Promise.all(
        bulkSelected.map(id => supplierService.updateSupplier(user, id, { status: newStatus }))
      );
      loadSuppliers();
      setBulkSelected([]);
      setBulkMode(false);
      alert(`Updated ${bulkSelected.length} suppliers to ${newStatus}`);
    } catch (error) {
      console.error("Error updating suppliers:", error);
      alert("Failed to update some suppliers");
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (!user || bulkSelected.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${bulkSelected.length} suppliers?`)) return;
    try {
      await Promise.all(
        bulkSelected.map(id => supplierService.deleteSupplier(user, id))
      );
      loadSuppliers();
      setBulkSelected([]);
      setBulkMode(false);
      alert(`Deleted ${bulkSelected.length} suppliers`);
    } catch (error) {
      console.error("Error deleting suppliers:", error);
      alert("Failed to delete some suppliers");
    }
  };

  // Duplicate supplier
  const handleDuplicateSupplier = async (supplier: Supplier) => {
    if (!user) return;
    try {
      await supplierService.createSupplier(user, {
        name: `${supplier.name} (Copy)`,
        contactPerson: supplier.contactPerson,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        category: supplier.category,
        products: supplier.products,
        paymentTerms: supplier.paymentTerms,
        rating: supplier.rating,
        totalOrders: 0,
        totalSpent: 0,
        status: 'pending',
        notes: supplier.notes,
      });
      loadSuppliers();
      alert('Supplier duplicated successfully!');
    } catch (error) {
      console.error("Error duplicating supplier:", error);
      alert("Failed to duplicate supplier");
    }
  };

  // Share supplier via WhatsApp
  const shareSupplierWhatsApp = (supplier: Supplier) => {
    const message = `🏭 *Supplier Contact*\n\n*Company:* ${supplier.name}\n👤 *Contact:* ${supplier.contactPerson || 'N/A'}\n📱 *Phone:* ${supplier.phone}${supplier.email ? `\n📧 *Email:* ${supplier.email}` : ''}${supplier.address ? `\n📍 *Address:* ${supplier.address}` : ''}\n\n💰 *Total Spent:* KES ${(supplier.totalSpent || 0).toLocaleString()}\n📦 *Orders:* ${supplier.totalOrders || 0}\n⭐ *Rating:* ${supplier.rating ? supplier.rating.toFixed(1) : 'N/A'}\n\nSave this supplier contact!`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Print supplier profile
  const printSupplierProfile = (supplier: Supplier) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Supplier Profile - ${supplier.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #25D366; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #25D366; }
          .name { font-size: 28px; font-weight: bold; margin: 10px 0; }
          .status { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; text-transform: capitalize; }
          .section { margin: 30px 0; }
          .section-title { font-size: 18px; font-weight: bold; color: #1e293b; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
          .info-label { font-weight: 600; color: #64748b; }
          .info-value { font-weight: 500; color: #1e293b; }
          .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
          .stat-card { background: #f8fafc; padding: 15px; border-radius: 12px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #25D366; }
          .stat-label { font-size: 12px; color: #64748b; margin-top: 5px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">SUPPLIER PROFILE</div>
          <div class="name">${supplier.name}</div>
          <div class="status" style="background: ${supplier.status === 'active' ? '#dcfce7; color: #10b981' : supplier.status === 'pending' ? '#fef3c7; color: #f59e0b' : '#fee2e2; color: #ef4444'};">
            ${supplier.status || 'pending'}
          </div>
        </div>

        <div class="stats">
          <div class="stat-card">
            <div class="stat-value">KES ${(supplier.totalSpent || 0).toLocaleString()}</div>
            <div class="stat-label">Total Spent</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${supplier.totalOrders || 0}</div>
            <div class="stat-label">Orders</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${supplier.rating ? supplier.rating.toFixed(1) : 'N/A'}</div>
            <div class="stat-label">Rating</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Contact Information</div>
          ${supplier.contactPerson ? `
          <div class="info-row">
            <span class="info-label">Contact Person</span>
            <span class="info-value">${supplier.contactPerson}</span>
          </div>` : ''}
          <div class="info-row">
            <span class="info-label">Phone</span>
            <span class="info-value">${supplier.phone}</span>
          </div>
          ${supplier.email ? `
          <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value">${supplier.email}</span>
          </div>` : ''}
          ${supplier.address ? `
          <div class="info-row">
            <span class="info-label">Address</span>
            <span class="info-value">${supplier.address}</span>
          </div>` : ''}
        </div>

        ${supplier.products && supplier.products.length > 0 ? `
        <div class="section">
          <div class="section-title">Products</div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${supplier.products.map(p => `<span style="padding: 6px 12px; background: #f1f5f9; border-radius: 16px; font-size: 14px;">${p}</span>`).join('')}
          </div>
        </div>` : ''}

        ${supplier.paymentTerms ? `
        <div class="section">
          <div class="section-title">Payment Terms</div>
          <div class="info-row">
            <span class="info-label">Terms</span>
            <span class="info-value" style="text-transform: capitalize;">${supplier.paymentTerms}</span>
          </div>
        </div>` : ''}

        ${supplier.notes ? `
        <div class="section">
          <div class="section-title">Notes</div>
          <p style="color: #64748b; line-height: 1.6;">${supplier.notes}</p>
        </div>` : ''}

        <div style="margin-top: 40px; text-align: center; color: #64748b; border-top: 2px solid #e2e8f0; padding-top: 20px;">
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    // Search filter
    const matchesSearch =
      !searchTerm ||
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === "all" || supplier.status === statusFilter;
    
    // Date range filter
    let matchesDate = true;
    if (dateRangeStart || dateRangeEnd) {
      const supplierDate = supplier.createdAt?.toDate ? supplier.createdAt.toDate() : new Date(supplier.createdAt);
      if (dateRangeStart && supplierDate < new Date(dateRangeStart)) matchesDate = false;
      if (dateRangeEnd) {
        const endDate = new Date(dateRangeEnd);
        endDate.setHours(23, 59, 59, 999);
        if (supplierDate > endDate) matchesDate = false;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  }).sort((a, b) => {
    if (sortBy === "newest") {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    }
    if (sortBy === "oldest") {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateA.getTime() - dateB.getTime();
    }
    if (sortBy === "name-az") return a.name.localeCompare(b.name);
    if (sortBy === "name-za") return b.name.localeCompare(a.name);
    if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
    if (sortBy === "spent") return (b.totalSpent || 0) - (a.totalSpent || 0);
    if (sortBy === "orders") return (b.totalOrders || 0) - (a.totalOrders || 0);
    return 0;
  });

const filterByCategory = (category: string) => {
    setActiveCategory(category);
  };

  return (
    <div className="suppliers-page">
      <style jsx>{`
        .suppliers-page { }
        .suppliers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        @media (max-width: 768px) {
          .suppliers-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-8 gap-4">
        <div className="header-content">
          <h1 className="text-xl md:text-2xl font-extrabold flex items-center gap-2">
            <i className="fas fa-truck-loading text-[#25D366]"></i>
            <span className="md:hidden">Suppliers</span>
            <span className="hidden md:inline">Supplier Management</span>
          </h1>
          <p className="text-sm text-[#64748b] hidden md:block">Manage your supply chain</p>
        </div>
        <div className="flex gap-2 md:gap-3 w-full md:w-auto overflow-x-auto">
          <button className="px-3 py-2 bg-white border border-[#e2e8f0] rounded-lg font-semibold text-sm hover:border-[#25D366] text-nowrap" onClick={() => {}}>
            <i className="fas fa-download mr-1"></i><span className="hidden md:inline">Export</span>
          </button>
          <button 
            className={`px-3 py-2 rounded-lg font-semibold text-sm shadow text-nowrap transition-all ${bulkMode ? 'bg-[#ef4444] text-white' : 'bg-white border border-[#e2e8f0] text-[#64748b]'}`}
            onClick={() => { setBulkMode(!bulkMode); setBulkSelected([]); }}
          >
            <i className={`fas ${bulkMode ? 'fa-times' : 'fa-check-square'} mr-1`}></i>
            <span className="hidden md:inline">{bulkMode ? 'Cancel' : 'Select'}</span>
          </button>
          <button className="px-3 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-lg font-semibold text-sm shadow text-nowrap" onClick={() => setShowModal(true)}>
            <i className="fas fa-plus mr-1"></i><span className="hidden md:inline">Add Supplier</span><span className="md:hidden">+</span>
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="bg-white rounded-xl md:rounded-2xl p-4 border border-[#e2e8f0] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#DCF8C6] rounded-xl flex items-center justify-center">
              <i className="fas fa-truck text-[#25D366] text-lg md:text-xl"></i>
            </div>
            <span className="text-xs text-[#64748b] font-semibold">Total</span>
          </div>
          <div className="font-extrabold text-xl md:text-2xl text-[#1e293b]">{totalSuppliers}</div>
          <div className="text-xs text-[#64748b] mt-1">All Suppliers</div>
        </div>
        <div className="bg-white rounded-xl md:rounded-2xl p-4 border border-[#e2e8f0] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#dcfce7] rounded-xl flex items-center justify-center">
              <i className="fas fa-check-circle text-[#10b981] text-lg md:text-xl"></i>
            </div>
            <span className="text-xs text-[#64748b] font-semibold">Active</span>
          </div>
          <div className="font-extrabold text-xl md:text-2xl text-[#1e293b]">{activeSuppliers}</div>
          <div className="text-xs text-[#64748b] mt-1">Active Status</div>
        </div>
        <div className="bg-white rounded-xl md:rounded-2xl p-4 border border-[#e2e8f0] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#fef3c7] rounded-xl flex items-center justify-center">
              <i className="fas fa-clock text-[#f59e0b] text-lg md:text-xl"></i>
            </div>
            <span className="text-xs text-[#64748b] font-semibold">Pending</span>
          </div>
          <div className="font-extrabold text-xl md:text-2xl text-[#1e293b]">{pendingSuppliers}</div>
          <div className="text-xs text-[#64748b] mt-1">Pending Approval</div>
        </div>
        <div className="bg-white rounded-xl md:rounded-2xl p-4 border border-[#e2e8f0] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#dbeafe] rounded-xl flex items-center justify-center">
              <i className="fas fa-coins text-[#3b82f6] text-lg md:text-xl"></i>
            </div>
            <span className="text-xs text-[#64748b] font-semibold">Spent</span>
          </div>
          <div className="font-extrabold text-xl md:text-2xl text-[#1e293b]">KES {(totalSpentAll || 0).toLocaleString()}</div>
          <div className="text-xs text-[#64748b] mt-1">Total Spent</div>
        </div>
      </div>

      <SuppliersToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={loadSuppliers}
      />

      {/* Enhanced Filters */}
      <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-4 mb-4 flex flex-col md:flex-row gap-3 md:gap-4 border border-[#e2e8f0] justify-between">
        <div className="flex gap-2 md:gap-4 flex-1 flex-wrap">
          <select className="px-4 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>

          <div className="flex gap-2">
            <input 
              type="date" 
              value={dateRangeStart} 
              onChange={(e) => setDateRangeStart(e.target.value)}
              className="px-3 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm"
            />
            <input 
              type="date" 
              value={dateRangeEnd} 
              onChange={(e) => setDateRangeEnd(e.target.value)}
              className="px-3 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm"
            />
          </div>

          <select className="px-4 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name-az">Name A-Z</option>
            <option value="name-za">Name Z-A</option>
            <option value="rating">Rating</option>
            <option value="spent">Total Spent</option>
            <option value="orders">Orders</option>
          </select>
        </div>
      </div>

      <SupplierCategoryTabs
        activeCategory={activeCategory}
        onFilter={filterByCategory}
        count={suppliers.length}
      />

      {loading ? (
        <div className="p-8 md:p-12 text-center">
          <i className="fas fa-spinner fa-spin text-2xl text-[#25D366] mb-4"></i>
          <p className="text-[#64748b]">Loading suppliers...</p>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="p-8 md:p-12 text-center bg-white rounded-2xl border border-[#e2e8f0]">
          <i className="fas fa-truck text-3xl text-[#64748b] mb-4"></i>
          <h3 className="font-bold mb-2">No suppliers found</h3>
          <p className="text-sm text-[#64748b] mb-4">Add your first supplier to get started.</p>
          <button className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg" onClick={() => setShowModal(true)}>
            <i className="fas fa-plus mr-2"></i>Add Supplier
          </button>
        </div>
      ) : (
        <>
          {/* Bulk Operations Bar */}
          {bulkMode && filteredSuppliers.length > 0 && (
            <div className="mb-4 flex items-center justify-between bg-[#f8fafc] p-3 rounded-xl">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bulkSelected.length === filteredSuppliers.length && filteredSuppliers.length > 0}
                  onChange={selectAllSuppliers}
                  className="w-5 h-5 rounded border-[#e2e8f0] text-[#25D366] focus:ring-[#25D366]"
                />
                <span className="text-sm font-semibold text-[#1e293b]">Select All ({filteredSuppliers.length})</span>
              </label>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleBulkStatusUpdate('active')}
                  disabled={bulkSelected.length === 0}
                  className="px-3 py-1.5 bg-[#dcfce7] text-[#10b981] rounded-lg text-xs font-semibold hover:bg-[#10b981] hover:text-white disabled:opacity-50"
                >
                  <i className="fas fa-check mr-1"></i>Activate
                </button>
                <button 
                  onClick={() => handleBulkStatusUpdate('pending')}
                  disabled={bulkSelected.length === 0}
                  className="px-3 py-1.5 bg-[#fef3c7] text-[#f59e0b] rounded-lg text-xs font-semibold hover:bg-[#f59e0b] hover:text-white disabled:opacity-50"
                >
                  <i className="fas fa-clock mr-1"></i>Pending
                </button>
                <button 
                  onClick={() => handleBulkDelete()}
                  disabled={bulkSelected.length === 0}
                  className="px-3 py-1.5 bg-[#fee2e2] text-[#ef4444] rounded-lg text-xs font-semibold hover:bg-[#ef4444] hover:text-white disabled:opacity-50"
                >
                  <i className="fas fa-trash mr-1"></i>Delete
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mb-6">
            {filteredSuppliers.map((supplier) => (
              <SupplierCard
                key={supplier.id}
                supplier={supplier}
                onView={openViewModal}
                onEdit={openEditModal}
                onDelete={deleteSupplier}
                bulkMode={bulkMode}
                isSelected={bulkSelected.includes(supplier.id)}
                onToggleSelect={() => toggleSupplierSelection(supplier.id)}
                onShare={() => shareSupplierWhatsApp(supplier)}
                onPrint={() => printSupplierProfile(supplier)}
                onDuplicate={() => handleDuplicateSupplier(supplier)}
              />
            ))}
          </div>
        </>
      )}

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
