"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { DocumentSnapshot } from "firebase/firestore";
import { useHaptics, useToast } from "@/hooks/useNativeAndroid";
import { useModalBackHandler } from "@/hooks/useModalBackHandler";
import { useStatusBar } from "@/hooks/useStatusBar";
import {
  orderService,
  Order,
  OrderStatus,
  productService,
  Product,
  customerService,
  Customer,
  inventoryService,
  shippingService,
  businessProfileService,
  BusinessProfile,
} from "@/lib/db";
import { formatCurrency } from "@/lib/currency";
import { app as firebaseApp } from "@/lib/firebase";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { sendEvolutionWhatsAppMessage } from "@/utils/sendWhatsApp";
import { getOrderStatusMessage } from "@/utils/orderMessages";
import {
  getWhatsAppPhone,
  normalizePhone,
  createWhatsAppJid,
  isValidWhatsAppPhone,
} from "@/utils/phoneUtils";

// ─── Import Improved Components ───────────────────────────────────────────────

import OrderStats from "./components/OrderStats";
import OrderFilters from "./components/OrderFilters";
import OrderCard from "./components/OrderCard";
import OrderDetailModal from "./components/OrderDetailModal";
import EditOrderModal from "./components/EditOrderModal";
import NewOrderModal from "./components/NewOrderModal";
import PrintInvoiceModal from "./components/PrintInvoiceModal";
import CancellationRequests from "./components/CancellationRequests";
import OrderTabSwitcher from "./components/OrderTabSwitcher";
import PageHeaderCard from "@/components/PageHeaderCard";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = "orders" | "cancellations";

interface TabConfig {
  id: string;
  label: string;
  count: number;
  icon?: string;
  status?: OrderStatus | "all";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: Omit<TabConfig, "count">[] = [
  { id: "all", label: "All Orders", status: "all" },
  { id: "pending", label: "Pending", status: "pending" },
  { id: "processing", label: "Processing", status: "processing" },
  { id: "completed", label: "Completed", status: "delivered" },
  { id: "refunded", label: "Refunded", status: "refunded" },
  { id: "cancelled", label: "Cancelled", status: "cancelled" },
  {
    id: "cancellation_requests",
    label: "Cancellations",
    icon: "fa-exclamation-triangle",
  },
];

const STATUS_BADGES: Record<
  string,
  { bg: string; color: string; label: string; icon: string }
> = {
  pending: {
    bg: "bg-amber-50",
    color: "text-amber-600",
    label: "Pending",
    icon: "fa-clock",
  },
  confirmed: {
    bg: "bg-blue-50",
    color: "text-blue-600",
    label: "Confirmed",
    icon: "fa-check",
  },
  processing: {
    bg: "bg-purple-50",
    color: "text-purple-600",
    label: "Processing",
    icon: "fa-cog",
  },
  shipped: {
    bg: "bg-indigo-50",
    color: "text-indigo-600",
    label: "Shipped",
    icon: "fa-shipping-fast",
  },
  delivered: {
    bg: "bg-green-50",
    color: "text-green-600",
    label: "Completed",
    icon: "fa-check-double",
  },
  refunded: {
    bg: "bg-emerald-50",
    color: "text-emerald-600",
    label: "Refunded",
    icon: "fa-undo",
  },
  cancelled: {
    bg: "bg-red-50",
    color: "text-red-600",
    label: "Cancelled",
    icon: "fa-times",
  },
  cancellation_requested: {
    bg: "bg-red-50",
    color: "text-red-600",
    label: "Cancellation Requested",
    icon: "fa-exclamation",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(createdAt: any): string {
  if (!createdAt) return "N/A";
  try {
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
}

function formatTime(createdAt: any): string {
  if (!createdAt) return "N/A";
  try {
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "N/A";
  }
}

function getStatusBadge(status?: string) {
  return (
    STATUS_BADGES[status || "pending"] || {
      bg: "bg-surface",
      color: "text-on-surface-variant",
      label: "Unknown",
      icon: "fa-circle",
    }
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OrdersPage() {
  const { user } = useAuth();
  const { impactLight, impactMedium, notificationSuccess, notificationError } = useHaptics();
  const { show: showToast } = useToast();

  // Status bar: green when at top, white when scrolled
  const [isTopBarScrolled, setIsTopBarScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsTopBarScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  useStatusBar({
    color: isTopBarScrolled ? '#ffffff' : '#25D366',
    style: isTopBarScrolled ? 'dark' : 'light'
  });

  // ─── Data State ─────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pickupStations, setPickupStations] = useState<any[]>([]);
  const [cancellationRequests, setCancellationRequests] = useState<any[]>([]);
  const [counts, setCounts] = useState({
    all: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    refunded: 0,
    cancelled: 0,
    cancellations: 0,
  });

  // Pagination refs
  const ordersCursorRef = useRef<DocumentSnapshot | null>(null);
  const [hasMoreOrders, setHasMoreOrders] = useState(false);
  const [isLoadingMoreOrders, setIsLoadingMoreOrders] = useState(false);
  const [totalOrdersFetched, setTotalOrdersFetched] = useState(0);

  // ─── UI State ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("orders");
  const [activeStatus, setActiveStatus] = useState("all");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [amountMin, setAmountMin] = useState<number | "">("");
  const [amountMax, setAmountMax] = useState<number | "">("");

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newOrderModalOpen, setNewOrderModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Business profile for invoice printing
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);

  // Listen for quick action from bottom nav
  useEffect(() => {
    const handleNewOrder = () => setNewOrderModalOpen(true);
    window.addEventListener('open-modal:new-order', handleNewOrder);
    return () => window.removeEventListener('open-modal:new-order', handleNewOrder);
  }, []);

  // Register modals for Android back button handling
  useModalBackHandler(modalOpen, () => setModalOpen(false));
  useModalBackHandler(editModalOpen, () => setEditModalOpen(false));
  useModalBackHandler(newOrderModalOpen, () => setNewOrderModalOpen(false));
  useModalBackHandler(printModalOpen, () => setPrintModalOpen(false));

  // Cancellation
  const [cancellationFilter, setCancellationFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");

  // ─── Load Data ──────────────────────────────────────────────────────────────

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch paginated orders
      const PAGE_SIZE = 30;
      const result = await orderService.getOrdersPaginated(user, PAGE_SIZE);
      
      // 🔒 Payment visibility filter:
      // Paystack orders: only show if paymentStatus === "paid" (confirmed by webhook)
      // Other orders (COD, M-Pesa, Bank with reference): show normally
      const visibleOrders = result.orders.filter(order => {
        if (order.paymentMethod === "paystack") {
          return order.paymentStatus === "paid";
        }
        return true;
      });
      setOrders(visibleOrders);
      ordersCursorRef.current = result.lastVisible;
      setHasMoreOrders(result.hasMore);
      setTotalOrdersFetched(result.orders.length);
      
      // ✅ Recompute counts from the filtered (visible) orders for accurate tab badges
      const newCounts = {
        all: visibleOrders.length,
        pending: visibleOrders.filter(o => o.status === "pending").length,
        processing: visibleOrders.filter(o => o.status === "processing").length,
        completed: visibleOrders.filter(o => o.status === "delivered").length,
        refunded: visibleOrders.filter(o => o.status === "refunded").length,
        cancelled: visibleOrders.filter(o => o.status === "cancelled").length,
      };
      setCounts(prev => ({ ...prev, ...newCounts }));
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user]);    const loadMoreOrders = useCallback(async () => {
    if (!user || !ordersCursorRef.current || isLoadingMoreOrders || !hasMoreOrders) return;
    setIsLoadingMoreOrders(true);
    try {
      const PAGE_SIZE = 30;
      const result = await orderService.getOrdersPaginated(user, PAGE_SIZE, ordersCursorRef.current);
      
      const visibleOrders = result.orders.filter(order => {
        if (order.paymentMethod === "paystack") {
          return order.paymentStatus === "paid";
        }
        return true;
      });
      
      setOrders(prev => [...prev, ...visibleOrders]);
      ordersCursorRef.current = result.lastVisible;
      setHasMoreOrders(result.hasMore);
      setTotalOrdersFetched(prev => prev + result.orders.length);
    } catch (error) {
      console.error("Error loading more orders:", error);
    } finally {
      setIsLoadingMoreOrders(false);
    }
  }, [user, isLoadingMoreOrders, hasMoreOrders]);

  const loadCounts = useCallback(async () => {
    if (!user) return;
    try {
      const data = await orderService.getOrderCounts(user);
      setCounts((prev) => ({ ...prev, ...data }));
    } catch (error) {
      console.error("Error loading counts:", error);
    }
  }, [user]);

  const loadProducts = useCallback(async () => {
    if (!user) return;
    try {
      const data = await productService.getProducts(user);
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  }, [user]);

  const loadCustomers = useCallback(async () => {
    if (!user) return;
    try {
      const data = await customerService.getClients(user);
      setCustomers(data);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  }, [user]);

  const loadPickupStations = useCallback(async () => {
    if (!user) return;
    try {
      const data = await shippingService.getPickupStations(user);
      setPickupStations(data);
    } catch (error) {
      console.error("Error loading pickup stations:", error);
    }
  }, [user]);

  const loadCancellationRequests = useCallback(async () => {
    if (!user) return;
    try {
      const db = getFirestore(firebaseApp);
      const tenantId = `tenant_${user.uid}`;

      const q = query(
        collection(db, "cancellation_requests"),
        where("tenantId", "==", tenantId),
        orderBy("requestedAt", "desc")
      );

      const snap = await getDocs(q);
      const requests = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCancellationRequests(requests);

      const pendingCount = requests.filter((r: any) => r.status === "pending").length;
      setCounts((prev) => ({ ...prev, cancellations: pendingCount }));
    } catch (error) {
      console.error("Error loading cancellation requests:", error);
    }
  }, [user]);

  const loadBusinessProfile = useCallback(async () => {
    if (!user) return;
    try {
      const profile = await businessProfileService.getProfile(user);
      setBusinessProfile(profile);
    } catch (error) {
      console.error("Error loading business profile:", error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadOrders();
    loadCounts();
    loadProducts();
    loadCustomers();
    loadCancellationRequests();
    loadPickupStations();
    loadBusinessProfile();
  }, [user, loadOrders, loadCounts, loadProducts, loadCustomers, loadCancellationRequests, loadPickupStations, loadBusinessProfile]);

  // ─── Filtered Orders ────────────────────────────────────────────────────────

  // Create product images mapping (productId -> imageUrl AND product name -> imageUrl)
  // The name-based lookup helps WhatsApp/text orders that store product names instead of IDs
  const productImagesMap = useMemo(() => {
    const map: Record<string, string> = {};
    products.forEach((product) => {
      if (product.image) {
        // Map by product ID
        map[product.id] = product.image;
        // Also map by lowercase product name for WhatsApp/text orders
        if (product.name) {
          map[`name:${product.name.toLowerCase().trim()}`] = product.image;
        }
      }
    });
    return map;
  }, [products]);

  // Helper to get product image from order (checks productImage, productId, product name)
  const getOrderProductImage = useCallback((order: Order): string | undefined => {
    // 1. Direct productImage field
    if (order.productImage) return order.productImage;
    
    // 2. Check by product ID from the products array
    if (order.products?.[0]) {
      const firstProduct = order.products[0];
      // Try by productId
      if (firstProduct.productId && productImagesMap[firstProduct.productId]) {
        return productImagesMap[firstProduct.productId];
      }
      // Try by name-based lookup
      if (firstProduct.name) {
        const nameLookup = productImagesMap[`name:${firstProduct.name.toLowerCase().trim()}`];
        if (nameLookup) return nameLookup;
      }
    }
    
    // 3. Try order.productName as fallback
    if (order.productName) {
      return productImagesMap[`name:${order.productName.toLowerCase().trim()}`];
    }
    
    return undefined;
  }, [productImagesMap]);

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (o) =>
          o.customerName?.toLowerCase().includes(q) ||
          o.orderNumber?.toLowerCase().includes(q) ||
          o.id.includes(q) ||
          o.customerPhone?.includes(q)
      );
    }

    // Status (if not already filtered by activeStatus)
    if (activeStatus !== "all" && activeStatus !== "cancellation_requests") {
      result = result.filter((o) => o.status === activeStatus);
    }

    // Payment
    if (paymentFilter !== "all") {
      result = result.filter((o) => o.paymentMethod === paymentFilter);
    }

    // Date range
    if (dateRangeStart || dateRangeEnd) {
      result = result.filter((o) => {
        try {
          const orderDate = o.createdAt?.toDate
            ? o.createdAt.toDate()
            : new Date(o.createdAt);
          if (dateRangeStart && orderDate < new Date(dateRangeStart)) return false;
          if (dateRangeEnd) {
            const end = new Date(dateRangeEnd);
            end.setHours(23, 59, 59, 999);
            if (orderDate > end) return false;
          }
          return true;
        } catch {
          return true;
        }
      });
    }

    // Amount
    if (amountMin !== "") {
      result = result.filter((o) => (o.total || 0) >= Number(amountMin));
    }
    if (amountMax !== "") {
      result = result.filter((o) => (o.total || 0) <= Number(amountMax));
    }

    // Sort
    result.sort((a, b) => {
      const dateA = a.createdAt?.toDate
        ? a.createdAt.toDate()
        : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate
        ? b.createdAt.toDate()
        : new Date(b.createdAt || 0);

      switch (sortBy) {
        case "newest":
          return dateB.getTime() - dateA.getTime();
        case "oldest":
          return dateA.getTime() - dateB.getTime();
        case "amount-high":
          return (b.total || 0) - (a.total || 0);
        case "amount-low":
          return (a.total || 0) - (b.total || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [orders, searchTerm, activeStatus, paymentFilter, dateRangeStart, dateRangeEnd, amountMin, amountMax, sortBy]);

  // ─── Analytics ──────────────────────────────────────────────────────────────

  const analytics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const pendingOrdersCount = orders.filter((o) => o.status === "pending").length;
    const completedOrdersCount = orders.filter((o) => o.status === "delivered").length;
    const completionRate =
      orders.length > 0 ? ((completedOrdersCount / orders.length) * 100).toFixed(1) : "0";

    return { totalRevenue, pendingOrdersCount, completedOrdersCount, completionRate };
  }, [orders]);

  // ─── Modal Handlers ─────────────────────────────────────────────────────────

  const openOrderModal = useCallback((order: Order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((order: Order) => {
    setSelectedOrder(order);
    setEditModalOpen(true);
  }, []);

  // ─── Order Actions ──────────────────────────────────────────────────────────

  const handleUpdateStatus = useCallback(
    async (status: OrderStatus) => {
      if (!user || !selectedOrder) return;
      
      await impactMedium();
      
      try {
        await orderService.updateOrder(user, selectedOrder.id, { status });

        // Send WhatsApp notifications based on status
        if (["confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"].includes(status)) {
          sendWhatsAppNotification(selectedOrder, status).catch((err) =>
            console.error("Failed to send WhatsApp:", err)
          );
        }

        await notificationSuccess();
        await showToast({ 
          text: `Order ${STATUS_BADGES[status]?.label || status}`, 
          duration: 'short' 
        });
        
        // Close modal before reloading to avoid stale data display
        setModalOpen(false);
        
        loadOrders();
        loadCounts();
      } catch (error) {
        console.error("Error updating status:", error);
        await notificationError();
        await showToast({ 
          text: 'Failed to update order', 
          position: 'top' 
        });
      }
    },
    [user, selectedOrder, loadOrders, loadCounts, impactMedium, notificationSuccess, notificationError, showToast]
  );

  const handlePrintInvoice = useCallback((order: Order) => {
    setSelectedOrder(order);
    setPrintModalOpen(true);
  }, []);

  const handleDuplicateOrder = useCallback(
    async (order: Order) => {
      if (!user) return;
      
      await impactLight();
      
      try {
        await orderService.createOrder(user, {
          orderNumber:
            "ORD-" + Math.floor(Math.random() * 1000000).toString().padStart(6, "0"),
          customerId: order.customerId || "",
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          whatsappJid: order.whatsappJid,
          customerEmail: order.customerEmail || "",
          customerAddress: order.customerAddress || "",
          products: order.products || [],
          productName: order.productName || "",
          productImage: order.productImage || "",
          quantity: order.quantity || 1,
          basePrice: order.basePrice || 0,
          subtotal: order.subtotal || 0,
          shipping: order.shipping || 0,
          tax: order.tax || 0,
          discount: order.discount || 0,
          total: order.total || 0,
          paymentMethod: order.paymentMethod || "Cash on Delivery",
          status: "pending",
          notes: order.notes || "",
        });
        
        await notificationSuccess();
        await showToast({ text: 'Order duplicated', duration: 'short' });
        
        loadOrders();
        loadCounts();
      } catch (error) {
        console.error("Error duplicating order:", error);
        await notificationError();
      }
    },
    [user, loadOrders, loadCounts, impactLight, notificationSuccess, notificationError, showToast]
  );

  const sendWhatsAppNotification = useCallback(
    async (order: Order, status: OrderStatus) => {
      if (!user) return;
      try {
        const productName =
          order.products?.[0]?.name || order.productName || "Order";
        const message = getOrderStatusMessage(
          status,
          order.customerName,
          order.orderNumber || order.id.substring(0, 8),
          productName,
          order.deliveryAddress || order.customerAddress
        );

        const phone = getWhatsAppPhone({
          customerPhone: order.customerPhone,
          whatsappJid: order.whatsappJid,
        });

        if (!isValidWhatsAppPhone(phone)) {
          console.error("Invalid phone number:", phone);
          return;
        }

        await sendEvolutionWhatsAppMessage(phone, message, user.uid);
      } catch (error) {
        console.error("Error sending WhatsApp:", error);
      }
    },
    [user]
  );

  const handleExportCSV = useCallback(async () => {
    await impactLight();
    
    const headers = [
      "Order Number",
      "Customer Name",
      "Phone",
      "Email",
      "Products",
      "Total",
      "Status",
      "Date",
    ];
    const rows = filteredOrders.map((order) => [
      order.orderNumber || order.id.substring(0, 8),
      order.customerName,
      order.customerPhone,
      order.customerEmail,
      order.products?.map((p) => `${p.name} x${p.quantity}`).join(", ") ||
        order.productName,
      order.total,
      order.status,
      formatDate(order.createdAt),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    
    await showToast({ text: 'Orders exported', duration: 'short' });
  }, [filteredOrders, impactLight, showToast]);

  // ─── Cancellation Handler ───────────────────────────────────────────────────

  const handleCancellationAction = useCallback(
    async (requestId: string, orderId: string, action: "approve" | "reject") => {
      if (!user) return;
      const isApproving = action === "approve";
      const refundNote = window.prompt(
        isApproving
          ? "Add refund reference (optional):"
          : "Add rejection reason (optional):"
      );

      try {
        const db = getFirestore(firebaseApp);
        const tenantId = `tenant_${user.uid}`;

        // Update cancellation request
        const cancelRef = doc(db, "cancellation_requests", requestId);
        await updateDoc(cancelRef, {
          status: isApproving ? "approved" : "rejected",
          respondedAt: new Date(),
          responseNote:
            refundNote ||
            (isApproving
              ? "Refund approved by merchant"
              : "Cancellation rejected by merchant"),
        });

        // Find and update order
        const ordersRef = collection(db, "orders");
        let orderDoc: any = null;

        // Try by ID
        const byId = await getDoc(doc(db, "orders", orderId));
        if (byId.exists()) orderDoc = byId;

        // Try by orderId field
        if (!orderDoc) {
          const byOrderId = await getDocs(
            query(ordersRef, where("tenantId", "==", tenantId), where("orderId", "==", orderId))
          );
          if (!byOrderId.empty) orderDoc = byOrderId.docs[0];
        }

        // Try by orderNumber
        if (!orderDoc) {
          const byNumber = await getDocs(
            query(ordersRef, where("tenantId", "==", tenantId), where("orderNumber", "==", orderId))
          );
          if (!byNumber.empty) orderDoc = byNumber.docs[0];
        }

        if (orderDoc) {
          const orderData = orderDoc.data();
          await updateDoc(orderDoc.ref, {
            status: isApproving ? "refunded" : "confirmed",
            cancellationStatus: isApproving ? "approved" : "rejected",
            refunded: isApproving,
            refundReference: isApproving ? refundNote || null : null,
            refundAmount: isApproving ? orderData.total || 0 : null,
            refundedAt: isApproving ? new Date() : null,
            updatedAt: new Date(),
          });

          // Send WhatsApp (fire-and-forget with .catch so failures don't block UI reload)
          const customerPhone = getWhatsAppPhone({
            customerPhone: orderData.customerPhone,
            whatsappJid: orderData.whatsappJid,
          });
          const customerName = orderData.customerName || "Customer";
          const orderTotal = orderData.total || 0;

          if (isValidWhatsAppPhone(customerPhone)) {
            const message = isApproving
              ? `✅ *REFUND PROCESSED* ✅\n\nDear ${customerName},\n\nYour refund for order *${orderId}* has been processed.\n\n💰 *Amount:* ${formatCurrency(orderTotal)}\n⏱️ *Time:* 24-48 hours\n\nThank you! 🙏`
              : `ℹ️ *CANCELLATION UPDATE*\n\nDear ${customerName},\n\nYour cancellation request for order *${orderId}* was not approved.\n\nYour order will be delivered as planned.\n\nThank you for understanding!`;

            sendEvolutionWhatsAppMessage(customerPhone, message, user.uid).catch(err =>
              console.error("Failed to send cancellation WhatsApp:", err)
            );
          } else {
            console.warn("Cancellation WhatsApp not sent — invalid phone:", customerPhone);
          }
        }

        await loadCancellationRequests();
        await loadOrders();
        await loadCounts();

        // If the order was approved (refunded), ensure it's in the local orders array
        // so it shows up when clicking the Refunded tab, even if paginated out
        if (isApproving && orderDoc) {
          const orderData = orderDoc.data();
          setOrders(prev => {
            const exists = prev.some(o => o.id === orderDoc.id);
            if (!exists) {
              return [{ ...orderData, id: orderDoc.id, status: 'refunded' }, ...prev];
            }
            return prev.map(o =>
              o.id === orderDoc.id
                ? { ...o, status: 'refunded' as const }
                : o
            );
          });
        } else if (!isApproving && orderDoc) {
          // When rejected, the order goes back to 'confirmed'
          setOrders(prev =>
            prev.map(o =>
              o.id === orderDoc.id
                ? { ...o, status: 'confirmed' as const }
                : o
            )
          );
        }
      } catch (error) {
        console.error("Error handling cancellation:", error);
      }
    },
    [user, loadCancellationRequests, loadOrders, loadCounts]
  );

  // ─── Create Order ───────────────────────────────────────────────────────────

  const handleCreateOrder = useCallback(
    async (formData: any) => {
      if (!user) return;
      try {
        const normalizedPhone = normalizePhone(formData.customerPhone);
        const whatsappJid = createWhatsAppJid(normalizedPhone);

        const subtotal = (formData.selectedProducts || []).reduce(
          (sum: number, p: any) => sum + (p.price || 0) * (p.quantity || 1), 0
        );
        const discount = formData.discount || 0;
        const total = Math.max(0, subtotal - discount);

        const deliveryAddress = formData.deliveryMethod === "delivery"
          ? (formData.deliveryAddress || formData.customerAddress || "")
          : "";

        const createdOrder = await orderService.createOrder(user, {
          customerId: "",
          customerName: formData.customerName,
          customerPhone: normalizedPhone,
          whatsappJid,
          customerEmail: formData.customerEmail || "",
          customerAddress: formData.customerAddress || "",
          deliveryAddress,
          deliveryMethod: formData.deliveryMethod === "delivery" ? "Delivery" : "Pickup",
          products: formData.selectedProducts || [],
          subtotal,
          shipping: 0,
          tax: 0,
          discount,
          total,
          paymentMethod: formData.paymentMethod || "Cash",
          paymentDetails: formData.paymentRef || "",
          // Manual order = tenant already collected payment
          status: "processing",
          paymentStatus: "paid",
          notes: formData.notes || "",
          orderNotes: formData.expectedDate
            ? `Expected ${formData.deliveryMethod === "pickup" ? "pickup" : "delivery"}: ${formData.expectedDate}`
            : undefined,
        });

        // Deduct stock for each product
        if (formData.selectedProducts && formData.selectedProducts.length > 0) {
          for (const item of formData.selectedProducts) {
            try {
              const productDoc = await getDoc(doc(getFirestore(firebaseApp), "products", item.productId));
              if (productDoc.exists()) {
                const productData = productDoc.data();
                const currentStock = productData.stock || 0;
                if (currentStock > 0) {
                  await productService.updateProduct(user, item.productId, {
                    stock: Math.max(0, currentStock - item.quantity),
                  });
                  // Log inventory change
                  await inventoryService.logInventoryChange(user, {
                    productId: item.productId,
                    productName: item.name,
                    change: -item.quantity,
                    reason: `Manual order: ${createdOrder.orderNumber || createdOrder.id}`,
                    previousStock: currentStock,
                    newStock: Math.max(0, currentStock - item.quantity),
                  });
                }
              }
            } catch (stockErr) {
              console.error(`Failed to deduct stock for ${item.productId}:`, stockErr);
            }
          }
        }

        // Always send WhatsApp notification that order is confirmed & waiting to ship
        if (createdOrder.orderNumber) {
          try {
            const productName =
              formData.selectedProducts?.[0]?.name || "Order";
            const message = getOrderStatusMessage(
              "manual_order",
              formData.customerName,
              createdOrder.orderNumber,
              productName,
              deliveryAddress || formData.customerAddress
            );

            const phone = getWhatsAppPhone({
              customerPhone: normalizedPhone,
              whatsappJid: whatsappJid,
            });

            if (isValidWhatsAppPhone(phone)) {
              await sendEvolutionWhatsAppMessage(phone, message, user.uid);
              console.log("✅ Manual order WhatsApp sent to:", phone);
            } else {
              console.warn("⚠️ Invalid WhatsApp phone, opening fallback:", phone);
              // Open WhatsApp Web as fallback
              const cleanPhone = normalizedPhone.replace(/[^0-9]/g, "");
              const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
              window.open(waUrl, '_blank');
            }
          } catch (whatsappError) {
            console.error("Failed to send manual order WhatsApp:", whatsappError);
            // Show warning toast
            await showToast({
              text: 'Order created but WhatsApp notification failed to send',
              position: 'top',
            });
          }
        }

        await notificationSuccess();
        await showToast({ text: 'Manual order created — payment confirmed', duration: 'short' });
        
        loadOrders();
        loadCounts();
        loadProducts();
        setNewOrderModalOpen(false);
      } catch (error) {
        console.error("Error creating manual order:", error);
        await notificationError();
        throw error;
      }
    },
    [user, loadOrders, loadCounts, loadProducts, notificationSuccess, notificationError, showToast]
  );

  // ─── Edit Order ─────────────────────────────────────────────────────────────

  const handleSaveEdit = useCallback(
    async (formData: any) => {
      if (!user || !selectedOrder) return;
      try {
        const editedPhone = normalizePhone(formData.customerPhone);
        const originalPhone = normalizePhone(selectedOrder.customerPhone);
        const whatsappJid =
          editedPhone === originalPhone
            ? selectedOrder.whatsappJid
            : createWhatsAppJid(editedPhone);

        await orderService.updateOrder(user, selectedOrder.id, {
          customerName: formData.customerName,
          customerPhone: editedPhone,
          whatsappJid,
          customerEmail: formData.customerEmail,
          customerAddress: formData.customerAddress,
          paymentMethod: formData.paymentMethod,
          status: formData.status,
        });

        await notificationSuccess();
        await showToast({ text: 'Order updated', duration: 'short' });
        
        loadOrders();
        loadCounts();
        setEditModalOpen(false);
      } catch (error) {
        console.error("Error updating order:", error);
        await notificationError();
        throw error;
      }
    },
    [user, selectedOrder, loadOrders, loadCounts, notificationSuccess, notificationError, showToast]
  );

  // ─── Tab Config ─────────────────────────────────────────────────────────────

  const tabs: TabConfig[] = useMemo(() => {
    return TABS.map((tab) => ({
      ...tab,
      count:
        tab.id === "cancellation_requests"
          ? counts.cancellations
          : tab.id === "all"
          ? counts.all
          : tab.id === "pending"
          ? counts.pending
          : tab.id === "processing"
          ? counts.processing
          : tab.id === "completed"
          ? counts.completed
          : tab.id === "refunded"
          ? counts.refunded
          : counts.cancelled,
    }));
  }, [counts]);

  const handleTabClick = useCallback(async (tabId: string) => {
    await impactLight();
    
    if (tabId === "cancellation_requests") {
      setViewMode("cancellations");
    } else {
      setViewMode("orders");
      setActiveStatus(tabId);
    }
  }, [impactLight]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="overflow-x-hidden bg-surface-dim w-full">
      {/* Header — Premium MD3 Card */}
      <div className="mb-3 md:mb-6">
        <PageHeaderCard className="w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
            {/* Left: Icon + Title */}
            <div className="flex items-center gap-3 md:gap-4 min-w-0 w-full md:w-auto">
              {/* Premium gradient icon with glow */}
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] blur-md opacity-30 animate-pulse" />
                <div className="relative w-11 h-11 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white shadow-lg shadow-[#25D366]/20">
                  <i className="fas fa-shopping-bag text-base md:text-lg" />
                </div>
              </div>

              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl lg:text-[1.625rem] font-extrabold text-on-surface tracking-tight">
                  Orders
                </h1>
                <p className="text-xs md:text-sm text-on-surface-variant font-medium mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse mr-1.5 align-middle" />
                  Track and manage your WhatsApp orders
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto hide-scrollbar pb-0.5 md:pb-0 snap-x">
              <a
                href={`/order?tenant=${user?.uid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="snap-start shrink-0 flex items-center gap-2 px-3.5 py-2.5 md:px-4 md:py-2.5 bg-surface border-2 border-outline-variant rounded-xl font-semibold text-xs md:text-sm text-on-surface-variant hover:border-[#25D366] hover:text-[#25D366] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
              >
                <i className="fas fa-store text-xs" />
                <span className="hidden xs:inline">View Store</span>
              </a>
              <div className="snap-start shrink-0">
                <button
                  className="flex items-center gap-2 px-3.5 py-2.5 md:px-4 md:py-2.5 bg-surface border-2 border-outline-variant rounded-xl font-semibold text-xs md:text-sm text-on-surface-variant hover:border-[#25D366] hover:text-[#25D366] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
                  onClick={handleExportCSV}
                >
                  <i className="fas fa-download text-xs" />
                  <span className="hidden xs:inline">Export</span>
                </button>
              </div>
              <div className="snap-start shrink-0">
                <button
                  className="flex items-center gap-2 px-4 py-2.5 md:px-5 md:py-2.5 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-xs md:text-sm shadow-lg shadow-[#25D366]/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
                  onClick={() => setNewOrderModalOpen(true)}
                >
                  <i className="fas fa-plus text-xs" />
                  <span>New Order</span>
                </button>
              </div>
            </div>
          </div>
        </PageHeaderCard>
      </div>

      {/* Desktop Tabs */}
      <div className="hidden md:flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide animate-fadeIn px-6" style={{ animationDelay: '0.15s' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap flex items-center gap-2 transition-all active:scale-95 flex-shrink-0 ${
              (tab.id === "cancellation_requests" && viewMode === "cancellations") ||
              (tab.id !== "cancellation_requests" && activeStatus === tab.id)
                ? "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white shadow-lg"
                : "bg-surface border-2 border-outline-variant text-on-surface-variant hover:border-[#25D366] hover:text-[#25D366]"
            }`}
          >
            {tab.icon && <i className={`fas ${tab.icon} text-xs`} />}
            {tab.label}
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                (tab.id === "cancellation_requests" && viewMode === "cancellations") ||
                (tab.id !== "cancellation_requests" && activeStatus === tab.id)
                  ? "bg-surface/20"
                  : "bg-surface-variant text-on-surface-variant"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {viewMode === "cancellations" ? (
        <div className="px-3 md:px-6">
          <CancellationRequests
            cancellationRequests={cancellationRequests}
            cancellationFilter={cancellationFilter}
            setCancellationFilter={setCancellationFilter}
            onAction={handleCancellationAction}
            isLoading={loading}
          />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="px-3">
          <OrderStats
            totalOrders={counts.all}
            totalRevenue={analytics.totalRevenue}
            pendingOrders={analytics.pendingOrdersCount}
            completionRate={analytics.completionRate}
            isLoading={loading}
          />
          </div>

          {/* Mobile Add Button - Visible at top of page */}
          <div className="md:hidden px-3 mb-3">
            <button
              onClick={() => setNewOrderModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all"
            >
              <i className="fas fa-plus" />
              <span>New Order</span>
            </button>
          </div>

          {/* Mobile Tabs — MD3 compact chip switcher */}
          <div className="md:hidden mb-2">
            <OrderTabSwitcher
              tabs={tabs}
              activeTab={activeStatus}
              viewMode={viewMode}
              onTabClick={handleTabClick}
            />
          </div>

          {/* Filters & Table - FIXED: changed overflow-hidden to overflow-x-hidden */}
          <div className="bg-surface md:rounded-2xl md:border-2 border-outline md:shadow-md overflow-x-hidden">
            <OrderFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              paymentFilter={paymentFilter}
              setPaymentFilter={setPaymentFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              dateRangeStart={dateRangeStart}
              setDateRangeStart={setDateRangeStart}
              dateRangeEnd={dateRangeEnd}
              setDateRangeEnd={setDateRangeEnd}
              amountMin={amountMin}
              setAmountMin={setAmountMin}
              amountMax={amountMax}
              setAmountMax={setAmountMax}
              statusFilter={activeStatus}
              setStatusFilter={(value) => {
                setActiveStatus(value);
                setViewMode("orders");
              }}
              resultCount={filteredOrders.length}
              totalCount={orders.length}
            />

            {/* Mobile Cards - FIXED: removed wrapper div, changed spacing */}
            <div className="md:hidden px-4 py-2">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 border-4 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin mx-auto" />
                  <p className="mt-4 text-on-surface-variant">Loading orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-shopping-bag text-2xl text-gray-300" />
                  </div>
                  <h4 className="font-bold text-on-surface mb-1">No orders found</h4>
                  <p className="text-sm text-on-surface-variant">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="space-y-3 w-full">
                  {filteredOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      getStatusBadge={getStatusBadge}
                      formatDate={formatDate}
                      onOpenModal={openOrderModal}
                      onPrintInvoice={handlePrintInvoice}
                      onDuplicateOrder={handleDuplicateOrder}
                      onSendWhatsApp={sendWhatsAppNotification}
                      productImages={productImagesMap}
                    />
                  ))}
                  {/* Load More for mobile */}
                  {hasMoreOrders && (
                    <div className="py-4 text-center">
                      <button
                        onClick={loadMoreOrders}
                        disabled={isLoadingMoreOrders}
                        className="w-full px-4 py-2.5 border-2 border-outline-variant rounded-xl font-semibold text-sm text-on-surface-variant hover:border-[#25D366] hover:text-[#25D366] transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isLoadingMoreOrders ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Loading more...
                          </span>
                        ) : (
                          <span>Load More Orders</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Desktop: Premium Card Grid — replaces old table */}
            <div className="hidden md:block px-3 py-4">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 border-4 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin mx-auto" />
                  <p className="mt-4 text-on-surface-variant">Loading orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <i className="fas fa-shopping-bag text-3xl text-[#25D366]" />
                  </div>
                  <h4 className="font-bold text-lg text-on-surface mb-2">No orders found</h4>
                  <p className="text-sm text-on-surface-variant max-w-sm mx-auto">
                    Try adjusting your filters or create a new order to get started.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {filteredOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        getStatusBadge={getStatusBadge}
                        formatDate={formatDate}
                        onOpenModal={openOrderModal}
                        onPrintInvoice={handlePrintInvoice}
                        onDuplicateOrder={handleDuplicateOrder}
                        onSendWhatsApp={sendWhatsAppNotification}
                        onEditOrder={openEditModal}
                        productImages={productImagesMap}
                      />
                    ))}
                  </div>

                  {/* Pagination Footer */}
                  {!loading && filteredOrders.length > 0 && (
                    <div className="mt-6 p-4 border border-outline-variant rounded-2xl flex justify-between items-center text-sm text-on-surface-variant">
                      <div className="flex items-center gap-4">
                        <span>
                          Showing <span className="font-semibold text-on-surface">{filteredOrders.length}</span> orders (fetched {totalOrdersFetched})
                        </span>
                        <span className="w-2 h-2 rounded-full bg-[#25D366]" />
                      </div>
                      <button
                        onClick={loadMoreOrders}
                        disabled={!hasMoreOrders || isLoadingMoreOrders}
                        className="px-5 py-2.5 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                      >
                        {isLoadingMoreOrders ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-chevron-down text-xs" />
                            Load More
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onUpdateStatus={handleUpdateStatus}
        onPrintInvoice={handlePrintInvoice}
        onDuplicateOrder={handleDuplicateOrder}
        onSendWhatsApp={sendWhatsAppNotification}
        onCancelOrder={async () => {
          if (selectedOrder) await handleUpdateStatus("cancelled");
        }}
        onMarkAsPaid={async () => {
          if (!user || !selectedOrder) return;
          await impactMedium();
          try {
            await orderService.updateOrder(user, selectedOrder.id, { paymentStatus: "paid" });

            // Send payment confirmation WhatsApp notification
            const order = selectedOrder;
            const phone = getWhatsAppPhone({
              customerPhone: order.customerPhone,
              whatsappJid: order.whatsappJid,
            });
            if (isValidWhatsAppPhone(phone)) {
              const paymentMsg = `✅ *PAYMENT CONFIRMED* ✅\n\nDear ${order.customerName || "Customer"},\n\nYour payment for order *${order.orderNumber || order.id.substring(0, 8)}* has been confirmed!\n\n💰 *Amount:* ${formatCurrency(order.total || 0)}\n📋 *Order:* #${order.orderNumber || order.id.substring(0, 8)}\n\nWe will begin processing your order shortly. Thank you! 🙏`;
              sendEvolutionWhatsAppMessage(phone, paymentMsg, user.uid).catch(err =>
                console.error("Failed to send payment confirmation WhatsApp:", err)
              );
            }

            await notificationSuccess();
            await showToast({ text: 'Payment confirmed as paid', duration: 'short' });
            setModalOpen(false);
            loadOrders();
            loadCounts();
          } catch (error) {
            console.error("Error marking as paid:", error);
            await notificationError();
          }
        }}
        onAddNote={async (note: string) => {
          if (!user || !selectedOrder) return;
          await orderService.updateOrder(user, selectedOrder.id, { notes: note });
          loadOrders();
        }}
        getStatusBadge={getStatusBadge}
        formatDate={formatDate}
        formatTime={formatTime}
        productImages={productImagesMap}
      />

      <EditOrderModal
        order={selectedOrder}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSaveEdit}
      />

      <NewOrderModal
        isOpen={newOrderModalOpen}
        onClose={() => setNewOrderModalOpen(false)}
        products={products}
        customers={customers}
        pickupStations={pickupStations}
        onCreateOrder={handleCreateOrder}
        creatingOrder={false}
      />

      <PrintInvoiceModal
        order={selectedOrder}
        businessProfile={businessProfile}
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        formatDate={formatDate}
      />
    </div>
  );
}