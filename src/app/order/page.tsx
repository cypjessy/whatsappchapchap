"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { getFirestore, doc, getDoc, collection, addDoc, updateDoc, serverTimestamp, getDocs, query, where, setDoc, deleteField } from "firebase/firestore";
import { formatCurrency, CURRENCY_SYMBOL } from "@/lib/currency";
import { sendEvolutionWhatsAppMessage } from "@/utils/sendWhatsApp";
import { getOrderStatusMessage } from "@/utils/orderMessages";
import { normalizePhone, createWhatsAppJid, isValidWhatsAppPhone } from "@/utils/phoneUtils";
import { getFirebaseApp } from "@/lib/firebase";
import {
  SearchBar,
  ProductGallery,
  Specifications,
  CustomerDetails,
  DeliveryOptions,
  OrderSummary,
  FooterActions
} from './components';

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
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [navigatingToCheckout, setNavigatingToCheckout] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Debounce ref for search
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
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
        // Note: No isActive filter. Existing stations may not have the field,
        // and we match the behavior of getPickupStations() in db.ts.
        const pickupQuery = query(
          collection(db, "pickupStations"),
          where("tenantId", "==", tenantId)
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
        
        // 🚀 Auto-add "Store Pickup" shipping method if pickup stations exist
        // but no shipping method has "pickup" in its name or ID.
        // This ensures the pickup station dropdowns always appear when stations are configured.
        const hasPickupMethod = shippingMethods.some(m =>
          m.name.toLowerCase().includes('pickup') || m.id.toLowerCase().includes('pickup')
        );
        if (pickupStationsData.length > 0 && !hasPickupMethod) {
          shippingMethods.push({
            id: 'store-pickup',
            name: 'Store Pickup',
            price: 0,
            estimatedDays: 'Same day',
          });
        }
        
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
        
        // Set business settings with payment methods
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
    
    // Send WhatsApp notification about cart addition via server-side API
    if (customerPhone && tenantData?.evolutionServerUrl && tenantData?.evolutionInstanceId) {
      try {
        const businessName = businessSettings?.businessName || 'Our Store';
        const specDetails = Object.entries(selectedSpecs)
          .map(([key, val]) => `${key}: ${val}`)
          .join(', ');
        
        const cartMessage = `✅ *Added to Cart!*\n\n*${product.name}*\n💰 KES ${getBasePrice().toLocaleString()} x ${quantity}\n${specDetails ? `📝 ${specDetails}\n` : ''}\n🛒 You now have ${newCart.length} item(s) in your cart\n\nReply *VIEW CART* to see your cart or continue shopping!`;
        
        // Call server-side API to protect Evolution API key
        await fetch('/api/notify-cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            evolutionServerUrl: tenantData.evolutionServerUrl,
            evolutionInstanceId: tenantData.evolutionInstanceId,
            customerPhone,
            message: cartMessage,
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

    // Save order data to localStorage for checkout page
    const station = pickupStations.find(s => s.id === selectedStation);
    const deliveryAddress = station 
      ? `${station.stationName}, ${station.address}, ${station.town}, ${station.county}`
      : address.trim();

    const checkoutData = {
      productId: product!.id,
      productName: product!.name,
      productImage: product?.image,
      quantity: quantity,
      price: getBasePrice(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim(),
      address: deliveryAddress,
      deliveryMethod,
      deliveryCost,
      orderNotes: orderNotes.trim(),
      tenantId,
      selectedSpecs,
      paymentMethods: businessSettings?.paymentMethods || [],
    };

    try {
      localStorage.setItem('pending_checkout', JSON.stringify(checkoutData));
      setNavigatingToCheckout(true);
      router.push('/order/checkout');
    } catch (err: any) {
      console.error("Error saving checkout data:", err);
      alert("Failed to proceed to checkout. Please try again.");
    }
  };

  const contactSeller = () => {
    // Use business phone from settings instead of deriving from tenantId
    const sellerPhone = businessSettings?.phone;
    
    if (!sellerPhone) {
      console.error('No seller phone number available');
      alert('Unable to contact seller - phone number not configured');
      return;
    }
    
    // Clean phone number (remove non-digit characters)
    const cleanPhone = sellerPhone.replace(/[^0-9]/g, '');
    const message = `Hi, I'm interested in ${product?.name}`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Removed: continueToWhatsApp and copyOrderNumber - these are now handled on checkout/success pages

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

  // ⏳ Full-screen loading overlay when navigating to checkout
  if (navigatingToCheckout) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ textAlign: "center", padding: 32 }}>
          <div style={{ width: 80, height: 80, border: "4px solid #e2e8f0", borderTopColor: "#8b5cf6", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 24px" }}></div>
          <p style={{ color: "#1e293b", fontWeight: 700, fontSize: 18 }}>Preparing checkout...</p>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 8 }}>Please wait a moment</p>
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

  // Removed: ordered state check - order confirmation now happens on /order/success page

  const productEmoji = product?.image ? "" : (product?.category === "electronics" ? "📱" : product?.category === "footwear" ? "👟" : product?.category === "clothing" ? "👕" : product?.category === "beauty" ? "💄" : product?.category === "furniture" ? "🛋️" : product?.category === "food" ? "🍎" : product?.category === "sports" ? "🏋️" : product?.category === "toys" ? "🧸" : "📦");
  const currentStock = getVariantStock();
  const maxQuantity = Math.min(Math.max(currentStock, 1), 100);
  const total = getBasePrice() * quantity + deliveryCost;

  return (
    <div className="order-page-container" style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <div style={{ width: "100%", maxWidth: 960, margin: "0 auto", background: "white", minHeight: "100vh", boxShadow: "0 0 40px rgba(0,0,0,0.06)" }}>

        {/* Search Bar - Keeping inline for now as component needs refactoring */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "white", position: "sticky", top: 0, zIndex: 100 }}>
          <div ref={searchContainerRef} style={{ position: "relative", maxWidth: 600, margin: "0 auto" }}>
            <input
              type="text"
              placeholder="🔍 Search products by name, category, brand..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="md3-input-outlined"
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

        {/* Floating Cart Button - Navigate to checkout with cart data */}
        {cart.length > 0 && (
          <button 
            className="floating-cart-btn"
            onClick={() => {
              // Save cart data to localStorage for checkout page
              const checkoutData = {
                cartItems: cart,
                customerName: customerName.trim(),
                customerPhone: customerPhone.trim(),
                customerEmail: customerEmail.trim(),
                address: address.trim(),
                deliveryMethod,
                deliveryCost,
                orderNotes: orderNotes.trim(),
                tenantId,
                selectedStation,
              };
              
              try {
                localStorage.setItem('pending_checkout', JSON.stringify(checkoutData));
                setNavigatingToCheckout(true);
                router.push('/order/checkout');
              } catch (err: any) {
                console.error("Error saving cart data:", err);
                alert("Failed to proceed to checkout. Please try again.");
              }
            }}
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
        {product && (
          <ProductGallery
            product={product as any}
            selectedImageIndex={selectedImageIndex}
            onImageChange={setSelectedImageIndex}
            getBasePrice={getBasePrice}
            getVariantStock={() => currentStock}
            selectedSpecs={selectedSpecs}
          />
        )}

        {/* Specifications Section */}
        {product?.filters && Object.keys(product.filters).length > 0 && (
          <Specifications
            product={product}
            selectedSpecs={selectedSpecs}
            onToggleSpec={toggleSpec}
            errors={errors}
          />
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
        <OrderSummary
          basePrice={getBasePrice()}
          quantity={quantity}
          deliveryCost={deliveryCost}
        />

        </div>{/* End Left Column */}

        {/* Right Column: Customer + Delivery + Payment */}
        <div className="order-right-col">

        {/* Customer Details */}
        <CustomerDetails
          customerName={customerName}
          setCustomerName={setCustomerName}
          customerPhone={customerPhone}
          setCustomerPhone={setCustomerPhone}
          customerEmail={customerEmail}
          setCustomerEmail={setCustomerEmail}
          selectedCounty={selectedCounty}
          setSelectedCounty={setSelectedCounty}
          selectedTown={selectedTown}
          setSelectedTown={setSelectedTown}
          selectedStation={selectedStation}
          setSelectedStation={setSelectedStation}
          pickupStations={pickupStations}
          errors={errors}
          deliveryMethod={deliveryMethod}
          isPickupMethod={(() => {
            const selectedDeliveryMethod = businessSettings?.shippingMethods?.find(m => m.id === deliveryMethod);
            return selectedDeliveryMethod?.name.toLowerCase().includes('pickup') || deliveryMethod.toLowerCase().includes('pickup');
          })()}
          address={address}
          setAddress={setAddress}
        />

        {/* Delivery Options */}
        <DeliveryOptions
          shippingMethods={businessSettings?.shippingMethods || []}
          deliveryMethod={deliveryMethod}
          setDeliveryMethod={setDeliveryMethod}
          setDeliveryCost={setDeliveryCost}
        />

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
        <FooterActions
          ordering={ordering}
          currentStock={currentStock}
          total={total}
          onContactSeller={contactSeller}
          onAddToCart={addToCart}
          onPlaceOrder={handleOrder}
        />

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
          
          /* ============================================
             MATERIAL DESIGN 3 - MOBILE/CAPACITOR ANDROID
             ============================================ */
          @media (max-width: 768px) {
            /* MD3 Surface Background */
            .order-page-container {
              background: var(--md-sys-color-background, #f8fafc) !important;
            }
            
            /* MD3 Cards */
            .order-left-col,
            .order-right-col {
              background: var(--md-sys-color-surface, white) !important;
              border-radius: 16px !important;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
              margin-bottom: 16px !important;
              border: none !important;
            }
            
            /* MD3 Typography */
            h1, h2, h3 {
              color: var(--md-sys-color-on-surface, #1e293b) !important;
              font-weight: 500 !important;
            }
            
            /* MD3 Input Fields - Already using md3-input-outlined class */
            .md3-input-outlined input,
            .md3-input-outlined select,
            .md3-input-outlined textarea {
              padding: 16px !important;
              border-radius: 4px !important;
              font-size: 16px !important; /* Prevents zoom on iOS */
            }
            
            /* MD3 Buttons */
            button[style*="background.*#25D366"],
            button[style*="background.*linear-gradient.*#25D366"] {
              background: var(--md-sys-color-primary, #25D366) !important;
              color: var(--md-sys-color-on-primary, white) !important;
              border-radius: 20px !important; /* MD3 pill shape */
              text-transform: uppercase !important;
              letter-spacing: 0.5px !important;
              font-weight: 500 !important;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
            }
            
            button[style*="background.*#25D366"]:active,
            button[style*="background.*linear-gradient.*#25D366"]:active {
              transform: scale(0.98) !important;
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
            }
            
            /* MD3 Secondary Buttons */
            button[style*="background.*white"],
            button[style*="border.*#e2e8f0"] {
              background: var(--md-sys-color-surface-variant, white) !important;
              color: var(--md-sys-color-on-surface-variant, #1e293b) !important;
              border: 1px solid var(--md-sys-color-outline, #e2e8f0) !important;
              border-radius: 20px !important;
            }
            
            /* MD3 Chips for Delivery/Payment Selection */
            div[style*="cursor.*pointer"][style*="border"] {
              border-radius: 8px !important;
              transition: all 0.2s ease !important;
            }
            
            /* MD3 Quantity Selector */
            button[style*="borderRadius.*50%"] {
              background: var(--md-sys-color-primary-container, #DCF8C6) !important;
              color: var(--md-sys-color-on-primary-container, #00210B) !important;
            }
            
            /* MD3 Order Summary Card */
            div[style*="background.*linear-gradient.*rgba(37,211,102"] {
              background: var(--md-sys-color-surface-variant, #f8fafc) !important;
              border-radius: 12px !important;
              padding: 20px !important;
            }
            
            /* MD3 Section Headers */
            div[style*="fontWeight.*700"][style*="marginBottom"] {
              color: var(--md-sys-color-on-surface, #1e293b) !important;
              font-weight: 500 !important;
              font-size: 16px !important;
            }
            
            /* MD3 Spacing */
            .order-grid {
              gap: 16px !important;
              padding: 16px !important;
            }
            
            /* MD3 Image Gallery */
            .main-image-container {
              border-radius: 16px !important;
              overflow: hidden !important;
            }
            
            .thumbnail {
              border-radius: 8px !important;
            }
            
            /* MD3 Error States */
            p[style*="color.*#ef4444"] {
              color: var(--md-sys-color-error, #ef4444) !important;
              font-size: 12px !important;
              margin-top: 4px !important;
            }
            
            /* MD3 Helper Text */
            p[style*="fontSize.*12"][style*="color.*#64748b"] {
              color: var(--md-sys-color-on-surface-variant, #64748b) !important;
              font-size: 12px !important;
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