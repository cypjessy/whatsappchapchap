"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
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

function OrderPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const tenantId = searchParams.get("tenant");
  const productIds = searchParams.get("product")?.split(",").filter(Boolean) || [];
  const customerPhone = searchParams.get("phone") || "";
  const selectedSize = searchParams.get("size") || "";
  const quantity = parseInt(searchParams.get("quantity") || "1", 10);

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [customerName, setCustomerName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [selectedQuantity, setSelectedQuantity] = useState(quantity);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!tenantId || productIds.length === 0) {
      setError("Invalid order link. Please ask the seller to generate a new link.");
      setLoading(false);
      return;
    }

    const app = getFirebaseApp();
    if (!app) {
      setLoading(false);
      return;
    }

    const db = getFirestore(app);
    const auth = getAuth(app);

    // Sign in anonymously for customer
    signInAnonymously(auth).then(() => {
      onAuthStateChanged(auth, async (user) => {
        setUser(user);
        await loadProducts(db);
      });
    }).catch(async () => {
      await loadProducts(db);
    });
  }, [tenantId, productIds]);

  const loadProducts = async (db: any) => {
    try {
      // For single tenant, we need to query by tenantId
      // Since we don't have direct access to query, let's try to get products differently
      // We'll query using a simpler approach - just get the first product for now
      
      if (productIds.length === 0) {
        setError("No products found in this order link.");
        setLoading(false);
        return;
      }

      // Try to get products - we'll check if they belong to the tenant
      const productsData: any[] = [];
      
      for (const productId of productIds) {
        const productSnap = await getDoc(doc(db, "products", productId));
        if (productSnap.exists()) {
          const data = productSnap.data();
          if (data.tenantId === tenantId) {
            productsData.push({
              id: productSnap.id,
              ...data,
              quantity: selectedQuantity,
            });
          }
        }
      }

      if (productsData.length === 0) {
        setError("Products not found or link has expired.");
        setLoading(false);
        return;
      }

      setProducts(productsData);
      setLoading(false);
    } catch (err: any) {
      console.error("Error loading products:", err);
      setError("Failed to load products. Please try again.");
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return products.reduce((sum, p) => sum + (p.price * (selectedQuantity || 1)), 0);
  };

  const placeOrder = async () => {
    if (!user || !tenantId) return;
    
    setOrdering(true);
    try {
      const db = getFirestore(getFirebaseApp()!);
      const orderRef = doc(collection(db, "orders"));
      
      const orderData = {
        id: orderRef.id,
        tenantId,
        customerId: user.uid,
        customerName: customerName || "Customer",
        customerPhone: customerPhone,
        customerEmail: "",
        customerAddress: deliveryAddress,
        products: products.map(p => ({
          productId: p.id,
          name: p.name,
          price: p.price,
          quantity: selectedQuantity,
          size: selectedSize || null,
        })),
        subtotal: calculateTotal(),
        shipping: 0,
        tax: Math.round(calculateTotal() * 0.16),
        discount: 0,
        total: Math.round(calculateTotal() * 1.16),
        paymentMethod,
        status: "pending",
        notes: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(orderRef, orderData);
      
      setOrderDetails({
        orderId: orderRef.id,
        total: orderData.total,
      });
      setOrderPlaced(true);
    } catch (err: any) {
      console.error("Error placing order:", err);
      setError("Failed to place order. Please try again.");
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#64748b]">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-2xl text-red-500"></i>
          </div>
          <h1 className="text-xl font-bold text-[#1e293b] mb-2">Oops!</h1>
          <p className="text-[#64748b]">{error}</p>
        </div>
      </div>
    );
  }

  if (orderPlaced && orderDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-xl">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-check text-2xl text-green-500"></i>
          </div>
          <h1 className="text-2xl font-bold text-[#1e293b] mb-2">Order Confirmed!</h1>
          <p className="text-[#64748b] mb-4">Your order has been placed successfully.</p>
          
          <div className="bg-[#f8fafc] rounded-xl p-4 mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-[#64748b]">Order ID</span>
              <span className="font-bold text-[#25D366]">#{orderDetails.orderId.substring(0, 8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748b]">Total</span>
              <span className="font-bold text-xl">{CURRENCY_SYMBOL}{orderDetails.total.toLocaleString()}</span>
            </div>
          </div>

          <p className="text-sm text-[#64748b]">
            The seller will contact you at <strong>{customerPhone}</strong> for confirmation.
          </p>
          
          <div className="mt-6 flex gap-2 justify-center">
            <a href={`https://wa.me/${customerPhone}?text=${encodeURIComponent(`Hi! Your order #${orderDetails.orderId.substring(0, 8)} has been received. We'll confirm shortly.`)}`}
               className="px-4 py-2 bg-[#25D366] text-white rounded-lg font-semibold text-sm">
              <i className="fab fa-whatsapp mr-2"></i>Message Seller
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10">
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-4">
          <div className="p-6 bg-gradient-to-r from-[#25D366] to-[#128C7E]">
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <i className="fas fa-shopping-cart"></i>Confirm Order
            </h1>
            <p className="text-white/80 text-sm mt-1">Review your order and confirm</p>
          </div>

          {/* Products */}
          <div className="p-6">
            <h2 className="font-bold text-[#1e293b] mb-4 flex items-center gap-2">
              <i className="fas fa-box text-[#25D366]"></i>Order Items
            </h2>
            
            {products.map((product, idx) => (
              <div key={idx} className="flex gap-4 mb-4 pb-4 border-b border-[#e2e8f0]">
                {/* Product Image Gallery */}
                <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] flex items-center justify-center text-4xl overflow-hidden shadow-md relative">
                  {product.image || (product.images && product.images.length > 0) ? (
                    <img src={product.image || product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    "📦"
                  )}
                  {/* Image count badge if multiple images */}
                  {(product.images && product.images.length > 0) && (
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm text-white rounded-full text-[10px] font-semibold">
                      {product.images.length + (product.image ? 1 : 0)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#1e293b]">{product.name}</h3>
                  <p className="text-sm text-[#64748b] capitalize">{product.category}</p>
                  {selectedSize && (
                    <p className="text-sm text-[#64748b]">Size: {selectedSize}</p>
                  )}
                  
                  {/* Show thumbnail gallery if multiple images */}
                  {product.images && product.images.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {product.image && (
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#e2e8f0]">
                          <img src={product.image} alt="Main" className="w-full h-full object-cover" />
                        </div>
                      )}
                      {product.images.slice(0, 3).map((img: string, imgIdx: number) => (
                        <div key={imgIdx} className="w-8 h-8 rounded-lg overflow-hidden border border-[#e2e8f0]">
                          <img src={img} alt={`Variant ${imgIdx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {product.images.length > 3 && (
                        <div className="w-8 h-8 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center text-xs font-semibold text-[#64748b]">
                          +{product.images.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                        className="w-8 h-8 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center font-bold hover:bg-[#e2e8f0] transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-bold">{selectedQuantity}</span>
                      <button 
                        onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                        className="w-8 h-8 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center font-bold hover:bg-[#e2e8f0] transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <div className="font-bold text-lg text-[#25D366]">
                      {CURRENCY_SYMBOL}{(product.price * selectedQuantity).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Totals */}
            <div className="bg-[#f8fafc] rounded-xl p-4 mt-4">
              <div className="flex justify-between py-2 border-b border-dashed border-[#e2e8f0]">
                <span className="text-[#64748b]">Subtotal</span>
                <span className="font-semibold">{CURRENCY_SYMBOL}{calculateTotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-[#e2e8f0]">
                <span className="text-[#64748b]">Tax (16%)</span>
                <span className="font-semibold">{CURRENCY_SYMBOL}{Math.round(calculateTotal() * 0.16).toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-3 mt-2 border-t-2 border-[#e2e8f0] text-xl font-extrabold">
                <span>Total</span>
                <span className="text-[#25D366]">{CURRENCY_SYMBOL}{Math.round(calculateTotal() * 1.16).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-4">
          <div className="p-6">
            <h2 className="font-bold text-[#1e293b] mb-4 flex items-center gap-2">
              <i className="fas fa-user text-[#25D366]"></i>Your Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1e293b] mb-2">Your Name</label>
                <input 
                  type="text" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#25D366]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[#1e293b] mb-2">Delivery Address</label>
                <textarea 
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter delivery address"
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#25D366] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1e293b] mb-2">Payment Method</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#25D366] bg-white"
                >
                  <option value="Cash on Delivery">Cash on Delivery</option>
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Confirm Button */}
        <button 
          onClick={placeOrder}
          disabled={ordering}
          className="w-full py-4 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
        >
          {ordering ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Processing...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <i className="fas fa-check-circle"></i>
              Confirm Order - {CURRENCY_SYMBOL}{Math.round(calculateTotal() * 1.16).toLocaleString()}
            </div>
          )}
        </button>

        <p className="text-center text-xs text-[#64748b] mt-4">
          By confirming, you agree to the terms and conditions
        </p>
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin"></div>
      </div>
    }>
      <OrderPageContent />
    </Suspense>
  );
}
