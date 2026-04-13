"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { shippingService, orderService, tenantService, Shipment, Order } from "@/lib/db";
import { sendEvolutionWhatsAppMessage } from "@/utils/sendWhatsApp";
import { getShipmentMessage } from "@/utils/orderMessages";
import {
  ShippingOverview,
  ShippingToolbar,
  ShippingTable,
  TrackingModal,
  CreateShipmentModal,
  ShippingMethodsModal,
} from "@/components/shipping";

interface ShippingMethod {
  id: string;
  name: string;
  price: number;
}

export default function ShippingPage() {
  const { user } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([
    { id: "standard", name: "Standard Delivery", price: 500 },
    { id: "express", name: "Express Delivery", price: 1000 },
    { id: "pickup", name: "Store Pickup", price: 0 }
  ]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("");
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShippingMethodsModal, setShowShippingMethodsModal] = useState(false);
  const [selectedOrderForShipment, setSelectedOrderForShipment] = useState<Order | null>(null);

  useEffect(() => {
    if (!user) return;
    loadShipments();
    loadPendingOrders();
    loadShippingMethods();
  }, [user]);

  const loadShipments = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await shippingService.getShipments(user);
      setShipments(data);
    } catch (error) {
      console.error("Error loading shipments:", error);
      setShipments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingOrders = async () => {
    if (!user) return;
    try {
      const allOrders = await orderService.getOrders(user);
      const pending = allOrders.filter(o => o.status === "pending" || o.status === "processing");
      setPendingOrders(pending);
    } catch (error) {
      console.error("Error loading orders:", error);
      setPendingOrders([]);
    }
  };

  const loadShippingMethods = async () => {
    if (!user) return;
    try {
      const tenantData = await tenantService.getTenant(user);
      if (tenantData?.shippingMethods && tenantData.shippingMethods.length > 0) {
        setShippingMethods(tenantData.shippingMethods);
      }
    } catch (error) {
      console.error("Error loading shipping methods:", error);
    }
  };

  const handleSaveShippingMethods = async (methods: ShippingMethod[]) => {
    if (!user) return;
    try {
      await tenantService.updateTenant(user, { shippingMethods: methods });
      setShippingMethods(methods);
      alert("Shipping methods saved!");
    } catch (error) {
      console.error("Error saving shipping methods:", error);
      alert("Failed to save shipping methods");
    }
  };

  const handleViewShipment = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setShowTrackingModal(true);
  };

  const handleCreateFromOrder = (order: Order) => {
    setSelectedOrderForShipment(order);
    setShowCreateModal(true);
  };

  const handlePrintLabel = (shipment: Shipment) => {
    alert(`Printing shipping label for ${shipment.orderId}`);
  };

  const handleWhatsApp = (shipment: Shipment) => {
    window.open(`https://wa.me/${shipment.customerPhone?.replace(/\D/g, '')}`, '_blank');
  };

  const handleAssignCourier = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setShowTrackingModal(true);
  };

  const handleCreateShipment = async (data: any) => {
    if (!user) return;
    
    const orderId = data.orderId || (data.orders && data.orders[0]);
    if (!orderId) {
      alert("No order selected");
      return;
    }
    
    try {
      const order = pendingOrders.find(o => o.id === orderId);
      if (!order) {
        alert("Order not found");
        return;
      }
      
      await shippingService.createShipment(user, {
        orderId: order.id,
        orderNumber: order.orderNumber || data.trackingNumber,
        customerName: order.customerName || "Unknown",
        customerPhone: order.customerPhone || "",
        shippingAddress: order.customerAddress,
        shippingMethod: order.deliveryMethod || data.shippingMethod || "standard",
        carrier: order.deliveryMethod || data.carrier,
        trackingNumber: order.orderNumber || data.trackingNumber,
        status: "pending",
        notes: data.shipping?.instructions,
      });
      
      await orderService.updateOrder(user, orderId, { status: "shipped" });
      
      // Send WhatsApp notification directly via Evolution API
      await sendShipmentNotification(order);
      
      loadShipments();
      loadPendingOrders();
      alert(`Shipment created for order ${order.orderNumber || orderId}!`);
    } catch (error) {
      console.error("Error creating shipment:", error);
      alert("Failed to create shipment");
    }
  };

  const sendShipmentNotification = async (order: Order) => {
    try {
      let tenantId = order.tenantId;
      if (!tenantId && user?.uid) {
        tenantId = `tenant_${user.uid}`;
      }
      
      if (!tenantId) return;

      const message = getShipmentMessage(
        order.customerName || "Customer",
        order.orderNumber || order.id.substring(0, 8),
        order.productName || "Your order",
        order.deliveryMethod || "Standard Delivery",
        order.orderNumber || order.id.substring(0, 8)
      );

      await sendEvolutionWhatsAppMessage(order.customerPhone || "", message, tenantId).catch(err => {
        console.error('WhatsApp send failed:', err);
      });
    } catch (err: any) {
      console.error('Shipment notification error:', err.message || err);
    }
  };

  const handleUpdateStatus = async (shipment: Shipment, newStatus: string) => {
    if (!user) return;
    try {
      await shippingService.updateShipment(user, shipment.id, { 
        status: newStatus as Shipment["status"]
      });
      loadShipments();
    } catch (error) {
      console.error("Error updating shipment:", error);
    }
  };

  const filteredShipments = shipments.filter((shipment) => {
    const matchesSearch =
      !searchTerm ||
      shipment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || shipment.status === statusFilter;
    const matchesCarrier = !carrierFilter;
    
    return matchesSearch && matchesStatus && matchesCarrier;
  });

  const stats = {
    pending: shipments.filter(s => s.status === "pending").length,
    inTransit: shipments.filter(s => s.status === "shipped").length,
    delivered: shipments.filter(s => s.status === "delivered").length,
    returns: shipments.filter(s => s.status === "returned").length,
    onTimeRate: shipments.length > 0 ? Math.round((shipments.filter(s => s.status === "delivered").length / shipments.length) * 100) : 0,
    avgDays: 2.3,
    activeDrivers: shipments.filter(s => s.status === "shipped").length,
  };

  return (
    <div className="shipping-page">
      <style jsx>{`
        .shipping-page { max-width: 1600px; margin: 0 auto; }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1.5rem;
        }
        .header-content h1 { font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.75rem; }
        .header-content p { color: #64748b; font-size: 1rem; }
        .header-stats { display: flex; gap: 1rem; }
        .stat-card-mini { background: #ffffff; border-radius: 12px; padding: 1rem 1.5rem; border: 1px solid #e2e8f0; text-align: center; min-width: 120px; }
        .stat-value-mini { font-size: 1.5rem; font-weight: 800; }
        .stat-value-mini.success { color: #10b981; }
        .stat-value-mini.warning { color: #f59e0b; }
        .stat-value-mini.info { color: #3b82f6; }
        .stat-value-mini.indigo { color: #6366f1; }
        .stat-label-mini { font-size: 0.8rem; color: #64748b; font-weight: 600; text-transform: uppercase; }
        .header-actions { display: flex; gap: 0.75rem; }
        .btn { padding: 0.75rem 1.5rem; border-radius: 8px; font-family: inherit; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; border: none; display: inline-flex; align-items: center; gap: 0.5rem; }
        .btn-primary { background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: white; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4); }
        .btn-secondary { background: #ffffff; color: #1e293b; border: 2px solid #e2e8f0; }
        .btn-secondary:hover { border-color: #25D366; color: #25D366; }
        .map-section { background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 2rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .map-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .map-title { font-weight: 700; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem; }
        .map-container { height: 300px; background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); display: flex; align-items: center; justify-content: center; position: relative; }
        .map-placeholder { text-align: center; color: #64748b; }
        .map-placeholder i { font-size: 4rem; margin-bottom: 1rem; color: #6366f1; opacity: 0.5; }
        .live-drivers { position: absolute; top: 1rem; right: 1rem; background: white; padding: 0.75rem 1rem; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); display: flex; align-items: center; gap: 0.75rem; }
        .live-indicator { width: 10px; height: 10px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite; }
        .status-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; overflow-x: auto; padding-bottom: 0.5rem; }
        .status-tab { padding: 0.75rem 1.5rem; background: #ffffff; border: 2px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem; color: #64748b; white-space: nowrap; display: flex; align-items: center; gap: 0.5rem; }
        .status-tab:hover { border-color: #25D366; color: #25D366; }
        .status-tab.active { background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: white; border-color: #25D366; }
        .status-count { background: rgba(255,255,255,0.2); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }
        .btn-sm { padding: 0.5rem 1rem; font-size: 0.875rem; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      <div className="page-header">
        <div className="header-content">
          <h1><i className="fas fa-truck" style={{ color: "#25D366" }}></i> Shipping & Delivery</h1>
          <p>Manage orders, track deliveries, and optimize your logistics</p>
        </div>
        <div className="header-stats">
          <div className="stat-card-mini">
            <div className="stat-value-mini success">{stats.onTimeRate}%</div>
            <div className="stat-label-mini">On-Time</div>
          </div>
          <div className="stat-card-mini">
            <div className="stat-value-mini warning">{stats.avgDays}</div>
            <div className="stat-label-mini">Avg Days</div>
          </div>
          <div className="stat-card-mini">
            <div className="stat-value-mini info">{stats.activeDrivers}</div>
            <div className="stat-label-mini">In Transit</div>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => setShowShippingMethodsModal(true)}><i className="fas fa-truck"></i> Shipping Methods</button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}><i className="fas fa-plus"></i> New Shipment</button>
        </div>
      </div>

      <ShippingOverview stats={stats} />

      <ShippingToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        carrierFilter={carrierFilter}
        onCarrierFilterChange={setCarrierFilter}
        onRefresh={loadShipments}
        onExport={() => alert("Exporting shipments...")}
      />

      <div className="status-tabs">
        <div className={`status-tab ${!statusFilter ? "active" : ""}`} onClick={() => setStatusFilter("")}>
          All Orders <span className="status-count">{shipments.length}</span>
        </div>
        <div className={`status-tab ${statusFilter === "pending" ? "active" : ""}`} onClick={() => setStatusFilter("pending")}>
          <i className="fas fa-clock"></i> Pending <span className="status-count">{stats.pending}</span>
        </div>
        <div className={`status-tab ${statusFilter === "shipped" ? "active" : ""}`} onClick={() => setStatusFilter("shipped")}>
          <i className="fas fa-shipping-fast"></i> In Transit <span className="status-count">{stats.inTransit}</span>
        </div>
        <div className={`status-tab ${statusFilter === "delivered" ? "active" : ""}`} onClick={() => setStatusFilter("delivered")}>
          <i className="fas fa-check-circle"></i> Delivered <span className="status-count">{stats.delivered}</span>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center" }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: "2rem", color: "#25D366" }}></i>
          <p style={{ marginTop: "1rem", color: "#64748b" }}>Loading shipments...</p>
        </div>
      ) : (
        <ShippingTable
          shipments={filteredShipments}
          onView={handleViewShipment}
          onPrint={handlePrintLabel}
          onWhatsApp={handleWhatsApp}
          onAssign={handleAssignCourier}
        />
      )}

      <TrackingModal
        isOpen={showTrackingModal}
        shipment={selectedShipment}
        onClose={() => { setShowTrackingModal(false); setSelectedShipment(null); }}
        onUpdateStatus={handleUpdateStatus}
      />

      <CreateShipmentModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setSelectedOrderForShipment(null); }}
        onSubmit={handleCreateShipment}
        orders={pendingOrders}
        shippingMethods={shippingMethods}
        selectedOrder={selectedOrderForShipment}
      />

      <ShippingMethodsModal
        isOpen={showShippingMethodsModal}
        onClose={() => setShowShippingMethodsModal(false)}
        methods={shippingMethods}
        onSave={handleSaveShippingMethods}
      />
    </div>
  );
}
