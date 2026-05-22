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
  
  // Cart state
  const [showCartChoice, setShowCartChoice] = useState(false);
  const [cart, setCart] = useState<Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    size: string;
    image?: string;
    images?: string[];
    tenantId: string;
  }>>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCartBadge, setShowCartBadge] = useState(false);

  useEffect(() => {
    if (!tenantId || productIds.length === 0) {
      setError("Invalid order link. Please ask the seller to generate a new link.");
      setLoading(false);
      return;
    }

    // Load cart from localStorage on mount
    try {
      const savedCart = localStorage.getItem('whatsapp_cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
        setShowCartBadge(parsedCart.length > 0);
      }
    } catch (err) {
      console.error('Error loading cart:', err);
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
      
      // Show cart choice modal after products load
      setShowCartChoice(true);
    } catch (err: any) {
      console.error("Error loading products:", err);
      setError("Failed to load products. Please try again.");
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return products.reduce((sum, p) => sum + (p.price * (selectedQuantity || 1)), 0);
  };

  // Cart management functions
  const saveCartToLocalStorage = (newCart: typeof cart) => {
    try {
      localStorage.setItem('whatsapp_cart', JSON.stringify(newCart));
      setShowCartBadge(newCart.length > 0);
    } catch (err) {
      console.error('Error saving cart:', err);
    }
  };

  const addToCart = () => {
    if (products.length === 0) return;
    
    const product = products[0];
    const cartItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: selectedQuantity,
      size: selectedSize || '',
      image: product.image,
      images: product.images,
      tenantId: tenantId!,
    };
    
    const newCart = [...cart, cartItem];
    setCart(newCart);
    saveCartToLocalStorage(newCart);
    
    // Redirect back to WhatsApp
    const whatsappUrl = `https://wa.me/${customerPhone || ''}?text=${encodeURIComponent('I added items to my cart! Let me find more products...')}`;
    window.location.href = whatsappUrl;
  };

  const removeFromCart = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    saveCartToLocalStorage(newCart);
  };

  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    const newCart = [...cart];
    newCart[index].quantity = newQuantity;
    setCart(newCart);
    saveCartToLocalStorage(newCart);
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('whatsapp_cart');
    setShowCartBadge(false);
  };

  const placeOrder = async () => {
    if (!user || !tenantId) return;
    
    setOrdering(true);
    try {
      const db = getFirestore(getFirebaseApp()!);
      const orderRef = doc(collection(db, "orders"));
      
      // Use cart items if in cart view, otherwise use current product
      const orderProducts = showCart ? cart.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size || null,
      })) : products.map(p => ({
        productId: p.id,
        name: p.name,
        price: p.price,
        quantity: selectedQuantity,
        size: selectedSize || null,
      }));
      
      const orderTotal = orderProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
      
      const orderData = {
        id: orderRef.id,
        tenantId,
        customerId: user.uid,
        customerName: customerName || "Customer",
        customerPhone: customerPhone,
        customerEmail: "",
        customerAddress: deliveryAddress,
        products: orderProducts,
        subtotal: orderTotal,
        shipping: 0,
        tax: Math.round(orderTotal * 0.16),
        discount: 0,
        total: Math.round(orderTotal * 1.16),
        paymentMethod,
        status: "pending",
        notes: showCart ? "Order from cart" : "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(orderRef, orderData);
      
      // Clear cart if order was placed from cart
      if (showCart) {
        clearCart();
      }
      
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

  // Show cart choice modal
  if (showCartChoice && !showCart) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <i className="fas fa-shopping-cart text-3xl text-white"></i>
            </div>
            <h1 className="text-2xl font-bold text-[#1e293b] mb-2">What would you like to do?</h1>
            <p className="text-[#64748b]">{products[0]?.name}</p>
          </div>
          
          <div className="space-y-3">
            {/* Order Now Button */}
            <button 
              onClick={() => setShowCartChoice(false)}
              className="w-full py-4 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3"
            >
              <i className="fas fa-bolt"></i>
              Order Now
            </button>
            
            {/* Add to Cart Button */}
            <button 
              onClick={addToCart}
              className="w-full py-4 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3"
            >
              <i className="fas fa-cart-plus"></i>
              Add to Cart & Continue Shopping
            </button>
            
            {/* View Cart Button (if cart has items) */}
            {cart.length > 0 && (
              <button 
                onClick={() => {
                  setShowCartChoice(false);
                  setShowCart(true);
                }}
                className="w-full py-3 bg-[#f8fafc] border-2 border-[#e2e8f0] text-[#64748b] rounded-xl font-semibold hover:border-[#25D366] hover:text-[#25D366] transition-all flex items-center justify-center gap-2"
              >
                <i className="fas fa-shopping-bag"></i>
                View Cart ({cart.length} items)
              </button>
            )}
          </div>
          
          <p className="text-xs text-center text-[#64748b] mt-6">
            {cart.length > 0 
              ? `You already have ${cart.length} item(s) in your cart` 
              : 'Your cart is empty'}
          </p>
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
      {/* Floating Cart Button */}
      {cart.length > 0 && !showCart && (
        <button 
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white rounded-full shadow-2xl flex items-center justify-center hover:-translate-y-1 transition-all z-50"
        >
          <i className="fas fa-shopping-cart text-xl"></i>
          <span className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
            {cart.length}
          </span>
        </button>
      )}
      
      <div className="max-w-2xl mx-auto p-4">
        {showCart ? (
          // Cart View
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-4">
            <div className="p-6 bg-gradient-to-r from-[#3b82f6] to-[#2563eb]">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
                  <i className="fas fa-shopping-cart"></i>Your Cart
                </h1>
                <button 
                  onClick={() => setShowCart(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <i className="fas fa-arrow-left text-xl"></i>
                </button>
              </div>
              <p className="text-white/80 text-sm mt-1">{cart.length} item(s) in your cart</p>
            </div>

            {/* Cart Items */}
            <div className="p-6">
              {cart.map((item, idx) => (
                <div key={idx} className="flex gap-4 mb-4 pb-4 border-b border-[#e2e8f0] last:border-b-0">
                  {/* Product Image */}
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] flex items-center justify-center overflow-hidden shadow-md flex-shrink-0">
                    {item.image || (item.images && item.images.length > 0) ? (
                      <img src={item.image || item.images![0]} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#1e293b] text-sm truncate">{item.name}</h3>
                    {item.size && (
                      <p className="text-xs text-[#64748b]">Size: {item.size}</p>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => updateCartItemQuantity(idx, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center font-bold hover:bg-[#e2e8f0] transition-colors text-sm"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                        <button 
                          onClick={() => updateCartItemQuantity(idx, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center font-bold hover:bg-[#e2e8f0] transition-colors text-sm"
                        >
                          +
                        </button>
                      </div>
                      <div className="font-bold text-sm text-[#25D366]">
                        {CURRENCY_SYMBOL}{(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Remove Button */}
                  <button 
                    onClick={() => removeFromCart(idx)}
                    className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  >
                    <i className="fas fa-trash-alt text-sm"></i>
                  </button>
                </div>
              ))}

              {/* Cart Totals */}
              <div className="bg-[#f8fafc] rounded-xl p-4 mt-4">
                <div className="flex justify-between py-2 border-b border-dashed border-[#e2e8f0]">
                  <span className="text-[#64748b]">Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                  <span className="font-semibold">{CURRENCY_SYMBOL}{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-dashed border-[#e2e8f0]">
                  <span className="text-[#64748b]">Tax (16%)</span>
                  <span className="font-semibold">{CURRENCY_SYMBOL}{Math.round(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.16).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-3 mt-2 border-t-2 border-[#e2e8f0] text-xl font-extrabold">
                  <span>Total</span>
                  <span className="text-[#25D366]">{CURRENCY_SYMBOL}{Math.round(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.16).toLocaleString()}</span>
                </div>
              </div>
              
              {/* Cart Actions */}
              <div className="flex gap-2 mt-4">
                <button 
                  onClick={clearCart}
                  className="flex-1 py-3 bg-[#f8fafc] border-2 border-[#e2e8f0] text-[#64748b] rounded-xl font-semibold hover:border-red-300 hover:text-red-500 transition-all"
                >
                  <i className="fas fa-trash-alt mr-2"></i>Clear Cart
                </button>
                <button 
                  onClick={() => setShowCart(false)}
                  className="flex-1 py-3 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  <i className="fas fa-plus mr-2"></i>Add More Items
                </button>
              </div>
            </div>
          </div>
        ) : (
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
              <div key={idx} className="mb-6 pb-6 border-b border-[#e2e8f0] last:border-b-0">
                {/* Product Image Gallery */}
                <div className="w-full h-64 rounded-xl bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] flex items-center justify-center overflow-hidden shadow-md relative mb-4">
                  {product.image || (product.images && product.images.length > 0) ? (
                    <img src={product.image || product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-6xl"></span>
                  )}
                  {/* Image count badge if multiple images */}
                  {(product.images && product.images.length > 0) && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-sm text-white rounded-lg text-xs font-semibold">
                      {product.images.length + (product.image ? 1 : 0)} photos
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="font-bold text-xl text-[#1e293b] mb-2">{product.name}</h3>
                  
                  {/* Product Description */}
                  {product.description && (
                    <p className="text-sm text-[#64748b] mb-3 line-clamp-3">{product.description}</p>
                  )}
                  
                  {/* Product Details Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {/* Category */}
                    {product.categoryName && (
                      <div className="bg-[#f8fafc] rounded-lg p-2">
                        <div className="text-xs text-[#64748b] mb-1">Category</div>
                        <div className="text-sm font-semibold text-[#1e293b] capitalize">{product.categoryName}</div>
                      </div>
                    )}
                    
                    {/* Brand */}
                    {product.brand && (
                      <div className="bg-[#f8fafc] rounded-lg p-2">
                        <div className="text-xs text-[#64748b] mb-1">Brand</div>
                        <div className="text-sm font-semibold text-[#1e293b]">{product.brand}</div>
                      </div>
                    )}
                    
                    {/* Condition */}
                    {product.condition && (
                      <div className="bg-[#f8fafc] rounded-lg p-2">
                        <div className="text-xs text-[#64748b] mb-1">Condition</div>
                        <div className="text-sm font-semibold text-[#1e293b] capitalize">{product.condition}</div>
                      </div>
                    )}
                    
                    {/* SKU */}
                    {product.sku && (
                      <div className="bg-[#f8fafc] rounded-lg p-2">
                        <div className="text-xs text-[#64748b] mb-1">SKU</div>
                        <div className="text-sm font-semibold text-[#1e293b] font-mono">{product.sku}</div>
                      </div>
                    )}
                  </div>
                  
                  {/* Filters (Colors, Sizes, Custom) */}
                  {product.filters && Object.keys(product.filters).length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-[#64748b] mb-2 uppercase tracking-wide">Available Options</div>
                      <div className="space-y-2">
                        {Object.entries(product.filters).map(([filterName, filterValues]) => {
                          if (!filterValues || !Array.isArray(filterValues) || filterValues.length === 0) return null;
                          
                          return (
                            <div key={filterName}>
                              <div className="text-xs text-[#64748b] mb-1 capitalize">{filterName.replace(/([A-Z])/g, ' $1').trim()}</div>
                              <div className="flex flex-wrap gap-2">
                                {filterValues.map((value: string, vIdx: number) => {
                                  // Check if this is a color filter
                                  const isColor = filterName.toLowerCase() === 'color' || filterName.toLowerCase() === 'colors';
                                  
                                  if (isColor) {
                                    // Display as color swatches
                                    const colorValue = value.toLowerCase();
                                    return (
                                      <div 
                                        key={vIdx}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc]"
                                      >
                                        <div 
                                          className="w-4 h-4 rounded-full border border-[#e2e8f0]" 
                                          style={{ backgroundColor: colorValue }}
                                        />
                                        <span className="text-xs font-semibold text-[#1e293b] capitalize">{value}</span>
                                      </div>
                                    );
                                  }
                                  
                                  // Display as tags for other filters
                                  return (
                                    <span 
                                      key={vIdx}
                                      className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-xs font-semibold text-[#1e293b] capitalize"
                                    >
                                      {value}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Selected Size (from URL params) */}
                  {selectedSize && (
                    <div className="bg-gradient-to-r from-[#25D366]/10 to-[#128C7E]/10 rounded-lg p-3 mb-3 border border-[#25D366]/20">
                      <div className="text-xs text-[#64748b] mb-1">Selected Option</div>
                      <div className="text-sm font-bold text-[#25D366]">{selectedSize}</div>
                    </div>
                  )}
                  
                  {/* Product Variants (if available) */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-[#64748b] mb-2 uppercase tracking-wide">Product Variants</div>
                      <div className="space-y-2">
                        {product.variants.slice(0, 3).map((variant: any, vIdx: number) => (
                          <div key={vIdx} className="bg-[#f8fafc] rounded-lg p-3 border border-[#e2e8f0]">
                            <div className="flex justify-between items-start mb-1">
                              <div className="text-sm font-semibold text-[#1e293b]">
                                {Object.entries(variant.specs || {}).map(([key, val]) => (
                                  <span key={key} className="capitalize">{key}: {val as string}</span>
                                )).reduce((prev, curr) => [prev, ', ', curr] as any)}
                              </div>
                              <div className="text-sm font-bold text-[#25D366]">
                                {CURRENCY_SYMBOL}{variant.price?.toLocaleString()}
                              </div>
                            </div>
                            <div className="text-xs text-[#64748b]">
                              SKU: {variant.sku} • Stock: {variant.stock}
                            </div>
                          </div>
                        ))}
                        {product.variants.length > 3 && (
                          <div className="text-xs text-[#64748b] text-center">+{product.variants.length - 3} more variants</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Additional Info (Warranty, Weight, etc.) */}
                  {(product.warranty || product.weight || product.barcode) && (
                    <div className="bg-[#f8fafc] rounded-lg p-3 mb-3">
                      <div className="text-xs font-semibold text-[#64748b] mb-2 uppercase tracking-wide">Additional Info</div>
                      <div className="space-y-1 text-sm">
                        {product.warranty && (
                          <div className="flex justify-between">
                            <span className="text-[#64748b]">Warranty</span>
                            <span className="font-semibold text-[#1e293b]">{product.warranty}</span>
                          </div>
                        )}
                        {product.weight && (
                          <div className="flex justify-between">
                            <span className="text-[#64748b]">Weight</span>
                            <span className="font-semibold text-[#1e293b]">{product.weight} {product.weightUnit || 'kg'}</span>
                          </div>
                        )}
                        {product.barcode && (
                          <div className="flex justify-between">
                            <span className="text-[#64748b]">Barcode</span>
                            <span className="font-semibold text-[#1e293b] font-mono">{product.barcode}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Thumbnail gallery if multiple images */}
                  {product.images && product.images.length > 0 && (
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                      {product.image && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-[#25D366] flex-shrink-0">
                          <img src={product.image} alt="Main" className="w-full h-full object-cover" />
                        </div>
                      )}
                      {product.images.map((img: string, imgIdx: number) => (
                        <div key={imgIdx} className="w-16 h-16 rounded-lg overflow-hidden border border-[#e2e8f0] flex-shrink-0">
                          <img src={img} alt={`Photo ${imgIdx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Quantity Selector and Price */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#e2e8f0]">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                        className="w-10 h-10 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center font-bold hover:bg-[#e2e8f0] transition-colors"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-bold text-lg">{selectedQuantity}</span>
                      <button 
                        onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                        className="w-10 h-10 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center font-bold hover:bg-[#e2e8f0] transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#64748b] mb-1">Total Price</div>
                      <div className="font-bold text-2xl text-[#25D366]">
                        {CURRENCY_SYMBOL}{(product.price * selectedQuantity).toLocaleString()}
                      </div>
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
        )}

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
          ) : showCart ? (
            <div className="flex items-center justify-center gap-2">
              <i className="fas fa-check-circle"></i>
              Place Order ({cart.length} items) - {CURRENCY_SYMBOL}{Math.round(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.16).toLocaleString()}
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
