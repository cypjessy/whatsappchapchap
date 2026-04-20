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
    <div className="max-w-[1600px] mx-auto p-3 md:p-6">
      <style jsx>{`
        @media (max-width: 768px) {
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        }
      `}</style>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold flex items-center gap-2">
            <i className="fas fa-truck text-[#25D366]"></i>
            <span className="md:hidden">Shipping</span>
            <span className="hidden md:inline">Shipping & Delivery</span>
          </h1>
          <p className="text-sm text-[#64748b] hidden md:block">Manage orders, track deliveries</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
          <div className="flex flex-1 md:flex-none gap-2">
            <div className="bg-white p-2 md:p-3 rounded-xl border border-[#e2e8f0] text-center min-w-[70px] md:min-w-[90px]">
              <div className="text-lg md:text-xl font-extrabold text-[#10b981]">{stats.onTimeRate}%</div>
              <div className="text-xs text-[#64748b]">On-Time</div>
            </div>
            <div className="bg-white p-2 md:p-3 rounded-xl border border-[#e2e8f0] text-center min-w-[70px] md:min-w-[90px]">
              <div className="text-lg md:text-xl font-extrabold text-[#f59e0b]">{stats.avgDays}</div>
              <div className="text-xs text-[#64748b]">Avg Days</div>
            </div>
          </div>
          <button className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-white border border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366] text-nowrap" onClick={() => setShowShippingMethodsModal(true)}>
            <i className="fas fa-truck mr-1"></i><span className="hidden md:inline">Methods</span>
          </button>
          <button className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow text-nowrap" onClick={() => setShowCreateModal(true)}>
            <i className="fas fa-plus mr-1"></i><span className="md:hidden">+</span><span className="hidden md:inline">New Shipment</span>
          </button>
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

      {/* Status Tabs - Scrollable on mobile */}
      <div className="flex gap-2 mb-4 md:mb-6 overflow-x-auto pb-2 hide-scrollbar">
        <div className={`px-3 md:px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap cursor-pointer ${!statusFilter ? "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white" : "bg-white border border-[#e2e8f0] text-[#64748b]"}`} onClick={() => setStatusFilter("")}>
          All <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-white/20">{shipments.length}</span>
        </div>
        <div className={`px-3 md:px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap cursor-pointer ${statusFilter === "pending" ? "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white" : "bg-white border border-[#e2e8f0] text-[#64748b]"}`} onClick={() => setStatusFilter("pending")}>
          <i className="fas fa-clock mr-1"></i>Pending <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-white/20">{stats.pending}</span>
        </div>
        <div className={`px-3 md:px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap cursor-pointer ${statusFilter === "shipped" ? "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white" : "bg-white border border-[#e2e8f0] text-[#64748b]"}`} onClick={() => setStatusFilter("shipped")}>
          <i className="fas fa-shipping-fast mr-1"></i>In Transit <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-white/20">{stats.inTransit}</span>
        </div>
        <div className={`px-3 md:px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap cursor-pointer ${statusFilter === "delivered" ? "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white" : "bg-white border border-[#e2e8f0] text-[#64748b]"}`} onClick={() => setStatusFilter("delivered")}>
          <i className="fas fa-check-circle mr-1"></i>Delivered <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-white/20">{stats.delivered}</span>
        </div>
      </div>

      {loading ? (
        <div className="p-8 md:p-12 text-center">
          <i className="fas fa-spinner fa-spin text-2xl text-[#25D366] mb-4"></i>
          <p className="text-[#64748b]">Loading shipments...</p>
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
