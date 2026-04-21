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
          <button className="px-3 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-lg font-semibold text-sm shadow text-nowrap" onClick={() => setShowModal(true)}>
            <i className="fas fa-plus mr-1"></i><span className="hidden md:inline">Add Supplier</span><span className="md:hidden">+</span>
          </button>
        </div>
      </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mb-6">
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
