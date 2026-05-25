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

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
  pending: { bg: "bg-[#FEF3C7]", text: "text-[#F59E0B]", border: "border-[#F59E0B]/20", dot: "bg-[#F59E0B]", label: "Pending" },
  processing: { bg: "bg-[#EFF6FF]", text: "text-[#3B82F6]", border: "border-[#3B82F6]/20", dot: "bg-[#3B82F6]", label: "Processing" },
  shipped: { bg: "bg-[#F3E8FF]", text: "text-[#8B5CF6]", border: "border-[#8B5CF6]/20", dot: "bg-[#8B5CF6]", label: "Shipped" },
  delivered: { bg: "bg-[#E8F5E9]", text: "text-[#25D366]", border: "border-[#25D366]/20", dot: "bg-[#25D366]", label: "Delivered" },
  cancelled: { bg: "bg-[#FEE2E2]", text: "text-[#EF4444]", border: "border-[#EF4444]/20", dot: "bg-[#EF4444]", label: "Cancelled" },
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
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-surface-variant shrink-0">
        📦
      </div>
    );
  }

  return (
    <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-variant shrink-0">
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

        // Fetch recent orders
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
          console.log("[RecentOrders] Order data:", orderDoc.id, orderData);

          // Get product image - try multiple sources
          let productImage: string | undefined;
          let productName = "Product";

          // 1. Try to get from order's product data (products array)
          if (orderData.products?.[0]) {
            const product = orderData.products[0];
            console.log("[RecentOrders] Product from products[0]:", product);
            productName = product.name || product.productName || productName;
            // Check imageUrl first (new field), then fall back to other fields
            productImage = product.imageUrl || product.image || product.photoUrl || product.picture;

            // 2. If no image, fetch from products collection
            if (!productImage && product.productId) {
              try {
                const productRef = doc(db, "products", product.productId);
                const productSnap = await getDoc(productRef);
                console.log("[RecentOrders] Fetched product:", productSnap.exists(), productSnap.data());
                if (productSnap.exists()) {
                  const pData = productSnap.data();
                  productImage = pData.imageUrl || pData.image || pData.images?.[0] || pData.photoUrl || pData.picture;
                  productName = pData.name || pData.productName || productName;
                }
              } catch (e) {
                console.log("[RecentOrders] Failed to fetch product:", e);
              }
            }
          }

          // 3. Try items array if products not available
          if (!productImage && orderData.items?.[0]) {
            const item = orderData.items[0];
            console.log("[RecentOrders] Product from items[0]:", item);
            productName = item.name || item.productName || productName;
            productImage = item.imageUrl || item.image || item.photoUrl || item.picture;
          }

          // 4. Try direct order fields
          if (!productImage) {
            productName = orderData.productName || orderData.name || productName;
            productImage = orderData.productImage || orderData.image || orderData.photoUrl;
          }

          console.log("[RecentOrders] Final product:", { productName, productImage });

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

  if (loading) {
    return (
      <div className="bg-surface rounded-2xl border border-outline-variant shadow-md3-level1 overflow-hidden">
        <div className="p-4 md:p-5 border-b border-outline-variant">
          <div className="h-6 bg-surface-variant rounded w-32 animate-pulse" />
        </div>
        <div className="divide-y divide-outline-variant">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-surface-variant rounded-xl animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-surface-variant rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-surface-variant rounded w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-outline-variant shadow-md3-level1 overflow-hidden">
        <div className="p-4 md:p-5 border-b border-outline-variant flex items-center justify-between">
          <h3 className="font-semibold text-sm md:text-base text-on-surface">Recent Orders</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
          <div className="w-16 h-16 rounded-2xl bg-surface-variant flex items-center justify-center mb-4 text-3xl">
            📦
          </div>
          <h4 className="font-semibold text-base mb-1">No orders yet</h4>
          <p className="text-sm text-outline text-center max-w-xs">
            When customers order from you, they will appear here automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl border border-outline-variant shadow-md3-level1 overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
            <i className="fas fa-list text-[#3B82F6] text-sm" />
          </div>
          <div>
            <h3 className="font-semibold text-sm md:text-base text-on-surface">Recent Orders</h3>
            <span className="text-[10px] text-outline font-medium">Last {orders.length} orders</span>
          </div>
        </div>

        {showViewAll && (
          <Link
            href="/orders"
            className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-semibold bg-surface-variant text-on-surface-variant border border-outline-variant hover:bg-[#8B5CF6] hover:text-white hover:border-[#8B5CF6] transition-all duration-200"
          >
            View All
          </Link>
        )}
      </div>

      {/* Mobile List */}
      <div className="md:hidden divide-y divide-outline-variant">
        {orders.map((order, index) => {
          const status = getStatusConfig(order.status);
          return (
            <Link
              key={order.id}
              href="/orders"
              className="block p-4 hover:bg-surface-container-lowest transition-colors"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <ProductImage src={order.productImage} name={order.productName} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-primary">#{order.id}</span>
                    <span className="font-bold text-sm">{formatCurrency(order.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-on-surface truncate">{order.productName}</span>
                    <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${status.bg} ${status.text} ${status.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-outline">
                    <span className="truncate">{order.customerName}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(order.createdAt)}</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="bg-surface border-b border-outline-variant">
              {["Order ID", "Product", "Customer", "Amount", "Status", "Date"].map((h) => (
                <th key={h} className="text-left p-4 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const status = getStatusConfig(order.status);
              return (
                <tr key={order.id} className="border-t border-outline-variant hover:bg-surface-container-lowest transition-colors">
                  <td className="p-4">
                    <span className="font-semibold text-sm text-primary">#{order.id}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <ProductImage src={order.productImage} name={order.productName} />
                      <div>
                        <div className="font-medium text-sm">{order.productName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm">{order.customerName}</span>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-sm">{formatCurrency(order.amount)}</span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase border ${status.bg} ${status.text} ${status.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-on-surface-variant">
                    {formatRelativeTime(order.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
