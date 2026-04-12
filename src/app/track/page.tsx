"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

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

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  productName: string;
  productImage?: string;
  basePrice: number;
  selectedSpecs?: Record<string, string>;
  quantity: number;
  deliveryCost: number;
  subtotal: number;
  total: number;
  paymentMethod: string;
  deliveryMethod: string;
  status: string;
  createdAt: any;
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant") || "";
  const initialOrderNumber = searchParams.get("orderNumber") || "";
  const initialPhone = searchParams.get("phone") || "";
  
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [customerPhone, setCustomerPhone] = useState(initialPhone);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialOrderNumber && initialPhone) {
      searchOrderAuto(initialOrderNumber, initialPhone);
    }
  }, []);

  const searchOrderAuto = async (orderNum: string, phone: string) => {
    setLoading(true);
    try {
      const app = getFirebaseApp();
      if (!app) {
        setLoading(false);
        return;
      }
      const db = getFirestore(app);
      
      // Query by orderNumber within tenant's orders
      const q = query(
        collection(db, "orders"),
        where("tenantId", "==", tenantParam),
        where("orderNumber", "==", orderNum)
      );
      const querySnap = await getDocs(q);
      
      if (!querySnap.empty) {
        const orderDoc = querySnap.docs[0];
        const orderData = orderDoc.data() as Order;
        
        // Verify phone matches
        if (orderData.customerPhone === phone || 
            (phone && orderData.customerPhone && orderData.customerPhone.includes(phone.slice(-9)))) {
          setOrder({ ...orderData, id: orderDoc.id } as Order);
          setSearched(true);
        }
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (createdAt: any) => {
    if (!createdAt) return "N/A";
    try {
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return "N/A";
    }
  };

  const formatTime = (createdAt: any) => {
    if (!createdAt) return "";
    try {
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "";
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; bg: string; icon: string; message: string }> = {
      pending: { 
        label: "Pending", 
        color: "text-[#f59e0b]", 
        bg: "bg-[rgba(245,158,11,0.1)]",
        icon: "fa-clock",
        message: "Awaiting payment confirmation"
      },
      processing: { 
        label: "Processing", 
        color: "text-[#3b82f6]", 
        bg: "bg-[rgba(59,130,246,0.1)]",
        icon: "fa-cog",
        message: "Your order is being prepared"
      },
      shipped: { 
        label: "Shipped", 
        color: "text-[#8b5cf6]", 
        bg: "bg-[rgba(139,92,246,0.1)]",
        icon: "fa-shipping-fast",
        message: "Your order is on its way"
      },
      delivered: { 
        label: "Delivered", 
        color: "text-[#10b981]", 
        bg: "bg-[rgba(16,185,129,0.1)]",
        icon: "fa-check-circle",
        message: "Order delivered successfully"
      },
      cancelled: { 
        label: "Cancelled", 
        color: "text-[#ef4444]", 
        bg: "bg-[rgba(239,68,68,0.1)]",
        icon: "fa-times-circle",
        message: "Order has been cancelled"
      }
    };
    return statusMap[status] || statusMap.pending;
  };

  const formatCurrency = (amount: number) => {
    return "KES " + amount.toLocaleString();
  };

  const searchOrder = async () => {
    if (!orderNumber.trim() || !customerPhone.trim()) {
      setError("Please enter both order number and phone number");
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const app = getFirebaseApp();
      if (!app) {
        setError("Unable to connect. Please try again.");
        setLoading(false);
        return;
      }

      const db = getFirestore(app);
      
      // Query by orderNumber within tenant's orders
      const q = query(
        collection(db, "orders"),
        where("tenantId", "==", tenantParam),
        where("orderNumber", "==", orderNumber.trim())
      );
      const querySnap = await getDocs(q);

      if (!querySnap.empty) {
        const orderDoc = querySnap.docs[0];
        const orderData = orderDoc.data() as Order;
        
        // Verify phone number matches
        if (orderData.customerPhone === customerPhone.trim() || 
            orderData.customerPhone.includes(customerPhone.trim().slice(-9))) {
          setOrder({ ...orderData, id: orderDoc.id } as Order);
          setSearched(true);
        } else {
          setError("Order number found but phone number doesn't match. Please verify.");
          setSearched(true);
        }
      } else {
        setError("Order not found. Please check your order number and try again.");
        setSearched(true);
      }
    } catch (err: any) {
      console.error("Error searching order:", err);
      setError("Failed to search order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const contactSeller = () => {
    const cleanTenantId = tenantParam.replace('tenant_', '');
    const phone = cleanTenantId.replace(/[^0-9]/g, '');
    const message = `Hi, I want to check on my order ${searchParams.get("orderNumber") || orderNumber}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Show success page after order is placed
  if (searchParams.get("orderNumber")) {
    const successOrderNumber = searchParams.get("orderNumber") || "";
    
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: 16, display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 480, background: "white", borderRadius: 20, overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
          <div style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)", color: "white", padding: 32, textAlign: "center" }}>
            <div style={{ width: 80, height: 80, background: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 36 }}>
              <i className="fas fa-check"></i>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Order Placed Successfully!</h2>
            <p style={{ opacity: 0.9, fontSize: 15 }}>Thank you for your purchase</p>
          </div>
          
          <div style={{ padding: 24 }}>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: 20, marginBottom: 24, border: "2px dashed #25D366" }}>
              <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>Your Order Number</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#25D366" }}>#{successOrderNumber}</div>
              <p style={{ fontSize: 13, color: "#64748b", marginTop: 12 }}>Save this number to track your order</p>
            </div>

            <button 
              onClick={contactSeller}
              style={{ width: "100%", padding: 16, background: "white", color: "#1e293b", border: "2px solid #e2e8f0", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <i className="fab fa-whatsapp"></i>
              Contact Seller About Order
            </button>
            
            <a 
              href={`/track?tenant=${tenantParam}`}
              style={{ width: "100%", padding: 16, background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)", color: "white", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "block", textAlign: "center", textDecoration: "none" }}
            >
              <i className="fas fa-search"></i> Track My Order
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Main track order page
  if (searched && order) {
    const statusInfo = getStatusInfo(order.status);
    
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: 16, display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 480, background: "white", borderRadius: 20, overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
          <div style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)", color: "white", padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 4 }}>Order Status</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>#{order.orderNumber}</div>
          </div>

          <div style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, padding: 20, background: `${statusInfo.bg}`, borderRadius: 12, marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: statusInfo.color.replace("text-", "") }}>
                <i className={`fas ${statusInfo.icon}`} style={{ color: statusInfo.color === "text-[#f59e0b]" ? "#f59e0b" : statusInfo.color === "text-[#3b82f6]" ? "#3b82f6" : statusInfo.color === "text-[#8b5cf6]" ? "#8b5cf6" : statusInfo.color === "text-[#10b981]" ? "#10b981" : "#ef4444" }}></i>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{statusInfo.label}</div>
                <div style={{ fontSize: 14, color: "#64748b" }}>{statusInfo.message}</div>
              </div>
            </div>

            <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Order Details</div>
              
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
                <span style={{ color: "#64748b" }}>Product</span>
                <span style={{ fontWeight: 600, color: "#1e293b" }}>{order.productName}</span>
              </div>
              
              {order.selectedSpecs && Object.keys(order.selectedSpecs).length > 0 && (
                <div style={{ marginBottom: 12, fontSize: 14 }}>
                  <span style={{ color: "#64748b" }}>Options: </span>
                  <span style={{ fontWeight: 600, color: "#1e293b" }}>
                    {Object.entries(order.selectedSpecs).map(([key, val]) => `${key}: ${val}`).join(", ")}
                  </span>
                </div>
              )}
              
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
                <span style={{ color: "#64748b" }}>Quantity</span>
                <span style={{ fontWeight: 600, color: "#1e293b" }}>{order.quantity}</span>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
                <span style={{ color: "#64748b" }}>Delivery</span>
                <span style={{ fontWeight: 600, color: "#1e293b" }}>{order.deliveryMethod}</span>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
                <span style={{ color: "#64748b" }}>Payment</span>
                <span style={{ fontWeight: 600, color: "#1e293b" }}>{order.paymentMethod}</span>
              </div>
              
              <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700 }}>
                <span style={{ color: "#1e293b" }}>Total</span>
                <span style={{ color: "#25D366" }}>{formatCurrency(order.total)}</span>
              </div>
            </div>

            <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Delivery Address</div>
              <div style={{ fontSize: 14, color: "#64748b" }}>{order.customerAddress || "Not provided"}</div>
            </div>

            <button 
              onClick={contactSeller}
              style={{ width: "100%", padding: 16, background: "white", color: "#1e293b", border: "2px solid #e2e8f0", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <i className="fab fa-whatsapp"></i>
              Contact Seller
            </button>
            
            <button 
              onClick={() => { setSearched(false); setOrder(null); setOrderNumber(""); setCustomerPhone(""); }}
              style={{ width: "100%", padding: 16, background: "white", color: "#64748b", border: "2px solid #e2e8f0", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <i className="fas fa-search"></i>
              Track Another Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: 16, display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 480, background: "white", borderRadius: 20, overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
        <div style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)", color: "white", padding: 32, textAlign: "center" }}>
          <div style={{ width: 64, height: 64, background: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>
            <i className="fas fa-truck"></i>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Track Your Order</h2>
          <p style={{ opacity: 0.9, fontSize: 15 }}>Enter your order details to check status</p>
        </div>

        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 8, color: "#1e293b" }}>Order Number <span style={{ color: "#ef4444" }}>*</span></label>
            <input 
              type="text" 
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="ORD-123456"
              style={{ width: "100%", padding: 16, border: `2px solid ${error && !orderNumber.trim() ? "#ef4444" : "#e2e8f0"}`, borderRadius: 8, fontSize: 16, outline: "none", background: "white" }}
            />
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Check your order confirmation message</p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 8, color: "#1e293b" }}>Phone Number <span style={{ color: "#ef4444" }}>*</span></label>
            <input 
              type="tel" 
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+254 712 345 678"
              style={{ width: "100%", padding: 16, border: `2px solid ${error && !customerPhone.trim() ? "#ef4444" : "#e2e8f0"}`, borderRadius: 8, fontSize: 16, outline: "none", background: "white" }}
            />
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Phone number used when placing the order</p>
          </div>

          {error && (
            <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8, padding: 12, marginBottom: 16, color: "#dc2626", fontSize: 14 }}>
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          <button 
            onClick={searchOrder}
            disabled={loading}
            style={{ 
              width: "100%", 
              padding: 16, 
              background: loading ? "#94a3b8" : "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
              color: "white", 
              border: "none", 
              borderRadius: 12, 
              fontSize: 16, 
              fontWeight: 700, 
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8
            }}
          >
            {loading ? (
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

        <div style={{ padding: 16, background: "#f8fafc", textAlign: "center", fontSize: 13, color: "#64748b" }}>
          Need help? <a href="#" onClick={(e) => { e.preventDefault(); contactSeller(); }} style={{ color: "#25D366", textDecoration: "none", fontWeight: 600 }}>Contact Seller</a>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
        <div style={{ width: 60, height: 60, border: "4px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      </div>
    }>
      <TrackOrderContent />
    </Suspense>
  );
}