"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { inventoryService, productService, InventoryLog } from "@/lib/db";

export default function InventoryPage() {
  const { user } = useAuth();
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [newLog, setNewLog] = useState({
    productId: "",
    type: "in" as InventoryLog["type"],
    quantity: 0,
    reason: "",
  });

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [logsData, productsData] = await Promise.all([
        inventoryService.getInventoryLogs(user),
        productService.getProducts(user),
      ]);
      setInventoryLogs(logsData);
      setProducts(productsData);
    } catch (error) {
      console.error("Error loading inventory data:", error);
      setInventoryLogs([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const createInventoryLog = async () => {
    if (!user) return;
    if (!newLog.productId || newLog.quantity <= 0) {
      alert("Please select a product and enter a valid quantity");
      return;
    }

    try {
      const product = getProductById(newLog.productId);
      if (!product) {
        alert("Product not found");
        return;
      }

      const logData = {
        ...newLog,
        productName: product.name,
      };

      await inventoryService.logInventoryChange(user, logData);
      loadData();
      setShowModal(false);
      setNewLog({
        productId: "",
        type: "in",
        quantity: 0,
        reason: "",
      });
    } catch (error) {
      console.error("Error creating inventory log:", error);
      alert("Error creating inventory log");
    }
  };

  const getProductById = (productId: string) => {
    return products.find(product => product.id === productId);
  };

  const getTypeBadge = (type: InventoryLog["type"]) => {
    const styles: Record<string, { bg: string; color: string; label: string; icon: string }> = {
      in: { bg: "bg-green-100", color: "text-green-600", label: "Stock In", icon: "fas fa-plus" },
      out: { bg: "bg-red-100", color: "text-red-600", label: "Stock Out", icon: "fas fa-minus" },
      adjustment: { bg: "bg-blue-100", color: "text-blue-600", label: "Adjustment", icon: "fas fa-exchange-alt" },
    };
    return styles[type] || styles.adjustment;
  };

  const getStockLevel = (product: any) => {
    if (!product) return { level: "unknown", color: "text-gray-600" };
    
    const stock = product.stock || 0;
    if (stock === 0) return { level: "Out of Stock", color: "text-red-600" };
    if (stock <= 5) return { level: "Low Stock", color: "text-orange-600" };
    if (stock <= 20) return { level: "Medium", color: "text-yellow-600" };
    return { level: "Good", color: "text-green-600" };
  };

  const getTotalStockValue = () => {
    return products.reduce((total, product) => {
      return total + ((product.stock || 0) * (product.price || 0));
    }, 0);
  };

  const getLowStockProducts = () => {
    return products.filter(product => (product.stock || 0) <= 5);
  };

  const getOutOfStockProducts = () => {
    return products.filter(product => (product.stock || 0) === 0);
  };

  const stats = [
    {
      label: "Total Products",
      value: products.length,
      icon: "fas fa-box",
      color: "text-blue-600",
    },
    {
      label: "Total Stock Value",
      value: `$${getTotalStockValue().toFixed(2)}`,
      icon: "fas fa-dollar-sign",
      color: "text-green-600",
    },
    {
      label: "Low Stock Items",
      value: getLowStockProducts().length,
      icon: "fas fa-exclamation-triangle",
      color: "text-orange-600",
    },
    {
      label: "Out of Stock",
      value: getOutOfStockProducts().length,
      icon: "fas fa-times-circle",
      color: "text-red-600",
    },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1e293b] flex items-center gap-2">
            <i className="fas fa-warehouse text-[#25D366]"></i>Inventory Management
          </h1>
          <p className="text-[#64748b]">Track stock levels and manage inventory</p>
        </div>
        <button 
          className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg"
          onClick={() => setShowModal(true)}
        >
          <i className="fas fa-plus mr-2"></i>Add Inventory Log
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748b] mb-1">{stat.label}</p>
                <p className="text-2xl font-extrabold text-[#1e293b]">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color} bg-current/10`}>
                <i className={stat.icon}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Products Overview */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
          <h3 className="text-lg font-bold text-[#1e293b] mb-4">Product Stock Levels</h3>
          {loading ? (
            <div className="p-4 text-center">
              <div className="w-8 h-8 border-4 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin mx-auto"></div>
            </div>
          ) : products.length === 0 ? (
            <p className="text-[#64748b] text-center py-4">No products found</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {products.map(product => {
                const stockInfo = getStockLevel(product);
                return (
                  <div key={product.id} className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-xl">
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#1e293b] mb-1">{product.name}</h4>
                      <p className="text-sm text-[#64748b]">${product.price?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-[#1e293b]">{product.stock || 0}</div>
                      <div className={`text-xs font-semibold ${stockInfo.color}`}>{stockInfo.level}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Inventory Logs */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
          <h3 className="text-lg font-bold text-[#1e293b] mb-4">Recent Inventory Activity</h3>
          {loading ? (
            <div className="p-4 text-center">
              <div className="w-8 h-8 border-4 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin mx-auto"></div>
            </div>
          ) : inventoryLogs.length === 0 ? (
            <p className="text-[#64748b] text-center py-4">No inventory activity yet</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {inventoryLogs.slice(0, 10).map(log => {
                const typeStyle = getTypeBadge(log.type);
                const product = getProductById(log.productId);
                
                return (
                  <div key={log.id} className="flex items-center gap-4 p-4 bg-[#f8fafc] rounded-xl">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${typeStyle.bg}`}>
                      <i className={`${typeStyle.icon} text-sm ${typeStyle.color}`}></i>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-[#1e293b]">{product?.name || 'Unknown Product'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${typeStyle.bg} ${typeStyle.color}`}>
                          {typeStyle.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[#64748b]">
                        <span>Qty: {log.quantity}</span>
                        <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                      </div>
                      {log.reason && (
                        <p className="text-xs text-[#64748b] mt-1">{log.reason}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Inventory Log Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-[500px] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#e2e8f0] flex justify-between items-center">
              <h2 className="text-xl font-extrabold">Add Inventory Log</h2>
              <button className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] rounded-lg" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-[#1e293b] mb-2">Product *</label>
                  <select 
                    value={newLog.productId} 
                    onChange={(e) => setNewLog(prev => ({ ...prev, productId: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]"
                  >
                    <option value="">Select a product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} (Current: {product.stock || 0})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[#1e293b] mb-2">Type *</label>
                    <select 
                      value={newLog.type} 
                      onChange={(e) => setNewLog(prev => ({ ...prev, type: e.target.value as InventoryLog["type"] }))}
                      className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]"
                    >
                      <option value="in">Stock In</option>
                      <option value="out">Stock Out</option>
                      <option value="adjustment">Adjustment</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#1e293b] mb-2">Quantity *</label>
                    <input 
                      type="number" 
                      min="1"
                      value={newLog.quantity} 
                      onChange={(e) => setNewLog(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" 
                      placeholder="Enter quantity"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1e293b] mb-2">Reason</label>
                  <select 
                    value={newLog.reason} 
                    onChange={(e) => setNewLog(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]"
                  >
                    <option value="">Select a reason (optional)</option>
                    <option value="purchase">Purchase</option>
                    <option value="sale">Sale</option>
                    <option value="return">Return</option>
                    <option value="transfer">Transfer</option>
                    <option value="loss">Loss</option>
                    <option value="correction">Correction</option>
                    <option value="other">Other</option>
                  </select>
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
                onClick={createInventoryLog}
              >
                Add Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}