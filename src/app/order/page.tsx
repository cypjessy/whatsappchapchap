"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, updateDoc, serverTimestamp, getDocs, query, where, setDoc, deleteField } from "firebase/firestore";
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
  brand?: string;
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
  

  const [product, setProduct] = useState<Product | null>(null);
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
  const [selectedCounty, setSelectedCounty] = useState("");
  const [selectedTown, setSelectedTown] = useState("");
  const [selectedStation, setSelectedStation] = useState("");
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState(phoneParam);
  const [address, setAddress] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
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
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Debounce ref for search
  const debounceRef = useRef<any>(null);
  
  // Search request ID to prevent race conditions
  const searchRequestIdRef = useRef<number>(0);
  
  // Search container ref for click-outside detection
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  // Cart state

  const [cart, setCart] = useState<Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    specs: Record<string, string>;
    image?: string;
    images?: string[];
    tenantId: string;
  }>>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCartBadge, setShowCartBadge] = useState(false);
  const [showAddedNotification, setShowAddedNotification] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Get all product images
  const allImages = product?.images && product.images.length > 0 
    ? product.images 
    : product?.image ? [product.image] : [];

  const handleSearch = (searchTerm: string) => {
    setSearchQuery(searchTerm);
    
    // Clear previous debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    // Debounce search by 400ms
    debounceRef.current = setTimeout(async () => {
      // Increment request ID to track this specific search
      const currentRequestId = ++searchRequestIdRef.current;
      
      setIsSearching(true);
      
      try {
        // Use AI-enhanced search API
        const response = await fetch('/api/ai-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            searchQuery: searchTerm,
            tenantId: tenantId,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Search failed');
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Race condition check: only update if this is still the latest request
          if (currentRequestId === searchRequestIdRef.current) {
            console.log('[AI Search] Enhanced queries:', data.enhancedQueries);
            setSearchResults(data.results.slice(0, 10));
            setShowSearchResults(true);
          }
        } else {
          throw new Error(data.error || 'Search failed');
        }
      } catch (err) {
        console.error('Search error:', err);
        // Fallback to basic search if AI fails
        try {
          const app = getFirebaseApp();
          if (!app) return;
          
          const db = getFirestore(app);
          
          // Add active status filter
          const productsQuery = query(
            collection(db, "products"),
            where("tenantId", "==", tenantId),
            where("status", "==", "active")
          );
        
        const productsSnap = await getDocs(productsQuery);
        const allProducts = productsSnap.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        
        const filtered = allProducts.filter(p => 
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.subcategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          Object.values(p.filters || {}).some(arr => 
            Array.isArray(arr) && arr.some(val => 
              val.toLowerCase().includes(searchTerm.toLowerCase())
            )
          )
        );
        
        // Race condition check for fallback search
        if (currentRequestId === searchRequestIdRef.current) {
          setSearchResults(filtered.slice(0, 10));
          setShowSearchResults(true);
        }
      } catch (fallbackErr) {
        console.error('Fallback search also failed:', fallbackErr);
      }
    } finally {
      // Only set isSearching to false if this is still the latest request
      if (currentRequestId === searchRequestIdRef.current) {
        setIsSearching(false);
      }
    }
    }, 400); // 400ms debounce
  };
  
  const selectSearchResult = (product: Product) => {
    // Only include phone if it's been entered
    const phoneParam = customerPhone ? `&phone=${encodeURIComponent(customerPhone)}` : '';
    router.push(`/order?tenant=${tenantId}&product=${product.id}${phoneParam}`);
  };
  
  const closeSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Click-outside handler to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

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
          
          // Auto-select single-option filters
          if (loadedProduct.filters) {
            const autoSelectedSpecs: Record<string, string> = {};
            Object.entries(loadedProduct.filters).forEach(([key, options]) => {
              if (Array.isArray(options) && options.length === 1) {
                autoSelectedSpecs[key] = options[0];
              }
            });
            if (Object.keys(autoSelectedSpecs).length > 0) {
              setSelectedSpecs(autoSelectedSpecs);
            }
          }
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
        
        
        const profileData = !profileSnap.empty ? profileSnap.docs[0].data() : null;
        
        // Fetch shipping methods - tenant-filtered query
        const shippingQuery = query(
          collection(db, "shippingMethods"),
          where("tenantId", "==", tenantId)
        );
        const shippingSnap = await getDocs(shippingQuery);
        const shippingMethods = shippingSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Array<{ id: string; name: string; price: number; estimatedDays?: string }>;
        
        // Fetch pickup stations - tenant-filtered query
        const pickupQuery = query(
          collection(db, "pickupStations"),
          where("tenantId", "==", tenantId),
          where("isActive", "==", true)
        );
        const pickupSnap = await getDocs(pickupQuery);
        const pickupStationsData = pickupSnap.docs.map(doc => ({
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
        
        // Set business settings
        
        // Build payment methods array from business profile with new M-Pesa structure
        // Each payment subtype becomes its own card for better UX
        const paymentMethodsArray: Array<{ id: string; name: string; details: string; icon: string; color: string }> = [];
        const pm = profileData?.paymentMethods;
        
        
        if (pm?.mpesa?.enabled) {
          
          // Each M-Pesa subtype becomes its own payment card
          if (pm.mpesa.buyGoods?.tillNumber) {
            paymentMethodsArray.push({
              id: "mpesa-buygoods",
              name: "M-Pesa Buy Goods",
              details: `Till Number: ${pm.mpesa.buyGoods.tillNumber}${pm.mpesa.buyGoods.businessName ? ` (${pm.mpesa.buyGoods.businessName})` : ''}`,
              icon: "fa-store",
              color: "#00A650"
            });
          }
          
          if (pm.mpesa.paybill?.paybillNumber) {
            paymentMethodsArray.push({
              id: "mpesa-paybill",
              name: "M-Pesa Paybill",
              details: `Paybill: ${pm.mpesa.paybill.paybillNumber}${pm.mpesa.paybill.accountNumber ? ` (Acc: ${pm.mpesa.paybill.accountNumber})` : ''}${pm.mpesa.paybill.businessName ? ` (${pm.mpesa.paybill.businessName})` : ''}`,
              icon: "fa-building",
              color: "#059669"
            });
          }
          
          if (pm.mpesa.personal?.phoneNumber) {
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
          paymentMethodsArray.push({
            id: "bank",
            name: "Bank Transfer",
            details: `${pm.bank.bankName || ''}\nAccount: ${pm.bank.accountNumber || ''}${pm.bank.branch ? `\nBranch: ${pm.bank.branch}` : ''}`,
            icon: "fa-university",
            color: "#64748b"
          });
        }
        
        if (pm?.card?.enabled) {
          paymentMethodsArray.push({
            id: "card",
            name: "Card Payment",
            details: pm.card.instructions || "Pay with credit/debit card",
            icon: "fa-credit-card",
            color: "#3b82f6"
          });
        }
        
        if (pm?.cash?.enabled) {
          paymentMethodsArray.push({
            id: "cod",
            name: "Cash on Delivery",
            details: pm.cash.instructions || "Pay when you receive",
            icon: "fa-money-bill-wave",
            color: "#10b981"
          });
        }
        
        
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

  // Cart management functions
  const saveCartToLocalStorage = (newCart: typeof cart) => {
    try {
      localStorage.setItem('whatsapp_cart', JSON.stringify(newCart));
      setShowCartBadge(newCart.length > 0);
    } catch (err) {
      console.error('Error saving cart:', err);
    }
  };

  const saveCartToDatabase = async (newCart: typeof cart) => {
    if (!customerPhone || !tenantId) return;
    
    try {
      const app = getFirebaseApp()!;
      const db = getFirestore(app);
      
      const conversationRef = doc(db, "tenants", tenantId, "conversations", customerPhone);
      
      await setDoc(conversationRef, {
        cart: {
          items: newCart,
          updatedAt: new Date().toISOString(),
        },
      }, { merge: true });
      
      console.log('✅ Cart saved to database');
    } catch (err) {
      console.error('Failed to save cart to database:', err);
    }
  };

  const addToCart = async () => {
    if (!product) return;
    
    // Validate that specs are selected for filters with multiple options
    if (product.filters && Object.keys(product.filters).length > 0) {
      const requiredSpecs = Object.keys(product.filters).filter(key => {
        const options = product.filters?.[key];
        return options && options.length > 1;
      });
      const missingSpecs = requiredSpecs.filter(key => !selectedSpecs[key]);
      
      if (missingSpecs.length > 0) {
        setErrors(prev => ({ ...prev, specs: true }));
        const section = document.querySelector('.specs-section') as HTMLElement;
        if (section) section.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    
    const cartItem = {
      productId: product.id,
      name: product.name,
      price: getBasePrice(),
      quantity: quantity,
      specs: { ...selectedSpecs },
      image: product.image,
      images: product.images,
      tenantId: tenantId!,
    };
    
    const newCart = [...cart, cartItem];
    setCart(newCart);
    saveCartToLocalStorage(newCart);
    saveCartToDatabase(newCart); // Save to Firestore for WhatsApp access
    
    // Send WhatsApp notification about cart addition
    if (customerPhone && tenantData?.evolutionServerUrl && tenantData?.evolutionApiKey && tenantData?.evolutionInstanceId) {
      try {
        const businessName = businessSettings?.businessName || 'Our Store';
        const specDetails = Object.entries(selectedSpecs)
          .map(([key, val]) => `${key}: ${val}`)
          .join(', ');
        
        const cartMessage = `✅ *Added to Cart!*\n\n*${product.name}*\n💰 KES ${getBasePrice().toLocaleString()} x ${quantity}\n${specDetails ? `📝 ${specDetails}\n` : ''}\n🛒 You now have ${newCart.length} item(s) in your cart\n\nReply *VIEW CART* to see your cart or continue shopping!`;
        
        await fetch(`${tenantData.evolutionServerUrl}/message/sendText/${tenantData.evolutionInstanceId}`, {
          method: 'POST',
          headers: {
            apikey: tenantData.evolutionApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            number: customerPhone,
            text: cartMessage,
          }),
        });
        
        console.log('✅ Cart notification sent to WhatsApp');
      } catch (err) {
        console.error('Failed to send cart notification:', err);
      }
    }
    
    // Show success notification instead of redirecting
    setShowAddedNotification(true);
    setTimeout(() => setShowAddedNotification(false), 3000);
  };

  const removeFromCart = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    saveCartToLocalStorage(newCart);
    saveCartToDatabase(newCart);
  };

  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    const newCart = [...cart];
    newCart[index].quantity = newQuantity;
    setCart(newCart);
    saveCartToLocalStorage(newCart);
    saveCartToDatabase(newCart);
  };

  const clearCart = async () => {
    setCart([]);
    localStorage.removeItem('whatsapp_cart');
    setShowCartBadge(false);
    
    // Also clear from database
    if (customerPhone && tenantId) {
      try {
        const app = getFirebaseApp()!;
        const db = getFirestore(app);
        const conversationRef = doc(db, "tenants", tenantId, "conversations", customerPhone);
        
        await setDoc(conversationRef, {
          cart: deleteField(), // Properly remove field instead of setting to null
        }, { merge: true });
        
        console.log('✅ Cart cleared from database');
      } catch (err) {
        console.error('Failed to clear cart from database:', err);
      }
    }
  };

  // Load cart from database first, fallback to localStorage
  useEffect(() => {
    const loadCart = async () => {
      let loadedCart: typeof cart = [];
      
      // Try to load from database first (if phone number available)
      if (customerPhone && tenantId) {
        try {
          const app = getFirebaseApp()!;
          const db = getFirestore(app);
          const conversationRef = doc(db, "tenants", tenantId, "conversations", customerPhone);
          const convoSnap = await getDoc(conversationRef);
          
          if (convoSnap.exists()) {
            const cartData = convoSnap.data()?.cart;
            if (cartData?.items && Array.isArray(cartData.items)) {
              loadedCart = cartData.items;
              console.log('✅ Cart loaded from database:', loadedCart.length, 'items');
            }
          }
        } catch (err) {
          console.error('Failed to load cart from database:', err);
        }
      }
      
      // Fallback to localStorage if no database cart
      if (loadedCart.length === 0) {
        try {
          const savedCart = localStorage.getItem('whatsapp_cart');
          if (savedCart) {
            loadedCart = JSON.parse(savedCart);
            console.log('✅ Cart loaded from localStorage:', loadedCart.length, 'items');
          }
        } catch (err) {
          console.error('Error loading cart from localStorage:', err);
        }
      }
      
      // Set cart state
      if (loadedCart.length > 0) {
        setCart(loadedCart);
        setShowCartBadge(true);
        // Sync to localStorage for consistency
        localStorage.setItem('whatsapp_cart', JSON.stringify(loadedCart));
      }
    };
    
    // Only load cart once on mount, not on every phone keystroke
    loadCart();
  }, [tenantId]); // Remove customerPhone dependency

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
    
    // Check if selected delivery method is pickup (by name, not ID)
    const selectedDeliveryMethod = businessSettings?.shippingMethods?.find(m => m.id === deliveryMethod);
    const isPickupMethod = selectedDeliveryMethod?.name.toLowerCase().includes('pickup') || 
                          deliveryMethod.toLowerCase().includes('pickup');
    
    // Only require pickup station if delivery method is pickup and stations are configured
    if (isPickupMethod && pickupStations.length > 0 && !selectedStation) {
      newErrors.address = true;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOrder = async () => {
    if (!product && cart.length === 0) return;
      
    if (!validateForm()) {
      // Only scroll to specs section if it exists (when product has filters)
      if (product?.filters && Object.keys(product.filters).length > 0) {
        const section = document.querySelector('.specs-section') as HTMLElement;
        if (section) section.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
      
    setOrdering(true);
      
    try {
      const app = getFirebaseApp()!;
      const db = getFirestore(app);
        
      const orderNum = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
        
      // Single product order (cart functionality moved to /order/checkout page)
      const orderProducts = [{
        productId: product!.id,
        name: product!.name,
        price: getBasePrice(),
        quantity: quantity,
        specs: selectedSpecs,
      }];
        
      const subtotal = orderProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
      const total = subtotal + deliveryCost;
        
      const now = new Date();
        
      // Normalize phone and create WhatsApp JID
      const normalizedPhone = normalizePhone(customerPhone);
      const whatsappJid = phoneParam 
        ? `${phoneParam.replace(/[^0-9]/g, '')}@s.whatsapp.net` 
        : createWhatsAppJid(normalizedPhone);
        
      const productNames = orderProducts.map(p => `${p.name} x${p.quantity}`).join(', ');
        
      const docRef = await addDoc(collection(db, "orders"), {
        orderNumber: orderNum,
        tenantId,
        productId: product!.id,
        productName: productNames,
        productImage: product?.image,
        products: orderProducts,
        basePrice: getBasePrice(),
        selectedSpecs: selectedSpecs,
        selectedVariant: product?.variants?.find(v => 
          Object.entries(selectedSpecs).every(([key, value]) => v.specs[key] === value)
        ) || null,
        quantity: quantity,
        customerPhone: normalizedPhone,
        whatsappJid,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || null,
        deliveryAddress: (() => {
          const station = pickupStations.find(s => s.id === selectedStation);
          if (station) {
            return `${station.stationName}, ${station.address}, ${station.town}, ${station.county}`;
          }
          return address.trim();
        })(),
        pickupStationId: selectedStation || null,
        pickupStationDetails: (() => {
          const station = pickupStations.find(s => s.id === selectedStation);
          return station ? {
            id: station.id,
            name: station.stationName,
            address: station.address,
            town: station.town,
            county: station.county,
            contactPhone: station.contactPhone,
            operatingHours: station.operatingHours
          } : null;
        })(),
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
      });
        
      await updateDoc(doc(db, "orders", docRef.id), { id: docRef.id });
  
      // Send WhatsApp notification - Order Received
      const customerPhoneClean = normalizePhone(customerPhone);
        
      // Validate phone number before sending
      if (!isValidWhatsAppPhone(customerPhoneClean)) {
        console.error('❌ Invalid phone number, skipping WhatsApp notification:', customerPhoneClean);
      } else {
        // Use pickup station address if selected, otherwise show "Not specified"
        const station = pickupStations.find(s => s.id === selectedStation);
        const addressForMessage = station 
          ? `${station.stationName}, ${station.town}, ${station.county}`
          : "Not specified";
        
        const orderConfirmationMessage = getOrderStatusMessage(
          'pending',
          customerName.trim(),
          orderNum,
          productNames,
          addressForMessage
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
      }
        
      // Clear cart after successful order (always, not just from cart view)
      await clearCart();
      console.log('✅ Cart cleared after order placement');
        
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
    const currentTotal = getBasePrice() * quantity + deliveryCost;
    
    // Use pickup station address if selected, otherwise show "Not specified"
    const station = pickupStations.find(s => s.id === selectedStation);
    const addressText = station 
      ? `${station.stationName}, ${station.town}, ${station.county}`
      : (address || "Not specified");
    
    const message = `Hi, I just placed order ${orderNumber}. Here's my details:\n\nName: ${customerName}\nPhone: ${customerPhone}\nAddress: ${addressText}\n\nOrder Total: ${CURRENCY_SYMBOL}${currentTotal.toLocaleString()}\nPayment: ${paymentMethod}`;
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

        {/* Search Bar */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "white", position: "sticky", top: 0, zIndex: 100 }}>
          <div ref={searchContainerRef} style={{ position: "relative", maxWidth: 600, margin: "0 auto" }}>
            <input
              type="text"
              placeholder="🔍 Search products by name, category, brand..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 45px 12px 16px",
                border: "2px solid #e2e8f0",
                borderRadius: 12,
                fontSize: 15,
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
              onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
            />
            {searchQuery && (
              <button
                onClick={closeSearch}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  fontSize: 18,
                  color: "#64748b",
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
              >
                ×
              </button>
            )}
            
            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: 8,
                background: "white",
                borderRadius: 12,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                border: "2px solid #e2e8f0",
                maxHeight: 400,
                overflowY: "auto",
                zIndex: 101,
              }}>
                {isSearching ? (
                  <div style={{ padding: 20, textAlign: "center", color: "#64748b" }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: 20 }}></i>
                    <div style={{ marginTop: 8 }}>Searching...</div>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div style={{ padding: 20, textAlign: "center", color: "#64748b" }}>
                    <i className="fas fa-search" style={{ fontSize: 24, marginBottom: 8 }}></i>
                    <div>No products found for "{searchQuery}"</div>
                  </div>
                ) : (
                  <>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", fontSize: 13, color: "#64748b", fontWeight: 600 }}>
                      Found {searchResults.length} product{searchResults.length > 1 ? 's' : ''}
                    </div>
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        onClick={() => selectSearchResult(result)}
                        style={{
                          padding: "12px 16px",
                          borderBottom: "1px solid #f1f5f9",
                          cursor: "pointer",
                          transition: "background 0.2s",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                      >
                        {(() => {
                          const thumb = result.image || result.images?.[0];
                          if (thumb) {
                            return (
                              <img
                                src={thumb}
                                alt={result.name}
                                style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8 }}
                              />
                            );
                          }
                          return (
                            <div style={{ width: 48, height: 48, background: "#f1f5f9", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                              📦
                            </div>
                          );
                        })()}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{result.name}</div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>
                            {result.category && <span>{result.category}</span>}
                            {result.brand && <span> • {result.brand}</span>}
                            {result.price && <span> • KES {result.price.toLocaleString()}</span>}
                          </div>
                        </div>
                        <i className="fas fa-chevron-right" style={{ color: "#94a3b8" }}></i>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Added to Cart Notification */}
        {showAddedNotification && (
          <div style={{ 
            position: "fixed", 
            top: 24, 
            left: "50%", 
            transform: "translateX(-50%)", 
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", 
            color: "white", 
            padding: "16px 24px", 
            borderRadius: 12, 
            boxShadow: "0 8px 24px rgba(16,185,129,0.4)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            zIndex: 1001,
            animation: "slideUp 0.3s ease-out"
          }}>
            <i className="fas fa-check-circle" style={{ fontSize: 24 }}></i>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Added to Cart!</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>Continue shopping or view your cart</div>
            </div>
          </div>
        )}

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

        {/* Floating Cart Button */}
        {cart.length > 0 && !showCart && (
          <button 
            className="floating-cart-btn"
            onClick={() => setShowCart(true)}
            style={{ position: "fixed", bottom: 24, right: 24, width: 64, height: 64, background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: "0 8px 24px rgba(59,130,246,0.4)", border: "none", cursor: "pointer", zIndex: 1000 }}
          >
            <i className="fas fa-shopping-cart"></i>
            <span style={{ position: "absolute", top: -4, right: -4, width: 24, height: 24, background: "#ef4444", borderRadius: "50%", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white" }}>
              {cart.length}
            </span>
          </button>
        )}

        {/* Header */}
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
          
          {/* Product Details / Filters Display */}
          {product?.filters && Object.keys(product.filters).length > 0 && (
            <div style={{ marginTop: 20, padding: 20, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                <i className="fas fa-info-circle" style={{ color: "#25D366" }}></i>
                Product Details
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                {Object.entries(product.filters).map(([key, options]) => {
                  if (!Array.isArray(options) || options.length === 0) return null;
                  
                  const isColorKey = key.toLowerCase().includes('color');
                  
                  return (
                    <div key={key}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 8, textTransform: "capitalize" }}>
                        {key.replace(/_/g, " ")}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {options.map((option, idx) => {
                          if (isColorKey) {
                            return (
                              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "white", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                                <div style={{ width: 16, height: 16, borderRadius: "50%", background: option.toLowerCase(), border: "2px solid #e2e8f0" }}></div>
                                <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", textTransform: "capitalize" }}>{option}</span>
                              </div>
                            );
                          }
                          
                          return (
                            <span key={idx} style={{ padding: "6px 12px", background: "white", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, fontWeight: 600, color: "#1e293b", textTransform: "capitalize" }}>
                              {option}
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
        </div>

        {/* Specifications Section */}
        {product?.filters && Object.keys(product.filters).length > 0 && (
          <div className="specs-section" style={{ padding: 24, borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Select Options</div>
              <span style={{ fontSize: 14, color: "#64748b" }}>Choose your preferences</span>
            </div>

            {Object.entries(product.filters).map(([key, options]) => {
              if (!Array.isArray(options) || options.length === 0) return null;
              
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
            <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 8, color: "#1e293b" }}>Select Pickup Location <span style={{ color: "#ef4444" }}>*</span></label>
            
            {/* County Selector */}
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
            
            {/* Town Selector (only show if county selected) */}
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
            
            {/* Station Selector (only show if town selected) */}
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
            
            {/* Show station details when selected */}
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
                  {station.description && (
                    <p style={{ fontSize: 13, color: "#166534", margin: "4px 0", fontStyle: "italic" }}>
                      {station.description}
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
                <i className={`fas ${
                  option.name.toLowerCase().includes('pickup') ? "fa-store" :
                  option.name.toLowerCase().includes('express') ? "fa-shipping-fast" : "fa-truck"
                }`}></i>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{option.name}</div>
                <div style={{ fontSize: 14, color: "#64748b" }}>
                  {option.estimatedDays || (
                    option.name.toLowerCase().includes('pickup') ? "Available today after 2PM" :
                    option.name.toLowerCase().includes('express') ? "1-2 business days" : "3-5 business days"
                  )}
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
                {(() => {
                  const isMpesa = paymentMethod.startsWith("mpesa");
                  const isBank = paymentMethod === "bank";
                  return isMpesa ? "M-Pesa Payment Instructions" : isBank ? "Bank Transfer Details" : "Payment Instructions";
                })()}
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
                placeholder="Add a message about your payment (optional)"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
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
            Ask Seller
          </button>
          <button 
            onClick={addToCart}
            style={{ 
              padding: 18, 
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              color: "white", 
              border: "none", 
              borderRadius: 12, 
              fontSize: 16, 
              fontWeight: 700, 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
              flex: 1
            }}
          >
            <i className="fas fa-cart-plus"></i>
            Add to Cart
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
          
          /* Mobile responsive cart button */
          @media (max-width: 768px) {
            .floating-cart-btn {
              top: 16px !important;
              bottom: auto !important;
              right: 16px !important;
              width: 56px !important;
              height: 56px !important;
              font-size: 20px !important;
            }
            .floating-cart-btn span {
              width: 20px !important;
              height: 20px !important;
              font-size: 11px !important;
            }
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