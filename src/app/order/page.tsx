"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, updateDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { formatCurrency, CURRENCY_SYMBOL } from "@/lib/currency";
import { sendEvolutionWhatsAppMessage } from "@/utils/sendWhatsApp";
import { getOrderStatusMessage } from "@/utils/orderMessages";

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
  
  const [activeTab, setActiveTab] = useState<"order">("order");
  const [product, setProduct] = useState<Product | null>(null);
  const [tenantData, setTenantData] = useState<{evolutionServerUrl?: string; evolutionApiKey?: string; evolutionInstanceId?: string} | null>(null);
  const [businessSettings, setBusinessSettings] = useState<{
    shippingMethods?: Array<{ id: string; name: string; price: number; estimatedDays?: string }>;
    paymentMethods?: Array<{ id: string; name: string; details: string; icon: string; color: string }>;
    businessName?: string;
    phone?: string;
    address?: string;
  } | null>(null);
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState(phoneParam);
  const [address, setAddress] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Get all product images
  const allImages = product?.images && product.images.length > 0 
    ? product.images 
    : product?.image ? [product.image] : [];
  

  useEffect(() => {
    const fetchData = async () => {
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
        
        // Fetch product
        const productRef = doc(db, "products", productId);
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
          const data = productSnap.data() as Product;
          const loadedProduct = { ...data, id: productSnap.id } as Product;
          setProduct(loadedProduct);
        } else {
          setError("Product not found");
          setLoading(false);
          return;
        }
        
        // Fetch tenant data for Evolution credentials
        const tenantRef = doc(db, "tenants", tenantId);
        const tenantSnap = await getDoc(tenantRef);
        if (tenantSnap.exists()) {
          const tenantData = tenantSnap.data();
          setTenantData({
            evolutionServerUrl: tenantData.evolutionServerUrl,
            evolutionApiKey: tenantData.evolutionApiKey,
            evolutionInstanceId: tenantData.evolutionInstanceId
          });
        }
        
        // Fetch business profile for payment methods and business info
        // Query by tenantId field since document ID is auto-generated
        const profileQuery = query(collection(db, "businessProfiles"), where("tenantId", "==", tenantId));
        const profileSnap = await getDocs(profileQuery);
        
        console.log('📊 Order Page - Tenant ID:', tenantId);
        console.log('📊 Order Page - Business Profile query results:', profileSnap.size);
        
        const profileData = !profileSnap.empty ? profileSnap.docs[0].data() : null;
        
        if (profileData) {
          console.log('📊 Order Page - Profile Data:', profileData);
          console.log('📊 Order Page - Payment Methods:', profileData.paymentMethods);
        }
        
        // Fetch shipping methods
        const shippingQuery = collection(db, "shippingMethods");
        const shippingSnap = await getDocs(shippingQuery);
        console.log('📊 Order Page - Shipping methods query results:', shippingSnap.size);
        const shippingMethods = shippingSnap.docs
          .filter(doc => doc.data().tenantId === tenantId)
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Array<{ id: string; name: string; price: number; estimatedDays?: string }>;
        
        console.log('📊 Order Page - Shipping methods for tenant:', shippingMethods);
        
        // Set business settings
        
        // Build payment methods array from business profile with new M-Pesa structure
        // Each payment subtype becomes its own card for better UX
        const paymentMethodsArray: Array<{ id: string; name: string; details: string; icon: string; color: string }> = [];
        const pm = profileData?.paymentMethods;
        
        console.log('📊 Order Page - Payment Methods Object (pm):', pm);
        console.log('📊 Order Page - M-Pesa full structure:', JSON.stringify(pm?.mpesa, null, 2));
        console.log(' Order Page - M-Pesa enabled:', pm?.mpesa?.enabled);
        console.log(' Order Page - Buy Goods:', pm?.mpesa?.buyGoods);
        console.log('📊 Order Page - Buy Goods enabled:', pm?.mpesa?.buyGoods?.enabled);
        console.log('📊 Order Page - Buy Goods tillNumber:', pm?.mpesa?.buyGoods?.tillNumber);
        console.log('📊 Order Page - Paybill:', pm?.mpesa?.paybill);
        console.log('📊 Order Page - Personal:', pm?.mpesa?.personal);
        
        if (pm?.mpesa?.enabled) {
          console.log('📊 Order Page - M-Pesa enabled');
          
          // Each M-Pesa subtype becomes its own payment card
          if (pm.mpesa.buyGoods?.tillNumber) {
            console.log('📊 Order Page - Buy Goods has tillNumber:', pm.mpesa.buyGoods.tillNumber);
            paymentMethodsArray.push({
              id: "mpesa-buygoods",
              name: "M-Pesa Buy Goods",
              details: `Till Number: ${pm.mpesa.buyGoods.tillNumber}${pm.mpesa.buyGoods.businessName ? ` (${pm.mpesa.buyGoods.businessName})` : ''}`,
              icon: "fa-store",
              color: "#00A650"
            });
          }
          
          if (pm.mpesa.paybill?.paybillNumber) {
            console.log('📊 Order Page - Paybill has paybillNumber:', pm.mpesa.paybill.paybillNumber);
            paymentMethodsArray.push({
              id: "mpesa-paybill",
              name: "M-Pesa Paybill",
              details: `Paybill: ${pm.mpesa.paybill.paybillNumber}${pm.mpesa.paybill.accountNumber ? ` (Acc: ${pm.mpesa.paybill.accountNumber})` : ''}}${pm.mpesa.paybill.businessName ? ` (${pm.mpesa.paybill.businessName})` : ''}`,
              icon: "fa-building",
              color: "#059669"
            });
          }
          
          if (pm.mpesa.personal?.phoneNumber) {
            console.log(' Order Page - Personal has phoneNumber:', pm.mpesa.personal.phoneNumber);
            paymentMethodsArray.push({
              id: "mpesa-personal",
              name: "M-Pesa Send Money",
              details: `Phone: ${pm.mpesa.personal.phoneNumber}${pm.mpesa.personal.accountName ? ` (${pm.mpesa.personal.accountName})` : ''}`,
              icon: "fa-user",
              color: "#10b981"
            });
          }
        }
        
        if (pm?.bank?.enabled) {
          console.log(' Order Page - Bank enabled:', pm.bank);
          paymentMethodsArray.push({
            id: "bank",
            name: "Bank Transfer",
            details: `${pm.bank.bankName || ''}\nAccount: ${pm.bank.accountNumber || ''}${pm.bank.branch ? `\nBranch: ${pm.bank.branch}` : ''}`,
            icon: "fa-university",
            color: "#64748b"
          });
        }
        
        if (pm?.card?.enabled) {
          console.log('📊 Order Page - Card enabled:', pm.card);
          paymentMethodsArray.push({
            id: "card",
            name: "Card Payment",
            details: pm.card.instructions || "Pay with credit/debit card",
            icon: "fa-credit-card",
            color: "#3b82f6"
          });
        }
        
        if (pm?.cash?.enabled) {
          console.log('📊 Order Page - Cash/COD enabled:', pm.cash);
          paymentMethodsArray.push({
            id: "cod",
            name: "Cash on Delivery",
            details: pm.cash.instructions || "Pay when you receive",
            icon: "fa-money-bill-wave",
            color: "#10b981"
          });
        }
        
        console.log('📊 Order Page - Final Payment Methods Array:', paymentMethodsArray);
        console.log(' Order Page - Setting businessSettings with paymentMethods:', paymentMethodsArray);
        
        setBusinessSettings({
          shippingMethods: shippingMethods.length > 0 ? shippingMethods : undefined,
          paymentMethods: paymentMethodsArray,
          businessName: profileData?.businessName,
          phone: profileData?.phone,
          address: profileData?.address,
        });
        
        // Set default delivery method (first available)
        if (shippingMethods.length > 0) {
          setDeliveryMethod(shippingMethods[0].id);
          setDeliveryCost(shippingMethods[0].price);
        }
        
        // Set default payment method (first enabled)
        if (paymentMethodsArray.length > 0) {
          setPaymentMethod(paymentMethodsArray[0].id);
        }
        
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
    
    if (requiredFilters.length > 0) {
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
      
      const now = new Date();
      
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
        customerPhone: customerPhone.replace(/^\+/, ''),
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || null,
        deliveryAddress: address.trim(),
        deliveryMethod,
        deliveryCost,
        paymentMethod,
        paymentDetails: paymentDetails.trim() || null,
        orderNotes: orderNotes.trim() || "",
        subtotal,
        total,
        status: "pending",
        statusHistory: {
          pending: now.toISOString()
        },
        lastNotifiedStatus: '',
        evolutionInstanceId: tenantId,
        notificationSent: false,
        createdAt: now,
        updatedAt: now
      }).then((docRef) => {
        updateDoc(doc(db, "orders", docRef.id), { id: docRef.id });
      });

      // Send WhatsApp notification - Order Received
      const customerPhoneClean = customerPhone.replace(/^\+/, '').replace(/[^0-9]/g, '');
      const orderConfirmationMessage = getOrderStatusMessage(
        'pending',
        customerName.trim(),
        orderNum,
        product.name,
        address.trim()
      );
      
      console.log('📲 Sending order received WhatsApp to:', customerPhoneClean);
      sendEvolutionWhatsAppMessage(
        customerPhoneClean,
        orderConfirmationMessage,
        tenantId
      ).then(() => {
        console.log('✅ Order received WhatsApp sent successfully');
      }).catch(err => {
        console.error('❌ Failed to send order received WhatsApp:', err);
      });

      await fetch('https://n8n-lfk9ps3h72dezxj6jwy4905s.173.249.50.98.sslip.io/webhook/order-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderNum,
          orderNumber: orderNum,
          customerPhone: customerPhone.replace(/^\+/, ''),
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
          evolutionInstanceId: tenantId
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

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber);
    const recentOrders = JSON.parse(localStorage.getItem('recentOrders') || '[]');
    const newOrder = { orderNumber, phone: customerPhone, productName: product?.name, date: new Date().toISOString() };
    const updatedOrders = [newOrder, ...recentOrders.filter((o: any) => o.orderNumber !== orderNumber)].slice(0, 5);
    localStorage.setItem('recentOrders', JSON.stringify(updatedOrders));
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 60, height: 60, border: "4px solid #e2e8f0", borderTopColor: "#25D366", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }}></div>
          <p style={{ color: "#1e293b", fontWeight: 600 }}>Loading product...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ textAlign: "center", maxWidth: 400, width: "100%", padding: 32 }}>
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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ textAlign: "center", maxWidth: 440, width: "100%", padding: 32 }}>
          <div style={{ width: 80, height: 80, background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 36, color: "white", boxShadow: "0 10px 30px rgba(16,185,129,0.3)" }}>
            <i className="fas fa-check"></i>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: "#1e293b" }}>Order Confirmed!</h2>
          <p style={{ color: "#64748b", marginBottom: 20 }}>Thank you for your purchase. We've sent the confirmation to your WhatsApp.</p>
          
          <div style={{ background: "white", borderRadius: 12, padding: 16, marginBottom: 20, border: "2px dashed #25D366" }}>
            <div style={{ fontSize: 14, color: "#64748b", marginBottom: 4 }}>Order Number</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#25D366" }}>#{orderNumber}</div>
              <button 
                onClick={copyOrderNumber}
                style={{ padding: "8px 12px", background: "#25D366", color: "white", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
              >
                <i className="fas fa-copy"></i>
                Copy
              </button>
            </div>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>Save your order number for reference</p>
          </div>

          <button 
            onClick={continueToWhatsApp}
            style={{ width: "100%", padding: 16, background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 12px rgba(37,211,102,0.3)" }}
          >
            <i className="fab fa-whatsapp"></i>
            Continue to WhatsApp
          </button>
        </div>
      </div>
    );
  }

  const productEmoji = product?.image ? "" : (product?.category === "electronics" ? "📱" : product?.category === "footwear" ? "👟" : product?.category === "clothing" ? "👕" : product?.category === "beauty" ? "💄" : product?.category === "furniture" ? "🛋️" : product?.category === "food" ? "🍎" : product?.category === "sports" ? "🏋️" : product?.category === "toys" ? "🧸" : "📦");
  const currentStock = getVariantStock();
  const maxQuantity = Math.min(Math.max(currentStock, 1), 100);
  const total = getBasePrice() * quantity + deliveryCost;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <div style={{ width: "100%", maxWidth: 960, margin: "0 auto", background: "white", minHeight: "100vh", boxShadow: "0 0 40px rgba(0,0,0,0.06)" }}>
        <>
            {/* Header */}
            <div style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)", color: "white", padding: "28px 32px", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 50, height: 50, background: "white", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
              {productEmoji || "📦"}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>My Store</div>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Complete Your Order</h1>
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

        {/* Desktop Two-Column Layout */}
        <div className="order-grid">
        {/* Left Column: Product + Options */}
        <div className="order-left-col">

        {/* Product Section */}
        <div style={{ padding: 24, borderBottom: "1px solid #e2e8f0" }}>
          {/* Image Gallery */}
          {allImages.length > 0 ? (
            <div className="product-gallery">
              {/* Main Image */}
              <div className="main-image-container">
                <img 
                  src={allImages[selectedImageIndex]} 
                  alt={product?.name} 
                  className="main-image"
                />
                {allImages.length > 1 && (
                  <>
                    <button 
                      className="gallery-nav prev"
                      onClick={() => setSelectedImageIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1)}
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    <button 
                      className="gallery-nav next"
                      onClick={() => setSelectedImageIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1)}
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                    <div className="image-counter">
                      {selectedImageIndex + 1} / {allImages.length}
                    </div>
                  </>
                )}
              </div>
              
              {/* Thumbnail Strip */}
              {allImages.length > 1 && (
                <div className="thumbnail-strip">
                  {allImages.map((img, index) => (
                    <button
                      key={index}
                      className={`thumbnail ${selectedImageIndex === index ? 'active' : ''}`}
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      <img src={img} alt={`${product?.name} - ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ width: "100%", height: 300, background: "linear-gradient(135deg, #DCF8C6 0%, #e0e7ff 100%)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80, marginBottom: 16 }}>
              {productEmoji || "📦"}
            </div>
          )}
          
          {/* Product Info */}
          <div style={{ marginTop: 16 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "#1e293b" }}>{product?.name}</h2>
            {product?.description && (
              <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.6, marginBottom: 16 }}>{product.description}</p>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <span style={{ fontSize: 28, fontWeight: 800, color: "#25D366" }}>{CURRENCY_SYMBOL}{getBasePrice().toLocaleString()}</span>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: currentStock > 5 ? "#10b981" : currentStock > 0 ? "#f59e0b" : "#ef4444" }}>
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
                onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                disabled={quantity >= maxQuantity}
                style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: quantity >= maxQuantity ? "#f1f5f9" : "white", color: quantity >= maxQuantity ? "#cbd5e1" : "#1e293b", fontSize: 16, cursor: quantity >= maxQuantity ? "not-allowed" : "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>
            <span style={{ fontSize: 14, color: "#64748b" }}>Max: {maxQuantity}</span>
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

        </div>{/* End Left Column */}

        {/* Right Column: Customer + Delivery + Payment */}
        <div className="order-right-col">

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

        {/* Payment Methods */}
        <div style={{ padding: 24, borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#1e293b" }}>Payment Method</div>
          
          {/* Show loading state if payment methods haven't loaded yet */}
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
            // Render payment methods from Firestore
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

          {/* Payment Details & Message */}
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
        <div style={{ display: "flex", justifyContent: "center", gap: 24, padding: 16, background: "#f8fafc", fontSize: 14, color: "#64748b", flexWrap: "wrap" }}>
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

        </div>{/* End Right Column */}
        </div>{/* End Desktop Grid */}

        {/* Footer Actions */}
        <div className="order-footer" style={{ padding: 24, background: "white", borderTop: "1px solid #e2e8f0", position: "sticky", bottom: 0, boxShadow: "0 -4px 20px rgba(0,0,0,0.1)" }}>
          <button 
            onClick={contactSeller}
            style={{ padding: 18, background: "white", color: "#1e293b", border: "2px solid #e2e8f0", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flex: 1 }}
          >
            <i className="fab fa-whatsapp"></i>
            Ask Seller a Question
          </button>
          <button 
            onClick={handleOrder}
            disabled={ordering || currentStock === 0}
            style={{ 
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
              boxShadow: "0 4px 12px rgba(37,211,102,0.3)",
              flex: 2
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

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          
          /* Product Gallery Styles */
          .product-gallery {
            width: 100%;
          }
          
          .main-image-container {
            position: relative;
            width: 100%;
            aspect-ratio: 4/3;
            background: #f8fafc;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
          }
          
          .main-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .gallery-nav {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.9);
            border: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            color: #1e293b;
            transition: all 0.2s;
          }
          
          .gallery-nav:hover {
            background: white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          }
          
          .gallery-nav.prev {
            left: 12px;
          }
          
          .gallery-nav.next {
            right: 12px;
          }
          
          .image-counter {
            position: absolute;
            bottom: 12px;
            right: 12px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
          }
          
          .thumbnail-strip {
            display: flex;
            gap: 8px;
            margin-top: 12px;
            overflow-x: auto;
            padding: 4px;
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 transparent;
          }
          
          .thumbnail-strip::-webkit-scrollbar {
            height: 6px;
          }
          
          .thumbnail-strip::-webkit-scrollbar-track {
            background: transparent;
          }
          
          .thumbnail-strip::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;
          }
          
          .thumbnail {
            flex-shrink: 0;
            width: 80px;
            height: 80px;
            border-radius: 8px;
            border: 2px solid #e2e8f0;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.2s;
            background: white;
          }
          
          .thumbnail:hover {
            border-color: #94a3b8;
          }
          
          .thumbnail.active {
            border-color: #25D366;
            box-shadow: 0 0 0 3px rgba(37,211,102,0.2);
          }
          
          .thumbnail img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          /* Responsive Grid */
          .order-grid {
            display: grid;
            grid-template-columns: 1fr;
          }
          .order-footer {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          
          /* Tablet (768px - 1024px) */
          @media (min-width: 768px) {
            .order-grid {
              grid-template-columns: 1fr 1fr;
            }
            .order-left-col {
              border-right: 1px solid #e2e8f0;
            }
            .order-footer {
              flex-direction: row;
              gap: 16px;
            }
            .main-image-container {
              aspect-ratio: 1/1;
            }
            .thumbnail {
              width: 70px;
              height: 70px;
            }
          }
          
          /* Desktop (1024px+) */
          @media (min-width: 1024px) {
            .order-grid {
              grid-template-columns: 1.2fr 0.8fr;
            }
            .main-image-container {
              aspect-ratio: 4/3;
            }
            .thumbnail {
              width: 90px;
              height: 90px;
            }
          }
          
          input, textarea, select {
            box-sizing: border-box;
          }
        `}</style>
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ width: 60, height: 60, border: "4px solid #e2e8f0", borderTopColor: "#25D366", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      </div>
    }>
      <OrderPageContent />
    </Suspense>
  );
}