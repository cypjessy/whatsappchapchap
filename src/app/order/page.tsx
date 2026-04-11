"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, setDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged, User } from "firebase/auth";
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

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  variant: string;
  emoji: string;
  image?: string;
  filters?: Record<string, string>;
}

function OrderStorePage() {
  const searchParams = useSearchParams();
  
  const tenantIdParam = searchParams.get("tenant") || "";
  const productIdParam = searchParams.get("product") || "";
  const urlPhone = searchParams.get("phone") || "";
  const preSelectedQty = parseInt(searchParams.get("quantity") || "1", 10);
  
  const [tenantId, setTenantId] = useState(tenantIdParam);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(urlPhone);
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");
  
  // Customer form
  const [customerName, setCustomerName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [checkoutPhone, setCheckoutPhone] = useState(urlPhone);
  
  // Product modal
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedQty, setSelectedQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);

  useEffect(() => {
    if (!tenantId) {
      setError("Invalid store link");
      setLoading(false);
      return;
    }
    loadProducts();
  }, [tenantId]);

  const loadProducts = async () => {
    try {
      const app = getFirebaseApp();
      if (!app) {
        setError("Unable to connect. Please try again.");
        setLoading(false);
        return;
      }

      const db = getFirestore(app);
      
      // Get all products for this tenant
      const productsRef = collection(db, "products");
      const q = query(productsRef, where("tenantId", "==", tenantId));
      const snapshot = await getDocs(q);
      
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as any));
      
      // Extract unique categories
      const uniqueCategories = [...new Set(productsData.map((p: any) => p.category || "other"))];
      setCategories(uniqueCategories);
      
      setProducts(productsData);
      
      // If product ID is passed in URL, open product modal for selection
      if (productIdParam) {
        const product = productsData.find((p: any) => p.id === productIdParam);
        if (product) {
          openProductModal(product);
        }
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error("Error loading products:", err);
      setError("Failed to load products");
      setLoading(false);
    }
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      footwear: "👟",
      clothing: "👕",
      electronics: "📱",
      furniture: "🛋️",
      beauty: "💄",
      other: "📦"
    };
    return emojis[category] || "📦";
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === "all" || p.category === activeCategory;
    const matchesSearch = !searchTerm || 
      p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && i.variant === item.variant);
      if (existing) {
        return prev.map(i => 
          i.id === item.id && i.variant === item.variant
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  };

  const updateCartQty = (index: number, delta: number) => {
    setCart(prev => prev.map((item, i) => 
      i === index 
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    ));
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const openProductModal = (product: any) => {
    setSelectedProduct(product);
    setSelectedQty(1);
    setSelectedVariant(product.sizes?.[0] || product.colors?.[0] || "Default");
    setShowProductModal(true);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    
    addToCart({
      id: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedProduct.price || 0,
      quantity: selectedQty,
      variant: selectedVariant,
      emoji: getCategoryEmoji(selectedProduct.category),
      image: selectedProduct.image,
      filters: selectedProduct.filters || undefined
    });
    
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    if (!customerName || !deliveryAddress || !checkoutPhone) {
      alert("Please fill in your name, phone, and delivery address");
      return;
    }

    setPlacingOrder(true);
    
    try {
      const app = getFirebaseApp()!;
      const db = getFirestore(app);
      const auth = getAuth(app);
      
      let user = auth.currentUser;
      if (!user) {
        const result = await signInAnonymously(auth);
        user = result.user;
      }

      const orderNum = "ORD-" + Math.floor(1000 + Math.random() * 9000);
      const subtotal = cartTotal;
      const delivery = 0;
      const tax = Math.round(subtotal * 0.16);
      const total = subtotal + delivery + tax;

      const orderData = {
        id: orderNum,
        tenantId,
        customerId: user.uid,
        customerName,
        customerPhone: checkoutPhone,
        customerEmail: "",
        customerAddress: deliveryAddress,
        products: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          variant: item.variant,
          filters: item.filters
        })),
        subtotal,
        shipping: delivery,
        tax,
        discount: 0,
        total,
        paymentMethod,
        status: "pending",
        notes: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(collection(db, "orders")), orderData);
      
      setOrderNumber(orderNum);
      
      // Build WhatsApp message for seller
      let message = `*New Order ${orderNum}*\n\n`;
      message += `*Customer:* ${customerName}\n`;
      message += `*Phone:* ${checkoutPhone}\n`;
      message += `*Address:* ${deliveryAddress}\n\n`;
      message += `*Order Items:*\n`;
      
      cart.forEach(item => {
        message += `• ${item.emoji} ${item.name} (${item.variant}) x${item.quantity} - ${CURRENCY_SYMBOL}${(item.price * item.quantity).toLocaleString()}\n`;
      });
      
      message += `\n*Subtotal:* ${CURRENCY_SYMBOL}${subtotal.toLocaleString()}\n`;
      message += `*Delivery:* ${CURRENCY_SYMBOL}${delivery}\n`;
      message += `*Tax:* ${CURRENCY_SYMBOL}${tax.toLocaleString()}\n`;
      message += `*Total:* ${CURRENCY_SYMBOL}${total.toLocaleString()}\n\n`;
      message += `Payment: ${paymentMethod}`;
      
      setWhatsappLink(`https://wa.me/${checkoutPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`);
      setShowCheckout(false);
      setShowSuccess(true);
      
    } catch (err: any) {
      console.error("Error placing order:", err);
      alert("Failed to place order. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 60, height: 60, border: "4px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }}></div>
          <p style={{ color: "white", fontWeight: 600 }}>Loading store...</p>
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

  if (showSuccess) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "#f0f2f5" }}>
        <div style={{ background: "white", borderRadius: 16, padding: 32, textAlign: "center", maxWidth: 400, width: "100%", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <div style={{ width: 80, height: 80, background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 36, color: "white", animation: "pulse 2s infinite" }}>
            <i className="fas fa-check"></i>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Order Placed!</h2>
          <p style={{ color: "#64748b", marginBottom: 20 }}>Your order has been sent to the seller</p>
          
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 14, color: "#64748b", marginBottom: 4 }}>Order Number</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#25D366" }}>#{orderNumber}</div>
          </div>

          <button 
            onClick={() => window.open(whatsappLink, "_blank")}
            style={{ width: "100%", padding: 14, background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}
          >
            <i className="fab fa-whatsapp"></i>
            Chat with Seller
          </button>
          
          <button 
            onClick={() => { setCart([]); setShowSuccess(false); }}
            style={{ width: "100%", padding: 14, background: "#f8fafc", color: "#1e293b", border: "2px solid #e2e8f0", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" }}
          >
            Continue Shopping
          </button>
        </div>
        <style>{`@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#f0f2f5", minHeight: "100vh", paddingBottom: 100 }}>
      {/* Store Header */}
      <header style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)", color: "white", padding: "1.5rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.2)", padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, textTransform: "uppercase", marginBottom: 12, backdropFilter: "blur(10px)" }}>
            <i className="fas fa-store"></i> Official Store
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
            Chap Chap Store
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "white", color: "#25D366", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, marginLeft: 8 }}>
              <i className="fas fa-check"></i> Verified
            </span>
          </h1>
          <p style={{ fontSize: 14, opacity: 0.9 }}>Quality products delivered to your doorstep</p>
        </div>
      </header>

      {/* Search */}
      <div style={{ padding: "1rem 1.5rem", background: "white", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ position: "relative" }}>
          <i className="fas fa-search" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#64748b" }}></i>
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "14px 16px 14px 48px", border: "2px solid #e2e8f0", borderRadius: 8, fontSize: 16, background: "#f0f2f5", outline: "none" }}
          />
        </div>
      </div>

      {/* Categories */}
      <div style={{ padding: "1rem 1.5rem", background: "white", borderBottom: "1px solid #e2e8f0", overflowX: "auto" }}>
        <div style={{ display: "flex", gap: 12, paddingBottom: 8 }}>
          <div 
            onClick={() => setActiveCategory("all")}
            style={{ padding: "10px 20px", background: activeCategory === "all" ? "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" : "#f0f2f5", border: "2px solid", borderColor: activeCategory === "all" ? "#25D366" : "#e2e8f0", borderRadius: 24, fontSize: 14, fontWeight: 600, color: activeCategory === "all" ? "white" : "#64748b", cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 8 }}
          >
            <i className="fas fa-th-large"></i> All
          </div>
          {categories.map(cat => (
            <div 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{ padding: "10px 20px", background: activeCategory === cat ? "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" : "#f0f2f5", border: "2px solid", borderColor: activeCategory === cat ? "#25D366" : "#e2e8f0", borderRadius: 24, fontSize: 14, fontWeight: 600, color: activeCategory === cat ? "white" : "#64748b", cursor: "pointer", whiteSpace: "nowrap", textTransform: "capitalize" }}
            >
              {cat}
            </div>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <section style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>Products</span>
          <span style={{ fontSize: 14, color: "#64748b" }}>{filteredProducts.length} items</span>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {filteredProducts.map(product => (
            <div 
              key={product.id}
              onClick={() => openProductModal(product)}
              style={{ background: "white", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", border: "2px solid transparent", transition: "all 0.2s", cursor: "pointer" }}
            >
              <div style={{ aspectRatio: "1", background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, position: "relative" }}>
                {product.image ? (
                  <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  getCategoryEmoji(product.category)
                )}
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{product.name}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#25D366" }}>{CURRENCY_SYMBOL}{(product.price || 0).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cart Bar */}
      {cart.length > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "white", borderTop: "1px solid #e2e8f0", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 -4px 20px rgba(0,0,0,0.1)", zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: "#DCF8C6", display: "flex", alignItems: "center", justifyContent: "center", color: "#25D366", fontSize: 20, position: "relative" }}>
              <i className="fas fa-shopping-cart"></i>
              <span style={{ position: "absolute", top: -4, right: -4, width: 20, height: 20, borderRadius: "50%", background: "#ef4444", color: "white", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white" }}>{cartCount}</span>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Total</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{CURRENCY_SYMBOL}{cartTotal.toLocaleString()}</div>
            </div>
          </div>
          <button 
            onClick={() => setShowCart(true)}
            style={{ padding: "14px 24px", background: "#1a1a2e", color: "white", border: "none", borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
          >
            View Cart <i className="fas fa-arrow-right"></i>
          </button>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && selectedProduct && (
        <div 
          onClick={() => setShowProductModal(false)}
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ background: "white", width: "100%", maxWidth: 500, maxHeight: "90vh", borderRadius: "16px 16px 0 0", overflow: "auto", animation: "slideUp 0.3s" }}
          >
            <div style={{ aspectRatio: "1", background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 96, position: "relative" }}>
              {selectedProduct.image ? (
                <img src={selectedProduct.image} alt={selectedProduct.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                getCategoryEmoji(selectedProduct.category)
              )}
              <button 
                onClick={() => setShowProductModal(false)}
                style={{ position: "absolute", top: 16, right: 16, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.9)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, cursor: "pointer" }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div style={{ padding: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{selectedProduct.name}</h2>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#25D366", marginBottom: 16 }}>{CURRENCY_SYMBOL}{(selectedProduct.price || 0).toLocaleString()}</div>
              <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>{selectedProduct.description || "No description available."}</p>

              {/* Size Selection */}
              {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Select Size</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {selectedProduct.sizes.map((size: string) => (
                      <div 
                        key={size}
                        onClick={() => setSelectedVariant(size)}
                        style={{ padding: "12px 24px", background: selectedVariant === size ? "#25D366" : "#f0f2f5", border: "2px solid", borderColor: selectedVariant === size ? "#25D366" : "#e2e8f0", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", color: selectedVariant === size ? "white" : "#1e293b" }}
                      >
                        {size}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selection */}
              {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Select Color</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {selectedProduct.colors.map((color: string) => (
                      <div 
                        key={color}
                        onClick={() => setSelectedVariant(color)}
                        style={{ padding: "12px 24px", background: selectedVariant === color ? "#25D366" : "#f0f2f5", border: "2px solid", borderColor: selectedVariant === color ? "#25D366" : "#e2e8f0", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", color: selectedVariant === color ? "white" : "#1e293b" }}
                      >
                        {color}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Filters from Product Specs */}
              {selectedProduct.filters && Object.keys(selectedProduct.filters).length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <i className="fas fa-sliders-h" style={{ color: "#8b5cf6" }}></i>
                    Product Specifications
                  </div>
                  <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                    {Object.entries(selectedProduct.filters || {}).map(([key, value]) => (
                      <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 14, color: "#64748b", textTransform: "capitalize" }}>{key.replace(/_/g, ' ')}</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{(value as string) || "-"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", marginBottom: 24 }}>
                <span style={{ fontWeight: 700 }}>Quantity</span>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <button 
                    onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                    style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid #e2e8f0", background: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, cursor: "pointer" }}
                  >
                    <i className="fas fa-minus"></i>
                  </button>
                  <span style={{ fontSize: 20, fontWeight: 800, minWidth: 40, textAlign: "center" }}>{selectedQty}</span>
                  <button 
                    onClick={() => setSelectedQty(selectedQty + 1)}
                    style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid #e2e8f0", background: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, cursor: "pointer" }}
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
              </div>

              <button 
                onClick={handleAddToCart}
                style={{ width: "100%", padding: 16, background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)", color: "white", border: "none", borderRadius: 8, fontSize: 18, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, boxShadow: "0 4px 12px rgba(37,211,102,0.4)" }}
              >
                <i className="fas fa-shopping-cart"></i>
                Add to Cart - {CURRENCY_SYMBOL}{((selectedProduct.price || 0) * selectedQty).toLocaleString()}
              </button>
            </div>
          </div>
          <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div 
          onClick={() => setShowCart(false)}
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 1100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ background: "white", width: "100%", maxWidth: 500, maxHeight: "85vh", borderRadius: "16px 16px 0 0", display: "flex", flexDirection: "column", animation: "slideUp 0.3s" }}
          >
            <div style={{ padding: "1.5rem", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 20, fontWeight: 800 }}>Your Cart</h3>
              <button 
                onClick={() => setShowCart(false)}
                style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: "#f0f2f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, cursor: "pointer" }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div style={{ flex: 1, overflow: "auto", padding: "1rem 1.5rem" }}>
              {cart.map((item, index) => (
                <div key={index} style={{ display: "flex", gap: 16, padding: "1rem 0", borderBottom: "1px solid #e2e8f0" }}>
                  <div style={{ width: 80, height: 80, borderRadius: 8, background: "#f0f2f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, flexShrink: 0 }}>
                    {item.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{item.name}</div>
                    <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>Size: {item.variant}</div>
                    <div style={{ fontWeight: 800, color: "#25D366" }}>{CURRENCY_SYMBOL}{(item.price * item.quantity).toLocaleString()}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f0f2f5", padding: 4, borderRadius: 20 }}>
                        <button onClick={() => updateCartQty(index, -1)} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>-</button>
                        <span style={{ minWidth: 24, textAlign: "center", fontWeight: 600 }}>{item.quantity}</span>
                        <button onClick={() => updateCartQty(index, 1)} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>+</button>
                      </div>
                      <span onClick={() => removeFromCart(index)} style={{ color: "#ef4444", fontSize: 14, cursor: "pointer", marginLeft: "auto" }}>
                        <i className="fas fa-trash"></i> Remove
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: "1.5rem", borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 15 }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 600 }}>{CURRENCY_SYMBOL}{cartTotal.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 15, fontWeight: 700, borderTop: "2px solid #e2e8f0", paddingTop: 16, marginTop: 8 }}>
                <span>Total</span>
                <span style={{ fontSize: 20, color: "#25D366" }}>{CURRENCY_SYMBOL}{cartTotal.toLocaleString()}</span>
              </div>
              <button 
                onClick={() => { setShowCart(false); setShowCheckout(true); }}
                style={{ width: "100%", padding: 16, background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)", color: "white", border: "none", borderRadius: 8, fontSize: 18, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 16 }}
              >
                Proceed to Checkout <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div 
          onClick={() => setShowCheckout(false)}
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 1100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ background: "white", width: "100%", maxWidth: 500, maxHeight: "95vh", borderRadius: "16px 16px 0 0", overflow: "auto", animation: "slideUp 0.3s" }}
          >
            <div style={{ padding: "1.5rem", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 20, fontWeight: 800 }}>Checkout</h3>
              <button 
                onClick={() => setShowCheckout(false)}
                style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: "#f0f2f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, cursor: "pointer" }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div style={{ padding: "1.5rem" }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Full Name *</label>
                <input 
                  type="text" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your full name"
                  style={{ width: "100%", padding: 14, border: "2px solid #e2e8f0", borderRadius: 8, fontSize: 16, outline: "none" }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontWeight: 700, fontSize: 14, marginBottom: 8 }}>WhatsApp Number *</label>
                <input 
                  type="tel" 
                  value={checkoutPhone}
                  onChange={(e) => setCheckoutPhone(e.target.value)}
                  placeholder="+254 712 345 678"
                  style={{ width: "100%", padding: 14, border: "2px solid #e2e8f0", borderRadius: 8, fontSize: 16, outline: "none" }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Delivery Address *</label>
                <input 
                  type="text" 
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Street, Building, House No."
                  style={{ width: "100%", padding: 14, border: "2px solid #e2e8f0", borderRadius: 8, fontSize: 16, outline: "none" }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Payment Method</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div 
                    onClick={() => setPaymentMethod("Cash on Delivery")}
                    style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, border: "2px solid", borderColor: paymentMethod === "Cash on Delivery" ? "#25D366" : "#e2e8f0", borderRadius: 8, cursor: "pointer", background: paymentMethod === "Cash on Delivery" ? "rgba(37,211,102,0.05)" : "white" }}
                  >
                    <input type="radio" checked={paymentMethod === "Cash on Delivery"} style={{ width: 20, height: 20, accentColor: "#25D366" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>Cash on Delivery</div>
                      <div style={{ fontSize: 14, color: "#64748b" }}>Pay when you receive</div>
                    </div>
                  </div>
                  <div 
                    onClick={() => setPaymentMethod("M-Pesa")}
                    style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, border: "2px solid", borderColor: paymentMethod === "M-Pesa" ? "#25D366" : "#e2e8f0", borderRadius: 8, cursor: "pointer", background: paymentMethod === "M-Pesa" ? "rgba(37,211,102,0.05)" : "white" }}
                  >
                    <input type="radio" checked={paymentMethod === "M-Pesa"} style={{ width: 20, height: 20, accentColor: "#25D366" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>M-Pesa</div>
                      <div style={{ fontSize: 14, color: "#64748b" }}>Pay via WhatsApp</div>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={placeOrder}
                disabled={placingOrder}
                style={{ width: "100%", padding: 20, background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)", color: "white", border: "none", borderRadius: 8, fontSize: 18, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, opacity: placingOrder ? 0.7 : 1 }}
              >
                {placingOrder ? (
                  <>
                    <div style={{ width: 20, height: 20, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    Place Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
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
      <OrderStorePage />
    </Suspense>
  );
}
