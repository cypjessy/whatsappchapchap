"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { formatCurrency, CURRENCY_SYMBOL } from "@/lib/currency";
import { sendEvolutionWhatsAppMessage } from "@/utils/sendWhatsApp";
import { getOrderStatusMessage } from "@/utils/orderMessages";
import { normalizePhone, createWhatsAppJid, isValidWhatsAppPhone } from "@/utils/phoneUtils";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

function getFirebaseApp() {
  if (typeof window === "undefined") return null;
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  specs: Record<string, string>;
  image?: string;
  images?: string[];
  tenantId: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tenantData, setTenantData] = useState<{evolutionServerUrl?: string; evolutionApiKey?: string; evolutionInstanceId?: string} | null>(null);
  const [businessSettings, setBusinessSettings] = useState<{
    shippingMethods?: Array<{ id: string; name: string; price: number; estimatedDays?: string }>;
    paymentMethods?: Array<{ id: string; name: string; details: string; icon: string; color: string }>;
    businessName?: string;
    phone?: string;
    address?: string;
  } | null>(null);
  const [pickupStations, setPickupStations] = useState<Array<{ 
    id: string; 
    county: string; 
    town: string; 
    stationName: string; 
    address: string;
    contactPhone?: string;
    operatingHours?: string;
    description?: string;
  }>>([]);
  
  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedCounty, setSelectedCounty] = useState("");
  const [selectedTown, setSelectedTown] = useState("");
  const [selectedStation, setSelectedStation] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string>("");

  // Load cart from localStorage and database on mount
  useEffect(() => {
    const loadCart = async () => {
      // Parse URL parameters
      const params = new URLSearchParams(window.location.search);
      const tenantId = params.get('tenant');
      const phone = params.get('phone');
      
      // If we have tenant and phone, load from database (works across devices)
      if (tenantId && phone) {
        try {
          const app = getFirebaseApp();
          if (app) {
            const db = getFirestore(app);
            const conversationRef = doc(db, "tenants", tenantId, "conversations", phone);
            const conversationSnap = await getDoc(conversationRef);
            
            if (conversationSnap.exists()) {
              const data = conversationSnap.data();
              if (data.cart && data.cart.items && data.cart.items.length > 0) {
                setCart(data.cart.items);
                // Also save to localStorage for offline access
                localStorage.setItem("whatsapp_cart", JSON.stringify(data.cart.items));
                setLoading(false);
                return;
              }
            }
          }
        } catch (e) {
          console.error("Error loading cart from database:", e);
        }
      }
      
      // Fallback: try localStorage (same device only)
      const savedCart = localStorage.getItem("whatsapp_cart");
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          if (parsedCart && parsedCart.length > 0) {
            setCart(parsedCart);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Error parsing localStorage cart:", e);
        }
      }
      
      // If both sources are empty, show error
      setError("Your cart is empty");
      setLoading(false);
    };
    
    loadCart();
  }, []);

  // Fetch tenant data and business settings
  useEffect(() => {
    const fetchData = async () => {
      if (cart.length === 0) return;
      
      const tenantId = cart[0].tenantId;
      
      try {
        const app = getFirebaseApp();
        if (!app) {
          setError("Unable to connect. Please try again.");
          setLoading(false);
          return;
        }

        const db = getFirestore(app);
        
        // Fetch tenant data for Evolution credentials
        const tenantRef = doc(db, "tenants", tenantId);
        const tenantSnap = await getDoc(tenantRef);
        if (tenantSnap.exists()) {
          const data = tenantSnap.data();
          setTenantData({
            evolutionServerUrl: data.evolutionServerUrl,
            evolutionApiKey: data.evolutionApiKey,
            evolutionInstanceId: data.evolutionInstanceId
          });
        }
        
        // Fetch business profile for payment methods and business info
        const profileQuery = query(collection(db, "businessProfiles"), where("tenantId", "==", tenantId));
        const profileSnap = await getDocs(profileQuery);
        const profileData = !profileSnap.empty ? profileSnap.docs[0].data() : null;
        
        // Fetch shipping methods
        const shippingQuery = collection(db, "shippingMethods");
        const shippingSnap = await getDocs(shippingQuery);
        const shippingMethods = shippingSnap.docs
          .filter(doc => doc.data().tenantId === tenantId)
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Array<{ id: string; name: string; price: number; estimatedDays?: string }>;
        
        // Fetch pickup stations
        const pickupQuery = collection(db, "pickupStations");
        const pickupSnap = await getDocs(pickupQuery);
        const pickupStationsData = pickupSnap.docs
          .filter(doc => doc.data().tenantId === tenantId)
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Array<{ 
            id: string; 
            county: string; 
            town: string; 
            stationName: string; 
            address: string;
            contactPhone?: string;
            operatingHours?: string;
            description?: string;
          }>;
        
        setPickupStations(pickupStationsData);
        setBusinessSettings({
          shippingMethods: shippingMethods.length > 0 ? shippingMethods : undefined,
          paymentMethods: profileData?.paymentMethods || [],
          businessName: profileData?.businessName,
          phone: profileData?.phone,
          address: profileData?.address
        });
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load checkout information");
        setLoading(false);
      }
    };

    fetchData();
  }, [cart]);

  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const updatedCart = [...cart];
    updatedCart[index].quantity = newQuantity;
    setCart(updatedCart);
    localStorage.setItem("whatsapp_cart", JSON.stringify(updatedCart));
    
    // Also update in database if we have tenantId and phone
    if (updatedCart.length > 0) {
      saveCartToDatabase(updatedCart);
    }
  };

  const removeFromCart = (index: number) => {
    const updatedCart = cart.filter((_, i) => i !== index);
    setCart(updatedCart);
    localStorage.setItem("whatsapp_cart", JSON.stringify(updatedCart));
    
    // Also update in database
    if (updatedCart.length > 0) {
      saveCartToDatabase(updatedCart);
    } else {
      setError("Your cart is empty");
    }
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("whatsapp_cart");
    setError("Your cart is empty");
  };

  const saveCartToDatabase = async (cartItems: typeof cart) => {
    const params = new URLSearchParams(window.location.search);
    const tenantId = params.get('tenant');
    const phone = params.get('phone');
    
    if (!tenantId || !phone || cartItems.length === 0) return;
    
    try {
      const app = getFirebaseApp();
      if (app) {
        const db = getFirestore(app);
        const conversationRef = doc(db, "tenants", tenantId, "conversations", phone);
        
        await setDoc(conversationRef, {
          cart: {
            items: cartItems,
            updatedAt: new Date().toISOString(),
          },
        }, { merge: true });
        
        console.log('✅ Cart saved to database from checkout');
      }
    } catch (err) {
      console.error('Failed to save cart to database:', err);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};
    
    if (!customerName.trim()) newErrors.name = true;
    if (!customerPhone.trim()) newErrors.phone = true;
    if (!selectedStation) newErrors.address = true;
    if (!deliveryMethod) newErrors.delivery = true;
    if (!paymentMethod) newErrors.payment = true;
    if (paymentMethod && paymentMethod !== "cod" && !paymentDetails.trim()) {
      newErrors.paymentDetails = true;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      alert("Please fill in all required fields");
      return;
    }

    setOrdering(true);

    try {
      const app = getFirebaseApp();
      if (!app) throw new Error("Firebase not initialized");

      const db = getFirestore(app);
      const tenantId = cart[0].tenantId;

      // Generate order number
      const orderNum = `ORD-${Date.now().toString().slice(-6)}`;
      setOrderNumber(orderNum);

      // Get selected station details
      const station = pickupStations.find(s => s.id === selectedStation);

      // Prepare order items
      const orderItems = cart.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        specs: item.specs,
        image: item.image,
        images: item.images
      }));

      // Calculate totals
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const total = subtotal + deliveryCost;

      // Save order to Firestore
      const orderData = {
        tenantId,
        orderNumber: orderNum,
        customerName,
        customerPhone: normalizePhone(customerPhone),
        customerEmail: customerEmail || undefined,
        items: orderItems,
        subtotal,
        deliveryCost,
        total,
        deliveryMethod,
        paymentMethod,
        paymentDetails: paymentDetails || undefined,
        pickupStation: station ? {
          id: station.id,
          name: station.stationName,
          address: station.address,
          county: station.county,
          town: station.town
        } : undefined,
        orderNotes: orderNotes || undefined,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const orderRef = await addDoc(collection(db, "orders"), orderData);

      // Clear cart
      localStorage.removeItem("shopping_cart");
      setCart([]);

      // Send WhatsApp notification to business
      if (tenantData?.evolutionServerUrl && tenantData?.evolutionApiKey && tenantData?.evolutionInstanceId) {
        const businessPhone = businessSettings?.phone;
        if (businessPhone && isValidWhatsAppPhone(businessPhone)) {
          const message = `🛍️ *New Order Received*\n\n*Order #:* ${orderNum}\n*Customer:* ${customerName}\n*Phone:* ${normalizePhone(customerPhone)}${customerEmail ? `\n*Email:* ${customerEmail}` : ""}\n\n*Items:*\n${cart.map(item => `- ${item.name} x${item.quantity} - ${CURRENCY_SYMBOL}${(item.price * item.quantity).toLocaleString()}`).join("\n")}\n\n*Subtotal:* ${CURRENCY_SYMBOL}${subtotal.toLocaleString()}\n*Delivery:* ${CURRENCY_SYMBOL}${deliveryCost.toLocaleString()}\n*Total:* ${CURRENCY_SYMBOL}${total.toLocaleString()}\n\n*Delivery Method:* ${deliveryMethod}\n*Payment:* ${paymentMethod}${paymentDetails ? `\n*Payment Details:* ${paymentDetails}` : ""}\n\n*Pickup Station:* ${station?.stationName || "N/A"}\n${station?.address ? `📍 ${station.address}` : ""}\n\n${orderNotes ? `*Notes:* ${orderNotes}` : ""}`;

          await sendEvolutionWhatsAppMessage(
            normalizePhone(businessPhone),
            message,
            tenantId
          );
        }
      }

      // Send confirmation to customer
      const productNames = cart.map(item => item.name).join(", ");
      const stationAddress = station ? `${station.stationName}, ${station.address}` : undefined;
      const confirmationMessage = getOrderStatusMessage(
        "pending",
        customerName,
        orderNum,
        productNames,
        stationAddress
      );
      
      const customerPhoneClean = normalizePhone(customerPhone);
      if (isValidWhatsAppPhone(customerPhoneClean)) {
        await sendEvolutionWhatsAppMessage(
          customerPhoneClean,
          confirmationMessage,
          tenantId
        );
      }

      setOrdered(true);
      setOrdering(false);
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Failed to place order. Please try again.");
      setOrdering(false);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + deliveryCost;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ textAlign: "center" }}>
          <i className="fas fa-circle-notch fa-spin" style={{ fontSize: 48, color: "#3b82f6", marginBottom: 16 }}></i>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#1e293b" }}>Loading checkout...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ textAlign: "center", maxWidth: 400, padding: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <i className="fas fa-shopping-cart" style={{ fontSize: 32, color: "#ef4444" }}></i>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>Cart is Empty</h2>
          <p style={{ fontSize: 16, color: "#64748b", marginBottom: 32 }}>{error}</p>
          <div style={{ background: "#f0f9ff", borderRadius: 12, padding: 20, marginBottom: 24, border: "2px solid #bae6fd" }}>
            <p style={{ fontSize: 14, color: "#0369a1", margin: 0 }}>
              <i className="fas fa-info-circle" style={{ marginRight: 8 }}></i>
              Please browse products from our WhatsApp catalog and add items to your cart before checking out.
            </p>
          </div>
          <p style={{ fontSize: 14, color: "#94a3b8" }}>
            Need help? Contact us on WhatsApp
          </p>
        </div>
      </div>
    );
  }

  if (ordered) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 24 }}>
        <div style={{ maxWidth: 600, margin: "0 auto", background: "white", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          <div style={{ padding: 48, textAlign: "center", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "white" }}>
            <div style={{ width: 80, height: 80, background: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 40 }}>
              <i className="fas fa-check"></i>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Order Placed!</h1>
            <p style={{ fontSize: 16, opacity: 0.9 }}>Thank you for your purchase</p>
          </div>
          
          <div style={{ padding: 32 }}>
            <div style={{ background: "#f0fdf4", borderRadius: 12, padding: 24, marginBottom: 24, border: "2px solid #86efac" }}>
              <div style={{ fontSize: 14, color: "#166534", marginBottom: 8 }}>Order Number</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#166534" }}>{orderNumber}</div>
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#1e293b" }}>What's Next?</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                <li style={{ padding: "12px 0", borderBottom: "1px solid #e2e8f0", display: "flex", gap: 12 }}>
                  <i className="fas fa-envelope" style={{ color: "#3b82f6", marginTop: 4 }}></i>
                  <div>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>Confirmation Sent</div>
                    <div style={{ fontSize: 14, color: "#64748b" }}>Check your WhatsApp for order details</div>
                  </div>
                </li>
                <li style={{ padding: "12px 0", borderBottom: "1px solid #e2e8f0", display: "flex", gap: 12 }}>
                  <i className="fas fa-box" style={{ color: "#3b82f6", marginTop: 4 }}></i>
                  <div>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>Processing</div>
                    <div style={{ fontSize: 14, color: "#64748b" }}>We're preparing your order</div>
                  </div>
                </li>
                <li style={{ padding: "12px 0", display: "flex", gap: 12 }}>
                  <i className="fas fa-truck" style={{ color: "#3b82f6", marginTop: 4 }}></i>
                  <div>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>Delivery</div>
                    <div style={{ fontSize: 14, color: "#64748b" }}>You'll receive updates via WhatsApp</div>
                  </div>
                </li>
              </ul>
            </div>
            
            <div style={{ background: "#f0f9ff", borderRadius: 12, padding: 20, marginBottom: 24, border: "2px solid #bae6fd" }}>
              <p style={{ fontSize: 14, color: "#0369a1", margin: 0 }}>
                <i className="fas fa-info-circle" style={{ marginRight: 8 }}></i>
                You can continue browsing our products on WhatsApp and add more items anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)", color: "white", padding: "24px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button 
          onClick={() => router.back()}
          style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18 }}
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <div style={{ textAlign: "center", flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Checkout</h1>
          <p style={{ fontSize: 14, opacity: 0.9, margin: "4px 0 0" }}>{cart.length} item(s) in cart</p>
        </div>
        <div style={{ width: 40 }}></div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 24 }}>
          {/* Left Column - Checkout Form */}
          <div>
            {/* Customer Details */}
            <div style={{ background: "white", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden", marginBottom: 24 }}>
              <div style={{ padding: 24, borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="fas fa-user" style={{ color: "#3b82f6" }}></i>
                  Delivery Details
                </div>
                
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 8, color: "#1e293b" }}>Full Name <span style={{ color: "#ef4444" }}>*</span></label>
                  <input 
                    type="text" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="John Doe"
                    style={{ width: "100%", padding: 16, border: `2px solid ${errors.name ? "#ef4444" : "#e2e8f0"}`, borderRadius: 8, fontSize: 16, outline: "none", background: "white" }}
                  />
                  {errors.name && <p style={{ color: "#ef4444", fontSize: 14, marginTop: 8 }}><i className="fas fa-exclamation-circle"></i> Please enter your full name</p>}
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 8, color: "#1e293b" }}>WhatsApp Number <span style={{ color: "#ef4444" }}>*</span></label>
                  <input 
                    type="tel" 
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+254 712 345 678"
                    style={{ width: "100%", padding: 16, border: `2px solid ${errors.phone ? "#ef4444" : "#e2e8f0"}`, borderRadius: 8, fontSize: 16, outline: "none", background: "white" }}
                  />
                  <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>We'll send order updates via WhatsApp</p>
                  {errors.phone && <p style={{ color: "#ef4444", fontSize: 14, marginTop: 8 }}><i className="fas fa-exclamation-circle"></i> Please enter your phone number</p>}
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 8, color: "#1e293b" }}>Select Pickup Location <span style={{ color: "#ef4444" }}>*</span></label>
                  
                  <select
                    value={selectedCounty}
                    onChange={(e) => {
                      setSelectedCounty(e.target.value);
                      setSelectedTown("");
                      setSelectedStation("");
                    }}
                    style={{ width: "100%", padding: 16, border: `2px solid ${errors.address ? "#ef4444" : "#e2e8f0"}`, borderRadius: 8, fontSize: 16, outline: "none", background: "white", marginBottom: 12 }}
                  >
                    <option value="">Select County</option>
                    {[...new Set(pickupStations.map(s => s.county))].map(county => (
                      <option key={county} value={county}>{county}</option>
                    ))}
                  </select>
                  
                  {selectedCounty && (
                    <select
                      value={selectedTown}
                      onChange={(e) => {
                        setSelectedTown(e.target.value);
                        setSelectedStation("");
                      }}
                      style={{ width: "100%", padding: 16, border: `2px solid ${errors.address ? "#ef4444" : "#e2e8f0"}`, borderRadius: 8, fontSize: 16, outline: "none", background: "white", marginBottom: 12 }}
                    >
                      <option value="">Select Town</option>
                      {[...new Set(pickupStations.filter(s => s.county === selectedCounty).map(s => s.town))].map(town => (
                        <option key={town} value={town}>{town}</option>
                      ))}
                    </select>
                  )}
                  
                  {selectedTown && (
                    <select
                      value={selectedStation}
                      onChange={(e) => setSelectedStation(e.target.value)}
                      style={{ width: "100%", padding: 16, border: `2px solid ${errors.address ? "#ef4444" : "#e2e8f0"}`, borderRadius: 8, fontSize: 16, outline: "none", background: "white" }}
                    >
                      <option value="">Select Pickup Station</option>
                      {pickupStations.filter(s => s.county === selectedCounty && s.town === selectedTown).map(station => (
                        <option key={station.id} value={station.id}>
                          {station.stationName} - {station.address}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {selectedStation && (() => {
                    const station = pickupStations.find(s => s.id === selectedStation);
                    return station ? (
                      <div style={{ marginTop: 12, padding: 12, background: "#f0fdf4", borderRadius: 8, border: "1px solid #86efac" }}>
                        <p style={{ fontSize: 14, color: "#166534", margin: "4px 0" }}>
                          <i className="fas fa-map-marker-alt"></i> {station.address}
                        </p>
                        {station.contactPhone && (
                          <p style={{ fontSize: 14, color: "#166534", margin: "4px 0" }}>
                            <i className="fas fa-phone"></i> {station.contactPhone}
                          </p>
                        )}
                        {station.operatingHours && (
                          <p style={{ fontSize: 14, color: "#166534", margin: "4px 0" }}>
                            <i className="fas fa-clock"></i> {station.operatingHours}
                          </p>
                        )}
                      </div>
                    ) : null;
                  })()}
                  
                  {errors.address && <p style={{ color: "#ef4444", fontSize: 14, marginTop: 8 }}><i className="fas fa-exclamation-circle"></i> Please select a pickup location</p>}
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 8, color: "#1e293b" }}>Email (Optional)</label>
                  <input 
                    type="email" 
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="john@example.com"
                    style={{ width: "100%", padding: 16, border: "2px solid #e2e8f0", borderRadius: 8, fontSize: 16, outline: "none", background: "white" }}
                  />
                </div>
              </div>
            </div>

            {/* Delivery Options */}
            <div style={{ background: "white", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden", marginBottom: 24 }}>
              <div style={{ padding: 24, borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="fas fa-truck" style={{ color: "#3b82f6" }}></i>
                  Delivery Method
                </div>
                
                {(businessSettings?.shippingMethods?.length ? businessSettings?.shippingMethods : [
                  { id: "standard", name: "Standard Delivery", price: 500, estimatedDays: "2-3 days" },
                  { id: "express", name: "Express Delivery", price: 1000, estimatedDays: "Same day" },
                  { id: "pickup", name: "Store Pickup", price: 0, estimatedDays: "Same day" }
                ]).map((option) => (
                  <div 
                    key={option.id}
                    onClick={() => { setDeliveryMethod(option.id); setDeliveryCost(option.price); }}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 16, 
                      padding: 16, 
                      border: `2px solid ${deliveryMethod === option.id ? "#25D366" : "#e2e8f0"}`,
                      borderRadius: 12, 
                      cursor: "pointer", 
                      marginBottom: 12,
                      background: deliveryMethod === option.id ? "rgba(37,211,102,0.05)" : "white"
                    }}
                  >
                    <div style={{ width: 24, height: 24, border: `2px solid ${deliveryMethod === option.id ? "#25D366" : "#e2e8f0"}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: deliveryMethod === option.id ? "#25D366" : "white" }}>
                      {deliveryMethod === option.id && <div style={{ width: 8, height: 8, background: "white", borderRadius: "50%" }}></div>}
                    </div>
                    <div style={{ width: 48, height: 48, background: "#f8fafc", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#25D366" }}>
                      <i className={`fas ${option.id === "pickup" ? "fa-store" : option.id === "express" ? "fa-shipping-fast" : "fa-truck"}`}></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{option.name}</div>
                      <div style={{ fontSize: 14, color: "#64748b" }}>
                        {option.estimatedDays || (option.id === "pickup" ? "Available today after 2PM" : option.id === "express" ? "1-2 business days" : "3-5 business days")}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: option.price === 0 ? "#10b981" : "#25D366" }}>
                      {option.price === 0 ? "FREE" : CURRENCY_SYMBOL + option.price.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div style={{ background: "white", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden", marginBottom: 24 }}>
              <div style={{ padding: 24, borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="fas fa-credit-card" style={{ color: "#3b82f6" }}></i>
                  Payment Method
                </div>
                
                {!businessSettings?.paymentMethods ? (
                  <div style={{ textAlign: "center", padding: 24, color: "#64748b" }}>
                    <i className="fas fa-circle-notch fa-spin" style={{ fontSize: 24, marginBottom: 8 }}></i>
                    <div>Loading payment methods...</div>
                  </div>
                ) : businessSettings.paymentMethods.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 24, color: "#64748b" }}>
                    <i className="fas fa-info-circle" style={{ fontSize: 24, marginBottom: 8, color: "#f59e0b" }}></i>
                    <div>No payment methods configured</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Please contact the seller</div>
                  </div>
                ) : (
                  businessSettings.paymentMethods.map((option: { id: string; name: string; details: string; icon: string; color: string }) => (
                    <div 
                      key={option.id}
                      onClick={() => setPaymentMethod(option.id)}
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 16, 
                        padding: 16, 
                        border: `2px solid ${paymentMethod === option.id ? "#25D366" : "#e2e8f0"}`,
                        borderRadius: 12, 
                        cursor: "pointer", 
                        marginBottom: 12,
                        background: paymentMethod === option.id ? "rgba(37,211,102,0.05)" : "white"
                      }}
                    >
                      <div style={{ width: 24, height: 24, border: `2px solid ${paymentMethod === option.id ? "#25D366" : "#e2e8f0"}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: paymentMethod === option.id ? "#25D366" : "white" }}>
                        {paymentMethod === option.id && <div style={{ width: 8, height: 8, background: "white", borderRadius: "50%" }}></div>}
                      </div>
                      <div style={{ width: 48, height: 48, background: option.color || "#64748b", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "white" }}>
                        <i className={`fas ${option.icon || "fa-money-bill-wave"}`}></i>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{option.name}</div>
                        <div style={{ fontSize: 14, color: "#64748b", whiteSpace: "pre-wrap" }}>{option.details}</div>
                      </div>
                    </div>
                  ))
                )}

                {paymentMethod !== "cod" && businessSettings?.paymentMethods && (
                  <div style={{ marginTop: 16, padding: 16, background: "#f8fafc", borderRadius: 12, border: "2px solid #e2e8f0" }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: "#1e293b" }}>
                      {paymentMethod === "mpesa" ? "M-Pesa Payment Instructions" : paymentMethod === "bank" ? "Bank Transfer Details" : "Payment Instructions"}
                    </div>
                    <div style={{ fontSize: 14, color: "#64748b", whiteSpace: "pre-wrap", marginBottom: 16 }}>
                      {businessSettings.paymentMethods.find((p: { id: string; name: string; details: string }) => p.id === paymentMethod)?.details || "Payment instructions not available"}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: "#1e293b" }}>
                      Enter Payment Details <span style={{ color: "#ef4444" }}>*</span>
                    </div>
                    <input
                      type="text"
                      placeholder={paymentMethod === "mpesa" ? "Enter M-Pesa transaction ID" : paymentMethod === "bank" ? "Enter transaction/reference number" : "Enter payment reference"}
                      value={paymentDetails}
                      onChange={(e) => setPaymentDetails(e.target.value)}
                      style={{ width: "100%", padding: 12, border: `2px solid ${errors.paymentDetails ? "#ef4444" : "#e2e8f0"}`, borderRadius: 8, fontSize: 14, marginBottom: 12 }}
                    />
                    {errors.paymentDetails && <p style={{ color: "#ef4444", fontSize: 14, marginTop: 4 }}><i className="fas fa-exclamation-circle"></i> Please enter payment details</p>}
                    <textarea
                      placeholder="Add a message to the seller (optional)"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      rows={2}
                      style={{ width: "100%", padding: 12, border: "2px solid #e2e8f0", borderRadius: 8, fontSize: 14, resize: "none" }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Order Notes */}
            <div style={{ background: "white", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden", marginBottom: 24 }}>
              <div style={{ padding: 24 }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="fas fa-sticky-note" style={{ color: "#3b82f6" }}></i>
                  Order Notes (Optional)
                </div>
                <textarea 
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Any special instructions for delivery? E.g., Call when you arrive, Leave with security, etc."
                  style={{ width: "100%", padding: 16, border: "2px solid #e2e8f0", borderRadius: 8, fontSize: 15, resize: "vertical", minHeight: 100, outline: "none", fontFamily: "inherit" }}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Cart Summary */}
          <div style={{ position: "sticky", top: 24, alignSelf: "start" }}>
            <div style={{ background: "white", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden" }}>
              <div style={{ padding: 24, background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", color: "white" }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="fas fa-shopping-cart"></i>
                  Cart Summary
                </h2>
              </div>

              <div style={{ padding: 24 }}>
                {/* Cart Items */}
                {cart.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #e2e8f0" }}>
                    <div style={{ width: 60, height: 60, borderRadius: 8, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                      {item.image || (item.images && item.images.length > 0) ? (
                        <img src={item.image || item.images![0]} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: 24 }}>📦</span>
                      )}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</h3>
                      {Object.keys(item.specs).length > 0 && (
                        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>
                          {Object.entries(item.specs).map(([key, val]) => (
                            <span key={key} style={{ marginRight: 6 }}>{key}: {val}</span>
                          ))}
                        </div>
                      )}
                      
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <button 
                            onClick={() => updateCartItemQuantity(idx, item.quantity - 1)}
                            style={{ width: 24, height: 24, borderRadius: 6, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, cursor: "pointer", fontSize: 12 }}
                          >
                            -
                          </button>
                          <span style={{ width: 20, textAlign: "center", fontWeight: 700, fontSize: 13 }}>{item.quantity}</span>
                          <button 
                            onClick={() => updateCartItemQuantity(idx, item.quantity + 1)}
                            style={{ width: 24, height: 24, borderRadius: 6, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, cursor: "pointer", fontSize: 12 }}
                          >
                            +
                          </button>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#25D366" }}>
                          {CURRENCY_SYMBOL}{(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => removeFromCart(idx)}
                      style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", background: "none", border: "none", cursor: "pointer", borderRadius: 6, flexShrink: 0, fontSize: 14 }}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                ))}

                {/* Cart Totals */}
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginTop: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px dashed #e2e8f0" }}>
                    <span style={{ color: "#64748b" }}>Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                    <span style={{ fontWeight: 600 }}>{CURRENCY_SYMBOL}{subtotal.toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px dashed #e2e8f0" }}>
                    <span style={{ color: "#64748b" }}>Shipping</span>
                    <span style={{ fontWeight: 600 }}>{CURRENCY_SYMBOL}{deliveryCost.toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, marginTop: 8, borderTop: "2px solid #e2e8f0", fontSize: 18, fontWeight: 800 }}>
                    <span>Total</span>
                    <span style={{ color: "#25D366" }}>{CURRENCY_SYMBOL}{total.toLocaleString()}</span>
                  </div>
                </div>
                
                {/* Place Order Button */}
                <button 
                  onClick={handlePlaceOrder}
                  disabled={ordering}
                  style={{ 
                    width: "100%",
                    padding: 18, 
                    background: ordering ? "#94a3b8" : "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                    color: "white", 
                    border: "none", 
                    borderRadius: 12, 
                    fontSize: 18, 
                    fontWeight: 700, 
                    cursor: ordering ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 16,
                    boxShadow: ordering ? "none" : "0 4px 12px rgba(37,211,102,0.3)"
                  }}
                >
                  {ordering ? (
                    <>
                      <i className="fas fa-circle-notch fa-spin"></i>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check-circle"></i>
                      Place Order
                    </>
                  )}
                </button>

                {/* Cart Actions */}
                <button 
                  onClick={clearCart}
                  style={{ width: "100%", padding: 12, background: "#f8fafc", color: "#64748b", border: "2px solid #e2e8f0", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 }}
                >
                  <i className="fas fa-trash-alt"></i>
                  Clear Cart
                </button>
              </div>
            </div>

            {/* Trust Badges */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
              <div style={{ background: "white", borderRadius: 12, padding: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: 12 }}>
                <i className="fas fa-shield-alt" style={{ color: "#10b981", fontSize: 20 }}></i>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>Secure Payment</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Your data is protected</div>
                </div>
              </div>
              <div style={{ background: "white", borderRadius: 12, padding: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: 12 }}>
                <i className="fas fa-headset" style={{ color: "#10b981", fontSize: 20 }}></i>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>24/7 Support</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>We're here to help</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
