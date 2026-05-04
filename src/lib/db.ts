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
  addDoc,
  updateDoc
} from "firebase/firestore";
import { User } from "firebase/auth";

const getTenantId = (user: User): string => `tenant_${user.uid}`;

export interface Tenant {
  id: string;
  userId: string;
  name: string;
  email: string;
  businessName: string;
  phone?: string;
  plan: "free" | "starter" | "pro" | "enterprise";
  evolutionServerUrl?: string;
  evolutionInstanceId?: string;
  evolutionApiUrl?: string;
  evolutionApiKey?: string;
  evolutionUUID?: string;
  whatsappInstanceId?: string;
  whatsappConnectionStatus?: string;
  shippingMethods?: Array<{ id: string; name: string; price: number }>;
  createdAt: any;
  updatedAt: any;
}

export interface BusinessProfile {
  id: string;
  tenantId: string;
  businessName: string;
  tagline?: string;
  description?: string;
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    tiktok?: string;
  };
  businessHours?: {
    monday?: { open: string; close: string; closed: boolean };
    tuesday?: { open: string; close: string; closed: boolean };
    wednesday?: { open: string; close: string; closed: boolean };
    thursday?: { open: string; close: string; closed: boolean };
    friday?: { open: string; close: string; closed: boolean };
    saturday?: { open: string; close: string; closed: boolean };
    sunday?: { open: string; close: string; closed: boolean };
  };
  paymentMethods?: {
    mpesa?: {
      enabled: boolean;
      // Three separate M-Pesa payment types
      buyGoods?: {
        enabled: boolean;
        businessName?: string;
        tillNumber?: string;
      };
      paybill?: {
        enabled: boolean;
        businessName?: string;
        paybillNumber?: string;
        accountNumber?: string;
      };
      personal?: {
        enabled: boolean;
        phoneNumber?: string;
        accountName?: string;
      };
    };
    bank?: {
      enabled: boolean;
      bankName?: string;
      accountName?: string;
      accountNumber?: string;
      branch?: string;
      swiftCode?: string;
    };
    card?: {
      enabled: boolean;
      provider?: 'stripe' | 'paypal' | 'other';
      instructions?: string; // Custom payment instructions
    };
    cash?: {
      enabled: boolean;
      instructions?: string; // e.g., "Pay on delivery"
    };
  };
  category?: string;
  taxId?: string;
  registrationNumber?: string;
  createdAt: any;
  updatedAt: any;
}

export interface WhatsAppSettings {
  id: string;
  tenantId: string;
  businessName?: string;
  welcomeMessageEnabled: boolean;
  welcomeMessage: string;
  autoReplyEnabled: boolean;
  autoReplyMessage: string;
  awayMessageEnabled: boolean;
  awayMessage: string;
  awaySchedule?: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    days: string[];
  };
  quickReplies?: Array<{
    id: string;
    keyword: string;
    message: string;
  }>;
  createdAt: any;
  updatedAt: any;
}

export interface ProductSettings {
  id: string;
  tenantId: string;
  enabled: boolean;
  storeDescription?: string;
  returnPolicy?: string;
  warrantyInfo?: string;
  createdAt: any;
  updatedAt: any;
}

export interface ServiceSettings {
  id: string;
  tenantId: string;
  enabled: boolean;
  serviceDescription?: string;
  bookingPolicy?: string;
  cancellationPolicy?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  emoji: string;
  bgGradient: string;
  duration: string;
  location: string;
  tags: string[];
  priceMin: number;
  priceMax: number;
  businessType: string;
  businessCategory?: string; // Human-readable business category name (e.g., "Beauty & Hair", "Home Services")
  serviceName?: string; // Human-readable service name (e.g., "Hair Braiding", "Massage")
  specifications: any;
  tier: string;
  mode: string;
  selectedDuration: number;
  bookings?: number;
  views?: number;
  status?: "active" | "paused" | "draft";
  rating?: number;
  imageUrl?: string;
  portfolioImages?: string[];
  bookingUrl?: string;
  
  // NEW FIELDS
  providerName?: string; // Business/Provider name
  packagePrices?: { // Individual prices for each package tier
    basic?: number;
    standard?: number;
    premium?: number;
  };
  packageFeatures?: { // Custom features for each package
    basic: string[];
    standard: string[];
    premium: string[];
  };
  availability?: { // Available days and times
    days: string[]; // ['Mon', 'Tue', etc.]
    timeSlots: string[]; // ['9:00 AM', '10:00 AM', etc.]
  };
  customTimeSlots?: string[]; // Custom time slots based on service duration
  createdAt: any;
  updatedAt: any;
}

export interface Booking {
  id: string;
  tenantId: string;
  client: string;
  clientInitials: string;
  phone: string;
  email?: string; // Client email address
  service: string;
  serviceId?: string;
  packageTier?: 'basic' | 'standard' | 'premium'; // Package tier booked
  date: string;
  time: string;
  duration: string;
  location: string;
  price: number;
  status: "confirmed" | "pending" | "completed" | "cancelled";
  verified: boolean;
  notes?: string;
  specialRequests?: string; // Special requirements separate from notes
  deposit?: number;
  balance?: number;
  paymentMethod?: "cash" | "mpesa" | "card" | "bank";
  paymentStatus?: "unpaid" | "partial" | "paid";
  paymentProof?: { // Payment confirmation details
    method: string;
    transactionId?: string;
    amount: number;
    paidAt?: any;
    confirmedBy?: string; // Staff who confirmed
    confirmedAt?: any;
    proofImage?: string; // Screenshot URL
    notes?: string;
  };
  source?: 'manual' | 'online' | 'whatsapp' | 'phone'; // How booking was made
  assignedTo?: string; // Staff/provider assigned
  reminderSent?: boolean; // Whether reminder was sent
  reminderSentAt?: any; // When reminder was sent
  cancellationReason?: string; // Reason if cancelled
  rescheduleCount?: number; // Number of times rescheduled
  originalDate?: string; // Original date if rescheduled
  createdAt: any;
  updatedAt: any;
}

export interface Client {
  id: string;
  tenantId: string;
  name: string;
  initials: string;
  phone: string;
  email?: string;
  location?: string;
  preferredStyle?: string;
  status: "active" | "new" | "vip" | "inactive";
  verified: boolean;
  visits: number;
  totalSpent: number;
  rating: number;
  services: string[];
  lastVisit?: string;
  firstVisit?: string;
  avgGap?: string;
  favoriteService?: string;
  referrals?: number;
  notes?: string;
  avatarGradient?: string;
  avatarText?: string;
  createdAt: any;
  updatedAt: any;
}

// Alias for backward compatibility
export type Customer = Client;

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  price: number;
  salePrice?: number; // Sale/discounted price
  costPrice?: number; // Cost price for profit calculation
  category?: string;
  categoryName?: string; // Human-readable category name (e.g., "Dresses", "Smartphones")
  brand?: string;
  condition?: string; // Product condition (new, used, refurbished)
  
  // New hybrid structure fields
  categoryId?: string; // Reference to productCategories collection
  subcategoryId?: string | null; // Subcategory within the main category
  brandId?: string | null; // Reference to brand within category
  
  imageUrl?: string;
  image?: string; // For backward compatibility
  images?: string[]; // Array of product images
  stock?: number;
  lowStockAlert?: number; // Low stock alert threshold
  filters?: {
    colors?: string[];
    sizes?: string[];
    brands?: string[];
    [key: string]: any;
  };
  sku?: string; // Stock keeping unit
  barcode?: string; // Barcode/ISBN
  taxEnabled?: boolean; // Tax enabled flag
  taxRate?: number; // Tax rate percentage
  warranty?: string; // Warranty information
  weight?: number; // Product weight
  weightUnit?: string; // Weight unit (kg, lbs, etc)
  dimensions?: { // Product dimensions
    length?: number;
    width?: number;
    height?: number;
  };
  status?: "active" | "paused" | "draft";
  views?: number;
  orders?: number;
  rating?: number;
  orderLink?: string; // Order link for WhatsApp ordering
  
  // Shipping Methods - only enabled ones are saved
  shippingMethods?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  
  // Payment Methods - only enabled ones are saved
  paymentMethods?: Array<{
    id: string;
    name: string;
    details: string;
  }>;
  
  // Product Variants
  variants?: Array<{
    id: string;
    specs: Record<string, string>; // e.g., { size: "M", color: "Black" }
    sku: string;
    price: number;
    stock: number;
  }>;
  
  createdAt: any;
  updatedAt: any;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";

export interface Order {
  id: string;
  tenantId: string;
  orderNumber?: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  whatsappJid?: string; // WhatsApp JID for verified sender (e.g., "254712345678@s.whatsapp.net")
  customerEmail?: string;
  customerAddress?: string;
  deliveryAddress?: string;
  products?: OrderItem[];
  productName?: string; // For legacy orders
  quantity?: number; // For legacy orders
  basePrice?: number; // For legacy orders
  productImage?: string; // For legacy orders
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod?: string;
  paymentDetails?: string;
  paymentProof?: { // Payment confirmation details
    method: string;
    transactionId?: string;
    amount: number;
    paidAt?: any;
    confirmedBy?: string; // Staff who confirmed
    confirmedAt?: any;
    proofImage?: string; // Screenshot URL
    notes?: string;
  };
  deliveryMethod?: string;
  deliveryCost?: number;
  status: OrderStatus;
  notes?: string;
  orderNotes?: string;
  selectedSpecs?: Record<string, string>;
  createdAt: any;
  updatedAt: any;
}

export interface ShippingMethod {
  id: string;
  tenantId: string;
  name: string;
  price: number;
  estimatedDays?: string;
  description?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Shipment {
  id: string;
  tenantId: string;
  orderId?: string;
  orderNumber?: string;
  customerName?: string;
  customerPhone?: string;
  shippingAddress?: string;
  trackingNumber?: string;
  carrier?: string;
  shippingMethod?: string;
  status: "pending" | "shipped" | "in_transit" | "delivered" | "returned" | "cancelled";
  statusHistory?: Record<string, string>;
  shippedAt?: any;
  deliveredAt?: any;
  estimatedDelivery?: any;
  weight?: number;
  cost?: number;
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface InventoryLog {
  id: string;
  tenantId: string;
  productId: string;
  productName: string;
  change: number;
  reason: string;
  previousStock: number;
  newStock: number;
  createdAt: any;
}

export interface Review {
  id: string;
  tenantId: string;
  customerId?: string;
  customerName: string;
  rating: number;
  comment?: string;
  serviceName?: string;
  serviceId?: string;
  verified: boolean;
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
  category?: string;
  products?: string[];
  paymentTerms?: string;
  rating?: number;
  totalOrders?: number;
  totalSpent?: number;
  status?: "active" | "inactive" | "pending";
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Campaign {
  id: string;
  tenantId: string;
  name: string;
  message: string;
  recipientCount: number;
  deliveredCount: number;
  responseCount: number;
  status: "draft" | "scheduled" | "sent" | "failed";
  type?: string; // Optional field for campaign type (broadcast, automated, promo)
  segment?: string; // Optional field for audience segment
  scheduledAt?: any;
  sentAt?: any;
  createdAt: any;
  updatedAt: any;
}

export interface Expense {
  id: string;
  tenantId: string;
  category: string;
  amount: number;
  description?: string;
  date: string;
  receiptUrl?: string;
  createdAt: any;
}

export interface ProductCategory {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  subcategories: string[];
  brands: string[];
  icon?: string;
  color?: string;
  createdAt: any;
  updatedAt: any;
}

// New hybrid structure category interface (for productCategories collection)
export interface ProductCategoryHierarchy {
  id: string;
  name: string;
  description: string;
  subcategories: string[];
  brands: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isBooked?: boolean;
  bookingId?: string;
}

export interface DaySchedule {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  dayName: string;
  enabled: boolean;
  slots: TimeSlot[];
  date?: string; // For specific dates
}

export interface TimeOff {
  id: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  type: "vacation" | "sick" | "holiday" | "personal";
  createdAt: any;
}

export interface SpecialHours {
  id: string;
  tenantId: string;
  date: string;
  slots: TimeSlot[];
  reason?: string;
  overrideRegularSchedule: boolean;
  createdAt: any;
}

export interface AvailabilitySettings {
  id: string;
  tenantId: string;
  acceptingBookings: boolean;
  appointmentDuration: number; // in minutes
  bufferTime: number; // in minutes
  advanceBookingDays: number;
  cancellationPolicyHours: number;
  activeLocations: string[];
  timezone: string;
  weeklySchedule: DaySchedule[];
  createdAt: any;
  updatedAt: any;
}

export interface PortfolioItem {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  imageUrl: string;
  category: "gallery" | "before-after" | "video";
  clientId?: string;
  clientName?: string;
  serviceName?: string;
  tags?: string[];
  featured?: boolean;
  views?: number;
  likes?: number;
  beforeImageUrl?: string; // For before/after comparisons
  afterImageUrl?: string; // For before/after comparisons
  videoUrl?: string; // For videos
  videoDuration?: string; // For videos
  videoType?: "Tutorial" | "Time-lapse" | "Review" | "Behind Scenes"; // For videos
  createdAt: any;
  updatedAt: any;
}

export interface Certification {
  id: string;
  tenantId: string;
  title: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  certificateUrl?: string;
  verified: boolean;
  icon?: string;
  createdAt: any;
  updatedAt: any;
}

export const bookingService = {
  async createBooking(user: User, booking: Omit<Booking, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<Booking> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "bookings"));

    const bookingData: Booking = {
      ...booking,
      id: docRef.id,
      tenantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, bookingData);
    return bookingData;
  },

  async getBookings(user: User, statusFilter?: string): Promise<Booking[]> {
    const tenantId = getTenantId(user);
    let q = query(collection(db, "bookings"), where("tenantId", "==", tenantId), orderBy("createdAt", "desc"));
    if (statusFilter) {
      q = query(collection(db, "bookings"), where("tenantId", "==", tenantId), where("status", "==", statusFilter), orderBy("createdAt", "desc"));
    }
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Booking[];
  },

  async getBookingById(user: User, bookingId: string): Promise<Booking | null> {
    const tenantId = getTenantId(user);
    const snap = await getDoc(doc(db, "bookings", bookingId));
    if (!snap.exists()) return null;
    const data = { id: snap.id, ...snap.data() } as Booking;
    if (data.tenantId !== tenantId) return null;
    return data;
  },

  async updateBooking(user: User, bookingId: string, data: Partial<Booking>): Promise<void> {
    const tenantId = getTenantId(user);
    const bookingDoc = await getDoc(doc(db, "bookings", bookingId));
    if (!bookingDoc.exists()) throw new Error("Booking not found");
    const existing = bookingDoc.data() as Booking;
    if (existing.tenantId !== tenantId) throw new Error("Unauthorized");

    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined && value !== "" && value !== null)
    );

    await setDoc(doc(db, "bookings", bookingId), { ...cleanData, updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteBooking(user: User, bookingId: string): Promise<void> {
    const tenantId = getTenantId(user);
    const bookingDoc = await getDoc(doc(db, "bookings", bookingId));
    if (!bookingDoc.exists()) throw new Error("Booking not found");
    const existing = bookingDoc.data() as Booking;
    if (existing.tenantId !== tenantId) throw new Error("Unauthorized");

    await deleteDoc(doc(db, "bookings", bookingId));
  },

  async updateBookingStats(user: User, serviceId: string, increment: number): Promise<void> {
    const tenantId = getTenantId(user);
    const serviceDoc = await getDoc(doc(db, "services", serviceId));
    if (!serviceDoc.exists()) throw new Error("Service not found");
    const existing = serviceDoc.data() as Service;
    if (existing.tenantId !== tenantId) throw new Error("Unauthorized");

    const currentBookings = existing.bookings || 0;
    await setDoc(doc(db, "services", serviceId), { bookings: currentBookings + increment, updatedAt: serverTimestamp() }, { merge: true });
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
    console.log('🔍 getShippingMethods - Querying for tenantId:', tenantId);
    try {
      const q = query(collection(db, "shippingMethods"), where("tenantId", "==", tenantId));
      const snap = await getDocs(q);
      console.log('📦 getShippingMethods - Found', snap.docs.length, 'documents');
      const methods = snap.docs.map(doc => {
        console.log('📄 Document:', doc.id, doc.data());
        return { id: doc.id, ...doc.data() };
      }) as ShippingMethod[];
      console.log('✅ getShippingMethods - Returning methods:', methods);
      // Sort by createdAt client-side to avoid index issues
      return methods.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime; // Newest first
      });
    } catch (error) {
      console.error("❌ Error loading shipping methods:", error);
      return [];
    }
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
    let finalData = { ...data, updatedAt: serverTimestamp() };
    
    // If status is being updated, also update statusHistory
    if (data.status) {
      const shipmentDoc = await getDoc(doc(db, "shipments", shipmentId));
      const existingShipment = shipmentDoc.exists() ? shipmentDoc.data() : null;
      const existingHistory = existingShipment?.statusHistory || {};
      
      finalData = {
        ...finalData,
        statusHistory: {
          ...existingHistory,
          [data.status]: new Date().toISOString()
        }
      };
    }
    
    await setDoc(doc(db, "shipments", shipmentId), finalData, { merge: true });
  },

  async deleteShipment(user: User, shipmentId: string): Promise<void> {
    await deleteDoc(doc(db, "shipments", shipmentId));
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

  async getSuppliers(user: User, statusFilter?: string): Promise<Supplier[]> {
    const tenantId = getTenantId(user);
    let q = query(collection(db, "suppliers"), where("tenantId", "==", tenantId));
    
    if (statusFilter && statusFilter !== 'all') {
      q = query(q, where("status", "==", statusFilter));
    }
    
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Supplier);
  },

  async getSupplierById(user: User, supplierId: string): Promise<Supplier | null> {
    const docSnap = await getDoc(doc(db, "suppliers", supplierId));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Supplier;
  },

  async updateSupplier(user: User, supplierId: string, data: Partial<Supplier>): Promise<void> {
    await setDoc(doc(db, "suppliers", supplierId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteSupplier(user: User, supplierId: string): Promise<void> {
    await deleteDoc(doc(db, "suppliers", supplierId));
  },
};

export const categoryService = {
  async createCategory(user: User, category: Omit<ProductCategory, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<ProductCategory> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "productCategories"));
    const categoryData: ProductCategory = {
      ...category,
      id: docRef.id,
      tenantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, categoryData);
    return categoryData;
  },

  async getCategories(user: User): Promise<ProductCategory[]> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "productCategories"), where("tenantId", "==", tenantId), orderBy("name", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProductCategory[];
  },

  async updateCategory(user: User, categoryId: string, data: Partial<ProductCategory>): Promise<void> {
    await setDoc(doc(db, "productCategories", categoryId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteCategory(user: User, categoryId: string): Promise<void> {
    await deleteDoc(doc(db, "productCategories", categoryId));
  },
};

export const serviceService = {
  async createService(user: User, service: Omit<Service, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<Service> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "services"));
    
    // Clean service data - remove undefined values (Firebase doesn't allow undefined)
    const cleanService = Object.fromEntries(
      Object.entries(service).filter(([_, value]) => value !== undefined)
    ) as Omit<Service, "id" | "tenantId" | "createdAt" | "updatedAt">;
    
    const serviceData: Service = {
      ...cleanService,
      id: docRef.id,
      tenantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, serviceData);
    
    // Save service category to serviceCategoryNames collection for AI (hierarchical structure)
    if (service.serviceName && service.businessType && service.businessCategory) {
      await this.saveServiceCategoryName(user, service.businessType, service.businessCategory, service.serviceName);
    }
    
    return serviceData;
  },

  // Save unique service category name for AI to fetch (hierarchical structure)
  async saveServiceCategoryName(user: User, businessType: string, businessCategory: string, serviceName: string): Promise<void> {
    const tenantId = getTenantId(user);
    
    // Check if main business category exists for this tenant
    const categoryQuery = query(
      collection(db, "serviceCategoryNames"),
      where("tenantId", "==", tenantId),
      where("businessType", "==", businessType)
    );
    const categorySnap = await getDocs(categoryQuery);
    
    if (categorySnap.empty) {
      // Create new main business category with first service name
      const categoryDoc = doc(collection(db, "serviceCategoryNames"));
      await setDoc(categoryDoc, {
        id: categoryDoc.id,
        tenantId,
        businessType: businessType, // e.g., "beauty", "home"
        businessCategory: businessCategory, // e.g., "Beauty & Hair", "Home Services"
        serviceNames: [serviceName], // e.g., ["Hair Braiding"]
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // Main category exists, check if service name already exists
      const existingDoc = categorySnap.docs[0];
      const existingData = existingDoc.data();
      const existingServiceNames = existingData.serviceNames || [];
      
      if (!existingServiceNames.includes(serviceName)) {
        // Add new service name to existing main category
        await updateDoc(doc(db, "serviceCategoryNames", existingDoc.id), {
          serviceNames: [...existingServiceNames, serviceName],
          updatedAt: serverTimestamp(),
        });
      }
    }
  },

  // Get all service category names for AI (hierarchical structure)
  async getServiceCategoryNames(user: User): Promise<Array<{businessType: string, businessCategory: string, serviceNames: string[]}>> {
    const tenantId = getTenantId(user);
    const q = query(
      collection(db, "serviceCategoryNames"),
      where("tenantId", "==", tenantId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => {
      const data = doc.data();
      return {
        businessType: data.businessType,
        businessCategory: data.businessCategory,
        serviceNames: data.serviceNames || [],
      };
    });
  },

  async getServices(user: User): Promise<Service[]> {
    const tenantId = getTenantId(user);
    console.log("Fetching services for tenantId:", tenantId);
    const q = query(collection(db, "services"), where("tenantId", "==", tenantId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    console.log("Firestore snapshot size:", snap.size);
    const services = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Service[];
    console.log("Mapped services:", services.length);
    return services;
  },

  async updateService(user: User, serviceId: string, data: Partial<Service>): Promise<void> {
    await setDoc(doc(db, "services", serviceId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteService(user: User, serviceId: string): Promise<void> {
    await deleteDoc(doc(db, "services", serviceId));
  },

  async updateServiceStats(user: User, serviceId: string, data: Partial<Service>): Promise<void> {
    await setDoc(doc(db, "services", serviceId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },
};

export const clientService = {
  async createClient(user: User, client: Omit<Client, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<Client> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "clients"));
    const clientData: Client = {
      ...client,
      id: docRef.id,
      tenantId,
      visits: client.visits || 0,
      totalSpent: client.totalSpent || 0,
      rating: client.rating || 0,
      referrals: client.referrals || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, clientData);
    return clientData;
  },

  async getClients(user: User, statusFilter?: string): Promise<Client[]> {
    const tenantId = getTenantId(user);
    let q = query(collection(db, "clients"), where("tenantId", "==", tenantId), orderBy("createdAt", "desc"));
    
    if (statusFilter && statusFilter !== "all") {
      q = query(collection(db, "clients"), where("tenantId", "==", tenantId), where("status", "==", statusFilter), orderBy("createdAt", "desc"));
    }
    
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Client[];
  },

  async getClientById(user: User, clientId: string): Promise<Client | null> {
    const tenantId = getTenantId(user);
    const snap = await getDoc(doc(db, "clients", clientId));
    if (!snap.exists()) return null;
    const data = { id: snap.id, ...snap.data() } as Client;
    if (data.tenantId !== tenantId) return null;
    return data;
  },

  async updateClient(user: User, clientId: string, data: Partial<Client>): Promise<void> {
    const tenantId = getTenantId(user);
    const clientDoc = await getDoc(doc(db, "clients", clientId));
    if (!clientDoc.exists()) throw new Error("Client not found");
    const existing = clientDoc.data() as Client;
    if (existing.tenantId !== tenantId) throw new Error("Unauthorized");

    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );

    await setDoc(doc(db, "clients", clientId), { ...cleanData, updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteClient(user: User, clientId: string): Promise<void> {
    const tenantId = getTenantId(user);
    const clientDoc = await getDoc(doc(db, "clients", clientId));
    if (!clientDoc.exists()) throw new Error("Client not found");
    const existing = clientDoc.data() as Client;
    if (existing.tenantId !== tenantId) throw new Error("Unauthorized");

    await deleteDoc(doc(db, "clients", clientId));
  },

  async updateClientStats(user: User, clientId: string, stats: { visits?: number; totalSpent?: number }): Promise<void> {
    const tenantId = getTenantId(user);
    const clientDoc = await getDoc(doc(db, "clients", clientId));
    if (!clientDoc.exists()) throw new Error("Client not found");
    const existing = clientDoc.data() as Client;
    if (existing.tenantId !== tenantId) throw new Error("Unauthorized");

    const updates: Partial<Client> = {};
    if (stats.visits !== undefined) {
      updates.visits = (existing.visits || 0) + stats.visits;
    }
    if (stats.totalSpent !== undefined) {
      updates.totalSpent = (existing.totalSpent || 0) + stats.totalSpent;
    }

    await setDoc(doc(db, "clients", clientId), { ...updates, updatedAt: serverTimestamp() }, { merge: true });
  },
};

// Alias for backward compatibility
export const customerService = clientService;

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

  async getOrders(user: User, statusFilter?: string): Promise<Order[]> {
    const tenantId = getTenantId(user);
    let q = query(collection(db, "orders"), where("tenantId", "==", tenantId), orderBy("createdAt", "desc"));
    
    if (statusFilter && statusFilter !== "all") {
      q = query(collection(db, "orders"), where("tenantId", "==", tenantId), where("status", "==", statusFilter), orderBy("createdAt", "desc"));
    }
    
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
  },

  async getOrderById(user: User, orderId: string): Promise<Order | null> {
    const tenantId = getTenantId(user);
    const snap = await getDoc(doc(db, "orders", orderId));
    if (!snap.exists()) return null;
    const data = { id: snap.id, ...snap.data() } as Order;
    if (data.tenantId !== tenantId) return null;
    return data;
  },

  async updateOrder(user: User, orderId: string, data: Partial<Order>): Promise<void> {
    const tenantId = getTenantId(user);
    const orderDoc = await getDoc(doc(db, "orders", orderId));
    if (!orderDoc.exists()) throw new Error("Order not found");
    const existing = orderDoc.data() as Order;
    if (existing.tenantId !== tenantId) throw new Error("Unauthorized");

    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );

    await setDoc(doc(db, "orders", orderId), { ...cleanData, updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteOrder(user: User, orderId: string): Promise<void> {
    const tenantId = getTenantId(user);
    const orderDoc = await getDoc(doc(db, "orders", orderId));
    if (!orderDoc.exists()) throw new Error("Order not found");
    const existing = orderDoc.data() as Order;
    if (existing.tenantId !== tenantId) throw new Error("Unauthorized");

    await deleteDoc(doc(db, "orders", orderId));
  },

  async getOrderCounts(user: User): Promise<{ all: number; pending: number; processing: number; completed: number; cancelled: number }> {
    const tenantId = getTenantId(user);
    
    const allQuery = query(collection(db, "orders"), where("tenantId", "==", tenantId));
    const pendingQuery = query(collection(db, "orders"), where("tenantId", "==", tenantId), where("status", "==", "pending"));
    const processingQuery = query(collection(db, "orders"), where("tenantId", "==", tenantId), where("status", "==", "processing"));
    const deliveredQuery = query(collection(db, "orders"), where("tenantId", "==", tenantId), where("status", "==", "delivered"));
    const cancelledQuery = query(collection(db, "orders"), where("tenantId", "==", tenantId), where("status", "==", "cancelled"));
    
    const [allSnap, pendingSnap, processingSnap, deliveredSnap, cancelledSnap] = await Promise.all([
      getDocs(allQuery),
      getDocs(pendingQuery),
      getDocs(processingQuery),
      getDocs(deliveredQuery),
      getDocs(cancelledQuery),
    ]);
    
    return {
      all: allSnap.size,
      pending: pendingSnap.size,
      processing: processingSnap.size,
      completed: deliveredSnap.size,
      cancelled: cancelledSnap.size,
    };
  },
};

export const productService = {
  async createProduct(user: User, product: Omit<Product, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<Product> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "products"));
    
    // Clean product data - remove undefined values (Firebase doesn't allow undefined)
    const cleanProduct = Object.fromEntries(
      Object.entries(product).filter(([_, value]) => value !== undefined)
    ) as Omit<Product, "id" | "tenantId" | "createdAt" | "updatedAt">;
    
    const productData: Product = {
      ...cleanProduct,
      id: docRef.id,
      tenantId,
      stock: product.stock || 0,
      status: product.status || "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, productData);
    
    // Save category name to categoryNames collection for AI
    if (product.categoryName && product.category) {
      await this.saveCategoryName(user, product.category, product.categoryName);
    }
    
    return productData;
  },

  // Save unique category name for AI to fetch (hierarchical structure)
  async saveCategoryName(user: User, category: string, categoryName: string): Promise<void> {
    const tenantId = getTenantId(user);
    
    // Check if main category exists for this tenant
    const categoryQuery = query(
      collection(db, "categoryNames"),
      where("tenantId", "==", tenantId),
      where("mainCategory", "==", category)
    );
    const categorySnap = await getDocs(categoryQuery);
    
    if (categorySnap.empty) {
      // Create new main category with first subcategory
      const categoryDoc = doc(collection(db, "categoryNames"));
      await setDoc(categoryDoc, {
        id: categoryDoc.id,
        tenantId,
        mainCategory: category, // e.g., "clothing", "electronics"
        mainCategoryName: category.charAt(0).toUpperCase() + category.slice(1), // e.g., "Clothing", "Electronics"
        subcategories: [categoryName], // e.g., ["Dresses"]
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // Main category exists, check if subcategory already exists
      const existingDoc = categorySnap.docs[0];
      const existingData = existingDoc.data();
      const existingSubcategories = existingData.subcategories || [];
      
      if (!existingSubcategories.includes(categoryName)) {
        // Add new subcategory to existing main category
        await updateDoc(doc(db, "categoryNames", existingDoc.id), {
          subcategories: [...existingSubcategories, categoryName],
          updatedAt: serverTimestamp(),
        });
      }
    }
  },

  // Get all category names for AI (hierarchical structure)
  async getCategoryNames(user: User): Promise<Array<{mainCategory: string, mainCategoryName: string, subcategories: string[]}>> {
    const tenantId = getTenantId(user);
    const q = query(
      collection(db, "categoryNames"),
      where("tenantId", "==", tenantId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => {
      const data = doc.data();
      return {
        mainCategory: data.mainCategory,
        mainCategoryName: data.mainCategoryName,
        subcategories: data.subcategories || [],
      };
    });
  },

  async getProducts(user: User): Promise<Product[]> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "products"), where("tenantId", "==", tenantId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
  },

  async getProductById(user: User, productId: string): Promise<Product | null> {
    const tenantId = getTenantId(user);
    const snap = await getDoc(doc(db, "products", productId));
    if (!snap.exists()) return null;
    const data = { id: snap.id, ...snap.data() } as Product;
    if (data.tenantId !== tenantId) return null;
    return data;
  },

  async updateProduct(user: User, productId: string, data: Partial<Product>): Promise<void> {
    const tenantId = getTenantId(user);
    const productDoc = await getDoc(doc(db, "products", productId));
    if (!productDoc.exists()) throw new Error("Product not found");
    const existing = productDoc.data() as Product;
    if (existing.tenantId !== tenantId) throw new Error("Unauthorized");

    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );

    await setDoc(doc(db, "products", productId), { ...cleanData, updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteProduct(user: User, productId: string): Promise<void> {
    const tenantId = getTenantId(user);
    const productDoc = await getDoc(doc(db, "products", productId));
    if (!productDoc.exists()) throw new Error("Product not found");
    const existing = productDoc.data() as Product;
    if (existing.tenantId !== tenantId) throw new Error("Unauthorized");

    await deleteDoc(doc(db, "products", productId));
  },
};

export const availabilityService = {
  async saveAvailabilitySettings(user: User, settings: Omit<AvailabilitySettings, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<AvailabilitySettings> {
    const tenantId = getTenantId(user);
    
    // Check if settings already exist
    const q = query(collection(db, "availabilitySettings"), where("tenantId", "==", tenantId));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      // Update existing
      const docId = snap.docs[0].id;
      await setDoc(doc(db, "availabilitySettings", docId), { ...settings, updatedAt: serverTimestamp() }, { merge: true });
      return { id: docId, tenantId, ...settings, createdAt: snap.docs[0].data().createdAt, updatedAt: serverTimestamp() } as AvailabilitySettings;
    } else {
      // Create new
      const docRef = doc(collection(db, "availabilitySettings"));
      const settingsData: AvailabilitySettings = {
        ...settings,
        id: docRef.id,
        tenantId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(docRef, settingsData);
      return settingsData;
    }
  },

  async getAvailabilitySettings(user: User): Promise<AvailabilitySettings | null> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "availabilitySettings"), where("tenantId", "==", tenantId));
    const snap = await getDocs(q);
    
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as AvailabilitySettings;
  },

  async createTimeOff(user: User, timeOff: Omit<TimeOff, "id" | "tenantId" | "createdAt">): Promise<TimeOff> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "timeOff"));
    const timeOffData: TimeOff = {
      ...timeOff,
      id: docRef.id,
      tenantId,
      createdAt: serverTimestamp(),
    };
    await setDoc(docRef, timeOffData);
    return timeOffData;
  },

  async getTimeOff(user: User, startDate?: string, endDate?: string): Promise<TimeOff[]> {
    const tenantId = getTenantId(user);
    let q = query(collection(db, "timeOff"), where("tenantId", "==", tenantId), orderBy("startDate", "asc"));
    
    const snap = await getDocs(q);
    let results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TimeOff[];
    
    // Filter by date range if provided
    if (startDate && endDate) {
      results = results.filter(t => t.startDate <= endDate && t.endDate >= startDate);
    }
    
    return results;
  },

  async deleteTimeOff(user: User, timeOffId: string): Promise<void> {
    const tenantId = getTenantId(user);
    const timeOffDoc = await getDoc(doc(db, "timeOff", timeOffId));
    if (!timeOffDoc.exists()) throw new Error("Time off not found");
    const existing = timeOffDoc.data() as TimeOff;
    if (existing.tenantId !== tenantId) throw new Error("Unauthorized");

    await deleteDoc(doc(db, "timeOff", timeOffId));
  },

  async createSpecialHours(user: User, specialHours: Omit<SpecialHours, "id" | "tenantId" | "createdAt">): Promise<SpecialHours> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "specialHours"));
    const specialHoursData: SpecialHours = {
      ...specialHours,
      id: docRef.id,
      tenantId,
      createdAt: serverTimestamp(),
    };
    await setDoc(docRef, specialHoursData);
    return specialHoursData;
  },

  async getSpecialHours(user: User, date?: string): Promise<SpecialHours[]> {
    const tenantId = getTenantId(user);
    let q = query(collection(db, "specialHours"), where("tenantId", "==", tenantId), orderBy("date", "asc"));
    
    const snap = await getDocs(q);
    let results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SpecialHours[];
    
    if (date) {
      results = results.filter(s => s.date === date);
    }
    
    return results;
  },

  async deleteSpecialHours(user: User, specialHoursId: string): Promise<void> {
    const tenantId = getTenantId(user);
    const specialHoursDoc = await getDoc(doc(db, "specialHours", specialHoursId));
    if (!specialHoursDoc.exists()) throw new Error("Special hours not found");
    const existing = specialHoursDoc.data() as SpecialHours;
    if (existing.tenantId !== tenantId) throw new Error("Unauthorized");

    await deleteDoc(doc(db, "specialHours", specialHoursId));
  },
};

export const portfolioService = {
  async createPortfolioItem(user: User, item: Omit<PortfolioItem, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<PortfolioItem> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "portfolioItems"));
    const itemData: PortfolioItem = {
      ...item,
      id: docRef.id,
      tenantId,
      views: item.views || 0,
      likes: item.likes || 0,
      featured: item.featured || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, itemData);
    return itemData;
  },

  async getPortfolioItems(user: User, category?: string): Promise<PortfolioItem[]> {
    const tenantId = getTenantId(user);
    let q = query(collection(db, "portfolioItems"), where("tenantId", "==", tenantId), orderBy("createdAt", "desc"));
    
    const snap = await getDocs(q);
    let results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PortfolioItem[];
    
    if (category && category !== "all") {
      results = results.filter(item => item.category === category);
    }
    
    return results;
  },

  async updatePortfolioItem(user: User, itemId: string, data: Partial<PortfolioItem>): Promise<void> {
    const tenantId = getTenantId(user);
    const itemDoc = await getDoc(doc(db, "portfolioItems", itemId));
    if (!itemDoc.exists()) throw new Error("Portfolio item not found");
    const existing = itemDoc.data() as PortfolioItem;
    if (existing.tenantId !== tenantId) throw new Error("Unauthorized");

    await setDoc(doc(db, "portfolioItems", itemId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

  async deletePortfolioItem(user: User, itemId: string): Promise<void> {
    const tenantId = getTenantId(user);
    const itemDoc = await getDoc(doc(db, "portfolioItems", itemId));
    if (!itemDoc.exists()) throw new Error("Portfolio item not found");
    const existing = itemDoc.data() as PortfolioItem;
    if (existing.tenantId !== tenantId) throw new Error("Unauthorized");

    await deleteDoc(doc(db, "portfolioItems", itemId));
  },

  async incrementViews(user: User, itemId: string): Promise<void> {
    const tenantId = getTenantId(user);
    const itemDoc = await getDoc(doc(db, "portfolioItems", itemId));
    if (!itemDoc.exists()) throw new Error("Portfolio item not found");
    const existing = itemDoc.data() as PortfolioItem;
    if (existing.tenantId !== tenantId) throw new Error("Unauthorized");

    const currentViews = existing.views || 0;
    await setDoc(doc(db, "portfolioItems", itemId), { views: currentViews + 1, updatedAt: serverTimestamp() }, { merge: true });
  },
};

export const certificationService = {
  async createCertification(user: User, cert: Omit<Certification, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<Certification> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "certifications"));
    const certData: Certification = {
      ...cert,
      id: docRef.id,
      tenantId,
      verified: cert.verified || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, certData);
    return certData;
  },

  async getCertifications(user: User): Promise<Certification[]> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "certifications"), where("tenantId", "==", tenantId), orderBy("issueDate", "desc"));
    
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Certification[];
  },

  async updateCertification(user: User, certId: string, data: Partial<Certification>): Promise<void> {
    const tenantId = getTenantId(user);
    const certDoc = await getDoc(doc(db, "certifications", certId));
    if (!certDoc.exists()) throw new Error("Certification not found");
    const existing = certDoc.data() as Certification;
    if (existing.tenantId !== tenantId) throw new Error("Unauthorized");

    await setDoc(doc(db, "certifications", certId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

  async deleteCertification(user: User, certId: string): Promise<void> {
    const tenantId = getTenantId(user);
    const certDoc = await getDoc(doc(db, "certifications", certId));
    if (!certDoc.exists()) throw new Error("Certification not found");
    const existing = certDoc.data() as Certification;
    if (existing.tenantId !== tenantId) throw new Error("Unauthorized");

    await deleteDoc(doc(db, "certifications", certId));
  },
};

export const tenantService = {
  async createTenant(user: User, businessName: string): Promise<Tenant> {
    const tenantId = getTenantId(user);
    const docRef = doc(collection(db, "tenants"), tenantId);
    const tenantData: Tenant = {
      id: tenantId,
      userId: user.uid,
      name: businessName,
      email: user.email || "",
      businessName,
      plan: "free",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, tenantData);
    return tenantData;
  },

  async getTenant(user: User): Promise<Tenant | null> {
    const tenantId = getTenantId(user);
    const snap = await getDoc(doc(db, "tenants", tenantId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Tenant;
  },

  async updateTenant(user: User, data: Partial<Tenant>): Promise<void> {
    const tenantId = getTenantId(user);
    await setDoc(doc(db, "tenants", tenantId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },
};

export const businessProfileService = {
  async createOrUpdateProfile(user: User, profile: Omit<BusinessProfile, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<BusinessProfile> {
    const tenantId = getTenantId(user);
    
    // Check if profile already exists
    const q = query(collection(db, "businessProfiles"), where("tenantId", "==", tenantId));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      // Update existing
      const docId = snap.docs[0].id;
      await setDoc(doc(db, "businessProfiles", docId), { ...profile, updatedAt: serverTimestamp() }, { merge: true });
      return { id: docId, tenantId, ...profile, createdAt: snap.docs[0].data().createdAt, updatedAt: serverTimestamp() } as BusinessProfile;
    } else {
      // Create new
      const docRef = doc(collection(db, "businessProfiles"));
      const profileData: BusinessProfile = {
        ...profile,
        id: docRef.id,
        tenantId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(docRef, profileData);
      return profileData;
    }
  },

  async getProfile(user: User): Promise<BusinessProfile | null> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "businessProfiles"), where("tenantId", "==", tenantId));
    const snap = await getDocs(q);
    
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as BusinessProfile;
  },
};

export const whatsappSettingsService = {
  async createOrUpdateSettings(user: User, settings: Omit<WhatsAppSettings, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<WhatsAppSettings> {
    const tenantId = getTenantId(user);
    
    // Check if settings already exist
    const q = query(collection(db, "whatsappSettings"), where("tenantId", "==", tenantId));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      // Update existing
      const docId = snap.docs[0].id;
      await setDoc(doc(db, "whatsappSettings", docId), { ...settings, updatedAt: serverTimestamp() }, { merge: true });
      return { id: docId, tenantId, ...settings, createdAt: snap.docs[0].data().createdAt, updatedAt: serverTimestamp() } as WhatsAppSettings;
    } else {
      // Create new
      const docRef = doc(collection(db, "whatsappSettings"));
      const settingsData: WhatsAppSettings = {
        ...settings,
        id: docRef.id,
        tenantId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(docRef, settingsData);
      return settingsData;
    }
  },

  async getSettings(user: User): Promise<WhatsAppSettings | null> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "whatsappSettings"), where("tenantId", "==", tenantId));
    const snap = await getDocs(q);
    
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as WhatsAppSettings;
  },
};

export const productSettingsService = {
  async createOrUpdateSettings(user: User, settings: Omit<ProductSettings, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<ProductSettings> {
    const tenantId = getTenantId(user);
    
    // Check if settings already exist
    const q = query(collection(db, "productSettings"), where("tenantId", "==", tenantId));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      // Update existing
      const docId = snap.docs[0].id;
      await setDoc(doc(db, "productSettings", docId), { ...settings, updatedAt: serverTimestamp() }, { merge: true });
      return { id: docId, tenantId, ...settings, createdAt: snap.docs[0].data().createdAt, updatedAt: serverTimestamp() } as ProductSettings;
    } else {
      // Create new
      const docRef = doc(collection(db, "productSettings"));
      const settingsData: ProductSettings = {
        ...settings,
        id: docRef.id,
        tenantId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(docRef, settingsData);
      return settingsData;
    }
  },

  async getSettings(user: User): Promise<ProductSettings | null> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "productSettings"), where("tenantId", "==", tenantId));
    const snap = await getDocs(q);
    
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as ProductSettings;
  },
};

export const serviceSettingsService = {
  async createOrUpdateSettings(user: User, settings: Omit<ServiceSettings, "id" | "tenantId" | "createdAt" | "updatedAt">): Promise<ServiceSettings> {
    const tenantId = getTenantId(user);
    
    // Check if settings already exist
    const q = query(collection(db, "serviceSettings"), where("tenantId", "==", tenantId));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      // Update existing
      const docId = snap.docs[0].id;
      await setDoc(doc(db, "serviceSettings", docId), { ...settings, updatedAt: serverTimestamp() }, { merge: true });
      return { id: docId, tenantId, ...settings, createdAt: snap.docs[0].data().createdAt, updatedAt: serverTimestamp() } as ServiceSettings;
    } else {
      // Create new
      const docRef = doc(collection(db, "serviceSettings"));
      const settingsData: ServiceSettings = {
        ...settings,
        id: docRef.id,
        tenantId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(docRef, settingsData);
      return settingsData;
    }
  },

  async getSettings(user: User): Promise<ServiceSettings | null> {
    const tenantId = getTenantId(user);
    const q = query(collection(db, "serviceSettings"), where("tenantId", "==", tenantId));
    const snap = await getDocs(q);
    
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as ServiceSettings;
  },
};

// Default categories that will be used if user hasn't created custom ones
export const defaultProductCategories = [
  { id: "footwear", name: "Footwear", icon: "👟", color: "#ec4899", description: "Shoes, Sandals, Boots" },
  { id: "clothing", name: "Clothing", icon: "👕", color: "#3b82f6", description: "T-shirts, Dresses, Jackets" },
  { id: "electronics", name: "Electronics", icon: "📱", color: "#8b5cf6", description: "Phones, Laptops, Gadgets" },
  { id: "furniture", name: "Furniture", icon: "🛋️", color: "#f59e0b", description: "Tables, Chairs, Storage" },
  { id: "beauty", name: "Beauty & Care", icon: "💄", color: "#ec4899", description: "Skincare, Makeup, Personal" },
  { id: "other", name: "Other", icon: "📦", color: "#64748b", description: "General products" },
];
