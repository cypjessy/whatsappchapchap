"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { shippingService, orderService, ShippingMethod, Shipment } from "@/lib/db";

export default function ShippingPage() {
  const { user } = useAuth();
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("methods");
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [newMethod, setNewMethod] = useState({
    name: "",
    description: "",
    cost: 0,
    estimatedDays: 1,
    isActive: true,
  });
  const [newShipment, setNewShipment] = useState({
    orderId: "",
    shippingMethod: "",
    trackingNumber: "",
    status: "pending" as Shipment["status"],
    notes: "",
  });

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [methodsData, shipmentsData, ordersData] = await Promise.all([
        shippingService.getShippingMethods(user),
        shippingService.getShipments(user),
        orderService.getOrders(user),
      ]);
      setShippingMethods(methodsData);
      setShipments(shipmentsData);
      setOrders(ordersData);
    } catch (error) {
      console.error("Error loading shipping data:", error);
      setShippingMethods([]);
      setShipments([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const createShippingMethod = async () => {
    if (!user) return;
    if (!newMethod.name || newMethod.cost < 0) {
      alert("Please fill in method name and valid cost");
      return;
    }

    try {
      await shippingService.createShippingMethod(user, newMethod);
      loadData();
      setShowMethodModal(false);
      setNewMethod({
        name: "",
        description: "",
        cost: 0,
        estimatedDays: 1,
        isActive: true,
      });
    } catch (error) {
      console.error("Error creating shipping method:", error);
      alert("Error creating shipping method");
    }
  };

  const updateShippingMethod = async () => {
    if (!user || !editingMethod) return;
    if (!newMethod.name || newMethod.cost < 0) {
      alert("Please fill in method name and valid cost");
      return;
    }

    try {
      await shippingService.updateShippingMethod(user, editingMethod.id, newMethod);
      loadData();
      setShowMethodModal(false);
      setEditingMethod(null);
      setNewMethod({
        name: "",
        description: "",
        cost: 0,
        estimatedDays: 1,
        isActive: true,
      });
    } catch (error) {
      console.error("Error updating shipping method:", error);
      alert("Error updating shipping method");
    }
  };

  const deleteShippingMethod = async (methodId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this shipping method?")) return;

    try {
      await shippingService.deleteShippingMethod(user, methodId);
      loadData();
    } catch (error) {
      console.error("Error deleting shipping method:", error);
      alert("Error deleting shipping method");
    }
  };

  const createShipment = async () => {
    if (!user) return;
    if (!newShipment.orderId || !newShipment.shippingMethod) {
      alert("Please select an order and shipping method");
      return;
    }

    try {
      const selectedOrder = orders.find(order => order.id === newShipment.orderId);
      if (!selectedOrder) {
        alert("Order not found");
        return;
      }

      const shipmentData = {
        ...newShipment,
        customerName: selectedOrder.customerName,
        customerPhone: selectedOrder.customerPhone || "",
      };

      await shippingService.createShipment(user, shipmentData);
      loadData();
      setShowShipmentModal(false);
      setNewShipment({
        orderId: "",
        shippingMethod: "",
        trackingNumber: "",
        status: "pending",
        notes: "",
      });
    } catch (error) {
      console.error("Error creating shipment:", error);
      alert("Error creating shipment");
    }
  };

  const updateShipmentStatus = async (shipmentId: string, status: Shipment["status"]) => {
    if (!user) return;

    try {
      await shippingService.updateShipment(user, shipmentId, { status });
      loadData();
    } catch (error) {
      console.error("Error updating shipment status:", error);
      alert("Error updating shipment status");
    }
  };

  const openEditMethodModal = (method: ShippingMethod) => {
    setEditingMethod(method);
    setNewMethod({
      name: method.name,
      description: method.description || "",
      cost: method.cost,
      estimatedDays: method.estimatedDays,
      isActive: method.isActive,
    });
    setShowMethodModal(true);
  };

  const getStatusBadge = (status: Shipment["status"]) => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      pending: { bg: "bg-yellow-100", color: "text-yellow-600", label: "Pending" },
      shipped: { bg: "bg-blue-100", color: "text-blue-600", label: "Shipped" },
      delivered: { bg: "bg-green-100", color: "text-green-600", label: "Delivered" },
      returned: { bg: "bg-red-100", color: "text-red-600", label: "Returned" },
    };
    return styles[status] || styles.pending;
  };

  const getOrderById = (orderId: string) => {
    return orders.find(order => order.id === orderId);
  };

  const getMethodByName = (methodName: string) => {
    return shippingMethods.find(method => method.name === methodName);
  };

  const tabs = [
    { id: "methods", label: "Shipping Methods", count: shippingMethods.length },
    { id: "shipments", label: "Shipments", count: shipments.length },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1e293b] flex items-center gap-2">
            <i className="fas fa-shipping-fast text-[#25D366]"></i>Shipping & Delivery
          </h1>
          <p className="text-[#64748b]">Manage shipping methods and track deliveries</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "methods" && (
            <button 
              className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg"
              onClick={() => setShowMethodModal(true)}
            >
              <i className="fas fa-plus mr-2"></i>Add Method
            </button>
          )}
          {activeTab === "shipments" && (
            <button 
              className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg"
              onClick={() => setShowShipmentModal(true)}
            >
              <i className="fas fa-plus mr-2"></i>Create Shipment
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            className={`px-5 py-3 rounded-full font-semibold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white" 
                : "bg-white border-2 border-[#e2e8f0] text-[#64748b] hover:border-[#25D366]"
            }`}
          >
            {tab.label}
            <span className="px-2 py-0.5 rounded-full text-xs bg-white/20">{tab.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="w-12 h-12 border-4 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[#64748b]">Loading shipping data...</p>
        </div>
      ) : activeTab === "methods" ? (
        shippingMethods.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-[#e2e8f0]">
            <div className="w-16 h-16 bg-[#f1f5f9] rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-shipping-fast text-2xl text-[#64748b]"></i>
            </div>
            <h4 className="font-bold text-[#1e293b] mb-2">No shipping methods yet</h4>
            <p className="text-sm text-[#64748b]">Add your first shipping method to start managing deliveries.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shippingMethods.map(method => (
              <div key={method.id} className="bg-white rounded-2xl border border-[#e2e8f0] p-6 hover:shadow-lg transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">{method.name}</h3>
                    {method.description && (
                      <p className="text-sm text-[#64748b] mb-3">{method.description}</p>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        method.isActive ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      }`}>
                        {method.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] rounded-lg"
                      onClick={() => openEditMethodModal(method)}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] rounded-lg"
                      onClick={() => deleteShippingMethod(method.id)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748b]">Cost:</span>
                    <span className="font-semibold">${method.cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748b]">Estimated Days:</span>
                    <span className="font-semibold">{method.estimatedDays} day{method.estimatedDays !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        shipments.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-[#e2e8f0]">
            <div className="w-16 h-16 bg-[#f1f5f9] rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-box text-2xl text-[#64748b]"></i>
            </div>
            <h4 className="font-bold text-[#1e293b] mb-2">No shipments yet</h4>
            <p className="text-sm text-[#64748b]">Create your first shipment to start tracking deliveries.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shipments.map(shipment => {
              const statusStyle = getStatusBadge(shipment.status);
              const order = getOrderById(shipment.orderId);
              const method = getMethodByName(shipment.shippingMethod);
              
              return (
                <div key={shipment.id} className="bg-white rounded-2xl border border-[#e2e8f0] p-6 hover:shadow-lg transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2">Order #{order?.id.slice(-6) || shipment.orderId.slice(-6)}</h3>
                      <p className="text-sm text-[#64748b] mb-3">{method?.name || 'Unknown Method'}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusStyle.bg} ${statusStyle.color}`}>
                          {statusStyle.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <select 
                        value={shipment.status} 
                        onChange={(e) => updateShipmentStatus(shipment.id, e.target.value as Shipment["status"])}
                        className="px-3 py-1 border border-[#e2e8f0] rounded-lg text-xs focus:outline-none focus:border-[#25D366]"
                      >
                        <option value="pending">Pending</option>
                        <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="returned">Returned</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    {shipment.trackingNumber && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#64748b]">Tracking:</span>
                        <span className="font-semibold font-mono">{shipment.trackingNumber}</span>
                      </div>
                    )}
                    {shipment.shippedAt && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#64748b]">Shipped:</span>
                        <span className="font-semibold">{new Date(shipment.shippedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    {shipment.deliveredAt && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#64748b]">Delivered:</span>
                        <span className="font-semibold">{new Date(shipment.deliveredAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-[#f1f5f9] text-[#64748b] rounded-lg font-semibold text-sm hover:bg-[#e2e8f0]">
                      View Details
                    </button>
                    {shipment.trackingNumber && (
                      <button className="flex-1 py-2 bg-[#25D366] text-white rounded-lg font-semibold text-sm hover:bg-[#128C7E]">
                        Track
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Shipping Method Modal */}
      {showMethodModal && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-[500px] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#e2e8f0] flex justify-between items-center">
              <h2 className="text-xl font-extrabold">{editingMethod ? "Edit Shipping Method" : "Add Shipping Method"}</h2>
              <button className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] rounded-lg" onClick={() => setShowMethodModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-[#1e293b] mb-2">Method Name *</label>
                  <input 
                    type="text" 
                    value={newMethod.name} 
                    onChange={(e) => setNewMethod(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" 
                    placeholder="e.g., Standard Shipping"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1e293b] mb-2">Description</label>
                  <textarea 
                    value={newMethod.description} 
                    onChange={(e) => setNewMethod(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366] resize-none" 
                    placeholder="Brief description of this shipping method"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[#1e293b] mb-2">Cost ($)</label>
                    <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      value={newMethod.cost} 
                      onChange={(e) => setNewMethod(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" 
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#1e293b] mb-2">Estimated Days</label>
                    <input 
                      type="number" 
                      min="1"
                      value={newMethod.estimatedDays} 
                      onChange={(e) => setNewMethod(prev => ({ ...prev, estimatedDays: parseInt(e.target.value) || 1 }))}
                      className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" 
                      placeholder="1"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="isActive"
                    checked={newMethod.isActive} 
                    onChange={(e) => setNewMethod(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 text-[#25D366] border-[#e2e8f0] rounded focus:ring-[#25D366]"
                  />
                  <label htmlFor="isActive" className="text-sm font-bold text-[#1e293b]">Active</label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#e2e8f0] flex justify-end gap-3">
              <button 
                className="px-6 py-2 bg-[#f1f5f9] text-[#64748b] rounded-xl font-semibold text-sm hover:bg-[#e2e8f0]" 
                onClick={() => setShowMethodModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-6 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg" 
                onClick={editingMethod ? updateShippingMethod : createShippingMethod}
              >
                {editingMethod ? "Update Method" : "Add Method"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shipment Modal */}
      {showShipmentModal && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-[600px] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#e2e8f0] flex justify-between items-center">
              <h2 className="text-xl font-extrabold">Create New Shipment</h2>
              <button className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] rounded-lg" onClick={() => setShowShipmentModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-[#1e293b] mb-2">Order *</label>
                  <select 
                    value={newShipment.orderId} 
                    onChange={(e) => setNewShipment(prev => ({ ...prev, orderId: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]"
                  >
                    <option value="">Select an order</option>
                    {orders.filter(order => order.status === 'confirmed' || order.status === 'processing').map(order => (
                      <option key={order.id} value={order.id}>
                        Order #{order.id.slice(-6)} - {order.customerName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1e293b] mb-2">Shipping Method *</label>
                  <select 
                    value={newShipment.shippingMethod} 
                    onChange={(e) => setNewShipment(prev => ({ ...prev, shippingMethod: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]"
                  >
                    <option value="">Select a shipping method</option>
                    {shippingMethods.filter(method => method.isActive).map(method => (
                      <option key={method.id} value={method.name}>
                        {method.name} - ${method.cost.toFixed(2)} ({method.estimatedDays} days)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1e293b] mb-2">Tracking Number</label>
                  <input 
                    type="text" 
                    value={newShipment.trackingNumber} 
                    onChange={(e) => setNewShipment(prev => ({ ...prev, trackingNumber: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" 
                    placeholder="Enter tracking number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1e293b] mb-2">Notes</label>
                  <textarea 
                    value={newShipment.notes} 
                    onChange={(e) => setNewShipment(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366] resize-none" 
                    placeholder="Additional shipment notes"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#e2e8f0] flex justify-end gap-3">
              <button 
                className="px-6 py-2 bg-[#f1f5f9] text-[#64748b] rounded-xl font-semibold text-sm hover:bg-[#e2e8f0]" 
                onClick={() => setShowShipmentModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-6 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg" 
                onClick={createShipment}
              >
                Create Shipment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}