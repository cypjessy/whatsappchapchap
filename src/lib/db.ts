import { db } from "./firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  deleteDoc,
  addDoc
} from "firebase/firestore";
import { User } from "firebase/auth";

export interface Tenant {
  id: string;
  userId: string;
  name: string;
  email: string;
  businessName: string;
  phone?: string;
  plan: "free" | "starter" | "pro" | "enterprise";
  createdAt: any;
  updatedAt: any;
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  stock?: number;
  image?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  tags?: string[];
  totalSpent?: number;
  orderCount?: number;
  segment?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Order {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  products: { productId: string; name: string; quantity: number; price: number }[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Message {
  id: string;
  tenantId: string;
  conversationId: string;
  sender: "customer" | "business";
  text: string;
  status: "sent" | "delivered" | "read";
  createdAt: any;
}

export interface Conversation {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  lastMessage?: string;
  lastMessageTime?: any;
  unreadCount: number;
  status: "active" | "archived";
  createdAt: any;
  updatedAt: any;
}

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  products: string[]; // product IDs they supply
  paymentTerms?: string;
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface ShippingMethod {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  cost: number;
  estimatedDays: number;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Shipment {
  id: string;
  tenantId: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  shippingMethod: string;
  trackingNumber?: string;
  status: "pending" | "shipped" | "delivered" | "returned";
  shippedAt?: any;
  deliveredAt?: any;
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface InventoryLog {
  id: string;
  tenantId: string;
  productId: string;
  productName: string;
  type: "in" | "out" | "adjustment";
  quantity: number;
  reason: string;
  reference?: string; // order ID, supplier ID, etc.
  createdAt: any;
}

export interface Review {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  orderId: string;
  productId?: string;
  productName?: string;
  rating: number; // 1-5
  comment?: string;
  response?: string;
  responseAt?: any;
  isPublic: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Campaign {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: "broadcast" | "promotional" | "followup";
  segment: "all" | "vip" | "frequent" | "new" | "inactive";
  message: string;
  scheduledAt?: any;
  sentAt?: any;
  status: "draft" | "scheduled" | "sending" | "completed" | "cancelled";
  recipientCount: number;
  deliveredCount: number;
  responseCount: number;
  createdAt: any;
  updatedAt: any;
}

export interface Expense {
  id: string;
  tenantId: string;
  category: "supplies" | "shipping" | "marketing" | "utilities" | "other";
  description: string;
  amount: number;
  date: any;
  reference?: string;
  createdAt: any;
}

const getTenantId = (user: User): string => `tenant_${user.uid}`;

export const tenantService = {
  async createTenant(user: User, businessName: string): Promise<Tenant> {
    const tenantId = getTenantId(user);
    const tenantData: Tenant = {
      id: tenantId,
      userId: user.uid,
      name: user.displayName || user.email?.split("@")[0] || "User",
      email: user.email || "",
      businessName,
      plan: "free",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(doc(db, "tenants", tenantId), tenantData);
    return tenantData;
  },

  async getTenant(user: User): Promise<Tenant | null> {
    const tenantId = getTenantId(user);
    const snap = await getDoc(doc(db, "tenants", tenantId));
    return snap.exists() ? { id: snap.id, ...snap.data() } as Tenant : null;
  },

  async updateTenant(user: User, data: Partial<Tenant>): Promise<void> {
    const tenantId = getTenantId(user);
    await setDoc(doc(db, "tenants", tenantId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },
};

export const productService = {
  async createProduct(user: User, product: Omit<Product, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<Product> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "products"));
    const productData: Product = {
      ...product,
      id: docRef.id,
      tenantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(docRef, productData);
    return productData;
  },

  async getProducts(user: User): Promise<Product[]> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "products"), where("tenantId", "==", tenantId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
  },

  async updateProduct(user: User, productId: string, data: Partial<Product>): Promise<void> {
    await setDoc(doc(db, "products", productId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteProduct(user: User, productId: string): Promise<void> {
    await deleteDoc(doc(db, "products", productId));
  },
};

export const customerService = {
  async createCustomer(user: User, customer: Omit<Customer, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<Customer> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "customers"));
    const customerData: Customer = {
      ...customer,
      id: docRef.id,
      tenantId,
      totalSpent: 0,
      orderCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(docRef, customerData);
    return customerData;
  },

  async getCustomers(user: User): Promise<Customer[]> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "customers"), where("tenantId", "==", tenantId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Customer[];
  },

  async updateCustomer(user: User, customerId: string, data: Partial<Customer>): Promise<void> {
    await setDoc(doc(db, "customers", customerId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteCustomer(user: User, customerId: string): Promise<void> {
    await deleteDoc(doc(db, "customers", customerId));
  },
};

export const orderService = {
  async createOrder(user: User, order: Omit<Order, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<Order> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "orders"));
    const orderData: Order = {
      ...order,
      id: docRef.id,
      tenantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(docRef, orderData);
    return orderData;
  },

  async getOrders(user: User, status?: string): Promise<Order[]> {
    const tenantId = getTenantId(user);
    let q;
    if (status && status !== "all") {
      q = query(collection(db, "orders"), where("tenantId", "==", tenantId), where("status", "==", status), orderBy("createdAt", "desc"));
    } else {
      q = query(collection(db, "orders"), where("tenantId", "==", tenantId), orderBy("createdAt", "desc"));
    }
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
  },

  async getOrderById(user: User, orderId: string): Promise<Order | null> {
    const snap = await getDoc(doc(db, "orders", orderId));
    return snap.exists() ? { id: snap.id, ...snap.data() } as Order : null;
  },

  async updateOrder(user: User, orderId: string, data: Partial<Order>): Promise<void> {
    await setDoc(doc(db, "orders", orderId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

async getOrderCounts(user: User): Promise<{all: number, pending: number, processing: number, completed: number, cancelled: number}> {
    const tenantId = getTenantId(user);
    const allQ = query(collection(db, "orders"), where("tenantId", "==", tenantId));
    const pendingQ = query(collection(db, "orders"), where("tenantId", "==", tenantId), where("status", "==", "pending"));
    const processingQ = query(collection(db, "orders"), where("tenantId", "==", tenantId), where("status", "==", "processing"));
    const completedQ = query(collection(db, "orders"), where("tenantId", "==", tenantId), where("status", "==", "delivered"));
    const cancelledQ = query(collection(db, "orders"), where("tenantId", "==", tenantId), where("status", "==", "cancelled"));
    
    const [allSnap, pendingSnap, processingSnap, completedSnap, cancelledSnap] = await Promise.all([
      getDocs(allQ),
      getDocs(pendingQ),
      getDocs(processingQ),
      getDocs(completedQ),
      getDocs(cancelledQ)
    ]);
    
    return {
      all: allSnap.size,
      pending: pendingSnap.size,
      processing: processingSnap.size,
      completed: completedSnap.size,
      cancelled: cancelledSnap.size
    };
  },

  async getOrdersByCustomerId(user: User, customerId: string): Promise<Order[]> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "orders"), where("tenantId", "==", tenantId), where("customerId", "==", customerId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
  }
};

export const messageService = {
  async createConversation(user: User, customerId: string, customerName: string, customerPhone: string): Promise<Conversation> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "conversations"));
    const conversationData: Conversation = {
      id: docRef.id,
      tenantId,
      customerId,
      customerName,
      customerPhone,
      unreadCount: 0,
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, conversationData);
    return conversationData;
  },

  async getConversations(user: User): Promise<Conversation[]> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "conversations"), where("tenantId", "==", tenantId), where("status", "==", "active"), orderBy("lastMessageTime", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Conversation[];
  },

  async updateConversation(user: User, conversationId: string, data: Partial<Conversation>): Promise<void> {
    await setDoc(doc(db, "conversations", conversationId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

  async getOrCreateConversation(user: User, customerId: string, customerName: string, customerPhone: string): Promise<Conversation> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "conversations"), where("tenantId", "==", tenantId), where("customerId", "==", customerId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as Conversation;
    }
    return await messageService.createConversation(user, customerId, customerName, customerPhone);
  },

  async sendMessage(user: User, conversationId: string, text: string, sender: "customer" | "business"): Promise<Message> {
    const tenantId = getTenantId(user);
    const docRef = await addDoc(collection(db, "messages"), {
      tenantId,
      conversationId,
      sender,
      text,
      status: "sent",
      createdAt: serverTimestamp(),
    });
    
    await messageService.updateConversation(user, conversationId, {
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
      unreadCount: sender === "customer" ? 1 : 0,
    });

    return {
      id: docRef.id,
      tenantId,
      conversationId,
      sender,
      text,
      status: "sent",
      createdAt: serverTimestamp(),
    };
  },

  async getMessages(user: User, conversationId: string): Promise<Message[]> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "messages"), where("tenantId", "==", tenantId), where("conversationId", "==", conversationId), orderBy("createdAt", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
  },

  async markAsRead(user: User, conversationId: string): Promise<void> {
    await messageService.updateConversation(user, conversationId, { unreadCount: 0 });
  },

  async archiveConversation(user: User, conversationId: string): Promise<void> {
    await messageService.updateConversation(user, conversationId, { status: "archived" });
  },
};

export interface AITemplate {
  id: string;
  tenantId: string;
  name: string;
  trigger: string;
  category: string;
  response: string;
  usage: number;
  success: number;
  createdAt: any;
  updatedAt: any;
}

export interface AutomationRule {
  id: string;
  tenantId: string;
  name: string;
  trigger: string;
  action: string;
  type: "Auto" | "Smart" | "Trigger";
  status: "active" | "paused";
  createdAt: any;
  updatedAt: any;
}

export interface AISettings {
  id: string;
  tenantId: string;
  autoReply: boolean;
  learnFromConversations: boolean;
  escalateToHuman: boolean;
  responseTone: string;
  maxResponseLength: number;
  updatedAt: any;
}

export const aiService = {
  async createTemplate(user: User, template: Omit<AITemplate, "id" | "tenantId" | "createdAt" | "updatedAt" | "usage" | "success">): Promise<AITemplate> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "ai_templates"));
    const templateData: AITemplate = {
      ...template,
      id: docRef.id,
      tenantId,
      usage: 0,
      success: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, templateData);
    return templateData;
  },

  async getTemplates(user: User): Promise<AITemplate[]> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "ai_templates"), where("tenantId", "==", tenantId), orderBy("usage", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AITemplate[];
  },

  async updateTemplate(user: User, templateId: string, data: Partial<AITemplate>): Promise<void> {
    await setDoc(doc(db, "ai_templates", templateId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteTemplate(user: User, templateId: string): Promise<void> {
    await deleteDoc(doc(db, "ai_templates", templateId));
  },

  async createAutomationRule(user: User, rule: Omit<AutomationRule, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<AutomationRule> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "automation_rules"));
    const ruleData: AutomationRule = {
      ...rule,
      id: docRef.id,
      tenantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, ruleData);
    return ruleData;
  },

  async getAutomationRules(user: User): Promise<AutomationRule[]> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "automation_rules"), where("tenantId", "==", tenantId));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AutomationRule[];
  },

  async updateAutomationRule(user: User, ruleId: string, data: Partial<AutomationRule>): Promise<void> {
    await setDoc(doc(db, "automation_rules", ruleId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteAutomationRule(user: User, ruleId: string): Promise<void> {
    await deleteDoc(doc(db, "automation_rules", ruleId));
  },

  async getOrCreateSettings(user: User): Promise<AISettings> {
    const tenantId = getTenantId(user);
    const snap = await getDoc(doc(db, "ai_settings", tenantId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as AISettings;
    }
    const defaultSettings: AISettings = {
      id: tenantId,
      tenantId,
      autoReply: true,
      learnFromConversations: true,
      escalateToHuman: false,
      responseTone: "Friendly & Professional",
      maxResponseLength: 150,
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, "ai_settings", tenantId), defaultSettings);
    return defaultSettings;
  },

  async updateSettings(user: User, data: Partial<AISettings>): Promise<void> {
    const tenantId = getTenantId(user);
    await setDoc(doc(db, "ai_settings", tenantId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },
};

export interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  avgOrderValue: number;
  conversionRate: number;
  aiResponseRate: number;
  topProducts: { productId: string; name: string; sold: number; revenue: number; price: number }[];
  categoryBreakdown: { category: string; value: number; count: number }[];
  dailyStats: { date: string; orders: number; revenue: number; customers: number; conversion: number; ai: number }[];
}

export interface TenantSettings {
  id: string;
  tenantId: string;
  businessName: string;
  businessDescription: string;
  businessCategory: string;
  businessAddress: string;
  businessRegNumber: string;
  currency: string;
  taxRate: number;
  whatsAppNumber: string;
  welcomeMessage: string;
  autoAcceptOrders: boolean;
  inventoryTracking: boolean;
  autoReply: boolean;
  smartOrderDetection: boolean;
  orderConfirmations: boolean;
  evolutionApiUrl: string;
  evolutionApiKey: string;
  whatsappInstanceId: string;
  whatsappConnectionStatus: string;
  notifications: {
    newOrders: { push: boolean; email: boolean; sms: boolean; wa: boolean };
    lowStock: { push: boolean; email: boolean; sms: boolean; wa: boolean };
    newMessages: { push: boolean; email: boolean; sms: boolean; wa: boolean };
    dailySummary: { push: boolean; email: boolean; sms: boolean; wa: boolean };
    securityAlerts: { push: boolean; email: boolean; sms: boolean; wa: boolean };
  };
  updatedAt: any;
}

export const analyticsService = {
  async getAnalyticsData(user: User, period: string = "week"): Promise<AnalyticsData> {
    const tenantId = getTenantId(user);
    
    const [ordersSnap, productsSnap, customersSnap, conversationsSnap] = await Promise.all([
      getDocs(query(collection(db, "orders"), where("tenantId", "==", tenantId))),
      getDocs(query(collection(db, "products"), where("tenantId", "==", tenantId))),
      getDocs(query(collection(db, "customers"), where("tenantId", "==", tenantId))),
      getDocs(query(collection(db, "conversations"), where("tenantId", "==", tenantId))),
    ]);

    const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[];
    const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[];
    const customers = customersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Customer[];

    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = orders.length;
    const totalCustomers = customers.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const conversionRate = totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0;
    
    const productSales: Record<string, { name: string; sold: number; revenue: number; price: number }> = {};
    orders.forEach(order => {
      order.products?.forEach(p => {
        if (!productSales[p.productId]) {
          productSales[p.productId] = { name: p.name, sold: 0, revenue: 0, price: p.price };
        }
        productSales[p.productId].sold += p.quantity;
        productSales[p.productId].revenue += p.price * p.quantity;
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({ productId: id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const categoryBreakdown: Record<string, { count: number; value: number }> = {};
    products.forEach(p => {
      const cat = p.category || "Uncategorized";
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { count: 0, value: 0 };
      }
      categoryBreakdown[cat].count += 1;
      categoryBreakdown[cat].value += p.price;
    });

    const categoryResult = Object.entries(categoryBreakdown)
      .map(([category, data]) => ({ category, ...data, value: Math.round((data.value / products.length) * 100) || 0 }))
      .sort((a, b) => b.value - a.value);

    const dailyStats = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const dayOrders = orders.filter(o => {
        const oDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date();
        return oDate.toDateString() === date.toDateString();
      });
      return {
        date: dateStr,
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
        customers: dayOrders.length,
        conversion: Math.round((dayOrders.length / (dayOrders.length || 1)) * 100),
        ai: 94,
      };
    });

    return {
      totalRevenue,
      totalOrders,
      totalCustomers,
      avgOrderValue,
      conversionRate,
      aiResponseRate: 94.2,
      topProducts,
      categoryBreakdown: categoryResult,
      dailyStats,
    };
  },
};

export const settingsService = {
  async getSettings(user: User): Promise<TenantSettings> {
    const tenantId = getTenantId(user);
    const snap = await getDoc(doc(db, "settings", tenantId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as TenantSettings;
    }
    const defaultSettings: TenantSettings = {
      id: tenantId,
      tenantId,
      businessName: "Chap Chap Store",
      businessDescription: "Premium quality products delivered fast via WhatsApp.",
      businessCategory: "Retail & E-commerce",
      businessAddress: "123 Kimathi Street, Nairobi CBD, Kenya",
      businessRegNumber: "BN/2024/123456",
      currency: "KES (Kenyan Shilling)",
      taxRate: 16,
      whatsAppNumber: "+254 712 345 678",
      welcomeMessage: `Hello! 👋 Welcome to {{business_name}}. 

I'm your AI assistant. I can help you:
• Browse our products
• Place an order
• Track your delivery
• Answer your questions

How can I assist you today?`,
      autoAcceptOrders: true,
      inventoryTracking: true,
      autoReply: true,
      smartOrderDetection: true,
      orderConfirmations: true,
      evolutionApiUrl: "",
      evolutionApiKey: "",
      whatsappInstanceId: "",
      whatsappConnectionStatus: "disconnected",
      notifications: {
        newOrders: { push: true, email: true, sms: false, wa: true },
        lowStock: { push: true, email: true, sms: false, wa: false },
        newMessages: { push: true, email: false, sms: false, wa: true },
        dailySummary: { push: false, email: true, sms: false, wa: false },
        securityAlerts: { push: true, email: true, sms: true, wa: false },
      },
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, "settings", tenantId), defaultSettings);
    return defaultSettings;
  },

  async updateSettings(user: User, data: Partial<TenantSettings>): Promise<void> {
    const tenantId = getTenantId(user);
    await setDoc(doc(db, "settings", tenantId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },
};

export const supplierService = {
  async createSupplier(user: User, supplier: Omit<Supplier, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<Supplier> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "suppliers"));
    const supplierData: Supplier = {
      ...supplier,
      id: docRef.id,
      tenantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, supplierData);
    return supplierData;
  },

  async getSuppliers(user: User): Promise<Supplier[]> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "suppliers"), where("tenantId", "==", tenantId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Supplier[];
  },

  async updateSupplier(user: User, supplierId: string, data: Partial<Supplier>): Promise<void> {
    await setDoc(doc(db, "suppliers", supplierId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteSupplier(user: User, supplierId: string): Promise<void> {
    await deleteDoc(doc(db, "suppliers", supplierId));
  },
};

export const shippingService = {
  async createShippingMethod(user: User, method: Omit<ShippingMethod, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<ShippingMethod> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "shippingMethods"));
    const methodData: ShippingMethod = {
      ...method,
      id: docRef.id,
      tenantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, methodData);
    return methodData;
  },

  async getShippingMethods(user: User): Promise<ShippingMethod[]> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "shippingMethods"), where("tenantId", "==", tenantId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ShippingMethod[];
  },

  async updateShippingMethod(user: User, methodId: string, data: Partial<ShippingMethod>): Promise<void> {
    await setDoc(doc(db, "shippingMethods", methodId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteShippingMethod(user: User, methodId: string): Promise<void> {
    await deleteDoc(doc(db, "shippingMethods", methodId));
  },

  async createShipment(user: User, shipment: Omit<Shipment, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<Shipment> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "shipments"));
    const shipmentData: Shipment = {
      ...shipment,
      id: docRef.id,
      tenantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, shipmentData);
    return shipmentData;
  },

  async getShipments(user: User): Promise<Shipment[]> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "shipments"), where("tenantId", "==", tenantId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Shipment[];
  },

  async updateShipment(user: User, shipmentId: string, data: Partial<Shipment>): Promise<void> {
    await setDoc(doc(db, "shipments", shipmentId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },
};

export const inventoryService = {
  async logInventoryChange(user: User, log: Omit<InventoryLog, "id" | "tenantId" | "createdAt">): Promise<InventoryLog> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "inventoryLogs"));
    const logData: InventoryLog = {
      ...log,
      id: docRef.id,
      tenantId,
      createdAt: serverTimestamp(),
    };
    await setDoc(docRef, logData);
    return logData;
  },

  async getInventoryLogs(user: User, productId?: string): Promise<InventoryLog[]> {
    const tenantId = getTenantId(user);
    let q;
    if (productId) {
      q = query(collection(db, "inventoryLogs"), where("tenantId", "==", tenantId), where("productId", "==", productId), orderBy("createdAt", "desc"));
    } else {
      q = query(collection(db, "inventoryLogs"), where("tenantId", "==", tenantId), orderBy("createdAt", "desc"));
    }
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as InventoryLog[];
  },
};

export const reviewService = {
  async createReview(user: User, review: Omit<Review, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<Review> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "reviews"));
    const reviewData: Review = {
      ...review,
      id: docRef.id,
      tenantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, reviewData);
    return reviewData;
  },

  async getReviews(user: User): Promise<Review[]> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "reviews"), where("tenantId", "==", tenantId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Review[];
  },

  async updateReview(user: User, reviewId: string, data: Partial<Review>): Promise<void> {
    await setDoc(doc(db, "reviews", reviewId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteReview(user: User, reviewId: string): Promise<void> {
    await deleteDoc(doc(db, "reviews", reviewId));
  },
};

export const campaignService = {
  async createCampaign(user: User, campaign: Omit<Campaign, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<Campaign> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "campaigns"));
    const campaignData: Campaign = {
      ...campaign,
      id: docRef.id,
      tenantId,
      recipientCount: 0,
      deliveredCount: 0,
      responseCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, campaignData);
    return campaignData;
  },

  async getCampaigns(user: User): Promise<Campaign[]> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "campaigns"), where("tenantId", "==", tenantId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Campaign[];
  },

  async updateCampaign(user: User, campaignId: string, data: Partial<Campaign>): Promise<void> {
    await setDoc(doc(db, "campaigns", campaignId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteCampaign(user: User, campaignId: string): Promise<void> {
    await deleteDoc(doc(db, "campaigns", campaignId));
  },
};

export const expenseService = {
  async createExpense(user: User, expense: Omit<Expense, "id" | "tenantId" | "createdAt">): Promise<Expense> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "expenses"));
    const expenseData: Expense = {
      ...expense,
      id: docRef.id,
      tenantId,
      createdAt: serverTimestamp(),
    };
    await setDoc(docRef, expenseData);
    return expenseData;
  },

  async getExpenses(user: User, startDate?: Date, endDate?: Date): Promise<Expense[]> {
    const tenantId = getTenantId(user);
    let q = query(collection(db, "expenses"), where("tenantId", "==", tenantId), orderBy("date", "desc"));
    
    if (startDate && endDate) {
      // Note: Firestore doesn't support date range queries with orderBy on different fields easily
      // This is a simplified version
    }
    
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];
  },

  async updateExpense(user: User, expenseId: string, data: Partial<Expense>): Promise<void> {
    await setDoc(doc(db, "expenses", expenseId), data, { merge: true });
  },

  async deleteExpense(user: User, expenseId: string): Promise<void> {
    await deleteDoc(doc(db, "expenses", expenseId));
  },
};
