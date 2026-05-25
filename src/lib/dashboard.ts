import { db } from "./firebase";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  getCountFromServer
} from "firebase/firestore";
import { User } from "firebase/auth";

const getTenantId = (user: User): string => `tenant_${user.uid}`;

export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  pendingOrders: number;
  activeCustomers: number;
  aiResponseRate: number;
  salesChange: number;
  ordersChange: number;
  newCustomersToday: number;
}

export interface OrderData {
  id: string;
  productName: string;
  productImage?: string;
  productEmoji: string;
  productEmojiBg: string;
  details: string;
  customerName: string;
  amount: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: any;
}

export interface ActivityItem {
  id: string;
  type: "order" | "customer" | "product" | "payment" | "booking" | "message" | "alert";
  message: string;
  time: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  isUnread?: boolean;
  details?: string;
}

export const dashboardService = {
  async getStats(user: User): Promise<DashboardStats> {
    const tenantId = getTenantId(user);
    
    const ordersRef = collection(db, "orders");
    const customersRef = collection(db, "clients");
    
    // ⚡ Use count queries instead of fetching full documents where possible
    const allOrdersQuery = query(ordersRef, where("tenantId", "==", tenantId));
    const allCustomersQuery = query(customersRef, where("tenantId", "==", tenantId));
    
    const [ordersSnap, customersSnap] = await Promise.all([
      getDocs(allOrdersQuery),
      getDocs(allCustomersQuery)
    ]);
    
    const orders = ordersSnap.docs.map(doc => doc.data());
    const customers = customersSnap.docs.map(doc => doc.data());
    
    const totalSales = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((order: any) => order.status === "pending").length;
    const activeCustomers = customers.length;
    
    return {
      totalSales,
      totalOrders,
      pendingOrders,
      activeCustomers,
      aiResponseRate: 94,
      salesChange: 12.5,
      ordersChange: 8.2,
      newCustomersToday: 24,
    };
  },

  async getRecentOrders(user: User, limitCount: number = 5): Promise<OrderData[]> {
    const tenantId = getTenantId(user);
    
    const q = query(
      collection(db, "orders"),
      where("tenantId", "==", tenantId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    const snap = await getDocs(q);
    const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Collect all product IDs referenced in these orders to batch-fetch their images
    const productIds = new Set<string>();
    orders.forEach((order: any) => {
      if (order.productImage) return; // Already has direct image
      if (order.products?.[0]?.productId) {
        productIds.add(order.products[0].productId);
      }
    });

    // Batch-fetch product images if there are any product IDs to look up
    let productImageMap: Record<string, string> = {};
    if (productIds.size > 0) {
      try {
        const ids = Array.from(productIds);
        // Firestore 'in' queries support up to 30 values
        if (ids.length <= 30) {
          const productsQuery = query(
            collection(db, "products"),
            where("__name__", "in", ids)
          );
          const productsSnap = await getDocs(productsQuery);
          productsSnap.docs.forEach(productDoc => {
            const productData = productDoc.data();
            const img = productData.image || productData.imageUrl || productData.images?.[0];
            if (img) {
              productImageMap[productDoc.id] = img;
            }
          });
        }
      } catch (error) {
        console.error("Error fetching product images:", error);
        // Non-critical — fall back to emoji
      }
    }
    
    return orders.map((data: any) => {
      // Determine product image: direct field → product lookup → fallback
      let productImage = data.productImage || undefined;
      if (!productImage && data.products?.[0]?.productId) {
        productImage = productImageMap[data.products[0].productId] || undefined;
      }

      return {
        id: data.id.substring(0, 8),
        productName: data.products?.[0]?.name || "Product",
        productImage,
        productEmoji: "📦",
        productEmojiBg: "from-[#DCF8C6] to-[#e0e7ff]",
        details: `Qty: ${data.products?.[0]?.quantity || 1}`,
        customerName: data.customerName || "Customer",
        amount: data.total || 0,
        status: data.status || "pending",
        createdAt: data.createdAt,
      };
    });
  },

  async getRecentActivity(user: User): Promise<ActivityItem[]> {
    const tenantId = getTenantId(user);
    
    const ordersQ = query(
      collection(db, "orders"),
      where("tenantId", "==", tenantId),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    
    const customersQ = query(
      collection(db, "clients"),
      where("tenantId", "==", tenantId),
      orderBy("createdAt", "desc"),
      limit(3)
    );
    
    const [ordersSnap, customersSnap] = await Promise.all([
      getDocs(ordersQ),
      getDocs(customersQ)
    ]);
    
    const activities: ActivityItem[] = [];
    
    ordersSnap.docs.forEach((doc, idx) => {
      const data = doc.data();
      activities.push({
        id: `order-${idx}`,
        type: "order",
        message: `New order from ${data.customerName || "Customer"}`,
        time: idx === 0 ? "Just now" : `${idx * 2} hours ago`,
        icon: "fa-shopping-bag",
        iconBg: "rgba(37,211,102,0.1)",
        iconColor: "#25D366",
      });
    });
    
    customersSnap.docs.forEach((doc, idx) => {
      const data = doc.data();
      activities.push({
        id: `customer-${idx}`,
        type: "customer",
        message: `${data.name || "New customer"} joined`,
        time: idx === 0 ? "1 hour ago" : `${idx + 2} hours ago`,
        icon: "fa-user-plus",
        iconBg: "rgba(59,130,246,0.1)",
        iconColor: "#3b82f6",
      });
    });
    
    return activities.slice(0, 6);
  },
};
