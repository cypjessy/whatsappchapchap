"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  image?: string;
  category?: string;
  categoryName?: string;
  subcategory?: string;
  sizes?: string[];
  colors?: string[];
  filters?: Record<string, string>;
}

function OrderPageContent() {
  const searchParams = useSearchParams();
  
  const tenantId = searchParams.get("tenant") || "";
  const productId = searchParams.get("product") || "";
  const phone = searchParams.get("phone") || "";
  
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState(phone);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState("");

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
          const { id: _, ...rest } = productSnap.data() as Product & { id: string };
          setProduct({ id: productSnap.id, ...rest });
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

  const handleOrder = async () => {
    if (!product) return;
    
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert("Please select a size");
      return;
    }
    
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      alert("Please select a color");
      return;
    }
    
    if (!customerName.trim()) {
      alert("Please enter your name");
      return;
    }
    
    if (!address.trim()) {
      alert("Please enter delivery address");
      return;
    }
    
    setOrdering(true);
    
    try {
      const app = getFirebaseApp()!;
      const db = getFirestore(app);
      
      const orderNum = "ORD-" + Math.floor(1000 + Math.random() * 9000);
      const total = product.price * quantity;
      const tax = Math.round(total * 0.16);
      const grandTotal = total + tax;
      
      await addDoc(collection(db, "orders"), {
        tenantId,
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        price: product.price,
        selectedSize: selectedSize || null,
        selectedColor: selectedColor || null,
        selectedOptions,
        quantity,
        customerPhone: customerPhone,
        customerName: customerName.trim(),
        deliveryAddress: address.trim(),
        subtotal: total,
        tax,
        total: grandTotal,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      setOrderNumber(orderNum);
      setOrdered(true);
    } catch (err: any) {
      console.error("Error placing order:", err);
      alert("Failed to place order. Please try again.");
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 60, height: 60, border: "4px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }}></div>
          <p style={{ color: "white", fontWeight: 600 }}>Loading product...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "#f0f2f5" }}>
        <div style={{ background: "white", borderRadius: 16, padding: 32, textAlign: "center", maxWidth: 400, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <div style={{ width: 64, height: 64, background: "#fee2e2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28, color: "#ef4444" }}>
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Oops!</h2>
          <p style={{ color: "#64748b" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (ordered) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "#f0f2f5" }}>
        <div style={{ background: "white", borderRadius: 16, padding: 32, textAlign: "center", maxWidth: 400, width: "100%", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <div style={{ width: 80, height: 80, background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 36, color: "white" }}>
            <i className="fas fa-check"></i>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Order Placed!</h2>
          <p style={{ color: "#64748b", marginBottom: 20 }}>We will contact you on WhatsApp shortly</p>
          
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 14, color: "#64748b", marginBottom: 4 }}>Order Number</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#25D366" }}>#{orderNumber}</div>
          </div>

          <button 
            onClick={() => { setOrdered(false); setCustomerName(""); setAddress(""); setQuantity(1); }}
            style={{ width: "100%", padding: 14, background: "#f8fafc", color: "#1e293b", border: "2px solid #e2e8f0", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" }}
          >
            Place Another Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", padding: "20px", maxWidth: 500, margin: "0 auto" }}>
      
      {/* Product Image */}
      {product?.image && (
        <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
          <img 
            src={product.image} 
            alt={product.name} 
            style={{ width: "100%", height: 280, objectFit: "cover" }} 
          />
        </div>
      )}
      
      {/* Product Info */}
      <div style={{ background: "white", borderRadius: 16, padding: 20, marginBottom: 20 }}>
        {product?.categoryName && (
          <div style={{ fontSize: 12, color: "#25D366", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>
            {product.categoryName} {product.subcategory ? `• ${product.subcategory}` : ""}
          </div>
        )}
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{product?.name}</h1>
        <p style={{ fontSize: 26, fontWeight: 800, color: "#25D366", marginBottom: 8 }}>
          {CURRENCY_SYMBOL}{(product?.price || 0).toLocaleString()}
        </p>
        {product?.description && (
          <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>{product.description}</p>
        )}
      </div>

      {/* Size Filter */}
      {product?.sizes && product.sizes.length > 0 && (
        <div style={{ background: "white", borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <p style={{ fontWeight: 700, marginBottom: 12 }}>Select Size:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                style={{ 
                  padding: "12px 20px", 
                  borderRadius: 24, 
                  border: `2px solid ${selectedSize === size ? "#25D366" : "#e2e8f0"}`,
                  background: selectedSize === size ? "#25D366" : "white",
                  color: selectedSize === size ? "white" : "#1e293b",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color Filter */}
      {product?.colors && product.colors.length > 0 && (
        <div style={{ background: "white", borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <p style={{ fontWeight: 700, marginBottom: 12 }}>Select Color:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {product.colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                style={{ 
                  padding: "12px 20px", 
                  borderRadius: 24, 
                  border: `2px solid ${selectedColor === color ? "#25D366" : "#e2e8f0"}`,
                  background: selectedColor === color ? "#25D366" : "white",
                  color: selectedColor === color ? "white" : "#1e293b",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  textTransform: "capitalize",
                  transition: "all 0.2s"
                }}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Filters from product spec fields */}
      {product?.filters && Object.keys(product.filters).length > 0 && (
        <div style={{ background: "white", borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <p style={{ fontWeight: 700, marginBottom: 12 }}>Select Options:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {Object.entries(product.filters).map(([key, value]) => {
              const options = String(value).split(",").map(v => v.trim()).filter(v => v);
              if (options.length <= 1) return null;
              
              return (
                <div key={key}>
                  <p style={{ fontSize: 13, color: "#64748b", marginBottom: 8, textTransform: "capitalize" }}>
                    {key.replace(/_/g, " ")}:
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {options.map((option) => (
                      <button
                        key={option}
                        onClick={() => setSelectedOptions({...selectedOptions, [key]: option})}
                        style={{ 
                          padding: "10px 16px", 
                          borderRadius: 20, 
                          border: `2px solid ${selectedOptions[key] === option ? "#25D366" : "#e2e8f0"}`,
                          background: selectedOptions[key] === option ? "#25D366" : "white",
                          color: selectedOptions[key] === option ? "white" : "#1e293b",
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div style={{ background: "white", borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <p style={{ fontWeight: 700, marginBottom: 12 }}>Quantity:</p>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button 
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid #e2e8f0", background: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, cursor: "pointer" }}
          >
            <i className="fas fa-minus"></i>
          </button>
          <span style={{ fontSize: 22, fontWeight: 800, minWidth: 40, textAlign: "center" }}>{quantity}</span>
          <button 
            onClick={() => setQuantity(quantity + 1)}
            style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid #e2e8f0", background: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, cursor: "pointer" }}
          >
            <i className="fas fa-plus"></i>
          </button>
        </div>
      </div>

      {/* Customer Details */}
      <div style={{ background: "white", borderRadius: 16, padding: 20, marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="text"
          placeholder="Your name *"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          style={{ width: "100%", padding: 14, border: "2px solid #e2e8f0", borderRadius: 12, fontSize: 16, outline: "none" }}
        />
        <input
          type="tel"
          placeholder="WhatsApp number"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          style={{ width: "100%", padding: 14, border: "2px solid #e2e8f0", borderRadius: 12, fontSize: 16, outline: "none" }}
        />
        <textarea
          placeholder="Delivery address *"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={{ width: "100%", padding: 14, border: "2px solid #e2e8f0", borderRadius: 12, fontSize: 16, outline: "none", minHeight: 80, resize: "none" }}
        />
      </div>

      {/* Order Summary */}
      <div style={{ background: "white", borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Order Summary</h3>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: "#64748b" }}>{product?.name} x{quantity}</span>
          <span style={{ fontWeight: 600 }}>{CURRENCY_SYMBOL}{((product?.price || 0) * quantity).toLocaleString()}</span>
        </div>
        {selectedSize && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#64748b" }}>
            <span>Size:</span>
            <span>{selectedSize}</span>
          </div>
        )}
        {selectedColor && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#64748b" }}>
            <span>Color:</span>
            <span style={{ textTransform: "capitalize" }}>{selectedColor}</span>
          </div>
        )}
        <div style={{ borderTop: "2px solid #e2e8f0", marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 18 }}>
          <span>Total</span>
          <span style={{ color: "#25D366" }}>{CURRENCY_SYMBOL}{((product?.price || 0) * quantity * 1.16).toLocaleString()}</span>
        </div>
      </div>

      {/* Order Button */}
      <button
        onClick={handleOrder}
        disabled={ordering}
        style={{ 
          width: "100%", 
          padding: 18, 
          background: ordering ? "#94a3b8" : "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
          color: "white", 
          border: "none", 
          borderRadius: 16, 
          fontSize: 18, 
          fontWeight: 700, 
          cursor: ordering ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          boxShadow: "0 4px 12px rgba(37,211,102,0.4)"
        }}
      >
        {ordering ? (
          <>
            <div style={{ width: 20, height: 20, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
            Processing...
          </>
        ) : (
          <>
            <i className="fas fa-shopping-bag"></i>
            Place Order - {CURRENCY_SYMBOL}{((product?.price || 0) * quantity * 1.16).toLocaleString()}
          </>
        )}
      </button>

      <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, marginTop: 16, marginBottom: 40 }}>
        We will confirm your order via WhatsApp
      </p>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" }}>
        <div style={{ width: 60, height: 60, border: "4px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      </div>
    }>
      <OrderPageContent />
    </Suspense>
  );
}