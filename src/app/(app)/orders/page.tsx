"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { orderService, Order, OrderStatus, productService, Product, customerService, Customer, tenantService } from "@/lib/db";
import { formatCurrency, CURRENCY_SYMBOL } from "@/lib/currency";
import { app as firebaseApp } from "@/lib/firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { sendEvolutionWhatsAppMessage } from "@/utils/sendWhatsApp";
import { getOrderStatusMessage } from "@/utils/orderMessages";

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, processing: 0, completed: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("all");
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newOrderModalOpen, setNewOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    paymentMethod: "",
    status: "",
  });
  const [newOrderForm, setNewOrderForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    paymentMethod: "Cash on Delivery",
    selectedProducts: [] as { productId: string; name: string; quantity: number; price: number }[],
    notes: "",
  });
  const [newOrderCustomerSearch, setNewOrderCustomerSearch] = useState("");
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [amountMin, setAmountMin] = useState<number | "">("");
  const [amountMax, setAmountMax] = useState<number | "">("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    if (!user) return;
    loadOrders();
    loadCounts();
    loadProducts();
    loadCustomers();
  }, [user, activeStatus]);

  const loadOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await orderService.getOrders(user, activeStatus);
      setOrders(data);
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCounts = async () => {
    if (!user) return;
    try {
      const data = await orderService.getOrderCounts(user);
      setCounts(data);
    } catch (error) {
      console.error("Error loading counts:", error);
    }
  };

  const loadProducts = async () => {
    if (!user) return;
    try {
      const data = await productService.getProducts(user);
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const loadCustomers = async () => {
    if (!user) return;
    try {
      const data = await customerService.getClients(user);
      setCustomers(data);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  const openOrderModal = (order: Order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const openEditModal = (order: Order) => {
    setSelectedOrder(order);
    setEditForm({
      customerName: order.customerName || "",
      customerPhone: order.customerPhone || "",
      customerEmail: order.customerEmail || "",
      customerAddress: order.customerAddress || "",
      paymentMethod: order.paymentMethod || "",
      status: order.status || "",
    });
    setEditModalOpen(true);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveEditOrder = async () => {
    if (!user || !selectedOrder) return;
    try {
      await orderService.updateOrder(user, selectedOrder.id, {
        customerName: editForm.customerName,
        customerPhone: editForm.customerPhone,
        customerEmail: editForm.customerEmail,
        customerAddress: editForm.customerAddress,
        paymentMethod: editForm.paymentMethod,
        status: editForm.status as Order["status"],
      });
      loadOrders();
      loadCounts();
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const handleNewOrderInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewOrderForm((prev) => ({ ...prev, [name]: value }));
  };

  const addProductToOrder = (product: Product) => {
    const existing = newOrderForm.selectedProducts.find(p => p.productId === product.id);
    if (existing) {
      setNewOrderForm(prev => ({
        ...prev,
        selectedProducts: prev.selectedProducts.map(p => 
          p.productId === product.id ? { ...p, quantity: p.quantity + 1 } : p
        )
      }));
    } else {
      setNewOrderForm(prev => ({
        ...prev,
        selectedProducts: [...prev.selectedProducts, { productId: product.id, name: product.name, quantity: 1, price: product.price }]
      }));
    }
  };

  const removeProductFromOrder = (productId: string) => {
    setNewOrderForm(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.filter(p => p.productId !== productId)
    }));
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setNewOrderForm(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.map(p => 
        p.productId === productId ? { ...p, quantity } : p
      )
    }));
  };

  const calculateOrderTotal = () => {
    const subtotal = newOrderForm.selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const shipping = 0;
    const tax = subtotal * 0.16;
    const discount = 0;
    return { subtotal, shipping, tax, discount, total: subtotal + shipping + tax - discount };
  };

  const createNewOrder = async () => {
    if (!user) return;
    if (!newOrderForm.customerName || !newOrderForm.customerPhone || newOrderForm.selectedProducts.length === 0) {
      alert("Please fill in customer details and add at least one product");
      return;
    }
    setCreatingOrder(true);
    try {
      const totals = calculateOrderTotal();
      console.log("Creating order with data:", {
        customerName: newOrderForm.customerName,
        customerPhone: newOrderForm.customerPhone,
        products: newOrderForm.selectedProducts,
        total: totals.total
      });
      await orderService.createOrder(user, {
        orderNumber: "ORD-" + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
        customerId: "",
        customerName: newOrderForm.customerName,
        customerPhone: newOrderForm.customerPhone,
        customerEmail: newOrderForm.customerEmail,
        customerAddress: newOrderForm.customerAddress,
        products: newOrderForm.selectedProducts,
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        tax: totals.tax,
        discount: totals.discount,
        total: totals.total,
        paymentMethod: newOrderForm.paymentMethod,
        status: "pending",
        notes: newOrderForm.notes,
      });
      loadOrders();
      loadCounts();
      setNewOrderModalOpen(false);
      setNewOrderForm({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        customerAddress: "",
        paymentMethod: "Cash on Delivery",
        selectedProducts: [],
        notes: "",
      });
      alert("Order created successfully!");
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Error creating order: " + error);
    } finally {
      setCreatingOrder(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["Order Number", "Customer Name", "Phone", "Email", "Products", "Total", "Status", "Date"];
    const rows = orders.map(order => [
      order.orderNumber || order.id.substring(0, 8),
      order.customerName,
      order.customerPhone,
      order.customerEmail,
      order.products?.map(p => `${p.name} x${p.quantity}`).join(", ") || order.productName,
      order.total,
      order.status,
      formatDate(order.createdAt)
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const bulkUpdateStatus = async (status: Order["status"]) => {
    if (!user || selectedOrders.size === 0 || !status) return;
try {
      for (const orderId of selectedOrders) {
        await orderService.updateOrder(user, orderId, { status });
      }
      loadOrders();
      loadCounts();
      setSelectedOrders(new Set());
    } catch (error) {
      console.error("Error updating orders:", error);
    }
  };

  const markOrderComplete = async () => {
    if (!user || !selectedOrder) return;
    try {
      await orderService.updateOrder(user, selectedOrder.id, { status: "delivered" });
      loadOrders();
      loadCounts();
      setModalOpen(false);
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const updateOrderStatus = async (newStatus: Order["status"]) => {
    if (!user || !selectedOrder || !newStatus) return;
    try {
      await orderService.updateOrder(user, selectedOrder.id, { status: newStatus });
      
      // Send WhatsApp notification for payment confirmation (pending -> processing)
      if (newStatus === "processing" && selectedOrder.status === "pending") {
        console.log(' Sending payment confirmation WhatsApp to:', selectedOrder.customerPhone);
        sendWhatsAppNotification(selectedOrder, "processing").catch(err => {
          console.error(' Failed to send WhatsApp notification:', err);
        });
      }
      
      // Send WhatsApp notification for delivery (any status -> delivered)
      if (newStatus === "delivered") {
        console.log(' Sending delivery confirmation WhatsApp to:', selectedOrder.customerPhone);
        sendWhatsAppNotification(selectedOrder, "delivered").catch(err => {
          console.error(' Failed to send WhatsApp notification:', err);
        });
      }
      
      loadOrders();
      loadCounts();
      setShowStatusMenu(false);
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const handleAddNote = async () => {
    if (!user || !selectedOrder || !orderNotes.trim()) return;
    try {
      await orderService.updateOrder(user, selectedOrder.id, { notes: orderNotes });
      setOrderNotes("");
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const processOrder = async () => {
    if (!user || !selectedOrder) return;
    try {
      await orderService.updateOrder(user, selectedOrder.id, { status: "delivered" });
      
      // Send WhatsApp notification for delivery
      console.log('📲 Sending delivery confirmation WhatsApp to:', selectedOrder.customerPhone);
      sendWhatsAppNotification(selectedOrder, "delivered").catch(err => {
        console.error('❌ Failed to send WhatsApp notification:', err);
      });
      
      loadOrders();
      loadCounts();
      setShowStatusMenu(false);
    } catch (error) {
      console.error("Error processing order:", error);
    }
  };

  const toggleSelect = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map(o => o.id)));
    }
  };

  // Calculate analytics
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const completedOrdersCount = orders.filter(o => o.status === 'delivered').length;
  const completionRate = orders.length > 0 ? ((completedOrdersCount / orders.length) * 100).toFixed(1) : "0";

  // Duplicate order handler
  const handleDuplicateOrder = async (order: Order) => {
    if (!user) return;
    try {
      await orderService.createOrder(user, {
        orderNumber: "ORD-" + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
        customerId: order.customerId || "",
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail || "",
        customerAddress: order.customerAddress || "",
        products: order.products || [],
        subtotal: order.subtotal || 0,
        shipping: order.shipping || 0,
        tax: order.tax || 0,
        discount: order.discount || 0,
        total: order.total || 0,
        paymentMethod: order.paymentMethod || "Cash on Delivery",
        status: "pending",
        notes: order.notes || "",
      });
      loadOrders();
      loadCounts();
      alert('Order duplicated successfully!');
    } catch (error) {
      console.error("Error duplicating order:", error);
      alert("Failed to duplicate order");
    }
  };

  // Send WhatsApp notification
  const sendWhatsAppNotification = async (order: Order, status: OrderStatus) => {
    if (!user) return;
    try {
      const tenant = await tenantService.getTenant(user);
      if (!tenant || !tenant.evolutionInstanceId) {
        alert('WhatsApp not configured. Please connect WhatsApp first.');
        return;
      }

      const productName = order.products?.[0]?.name || order.productName || 'Order';
      const message = getOrderStatusMessage(
        status,
        order.customerName,
        order.orderNumber || order.id.substring(0, 8),
        productName,
        order.deliveryAddress || order.customerAddress
      );
      const phone = order.customerPhone.replace(/[^0-9]/g, '');
      
      await sendEvolutionWhatsAppMessage(
        phone,
        message,
        user.uid
      );
      
      alert('WhatsApp notification sent!');
    } catch (error) {
      console.error("Error sending WhatsApp:", error);
      alert("Failed to send WhatsApp notification");
    }
  };

  // Print invoice
  const printInvoice = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${order.orderNumber || order.id.substring(0, 8)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #25D366; }
          .invoice-details { margin: 20px 0; }
          .invoice-details div { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f8fafc; }
          .total { font-size: 18px; font-weight: bold; color: #25D366; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">INVOICE</div>
          <div>Order #${order.orderNumber || order.id.substring(0, 8)}</div>
          <div>Date: ${formatDate(order.createdAt)}</div>
        </div>
        <div class="invoice-details">
          <div><strong>Customer:</strong> ${order.customerName}</div>
          <div><strong>Phone:</strong> ${order.customerPhone}</div>
          <div><strong>Email:</strong> ${order.customerEmail || 'N/A'}</div>
          <div><strong>Address:</strong> ${order.deliveryAddress || order.customerAddress || 'N/A'}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${(order.products || []).map(p => `
              <tr>
                <td>${p.name}</td>
                <td>${CURRENCY_SYMBOL}${p.price.toFixed(2)}</td>
                <td>${p.quantity}</td>
                <td>${CURRENCY_SYMBOL}${(p.price * p.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="invoice-details">
          <div>Subtotal: ${CURRENCY_SYMBOL}${(order.subtotal || 0).toFixed(2)}</div>
          <div>Shipping: ${CURRENCY_SYMBOL}${(order.shipping || 0).toFixed(2)}</div>
          <div>Tax: ${CURRENCY_SYMBOL}${(order.tax || 0).toFixed(2)}</div>
          ${order.discount ? `<div>Discount: -${CURRENCY_SYMBOL}${(order.discount || 0).toFixed(2)}</div>` : ''}
          <div class="total">Total: ${CURRENCY_SYMBOL}${(order.total || 0).toFixed(2)}</div>
        </div>
        <div style="margin-top: 30px; text-align: center; color: #64748b;">
          <p>Thank you for your business!</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const getStatusBadge = (status?: string) => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      pending: { bg: "bg-[rgba(245,158,11,0.1)]", color: "text-[#f59e0b]", label: "Pending" },
      processing: { bg: "bg-[rgba(59,130,246,0.1)]", color: "text-[#3b82f6]", label: "Processing" },
      shipped: { bg: "bg-[rgba(139,92,246,0.1)]", color: "text-[#8b5cf6]", label: "Shipped" },
      delivered: { bg: "bg-[rgba(37,211,102,0.1)]", color: "text-[#25D366]", label: "Completed" },
      cancelled: { bg: "bg-[rgba(239,68,68,0.1)]", color: "text-[#ef4444]", label: "Cancelled" },
    };
    return styles[status || "pending"] || styles.pending;
  };

  const formatDate = (createdAt: any) => {
    if (!createdAt) return "N/A";
    try {
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return "N/A";
    }
  };

  const formatTime = (createdAt: any) => {
    if (!createdAt) return "";
    try {
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "";
    }
  };

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    if (searchTerm && 
        !order.customerName?.toLowerCase().includes(searchLower) && 
        !order.orderNumber?.toLowerCase().includes(searchLower) &&
        !order.id.includes(searchTerm)) {
      return false;
    }
    
    // Date range filter
    if (dateRangeStart || dateRangeEnd) {
      try {
        const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
        if (dateRangeStart && orderDate < new Date(dateRangeStart)) return false;
        if (dateRangeEnd) {
          const endDate = new Date(dateRangeEnd);
          endDate.setHours(23, 59, 59, 999);
          if (orderDate > endDate) return false;
        }
      } catch {}
    }
    
    // Amount range filter
    if (amountMin !== "" && (order.total || 0) < Number(amountMin)) return false;
    if (amountMax !== "" && (order.total || 0) > Number(amountMax)) return false;
    
    // Payment method filter
    if (paymentFilter !== "all" && order.paymentMethod !== paymentFilter) return false;
    
    return true;
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
    if (sortBy === "amount-high") return (b.total || 0) - (a.total || 0);
    if (sortBy === "amount-low") return (a.total || 0) - (b.total || 0);
    return 0;
  });

  const tabs = [
    { id: "all", label: "All Orders", count: counts.all },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#1e293b] flex items-center gap-2">
            <i className="fas fa-shopping-bag text-[#25D366]"></i>Orders
          </h1>
          <p className="text-[#64748b] text-sm hidden md:block">Track and manage your WhatsApp orders</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <a href={`/order?tenant=${user?.uid}`} target="_blank" className="px-3 py-2 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366] hover:text-[#25D366] flex items-center">
            <i className="fas fa-store mr-2"></i><span className="hidden md:inline">View Store</span>
          </a>
          {selectedOrders.size > 0 && (
            <>
              <button className="px-3 py-2 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600" onClick={() => bulkUpdateStatus("delivered")}>
                <i className="fas fa-check mr-2"></i><span className="hidden md:inline">Complete</span>
              </button>
              <button className="px-3 py-2 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600" onClick={() => bulkUpdateStatus("cancelled")}>
                <i className="fas fa-times mr-2"></i><span className="hidden md:inline">Cancel</span>
              </button>
            </>
          )}
          <button className="px-3 py-2 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366] hover:text-[#25D366]" onClick={exportToCSV}>
            <i className="fas fa-download mr-2"></i><span className="hidden md:inline">Export</span>
          </button>
          <button className="px-3 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg flex items-center" onClick={() => setNewOrderModalOpen(true)}>
            <i className="fas fa-plus mr-2"></i><span className="hidden md:inline">New Order</span><span className="md:hidden">+</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 md:mb-6 overflow-x-auto pb-2 hide-scrollbar">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveStatus(tab.id)} className={`px-3 md:px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap flex items-center gap-2 transition-all ${activeStatus === tab.id ? "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white shadow-lg" : "bg-white border-2 border-[#e2e8f0] text-[#64748b] hover:border-[#25D366] hover:text-[#25D366]"}`}>
            {tab.label}
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/20">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div className="flex gap-3 overflow-x-auto pb-2 mb-6 hide-scrollbar">
        <div className="flex-shrink-0 bg-white px-4 py-3 rounded-xl border border-[#e2e8f0] flex items-center gap-3 min-w-[140px]">
          <div className="w-8 h-8 rounded-full bg-[rgba(37,211,102,0.1)] text-[#25D366] flex items-center justify-center">
            <i className="fas fa-shopping-bag text-sm"></i>
          </div>
          <div>
            <div className="font-extrabold text-lg">{counts.all}</div>
            <div className="text-xs text-[#64748b]">Total Orders</div>
          </div>
        </div>
        
        <div className="flex-shrink-0 bg-white px-4 py-3 rounded-xl border border-[#e2e8f0] flex items-center gap-3 min-w-[140px]">
          <div className="w-8 h-8 rounded-full bg-[rgba(59,130,246,0.1)] text-[#3b82f6] flex items-center justify-center">
            <i className="fas fa-dollar-sign text-sm"></i>
          </div>
          <div>
            <div className="font-extrabold text-lg">{formatCurrency(totalRevenue)}</div>
            <div className="text-xs text-[#64748b]">Total Revenue</div>
          </div>
        </div>
        
        <div className="flex-shrink-0 bg-white px-4 py-3 rounded-xl border border-[#e2e8f0] flex items-center gap-3 min-w-[140px]">
          <div className="w-8 h-8 rounded-full bg-[rgba(245,158,11,0.1)] text-[#f59e0b] flex items-center justify-center">
            <i className="fas fa-clock text-sm"></i>
          </div>
          <div>
            <div className="font-extrabold text-lg">{pendingOrdersCount}</div>
            <div className="text-xs text-[#64748b]">Pending</div>
          </div>
        </div>
        
        <div className="flex-shrink-0 bg-white px-4 py-3 rounded-xl border border-[#e2e8f0] flex items-center gap-3 min-w-[140px]">
          <div className="w-8 h-8 rounded-full bg-[rgba(16,185,129,0.1)] text-[#10b981] flex items-center justify-center">
            <i className="fas fa-check-circle text-sm"></i>
          </div>
          <div>
            <div className="font-extrabold text-lg">{completionRate}%</div>
            <div className="text-xs text-[#64748b]">Completion Rate</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="p-3 md:p-4 border-b border-[#e2e8f0] flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="font-bold flex items-center gap-2">
            <i className="fas fa-list text-[#3b82f6]"></i>
            <span className="text-sm text-[#64748b] font-normal">({filteredOrders.length})</span>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-48">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]"></i>
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" />
            </div>
            <select className="px-3 py-2 border-2 border-[#e2e8f0] rounded-xl text-sm" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
              <option value="all">All Payments</option>
              <option value="Cash on Delivery">COD</option>
              <option value="M-Pesa">M-Pesa</option>
              <option value="Bank Transfer">Bank</option>
            </select>
            <select className="px-3 py-2 border-2 border-[#e2e8f0] rounded-xl text-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="amount-high">Amount ↓</option>
              <option value="amount-low">Amount ↑</option>
            </select>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="p-3 md:p-4 border-b border-[#e2e8f0] bg-[#f8fafc]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#64748b] mb-1">Start Date</label>
              <input 
                type="date" 
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                className="w-full px-3 py-2 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#64748b] mb-1">End Date</label>
              <input 
                type="date" 
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                className="w-full px-3 py-2 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#64748b] mb-1">Min Amount</label>
              <input 
                type="number" 
                placeholder="0"
                value={amountMin}
                onChange={(e) => setAmountMin(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-3 py-2 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#64748b] mb-1">Max Amount</label>
              <input 
                type="number" 
                placeholder="Any"
                value={amountMax}
                onChange={(e) => setAmountMax(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-3 py-2 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]"
              />
            </div>
          </div>
          {(dateRangeStart || dateRangeEnd || amountMin !== "" || amountMax !== "" || paymentFilter !== "all") && (
            <button
              onClick={() => {
                setDateRangeStart("");
                setDateRangeEnd("");
                setAmountMin("");
                setAmountMax("");
                setPaymentFilter("all");
              }}
              className="mt-3 text-sm text-[#25D366] hover:text-[#128C7E] font-semibold"
            >
              <i className="fas fa-times-circle mr-1"></i>Clear All Filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 border-4 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-[#64748b]">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-[#f1f5f9] rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-shopping-bag text-xl md:text-2xl text-[#64748b]"></i>
            </div>
            <h4 className="font-bold text-[#1e293b] mb-2">No orders yet</h4>
            <p className="text-sm text-[#64748b]">When customers order from you, they will appear here.</p>
          </div>
        ) : (
          <>
            {/* Mobile List View */}
            <div className="md:hidden divide-y divide-[#e2e8f0]">
              {filteredOrders.map(order => {
                const statusStyle = getStatusBadge(order.status);
                return (
                  <div key={order.id} className="p-3 hover:bg-[#f8fafc]" onClick={() => openOrderModal(order)}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[#25D366]">#{order.orderNumber || order.id.substring(0, 8)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusStyle.bg} ${statusStyle.color}`}>
                        {statusStyle.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] flex items-center justify-center font-bold text-sm">
                        {order.customerName?.charAt(0) || "C"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate">{order.customerName || "Customer"}</div>
                        <div className="text-xs text-[#64748b]"><i className="fab fa-whatsapp text-[#25D366] mr-1"></i>{order.customerPhone || "N/A"}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{formatCurrency(order.total || 0)}</span>
                      <span className="text-xs text-[#64748b]">{formatDate(order.createdAt)}</span>
                    </div>
                    <div className="flex gap-2 mt-2 pt-2 border-t border-[#e2e8f0]">
                      <button 
                        className="flex-1 py-2 bg-[#f8fafc] rounded-lg text-xs font-semibold flex items-center justify-center gap-1 hover:bg-[#f1f5f9]"
                        onClick={(e) => { e.stopPropagation(); printInvoice(order); }}
                      >
                        <i className="fas fa-print text-[#3b82f6]"></i>Print
                      </button>
                      <button 
                        className="flex-1 py-2 bg-[#f8fafc] rounded-lg text-xs font-semibold flex items-center justify-center gap-1 hover:bg-[#f1f5f9]"
                        onClick={(e) => { e.stopPropagation(); handleDuplicateOrder(order); }}
                      >
                        <i className="fas fa-copy text-[#25D366]"></i>Duplicate
                      </button>
                      <button 
                        className="flex-1 py-2 bg-[#f8fafc] rounded-lg text-xs font-semibold flex items-center justify-center gap-1 hover:bg-[#f1f5f9]"
                        onClick={(e) => { e.stopPropagation(); sendWhatsAppNotification(order, order.status as OrderStatus); }}
                      >
                        <i className="fab fa-whatsapp text-[#25D366]"></i>Notify
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-[#f8fafc]">
                    <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-[#64748b] w-12">
                      <div className={`w-5 h-5 border-2 rounded cursor-pointer flex items-center justify-center ${selectedOrders.size === orders.length ? "bg-[#25D366] border-[#25D366]" : "border-[#e2e8f0]"}`} onClick={toggleSelectAll}>
                        {selectedOrders.size === orders.length && <i className="fas fa-check text-white text-xs"></i>}
                      </div>
                    </th>
                    <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-[#64748b]">Order ID</th>
                    <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-[#64748b]">Customer</th>
                    <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-[#64748b]">Products</th>
                    <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-[#64748b]">Amount</th>
                    <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-[#64748b]">Status</th>
                    <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-[#64748b]">Date</th>
                    <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-[#64748b]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => {
                    const statusStyle = getStatusBadge(order.status);
                    return (
                      <tr key={order.id} className="border-t border-[#e2e8f0] hover:bg-[rgba(37,211,102,0.02)]">
                        <td className="p-4">
                          <div className={`w-5 h-5 border-2 rounded cursor-pointer flex items-center justify-center ${selectedOrders.has(order.id) ? "bg-[#25D366] border-[#25D366]" : "border-[#e2e8f0]"}`} onClick={() => toggleSelect(order.id)}>
                            {selectedOrders.has(order.id) && <i className="fas fa-check text-white text-xs"></i>}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-[#25D366] cursor-pointer" onClick={() => openOrderModal(order)}>#{order.orderNumber || order.id.substring(0, 8)}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] flex items-center justify-center font-bold text-sm">
                              {order.customerName?.charAt(0) || "C"}
                            </div>
                            <div>
                              <div className="font-bold">{order.customerName || "Customer"}</div>
                              <div className="text-xs text-[#64748b]"><i className="fab fa-whatsapp text-[#25D366] mr-1"></i>{order.customerPhone || "N/A"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] flex items-center justify-center text-2xl">📦</div>
                            <div>
                              <div className="font-bold text-sm">{order.products?.[0]?.name || "Product"}</div>
                              <div className="text-xs text-[#64748b]">Qty: {order.products?.[0]?.quantity || 1}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-bold text-lg">{formatCurrency(order.total || 0)}<div className="text-xs text-[#64748b] font-normal">{order.paymentMethod || "N/A"}</div></td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 w-fit ${statusStyle.bg} ${statusStyle.color}`}>
                            <i className="fas fa-circle text-[0.5rem]"></i>{statusStyle.label}
                          </span>
                        </td>
                        <td className="p-4 text-sm">
                          <div className="font-bold">{formatDate(order.createdAt)}</div>
                          <div className="text-xs text-[#64748b]">{formatTime(order.createdAt)}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button className="w-9 h-9 flex items-center justify-center text-[#64748b] hover:text-[#3b82f6] hover:bg-[#f1f5f9] rounded-lg transition-all" onClick={() => printInvoice(order)} title="Print Invoice"><i className="fas fa-print"></i></button>
                            <button className="w-9 h-9 flex items-center justify-center text-[#64748b] hover:text-[#25D366] hover:bg-[#f1f5f9] rounded-lg transition-all" onClick={() => handleDuplicateOrder(order)} title="Duplicate"><i className="fas fa-copy"></i></button>
                            <button className="w-9 h-9 flex items-center justify-center text-[#64748b] hover:text-[#25D366] hover:bg-[#f1f5f9] rounded-lg transition-all" onClick={() => sendWhatsAppNotification(order, order.status as OrderStatus)} title="Send WhatsApp"><i className="fab fa-whatsapp"></i></button>
                            <button className="w-9 h-9 flex items-center justify-center text-[#64748b] hover:text-[#25D366] hover:bg-[#f1f5f9] rounded-lg transition-all" onClick={() => openOrderModal(order)}><i className="fas fa-eye"></i></button>
                            <button className="w-9 h-9 flex items-center justify-center text-[#64748b] hover:text-[#25D366] hover:bg-[#f1f5f9] rounded-lg transition-all" onClick={() => openEditModal(order)}><i className="fas fa-edit"></i></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 md:p-4 border-t border-[#e2e8f0] flex justify-between items-center text-sm text-[#64748b]">
              <div>{filteredOrders.length} orders</div>
              <div className="flex gap-2">
                <button className="px-3 py-2 border-2 border-[#e2e8f0] rounded-lg text-[#64748b] font-semibold text-sm hover:border-[#25D366] disabled:opacity-50" disabled><i className="fas fa-chevron-left"></i></button>
                <button className="px-3 py-2 border-2 border-[#25D366] bg-[#25D366] text-white rounded-lg font-semibold text-sm">1</button>
                <button className="px-3 py-2 border-2 border-[#e2e8f0] rounded-lg text-[#64748b] font-semibold text-sm hover:border-[#25D366]"><i className="fas fa-chevron-right"></i></button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      {modalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-50 flex items-start justify-center p-0 md:p-4 lg:p-8 overflow-y-auto" onClick={() => setModalOpen(false)}>
          <div className="bg-white w-full min-h-screen md:min-h-0 md:rounded-2xl md:max-w-[1000px] md:max-h-[calc(100vh-4rem)] overflow-hidden shadow-2xl animate-[modalSlideIn_0.4s_cubic-bezier(0.16,1,0.3,1)] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Mobile Header */}
            <div className="md:hidden sticky top-0 z-10 bg-white border-b border-[#e2e8f0]">
              <div className="p-3 flex items-center justify-between bg-gradient-to-br from-[rgba(37,211,102,0.05)] to-[rgba(18,140,126,0.05)]">
                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] rounded-lg" onClick={() => setModalOpen(false)}>
                    <i className="fas fa-arrow-left"></i>
                  </button>
                  <div className="w-8 h-8 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-lg flex items-center justify-center text-white text-sm">
                    <i className="fas fa-shopping-bag"></i>
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold">
                      <span className="text-[#25D366]">#{selectedOrder.orderNumber || selectedOrder.id.substring(0, 8)}</span>
                    </h2>
                    <p className="text-xs text-[#64748b]">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:bg-[#ef4444] hover:text-white rounded-lg" onClick={() => { if(confirm("Cancel this order?")) updateOrderStatus("cancelled"); }}>
                    <i className="fas fa-trash-alt text-sm"></i>
                  </button>
                </div>
              </div>
              {/* Status badge */}
              <div className={`px-3 py-2 text-xs font-bold uppercase ${selectedOrder.status === 'pending' ? 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b]' : selectedOrder.status === 'processing' ? 'bg-[rgba(59,130,246,0.1)] text-[#3b82f6]' : selectedOrder.status === 'shipped' ? 'bg-[rgba(139,92,246,0.1)] text-[#8b5cf6]' : selectedOrder.status === 'delivered' ? 'bg-[rgba(37,211,102,0.1)] text-[#10b981]' : 'bg-[rgba(239,68,68,0.1)] text-[#ef4444]'}`}>
                {selectedOrder.status === "pending" ? "Payment Pending" : selectedOrder.status === "processing" ? "Order Processing" : selectedOrder.status === "shipped" ? "Order Shipped" : "Order Completed"}
              </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden md:block p-4 md:p-6 border-b border-[#e2e8f0] flex justify-between items-center bg-gradient-to-br from-[rgba(37,211,102,0.05)] to-[rgba(18,140,126,0.05)]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                  <i className="fas fa-shopping-bag"></i>
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-extrabold flex items-center gap-2">
                    Order <span className="text-[#25D366]">#{selectedOrder.orderNumber || selectedOrder.id.substring(0, 8)}</span>
                    <select 
                      value={selectedOrder.status || 'pending'}
                      onChange={(e) => updateOrderStatus(e.target.value as OrderStatus)}
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase cursor-pointer border-0 ${selectedOrder.status === 'pending' ? 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b]' : selectedOrder.status === 'processing' ? 'bg-[rgba(59,130,246,0.1)] text-[#3b82f6]' : selectedOrder.status === 'shipped' ? 'bg-[rgba(139,92,246,0.1)] text-[#8b5cf6]' : selectedOrder.status === 'delivered' ? 'bg-[rgba(37,211,102,0.1)] text-[#10b981]' : 'bg-[rgba(239,68,68,0.1)] text-[#ef4444]'}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-[#64748b] mt-1">
                    <span><i className="far fa-calendar"></i> {formatDate(selectedOrder.createdAt)}</span>
                    <span className="text-[#e2e8f0]">|</span>
                    <span><i className="fas fa-clock"></i> {formatTime(selectedOrder.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="w-10 h-10 flex items-center justify-center text-[#64748b] hover:text-[#3b82f6] hover:bg-[#f1f5f9] rounded-xl transition-all" onClick={() => printInvoice(selectedOrder)} title="Print Invoice"><i className="fas fa-print"></i></button>
                <button className="w-10 h-10 flex items-center justify-center text-[#64748b] hover:text-[#25D366] hover:bg-[#f1f5f9] rounded-xl transition-all" onClick={() => handleDuplicateOrder(selectedOrder)} title="Duplicate Order"><i className="fas fa-copy"></i></button>
                <button className="w-10 h-10 flex items-center justify-center text-[#64748b] hover:text-[#25D366] hover:bg-[#f1f5f9] rounded-xl transition-all" onClick={() => sendWhatsAppNotification(selectedOrder, selectedOrder.status as OrderStatus)} title="Send WhatsApp"><i className="fab fa-whatsapp"></i></button>
                <button className="w-10 h-10 flex items-center justify-center text-[#64748b] hover:bg-[#ef4444] hover:text-white rounded-xl transition-all" onClick={() => { if(confirm("Cancel this order?")) updateOrderStatus("cancelled"); }}><i className="fas fa-times"></i></button>
                <button className="w-10 h-10 flex items-center justify-center text-[#64748b] hover:bg-[#ef4444] hover:text-white rounded-xl transition-all" onClick={() => setModalOpen(false)}><i className="fas fa-times"></i></button>
              </div>
            </div>

            {/* Status Bar - Desktop only */}
            <div className={`hidden md:flex p-4 justify-between items-center border-b ${selectedOrder.status === "pending" ? "bg-gradient-to-r from-[rgba(245,158,11,0.1)] to-[rgba(245,158,11,0.05)]" : selectedOrder.status === "processing" ? "bg-gradient-to-r from-[rgba(59,130,246,0.1)] to-[rgba(59,130,246,0.05)]" : selectedOrder.status === "shipped" ? "bg-gradient-to-r from-[rgba(139,92,246,0.1)] to-[rgba(139,92,246,0.05)]" : "bg-gradient-to-r from-[rgba(37,211,102,0.1)] to-[rgba(37,211,102,0.05)]"}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${selectedOrder.status === "pending" ? "bg-[rgba(245,158,11,0.2)] text-[#f59e0b]" : selectedOrder.status === "processing" ? "bg-[rgba(59,130,246,0.2)] text-[#3b82f6]" : selectedOrder.status === "shipped" ? "bg-[rgba(139,92,246,0.2)] text-[#8b5cf6]" : "bg-[rgba(37,211,102,0.2)] text-[#10b981]"}`}>
                  <i className={`fas ${selectedOrder.status === "pending" ? "fa-clock" : selectedOrder.status === "processing" ? "fa-cog" : selectedOrder.status === "shipped" ? "fa-shipping-fast" : "fa-check-circle"}`}></i>
                </div>
                <div>
                  <h3 className="font-bold text-lg capitalize">{selectedOrder.status === "pending" ? "Payment Pending" : selectedOrder.status === "processing" ? "Order Processing" : selectedOrder.status === "shipped" ? "Order Shipped" : "Order Completed"}</h3>
                  <p className="text-sm text-[#64748b]">{selectedOrder.status === "pending" ? "Awaiting payment confirmation" : selectedOrder.status === "processing" ? "Your order is being prepared" : selectedOrder.status === "shipped" ? "Your order is on its way" : "Order delivered successfully"}</p>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr]">
                <div className="p-4 md:p-6 border-r border-[#e2e8f0]">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#64748b] mb-4 flex items-center gap-2">
                    <i className="fas fa-box text-[#25D366]"></i>Order Items ({selectedOrder.products?.length || (selectedOrder.productName ? 1 : 0)})
                  </div>
                  
                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3 mb-4">
                    {selectedOrder.products && selectedOrder.products.length > 0 ? (
                      selectedOrder.products.map((product, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] flex items-center justify-center text-xl shrink-0">📦</div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm truncate">{product.name}</h4>
                            <div className="flex items-center gap-2 text-xs text-[#64748b]">
                              <span>{formatCurrency(product.price)} x {product.quantity}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-sm">{formatCurrency(product.price * product.quantity)}</div>
                          </div>
                        </div>
                      ))
                    ) : selectedOrder.productName ? (
                      <div className="flex items-center gap-3 p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] flex items-center justify-center text-xl shrink-0">📦</div>
                        <div className="flex-1">
                          <h4 className="font-bold text-sm">{selectedOrder.productName}</h4>
                          <div className="text-xs text-[#64748b]">Qty: {selectedOrder.quantity || 1}</div>
                        </div>
                        <div className="font-bold text-sm">{formatCurrency((selectedOrder.basePrice || 0) * (selectedOrder.quantity || 1))}</div>
                      </div>
                    ) : (
                      <div className="text-center text-[#64748b] py-4">No items</div>
                    )}
                  </div>

                  {/* Desktop Table View */}
                  <table className="hidden md:table w-full border-collapse mb-4">
                    <thead>
                      <tr className="text-left">
                        <th className="py-3 px-3 text-xs font-bold uppercase tracking-wider text-[#64748b] bg-[#f8fafc] border-b-2 border-[#e2e8f0]">Product</th>
                        <th className="py-3 px-3 text-xs font-bold uppercase tracking-wider text-[#64748b] bg-[#f8fafc] border-b-2 border-[#e2e8f0]">Price</th>
                        <th className="py-3 px-3 text-xs font-bold uppercase tracking-wider text-[#64748b] bg-[#f8fafc] border-b-2 border-[#e2e8f0]">Qty</th>
                        <th className="py-3 px-3 text-xs font-bold uppercase tracking-wider text-[#64748b] bg-[#f8fafc] border-b-2 border-[#e2e8f0]">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.products && selectedOrder.products.length > 0 ? (
                        selectedOrder.products.map((product, idx) => (
                          <tr key={idx} className="border-b border-[#e2e8f0]">
                            <td className="py-4 px-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] flex items-center justify-center text-2xl overflow-hidden">📦</div>
                                <div>
                                  <h4 className="font-bold text-sm">{product.name}</h4>
                                  <span className="text-xs text-[#64748b]">Qty: {product.quantity}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-3 font-semibold">{formatCurrency(product.price)}</td>
                            <td className="py-4 px-3 text-[#64748b]">x {product.quantity}</td>
                            <td className="py-4 px-3 font-bold">{formatCurrency(product.price * product.quantity)}</td>
                          </tr>
                        ))
                      ) : selectedOrder.productName ? (
                        <tr className="border-b border-[#e2e8f0]">
                          <td className="py-4 px-3">
                            <div className="flex items-center gap-3">
                              {selectedOrder.productImage ? (
                                <img src={selectedOrder.productImage} alt={selectedOrder.productName} className="w-12 h-12 rounded-lg object-cover" />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] flex items-center justify-center text-2xl">📦</div>
                              )}
                              <div>
                                <h4 className="font-bold text-sm">{selectedOrder.productName}</h4>
                                <span className="text-xs text-[#64748b]">Qty: {selectedOrder.quantity || 1}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-3 font-semibold">{formatCurrency(selectedOrder.basePrice || 0)}</td>
                          <td className="py-4 px-3 text-[#64748b]">x {selectedOrder.quantity || 1}</td>
                          <td className="py-4 px-3 font-bold">{formatCurrency((selectedOrder.basePrice || 0) * (selectedOrder.quantity || 1))}</td>
                        </tr>
                      ) : (
                        <tr><td colSpan={4} className="py-4 px-3 text-center text-[#64748b]">No items</td></tr>
                      )}
                    </tbody>
                  </table>

                  {/* Selected Specs */}
                  {selectedOrder.selectedSpecs && Object.keys(selectedOrder.selectedSpecs).filter(k => selectedOrder.selectedSpecs![k]).length > 0 && (
                    <div className="bg-[rgba(37,211,102,0.05)] border border-[#25D366] rounded-xl p-4 mb-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-[#128C7E] mb-3 flex items-center gap-2">
                        <i className="fas fa-sliders-h"></i>Selected Options
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(selectedOrder.selectedSpecs).filter(([_, v]) => v).map(([key, value]) => (
                          <span key={key} className="bg-white px-3 py-1.5 rounded-full text-sm font-semibold border border-[#e2e8f0]">
                            <i className="fas fa-check text-[#10b981] mr-1.5 text-xs"></i>
                            {key.replace(/_/g, " ")}: {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-[#f8fafc] rounded-xl p-5">
                    <div className="flex justify-between py-2 border-b border-dashed border-[#e2e8f0]">
                      <span className="text-[#64748b]">Subtotal</span>
                      <span className="font-semibold">{formatCurrency(selectedOrder.subtotal || 0)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-dashed border-[#e2e8f0]">
                      <span className="text-[#64748b]">Shipping</span>
                      <span className="font-semibold">{selectedOrder.deliveryMethod ? `${selectedOrder.deliveryMethod} - ${formatCurrency(selectedOrder.deliveryCost || 0)}` : formatCurrency(selectedOrder.deliveryCost || 0)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-dashed border-[#e2e8f0]">
                      <span className="text-[#64748b]">Tax (16%)</span>
                      <span className="font-semibold">{formatCurrency(selectedOrder.tax || 0)}</span>
                    </div>
                    {(selectedOrder.discount || 0) > 0 && (
                      <div className="flex justify-between py-2 border-b border-dashed border-[#e2e8f0] text-[#10b981]">
                        <span><i className="fas fa-tag mr-2"></i>Discount</span>
                        <span className="font-semibold">-{formatCurrency(selectedOrder.discount || 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-3 mt-2 border-t-2 border-[#e2e8f0] text-xl font-extrabold">
                      <span>Total</span>
                      <span className="text-[#25D366]">{formatCurrency(selectedOrder.total || 0)}</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#64748b] mb-4 flex items-center gap-2">
                      <i className="fas fa-history text-[#3b82f6]"></i>Order Timeline
                    </div>
                    <div className="relative pl-6">
                      <div className="absolute left-[5px] top-0 bottom-0 w-[2px] bg-[#e2e8f0]"></div>
                      <div className="relative pb-6">
                        <div className="absolute left-[-21px] w-3 h-3 rounded-full bg-[#10b981] border-2 border-white shadow-[0_0_0_2px_#10b981]"></div>
                        <div className="bg-white border border-[#e2e8f0] rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-sm">Order Placed</span>
                            <span className="text-xs text-[#64748b]">{formatTime(selectedOrder.createdAt)}</span>
                          </div>
                          <p className="text-xs text-[#64748b]">Order #{selectedOrder.orderNumber || selectedOrder.id.substring(0, 8)} created</p>
                        </div>
                      </div>
                      <div className="relative pb-6">
                        <div className={`absolute left-[-21px] w-3 h-3 rounded-full border-2 border-white ${selectedOrder.status === "pending" ? "bg-[#f59e0b] shadow-[0_0_0_2px_#f59e0b]" : "bg-[#10b981] shadow-[0_0_0_2px_#10b981]"}`}></div>
                        <div className="bg-white border border-[#e2e8f0] rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-sm">Payment Pending</span>
                            <span className="text-xs text-[#64748b]">{selectedOrder.status === "pending" ? "Pending" : "Done"}</span>
                          </div>
                          <p className="text-xs text-[#64748b]">{selectedOrder.paymentMethod || "Cash on Delivery"} selected</p>
                        </div>
                      </div>
                      <div className="relative">
                        <div className={`absolute left-[-21px] w-3 h-3 rounded-full border-2 border-white ${selectedOrder.status === "processing" || selectedOrder.status === "delivered" ? "bg-[#10b981] shadow-[0_0_0_2px_#10b981]" : "bg-[#e2e8f0] shadow-[0_0_0_2px_#e2e8f0]"}`}></div>
                        <div className="bg-white border border-[#e2e8f0] rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-sm">{selectedOrder.status === "delivered" ? "Completed" : "Processing"}</span>
                            <span className="text-xs text-[#64748b]">{selectedOrder.status === "delivered" ? "Done" : "Pending"}</span>
                          </div>
                          <p className="text-xs text-[#64748b]">{selectedOrder.status === "delivered" ? "Order delivered successfully" : "Order is being prepared"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-[#f8fafc]">
                  <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] mb-6">
                    <div className="flex items-center gap-3 mb-5 pb-5 border-b border-[#e2e8f0]">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center font-bold text-lg text-white">
                        {selectedOrder.customerName?.charAt(0) || "C"}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{selectedOrder.customerName || "Customer"}</h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[rgba(37,211,102,0.1)] text-[#25D366] rounded-full text-xs font-bold">
                          <i className="fas fa-crown"></i> Customer
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 text-sm">
                        <i className="fas fa-phone text-[#64748b] w-5"></i>
                        <a href={`tel:${selectedOrder.customerPhone}`} className="text-[#25D366]">{selectedOrder.customerPhone || "N/A"}</a>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <i className="fas fa-envelope text-[#64748b] w-5"></i>
                        <span>{selectedOrder.customerEmail || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <i className="fas fa-map-marker-alt text-[#64748b] w-5"></i>
                        <span>{selectedOrder.deliveryAddress || selectedOrder.customerAddress || "N/A"}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <button className="py-2.5 px-3 border border-[#e2e8f0] rounded-lg bg-white text-sm font-semibold flex items-center justify-center gap-2 hover:border-[#25D366] hover:text-[#25D366] transition-all">
                        <i className="fas fa-user"></i> Profile
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] mb-6">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#64748b] mb-4">Order Information</div>
                    <div className="flex justify-between py-2 border-b border-[#e2e8f0] text-sm">
                      <span className="text-[#64748b]">Order Number</span>
                      <span className="font-semibold">#{selectedOrder.orderNumber || selectedOrder.id.substring(0, 8)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#e2e8f0] text-sm">
                      <span className="text-[#64748b]">Date</span>
                      <span className="font-semibold">{formatDate(selectedOrder.createdAt)}</span>
                    </div>
                    {(selectedOrder.deliveryAddress || selectedOrder.customerAddress) && (
                      <div className="py-2 border-b border-[#e2e8f0] text-sm">
                        <span className="text-[#64748b]">Delivery Address</span>
                        <div className="font-semibold mt-1">{selectedOrder.deliveryAddress || selectedOrder.customerAddress}</div>
                      </div>
                    )}
                    {selectedOrder.deliveryMethod && (
                      <div className="flex justify-between py-2 border-b border-[#e2e8f0] text-sm">
                        <span className="text-[#64748b]">Delivery Method</span>
                        <span className="font-semibold capitalize">{selectedOrder.deliveryMethod}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-b border-[#e2e8f0] text-sm">
                      <span className="text-[#64748b]">Source</span>
                      <span className="font-semibold">
                        <i className="fab fa-whatsapp text-[#25D366]"></i> WhatsApp
                      </span>
                    </div>
                  </div>

                  {/* Payment Confirmation */}
                  <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] mb-6">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#64748b] mb-4 flex items-center gap-2">
                      <i className="fas fa-credit-card text-[#10b981]"></i>Payment Information
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#e2e8f0] text-sm">
                      <span className="text-[#64748b]">Payment Method</span>
                      <span className="font-semibold flex items-center gap-2">
                        <i className={`fas ${selectedOrder.paymentMethod === "mpesa" || selectedOrder.paymentMethod === "M-Pesa" ? "fa-mobile-alt text-[#00A650]" : selectedOrder.paymentMethod === "bank" || selectedOrder.paymentMethod === "Bank Transfer" ? "fa-university text-[#64748b]" : "fa-money-bill-wave text-[#10b981]"}`}></i> 
                        {selectedOrder.paymentMethod || "COD"}
                      </span>
                    </div>
                    {selectedOrder.paymentDetails && (
                      <div className="py-2 border-b border-[#e2e8f0] text-sm">
                        <div className="text-[#64748b] mb-1">
                          {selectedOrder.paymentMethod === "mpesa" || selectedOrder.paymentMethod === "M-Pesa" 
                            ? "M-Pesa Payment Message" 
                            : "Payment Reference / Transaction ID"}
                        </div>
                        <div className={`font-semibold p-2.5 rounded-lg border ${
                          selectedOrder.paymentMethod === "mpesa" || selectedOrder.paymentMethod === "M-Pesa"
                            ? "bg-[#ecfdf5] border-[#10b981] text-[#065f46] whitespace-pre-wrap"
                            : "bg-[#f8fafc] border-[#e2e8f0]"
                        }`}>
                          {selectedOrder.paymentDetails}
                        </div>
                      </div>
                    )}
                    {selectedOrder.orderNotes && (
                      <div className="py-2 border-b border-[#e2e8f0] text-sm">
                        <div className="text-[#64748b] mb-1">Customer Message / Notes</div>
                        <div className="font-semibold bg-[#fffbeb] p-2.5 rounded-lg border border-[#fde68a] text-[#92400e]">{selectedOrder.orderNotes}</div>
                      </div>
                    )}
                    <div className="flex justify-between py-2 text-sm">
                      <span className="text-[#64748b]">Payment Status</span>
                      <span className={`font-semibold ${selectedOrder.status === "pending" ? "text-[#f59e0b]" : selectedOrder.status === "cancelled" ? "text-[#ef4444]" : "text-[#10b981]"}`}>
                        {selectedOrder.status === "pending" ? "Awaiting Confirmation" : selectedOrder.status === "cancelled" ? "Cancelled" : "Confirmed"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-5 border border-[#e2e8f0]">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#64748b] mb-4">Internal Notes</div>
                    {selectedOrder.notes && (
                      <div className="flex gap-3 py-3 border-b border-[#e2e8f0]">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">SM</div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="font-semibold text-sm">Staff</span>
                            <span className="text-xs text-[#64748b]">{formatTime(selectedOrder.createdAt)}</span>
                          </div>
                          <p className="text-xs text-[#64748b]">{selectedOrder.notes}</p>
                        </div>
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-[#e2e8f0]">
                      <textarea 
                        className="w-full p-3 border border-[#e2e8f0] rounded-lg text-sm resize-none min-h-[60px] focus:outline-none focus:border-[#25D366]"
                        placeholder="Add a note..."
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 md:p-5 border-t border-[#e2e8f0] flex flex-col md:flex-row justify-between items-center gap-3 bg-white">
              <div className="flex gap-2 w-full md:w-auto">
                <button className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366] flex items-center justify-center gap-2">
                  <i className="fas fa-file-invoice"></i> <span className="hidden md:inline">Invoice</span>
                </button>
                <button className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366] flex items-center justify-center gap-2">
                  <i className="fas fa-receipt"></i> <span className="hidden md:inline">Receipt</span>
                </button>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                {/* Confirm Payment Button - Only show for pending orders with payment method */}
                {selectedOrder.status === "pending" && selectedOrder.paymentMethod && selectedOrder.paymentMethod !== "cod" && selectedOrder.paymentMethod !== "Cash on Delivery" && (
                  <button 
                    className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white rounded-xl font-semibold text-sm hover:shadow-lg flex items-center justify-center gap-2" 
                    onClick={() => updateOrderStatus("processing")}
                  >
                    <i className="fas fa-check-circle"></i> <span className="hidden md:inline">Confirm Payment</span>
                  </button>
                )}
                <div className="relative flex-1 md:flex-none">
                  <button className="w-full md:w-auto px-3 md:px-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366] flex items-center justify-center gap-2" onClick={() => setShowStatusMenu(!showStatusMenu)}>
                    <i className="fas fa-tag"></i> <span className="hidden md:inline">Update Status</span> <i className="fas fa-chevron-up ml-1 md:ml-2"></i>
                  </button>
                  <div className={`absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg border border-[#e2e8f0] min-w-[180px] z-50 ${showStatusMenu ? "block" : "hidden"}`}>
                    <div className="py-1">
                      <div className="px-4 py-2 cursor-pointer text-sm flex items-center gap-3 hover:bg-[#f8fafc]" onClick={() => updateOrderStatus("delivered")}>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span> Mark Delivered
                      </div>
                    </div>
                  </div>
                </div>
                <button className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm hover:shadow-lg flex items-center justify-center gap-2" onClick={processOrder}>
                  <i className="fas fa-check"></i> <span className="hidden md:inline">Mark Delivered</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {newOrderModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-50 flex items-start justify-center p-2 md:p-4 overflow-y-auto" onClick={() => setNewOrderModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-[900px] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-4 md:p-5 border-b border-[#e2e8f0] flex justify-between items-center bg-gradient-to-r from-[rgba(37,211,102,0.05)] to-[rgba(18,140,126,0.05)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-11 md:h-11 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-lg md:rounded-[8px] flex items-center justify-center text-white text-lg md:text-xl shadow-lg">
                  <i className="fas fa-plus"></i>
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-extrabold">New Order</h2>
                  <p className="text-xs md:text-sm text-[#64748b] hidden md:block">Add a new order for your customer</p>
                </div>
              </div>
              <button className="w-9 h-9 flex items-center justify-center text-[#64748b] hover:bg-[#ef4444] hover:text-white rounded-lg transition-all" onClick={() => setNewOrderModalOpen(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Customer Selection */}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#64748b] mb-4 flex items-center gap-2">
                      <i className="fas fa-user text-[#25D366]"></i>Customer
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Search Customer <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]"></i>
                        <input 
                          type="text" 
                          className="w-full pl-10 pr-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" 
                          placeholder="Search by name or phone..."
                          value={newOrderCustomerSearch}
                          onChange={(e) => setNewOrderCustomerSearch(e.target.value)}
                        />
                        {newOrderCustomerSearch && customers.filter(c => 
                          c.name.toLowerCase().includes(newOrderCustomerSearch.toLowerCase()) ||
                          c.phone.includes(newOrderCustomerSearch)
                        ).length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e2e8f0] rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                            {customers.filter(c => 
                              c.name.toLowerCase().includes(newOrderCustomerSearch.toLowerCase()) ||
                              c.phone.includes(newOrderCustomerSearch)
                            ).map(customer => (
                              <div 
                                key={customer.id} 
                                className="flex items-center gap-3 p-3 hover:bg-[#f8fafc] cursor-pointer"
                                onClick={() => {
                                  setNewOrderForm(prev => ({
                                    ...prev,
                                    customerName: customer.name,
                                    customerPhone: customer.phone,
                                    customerEmail: customer.email || "",
                                    customerAddress: customer.location || ""
                                  }));
                                  setNewOrderCustomerSearch("");
                                }}
                              >
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white font-bold text-sm">
                                  {customer.name.split(" ").map(n => n[0]).join("").substring(0,2)}
                                </div>
                                <div>
                                  <div className="font-semibold text-sm">{customer.name}</div>
                                  <div className="text-xs text-[#64748b]">{customer.phone}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {newOrderForm.customerName && (
                        <div className="flex items-center gap-3 p-3 bg-[rgba(37,211,102,0.05)] border border-[#25D366] rounded-xl mt-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white font-bold">
                            {newOrderForm.customerName.split(" ").map(n => n[0]).join("").substring(0,2)}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold">{newOrderForm.customerName}</div>
                            <div className="text-xs text-[#64748b]">{newOrderForm.customerPhone}</div>
                          </div>
                          <button 
                            className="w-7 h-7 rounded-full bg-[#f8fafc] text-red-500 flex items-center justify-center"
                            onClick={() => setNewOrderForm(prev => ({ ...prev, customerName: "", customerPhone: "", customerEmail: "", customerAddress: "" }))}
                          >
                            <i className="fas fa-times text-xs"></i>
                          </button>
                        </div>
                      )}
                    </div>

                    <button 
                      className="w-full py-3 mt-3 bg-white border-2 border-[#e2e8f0] rounded-xl text-[#25D366] font-semibold flex items-center justify-center gap-2 hover:border-[#25D366]"
                      onClick={() => {
                        setNewOrderForm(prev => ({ ...prev, customerName: "New Customer", customerPhone: "", customerEmail: "", customerAddress: "" }));
                      }}
                    >
                      <i className="fas fa-user-plus"></i>
                      Create New Customer
                    </button>
                  </div>

                  {/* Products */}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#64748b] mb-4 flex items-center gap-2">
                      <i className="fas fa-box text-[#25D366]"></i>Products <span className="text-red-500">*</span>
                    </div>
                    
                    <div className="border-2 border-[#e2e8f0] rounded-xl overflow-hidden">
                      <div className="p-3 bg-[#f8fafc] border-b border-[#e2e8f0]">
                        <input 
                          type="text" 
                          placeholder="Search products..."
                          className="w-full px-4 py-2 border border-[#e2e8f0] rounded-lg text-sm"
                        />
                      </div>
                      
                      <div className="max-h-48 overflow-y-auto">
                        {products.length === 0 ? (
                          <div className="p-4 text-center text-[#64748b]">No products available</div>
                        ) : (
                          products.slice(0, 5).map(product => (
                            <div key={product.id} className="flex items-center gap-3 p-3 border-b border-[#e2e8f0]">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] flex items-center justify-center text-2xl">📦</div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm truncate">{product.name}</div>
                                <div className="text-xs text-[#64748b]">{formatCurrency(product.price)} each</div>
                              </div>
                              <button 
                                onClick={() => addProductToOrder(product)}
                                className="w-8 h-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center"
                              >
                                <i className="fas fa-plus text-xs"></i>
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Selected Products */}
                  {newOrderForm.selectedProducts.length > 0 && (
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-[#64748b] mb-4 flex items-center gap-2">
                        <i className="fas fa-shopping-cart text-[#25D366]"></i>Order Items ({newOrderForm.selectedProducts.length})
                      </div>
                      <div className="space-y-2">
                        {newOrderForm.selectedProducts.map(item => (
                          <div key={item.productId} className="flex items-center gap-3 p-3 bg-[#f8fafc] rounded-xl">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] flex items-center justify-center text-xl">📦</div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm truncate">{item.name}</div>
                              <div className="text-xs text-[#64748b]">{formatCurrency(item.price)} each</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => updateProductQuantity(item.productId, item.quantity - 1)} className="w-9 h-9 md:w-7 md:h-7 rounded-lg border border-[#e2e8f0] flex items-center justify-center active:scale-95 transition-transform">-</button>
                              <span className="font-bold w-8 text-center">{item.quantity}</span>
                              <button onClick={() => updateProductQuantity(item.productId, item.quantity + 1)} className="w-9 h-9 md:w-7 md:h-7 rounded-lg border border-[#e2e8f0] flex items-center justify-center active:scale-95 transition-transform">+</button>
                            </div>
                            <div className="font-bold text-[#25D366] min-w-[60px] text-right">{formatCurrency(item.price * item.quantity)}</div>
                            <button onClick={() => removeProductFromOrder(item.productId)} className="w-7 h-7 rounded-full bg-red-100 text-red-500 flex items-center justify-center">
                              <i className="fas fa-trash text-xs"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Order Summary */}
                  {newOrderForm.selectedProducts.length > 0 && (() => {
                    const totals = calculateOrderTotal();
                    return (
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-[#64748b] mb-4 flex items-center gap-2">
                          <i className="fas fa-calculator text-[#25D366]"></i>Order Summary
                        </div>
                        <div className="bg-[#f8fafc] rounded-xl p-4">
                          <div className="flex justify-between py-2 text-sm">
                            <span className="text-[#64748b]">Subtotal ({newOrderForm.selectedProducts.length} items)</span>
                            <span className="font-semibold">{formatCurrency(totals.subtotal)}</span>
                          </div>
                          <div className="flex justify-between py-2 text-sm">
                            <span className="text-[#64748b]">Shipping</span>
                            <span className="font-semibold">{formatCurrency(totals.shipping)}</span>
                          </div>
                          <div className="flex justify-between py-2 text-sm">
                            <span className="text-[#64748b]">Tax (16%)</span>
                            <span className="font-semibold">{formatCurrency(totals.tax)}</span>
                          </div>
                          <div className="flex justify-between py-2 text-sm text-[#10b981]">
                            <span><i className="fas fa-tag mr-2"></i>Discount</span>
                            <span className="font-semibold">-{formatCurrency(totals.discount)}</span>
                          </div>
                          <div className="flex justify-between pt-3 mt-2 border-t-2 border-[#e2e8f0] text-lg font-extrabold">
                            <span>Total</span>
                            <span className="text-[#25D366]">{formatCurrency(totals.total)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Payment Method */}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#64748b] mb-4 flex items-center gap-2">
                      <i className="fas fa-credit-card text-[#25D366]"></i>Payment Method <span className="text-red-500">*</span>
                    </div>
                    
                    <div className="space-y-2">
                      {[
                        { id: "Cash on Delivery", icon: "fa-money-bill-wave", desc: "Customer pays when receiving" },
                        { id: "M-Pesa", icon: "fa-mobile-alt", desc: "Mobile money payment" },
                        { id: "Bank Transfer", icon: "fa-university", desc: "Direct bank deposit" }
                      ].map(method => (
                        <div 
                          key={method.id}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${newOrderForm.paymentMethod === method.id ? "border-[#25D366] bg-[rgba(37,211,102,0.05)]" : "border-[#e2e8f0] hover:border-[#25D366]"}`}
                          onClick={() => setNewOrderForm(prev => ({ ...prev, paymentMethod: method.id }))}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${newOrderForm.paymentMethod === method.id ? "bg-[#25D366] text-white" : "bg-[#f8fafc] text-[#64748b]"}`}>
                            <i className={`fas ${method.icon}`}></i>
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-sm">{method.id}</div>
                            <div className="text-xs text-[#64748b]">{method.desc}</div>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${newOrderForm.paymentMethod === method.id ? "bg-[#25D366] border-[#25D366]" : "border-[#e2e8f0]"}`}>
                            {newOrderForm.paymentMethod === method.id && <i className="fas fa-check text-white text-xs"></i>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery */}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#64748b] mb-4 flex items-center gap-2">
                      <i className="fas fa-truck text-[#25D366]"></i>Delivery
                    </div>
                    
                    <div className="flex gap-2 mb-3">
                      {["Home", "Work", "New"].map((type, idx) => (
                        <button 
                          key={type}
                          className={`px-4 py-2 rounded-full text-xs font-semibold ${idx === 0 ? "bg-[#25D366] text-white" : "bg-[#f8fafc] text-[#64748b]"}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    
                    <div className="form-group mb-3">
                      <label className="form-label">Delivery Address</label>
                      <input 
                        type="text" 
                        name="customerAddress"
                        value={newOrderForm.customerAddress}
                        onChange={handleNewOrderInputChange}
                        className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" 
                        placeholder="Enter delivery address"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-white border border-[#e2e8f0] rounded-xl">
                      <div>
                        <div className="font-semibold text-sm">Express Delivery</div>
                        <div className="text-xs text-[#64748b]">Same-day delivery (+$5)</div>
                      </div>
                      <div className="w-12 h-6 bg-[#e2e8f0] rounded-full relative cursor-pointer">
                        <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Order Options */}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#64748b] mb-4 flex items-center gap-2">
                      <i className="fas fa-cog text-[#25D366]"></i>Order Options
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-white border border-[#e2e8f0] rounded-xl mb-2">
                      <div>
                        <div className="font-semibold text-sm">Send WhatsApp Confirmation</div>
                        <div className="text-xs text-[#64748b]">Notify customer immediately</div>
                      </div>
                      <div className="w-12 h-6 bg-[#25D366] rounded-full relative cursor-pointer">
                        <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-white border border-[#e2e8f0] rounded-xl">
                      <div>
                        <div className="font-semibold text-sm">Mark as Paid</div>
                        <div className="text-xs text-[#64748b]">Payment already received</div>
                      </div>
                      <div className="w-12 h-6 bg-[#e2e8f0] rounded-full relative cursor-pointer">
                        <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Discount */}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#64748b] mb-4 flex items-center gap-2">
                      <i className="fas fa-tag text-[#25D366]"></i>Discount
                    </div>
                    
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        className="flex-1 px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" 
                        placeholder="Discount code or amount"
                      />
                      <button className="px-4 py-3 bg-white border-2 border-[#e2e8f0] rounded-xl text-[#64748b] font-semibold text-sm hover:border-[#25D366]">
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 md:p-4 border-t border-[#e2e8f0] flex flex-col md:flex-row justify-between items-center gap-3 bg-[#f8fafc]">
              <div className="flex items-center gap-2 text-xs md:text-sm text-[#64748b]">
                <i className="fas fa-shield-alt text-[#10b981]"></i>
                <span><strong>Secure</strong> • Auto-saved</span>
              </div>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <button className="flex-1 md:flex-none px-4 py-3 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#64748b] flex items-center justify-center gap-2" onClick={() => setNewOrderModalOpen(false)}>
                  <i className="fas fa-save"></i>Save
                </button>
                <button 
                  className="flex-1 md:flex-none px-4 py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 min-h-[48px]"
                  onClick={createNewOrder}
                  disabled={creatingOrder || newOrderForm.selectedProducts.length === 0 || !newOrderForm.customerName || !newOrderForm.customerPhone}
                >
                  {creatingOrder ? (
                    <>
                      <i className="fas fa-circle-notch fa-spin"></i>Creating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check"></i>Create
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
