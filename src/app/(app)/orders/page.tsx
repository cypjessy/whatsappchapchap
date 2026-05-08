"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { orderService, Order, OrderStatus, productService, Product, customerService, Customer, tenantService } from "@/lib/db";
import { formatCurrency, CURRENCY_SYMBOL } from "@/lib/currency";
import { app as firebaseApp } from "@/lib/firebase";
import { getFirestore, doc, getDoc, collection, query, where, orderBy, getDocs, updateDoc } from "firebase/firestore";
import { sendEvolutionWhatsAppMessage } from "@/utils/sendWhatsApp";
import { getOrderStatusMessage } from "@/utils/orderMessages";
import { getWhatsAppPhone, normalizePhone, createWhatsAppJid, isValidWhatsAppPhone } from "@/utils/phoneUtils";

// ============ PREMIUM UI UTILITIES ============
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const usePrefersDark = () => {
  const [prefersDark, setPrefersDark] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setPrefersDark(media.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersDark(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);
  return prefersDark;
};

// ============ TOAST NOTIFICATION SYSTEM ============
interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
}

const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const addToast = useCallback((message: string, type: Toast["type"] = "info", duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);
  
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  
  return { toasts, addToast, removeToast };
};

// ============ MAIN COMPONENT ============
export default function OrdersPage() {
  const { user } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const prefersDark = usePrefersDark();
  const [darkMode, setDarkMode] = useState(prefersDark);
  
  // Original states
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cancellationRequests, setCancellationRequests] = useState<any[]>([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, processing: 0, completed: 0, refunded: 0, cancelled: 0, cancellations: 0 });
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("all");
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
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
  const [viewMode, setViewMode] = useState<'orders' | 'cancellations'>('orders');
  const [cancellationFilter, setCancellationFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  // Premium mobile states
  const [isPullingRefresh, setIsPullingRefresh] = useState(false);
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [activeBottomTab, setActiveBottomTab] = useState("orders");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  
  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);
  
  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      addToast("You're back online! 🌐", "success", 3000);
      loadOrders();
      loadCounts();
    };
    const handleOffline = () => {
      setIsOffline(true);
      addToast("You're offline. Changes will sync when connected.", "warning", 5000);
    };
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [addToast]);
  
  // Pull-to-refresh for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY;
    const diff = touchEndY.current - touchStartY.current;
    
    if (diff > 80 && window.scrollY === 0 && !isPullingRefresh) {
      setIsPullingRefresh(true);
      setTimeout(() => {
        loadOrders();
        loadCounts();
        setIsPullingRefresh(false);
        addToast("Orders refreshed! ✨", "success", 2000);
      }, 800);
    }
  };
  
  // Original data loading functions (unchanged logic)
  useEffect(() => {
    if (!user) return;
    loadOrders();
    loadCounts();
    loadProducts();
    loadCustomers();
    loadCancellationRequests();
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
      addToast("Failed to load orders. Please check your connection.", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadCounts = async () => {
    if (!user) return;
    try {
      const data: any = await orderService.getOrderCounts(user);
      setCounts({ ...data, cancellations: data.cancellations || 0 });
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

  const loadCancellationRequests = async () => {
    if (!user) return;
    try {
      const db: any = getFirestore(firebaseApp);
      const tenantId = `tenant_${user.uid}`;
      
      const q = query(
        collection(db, "cancellation_requests"),
        where("tenantId", "==", tenantId),
        orderBy("requestedAt", "desc")
      );
      
      const snap = await getDocs(q);
      const requests = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      setCancellationRequests(requests);
      
      const pendingCount = requests.filter((r: any) => r.status === 'pending').length;
      setCounts(prev => ({ ...prev, cancellations: pendingCount }));
    } catch (error) {
      console.error("Error loading cancellation requests:", error);
      addToast("Failed to load cancellation requests", "error");
    }
  };

  // ============ ACTION HANDLERS (Enhanced with Toasts) ============
  const handleCancellationAction = async (requestId: string, orderId: string, action: 'approve' | 'reject') => {
    if (!user) return;
    const isApproving = action === 'approve';
    const actionText = isApproving ? 'Approving' : 'Rejecting';
    const refundNote = window.prompt(isApproving ? "Add refund reference (optional):" : "Add rejection reason (optional):");
    
    try {
      const db: any = getFirestore(firebaseApp);
      const cancelRef = doc(db, "cancellation_requests", requestId);
      await updateDoc(cancelRef, {
        status: isApproving ? 'approved' : 'rejected',
        respondedAt: new Date(),
        responseNote: refundNote || (isApproving ? 'Refund approved by merchant' : 'Cancellation rejected by merchant'),
      });
      
      const ordersRef = collection(db, "orders");
      const tenantId = `tenant_${user.uid}`;
      let orderDoc: any = null;
      let orderData: any = null;
      
      // Try multiple approaches to find order (original logic preserved)
      try {
        const docRef = doc(db, "orders", orderId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          orderDoc = docSnap;
          orderData = docSnap.data();
        }
      } catch (err) { /* fallback to query */ }
      
      if (!orderDoc) {
        const orderQuery = query(ordersRef, where("tenantId", "==", tenantId), where("orderId", "==", orderId));
        const orderSnap = await getDocs(orderQuery);
        if (!orderSnap.empty) {
          orderDoc = orderSnap.docs[0];
          orderData = orderDoc.data();
        }
      }
      
      if (!orderDoc) {
        const orderQuery = query(ordersRef, where("tenantId", "==", tenantId), where("orderNumber", "==", orderId));
        const orderSnap = await getDocs(orderQuery);
        if (!orderSnap.empty) {
          orderDoc = orderSnap.docs[0];
          orderData = orderDoc.data();
        }
      }
      
      if (orderDoc && orderData) {
        await updateDoc(orderDoc.ref, {
          status: isApproving ? 'refunded' : 'confirmed',
          cancellationStatus: isApproving ? 'approved' : 'rejected',
          refunded: isApproving,
          refundReference: isApproving ? (refundNote || null) : null,
          refundAmount: isApproving ? (orderData.total || 0) : null,
          refundedAt: isApproving ? new Date() : null,
          updatedAt: new Date(),
        });
        
        // WhatsApp notification
        const customerPhone = orderData.customerPhone;
        const customerName = orderData.customerName || 'Customer';
        const orderTotal = orderData.total || 0;
        
        if (customerPhone && isValidWhatsAppPhone(customerPhone)) {
          let message = '';
          if (isApproving) {
            message = `✅ *REFUND PROCESSED SUCCESSFULLY* ✅\n\nDear ${customerName},\n\nYour refund for order *${orderId}* has been *PROCESSED* successfully.\n\n━━━━━━━━━━━━━━━━━━━━\n💰 *Refund Amount:* ${formatCurrency(orderTotal)}\n⏱️ *Processing Time:* 24-48 hours\n💳 *Refund Method:* ${orderData.paymentMethod || 'Original payment method'}\n━━━━━━━━━━━━━━━━━━━━\n\nThe refund will be processed back to your original payment method.\n\n📱 *Need help?* Reply *SUPPORT* to talk to our team.\n\nThank you for shopping with us! 🙏`;
          } else {
            message = `ℹ️ *CANCELLATION REQUEST UPDATE* ℹ️\n\nDear ${customerName},\n\nYour cancellation request for order *${orderId}* has been *REVIEWED*.\n\n❌ *Status:* Cancellation Not Approved\n\nYour order will continue processing as normal.\n\n📝 *Note:* ${refundNote || 'Please contact support if you have questions.'}\n\nIf you have concerns, reply *SUPPORT*.\n\nThank you for your understanding!`;
          }
          
          try {
            await sendEvolutionWhatsAppMessage(customerPhone, message, user.uid);
          } catch (whatsappError) {
            console.error("WhatsApp send failed:", whatsappError);
          }
        }
        
        await loadCancellationRequests();
        await loadOrders();
        await loadCounts();
        
        addToast(isApproving ? "✅ Cancellation approved! Customer notified via WhatsApp." : "ℹ️ Cancellation rejected. Customer notified.", isApproving ? "success" : "info");
      } else {
        addToast(`❌ Order ${orderId} not found. Please refresh.`, "error");
      }
    } catch (error) {
      console.error(`Error ${actionText} cancellation:`, error);
      addToast(`Failed to ${action} cancellation request`, "error");
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
      const editedPhone = normalizePhone(editForm.customerPhone);
      const originalPhone = normalizePhone(selectedOrder.customerPhone);
      const whatsappJid = editedPhone === originalPhone ? selectedOrder.whatsappJid : createWhatsAppJid(editedPhone);
      
      await orderService.updateOrder(user, selectedOrder.id, {
        customerName: editForm.customerName,
        customerPhone: editedPhone,
        whatsappJid,
        customerEmail: editForm.customerEmail,
        customerAddress: editForm.customerAddress,
        paymentMethod: editForm.paymentMethod,
        status: editForm.status as Order["status"],
      });
      loadOrders();
      loadCounts();
      setEditModalOpen(false);
      addToast("Order updated successfully! ✨", "success");
    } catch (error) {
      console.error("Error updating order:", error);
      addToast("Failed to update order", "error");
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
      addToast("Please fill customer details and add at least one product", "warning");
      return;
    }
    setCreatingOrder(true);
    try {
      const totals = calculateOrderTotal();
      const orderNumber = "ORD-" + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      const normalizedPhone = normalizePhone(newOrderForm.customerPhone);
      const whatsappJid = createWhatsAppJid(normalizedPhone);
      
      await orderService.createOrder(user, {
        orderNumber,
        customerId: "",
        customerName: newOrderForm.customerName,
        customerPhone: normalizedPhone,
        whatsappJid,
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
      
      // Send WhatsApp notification
      const newOrder = {
        id: '',
        orderNumber,
        customerName: newOrderForm.customerName,
        customerPhone: normalizedPhone,
        whatsappJid,
        customerAddress: newOrderForm.customerAddress,
        products: newOrderForm.selectedProducts,
        total: totals.total,
        status: 'pending' as const
      } as Order;
      
      sendWhatsAppNotification(newOrder, 'pending').catch(err => {
        console.error('Failed to send WhatsApp notification:', err);
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
      addToast("🎉 Order created successfully!", "success");
    } catch (error) {
      console.error("Error creating order:", error);
      addToast("Error creating order: " + error, "error");
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
    addToast("📥 Orders exported to CSV!", "success");
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
      addToast(`✅ ${selectedOrders.size} order(s) updated to ${status}`, "success");
    } catch (error) {
      console.error("Error updating orders:", error);
      addToast("Failed to update orders", "error");
    }
  };

  const markOrderComplete = async () => {
    if (!user || !selectedOrder) return;
    try {
      await orderService.updateOrder(user, selectedOrder.id, { status: "delivered" });
      loadOrders();
      loadCounts();
      setModalOpen(false);
      addToast("🎯 Order marked as delivered!", "success");
    } catch (error) {
      console.error("Error updating order:", error);
      addToast("Failed to update order", "error");
    }
  };

  const updateOrderStatus = async (newStatus: Order["status"]) => {
    if (!user || !selectedOrder || !newStatus) return;
    try {
      await orderService.updateOrder(user, selectedOrder.id, { status: newStatus });
      
      // WhatsApp notifications for status changes
      if (["confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"].includes(newStatus)) {
        sendWhatsAppNotification(selectedOrder, newStatus).catch(err => {
          console.error('Failed to send WhatsApp notification:', err);
        });
      }
      
      loadOrders();
      loadCounts();
      setShowStatusMenu(false);
      addToast(`📦 Order status updated to ${newStatus}`, "success");
    } catch (error) {
      console.error("Error updating order status:", error);
      addToast("Failed to update status", "error");
    }
  };

  const handleAddNote = async () => {
    if (!user || !selectedOrder || !orderNotes.trim()) return;
    try {
      await orderService.updateOrder(user, selectedOrder.id, { notes: orderNotes });
      setOrderNotes("");
      addToast("📝 Note added successfully", "success");
    } catch (error) {
      console.error("Error adding note:", error);
      addToast("Failed to add note", "error");
    }
  };

  const processOrder = async () => {
    if (!user || !selectedOrder) return;
    await updateOrderStatus("delivered");
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

  // Analytics
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const completedOrdersCount = orders.filter(o => o.status === 'delivered').length;
  const completionRate = orders.length > 0 ? ((completedOrdersCount / orders.length) * 100).toFixed(1) : "0";

  const handleDuplicateOrder = async (order: Order) => {
    if (!user) return;
    try {
      await orderService.createOrder(user, {
        orderNumber: "ORD-" + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
        customerId: order.customerId || "",
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        whatsappJid: order.whatsappJid,
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
      addToast('🔄 Order duplicated successfully!', 'success');
    } catch (error) {
      console.error("Error duplicating order:", error);
      addToast("Failed to duplicate order", "error");
    }
  };

  const sendWhatsAppNotification = async (order: Order, status: OrderStatus) => {
    if (!user) return;
    try {
      const productName = order.products?.[0]?.name || order.productName || 'Order';
      const message = getOrderStatusMessage(
        status,
        order.customerName,
        order.orderNumber || order.id.substring(0, 8),
        productName,
        order.deliveryAddress || order.customerAddress
      );
      
      const phone = getWhatsAppPhone({
        customerPhone: order.customerPhone,
        whatsappJid: order.whatsappJid
      });
      
      if (!isValidWhatsAppPhone(phone)) {
        addToast('❌ Invalid phone number for WhatsApp', 'error');
        return;
      }
      
      await sendEvolutionWhatsAppMessage(phone, message, user.uid);
      addToast('📱 WhatsApp notification sent!', 'success');
    } catch (error) {
      console.error("Error sending WhatsApp:", error);
      addToast("Failed to send WhatsApp notification", "error");
    }
  };

  const printInvoice = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      addToast("❌ Pop-up blocked. Please allow pop-ups to print.", "warning");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${order.orderNumber || order.id.substring(0, 8)}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; line-height: 1.5; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #25D366; padding-bottom: 20px; }
          .logo { font-size: 28px; font-weight: 800; color: #25D366; }
          .invoice-details { margin: 20px 0; background: #f8fafc; padding: 15px; border-radius: 12px; }
          .invoice-details div { margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          th { background: #f1f5f9; font-weight: 700; font-size: 14px; }
          .total { font-size: 20px; font-weight: 800; color: #25D366; margin-top: 15px; }
          @media print { body { padding: 0; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🧾 INVOICE</div>
          <div style="font-size:18px;font-weight:600;margin-top:8px">Order #${order.orderNumber || order.id.substring(0, 8)}</div>
          <div style="color:#64748b">Date: ${formatDate(order.createdAt)}</div>
        </div>
        <div class="invoice-details">
          <div><strong>👤 Customer:</strong> ${order.customerName}</div>
          <div><strong>📱 Phone:</strong> ${order.customerPhone}</div>
          <div><strong>✉️ Email:</strong> ${order.customerEmail || 'N/A'}</div>
          <div><strong>📍 Address:</strong> ${order.deliveryAddress || order.customerAddress || 'N/A'}</div>
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
          <div style="display:flex;justify-content:space-between"><span>Subtotal:</span><strong>${CURRENCY_SYMBOL}${(order.subtotal || 0).toFixed(2)}</strong></div>
          <div style="display:flex;justify-content:space-between"><span>Shipping:</span><strong>${CURRENCY_SYMBOL}${(order.shipping || 0).toFixed(2)}</strong></div>
          <div style="display:flex;justify-content:space-between"><span>Tax (16%):</span><strong>${CURRENCY_SYMBOL}${(order.tax || 0).toFixed(2)}</strong></div>
          ${order.discount ? `<div style="display:flex;justify-content:space-between;color:#10b981"><span>Discount:</span><strong>-${CURRENCY_SYMBOL}${(order.discount || 0).toFixed(2)}</strong></div>` : ''}
          <div class="total" style="display:flex;justify-content:space-between;border-top:2px solid #e2e8f0;padding-top:15px"><span>Total:</span><span>${CURRENCY_SYMBOL}${(order.total || 0).toFixed(2)}</span></div>
        </div>
        <div style="margin-top:40px;text-align:center;color:#64748b;font-size:14px">
          <p>✨ Thank you for your business! ✨</p>
          <p style="font-size:12px;margin-top:10px">Powered by WhatsApp Commerce</p>
        </div>
        <div class="no-print" style="margin-top:30px;text-align:center">
          <button onclick="window.print()" style="background:#25D366;color:white;border:none;padding:12px 24px;border-radius:8px;font-weight:600;cursor:pointer">🖨️ Print Invoice</button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  const getStatusBadge = (status?: string) => {
    const styles: Record<string, { bg: string; color: string; label: string; icon: string }> = {
      pending: { bg: "bg-amber-100 dark:bg-amber-900/30", color: "text-amber-700 dark:text-amber-400", label: "Pending", icon: "fa-clock" },
      processing: { bg: "bg-blue-100 dark:bg-blue-900/30", color: "text-blue-700 dark:text-blue-400", label: "Processing", icon: "fa-cog" },
      shipped: { bg: "bg-violet-100 dark:bg-violet-900/30", color: "text-violet-700 dark:text-violet-400", label: "Shipped", icon: "fa-truck" },
      delivered: { bg: "bg-emerald-100 dark:bg-emerald-900/30", color: "text-emerald-700 dark:text-emerald-400", label: "Completed", icon: "fa-check-circle" },
      refunded: { bg: "bg-teal-100 dark:bg-teal-900/30", color: "text-teal-700 dark:text-teal-400", label: "Refunded", icon: "fa-undo" },
      cancelled: { bg: "bg-red-100 dark:bg-red-900/30", color: "text-red-700 dark:text-red-400", label: "Cancelled", icon: "fa-times-circle" },
      cancellation_requested: { bg: "bg-red-100 dark:bg-red-900/30", color: "text-red-700 dark:text-red-400", label: "Cancellation Requested", icon: "fa-exclamation-triangle" },
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

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const searchLower = debouncedSearch.toLowerCase();
      if (debouncedSearch && 
          !order.customerName?.toLowerCase().includes(searchLower) && 
          !order.orderNumber?.toLowerCase().includes(searchLower) &&
          !order.id.includes(debouncedSearch)) {
        return false;
      }
      if (activeStatus !== "all" && order.status !== activeStatus) return false;
      
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
      
      if (amountMin !== "" && (order.total || 0) < Number(amountMin)) return false;
      if (amountMax !== "" && (order.total || 0) > Number(amountMax)) return false;
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
  }, [orders, debouncedSearch, activeStatus, dateRangeStart, dateRangeEnd, amountMin, amountMax, paymentFilter, sortBy]);

  const tabs = [
    { id: "all", label: "All Orders", count: counts.all, icon: "fa-list" },
    { id: "pending", label: "Pending", count: counts.pending, icon: "fa-clock" },
    { id: "processing", label: "Processing", count: counts.processing, icon: "fa-cog" },
    { id: "completed", label: "Completed", count: counts.completed, icon: "fa-check-circle" },
    { id: "refunded", label: "Refunded", count: counts.refunded || 0, icon: "fa-undo" },
    { id: "cancelled", label: "Cancelled", count: counts.cancelled, icon: "fa-times-circle" },
    { id: "cancellation_requests", label: "Requests", count: counts.cancellations, icon: "fa-exclamation-triangle" },
  ];

  const handleTabClick = (tabId: string) => {
    if (tabId === 'cancellation_requests') {
      setViewMode('cancellations');
      setActiveBottomTab('cancellations');
    } else {
      setViewMode('orders');
      setActiveStatus(tabId);
      setActiveBottomTab('orders');
    }
  };

  // ============ RENDER ============
  return (
    <>
      {/* CSS Variables for Premium Theming */}
      <style jsx global>{`
        :root {
          --primary: #25D366;
          --primary-dark: #128C7E;
          --surface: #ffffff;
          --surface-dark: #1e293b;
          --background: #f8fafc;
          --background-dark: #0f172a;
          --text: #1e293b;
          --text-dark: #f1f5f9;
          --text-secondary: #64748b;
          --text-secondary-dark: #94a3b8;
          --border: #e2e8f0;
          --border-dark: #334155;
          --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
          --radius: 16px;
          --radius-lg: 24px;
          --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dark {
          --surface: #1e293b;
          --background: #0f172a;
          --text: #f1f5f9;
          --text-secondary: #94a3b8;
          --border: #334155;
        }
        @media (max-width: 768px) {
          :root {
            --radius: 20px;
            --radius-lg: 28px;
          }
        }
        /* Smooth scrolling & animations */
        html { scroll-behavior: smooth; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modalSlideIn { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .animate-modal { animation: modalSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .animate-shimmer { 
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        /* Touch optimizations */
        @media (hover: none) and (pointer: coarse) {
          button, [role="button"], a { 
            min-height: 48px; 
            min-width: 48px; 
            padding: 12px 16px !important;
          }
          input, select, textarea { 
            font-size: 16px !important; /* Prevent iOS zoom */
            min-height: 48px;
          }
          button, [role="button"], a, input, select, textarea { 
            -webkit-tap-highlight-color: transparent;
          }
          button:active, [role="button"]:active { transform: scale(0.98); }
        }
        /* Hide scrollbar but keep functionality */
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        /* Smooth scrollbar */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .dark ::-webkit-scrollbar-thumb { background: #475569; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .dark ::-webkit-scrollbar-thumb:hover { background: #64748b; }
        /* Safe area for notched phones */
        @supports (padding: max(0px)) {
          .safe-top { padding-top: max(1rem, env(safe-area-inset-top)); }
          .safe-bottom { padding-bottom: max(1rem, env(safe-area-inset-bottom)); }
        }
      `}</style>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-fadeIn ${
              toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-200' :
              toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200' :
              toast.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-200' :
              'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-200'
            }`}
            onClick={() => removeToast(toast.id)}
          >
            <i className={`fas ${
              toast.type === 'success' ? 'fa-check-circle' :
              toast.type === 'error' ? 'fa-exclamation-circle' :
              toast.type === 'warning' ? 'fa-exclamation-triangle' :
              'fa-info-circle'
            }`}></i>
            <span className="text-sm font-medium">{toast.message}</span>
            <button className="ml-auto opacity-70 hover:opacity-100">
              <i className="fas fa-times text-xs"></i>
            </button>
          </div>
        ))}
      </div>

      {/* Offline Banner */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-[90] bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
          <i className="fas fa-wifi-slash"></i>
          <span>You're offline. Changes will sync when connected.</span>
        </div>
      )}

      {/* Pull-to-Refresh Indicator */}
      {isPullingRefresh && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[80] bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium animate-pulse">
          <i className="fas fa-sync-alt animate-spin text-[#25D366]"></i>
          <span>Refreshing...</span>
        </div>
      )}

      {/* Main Content */}
      <div 
        className={`min-h-screen ${darkMode ? 'dark bg-[var(--background-dark)] text-[var(--text-dark)]' : 'bg-[var(--background)] text-[var(--text)]'} transition-colors duration-200 ${isOffline ? 'pt-8' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-[var(--border)] dark:border-[var(--border-dark)] safe-top">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  <i className="fas fa-shopping-bag"></i>
                </div>
                <div>
                  <h1 className="text-lg font-extrabold text-[var(--text)]">Orders</h1>
                  <p className="text-xs text-[var(--text-secondary)] hidden sm:block">Manage your WhatsApp commerce</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Dark Mode Toggle */}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="w-10 h-10 rounded-xl bg-[var(--surface)] dark:bg-slate-800 border border-[var(--border)] dark:border-[var(--border-dark)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--background)] transition-all active:scale-95"
                  aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                >
                  <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
                </button>
                
                {/* Mobile Filter Toggle */}
                <button 
                  className="md:hidden w-10 h-10 rounded-xl bg-[var(--surface)] dark:bg-slate-800 border border-[var(--border)] dark:border-[var(--border-dark)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--background)] transition-all active:scale-95"
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  aria-label="Toggle filters"
                >
                  <i className="fas fa-filter"></i>
                </button>
                
                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-2">
                  <button 
                    className="px-4 py-2 bg-white dark:bg-slate-800 border-2 border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl font-semibold text-sm hover:border-[#25D366] dark:hover:border-[#25D366] hover:text-[#25D366] transition-all flex items-center gap-2 active:scale-95"
                    onClick={exportToCSV}
                  >
                    <i className="fas fa-download"></i>
                    <span>Export</span>
                  </button>
                  <button 
                    className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2 active:scale-95"
                    onClick={() => setNewOrderModalOpen(true)}
                  >
                    <i className="fas fa-plus"></i>
                    <span>New Order</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Search & Quick Actions */}
        <div className="md:hidden px-4 py-3 bg-white dark:bg-slate-900 border-b border-[var(--border)] dark:border-[var(--border-dark)]">
          <div className="relative mb-3">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"></i>
            <input 
              type="text" 
              placeholder="Search orders, customers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[var(--surface)] dark:bg-slate-800 border border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all"
              inputMode="search"
            />
          </div>
          
          {/* Quick Stats */}
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            <div className="flex-shrink-0 px-3 py-2 bg-[var(--surface)] dark:bg-slate-800 rounded-xl border border-[var(--border)] dark:border-[var(--border-dark)] flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <i className="fas fa-shopping-bag text-xs text-emerald-600 dark:text-emerald-400"></i>
              </div>
              <div>
                <div className="font-bold text-sm">{counts.all}</div>
                <div className="text-[10px] text-[var(--text-secondary)]">Total</div>
              </div>
            </div>
            <div className="flex-shrink-0 px-3 py-2 bg-[var(--surface)] dark:bg-slate-800 rounded-xl border border-[var(--border)] dark:border-[var(--border-dark)] flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <i className="fas fa-clock text-xs text-amber-600 dark:text-amber-400"></i>
              </div>
              <div>
                <div className="font-bold text-sm">{pendingOrdersCount}</div>
                <div className="text-[10px] text-[var(--text-secondary)]">Pending</div>
              </div>
            </div>
            <div className="flex-shrink-0 px-3 py-2 bg-[var(--surface)] dark:bg-slate-800 rounded-xl border border-[var(--border)] dark:border-[var(--border-dark)] flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <i className="fas fa-dollar-sign text-xs text-blue-600 dark:text-blue-400"></i>
              </div>
              <div>
                <div className="font-bold text-sm">{formatCurrency(totalRevenue)}</div>
                <div className="text-[10px] text-[var(--text-secondary)]">Revenue</div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Filters */}
        <div className="hidden md:block max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
              {tabs.map(tab => (
                <button 
                  key={tab.id} 
                  onClick={() => handleTabClick(tab.id)} 
                  className={`px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap flex items-center gap-2 transition-all active:scale-95 ${
                    (tab.id === 'cancellation_requests' && viewMode === 'cancellations') || (tab.id !== 'cancellation_requests' && activeStatus === tab.id) 
                      ? "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white shadow-lg" 
                      : "bg-white dark:bg-slate-800 border-2 border-[var(--border)] dark:border-[var(--border-dark)] text-[var(--text-secondary)] hover:border-[#25D366] hover:text-[#25D366] dark:hover:border-[#25D366]"
                  }`}
                >
                  <i className={`fas ${tab.icon} text-xs`}></i>
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      (tab.id === 'cancellation_requests' && viewMode === 'cancellations') || (tab.id !== 'cancellation_requests' && activeStatus === tab.id)
                        ? "bg-white/20" 
                        : "bg-[var(--background)] dark:bg-slate-700"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            
            {/* Search & Actions */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"></i>
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-11 pr-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl text-sm focus:outline-none focus:border-[#25D366] transition-all"
                />
              </div>
              <select 
                className="px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl text-sm focus:outline-none focus:border-[#25D366] transition-all"
                value={paymentFilter} 
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="all">All Payments</option>
                <option value="Cash on Delivery">COD</option>
                <option value="M-Pesa">M-Pesa</option>
                <option value="Bank Transfer">Bank</option>
              </select>
              <select 
                className="px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl text-sm focus:outline-none focus:border-[#25D366] transition-all"
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="amount-high">Amount ↓</option>
                <option value="amount-low">Amount ↑</option>
              </select>
            </div>
          </div>
          
          {/* Advanced Filters */}
          <div className="mt-4 p-4 bg-[var(--surface)] dark:bg-slate-800 rounded-xl border border-[var(--border)] dark:border-[var(--border-dark)]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Start Date</label>
                <input 
                  type="date" 
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-[var(--border)] dark:border-[var(--border-dark)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">End Date</label>
                <input 
                  type="date" 
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-[var(--border)] dark:border-[var(--border-dark)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Min Amount</label>
                <input 
                  type="number" 
                  placeholder="0"
                  value={amountMin}
                  onChange={(e) => setAmountMin(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-[var(--border)] dark:border-[var(--border-dark)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Max Amount</label>
                <input 
                  type="number" 
                  placeholder="Any"
                  value={amountMax}
                  onChange={(e) => setAmountMax(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-[var(--border)] dark:border-[var(--border-dark)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] transition-all"
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
                className="mt-3 text-sm text-[#25D366] hover:text-[#128C7E] font-semibold flex items-center gap-1 transition-colors"
              >
                <i className="fas fa-times-circle"></i>Clear All Filters
              </button>
            )}
          </div>
        </div>

        {/* Mobile Filters Panel */}
        {showMobileFilters && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={() => setShowMobileFilters(false)}>
            <div 
              className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto animate-modal"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Filters</h3>
                <button 
                  className="w-9 h-9 rounded-full bg-[var(--surface)] dark:bg-slate-800 flex items-center justify-center"
                  onClick={() => setShowMobileFilters(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Payment Method</label>
                  <select 
                    className="w-full px-4 py-3 bg-[var(--surface)] dark:bg-slate-800 border border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                    value={paymentFilter} 
                    onChange={(e) => setPaymentFilter(e.target.value)}
                  >
                    <option value="all">All Payments</option>
                    <option value="Cash on Delivery">Cash on Delivery</option>
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2">Sort By</label>
                  <select 
                    className="w-full px-4 py-3 bg-[var(--surface)] dark:bg-slate-800 border border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="amount-high">Highest Amount</option>
                    <option value="amount-low">Lowest Amount</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Start Date</label>
                    <input 
                      type="date" 
                      value={dateRangeStart}
                      onChange={(e) => setDateRangeStart(e.target.value)}
                      className="w-full px-4 py-3 bg-[var(--surface)] dark:bg-slate-800 border border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">End Date</label>
                    <input 
                      type="date" 
                      value={dateRangeEnd}
                      onChange={(e) => setDateRangeEnd(e.target.value)}
                      className="w-full px-4 py-3 bg-[var(--surface)] dark:bg-slate-800 border border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Min Amount</label>
                    <input 
                      type="number" 
                      placeholder="0"
                      value={amountMin}
                      onChange={(e) => setAmountMin(e.target.value ? Number(e.target.value) : "")}
                      className="w-full px-4 py-3 bg-[var(--surface)] dark:bg-slate-800 border border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Max Amount</label>
                    <input 
                      type="number" 
                      placeholder="Any"
                      value={amountMax}
                      onChange={(e) => setAmountMax(e.target.value ? Number(e.target.value) : "")}
                      className="w-full px-4 py-3 bg-[var(--surface)] dark:bg-slate-800 border border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                    />
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setDateRangeStart("");
                    setDateRangeEnd("");
                    setAmountMin("");
                    setAmountMax("");
                    setPaymentFilter("all");
                    setShowMobileFilters(false);
                  }}
                  className="w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <i className="fas fa-times-circle"></i>Clear All Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 pb-24 md:pb-8">
          {viewMode === 'cancellations' ? (
            /* Cancellation Requests View */
            <div className="animate-fadeIn">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-lg">
                    <i className="fas fa-exclamation-triangle text-xl"></i>
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold">Cancellation Requests</h2>
                    <p className="text-sm text-[var(--text-secondary)]">Review and manage customer cancellation requests</p>
                  </div>
                </div>
                
                {/* Filter Chips */}
                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                  {(['all', 'pending', 'approved', 'rejected'] as const).map(filter => (
                    <button
                      key={filter}
                      onClick={() => setCancellationFilter(filter)}
                      className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all active:scale-95 ${
                        cancellationFilter === filter
                          ? filter === 'pending' ? 'bg-red-500 text-white shadow-lg' :
                            filter === 'approved' ? 'bg-emerald-500 text-white shadow-lg' :
                            filter === 'rejected' ? 'bg-slate-500 text-white shadow-lg' :
                            'bg-[#25D366] text-white shadow-lg'
                          : 'bg-white dark:bg-slate-800 border-2 border-[var(--border)] dark:border-[var(--border-dark)] text-[var(--text-secondary)] hover:border-[#25D366]'
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)} ({
                        filter === 'all' ? cancellationRequests.length :
                        cancellationRequests.filter(r => r.status === filter).length
                      })
                    </button>
                  ))}
                </div>
              </div>

              {(() => {
                const filteredRequests = cancellationFilter === 'all' 
                  ? cancellationRequests
                  : cancellationRequests.filter(r => r.status === cancellationFilter);
                
                return filteredRequests.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-slate-800 border-2 border-dashed border-[var(--border)] dark:border-[var(--border-dark)] rounded-2xl">
                    <div className="text-5xl mb-4">📭</div>
                    <h3 className="text-xl font-bold mb-2">
                      {cancellationFilter === 'all' ? 'No Cancellation Requests' : 
                       `No ${cancellationFilter} Requests`}
                    </h3>
                    <p className="text-[var(--text-secondary)]">
                      {cancellationFilter === 'all' ? 'No cancellation requests have been submitted yet.' :
                       'All requests with this status have been processed.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredRequests.map((request: any) => {
                      const statusColors = {
                        pending: { bg: 'bg-red-500', text: 'text-white', icon: 'fa-clock', label: 'Pending' },
                        approved: { bg: 'bg-emerald-500', text: 'text-white', icon: 'fa-check-circle', label: 'Approved' },
                        rejected: { bg: 'bg-slate-500', text: 'text-white', icon: 'fa-times-circle', label: 'Rejected' }
                      };
                      const statusStyle = statusColors[request.status as keyof typeof statusColors] || statusColors.pending;
                      
                      return (
                        <div key={request.id} className={`bg-white dark:bg-slate-800 border-2 rounded-2xl p-5 transition-all hover:shadow-lg active:scale-[0.99] ${
                          request.status === 'pending' ? 'border-red-200 dark:border-red-900/30 hover:border-red-400' :
                          request.status === 'approved' ? 'border-emerald-200 dark:border-emerald-900/30' :
                          'border-slate-200 dark:border-slate-700'
                        }`}>
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="font-bold text-[#25D366] text-lg">{request.orderId}</div>
                              <div className="text-xs text-[var(--text-secondary)] mt-1">
                                <i className="fas fa-calendar mr-1"></i>
                                {request.requestedAt?.toDate ? request.requestedAt.toDate().toLocaleDateString() : 'N/A'}
                              </div>
                            </div>
                            <span className={`px-3 py-1.5 ${statusStyle.bg} ${statusStyle.text} rounded-full text-xs font-bold shadow`}>
                              <i className={`fas ${statusStyle.icon} mr-1`}></i>{statusStyle.label}
                            </span>
                          </div>
                          
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center gap-2 text-[var(--text-secondary)] bg-[var(--background)] dark:bg-slate-900 p-3 rounded-xl">
                              <i className="fas fa-user text-sm"></i>
                              <span className="font-medium">{request.customerPhone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[var(--text-secondary)] bg-[var(--background)] dark:bg-slate-900 p-3 rounded-xl">
                              <i className="fas fa-user-tag text-sm"></i>
                              <span className="font-medium">{request.orderData?.customerName || 'N/A'}</span>
                            </div>
                            <div className="font-bold text-xl bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800">
                              <i className="fas fa-coins mr-2 text-emerald-600 dark:text-emerald-400"></i>
                              {formatCurrency(request.orderData?.total || 0)}
                            </div>
                          </div>
                          
                          <div className="text-sm text-[var(--text-secondary)] mb-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-200 dark:border-blue-800">
                            <i className="fas fa-info-circle mr-2 text-blue-500"></i>
                            <strong>Reason:</strong> {request.reason || 'Customer requested cancellation'}
                          </div>
                          
                          {request.responseNote && (
                            <div className={`text-sm mb-4 p-3 rounded-xl border ${
                              request.status === 'approved' 
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                                : 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-700'
                            }`}>
                              <i className={`fas ${request.status === 'approved' ? 'fa-comment-dots text-emerald-600' : 'fa-comment-slash'} mr-2`}></i>
                              <strong>Note:</strong> {request.responseNote}
                            </div>
                          )}
                          
                          {request.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleCancellationAction(request.id, request.orderId, 'approve')}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold text-sm hover:from-emerald-600 hover:to-emerald-700 transition-all shadow active:scale-95 flex items-center justify-center gap-2"
                              >
                                <i className="fas fa-check-circle"></i>
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleCancellationAction(request.id, request.orderId, 'reject')}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold text-sm hover:from-red-600 hover:to-red-700 transition-all shadow active:scale-95 flex items-center justify-center gap-2"
                              >
                                <i className="fas fa-times-circle"></i>
                                <span>Reject</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          ) : (
            /* Orders View */
            <>
              {loading ? (
                /* Skeleton Loading State */
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-[var(--border)] dark:border-[var(--border-dark)] p-4 animate-pulse">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-5 bg-[var(--background)] dark:bg-slate-700 rounded w-24"></div>
                        <div className="h-6 bg-[var(--background)] dark:bg-slate-700 rounded-full w-20"></div>
                      </div>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-[var(--background)] dark:bg-slate-700"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-[var(--background)] dark:bg-slate-700 rounded w-3/4"></div>
                          <div className="h-3 bg-[var(--background)] dark:bg-slate-700 rounded w-1/2"></div>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <div className="h-5 bg-[var(--background)] dark:bg-slate-700 rounded w-20"></div>
                        <div className="h-5 bg-[var(--background)] dark:bg-slate-700 rounded w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredOrders.length === 0 ? (
                /* Empty State */
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-[var(--surface)] dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <i className="fas fa-shopping-bag text-3xl text-[var(--text-secondary)]"></i>
                  </div>
                  <h3 className="text-xl font-bold mb-2">No orders yet</h3>
                  <p className="text-[var(--text-secondary)] mb-6 max-w-sm mx-auto">When customers place orders via WhatsApp, they'll appear here for you to manage.</p>
                  <button 
                    className="px-6 py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95"
                    onClick={() => setNewOrderModalOpen(true)}
                  >
                    <i className="fas fa-plus mr-2"></i>Create Your First Order
                  </button>
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {filteredOrders.map(order => {
                      const statusStyle = getStatusBadge(order.status);
                      return (
                        <div 
                          key={order.id} 
                          className="bg-white dark:bg-slate-800 rounded-2xl border border-[var(--border)] dark:border-[var(--border-dark)] p-4 active:scale-[0.99] transition-transform cursor-pointer"
                          onClick={() => openOrderModal(order)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-[#25D366]">#{order.orderNumber || order.id.substring(0, 8)}</span>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${statusStyle.bg} ${statusStyle.color}`}>
                              <i className={`fas ${statusStyle.icon} text-[0.4rem]`}></i>
                              {statusStyle.label}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] dark:from-emerald-900/30 dark:to-blue-900/30 flex items-center justify-center font-bold text-base">
                              {order.customerName?.charAt(0) || "C"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm truncate">{order.customerName || "Customer"}</div>
                              <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                                <i className="fab fa-whatsapp text-[#25D366]"></i>
                                {order.customerPhone || "N/A"}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] dark:border-[var(--border-dark)]">
                            <span className="font-bold text-lg">{formatCurrency(order.total || 0)}</span>
                            <span className="text-xs text-[var(--text-secondary)]">{formatDate(order.createdAt)}</span>
                          </div>
                          
                          <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--border)] dark:border-[var(--border-dark)]">
                            <button 
                              className="flex-1 py-2.5 bg-[var(--surface)] dark:bg-slate-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[var(--background)] transition-colors active:scale-95"
                              onClick={(e) => { e.stopPropagation(); printInvoice(order); }}
                            >
                              <i className="fas fa-print text-[#3b82f6]"></i>Print
                            </button>
                            <button 
                              className="flex-1 py-2.5 bg-[var(--surface)] dark:bg-slate-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[var(--background)] transition-colors active:scale-95"
                              onClick={(e) => { e.stopPropagation(); handleDuplicateOrder(order); }}
                            >
                              <i className="fas fa-copy text-[#25D366]"></i>Duplicate
                            </button>
                            <button 
                              className="flex-1 py-2.5 bg-[var(--surface)] dark:bg-slate-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[var(--background)] transition-colors active:scale-95"
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
                  <div className="hidden md:block bg-white dark:bg-slate-800 rounded-2xl border border-[var(--border)] dark:border-[var(--border-dark)] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[900px]">
                        <thead>
                          <tr className="bg-[var(--background)] dark:bg-slate-900">
                            <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] w-12">
                              <div 
                                className={`w-5 h-5 border-2 rounded cursor-pointer flex items-center justify-center transition-all ${
                                  selectedOrders.size === orders.length 
                                    ? "bg-[#25D366] border-[#25D366]" 
                                    : "border-[var(--border)] dark:border-[var(--border-dark)] hover:border-[#25D366]"
                                }`} 
                                onClick={toggleSelectAll}
                              >
                                {selectedOrders.size === orders.length && <i className="fas fa-check text-white text-xs"></i>}
                              </div>
                            </th>
                            <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Order ID</th>
                            <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Customer</th>
                            <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Products</th>
                            <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Amount</th>
                            <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Status</th>
                            <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Date</th>
                            <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOrders.map(order => {
                            const statusStyle = getStatusBadge(order.status);
                            return (
                              <tr 
                                key={order.id} 
                                className="border-t border-[var(--border)] dark:border-[var(--border-dark)] hover:bg-[var(--background)] dark:hover:bg-slate-900/50 transition-colors cursor-pointer"
                                onClick={() => openOrderModal(order)}
                              >
                                <td className="p-4" onClick={e => e.stopPropagation()}>
                                  <div 
                                    className={`w-5 h-5 border-2 rounded cursor-pointer flex items-center justify-center transition-all ${
                                      selectedOrders.has(order.id) 
                                        ? "bg-[#25D366] border-[#25D366]" 
                                        : "border-[var(--border)] dark:border-[var(--border-dark)] hover:border-[#25D366]"
                                    }`} 
                                    onClick={() => toggleSelect(order.id)}
                                  >
                                    {selectedOrders.has(order.id) && <i className="fas fa-check text-white text-xs"></i>}
                                  </div>
                                </td>
                                <td className="p-4 font-bold text-[#25D366]">#{order.orderNumber || order.id.substring(0, 8)}</td>
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] dark:from-emerald-900/30 dark:to-blue-900/30 flex items-center justify-center font-bold text-sm">
                                      {order.customerName?.charAt(0) || "C"}
                                    </div>
                                    <div>
                                      <div className="font-bold">{order.customerName || "Customer"}</div>
                                      <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                                        <i className="fab fa-whatsapp text-[#25D366]"></i>
                                        {order.customerPhone || "N/A"}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] dark:from-emerald-900/30 dark:to-blue-900/30 flex items-center justify-center text-2xl">📦</div>
                                    <div>
                                      <div className="font-bold text-sm">{order.products?.[0]?.name || "Product"}</div>
                                      <div className="text-xs text-[var(--text-secondary)]">Qty: {order.products?.[0]?.quantity || 1}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 font-bold text-lg">{formatCurrency(order.total || 0)}<div className="text-xs text-[var(--text-secondary)] font-normal">{order.paymentMethod || "N/A"}</div></td>
                                <td className="p-4">
                                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 w-fit ${statusStyle.bg} ${statusStyle.color}`}>
                                    <i className={`fas ${statusStyle.icon} text-[0.4rem]`}></i>{statusStyle.label}
                                  </span>
                                </td>
                                <td className="p-4 text-sm">
                                  <div className="font-bold">{formatDate(order.createdAt)}</div>
                                  <div className="text-xs text-[var(--text-secondary)]">{formatTime(order.createdAt)}</div>
                                </td>
                                <td className="p-4" onClick={e => e.stopPropagation()}>
                                  <div className="flex gap-1.5">
                                    <button 
                                      className="w-9 h-9 flex items-center justify-center text-[#3b82f6] hover:text-white hover:bg-[#3b82f6] bg-[#eff6ff] dark:bg-blue-900/20 rounded-lg transition-all active:scale-95" 
                                      onClick={(e) => { e.stopPropagation(); printInvoice(order); }} 
                                      title="Print Invoice"
                                    >
                                      <i className="fas fa-print text-sm"></i>
                                    </button>
                                    <button 
                                      className="w-9 h-9 flex items-center justify-center text-[#8b5cf6] hover:text-white hover:bg-[#8b5cf6] bg-[#f5f3ff] dark:bg-violet-900/20 rounded-lg transition-all active:scale-95" 
                                      onClick={(e) => { e.stopPropagation(); handleDuplicateOrder(order); }} 
                                      title="Duplicate"
                                    >
                                      <i className="fas fa-copy text-sm"></i>
                                    </button>
                                    <button 
                                      className="w-9 h-9 flex items-center justify-center text-[#25D366] hover:text-white hover:bg-[#25D366] bg-[rgba(37,211,102,0.1)] dark:bg-emerald-900/20 rounded-lg transition-all active:scale-95" 
                                      onClick={(e) => { e.stopPropagation(); sendWhatsAppNotification(order, order.status as OrderStatus); }} 
                                      title="Send WhatsApp"
                                    >
                                      <i className="fab fa-whatsapp text-sm"></i>
                                    </button>
                                    <button 
                                      className="w-9 h-9 flex items-center justify-center text-[#10b981] hover:text-white hover:bg-[#10b981] bg-[rgba(16,185,129,0.1)] dark:bg-teal-900/20 rounded-lg transition-all active:scale-95" 
                                      onClick={(e) => { e.stopPropagation(); openOrderModal(order); }} 
                                      title="View Details"
                                    >
                                      <i className="fas fa-eye text-sm font-bold"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination */}
                    <div className="p-4 border-t border-[var(--border)] dark:border-[var(--border-dark)] flex justify-between items-center text-sm text-[var(--text-secondary)]">
                      <div>{filteredOrders.length} orders</div>
                      <div className="flex gap-1.5">
                        <button className="px-3 py-2 border border-[var(--border)] dark:border-[var(--border-dark)] rounded-lg text-[var(--text-secondary)] font-medium text-sm hover:border-[#25D366] disabled:opacity-50 transition-all active:scale-95" disabled>
                          <i className="fas fa-chevron-left"></i>
                        </button>
                        <button className="px-3 py-2 border-2 border-[#25D366] bg-[#25D366] text-white rounded-lg font-medium text-sm">1</button>
                        <button className="px-3 py-2 border border-[var(--border)] dark:border-[var(--border-dark)] rounded-lg text-[var(--text-secondary)] font-medium text-sm hover:border-[#25D366] transition-all active:scale-95">
                          <i className="fas fa-chevron-right"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </main>

        {/* Mobile Bottom Navigation (Android App Style) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-[var(--border)] dark:border-[var(--border-dark)] safe-bottom">
          <div className="flex justify-around items-center h-16">
            {[
              { id: 'orders', icon: 'fa-list', label: 'Orders', badge: counts.all },
              { id: 'new', icon: 'fa-plus', label: 'New', action: () => setNewOrderModalOpen(true), primary: true },
              { id: 'cancellations', icon: 'fa-exclamation-triangle', label: 'Requests', badge: counts.cancellations },
              { id: 'analytics', icon: 'fa-chart-bar', label: 'Analytics' },
              { id: 'settings', icon: 'fa-cog', label: 'Settings' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => item.action ? item.action() : handleTabClick(item.id === 'cancellations' ? 'cancellation_requests' : 'all')}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-1 min-w-[64px] transition-all active:scale-95 ${
                  item.primary 
                    ? 'bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-2xl shadow-lg -mt-4 w-14 h-14' 
                    : (activeBottomTab === item.id || (item.id === 'orders' && viewMode === 'orders')) 
                      ? 'text-[#25D366]' 
                      : 'text-[var(--text-secondary)] hover:text-[#25D366]'
                }`}
              >
                <div className="relative">
                  <i className={`fas ${item.icon} ${item.primary ? 'text-lg' : 'text-base'}`}></i>
                  {item.badge != null && item.badge > 0 && !item.primary && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium ${item.primary ? 'hidden' : ''}`}>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Order Detail Modal - Mobile Bottom Sheet / Desktop Modal */}
        {modalOpen && selectedOrder && (
          <div 
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
            onClick={() => setModalOpen(false)}
          >
            <div 
              className="bg-white dark:bg-slate-900 w-full md:max-w-[1000px] md:rounded-3xl max-h-[92vh] md:max-h-[calc(100vh-2rem)] overflow-hidden shadow-2xl animate-modal flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Mobile Header */}
              <div className="md:hidden sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-[var(--border)] dark:border-[var(--border-dark)]">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button 
                      className="w-10 h-10 rounded-xl bg-[var(--surface)] dark:bg-slate-800 flex items-center justify-center"
                      onClick={() => setModalOpen(false)}
                    >
                      <i className="fas fa-arrow-left"></i>
                    </button>
                    <div>
                      <h2 className="font-bold text-lg">
                        <span className="text-[#25D366]">#{selectedOrder.orderNumber || selectedOrder.id.substring(0, 8)}</span>
                      </h2>
                      <p className="text-xs text-[var(--text-secondary)]">{formatDate(selectedOrder.createdAt)}</p>
                    </div>
                  </div>
                  <button 
                    className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center"
                    onClick={() => { 
                      if(confirm("Cancel this order?")) updateOrderStatus("cancelled"); 
                    }}
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
                
                {/* Status Badge */}
                {(() => {
                  const statusStyle = getStatusBadge(selectedOrder.status);
                  return (
                    <div className={`px-4 py-3 text-xs font-bold uppercase flex items-center justify-center gap-2 ${statusStyle.bg} ${statusStyle.color}`}>
                      <i className={`fas ${statusStyle.icon}`}></i>
                      {statusStyle.label}
                    </div>
                  );
                })()}
              </div>

              {/* Desktop Header */}
              <div className="hidden md:block p-6 border-b border-[var(--border)] dark:border-[var(--border-dark)] flex justify-between items-start bg-gradient-to-br from-[rgba(37,211,102,0.05)] to-[rgba(18,140,126,0.05)] dark:from-emerald-900/10 dark:to-teal-900/10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
                    <i className="fas fa-shopping-bag"></i>
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold flex items-center gap-3">
                      Order <span className="text-[#25D366]">#{selectedOrder.orderNumber || selectedOrder.id.substring(0, 8)}</span>
                      <select 
                        value={selectedOrder.status || 'pending'}
                        onChange={(e) => updateOrderStatus(e.target.value as OrderStatus)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase cursor-pointer border-0 focus:ring-2 focus:ring-[#25D366] ${getStatusBadge(selectedOrder.status).bg} ${getStatusBadge(selectedOrder.status).color}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mt-1">
                      <span><i className="far fa-calendar mr-1"></i> {formatDate(selectedOrder.createdAt)}</span>
                      <span className="text-[var(--border)]">|</span>
                      <span><i className="fas fa-clock mr-1"></i> {formatTime(selectedOrder.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="w-11 h-11 flex items-center justify-center text-[var(--text-secondary)] hover:text-[#3b82f6] hover:bg-[var(--background)] dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95" onClick={() => printInvoice(selectedOrder)} title="Print Invoice">
                    <i className="fas fa-print"></i>
                  </button>
                  <button className="w-11 h-11 flex items-center justify-center text-[var(--text-secondary)] hover:text-[#25D366] hover:bg-[var(--background)] dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95" onClick={() => handleDuplicateOrder(selectedOrder)} title="Duplicate Order">
                    <i className="fas fa-copy"></i>
                  </button>
                  <button className="w-11 h-11 flex items-center justify-center text-[var(--text-secondary)] hover:text-[#25D366] hover:bg-[var(--background)] dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95" onClick={() => sendWhatsAppNotification(selectedOrder, selectedOrder.status as OrderStatus)} title="Send WhatsApp">
                    <i className="fab fa-whatsapp"></i>
                  </button>
                  <button className="w-11 h-11 flex items-center justify-center text-[var(--text-secondary)] hover:bg-red-500 hover:text-white rounded-xl transition-all active:scale-95" onClick={() => { if(confirm("Cancel this order?")) updateOrderStatus("cancelled"); }} title="Cancel Order">
                    <i className="fas fa-times"></i>
                  </button>
                  <button className="w-11 h-11 flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--background)] dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95" onClick={() => setModalOpen(false)} title="Close">
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="overflow-y-auto flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr]">
                  {/* Left Column - Order Items */}
                  <div className="p-4 md:p-6 border-b lg:border-b-0 lg:border-r border-[var(--border)] dark:border-[var(--border-dark)]">
                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4 flex items-center gap-2">
                      <i className="fas fa-box text-[#25D366]"></i>Order Items ({selectedOrder.products?.length || (selectedOrder.productName ? 1 : 0)})
                    </div>
                    
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3 mb-6">
                      {selectedOrder.products && selectedOrder.products.length > 0 ? (
                        selectedOrder.products.map((product, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-4 bg-[var(--surface)] dark:bg-slate-800 rounded-2xl border border-[var(--border)] dark:border-[var(--border-dark)]">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] dark:from-emerald-900/30 dark:to-blue-900/30 flex items-center justify-center text-xl shrink-0">📦</div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm truncate">{product.name}</h4>
                              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                                <span>{formatCurrency(product.price)} × {product.quantity}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-sm">{formatCurrency(product.price * product.quantity)}</div>
                            </div>
                          </div>
                        ))
                      ) : selectedOrder.productName ? (
                        <div className="flex items-center gap-3 p-4 bg-[var(--surface)] dark:bg-slate-800 rounded-2xl border border-[var(--border)] dark:border-[var(--border-dark)]">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] dark:from-emerald-900/30 dark:to-blue-900/30 flex items-center justify-center text-xl shrink-0">📦</div>
                          <div className="flex-1">
                            <h4 className="font-bold text-sm">{selectedOrder.productName}</h4>
                            <div className="text-xs text-[var(--text-secondary)]">Qty: {selectedOrder.quantity || 1}</div>
                          </div>
                          <div className="font-bold text-sm">{formatCurrency((selectedOrder.basePrice || 0) * (selectedOrder.quantity || 1))}</div>
                        </div>
                      ) : (
                        <div className="text-center text-[var(--text-secondary)] py-6">No items in this order</div>
                      )}
                    </div>

                    {/* Desktop Table View */}
                    <table className="hidden md:table w-full border-collapse mb-6">
                      <thead>
                        <tr className="text-left">
                          <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] bg-[var(--background)] dark:bg-slate-900 border-b-2 border-[var(--border)] dark:border-[var(--border-dark)]">Product</th>
                          <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] bg-[var(--background)] dark:bg-slate-900 border-b-2 border-[var(--border)] dark:border-[var(--border-dark)]">Price</th>
                          <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] bg-[var(--background)] dark:bg-slate-900 border-b-2 border-[var(--border)] dark:border-[var(--border-dark)]">Qty</th>
                          <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] bg-[var(--background)] dark:bg-slate-900 border-b-2 border-[var(--border)] dark:border-[var(--border-dark)]">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.products && selectedOrder.products.length > 0 ? (
                          selectedOrder.products.map((product, idx) => (
                            <tr key={idx} className="border-b border-[var(--border)] dark:border-[var(--border-dark)]">
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] dark:from-emerald-900/30 dark:to-blue-900/30 flex items-center justify-center text-2xl overflow-hidden">📦</div>
                                  <div>
                                    <h4 className="font-bold text-sm">{product.name}</h4>
                                    <span className="text-xs text-[var(--text-secondary)]">Qty: {product.quantity}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4 font-semibold">{formatCurrency(product.price)}</td>
                              <td className="py-4 px-4 text-[var(--text-secondary)]">× {product.quantity}</td>
                              <td className="py-4 px-4 font-bold">{formatCurrency(product.price * product.quantity)}</td>
                            </tr>
                          ))
                        ) : selectedOrder.productName ? (
                          <tr className="border-b border-[var(--border)] dark:border-[var(--border-dark)]">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] dark:from-emerald-900/30 dark:to-blue-900/30 flex items-center justify-center text-2xl">📦</div>
                                <div>
                                  <h4 className="font-bold text-sm">{selectedOrder.productName}</h4>
                                  <span className="text-xs text-[var(--text-secondary)]">Qty: {selectedOrder.quantity || 1}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 font-semibold">{formatCurrency(selectedOrder.basePrice || 0)}</td>
                            <td className="py-4 px-4 text-[var(--text-secondary)]">× {selectedOrder.quantity || 1}</td>
                            <td className="py-4 px-4 font-bold">{formatCurrency((selectedOrder.basePrice || 0) * (selectedOrder.quantity || 1))}</td>
                          </tr>
                        ) : (
                          <tr><td colSpan={4} className="py-6 px-4 text-center text-[var(--text-secondary)]">No items in this order</td></tr>
                        )}
                      </tbody>
                    </table>

                    {/* Order Summary */}
                    <div className="bg-[var(--surface)] dark:bg-slate-800 rounded-2xl p-5 border border-[var(--border)] dark:border-[var(--border-dark)]">
                      <div className="flex justify-between py-2.5 border-b border-dashed border-[var(--border)] dark:border-[var(--border-dark)]">
                        <span className="text-[var(--text-secondary)]">Subtotal</span>
                        <span className="font-semibold">{formatCurrency(selectedOrder.subtotal || 0)}</span>
                      </div>
                      <div className="flex justify-between py-2.5 border-b border-dashed border-[var(--border)] dark:border-[var(--border-dark)]">
                        <span className="text-[var(--text-secondary)]">Shipping</span>
                        <span className="font-semibold">{selectedOrder.deliveryMethod ? `${selectedOrder.deliveryMethod} - ${formatCurrency(selectedOrder.deliveryCost || 0)}` : formatCurrency(selectedOrder.deliveryCost || 0)}</span>
                      </div>
                      <div className="flex justify-between py-2.5 border-b border-dashed border-[var(--border)] dark:border-[var(--border-dark)]">
                        <span className="text-[var(--text-secondary)]">Tax (16%)</span>
                        <span className="font-semibold">{formatCurrency(selectedOrder.tax || 0)}</span>
                      </div>
                      {(selectedOrder.discount || 0) > 0 && (
                        <div className="flex justify-between py-2.5 border-b border-dashed border-[var(--border)] dark:border-[var(--border-dark)] text-emerald-600 dark:text-emerald-400">
                          <span><i className="fas fa-tag mr-2"></i>Discount</span>
                          <span className="font-semibold">-{formatCurrency(selectedOrder.discount || 0)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-4 mt-2 border-t-2 border-[var(--border)] dark:border-[var(--border-dark)] text-xl font-extrabold">
                        <span>Total</span>
                        <span className="text-[#25D366]">{formatCurrency(selectedOrder.total || 0)}</span>
                      </div>
                    </div>

                    {/* Order Timeline */}
                    <div className="mt-8">
                      <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4 flex items-center gap-2">
                        <i className="fas fa-history text-[#3b82f6]"></i>Order Timeline
                      </div>
                      <div className="relative pl-6">
                        <div className="absolute left-[5px] top-0 bottom-0 w-[2px] bg-[var(--border)] dark:bg-[var(--border-dark)]"></div>
                        
                        <div className="relative pb-6">
                          <div className="absolute left-[-19px] w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-[0_0_0_2px_#10b981]"></div>
                          <div className="bg-[var(--surface)] dark:bg-slate-800 border border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl p-4">
                            <div className="flex justify-between items-start mb-1.5">
                              <span className="font-bold text-sm">Order Placed</span>
                              <span className="text-xs text-[var(--text-secondary)]">{formatTime(selectedOrder.createdAt)}</span>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)]">Order #{selectedOrder.orderNumber || selectedOrder.id.substring(0, 8)} created</p>
                          </div>
                        </div>
                        
                        <div className="relative pb-6">
                          <div className={`absolute left-[-19px] w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${selectedOrder.status === "pending" ? "bg-amber-500 shadow-[0_0_0_2px_#f59e0b]" : "bg-emerald-500 shadow-[0_0_0_2px_#10b981]"}`}></div>
                          <div className="bg-[var(--surface)] dark:bg-slate-800 border border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl p-4">
                            <div className="flex justify-between items-start mb-1.5">
                              <span className="font-bold text-sm">Payment Pending</span>
                              <span className="text-xs text-[var(--text-secondary)]">{selectedOrder.status === "pending" ? "Pending" : "Done"}</span>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)]">{selectedOrder.paymentMethod || "Cash on Delivery"} selected</p>
                          </div>
                        </div>
                        
                        <div className="relative">
                          <div className={`absolute left-[-19px] w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${selectedOrder.status === "processing" || selectedOrder.status === "delivered" ? "bg-emerald-500 shadow-[0_0_0_2px_#10b981]" : "bg-[var(--border)] dark:bg-[var(--border-dark)] shadow-[0_0_0_2px_var(--border)]"}`}></div>
                          <div className="bg-[var(--surface)] dark:bg-slate-800 border border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl p-4">
                            <div className="flex justify-between items-start mb-1.5">
                              <span className="font-bold text-sm">{selectedOrder.status === "delivered" ? "Completed" : "Processing"}</span>
                              <span className="text-xs text-[var(--text-secondary)]">{selectedOrder.status === "delivered" ? "Done" : "Pending"}</span>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)]">{selectedOrder.status === "delivered" ? "Order delivered successfully" : "Order is being prepared"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Customer & Actions */}
                  <div className="p-4 md:p-6 bg-[var(--background)] dark:bg-slate-900/50">
                    {/* Customer Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-[var(--border)] dark:border-[var(--border-dark)] mb-6">
                      <div className="flex items-center gap-4 mb-5 pb-5 border-b border-[var(--border)] dark:border-[var(--border-dark)]">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center font-bold text-xl text-white shadow-lg">
                          {selectedOrder.customerName?.charAt(0) || "C"}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{selectedOrder.customerName || "Customer"}</h3>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[rgba(37,211,102,0.1)] dark:bg-emerald-900/20 text-[#25D366] rounded-full text-xs font-bold">
                            <i className="fas fa-crown"></i> Customer
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-sm">
                          <i className="fas fa-phone text-[var(--text-secondary)] w-5"></i>
                          <a href={`tel:${selectedOrder.customerPhone}`} className="text-[#25D366] font-medium hover:underline">{selectedOrder.customerPhone || "N/A"}</a>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <i className="fas fa-envelope text-[var(--text-secondary)] w-5"></i>
                          <span>{selectedOrder.customerEmail || "N/A"}</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm">
                          <i className="fas fa-map-marker-alt text-[var(--text-secondary)] w-5 mt-0.5"></i>
                          <span>{selectedOrder.deliveryAddress || selectedOrder.customerAddress || "N/A"}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mt-5">
                        <button className="py-3 px-4 border border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl bg-white dark:bg-slate-900 text-sm font-semibold flex items-center justify-center gap-2 hover:border-[#25D366] hover:text-[#25D366] transition-all active:scale-95">
                          <i className="fas fa-user"></i> Profile
                        </button>
                        <button className="py-3 px-4 border border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl bg-white dark:bg-slate-900 text-sm font-semibold flex items-center justify-center gap-2 hover:border-[#25D366] hover:text-[#25D366] transition-all active:scale-95">
                          <i className="fas fa-history"></i> History
                        </button>
                      </div>
                    </div>

                    {/* Order Info */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-[var(--border)] dark:border-[var(--border-dark)] mb-6">
                      <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4">Order Information</div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--text-secondary)]">Order Number</span>
                          <span className="font-semibold">#{selectedOrder.orderNumber || selectedOrder.id.substring(0, 8)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--text-secondary)]">Date</span>
                          <span className="font-semibold">{formatDate(selectedOrder.createdAt)}</span>
                        </div>
                        {(selectedOrder.deliveryAddress || selectedOrder.customerAddress) && (
                          <div className="text-sm">
                            <span className="text-[var(--text-secondary)] block mb-1">Delivery Address</span>
                            <div className="font-medium">{selectedOrder.deliveryAddress || selectedOrder.customerAddress}</div>
                          </div>
                        )}
                        {selectedOrder.deliveryMethod && (
                          <div className="flex justify-between text-sm">
                            <span className="text-[var(--text-secondary)]">Delivery Method</span>
                            <span className="font-semibold capitalize">{selectedOrder.deliveryMethod}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--text-secondary)]">Source</span>
                          <span className="font-semibold flex items-center gap-1.5">
                            <i className="fab fa-whatsapp text-[#25D366]"></i> WhatsApp
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-[var(--border)] dark:border-[var(--border-dark)] mb-6">
                      <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4 flex items-center gap-2">
                        <i className="fas fa-credit-card text-[#10b981]"></i>Payment Information
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--text-secondary)]">Payment Method</span>
                          <span className="font-semibold flex items-center gap-2">
                            <i className={`fas ${selectedOrder.paymentMethod === "mpesa" || selectedOrder.paymentMethod === "M-Pesa" ? "fa-mobile-alt text-[#00A650]" : selectedOrder.paymentMethod === "bank" || selectedOrder.paymentMethod === "Bank Transfer" ? "fa-university text-[#64748b]" : "fa-money-bill-wave text-[#10b981]"}`}></i> 
                            {selectedOrder.paymentMethod || "COD"}
                          </span>
                        </div>
                        {selectedOrder.paymentDetails && (
                          <div className="text-sm">
                            <div className="text-[var(--text-secondary)] mb-1.5">
                              {selectedOrder.paymentMethod === "mpesa" || selectedOrder.paymentMethod === "M-Pesa" 
                                ? "M-Pesa Payment Message" 
                                : "Payment Reference / Transaction ID"}
                            </div>
                            <div className={`font-medium p-3 rounded-xl border ${
                              selectedOrder.paymentMethod === "mpesa" || selectedOrder.paymentMethod === "M-Pesa"
                                ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 whitespace-pre-wrap"
                                : "bg-[var(--background)] dark:bg-slate-900 border-[var(--border)] dark:border-[var(--border-dark)]"
                            }`}>
                              {selectedOrder.paymentDetails}
                            </div>
                          </div>
                        )}
                        {selectedOrder.orderNotes && (
                          <div className="text-sm">
                            <div className="text-[var(--text-secondary)] mb-1.5">Customer Message</div>
                            <div className="font-medium bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">{selectedOrder.orderNotes}</div>
                          </div>
                        )}
                        <div className="flex justify-between text-sm pt-2 border-t border-[var(--border)] dark:border-[var(--border-dark)]">
                          <span className="text-[var(--text-secondary)]">Payment Status</span>
                          <span className={`font-semibold ${
                            selectedOrder.status === "pending" ? "text-amber-600 dark:text-amber-400" : 
                            selectedOrder.status === "cancelled" ? "text-red-600 dark:text-red-400" : 
                            "text-emerald-600 dark:text-emerald-400"
                          }`}>
                            {selectedOrder.status === "pending" ? "Awaiting Confirmation" : 
                             selectedOrder.status === "cancelled" ? "Cancelled" : 
                             "Confirmed"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Internal Notes */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-[var(--border)] dark:border-[var(--border-dark)]">
                      <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4">Internal Notes</div>
                      {selectedOrder.notes && (
                        <div className="flex gap-3 py-3 border-b border-[var(--border)] dark:border-[var(--border-dark)]">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">SM</div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="font-semibold text-sm">Staff</span>
                              <span className="text-xs text-[var(--text-secondary)]">{formatTime(selectedOrder.createdAt)}</span>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)]">{selectedOrder.notes}</p>
                          </div>
                        </div>
                      )}
                      <div className="mt-4 pt-4 border-t border-[var(--border)] dark:border-[var(--border-dark)]">
                        <textarea 
                          className="w-full p-4 border border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl text-sm resize-none min-h-[72px] focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all bg-[var(--surface)] dark:bg-slate-900"
                          placeholder="Add an internal note..."
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                        ></textarea>
                        <button 
                          className="mt-3 w-full py-3 bg-[#25D366] text-white rounded-xl font-semibold text-sm hover:bg-[#128C7E] transition-all active:scale-95 flex items-center justify-center gap-2"
                          onClick={handleAddNote}
                          disabled={!orderNotes.trim()}
                        >
                          <i className="fas fa-plus"></i> Add Note
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-4 md:p-6 border-t border-[var(--border)] dark:border-[var(--border-dark)] bg-white dark:bg-slate-900">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none px-4 py-3 bg-[var(--surface)] dark:bg-slate-800 border border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl font-semibold text-sm hover:border-[#25D366] hover:text-[#25D366] transition-all flex items-center justify-center gap-2 active:scale-95">
                      <i className="fas fa-file-invoice"></i> <span className="hidden md:inline">Invoice</span>
                    </button>
                    <button className="flex-1 md:flex-none px-4 py-3 bg-[var(--surface)] dark:bg-slate-800 border border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl font-semibold text-sm hover:border-[#25D366] hover:text-[#25D366] transition-all flex items-center justify-center gap-2 active:scale-95">
                      <i className="fas fa-receipt"></i> <span className="hidden md:inline">Receipt</span>
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    {selectedOrder.status === "pending" && (
                      <button 
                        className="flex-1 md:flex-none px-4 py-3 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95" 
                        onClick={() => updateOrderStatus("confirmed")}
                      >
                        <i className="fas fa-check-circle"></i> <span className="hidden md:inline">Confirm Order</span>
                      </button>
                    )}
                    {(selectedOrder.status === "confirmed" || selectedOrder.status === "processing") && (
                      <button 
                        className="flex-1 md:flex-none px-4 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95" 
                        onClick={() => updateOrderStatus("shipped")}
                      >
                        <i className="fas fa-truck"></i> <span className="hidden md:inline">Mark Shipped</span>
                      </button>
                    )}
                    
                    <div className="relative flex-1 md:flex-none">
                      <button 
                        className="w-full md:w-auto px-4 py-3 bg-[var(--surface)] dark:bg-slate-800 border border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl font-semibold text-sm hover:border-[#25D366] transition-all flex items-center justify-center gap-2 active:scale-95" 
                        onClick={() => setShowStatusMenu(!showStatusMenu)}
                      >
                        <i className="fas fa-tag"></i> <span className="hidden md:inline">Update Status</span> <i className="fas fa-chevron-down ml-1"></i>
                      </button>
                      {showStatusMenu && (
                        <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-[var(--border)] dark:border-[var(--border-dark)] min-w-[200px] z-50 overflow-hidden animate-fadeIn">
                          <div className="py-1">
                            {['delivered', 'cancelled', 'refunded'].map(status => (
                              <button
                                key={status}
                                className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-[var(--background)] dark:hover:bg-slate-900 transition-colors"
                                onClick={() => {
                                  updateOrderStatus(status as OrderStatus);
                                  setShowStatusMenu(false);
                                }}
                              >
                                <span className={`w-2.5 h-2.5 rounded-full ${
                                  status === 'delivered' ? 'bg-emerald-500' : 
                                  status === 'cancelled' ? 'bg-red-500' : 'bg-amber-500'
                                }`}></span>
                                Mark {status.charAt(0).toUpperCase() + status.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button 
                      className="flex-1 md:flex-none px-4 py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95" 
                      onClick={processOrder}
                    >
                      <i className="fas fa-check"></i> <span className="hidden md:inline">Mark Delivered</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* New Order Modal - Mobile Bottom Sheet / Desktop Modal */}
        {newOrderModalOpen && (
          <div 
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
            onClick={() => setNewOrderModalOpen(false)}
          >
            <div 
              className="bg-white dark:bg-slate-900 w-full md:max-w-[900px] md:rounded-3xl max-h-[92vh] md:max-h-[calc(100vh-2rem)] overflow-hidden shadow-2xl animate-modal flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 md:p-6 border-b border-[var(--border)] dark:border-[var(--border-dark)] flex justify-between items-center bg-gradient-to-r from-[rgba(37,211,102,0.05)] to-[rgba(18,140,126,0.05)] dark:from-emerald-900/10 dark:to-teal-900/10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 md:w-12 md:h-12 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-xl md:rounded-2xl flex items-center justify-center text-white text-lg md:text-xl shadow-lg">
                    <i className="fas fa-plus"></i>
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-extrabold">New Order</h2>
                    <p className="text-xs md:text-sm text-[var(--text-secondary)] hidden md:block">Create a new order for your customer</p>
                  </div>
                </div>
                <button 
                  className="w-10 h-10 rounded-xl bg-[var(--surface)] dark:bg-slate-800 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all active:scale-95" 
                  onClick={() => setNewOrderModalOpen(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Customer Selection */}
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4 flex items-center gap-2">
                        <i className="fas fa-user text-[#25D366]"></i>Customer <span className="text-red-500">*</span>
                      </div>
                      
                      <div className="relative">
                        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"></i>
                        <input 
                          type="text" 
                          className="w-full pl-11 pr-4 py-4 bg-[var(--surface)] dark:bg-slate-800 border-2 border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all" 
                          placeholder="Search by name or phone..."
                          value={newOrderCustomerSearch}
                          onChange={(e) => setNewOrderCustomerSearch(e.target.value)}
                        />
                        {newOrderCustomerSearch && customers.filter(c => 
                          c.name.toLowerCase().includes(newOrderCustomerSearch.toLowerCase()) ||
                          c.phone.includes(newOrderCustomerSearch)
                        ).length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                            {customers.filter(c => 
                              c.name.toLowerCase().includes(newOrderCustomerSearch.toLowerCase()) ||
                              c.phone.includes(newOrderCustomerSearch)
                            ).map(customer => (
                              <div 
                                key={customer.id} 
                                className="flex items-center gap-3 p-3 hover:bg-[var(--background)] dark:hover:bg-slate-900 cursor-pointer transition-colors"
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
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white font-bold text-sm">
                                  {customer.name.split(" ").map(n => n[0]).join("").substring(0,2)}
                                </div>
                                <div>
                                  <div className="font-semibold text-sm">{customer.name}</div>
                                  <div className="text-xs text-[var(--text-secondary)]">{customer.phone}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {newOrderForm.customerName && (
                        <div className="flex items-center gap-3 p-4 bg-[rgba(37,211,102,0.05)] dark:bg-emerald-900/10 border border-[#25D366] rounded-xl mt-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white font-bold">
                            {newOrderForm.customerName.split(" ").map(n => n[0]).join("").substring(0,2)}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold">{newOrderForm.customerName}</div>
                            <div className="text-xs text-[var(--text-secondary)]">{newOrderForm.customerPhone}</div>
                          </div>
                          <button 
                            className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                            onClick={() => setNewOrderForm(prev => ({ ...prev, customerName: "", customerPhone: "", customerEmail: "", customerAddress: "" }))}
                          >
                            <i className="fas fa-times text-xs"></i>
                          </button>
                        </div>
                      )}

                      <button 
                        className="w-full py-4 mt-4 bg-white dark:bg-slate-800 border-2 border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl text-[#25D366] font-semibold flex items-center justify-center gap-2 hover:border-[#25D366] transition-all active:scale-95"
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
                      <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4 flex items-center gap-2">
                        <i className="fas fa-box text-[#25D366]"></i>Products <span className="text-red-500">*</span>
                      </div>
                      
                      <div className="border-2 border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl overflow-hidden">
                        <div className="p-4 bg-[var(--background)] dark:bg-slate-900/50 border-b border-[var(--border)] dark:border-[var(--border-dark)]">
                          <input 
                            type="text" 
                            placeholder="Search products..."
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-[var(--border)] dark:border-[var(--border-dark)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                          />
                        </div>
                        
                        <div className="max-h-48 overflow-y-auto">
                          {products.length === 0 ? (
                            <div className="p-5 text-center text-[var(--text-secondary)]">No products available</div>
                          ) : (
                            products.slice(0, 5).map(product => (
                              <div key={product.id} className="flex items-center gap-3 p-4 border-b border-[var(--border)] dark:border-[var(--border-dark)] last:border-b-0">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] dark:from-emerald-900/30 dark:to-blue-900/30 flex items-center justify-center text-2xl">📦</div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm truncate">{product.name}</div>
                                  <div className="text-xs text-[var(--text-secondary)]">{formatCurrency(product.price)} each</div>
                                </div>
                                <button 
                                  onClick={() => addProductToOrder(product)}
                                  className="w-9 h-9 rounded-xl bg-[#25D366] text-white flex items-center justify-center hover:bg-[#128C7E] transition-colors active:scale-95"
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
                        <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4 flex items-center gap-2">
                          <i className="fas fa-shopping-cart text-[#25D366]"></i>Order Items ({newOrderForm.selectedProducts.length})
                        </div>
                        <div className="space-y-3">
                          {newOrderForm.selectedProducts.map(item => (
                            <div key={item.productId} className="flex items-center gap-3 p-4 bg-[var(--surface)] dark:bg-slate-800 rounded-xl border border-[var(--border)] dark:border-[var(--border-dark)]">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] dark:from-emerald-900/30 dark:to-blue-900/30 flex items-center justify-center text-xl">📦</div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm truncate">{item.name}</div>
                                <div className="text-xs text-[var(--text-secondary)]">{formatCurrency(item.price)} each</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => updateProductQuantity(item.productId, item.quantity - 1)} className="w-9 h-9 rounded-lg border border-[var(--border)] dark:border-[var(--border-dark)] flex items-center justify-center hover:bg-[var(--background)] transition-colors active:scale-95">-</button>
                                <span className="font-bold w-8 text-center">{item.quantity}</span>
                                <button onClick={() => updateProductQuantity(item.productId, item.quantity + 1)} className="w-9 h-9 rounded-lg border border-[var(--border)] dark:border-[var(--border-dark)] flex items-center justify-center hover:bg-[var(--background)] transition-colors active:scale-95">+</button>
                              </div>
                              <div className="font-bold text-[#25D366] min-w-[60px] text-right">{formatCurrency(item.price * item.quantity)}</div>
                              <button onClick={() => removeProductFromOrder(item.productId)} className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
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
                          <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4 flex items-center gap-2">
                            <i className="fas fa-calculator text-[#25D366]"></i>Order Summary
                          </div>
                          <div className="bg-[var(--surface)] dark:bg-slate-800 rounded-xl p-5 border border-[var(--border)] dark:border-[var(--border-dark)]">
                            <div className="flex justify-between py-2.5 text-sm">
                              <span className="text-[var(--text-secondary)]">Subtotal ({newOrderForm.selectedProducts.length} items)</span>
                              <span className="font-semibold">{formatCurrency(totals.subtotal)}</span>
                            </div>
                            <div className="flex justify-between py-2.5 text-sm">
                              <span className="text-[var(--text-secondary)]">Shipping</span>
                              <span className="font-semibold">{formatCurrency(totals.shipping)}</span>
                            </div>
                            <div className="flex justify-between py-2.5 text-sm">
                              <span className="text-[var(--text-secondary)]">Tax (16%)</span>
                              <span className="font-semibold">{formatCurrency(totals.tax)}</span>
                            </div>
                            <div className="flex justify-between py-2.5 text-sm text-emerald-600 dark:text-emerald-400">
                              <span><i className="fas fa-tag mr-2"></i>Discount</span>
                              <span className="font-semibold">-{formatCurrency(totals.discount)}</span>
                            </div>
                            <div className="flex justify-between pt-4 mt-2 border-t-2 border-[var(--border)] dark:border-[var(--border-dark)] text-lg font-extrabold">
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
                      <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4 flex items-center gap-2">
                        <i className="fas fa-credit-card text-[#25D366]"></i>Payment Method <span className="text-red-500">*</span>
                      </div>
                      
                      <div className="space-y-3">
                        {[
                          { id: "Cash on Delivery", icon: "fa-money-bill-wave", desc: "Customer pays when receiving" },
                          { id: "M-Pesa", icon: "fa-mobile-alt", desc: "Mobile money payment" },
                          { id: "Bank Transfer", icon: "fa-university", desc: "Direct bank deposit" }
                        ].map(method => (
                          <div 
                            key={method.id}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all active:scale-[0.99] ${
                              newOrderForm.paymentMethod === method.id 
                                ? "border-[#25D366] bg-[rgba(37,211,102,0.05)] dark:bg-emerald-900/10" 
                                : "border-[var(--border)] dark:border-[var(--border-dark)] hover:border-[#25D366]"
                            }`}
                            onClick={() => setNewOrderForm(prev => ({ ...prev, paymentMethod: method.id }))}
                          >
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-colors ${
                              newOrderForm.paymentMethod === method.id 
                                ? "bg-[#25D366] text-white" 
                                : "bg-[var(--background)] dark:bg-slate-900/50 text-[var(--text-secondary)]"
                            }`}>
                              <i className={`fas ${method.icon}`}></i>
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-sm">{method.id}</div>
                              <div className="text-xs text-[var(--text-secondary)]">{method.desc}</div>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              newOrderForm.paymentMethod === method.id 
                                ? "bg-[#25D366] border-[#25D366]" 
                                : "border-[var(--border)] dark:border-[var(--border-dark)]"
                            }`}>
                              {newOrderForm.paymentMethod === method.id && <i className="fas fa-check text-white text-xs"></i>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery */}
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4 flex items-center gap-2">
                        <i className="fas fa-truck text-[#25D366]"></i>Delivery
                      </div>
                      
                      <div className="flex gap-2 mb-4">
                        {["Home", "Work", "New"].map((type, idx) => (
                          <button 
                            key={type}
                            className={`px-4 py-2.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                              idx === 0 
                                ? "bg-[#25D366] text-white shadow" 
                                : "bg-[var(--surface)] dark:bg-slate-800 text-[var(--text-secondary)] border border-[var(--border)] dark:border-[var(--border-dark)]"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-semibold mb-2">Delivery Address</label>
                        <input 
                          type="text" 
                          name="customerAddress"
                          value={newOrderForm.customerAddress}
                          onChange={handleNewOrderInputChange}
                          className="w-full px-4 py-4 bg-[var(--surface)] dark:bg-slate-800 border-2 border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all" 
                          placeholder="Enter delivery address"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl">
                        <div>
                          <div className="font-semibold text-sm">Express Delivery</div>
                          <div className="text-xs text-[var(--text-secondary)]">Same-day delivery (+$5)</div>
                        </div>
                        <div className="w-12 h-7 bg-[var(--border)] dark:bg-[var(--border-dark)] rounded-full relative cursor-pointer">
                          <div className="absolute left-0.5 top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all"></div>
                        </div>
                      </div>
                    </div>

                    {/* Order Options */}
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4 flex items-center gap-2">
                        <i className="fas fa-cog text-[#25D366]"></i>Order Options
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl">
                          <div>
                            <div className="font-semibold text-sm">Send WhatsApp Confirmation</div>
                            <div className="text-xs text-[var(--text-secondary)]">Notify customer immediately</div>
                          </div>
                          <div className="w-12 h-7 bg-[#25D366] rounded-full relative cursor-pointer">
                            <div className="absolute right-0.5 top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all"></div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl">
                          <div>
                            <div className="font-semibold text-sm">Mark as Paid</div>
                            <div className="text-xs text-[var(--text-secondary)]">Payment already received</div>
                          </div>
                          <div className="w-12 h-7 bg-[var(--border)] dark:bg-[var(--border-dark)] rounded-full relative cursor-pointer">
                            <div className="absolute left-0.5 top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Discount */}
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4 flex items-center gap-2">
                        <i className="fas fa-tag text-[#25D366]"></i>Discount
                      </div>
                      
                      <div className="flex gap-3">
                        <input 
                          type="text" 
                          className="flex-1 px-4 py-4 bg-[var(--surface)] dark:bg-slate-800 border-2 border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all" 
                          placeholder="Discount code or amount"
                        />
                        <button className="px-5 py-4 bg-white dark:bg-slate-800 border-2 border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl text-[var(--text-secondary)] font-semibold text-sm hover:border-[#25D366] hover:text-[#25D366] transition-all active:scale-95">
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 md:p-6 border-t border-[var(--border)] dark:border-[var(--border-dark)] bg-[var(--surface)] dark:bg-slate-800">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-2 text-xs md:text-sm text-[var(--text-secondary)]">
                    <i className="fas fa-shield-alt text-[#10b981]"></i>
                    <span><strong>Secure</strong> • Auto-saved</span>
                  </div>
                  <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <button 
                      className="flex-1 md:flex-none px-5 py-4 bg-white dark:bg-slate-900 border-2 border-[var(--border)] dark:border-[var(--border-dark)] rounded-xl font-semibold text-sm hover:border-[#64748b] transition-all flex items-center justify-center gap-2 active:scale-95" 
                      onClick={() => setNewOrderModalOpen(false)}
                    >
                      <i className="fas fa-save"></i>Save Draft
                    </button>
                    <button 
                      className="flex-1 md:flex-none px-5 py-4 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 min-h-[52px]"
                      onClick={createNewOrder}
                      disabled={creatingOrder || newOrderForm.selectedProducts.length === 0 || !newOrderForm.customerName || !newOrderForm.customerPhone}
                    >
                      {creatingOrder ? (
                        <>
                          <i className="fas fa-circle-notch fa-spin"></i>Creating...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check"></i>Create Order
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}