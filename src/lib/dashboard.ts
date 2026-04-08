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
  activeCustomers: number;
  aiResponseRate: number;
  salesChange: number;
  ordersChange: number;
  newCustomersToday: number;
}

export interface OrderData {
  id: string;
  productName: string;
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
  type: "order" | "customer" | "product" | "payment";
  message: string;
  time: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

export const dashboardService = {
  async getStats(user: User): Promise<DashboardStats> {
    const tenantId = getTenantId(user);
    
    const ordersRef = collection(db, "orders");
    const customersRef = collection(db, "customers");
    
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
    const activeCustomers = customers.length;
    
    return {
      totalSales,
      totalOrders,
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
    
    return snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id.substring(0, 8),
        productName: data.products?.[0]?.name || "Product",
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
      collection(db, "customers"),
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
