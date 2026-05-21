"use client";

import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { formatCurrency, CURRENCY_SYMBOL } from "@/lib/currency";
import { getFirebaseApp } from "@/lib/firebase";
import { generateOrderNumber } from "@/utils/orderNumber";

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

interface CheckoutData {
  // Single product order fields
  productId?: string;
  productName?: string;
  productImage?: string;
  quantity?: number;
  price?: number;
  selectedSpecs?: Record<string, string>;
  
  // Cart order fields
  cartItems?: CartItem[];
  
  // Common fields
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  deliveryMethod: string;
  deliveryCost: number;
  orderNotes: string;
  tenantId: string;
  selectedStation?: string;
  paymentMethods?: Array<{ id: string; name: string; details: string; icon: string; color: string }>;
}

export default function CheckoutPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-circle-notch fa-spin text-4xl text-[#8b5cf6] mb-4"></i>
          <p className="text-[#64748b]">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutPage />
    </Suspense>
  );
}

function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [paystackLoading, setPaystackLoading] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // Load checkout data from localStorage or session
  useEffect(() => {
    try {
      const data = localStorage.getItem('pending_checkout');
      if (data) {
        setCheckoutData(JSON.parse(data));
      } else {
        setError("No checkout data found");
      }
    } catch (err) {
      console.error("Error loading checkout data:", err);
      setError("Failed to load checkout data");
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePlaceOrder = async () => {
    if (!checkoutData) return;

    setIsProcessing(true);
    
    try {
      const app = getFirebaseApp()!;
      const db = getFirestore(app);
      
      // Generate order number using standard utility function
      const orderNumber = generateOrderNumber();
      
      // Check if this is a cart order or single product order
      const isCartOrder = checkoutData.cartItems && checkoutData.cartItems.length > 0;
      
      // ✅ Calculate totals inside handler for clarity and safety
      const subtotal = isCartOrder 
        ? checkoutData.cartItems!.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        : (checkoutData.price || 0) * (checkoutData.quantity || 0);
      const total = subtotal + checkoutData.deliveryCost;
      
      // Clear pending checkout BEFORE writing to Firestore to prevent stale data on failure
      localStorage.removeItem('pending_checkout');
      
      // Create order in Firestore with pending payment status
      // ✅ Use root 'orders' collection to match orderService in db.ts
      const orderRef = await addDoc(collection(db, "orders"), {
        orderNumber,
        // Cart order fields
        products: isCartOrder ? checkoutData.cartItems!.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })) : undefined,
        // Single product order fields (for backwards compatibility)
        productName: !isCartOrder ? checkoutData.productName : undefined,
        quantity: !isCartOrder ? checkoutData.quantity : undefined,
        basePrice: !isCartOrder ? checkoutData.price : undefined,
        selectedSpecs: !isCartOrder ? (checkoutData.selectedSpecs || {}) : undefined,
        // Financial fields matching Order interface
        subtotal,
        shipping: checkoutData.deliveryCost,  // ✅ Renamed from deliveryCost to shipping
        tax: 0,                                 // ✅ Required field
        discount: 0,                            // ✅ Required field
        total,
        // Customer fields matching Order interface
        customerName: checkoutData.customerName,
        customerPhone: checkoutData.customerPhone,
        customerEmail: checkoutData.customerEmail || "",
        customerAddress: checkoutData.address,  // ✅ Correct field name
        deliveryAddress: checkoutData.address,  // ✅ Also set deliveryAddress
        // Payment and delivery fields
        deliveryMethod: checkoutData.deliveryMethod,
        deliveryCost: checkoutData.deliveryCost, // Keep for backwards compatibility
        paymentMethod: paymentMethod,
        paymentDetails: paymentDetails.trim() || null,
        orderNotes: checkoutData.orderNotes.trim() || "",
        notes: checkoutData.orderNotes.trim() || "", // Also set 'notes' for compatibility
        paymentStatus: paymentMethod === "paystack" ? "pending" : "unpaid",
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const orderId = orderRef.id;

      // If Paystack payment method, initialize payment
      if (paymentMethod === "paystack") {
        await handlePaystackPayment(orderId, orderNumber, total);
      } else {
        // For other payment methods, redirect to success immediately
        router.push(`/order/success?order=${orderNumber}&id=${orderId}`);
      }
      
    } catch (err: any) {
      console.error("Error placing order:", err);
      setError(err.message || "Failed to place order");
      setIsProcessing(false);
    }
  };

  const handlePaystackPayment = async (orderId: string, orderNumber: string, amount: number) => {
    setPaystackLoading(true);
    
    try {
      // ✅ Generate reference client-side for popup mode (no server initialize needed)
      const reference = `order_${orderId}_${Date.now()}`;

      // Open Paystack popup directly
      const handler = (window as any).PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: checkoutData!.customerEmail || checkoutData!.customerPhone + '@example.com',
        amount: Math.round(amount * 100), // Convert KES to cents for Paystack
        currency: 'KES',
        ref: reference,
        metadata: {
          orderId,
          orderNumber,
          tenantId: checkoutData!.tenantId,
        },
        callback: function(response: any) {
          console.log('Payment completed! Reference:', response.reference);
          // Payment successful - webhook will update order status
          router.push(`/order/success?order=${orderNumber}&id=${orderId}&ref=${response.reference}`);
        },
        onClose: function() {
          console.log('Payment window closed');
          setPaystackLoading(false);
          setIsProcessing(false);
          alert('Payment cancelled. Your order has been saved but payment is pending.');
        },
      });

      handler.openIframe();
      
    } catch (error: any) {
      console.error('Paystack payment error:', error);
      setPaystackLoading(false);
      setIsProcessing(false);
      alert(error.message || 'Failed to initialize payment. Please try again.');
    }
  };

  // ✅ Calculate totals using useMemo - MUST be before early returns (React hooks rule)
  const isCartOrder = Boolean(checkoutData?.cartItems?.length);
  const { subtotal, total } = useMemo(() => {
    if (!checkoutData) return { subtotal: 0, total: 0 };
    const sub = isCartOrder
      ? checkoutData.cartItems!.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      : (checkoutData.price || 0) * (checkoutData.quantity || 0);
    return {
      subtotal: sub,
      total: sub + checkoutData.deliveryCost
    };
  }, [checkoutData, isCartOrder]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-circle-notch fa-spin text-4xl text-[#8b5cf6] mb-4"></i>
          <p className="text-[#64748b]">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error || !checkoutData) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-circle text-red-500 text-2xl"></i>
          </div>
          <h2 className="text-xl font-bold text-[#1e293b] mb-2">Checkout Error</h2>
          <p className="text-[#64748b] mb-6">{error || "Invalid checkout data"}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-[#8b5cf6] text-white rounded-xl font-bold hover:bg-[#7c3aed] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      min-h-screen bg-[#f8fafc] pb-32 transition-all duration-500
      ${isVisible ? "opacity-100" : "opacity-0"}
    `}>
      {/* Header */}
      <div className="bg-white border-b border-[#e2e8f0] sticky top-0 z-30">
        <div className="px-3 md:px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-lg border border-[#e2e8f0] flex items-center justify-center text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all active:scale-95"
          >
            <i className="fas fa-arrow-left text-sm" />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-extrabold text-[#1e293b]">Checkout</h1>
            <p className="text-xs text-[#64748b]">Review and complete your order</p>
          </div>
        </div>
      </div>

      <div className="px-3 md:px-6 py-6 md:py-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 md:gap-8">
          {/* Left Column - Order Details */}
          <div className="space-y-6">
            {/* Product Card */}
            <div className={`
              bg-white rounded-xl p-4 border border-[#e2e8f0] shadow-sm
              transition-all duration-500
              ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
            `}>
              <h3 className="font-bold text-sm text-[#64748b] uppercase tracking-wider mb-3">
                {isCartOrder ? `Order Items (${checkoutData.cartItems!.length})` : 'Order Item'}
              </h3>
              
              {isCartOrder ? (
                // Cart items display
                <div className="space-y-3">
                  {checkoutData.cartItems!.map((item, index) => (
                    <div key={index} className="flex gap-3 pb-3 border-b border-[#e2e8f0] last:border-0 last:pb-0">
                      <div className="w-16 h-16 rounded-lg bg-[#f8fafc] flex items-center justify-center shrink-0 overflow-hidden border border-[#e2e8f0]">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <i className="fas fa-box text-[#cbd5e1] text-xl" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-[#1e293b] truncate">{item.name}</h4>
                        {Object.keys(item.specs).length > 0 && (
                          <p className="text-xs text-[#64748b] mt-0.5">
                            {Object.entries(item.specs).map(([key, val]) => `${key}: ${val}`).join(', ')}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs text-[#64748b]">Qty: {item.quantity}</span>
                          <span className="text-xs font-semibold text-[#8b5cf6]">@ {CURRENCY_SYMBOL}{item.price.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Single product display
                <div className="flex gap-3 md:gap-4">
                  <div className="w-20 h-20 rounded-lg bg-[#f8fafc] flex items-center justify-center shrink-0 overflow-hidden border border-[#e2e8f0]">
                    {checkoutData.productImage ? (
                      <img src={checkoutData.productImage} alt={checkoutData.productName} className="w-full h-full object-cover" />
                    ) : (
                      <i className="fas fa-box text-[#cbd5e1] text-2xl" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-base text-[#1e293b] truncate">{checkoutData.productName}</h4>
                    {checkoutData.selectedSpecs && Object.keys(checkoutData.selectedSpecs).length > 0 && (
                      <p className="text-xs text-[#64748b] mt-1">
                        {Object.entries(checkoutData.selectedSpecs).map(([key, val]) => `${key}: ${val}`).join(', ')}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-[#64748b]">Qty: {checkoutData.quantity}</span>
                      <span className="text-sm font-semibold text-[#8b5cf6]">@ {CURRENCY_SYMBOL}{(checkoutData.price || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Customer Info */}
            <div className={`
              bg-white rounded-xl p-4 md:p-5 border border-[#e2e8f0] shadow-sm
              transition-all duration-500 delay-100
              ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
            `}>
              <h3 className="font-bold text-sm text-[#64748b] uppercase tracking-wider mb-3">
                Customer Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#f1f5f9] flex items-center justify-center shrink-0">
                    <i className="fas fa-user text-[#94a3b8] text-xs" />
                  </div>
                  <div>
                    <p className="text-xs text-[#64748b] font-medium">Name</p>
                    <p className="text-sm font-semibold text-[#1e293b]">{checkoutData.customerName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#f0fdf4] flex items-center justify-center shrink-0">
                    <i className="fab fa-whatsapp text-[#25D366] text-xs" />
                  </div>
                  <div>
                    <p className="text-xs text-[#64748b] font-medium">Phone</p>
                    <p className="text-sm text-[#1e293b]">{checkoutData.customerPhone}</p>
                  </div>
                </div>
                {checkoutData.customerEmail && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#eff6ff] flex items-center justify-center shrink-0">
                      <i className="fas fa-envelope text-[#3b82f6] text-xs" />
                    </div>
                    <div>
                      <p className="text-xs text-[#64748b] font-medium">Email</p>
                      <p className="text-sm text-[#1e293b]">{checkoutData.customerEmail}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#fef3c7] flex items-center justify-center shrink-0">
                    <i className="fas fa-map-marker-alt text-[#f59e0b] text-xs" />
                  </div>
                  <div>
                    <p className="text-xs text-[#64748b] font-medium">Delivery Address</p>
                    <p className="text-sm text-[#1e293b]">{checkoutData.address || "Not specified"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className={`
              bg-white rounded-xl p-4 md:p-5 border border-[#e2e8f0] shadow-sm
              transition-all duration-500 delay-200
              ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
            `}>
              <h3 className="font-bold text-sm text-[#64748b] uppercase tracking-wider mb-3">
                Payment Method
              </h3>
              
              {checkoutData.paymentMethods && checkoutData.paymentMethods.length > 0 ? (
                <div className="space-y-2.5">
                  {/* Paystack - Always show as first option */}
                  <label className={`
                    flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer
                    transition-all duration-200
                    ${paymentMethod === "paystack"
                      ? "border-[#09A5DB] bg-[#09A5DB]/5"
                      : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
                    }
                 `}>
                    <input
                      type="radio"
                      name="payment"
                      value="paystack"
                      checked={paymentMethod === "paystack"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-[#09A5DB]"
                    />
                    <div className="w-10 h-10 rounded-lg bg-[#09A5DB] flex items-center justify-center shrink-0">
                      <i className="fas fa-credit-card text-white text-lg" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-[#1e293b]">Pay with Card/M-Pesa</p>
                      <p className="text-xs text-[#64748b]">Secure online payment via Paystack</p>
                    </div>
                  </label>

                  {/* Divider */}
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#e2e8f0]"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white px-3 text-xs text-[#94a3b8]">or use other methods</span>
                    </div>
                  </div>

                  {checkoutData.paymentMethods.map((method) => {
                    const isSelected = paymentMethod === method.id;
                    return (
                      <label 
                        key={method.id} 
                        className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200"
                        style={isSelected ? {
                          borderColor: method.color,
                          backgroundColor: `${method.color}0D`, // 5% opacity
                        } : {
                          borderColor: '#e2e8f0',
                          backgroundColor: 'white',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#cbd5e1';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                          }
                        }}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={method.id}
                          checked={paymentMethod === method.id}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-4 h-4"
                          style={{ color: method.color }}
                        />
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: method.color }}
                        >
                          <i className={`fas ${method.icon} text-white text-lg`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm text-[#1e293b]">{method.name}</p>
                          <p className="text-xs text-[#64748b] line-clamp-1">{method.details}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                // Fallback to default payment methods if none configured
                <div className="space-y-2.5">
                  {/* Paystack - Online Payment */}
                  <label className={`
                    flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer
                    transition-all duration-200
                    ${paymentMethod === "paystack"
                      ? "border-[#09A5DB] bg-[#09A5DB]/5"
                      : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
                    }
                 `}>
                    <input
                      type="radio"
                      name="payment"
                      value="paystack"
                      checked={paymentMethod === "paystack"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-[#09A5DB]"
                    />
                    <div className="w-10 h-10 rounded-lg bg-[#09A5DB] flex items-center justify-center shrink-0">
                      <i className="fas fa-credit-card text-white text-lg" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-[#1e293b]">Pay with Card/M-Pesa</p>
                      <p className="text-xs text-[#64748b]">Secure online payment via Paystack</p>
                    </div>
                  </label>

                  {/* M-Pesa */}
                  <label className={`
                    flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer
                    transition-all duration-200
                    ${paymentMethod === "mpesa"
                      ? "border-[#25D366] bg-[#25D366]/5"
                      : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
                    }
                  `}>
                    <input
                      type="radio"
                      name="payment"
                      value="mpesa"
                      checked={paymentMethod === "mpesa"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-[#25D366]"
                    />
                    <div className="w-10 h-10 rounded-lg bg-[#25D366] flex items-center justify-center shrink-0">
                      <i className="fas fa-mobile-alt text-white text-lg" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-[#1e293b]">M-Pesa</p>
                      <p className="text-xs text-[#64748b]">Pay via M-Pesa mobile money</p>
                    </div>
                  </label>

                  {/* Bank Transfer */}
                  <label className={`
                    flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer
                    transition-all duration-200
                    ${paymentMethod === "bank"
                      ? "border-[#3b82f6] bg-[#3b82f6]/5"
                      : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
                    }
                  `}>
                    <input
                      type="radio"
                      name="payment"
                      value="bank"
                      checked={paymentMethod === "bank"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-[#3b82f6]"
                    />
                    <div className="w-10 h-10 rounded-lg bg-[#3b82f6] flex items-center justify-center shrink-0">
                      <i className="fas fa-university text-white text-lg" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-[#1e293b]">Bank Transfer</p>
                      <p className="text-xs text-[#64748b]">Direct bank transfer</p>
                    </div>
                  </label>

                  {/* Cash on Delivery */}
                  <label className={`
                    flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer
                    transition-all duration-200
                    ${paymentMethod === "cod"
                      ? "border-[#10b981] bg-[#10b981]/5"
                      : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
                    }
                  `}>
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-[#10b981]"
                    />
                    <div className="w-10 h-10 rounded-lg bg-[#10b981] flex items-center justify-center shrink-0">
                      <i className="fas fa-money-bill-wave text-white text-lg" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-[#1e293b]">Cash on Delivery</p>
                      <p className="text-xs text-[#64748b]">Pay when you receive</p>
                    </div>
                  </label>
                </div>
              )}

              {/* Payment Details Input - Hide for COD and Paystack (auto-confirmed) */}
              {paymentMethod && paymentMethod !== "cod" && paymentMethod !== "paystack" && (
                <div className="mt-4">
                  <label className="block text-xs font-bold text-[#64748b] mb-2">
                    Transaction Reference <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={paymentDetails}
                    onChange={(e) => setPaymentDetails(e.target.value)}
                    placeholder={paymentMethod === "mpesa" ? "Enter M-Pesa transaction ID" : "Enter bank transfer reference"}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] text-sm outline-none focus:border-[#8b5cf6] placeholder:text-[#cbd5e1]"
                  />
                  <p className="text-xs text-[#94a3b8] mt-2">
                    {paymentMethod === "mpesa" 
                      ? "After paying via M-Pesa, enter the transaction ID here"
                      : "After making the bank transfer, enter the reference number here"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            <div className={`
              bg-white rounded-2xl p-5 md:p-6 border border-[#e2e8f0] shadow-sm sticky top-24
              transition-all duration-500 delay-300
              ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
            `}>
              <h3 className="font-bold text-base text-[#1e293b] mb-4">Order Summary</h3>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748b]">Subtotal</span>
                  <span className="font-semibold text-[#1e293b]">{CURRENCY_SYMBOL}{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748b]">Delivery Fee</span>
                  <span className="font-semibold text-[#1e293b]">{CURRENCY_SYMBOL}{checkoutData.deliveryCost.toLocaleString()}</span>
                </div>
                <div className="border-t-2 border-[#e2e8f0] pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="font-bold text-[#1e293b]">Total</span>
                    <span className="font-extrabold text-xl text-[#1e293b]">{CURRENCY_SYMBOL}{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={!paymentMethod || isProcessing || (paymentMethod !== "cod" && paymentMethod !== "paystack" && !paymentDetails.trim())}
                className={`
                  w-full flex items-center justify-center gap-2.5 py-3.5 md:py-4 rounded-xl font-bold text-sm md:text-base mt-6
                  transition-all duration-200 active:scale-[0.98]
                  ${!paymentMethod || isProcessing || (paymentMethod !== "cod" && paymentMethod !== "paystack" && !paymentDetails.trim())
                    ? "bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed"
                    : "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white shadow-lg shadow-[#25D366]/25 hover:shadow-xl hover:shadow-[#25D366]/30 hover:-translate-y-0.5"
                  }
                `}
              >
                {isProcessing || paystackLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {paystackLoading ? 'Opening Payment...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <i className="fas fa-check-circle text-sm" />
                    {paymentMethod === "paystack" ? 'Pay Now' : 'Place Order'}
                  </>
                )}
              </button>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 mt-4 text-[#94a3b8]">
                <i className="fas fa-shield-alt text-xs" />
                <span className="text-[10px] font-medium">Secure & Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
