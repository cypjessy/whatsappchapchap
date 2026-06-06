"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/currency";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecentOrdersProps {
  refreshTrigger?: number;
  maxItems?: number;
  showViewAll?: boolean;
}

interface OrderWithImage {
  id: string;
  productName: string;
  productImage?: string;
  customerName: string;
  amount: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: any;
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string; accent: string; icon: string }> = {
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    dot: "bg-amber-400",
    label: "Pending",
    accent: "border-l-amber-400",
    icon: "fa-clock",
  },
  processing: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    dot: "bg-blue-400",
    label: "Processing",
    accent: "border-l-blue-400",
    icon: "fa-cog",
  },
  shipped: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    dot: "bg-purple-400",
    label: "Shipped",
    accent: "border-l-purple-400",
    icon: "fa-shipping-fast",
  },
  delivered: {
    bg: "bg-green-50",
    text: "text-green-600",
    dot: "bg-green-400",
    label: "Delivered",
    accent: "border-l-green-400",
    icon: "fa-check-circle",
  },
  cancelled: {
    bg: "bg-red-50",
    text: "text-red-600",
    dot: "bg-red-400",
    label: "Cancelled",
    accent: "border-l-red-400",
    icon: "fa-times-circle",
  },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
}

function formatRelativeTime(createdAt: any): string {
  if (!createdAt) return "Just now";
  try {
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return "Just now";
  }
}

// ─── Product Image Component ──────────────────────────────────────────────────

function ProductImage({ src, name }: { src?: string; name: string }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center text-xl md:text-3xl bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] shrink-0 border border-white/50 shadow-sm">
        📦
      </div>
    );
  }

  return (
    <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden shrink-0 ring-2 ring-white shadow-md">
      <img
        src={src}
        alt={name}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
        loading="lazy"
      />
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config = getStatusConfig(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${config.bg} ${config.text} border border-white/40 shadow-sm`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} shadow-sm`} />
      <i className={`fas ${config.icon} text-[9px] opacity-70`} />
      {config.label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function RecentOrders({ refreshTrigger, maxItems = 5, showViewAll = true }: RecentOrdersProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadOrders = async () => {
      setLoading(true);
      try {
        const tenantId = `tenant_${user.uid}`;

        const ordersQuery = query(
          collection(db, "orders"),
          where("tenantId", "==", tenantId),
          orderBy("createdAt", "desc"),
          limit(maxItems)
        );

        const ordersSnap = await getDocs(ordersQuery);
        const ordersData: OrderWithImage[] = [];

        for (const orderDoc of ordersSnap.docs) {
          const orderData = orderDoc.data();

          let productImage: string | undefined;
          let productName = "Product";

          if (orderData.products?.[0]) {
            const product = orderData.products[0];
            productName = product.name || product.productName || productName;
            productImage = product.imageUrl || product.image || product.photoUrl || product.picture;

            if (!productImage && product.productId) {
              try {
                const productRef = doc(db, "products", product.productId);
                const productSnap = await getDoc(productRef);
                if (productSnap.exists()) {
                  const pData = productSnap.data();
                  productImage = pData.imageUrl || pData.image || pData.images?.[0] || pData.photoUrl || pData.picture;
                  productName = pData.name || pData.productName || productName;
                }
              } catch {
                // fallback
              }
            }
          }

          if (!productImage && orderData.items?.[0]) {
            const item = orderData.items[0];
            productName = item.name || item.productName || productName;
            productImage = item.imageUrl || item.image || item.photoUrl || item.picture;
          }

          if (!productImage) {
            productName = orderData.productName || orderData.name || productName;
            productImage = orderData.productImage || orderData.image || orderData.photoUrl;
          }

          ordersData.push({
            id: orderDoc.id.substring(0, 8),
            productName,
            productImage,
            customerName: orderData.customerName || orderData.customer?.name || orderData.clientName || "Customer",
            amount: orderData.total || orderData.amount || orderData.price || 0,
            status: orderData.status || "pending",
            createdAt: orderData.createdAt,
          });
        }

        setOrders(ordersData);
      } catch (error) {
        console.error("Error loading orders:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user, refreshTrigger, maxItems]);

  // ─── Loading State ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden">
        {/* Header shimmer */}
        <div className="p-4 md:p-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-100 rounded w-28 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-20 animate-pulse" />
              </div>
            </div>
            <div className="h-8 bg-gray-100 rounded-xl w-20 animate-pulse" />
          </div>
        </div>
        {/* Rows shimmer */}
        <div className="divide-y divide-gray-50">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-100 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-3.5 bg-gray-100 rounded w-16 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-12 animate-pulse ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Empty State ────────────────────────────────────────────────────────────

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] flex items-center justify-center shadow-sm">
                <i className="fas fa-list text-[#3B82F6] text-sm" />
              </div>
              <div>
                <h3 className="font-semibold text-sm md:text-base text-gray-900">Recent Orders</h3>
                <p className="text-[10px] text-gray-400 font-medium">Track incoming orders</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-14 px-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mb-5 shadow-inner">
            <span className="text-4xl">📦</span>
          </div>
          <h4 className="font-bold text-base text-gray-800 mb-1.5">No orders yet</h4>
          <p className="text-sm text-gray-400 text-center max-w-xs leading-relaxed">
            When customers place orders, they will appear here with all the details.
          </p>
          <div className="mt-5 flex items-center gap-2 text-xs text-gray-300">
            <i className="fas fa-arrow-down text-[#25D366]" />
            <span>Orders appear automatically</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="relative">
        {/* Gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#25D366] via-[#3B82F6] to-[#8B5CF6]" />

        <div className="p-4 md:p-5 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center shadow-md shadow-[#25D366]/20">
                <i className="fas fa-shopping-bag text-white text-sm" />
              </div>
              <div>
                <h3 className="font-bold text-sm md:text-base text-gray-900">Recent Orders</h3>
                <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse" />
                  Last {orders.length} order{orders.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {showViewAll && (
              <Link
                href="/orders"
                className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gradient-to-r hover:from-[#25D366] hover:to-[#128C7E] hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-[#25D366]/25 transition-all duration-300 active:scale-95"
              >
                <span>View All</span>
                <i className="fas fa-arrow-right text-[10px] group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ===== Mobile Cards ===== */}
      <div className="md:hidden divide-y divide-gray-50">
        {orders.map((order, index) => {
          const status = getStatusConfig(order.status);
          return (
            <Link
              key={order.id}
              href="/orders"
              className="relative block hover:bg-gray-50/70 transition-all duration-200 active:bg-gray-100"
              style={{
                animation: `slideInUp 0.35s ease-out ${index * 60}ms both`,
              }}
            >
              {/* Left status accent bar */}
              <div className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full ${status.dot}`} />

              <div className="p-4 pl-5">                  <div className="flex items-start gap-3.5">
                  <ProductImage src={order.productImage} name={order.productName} />
                  <div className="flex-1 min-w-0">
                    {/* Top row: Order ID + Status */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono font-bold text-xs text-gray-400 tracking-wider">
                        #{order.id}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>

                    {/* Product name */}
                    <p className="text-sm font-semibold text-gray-800 truncate leading-snug">
                      {order.productName}
                    </p>

                    {/* Bottom row: Customer + Amount + Time */}
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <i className="fas fa-user text-[9px] text-gray-300" />
                        <span className="text-xs text-gray-500 truncate">{order.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-sm text-gray-800 tabular-nums">
                          {formatCurrency(order.amount)}
                        </span>
                        <span className="text-[10px] text-gray-400">•</span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {formatRelativeTime(order.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ===== Desktop Table ===== */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr>
              {["Order ID", "Product", "Customer", "Amount", "Status", "Date"].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 bg-gray-50/50 border-b border-gray-100"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => {
              const status = getStatusConfig(order.status);
              return (
                <tr
                  key={order.id}
                  className="group border-b border-gray-50 hover:bg-gradient-to-r hover:from-blue-50/40 hover:to-indigo-50/20 transition-all duration-200 last:border-b-0 cursor-pointer"
                  style={{
                    animation: `slideInUp 0.3s ease-out ${index * 50}ms both`,
                  }}
                  onClick={() => window.location.href = "/orders"}
                >
                  {/* Status accent indicator */}
                  <td className="relative w-1 p-0">
                    <div className={`absolute inset-y-2 left-0 w-[3px] rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${status.dot}`} />
                  </td>

                  {/* Order ID */}
                  <td className="px-4 py-4">
                    <span className="font-mono font-bold text-xs text-gray-400 tracking-wider group-hover:text-gray-600 transition-colors">
                      #{order.id}
                    </span>
                  </td>

                  {/* Product */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <ProductImage src={order.productImage} name={order.productName} />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-800 group-hover:text-gray-900 transition-colors truncate max-w-[200px]">
                          {order.productName}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                        {order.customerName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                        {order.customerName}
                      </span>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-4">
                    <span className="font-bold text-sm text-gray-800 tabular-nums">
                      {formatCurrency(order.amount)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <StatusBadge status={order.status} />
                  </td>

                  {/* Date */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-400">
                      <i className="far fa-clock text-[10px]" />
                      <span className="font-medium">{formatRelativeTime(order.createdAt)}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer */}
        {orders.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-50 bg-gray-50/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <i className="fas fa-sync-alt text-[9px]" />
              <span>Orders update in real-time</span>
            </div>
            <Link
              href="/orders"
              className="text-[11px] font-semibold text-[#25D366] hover:text-[#128C7E] transition-colors flex items-center gap-1"
            >
              View all orders
              <i className="fas fa-chevron-right text-[8px]" />
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
