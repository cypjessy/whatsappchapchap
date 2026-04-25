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
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");

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

  // Bulk selection handlers
  const selectAllShipments = () => {
    if (bulkSelected.length === filteredShipments.length) {
      setBulkSelected([]);
    } else {
      setBulkSelected(filteredShipments.map(s => s.id));
    }
  };

  const toggleShipmentSelection = (shipmentId: string) => {
    setBulkSelected(prev => 
      prev.includes(shipmentId) 
        ? prev.filter(id => id !== shipmentId)
        : [...prev, shipmentId]
    );
  };

  // Bulk status update
  const handleBulkStatusUpdate = async (newStatus: Shipment["status"]) => {
    if (!user || bulkSelected.length === 0) return;
    try {
      await Promise.all(
        bulkSelected.map(id => shippingService.updateShipment(user, id, { status: newStatus }))
      );
      loadShipments();
      setBulkSelected([]);
      setBulkMode(false);
      alert(`Updated ${bulkSelected.length} shipments to ${newStatus}`);
    } catch (error) {
      console.error("Error updating shipments:", error);
      alert("Failed to update some shipments");
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (!user || bulkSelected.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${bulkSelected.length} shipments?`)) return;
    try {
      await Promise.all(
        bulkSelected.map(id => shippingService.deleteShipment(user, id))
      );
      loadShipments();
      setBulkSelected([]);
      setBulkMode(false);
      alert(`Deleted ${bulkSelected.length} shipments`);
    } catch (error) {
      console.error("Error deleting shipments:", error);
      alert("Failed to delete some shipments");
    }
  };

  // Print shipping label
  const printShippingLabel = (shipment: Shipment) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Shipping Label - ${shipment.trackingNumber || shipment.orderNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
          .label { border: 3px solid #000; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 15px; }
          .logo { font-size: 24px; font-weight: bold; }
          .tracking { font-size: 32px; font-weight: bold; text-align: center; margin: 20px 0; letter-spacing: 2px; }
          .section { margin: 15px 0; }
          .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #666; margin-bottom: 5px; }
          .info { font-size: 14px; line-height: 1.6; }
          .barcode { text-align: center; margin: 20px 0; font-family: monospace; font-size: 48px; letter-spacing: 5px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="header">
            <div class="logo">SHIPPING LABEL</div>
            <div>${shipment.carrier || 'Standard Carrier'}</div>
          </div>
          
          <div class="barcode">||||| |||| ||||| ||||</div>
          <div class="tracking">${shipment.trackingNumber || shipment.orderNumber || 'N/A'}</div>
          
          <div class="section">
            <div class="section-title">From:</div>
            <div class="info">
              Your Business Name<br/>
              Business Address<br/>
              City, State ZIP
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">To:</div>
            <div class="info">
              ${shipment.customerName || 'Customer'}<br/>
              ${shipment.shippingAddress || 'Address not available'}
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Service:</div>
            <div class="info">${shipment.shippingMethod || 'Standard Delivery'}</div>
          </div>
          
          ${shipment.weight ? `
          <div class="section">
            <div class="section-title">Weight:</div>
            <div class="info">${shipment.weight} kg</div>
          </div>` : ''}
          
          <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ccc; padding-top: 10px;">
            Generated on ${new Date().toLocaleDateString()}
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  // Share shipment via WhatsApp
  const shareShipmentWhatsApp = (shipment: Shipment) => {
    const message = `📦 *Shipment Update*\n\n*Order:* ${shipment.orderNumber || shipment.orderId}\n*Tracking:* ${shipment.trackingNumber || 'N/A'}\n*Carrier:* ${shipment.carrier || 'Standard'}\n*Status:* ${shipment.status}\n\n👤 *Customer:* ${shipment.customerName || 'N/A'}\n📱 *Phone:* ${shipment.customerPhone || 'N/A'}\n\n📍 *Address:* ${shipment.shippingAddress || 'N/A'}\n\nTrack your package!`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
    // Search filter
    const matchesSearch =
      !searchTerm ||
      (shipment.orderId && shipment.orderId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (shipment.customerName && shipment.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (shipment.trackingNumber && shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Status filter
    const matchesStatus = !statusFilter || shipment.status === statusFilter;
    
    // Carrier filter
    const matchesCarrier = !carrierFilter || shipment.carrier === carrierFilter;
    
    // Date range filter
    let matchesDate = true;
    if (dateRangeStart || dateRangeEnd) {
      const shipmentDate = shipment.createdAt?.toDate ? shipment.createdAt.toDate() : new Date(shipment.createdAt);
      if (dateRangeStart && shipmentDate < new Date(dateRangeStart)) matchesDate = false;
      if (dateRangeEnd) {
        const endDate = new Date(dateRangeEnd);
        endDate.setHours(23, 59, 59, 999);
        if (shipmentDate > endDate) matchesDate = false;
      }
    }
    
    return matchesSearch && matchesStatus && matchesCarrier && matchesDate;
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
    if (sortBy === "tracking") return (a.trackingNumber || '').localeCompare(b.trackingNumber || '');
    if (sortBy === "customer") return (a.customerName || '').localeCompare(b.customerName || '');
    return 0;
  });

  const stats = {
    pending: shipments.filter(s => s.status === "pending").length,
    inTransit: shipments.filter(s => s.status === "shipped" || s.status === "in_transit").length,
    delivered: shipments.filter(s => s.status === "delivered").length,
    returns: shipments.filter(s => s.status === "returned").length,
    totalShipments: shipments.length,
    onTimeRate: shipments.length > 0 ? Math.round((shipments.filter(s => s.status === "delivered").length / shipments.length) * 100) : 0,
    avgDays: shipments.length > 0 ? parseFloat((shipments.reduce((sum, s) => {
      if (s.deliveredAt && s.shippedAt) {
        const shipped = s.shippedAt.toDate ? s.shippedAt.toDate() : new Date(s.shippedAt);
        const delivered = s.deliveredAt.toDate ? s.deliveredAt.toDate() : new Date(s.deliveredAt);
        return sum + ((delivered.getTime() - shipped.getTime()) / (1000 * 60 * 60 * 24));
      }
      return sum;
    }, 0) / (shipments.filter(s => s.deliveredAt && s.shippedAt).length || 1)).toFixed(1)) : 0,
    activeDrivers: shipments.filter(s => s.status === "shipped" || s.status === "in_transit").length,
    totalCost: shipments.reduce((sum, s) => sum + (s.cost || 0), 0),
  };

return (
    <div>
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
          <button 
            className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-xl font-semibold text-sm shadow text-nowrap transition-all ${bulkMode ? 'bg-[#ef4444] text-white' : 'bg-white border border-[#e2e8f0] text-[#64748b]'}`}
            onClick={() => { setBulkMode(!bulkMode); setBulkSelected([]); }}
          >
            <i className={`fas ${bulkMode ? 'fa-times' : 'fa-check-square'} mr-1`}></i>
            <span className="hidden md:inline">{bulkMode ? 'Cancel' : 'Select'}</span>
          </button>
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
        <div className={`px-3 md:px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap cursor-pointer ${statusFilter === "shipped" || statusFilter === "in_transit" ? "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white" : "bg-white border border-[#e2e8f0] text-[#64748b]"}`} onClick={() => setStatusFilter("shipped")}>
          <i className="fas fa-shipping-fast mr-1"></i>In Transit <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-white/20">{stats.inTransit}</span>
        </div>
        <div className={`px-3 md:px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap cursor-pointer ${statusFilter === "delivered" ? "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white" : "bg-white border border-[#e2e8f0] text-[#64748b]"}`} onClick={() => setStatusFilter("delivered")}>
          <i className="fas fa-check-circle mr-1"></i>Delivered <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-white/20">{stats.delivered}</span>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-4 mb-4 flex flex-col md:flex-row gap-3 md:gap-4 border border-[#e2e8f0] justify-between">
        <div className="flex gap-2 md:gap-4 flex-1 flex-wrap">
          <select className="px-4 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm" value={carrierFilter} onChange={(e) => setCarrierFilter(e.target.value)}>
            <option value="">All Carriers</option>
            <option value="fedex">FedEx</option>
            <option value="dhl">DHL</option>
            <option value="ups">UPS</option>
            <option value="standard">Standard</option>
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
            <option value="tracking">Tracking #</option>
            <option value="customer">Customer Name</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-8 md:p-12 text-center">
          <i className="fas fa-spinner fa-spin text-2xl text-[#25D366] mb-4"></i>
          <p className="text-[#64748b]">Loading shipments...</p>
        </div>
      ) : (
        <>
          {/* Bulk Operations Bar */}
          {bulkMode && filteredShipments.length > 0 && (
            <div className="mb-4 flex items-center justify-between bg-[#f8fafc] p-3 rounded-xl">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bulkSelected.length === filteredShipments.length && filteredShipments.length > 0}
                  onChange={selectAllShipments}
                  className="w-5 h-5 rounded border-[#e2e8f0] text-[#25D366] focus:ring-[#25D366]"
                />
                <span className="text-sm font-semibold text-[#1e293b]">Select All ({filteredShipments.length})</span>
              </label>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleBulkStatusUpdate('shipped')}
                  disabled={bulkSelected.length === 0}
                  className="px-3 py-1.5 bg-[#dbeafe] text-[#3b82f6] rounded-lg text-xs font-semibold hover:bg-[#3b82f6] hover:text-white disabled:opacity-50"
                >
                  <i className="fas fa-shipping-fast mr-1"></i>Ship
                </button>
                <button 
                  onClick={() => handleBulkStatusUpdate('delivered')}
                  disabled={bulkSelected.length === 0}
                  className="px-3 py-1.5 bg-[#dcfce7] text-[#10b981] rounded-lg text-xs font-semibold hover:bg-[#10b981] hover:text-white disabled:opacity-50"
                >
                  <i className="fas fa-check mr-1"></i>Deliver
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

          <ShippingTable
            shipments={filteredShipments}
            onView={handleViewShipment}
            onPrint={printShippingLabel}
            onWhatsApp={shareShipmentWhatsApp}
            onAssign={handleAssignCourier}
            bulkMode={bulkMode}
            selectedIds={bulkSelected}
            onToggleSelect={toggleShipmentSelection}
          />
        </>
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
