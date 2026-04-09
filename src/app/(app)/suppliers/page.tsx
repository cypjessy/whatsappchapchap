"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supplierService, Supplier } from "@/lib/db";

export default function SuppliersPage() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    paymentTerms: "net30" as Supplier["paymentTerms"],
    products: [] as string[],
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

  const createSupplier = async () => {
    if (!user) return;
    if (!newSupplier.name || !newSupplier.contactPerson) {
      alert("Please fill in supplier name and contact person");
      return;
    }

    try {
      await supplierService.createSupplier(user, newSupplier);
      loadSuppliers();
      setShowModal(false);
      setNewSupplier({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        paymentTerms: "net30",
        products: [],
        notes: "",
      });
    } catch (error) {
      console.error("Error creating supplier:", error);
      alert("Error creating supplier");
    }
  };

  const updateSupplier = async () => {
    if (!user || !editingSupplier) return;
    if (!newSupplier.name || !newSupplier.contactPerson) {
      alert("Please fill in supplier name and contact person");
      return;
    }

    try {
      await supplierService.updateSupplier(user, editingSupplier.id, newSupplier);
      loadSuppliers();
      setShowModal(false);
      setEditingSupplier(null);
      setNewSupplier({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        paymentTerms: "net30",
        products: [],
        notes: "",
      });
    } catch (error) {
      console.error("Error updating supplier:", error);
      alert("Error updating supplier");
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
    setEditingSupplier(supplier);
    setNewSupplier({
      name: supplier.name,
      contactPerson: supplier.contactPerson || "",
      email: supplier.email || "",
      phone: supplier.phone,
      address: supplier.address || "",
      paymentTerms: supplier.paymentTerms || "net30",
      products: supplier.products || [],
      notes: supplier.notes || "",
    });
    setShowModal(true);
  };

  const getCategoryBadge = (category: string) => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      general: { bg: "bg-gray-100", color: "text-gray-600", label: "General" },
    };
    return styles[category] || styles.general;
  };

  const getPaymentTermsLabel = (terms: Supplier["paymentTerms"]) => {
    const labels: Record<string, string> = {
      net15: "Net 15",
      net30: "Net 30",
      net60: "Net 60",
      net90: "Net 90",
      cod: "Cash on Delivery",
      prepaid: "Prepaid",
    };
    return labels[terms || "net30"] || (terms || "net30");
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1e293b] flex items-center gap-2">
            <i className="fas fa-truck text-[#25D366]"></i>Supplier Management
          </h1>
          <p className="text-[#64748b]">Manage your suppliers and vendor relationships</p>
        </div>
        <button 
          className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg"
          onClick={() => setShowModal(true)}
        >
          <i className="fas fa-plus mr-2"></i>Add Supplier
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="w-12 h-12 border-4 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[#64748b]">Loading suppliers...</p>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-[#e2e8f0]">
          <div className="w-16 h-16 bg-[#f1f5f9] rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-truck text-2xl text-[#64748b]"></i>
          </div>
          <h4 className="font-bold text-[#1e293b] mb-2">No suppliers yet</h4>
          <p className="text-sm text-[#64748b]">Add your first supplier to start managing your vendor relationships.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map(supplier => {
            
            return (
              <div key={supplier.id} className="bg-white rounded-2xl border border-[#e2e8f0] p-6 hover:shadow-lg transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">{supplier.name}</h3>
                    <p className="text-sm text-[#64748b] mb-3">{supplier.contactPerson}</p>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] rounded-lg"
                      onClick={() => openEditModal(supplier)}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] rounded-lg"
                      onClick={() => deleteSupplier(supplier.id)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <i className="fas fa-envelope text-[#64748b] w-4"></i>
                      <span className="text-[#64748b]">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <i className="fas fa-phone text-[#64748b] w-4"></i>
                      <span className="text-[#64748b]">{supplier.phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748b]">Payment Terms:</span>
                    <span className="font-semibold">{getPaymentTermsLabel(supplier.paymentTerms)}</span>
                  </div>
                  {supplier.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <i className="fas fa-map-marker-alt text-[#64748b] w-4 mt-0.5"></i>
                      <span className="text-[#64748b] line-clamp-2">{supplier.address}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 py-2 bg-[#f1f5f9] text-[#64748b] rounded-lg font-semibold text-sm hover:bg-[#e2e8f0]">
                    View Orders
                  </button>
                  <button className="flex-1 py-2 bg-[#25D366] text-white rounded-lg font-semibold text-sm hover:bg-[#128C7E]">
                    Contact
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Supplier Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-[600px] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#e2e8f0] flex justify-between items-center">
              <h2 className="text-xl font-extrabold">{editingSupplier ? "Edit Supplier" : "Add New Supplier"}</h2>
              <button className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] rounded-lg" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[#1e293b] mb-2">Supplier Name *</label>
                    <input 
                      type="text" 
                      value={newSupplier.name} 
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" 
                      placeholder="e.g., ABC Electronics"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#1e293b] mb-2">Contact Person *</label>
                    <input 
                      type="text" 
                      value={newSupplier.contactPerson} 
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, contactPerson: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" 
                      placeholder="e.g., John Smith"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[#1e293b] mb-2">Email</label>
                    <input 
                      type="email" 
                      value={newSupplier.email} 
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" 
                      placeholder="supplier@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#1e293b] mb-2">Phone</label>
                    <input 
                      type="tel" 
                      value={newSupplier.phone} 
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" 
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1e293b] mb-2">Address</label>
                  <textarea 
                    value={newSupplier.address} 
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366] resize-none" 
                    placeholder="Street address, city, state, zip code"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#1e293b] mb-2">Payment Terms</label>
                  <select 
                    value={newSupplier.paymentTerms} 
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, paymentTerms: e.target.value as Supplier["paymentTerms"] }))}
                    className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]"
                  >
                    <option value="net15">Net 15</option>
                    <option value="net30">Net 30</option>
                    <option value="net60">Net 60</option>
                    <option value="net90">Net 90</option>
                    <option value="cod">Cash on Delivery</option>
                    <option value="prepaid">Prepaid</option>
                  </select>
                </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1e293b] mb-2">Notes</label>
                  <textarea 
                    value={newSupplier.notes} 
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366] resize-none" 
                    placeholder="Additional notes about this supplier"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#e2e8f0] flex justify-end gap-3">
              <button 
                className="px-6 py-2 bg-[#f1f5f9] text-[#64748b] rounded-xl font-semibold text-sm hover:bg-[#e2e8f0]" 
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-6 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg" 
                onClick={editingSupplier ? updateSupplier : createSupplier}
              >
                {editingSupplier ? "Update Supplier" : "Add Supplier"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}