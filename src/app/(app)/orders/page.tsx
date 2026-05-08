"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  orderService,
  Order,
  OrderStatus,
  productService,
  Product,
  customerService,
  Customer,
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
import OrderTable from "./components/OrderTable";
import OrderCard from "./components/OrderCard";
import OrderDetailModal from "./components/OrderDetailModal";
import EditOrderModal from "./components/EditOrderModal";
import NewOrderModal from "./components/NewOrderModal";
import CancellationRequests from "./components/CancellationRequests";

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
  if (!createdAt) return "";
  try {
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function getStatusBadge(status?: string) {
  return (
    STATUS_BADGES[status || "pending"] || {
      bg: "bg-gray-50",
      color: "text-gray-600",
      label: "Unknown",
      icon: "fa-circle",
    }
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OrdersPage() {
  const { user } = useAuth();

  // ─── Data State ─────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
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

  // Selection
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newOrderModalOpen, setNewOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Cancellation
  const [cancellationFilter, setCancellationFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");

  // ─── Load Data ──────────────────────────────────────────────────────────────

  const loadOrders = useCallback(async () => {
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
  }, [user, activeStatus]);

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

  useEffect(() => {
    if (!user) return;
    loadOrders();
    loadCounts();
    loadProducts();
    loadCustomers();
    loadCancellationRequests();
  }, [user, activeStatus, loadOrders, loadCounts, loadProducts, loadCustomers, loadCancellationRequests]);

  // ─── Filtered Orders ────────────────────────────────────────────────────────

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

  // ─── Selection Handlers ─────────────────────────────────────────────────────

  const toggleSelect = useCallback((orderId: string) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedOrders((prev) => {
      if (prev.size === filteredOrders.length) return new Set();
      return new Set(filteredOrders.map((o) => o.id));
    });
  }, [filteredOrders]);

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
      try {
        await orderService.updateOrder(user, selectedOrder.id, { status });

        // Send WhatsApp notifications based on status
        if (["confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"].includes(status)) {
          sendWhatsAppNotification(selectedOrder, status).catch((err) =>
            console.error("Failed to send WhatsApp:", err)
          );
        }

        loadOrders();
        loadCounts();
      } catch (error) {
        console.error("Error updating status:", error);
      }
    },
    [user, selectedOrder, loadOrders, loadCounts]
  );

  const handlePrintInvoice = useCallback((order: Order) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${order.orderNumber || order.id.substring(0, 8)}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1e293b; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #25D366; padding-bottom: 20px; }
          .logo { font-size: 32px; font-weight: 900; color: #25D366; letter-spacing: -1px; }
          .invoice-meta { display: flex; justify-content: space-between; margin: 20px 0; padding: 20px; background: #f8fafc; border-radius: 12px; }
          table { width: 100%; border-collapse: collapse; margin: 30px 0; }
          th { background: #f8fafc; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; border-bottom: 2px solid #e2e8f0; }
          td { padding: 16px 12px; border-bottom: 1px solid #e2e8f0; }
          .total-row { font-size: 20px; font-weight: 900; color: #25D366; border-top: 3px solid #e2e8f0; }
          .footer { margin-top: 60px; text-align: center; color: #64748b; font-size: 14px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">INVOICE</div>
          <div style="color: #64748b; margin-top: 8px;">Order #${order.orderNumber || order.id.substring(0, 8)}</div>
          <div style="color: #94a3b8; font-size: 14px;">${formatDate(order.createdAt)}</div>
        </div>
        
        <div class="invoice-meta">
          <div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Billed To</div>
            <div style="font-weight: 700;">${order.customerName || "Customer"}</div>
            <div style="color: #64748b; font-size: 14px;">${order.customerPhone || "N/A"}</div>
            <div style="color: #64748b; font-size: 14px;">${order.customerEmail || ""}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Ship To</div>
            <div style="color: #64748b; font-size: 14px;">${order.deliveryAddress || order.customerAddress || "N/A"}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${(order.products || [])
              .map(
                (p) => `
              <tr>
                <td>
                  <div style="font-weight: 600;">${p.name}</div>
                </td>
                <td style="text-align: right;">${formatCurrency(p.price)}</td>
                <td style="text-align: center;">${p.quantity}</td>
                <td style="text-align: right; font-weight: 700;">${formatCurrency(p.price * p.quantity)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div style="margin-left: auto; width: 300px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; color: #64748b;">
            <span>Subtotal</span>
            <span style="font-weight: 600;">${formatCurrency(order.subtotal || 0)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; color: #64748b;">
            <span>Shipping</span>
            <span style="font-weight: 600;">${formatCurrency(order.shipping || 0)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; color: #64748b;">
            <span>Tax</span>
            <span style="font-weight: 600;">${formatCurrency(order.tax || 0)}</span>
          </div>
          ${order.discount ? `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; color: #10b981;">
            <span>Discount</span>
            <span style="font-weight: 600;">-${formatCurrency(order.discount)}</span>
          </div>
          ` : ""}
          <div class="total-row" style="display: flex; justify-content: space-between; padding: 16px 0; margin-top: 8px;">
            <span>Total</span>
            <span>${formatCurrency(order.total || 0)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your business!</p>
          <p style="font-size: 12px; margin-top: 8px;">This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }, []);

  const handleDuplicateOrder = useCallback(
    async (order: Order) => {
      if (!user) return;
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
      } catch (error) {
        console.error("Error duplicating order:", error);
      }
    },
    [user, loadOrders, loadCounts]
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

  const handleBulkUpdateStatus = useCallback(
    async (status: Order["status"]) => {
      if (!user || selectedOrders.size === 0) return;
      try {
        for (const orderId of selectedOrders) {
          await orderService.updateOrder(user, orderId, { status });
        }
        setSelectedOrders(new Set());
        loadOrders();
        loadCounts();
      } catch (error) {
        console.error("Error bulk updating:", error);
      }
    },
    [user, selectedOrders, loadOrders, loadCounts]
  );

  const handleExportCSV = useCallback(() => {
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
  }, [filteredOrders]);

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

          // Send WhatsApp
          const customerPhone = orderData.customerPhone;
          const customerName = orderData.customerName || "Customer";
          const orderTotal = orderData.total || 0;

          if (customerPhone && isValidWhatsAppPhone(customerPhone)) {
            const message = isApproving
              ? `✅ *REFUND PROCESSED* ✅\n\nDear ${customerName},\n\nYour refund for order *${orderId}* has been processed.\n\n💰 *Amount:* ${formatCurrency(orderTotal)}\n⏱️ *Time:* 24-48 hours\n\nThank you! 🙏`
              : `ℹ️ *CANCELLATION UPDATE*\n\nDear ${customerName},\n\nYour cancellation request for order *${orderId}* was not approved.\n\nYour order will be delivered as planned.\n\nThank you for understanding!`;

            await sendEvolutionWhatsAppMessage(customerPhone, message, user.uid);
          }
        }

        await loadCancellationRequests();
        await loadOrders();
        await loadCounts();
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
        const orderNumber =
          "ORD-" + Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
        const normalizedPhone = normalizePhone(formData.customerPhone);
        const whatsappJid = createWhatsAppJid(normalizedPhone);

        await orderService.createOrder(user, {
          orderNumber,
          customerId: "",
          customerName: formData.customerName,
          customerPhone: normalizedPhone,
          whatsappJid,
          customerEmail: formData.customerEmail,
          customerAddress: formData.customerAddress,
          products: formData.selectedProducts,
          subtotal: formData.subtotal,
          shipping: formData.shipping,
          tax: formData.tax,
          discount: formData.discount,
          total: formData.total,
          paymentMethod: formData.paymentMethod,
          status: "pending",
          notes: formData.notes,
        });

        loadOrders();
        loadCounts();
        setNewOrderModalOpen(false);
      } catch (error) {
        console.error("Error creating order:", error);
        throw error;
      }
    },
    [user, loadOrders, loadCounts]
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

        loadOrders();
        loadCounts();
        setEditModalOpen(false);
      } catch (error) {
        console.error("Error updating order:", error);
        throw error;
      }
    },
    [user, selectedOrder, loadOrders, loadCounts]
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

  const handleTabClick = useCallback((tabId: string) => {
    if (tabId === "cancellation_requests") {
      setViewMode("cancellations");
    } else {
      setViewMode("orders");
      setActiveStatus(tabId);
    }
    setSelectedOrders(new Set());
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fadeIn max-w-[1400px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#1e293b] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white shadow-lg">
              <i className="fas fa-shopping-bag" />
            </div>
            Orders
          </h1>
          <p className="text-[#64748b] text-sm mt-1 hidden md:block">
            Track and manage your WhatsApp orders
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <a
            href={`/order?tenant=${user?.uid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366] hover:text-[#25D366] transition-all flex items-center gap-2 active:scale-95"
          >
            <i className="fas fa-store" />
            <span className="hidden md:inline">View Store</span>
          </a>
          {selectedOrders.size > 0 && (
            <>
              <button
                className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
                onClick={() => handleBulkUpdateStatus("delivered")}
              >
                <i className="fas fa-check" />
                <span className="hidden md:inline">Complete ({selectedOrders.size})</span>
              </button>
              <button
                className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
                onClick={() => handleBulkUpdateStatus("cancelled")}
              >
                <i className="fas fa-times" />
                <span className="hidden md:inline">Cancel ({selectedOrders.size})</span>
              </button>
            </>
          )}
          <button
            className="px-4 py-2.5 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366] hover:text-[#25D366] transition-all flex items-center gap-2 active:scale-95"
            onClick={handleExportCSV}
          >
            <i className="fas fa-download" />
            <span className="hidden md:inline">Export</span>
          </button>
          <button
            className="px-4 py-2.5 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2"
            onClick={() => setNewOrderModalOpen(true)}
          >
            <i className="fas fa-plus" />
            <span className="hidden md:inline">New Order</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1 animate-fadeIn" style={{ animationDelay: '0.15s' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap flex items-center gap-2 transition-all active:scale-95 flex-shrink-0 ${
              (tab.id === "cancellation_requests" && viewMode === "cancellations") ||
              (tab.id !== "cancellation_requests" && activeStatus === tab.id)
                ? "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white shadow-lg"
                : "bg-white border-2 border-[#e2e8f0] text-[#64748b] hover:border-[#25D366] hover:text-[#25D366]"
            }`}
          >
            {tab.icon && <i className={`fas ${tab.icon} text-xs`} />}
            {tab.label}
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                (tab.id === "cancellation_requests" && viewMode === "cancellations") ||
                (tab.id !== "cancellation_requests" && activeStatus === tab.id)
                  ? "bg-white/20"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {viewMode === "cancellations" ? (
        <CancellationRequests
          cancellationRequests={cancellationRequests}
          cancellationFilter={cancellationFilter}
          setCancellationFilter={setCancellationFilter}
          onAction={handleCancellationAction}
          isLoading={loading}
        />
      ) : (
        <>
          {/* Stats */}
          <OrderStats
            totalOrders={counts.all}
            totalRevenue={analytics.totalRevenue}
            pendingOrders={analytics.pendingOrdersCount}
            completionRate={analytics.completionRate}
            isLoading={loading}
          />

          {/* Filters & Table */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
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
              resultCount={filteredOrders.length}
              totalCount={orders.length}
            />

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-[#e2e8f0]">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 border-4 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin mx-auto" />
                  <p className="mt-4 text-[#64748b]">Loading orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-shopping-bag text-2xl text-gray-300" />
                  </div>
                  <h4 className="font-bold text-[#1e293b] mb-1">No orders found</h4>
                  <p className="text-sm text-[#64748b]">Try adjusting your filters</p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    getStatusBadge={getStatusBadge}
                    formatDate={formatDate}
                    onOpenModal={openOrderModal}
                    onPrintInvoice={handlePrintInvoice}
                    onDuplicateOrder={handleDuplicateOrder}
                    onSendWhatsApp={sendWhatsAppNotification}
                  />
                ))
              )}
            </div>

            {/* Desktop Table */}
            <OrderTable
              orders={filteredOrders}
              selectedOrders={selectedOrders}
              toggleSelect={toggleSelect}
              toggleSelectAll={toggleSelectAll}
              getStatusBadge={getStatusBadge}
              formatDate={formatDate}
              formatTime={formatTime}
              onOpenModal={openOrderModal}
              onOpenEditModal={openEditModal}
              onPrintInvoice={handlePrintInvoice}
              onDuplicateOrder={handleDuplicateOrder}
              onSendWhatsApp={sendWhatsAppNotification}
              onBulkDelete={async (ids: string[]) => {
                // Implement bulk delete if needed
                console.log("Delete orders:", ids);
              }}
              onBulkStatusUpdate={async (orderIds, status) => {
                if (!user || orderIds.length === 0) return;
                try {
                  for (const orderId of orderIds) {
                    await orderService.updateOrder(user, orderId, { status });
                  }
                  setSelectedOrders(new Set());
                  loadOrders();
                  loadCounts();
                } catch (error) {
                  console.error("Error bulk updating:", error);
                }
              }}
              isLoading={loading}
            />

            {/* Pagination Footer */}
            {!loading && filteredOrders.length > 0 && (
              <div className="p-4 border-t border-[#e2e8f0] flex justify-between items-center text-sm text-[#64748b]">
                <div>
                  Showing <span className="font-semibold text-[#1e293b]">{filteredOrders.length}</span> orders
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-2 border-2 border-[#e2e8f0] rounded-lg hover:border-[#25D366] transition-all disabled:opacity-40"
                    disabled
                  >
                    <i className="fas fa-chevron-left" />
                  </button>
                  <button className="px-3 py-2 bg-[#25D366] text-white rounded-lg font-semibold">1</button>
                  <button
                    className="px-3 py-2 border-2 border-[#e2e8f0] rounded-lg hover:border-[#25D366] transition-all disabled:opacity-40"
                    disabled
                  >
                    <i className="fas fa-chevron-right" />
                  </button>
                </div>
              </div>
            )}
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
        onAddNote={async (note: string) => {
          if (!user || !selectedOrder) return;
          await orderService.updateOrder(user, selectedOrder.id, { notes: note });
          loadOrders();
        }}
        getStatusBadge={getStatusBadge}
        formatDate={formatDate}
        formatTime={formatTime}
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
        onCreateOrder={handleCreateOrder}
        creatingOrder={false}
      />
    </div>
  );
}