"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { formatCurrency, CURRENCY_SYMBOL } from "@/lib/currency";

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

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock?: number;
  shippingFee?: number;
  image?: string;
  images?: string[];
  category?: string;
  categoryName?: string;
  subcategory?: string;
  filters?: Record<string, string[]>;
  shippingMethods?: Array<{ id: string; name: string; price: number }>;
  paymentMethods?: Array<{ id: string; name: string; details: string }>;
  variants?: Array<{
    id: number;
    specs: Record<string, string>;
    price: number;
    stock: number;
  }>;
}

function OrderPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const tenantId = searchParams.get("tenant") || "";
  const productId = searchParams.get("product") || "";
  const phoneParam = searchParams.get("phone") || "";
  
  const [activeTab, setActiveTab] = useState<"order" | "track">("order");
  const [product, setProduct] = useState<Product | null>(null);
  const [tenantData, setTenantData] = useState<{evolutionServerUrl?: string; evolutionApiKey?: string; evolutionInstanceId?: string} | null>(null);
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState(phoneParam);
  const [address, setAddress] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("standard");
  const [deliveryCost, setDeliveryCost] = useState(500);
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  
  // Track order state
  const [trackOrder, setTrackOrder] = useState<any>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState("");
  const [trackSearched, setTrackSearched] = useState(false);
  const [trackOrderNumber, setTrackOrderNumber] = useState("");
  const [trackPhone, setTrackPhone] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId || !tenantId) {
        setError("Invalid product link");
        setLoading(false);
        return;
      }

      try {
        const app = getFirebaseApp();
        if (!app) {
          setError("Unable to connect. Please try again.");
          setLoading(false);
          return;
        }

        const db = getFirestore(app);
        const productRef = doc(db, "products", productId);
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
          const data = productSnap.data() as Product;
          setProduct({ ...data, id: productSnap.id } as Product);
          
          // Fetch tenant data for Evolution credentials
          const tenantIdWithoutPrefix = tenantId.replace('tenant_', '');
          const tenantRef = doc(db, "tenants", tenantIdWithoutPrefix);
          const tenantSnap = await getDoc(tenantRef);
          if (tenantSnap.exists()) {
            const tenantData = tenantSnap.data();
            setTenantData({
              evolutionServerUrl: tenantData.evolutionServerUrl,
              evolutionApiKey: tenantData.evolutionApiKey,
              evolutionInstanceId: tenantData.evolutionInstanceId
            });
          }
        } else {
          setError("Product not found");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, tenantId]);

  const getBasePrice = () => {
    if (!product) return 0;
    
    if (product.variants && Object.keys(selectedSpecs).length > 0) {
      const variant = product.variants.find(v => {
        return Object.entries(selectedSpecs).every(([key, value]) => v.specs[key] === value);
      });
      if (variant) return variant.price;
    }
    
    return product.price || 0;
  };

  const getVariantStock = () => {
    if (!product?.variants || Object.keys(selectedSpecs).length === 0) {
      return product?.stock || 99;
    }
    
    const variant = product.variants.find(v => {
      return Object.entries(selectedSpecs).every(([key, value]) => v.specs[key] === value);
    });
    
    return variant?.stock || 0;
  };

  const toggleSpec = (key: string, value: string) => {
    setSelectedSpecs(prev => ({
      ...prev,
      [key]: prev[key] === value ? "" : value
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};
    
    const requiredFilters = Object.keys(product?.filters || {}).filter(key => {
      const options = product?.filters?.[key];
      return options && options.length > 1;
    });
    
    const hasAnySelectedSpecs = Object.values(selectedSpecs).some(val => val && val.trim() !== "");
    
    if (requiredFilters.length > 0 && hasAnySelectedSpecs) {
      const missingSpecs = requiredFilters.filter(key => !selectedSpecs[key] || selectedSpecs[key].trim() === "");
      if (missingSpecs.length > 0) {
        newErrors.specs = true;
      }
    }
    
    if (!customerName.trim()) newErrors.name = true;
    if (!customerPhone.trim()) newErrors.phone = true;
    if (!address.trim()) newErrors.address = true;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOrder = async () => {
    if (!product) return;
    
    if (!validateForm()) {
      const section = document.querySelector('.specs-section') as HTMLElement;
      if (section) section.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    
    setOrdering(true);
    
    try {
      const app = getFirebaseApp()!;
      const db = getFirestore(app);
      
      const orderNum = "ORD-" + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      const subtotal = getBasePrice() * quantity;
      const total = subtotal + deliveryCost;
      
      await addDoc(collection(db, "orders"), {
        orderNumber: orderNum,
        tenantId,
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        basePrice: getBasePrice(),
        selectedSpecs,
        selectedVariant: product.variants?.find(v => 
          Object.entries(selectedSpecs).every(([key, value]) => v.specs[key] === value)
        ) || null,
        quantity,
        customerPhone: customerPhone,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || null,
        deliveryAddress: address.trim(),
        deliveryMethod,
        deliveryCost,
        paymentMethod,
        paymentDetails: paymentDetails.trim() || null,
        orderNotes: orderNotes.trim() || null,
        subtotal,
        total,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await fetch('https://n8n-lfk9ps3h72dezxj6jwy4905s.173.249.50.98.sslip.io/webhook/order-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderNum,
          orderNumber: orderNum,
          customerPhone: customerPhone,
          customerName: customerName.trim(),
          productName: product.name,
          price: getBasePrice(),
          quantity: quantity,
          selectedSpecs: selectedSpecs,
          deliveryAddress: address.trim(),
          deliveryMethod: deliveryMethod,
          deliveryCost: deliveryCost,
          paymentMethod: paymentMethod,
          total: total,
          tenantId: tenantId,
          evolutionServerUrl: tenantData?.evolutionServerUrl || null,
          evolutionApiKey: tenantData?.evolutionApiKey || null,
          evolutionInstanceId: tenantData?.evolutionInstanceId || null
        })
      }).catch(err => console.error('Webhook error:', err));
      
      setOrderNumber(orderNum);
      setOrdered(true);
    } catch (err: any) {
      console.error("Error placing order:", err);
      alert("Failed to place order. Please try again.");
    } finally {
      setOrdering(false);
    }
  };

  const contactSeller = () => {
    const cleanTenantId = tenantId.replace('tenant_', '');
    const phone = cleanTenantId.replace(/[^0-9]/g, '');
    const message = `Hi, I'm interested in ${product?.name}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const continueToWhatsApp = () => {
    const cleanTenantId = tenantId.replace('tenant_', '');
    const phone = cleanTenantId.replace(/[^0-9]/g, '');
    const message = `Hi, I just placed order ${orderNumber}. Here's my details:\n\nName: ${customerName}\nPhone: ${customerPhone}\nAddress: ${address}\n\nOrder Total: ${CURRENCY_SYMBOL}${total.toLocaleString()}\nPayment: ${paymentMethod}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const goToTrackOrder = () => {
    setActiveTab("track");
    setTrackOrderNumber(orderNumber);
    setTrackPhone(customerPhone);
    setTrackSearched(false);
    setTrackOrder(null);
  };

  const formatTrackDate = (createdAt: any) => {
    if (!createdAt) return "N/A";
    try {
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return "N/A";
    }
  };

  const getTrackStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; bg: string; icon: string; message: string }> = {
      pending: { label: "Pending", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", icon: "fa-clock", message: "Awaiting payment confirmation" },
      processing: { label: "Processing", color: "#3b82f6", bg: "rgba(59,130,246,0.1)", icon: "fa-cog", message: "Your order is being prepared" },
      shipped: { label: "Shipped", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", icon: "fa-shipping-fast", message: "Your order is on its way" },
      delivered: { label: "Delivered", color: "#10b981", bg: "rgba(16,185,129,0.1)", icon: "fa-check-circle", message: "Order delivered successfully" },
      cancelled: { label: "Cancelled", color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: "fa-times-circle", message: "Order has been cancelled" },
      refunded: { label: "Refunded", color: "#6366f1", bg: "rgba(99,102,241,0.1)", icon: "fa-undo", message: "Refund has been processed" }
    };
    return statusMap[status] || statusMap.pending;
  };

  const searchTrackOrder = async () => {
    if (!trackOrderNumber.trim() || !trackPhone.trim()) {
      setTrackError("Please enter both order number and phone number");
      return;
    }

    setTrackLoading(true);
    setTrackError("");
    setTrackOrder(null);

    try {
      const app = getFirebaseApp();
      if (!app) {
        setTrackError("Unable to connect. Please try again.");
        setTrackLoading(false);
        return;
      }

      const db = getFirestore(app);
      const { getDocs, query, collection, where } = await import("firebase/firestore");
      
      const q = query(
        collection(db, "orders"),
        where("tenantId", "==", tenantId),
        where("orderNumber", "==", trackOrderNumber.trim())
      );
      const querySnap = await getDocs(q);

      if (!querySnap.empty) {
        const orderDoc = querySnap.docs[0];
        const orderData = orderDoc.data();
        
        if (orderData.customerPhone === trackPhone.trim() || 
            orderData.customerPhone.includes(trackPhone.trim().slice(-9))) {
          setTrackOrder({ ...orderData, id: orderDoc.id });
          setTrackSearched(true);
        } else {
          setTrackError("Order found but phone number doesn't match.");
          setTrackSearched(true);
        }
      } else {
        setTrackError("Order not found. Please check your order number.");
        setTrackSearched(true);
      }
    } catch (err: any) {
      console.error("Error searching order:", err);
      setTrackError("Failed to search order. Please try again.");
    } finally {
      setTrackLoading(false);
    }
  };

  const contactSellerTrack = () => {
    const cleanTenantId = tenantId.replace('tenant_', '');
    const phone = cleanTenantId.replace(/[^0-9]/g, '');
    const message = `Hi, I want to check on my order ${trackOrderNumber}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const switchToOrder = () => setActiveTab("order");
  const switchToTrack = () => setActiveTab("track");

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: 16 }}>
        <div style={{ textAlign: "center", background: "white", borderRadius: 20, padding: 32, maxWidth: 320, width: "100%" }}>
          <div style={{ width: 60, height: 60, border: "4px solid #e2e8f0", borderTopColor: "#25D366", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }}></div>
          <p style={{ color: "#1e293b", fontWeight: 600 }}>Loading product...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "#f8fafc" }}>
        <div style={{ background: "white", borderRadius: 20, padding: 32, textAlign: "center", maxWidth: 400, width: "100%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
          <div style={{ width: 64, height: 64, background: "#fee2e2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28, color: "#ef4444" }}>
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: "#1e293b" }}>Oops!</h2>
          <p style={{ color: "#64748b" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (ordered) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "#f8fafc" }}>
        <div style={{ background: "white", borderRadius: 20, padding: 32, textAlign: "center", maxWidth: 400, width: "100%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
          <div style={{ width: 80, height: 80, background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 36, color: "white", boxShadow: "0 10px 30px rgba(16,185,129,0.3)" }}>
            <i className="fas fa-check"></i>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: "#1e293b" }}>Order Confirmed!</h2>
          <p style={{ color: "#64748b", marginBottom: 20 }}>Thank you for your purchase. We've sent the confirmation to your WhatsApp.</p>
          
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 20, border: "2px dashed #25D366" }}>
            <div style={{ fontSize: 14, color: "#64748b", marginBottom: 4 }}>Order Number</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#25D366" }}>#{orderNumber}</div>
          </div>

          <button 
            onClick={continueToWhatsApp}
            style={{ width: "100%", padding: 16, background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 12px rgba(37,211,102,0.3)", marginBottom: 12 }}
          >
            <i className="fab fa-whatsapp"></i>
            Continue to WhatsApp
          </button>

          <button 
            onClick={goToTrackOrder}
            style={{ width: "100%", padding: 16, background: "white", color: "#1e293b", border: "2px solid #e2e8f0", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <i className="fas fa-search"></i>
            Track My Order
          </button>
        </div>
      </div>
    );
  }

  const productEmoji = product?.image ? "" : (product?.category === "electronics" ? "📱" : product?.category === "footwear" ? "👟" : product?.category === "clothing" ? "👕" : product?.category === "beauty" ? "💄" : product?.category === "furniture" ? "🛋️" : product?.category === "food" ? "🍎" : product?.category === "sports" ? "🏋️" : product?.category === "toys" ? "🧸" : "📦");
  const currentStock = getVariantStock();
  const total = getBasePrice() * quantity + deliveryCost;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: 16, display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 480, background: "white", borderRadius: 20, overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", animation: "slideUp 0.4s ease" }}>
        
        {/* Tab Navigation */}
        {productId && (
          <div style={{ display: "flex", background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
            <button
              onClick={switchToOrder}
              style={{ 
                flex: 1, 
                padding: 16, 
                border: "none", 
                background: activeTab === "order" ? "white" : "transparent",
                color: activeTab === "order" ? "#25D366" : "#64748b",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
                borderBottom: activeTab === "order" ? "3px solid #25D366" : "3px solid transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
            >
              <i className="fas fa-shopping-cart"></i>
              Order Now
            </button>
            <button
              onClick={switchToTrack}
              style={{ 
                flex: 1, 
                padding: 16, 
                border: "none", 
                background: activeTab === "track" ? "white" : "transparent",
                color: activeTab === "track" ? "#25D366" : "#64748b",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
                borderBottom: activeTab === "track" ? "3px solid #25D366" : "3px solid transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
            >
              <i className="fas fa-search"></i>
              Track Order
            </button>
          </div>
        )}

        {activeTab === "track" ? (
          /* Track Order Tab */
          <div>
            <div style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)", color: "white", padding: 24, textAlign: "center" }}>
              <div style={{ width: 64, height: 64, background: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>
                <i className="fas fa-truck"></i>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Track Your Order</h2>
              <p style={{ opacity: 0.9, fontSize: 14 }}>Enter your order details to check status</p>
            </div>

            {trackSearched && trackOrder ? (
              <div style={{ padding: 24 }}>
                {(() => {
                  const statusInfo = getTrackStatusInfo(trackOrder.status);
                  return (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: 20, background: statusInfo.bg, borderRadius: 12, marginBottom: 24 }}>
                        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: statusInfo.color }}>
                          <i className={`fas ${statusInfo.icon}`}></i>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{statusInfo.label}</div>
                          <div style={{ fontSize: 14, color: "#64748b" }}>{statusInfo.message}</div>
                        </div>
                      </div>

                      <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 24 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Order Details</div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
                          <span style={{ color: "#64748b" }}>Order #</span>
                          <span style={{ fontWeight: 600, color: "#1e293b" }}>{trackOrder.orderNumber}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
                          <span style={{ color: "#64748b" }}>Product</span>
                          <span style={{ fontWeight: 600, color: "#1e293b" }}>{trackOrder.productName}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
                          <span style={{ color: "#64748b" }}>Quantity</span>
                          <span style={{ fontWeight: 600, color: "#1e293b" }}>{trackOrder.quantity}</span>
                        </div>
                        <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700 }}>
                          <span style={{ color: "#1e293b" }}>Total</span>
                          <span style={{ color: "#25D366" }}>{CURRENCY_SYMBOL}{trackOrder.total?.toLocaleString() || trackOrder.total}</span>
                        </div>
                      </div>

                      <button 
                        onClick={contactSellerTrack}
                        style={{ width: "100%", padding: 16, background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)", color: "white", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}
                      >
                        <i className="fab fa-whatsapp"></i>
                        Contact Seller
                      </button>
                      
                      <button 
                        onClick={() => { setTrackSearched(false); setTrackOrder(null); setTrackOrderNumber(""); setTrackPhone(""); }}
                        style={{ width: "100%", padding: 16, background: "white", color: "#64748b", border: "2px solid #e2e8f0", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                      >
                        <i className="fas fa-search"></i>
                        Track Another Order
                      </button>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div style={{ padding: 24 }}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 8, color: "#1e293b" }}>Order Number <span style={{ color: "#ef4444" }}>*</span></label>
                  <input 
                    type="text" 
                    value={trackOrderNumber}
                    onChange={(e) => setTrackOrderNumber(e.target.value)}
                    placeholder="ORD-123456"
                    style={{ width: "100%", padding: 16, border: `2px solid ${trackError && !trackOrderNumber.trim() ? "#ef4444" : "#e2e8f0"}`, borderRadius: 8, fontSize: 16, outline: "none", background: "white" }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 8, color: "#1e293b" }}>Phone Number <span style={{ color: "#ef4444" }}>*</span></label>
                  <input 
                    type="tel" 
                    value={trackPhone}
                    onChange={(e) => setTrackPhone(e.target.value)}
                    placeholder="+254 712 345 678"
                    style={{ width: "100%", padding: 16, border: `2px solid ${trackError && !trackPhone.trim() ? "#ef4444" : "#e2e8f0"}`, borderRadius: 8, fontSize: 16, outline: "none", background: "white" }}
                  />
                </div>

                {trackError && (
                  <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8, padding: 12, marginBottom: 16, color: "#dc2626", fontSize: 14 }}>
                    <i className="fas fa-exclamation-circle"></i> {trackError}
                  </div>
                )}

                <button 
                  onClick={searchTrackOrder}
                  disabled={trackLoading}
                  style={{ 
                    width: "100%", 
                    padding: 16, 
                    background: trackLoading ? "#94a3b8" : "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                    color: "white", 
                    border: "none", 
                    borderRadius: 12, 
                    fontSize: 16, 
                    fontWeight: 700, 
                    cursor: trackLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8
                  }}
                >
                  {trackLoading ? (
                    <>
                      <div style={{ width: 20, height: 20, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-search"></i>
                      Track Order
                    </>
                  )}
                </button>
              </div>
            )}

            {productId && (
              <div style={{ padding: "0 24px 24px" }}>
                <button 
                  onClick={switchToOrder}
                  style={{ width: "100%", padding: 16, background: "white", color: "#25D366", border: "2px solid #25D366", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  <i className="fas fa-shopping-bag"></i>
                  Want to Order Instead?
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Order Tab */
          <>
            {/* Header */}
            <div style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)", color: "white", padding: 24, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 50, height: 50, background: "white", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
              {productEmoji || "📦"}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>My Store</div>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Complete Your Order</h1>
          <p style={{ opacity: 0.9, fontSize: 15 }}>Select your preferences and we'll deliver to your door</p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.2)", padding: "8px 16px", borderRadius: 50, fontSize: 14, fontWeight: 600, marginTop: 16 }}>
            <i className="fas fa-lock"></i>
            <span>Secure Checkout</span>
          </div>
        </div>

        {/* Progress Steps */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: 24, background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1, position: "relative" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "white", boxShadow: "0 4px 12px rgba(37,211,102,0.4)" }}>1</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#25D366" }}>Product</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1, position: "relative" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#64748b" }}>2</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Details</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1, position: "relative" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#64748b" }}>3</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Payment</div>
          </div>
        </div>

        {/* Product Section */}
        <div style={{ padding: 24, borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", gap: 16, background: "#f8fafc", borderRadius: 12, padding: 16, border: "1px solid #e2e8f0" }}>
            {product?.image ? (
              <img src={product.image} alt={product.name} style={{ width: 100, height: 100, borderRadius: 8, objectFit: "cover" }} />
            ) : (
              <div style={{ width: 100, height: 100, background: "linear-gradient(135deg, #DCF8C6 0%, #e0e7ff 100%)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>{productEmoji || "📦"}</div>
            )}
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: "#1e293b" }}>{product?.name}</h2>
              {product?.description && (
                <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.5, marginBottom: 12 }}>{product.description}</p>
              )}
              <div>
                <span style={{ fontSize: 24, fontWeight: 800, color: "#25D366" }}>{CURRENCY_SYMBOL}{getBasePrice().toLocaleString()}</span>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, marginTop: 8, color: currentStock > 5 ? "#10b981" : currentStock > 0 ? "#f59e0b" : "#ef4444" }}>
                <i className={`fas ${currentStock > 0 ? "fa-check-circle" : "fa-times-circle"}`}></i>
                <span>{currentStock > 0 ? `In Stock - ${currentStock} available` : "Out of Stock"}</span>
              </div>
            </div>
          </div>

          {/* Selected Variant Display */}
          {Object.keys(selectedSpecs).length > 0 && (
            <div style={{ background: "linear-gradient(135deg, rgba(37,211,102,0.1) 0%, rgba(18,140,126,0.1) 100%)", border: "2px solid #25D366", borderRadius: 12, padding: 16, marginTop: 16, display: "block" }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: "#128C7E" }}>
                <i className="fas fa-check-circle"></i> Selected Configuration
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Object.entries(selectedSpecs).map(([key, value]) => (
                  <span key={key} style={{ background: "white", padding: "6px 14px", borderRadius: 20, fontSize: 14, fontWeight: 600, color: "#1e293b", border: "1px solid #e2e8f0" }}>
                    <i className="fas fa-check" style={{ color: "#10b981", marginRight: 6 }}></i>
                    {key.replace(/_/g, " ")}: {value}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Specifications Section */}
        {product?.filters && Object.keys(product.filters).length > 0 && (
          <div style={{ padding: 24, borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Select Options</div>
              <span style={{ fontSize: 14, color: "#64748b" }}>Choose your preferences</span>
            </div>

            {Object.entries(product.filters).map(([key, options]) => {
              if (!Array.isArray(options) || options.length <= 1) return null;
              
              const isColorKey = key.toLowerCase().includes('color');
              
              return (
                <div key={key} style={{ marginBottom: 24 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12, display: "flex", alignItems: "center", gap: 8, color: "#1e293b" }}>
                    <i className={`fas ${isColorKey ? "fa-palette" : "fa-cogs"}`} style={{ color: "#25D366" }}></i>
                    {key.replace(/_/g, " ")}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                    {options.map((option) => {
                      if (isColorKey) {
                        return (
                          <div key={option} style={{ textAlign: "center" }}>
                            <div 
                              onClick={() => toggleSpec(key, option)}
                              style={{ 
                                width: 48, height: 48, borderRadius: "50%", 
                                background: option.toLowerCase() === 'white' ? '#f5f5f5' : option.toLowerCase(),
                                border: `3px solid ${selectedSpecs[key] === option ? "#25D366" : "#e2e8f0"}`,
                                cursor: "pointer", 
                                boxShadow: selectedSpecs[key] === option ? "0 0 0 4px rgba(37,211,102,0.3)" : "0 2px 8px rgba(0,0,0,0.1)",
                                position: "relative"
                              }}
                            >
                              {selectedSpecs[key] === option && (
                                <i className="fas fa-check" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: option.toLowerCase() === 'white' ? "#1e293b" : "white", fontSize: 16, textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}></i>
                              )}
                            </div>
                            <div style={{ fontSize: 12, textAlign: "center", marginTop: 6, fontWeight: 600, color: "#64748b" }}>{option}</div>
                          </div>
                        );
                      }
                      
                      return (
                        <button
                          key={option}
                          onClick={() => toggleSpec(key, option)}
                          style={{ 
                            padding: "14px 20px", 
                            borderRadius: 50, 
                            border: `2px solid ${selectedSpecs[key] === option ? "#25D366" : "#e2e8f0"}`,
                            background: selectedSpecs[key] === option ? "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" : "white",
                            color: selectedSpecs[key] === option ? "white" : "#1e293b",
                            fontWeight: 600,
                            fontSize: 15,
                            cursor: "pointer",
                            transition: "all 0.2s",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            boxShadow: selectedSpecs[key] === option ? "0 4px 12px rgba(37,211,102,0.3)" : "none"
                          }}
                        >
                          {selectedSpecs[key] === option && <i className="fas fa-check" style={{ fontSize: 12 }}></i>}
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {errors.specs && <p style={{ color: "#ef4444", fontSize: 14, marginTop: 8 }}><i className="fas fa-exclamation-circle"></i> Please select all options</p>}
          </div>
        )}

        {/* Quantity Section */}
        <div style={{ padding: 24, borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Quantity</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#f8fafc", padding: 12, borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: quantity <= 1 ? "#f1f5f9" : "white", color: quantity <= 1 ? "#cbd5e1" : "#1e293b", fontSize: 16, cursor: quantity <= 1 ? "not-allowed" : "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
              >
                <i className="fas fa-minus"></i>
              </button>
              <span style={{ fontSize: 20, fontWeight: 700, minWidth: 30, textAlign: "center" }}>{quantity}</span>
              <button 
                onClick={() => setQuantity(Math.min(10, currentStock, quantity + 1))}
                disabled={quantity >= Math.min(10, currentStock)}
                style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: quantity >= Math.min(10, currentStock) ? "#f1f5f9" : "white", color: quantity >= Math.min(10, currentStock) ? "#cbd5e1" : "#1e293b", fontSize: 16, cursor: quantity >= Math.min(10, currentStock) ? "not-allowed" : "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>
            <span style={{ fontSize: 14, color: "#64748b" }}>Max: 10</span>
          </div>
        </div>

        {/* Order Summary */}
        <div style={{ padding: 24, background: "linear-gradient(135deg, rgba(37,211,102,0.05) 0%, rgba(118,75,162,0.05) 100%)", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#1e293b" }}>Order Summary</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 15 }}>
            <span style={{ color: "#64748b" }}>Subtotal</span>
            <span style={{ fontWeight: 600 }}>{CURRENCY_SYMBOL}{(getBasePrice() * quantity).toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 15 }}>
            <span style={{ color: "#64748b" }}>Shipping</span>
            <span style={{ fontWeight: 600 }}>{deliveryCost === 0 ? "FREE" : CURRENCY_SYMBOL + deliveryCost.toLocaleString()}</span>
          </div>
          <div style={{ borderTop: "2px solid #e2e8f0", marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 20 }}>
            <span>Total</span>
            <span style={{ color: "#25D366", fontSize: 24 }}>{CURRENCY_SYMBOL}{total.toLocaleString()}</span>
          </div>
        </div>

        {/* Customer Details */}
        <div style={{ padding: 24, borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "#1e293b", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>Delivery Details</span>
            <span style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>Where should we deliver?</span>
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
            <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 8, color: "#1e293b" }}>Delivery Address <span style={{ color: "#ef4444" }}>*</span></label>
            <input 
              type="text" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Kimathi Street, Nairobi"
              style={{ width: "100%", padding: 16, border: `2px solid ${errors.address ? "#ef4444" : "#e2e8f0"}`, borderRadius: 8, fontSize: 16, outline: "none", background: "white" }}
            />
            {errors.address && <p style={{ color: "#ef4444", fontSize: 14, marginTop: 8 }}><i className="fas fa-exclamation-circle"></i> Please enter your delivery address</p>}
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

        {/* Delivery Options */}
        <div style={{ padding: 24, borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#1e293b" }}>Delivery Method</div>
          
          {(product?.shippingMethods?.length ? product.shippingMethods : [
            { id: "standard", name: "Standard Delivery", price: 500 },
            { id: "express", name: "Express Delivery", price: 1000 },
            { id: "pickup", name: "Store Pickup", price: 0 }
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
                  {option.id === "pickup" ? "Available today after 2PM" : option.id === "express" ? "1-2 business days" : "3-5 business days"}
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 18, color: option.price === 0 ? "#10b981" : "#25D366" }}>
                {option.price === 0 ? "FREE" : CURRENCY_SYMBOL + option.price.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Payment Methods */}
        <div style={{ padding: 24, borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#1e293b" }}>Payment Method</div>
          
          {(product?.paymentMethods?.length ? product.paymentMethods : [
            { id: "mpesa", name: "M-Pesa", details: "Pay via M-Pesa mobile money" },
            { id: "cod", name: "Cash on Delivery", details: "Pay when you receive the item" },
            { id: "bank", name: "Bank Transfer", details: "Direct bank transfer" }
          ]).map((option) => (
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
              <div style={{ width: 48, height: 48, background: option.id === "mpesa" ? "#00A650" : option.id === "bank" ? "#64748b" : "#10b981", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "white" }}>
                <i className={`fas ${option.id === "mpesa" ? "fa-mobile-alt" : option.id === "bank" ? "fa-university" : "fa-money-bill-wave"}`}></i>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{option.name}</div>
                <div style={{ fontSize: 14, color: "#64748b" }}>{option.details}</div>
              </div>
            </div>
          ))}

          {/* Payment Details & Message */}
          {paymentMethod !== "cod" && (
            <div style={{ marginTop: 16, padding: 16, background: "#f8fafc", borderRadius: 12, border: "2px solid #e2e8f0" }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: "#1e293b" }}>
                {paymentMethod === "mpesa" ? "M-Pesa Payment Instructions" : "Bank Transfer Details"}
              </div>
              <div style={{ fontSize: 14, color: "#64748b", whiteSpace: "pre-wrap", marginBottom: 16 }}>
                {product?.paymentMethods?.find(p => p.id === paymentMethod)?.details || 
                 (paymentMethod === "mpesa" ? "Enter your M-Pesa number and follow prompts" : "Bank: Example Bank\nAccount: 1234567890")}
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: "#1e293b" }}>
                Enter Payment Details <span className="text-red-500">*</span>
              </div>
              <input
                type="text"
                placeholder={paymentMethod === "mpesa" ? "Enter M-Pesa transaction ID" : "Enter transaction/reference number"}
                value={paymentDetails}
                onChange={(e) => setPaymentDetails(e.target.value)}
                style={{ width: "100%", padding: 12, border: "2px solid #e2e8f0", borderRadius: 8, fontSize: 14, marginBottom: 12 }}
              />
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

        {/* Order Notes */}
        <div style={{ padding: 24, borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#1e293b" }}>Order Notes (Optional)</div>
          <textarea 
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            placeholder="Any special instructions for delivery? E.g., Call when you arrive, Leave with security, etc."
            style={{ width: "100%", padding: 16, border: "2px solid #e2e8f0", borderRadius: 8, fontSize: 15, resize: "vertical", minHeight: 100, outline: "none", fontFamily: "inherit" }}
          />
        </div>

        {/* Trust Badges */}
        <div style={{ display: "flex", justifyContent: "center", gap: 24, padding: 16, background: "#f8fafc", fontSize: 14, color: "#64748b" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <i className="fas fa-shield-alt" style={{ color: "#10b981" }}></i>
            <span>Secure Payment</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <i className="fas fa-undo" style={{ color: "#10b981" }}></i>
            <span>Easy Returns</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <i className="fas fa-headset" style={{ color: "#10b981" }}></i>
            <span>24/7 Support</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ padding: 24, background: "white", borderTop: "1px solid #e2e8f0", position: "sticky", bottom: 0, boxShadow: "0 -4px 20px rgba(0,0,0,0.1)" }}>
          <button 
            onClick={contactSeller}
            style={{ width: "100%", padding: 18, background: "white", color: "#1e293b", border: "2px solid #e2e8f0", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <i className="fab fa-whatsapp"></i>
            Ask Seller a Question
          </button>
          <button 
            onClick={handleOrder}
            disabled={ordering || currentStock === 0}
            style={{ 
              width: "100%", 
              padding: 18, 
              background: ordering || currentStock === 0 ? "#94a3b8" : "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
              color: "white", 
              border: "none", 
              borderRadius: 12, 
              fontSize: 18, 
              fontWeight: 700, 
              cursor: ordering || currentStock === 0 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              boxShadow: "0 4px 12px rgba(37,211,102,0.3)"
            }}
          >
            {ordering ? (
              <>
                <div style={{ width: 20, height: 20, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
                Processing...
              </>
            ) : (
              <>
                <i className="fas fa-lock"></i>
                Place Order - {CURRENCY_SYMBOL}{total.toLocaleString()}
              </>
            )}
          </button>
        </div>

        </>
        )}

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
        <div style={{ width: 60, height: 60, border: "4px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      </div>
    }>
      <OrderPageContent />
    </Suspense>
  );
}